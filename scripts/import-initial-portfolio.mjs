import {readFile} from 'node:fs/promises'
import {createImportClient, normalize, slugify, signOut} from './import-utils.mjs'

const seed = JSON.parse(await readFile(new URL('../seed/portfolio-links.json', import.meta.url), 'utf8'))
const supabase = await createImportClient()
const summary = {projects: 0, brandsCreated: 0, workTypesCreated: 0, links: 0}
const brandAliases = new Map([['okx', 'okx tr'], ['okx tr', 'okx tr']])
const brandKey = (value) => brandAliases.get(normalize(value)) || normalize(value)

async function getOrCreateBrand(name) {
  const {data: rows, error} = await supabase.from('brands').select('id,name')
  if (error) throw new Error(error.message)
  const matches = rows.filter((row) => brandKey(row.name) === brandKey(name))
  if (matches.length > 1) throw new Error(`Multiple equivalent brands already exist for ${name}; reconcile them manually.`)
  if (matches.length) return matches[0].id
  const {data, error: insertError} = await supabase.from('brands').insert({name, slug: slugify(name), sort_order: 0}).select('id').single()
  if (insertError) throw new Error(insertError.message)
  summary.brandsCreated++
  return data.id
}

async function getOrCreateWorkType(name) {
  const slug = slugify(name)
  const {data: rows, error} = await supabase.from('work_types').select('id,slug,internal_name')
  if (error) throw new Error(error.message)
  const matches = rows.filter((row) => normalize(row.slug) === slug || normalize(row.internal_name) === normalize(name))
  if (matches.length > 1) throw new Error(`Multiple equivalent work types already exist for ${name}.`)
  if (matches.length) return matches[0].id
  const labels = {video: ['Video','Video'], 'social-media': ['Sosyal Medya','Social Media'], website: ['Web Sitesi','Website']}
  const [label_tr, label_en] = labels[slug] || [name, name]
  const {data, error: insertError} = await supabase.from('work_types').insert({internal_name: name, slug, label_tr, label_en, sort_order: 0}).select('id').single()
  if (insertError) throw new Error(insertError.message)
  summary.workTypesCreated++
  return data.id
}

try {
  for (const item of seed) {
    const brandId = await getOrCreateBrand(item.brand)
    const urls = [['instagram', item.instagram_url], ['tiktok', item.tiktok_url], ['youtube', item.youtube_url], ['website', item.website_url]].filter(([, url]) => url)
    const existingProjectIds = new Set()
    for (const [, url] of urls) {
      const {data, error} = await supabase.from('project_links').select('project_id').eq('url', url)
      if (error) throw new Error(error.message)
      data.forEach((row) => existingProjectIds.add(row.project_id))
    }
    const slug = slugify(item.internal_id)
    const {data: slugRows, error: slugError} = await supabase.from('projects').select('*').eq('slug', slug)
    if (slugError) throw new Error(slugError.message)
    slugRows.forEach((row) => existingProjectIds.add(row.id))
    if (existingProjectIds.size > 1) throw new Error(`Seed item ${item.internal_id} matches multiple projects; refusing to merge.`)

    const projectValues = {
      internal_name: item.internal_label,
      slug,
      brand_id: brandId,
      project_date: item.date,
      title_tr: item.public_title_tr,
      title_en: item.public_title_en,
      short_description_tr: item.short_description_tr,
      short_description_en: item.short_description_en,
      translation_status_tr: item.needs_review ? 'needs_review' : (item.public_title_tr ? 'approved' : 'missing'),
      translation_status_en: item.needs_review ? 'needs_review' : (item.public_title_en ? 'approved' : 'missing'),
      featured: item.featured,
      published: Boolean(item.published && item.public_title_tr && item.public_title_en),
      sort_order: seed.indexOf(item),
    }
    let projectId
    if (existingProjectIds.size) {
      projectId = [...existingProjectIds][0]
      const existing = slugRows.find((row) => row.id === projectId)
        || (await supabase.from('projects').select('*').eq('id', projectId).single()).data
      if (!existing) throw new Error(`Unable to load existing project ${projectId}.`)
      const safePatch = {
        brand_id: existing.brand_id || projectValues.brand_id,
        project_date: existing.project_date || projectValues.project_date,
        title_tr: existing.title_tr || projectValues.title_tr,
        title_en: existing.title_en || projectValues.title_en,
        short_description_tr: existing.short_description_tr || projectValues.short_description_tr,
        short_description_en: existing.short_description_en || projectValues.short_description_en,
      }
      const {error} = await supabase.from('projects').update(safePatch).eq('id', projectId)
      if (error) throw new Error(error.message)
    } else {
      const {data, error} = await supabase.from('projects').insert(projectValues).select('id').single()
      if (error) throw new Error(error.message)
      projectId = data.id
    }
    summary.projects++

    for (const typeName of item.work_types) {
      const workTypeId = await getOrCreateWorkType(typeName)
      const {data: links, error: findError} = await supabase.from('project_work_types').select('project_id').eq('project_id', projectId).eq('work_type_id', workTypeId)
      if (findError) throw new Error(findError.message)
      if (!links.length) {
        const {error} = await supabase.from('project_work_types').insert({project_id: projectId, work_type_id: workTypeId})
        if (error) throw new Error(error.message)
      }
    }
    for (const [sortOrder, [platform, url]] of urls.entries()) {
      const {data: linkRows, error: linkFindError} = await supabase.from('project_links').select('id,project_id').eq('url', url)
      if (linkFindError) throw new Error(linkFindError.message)
      if (linkRows.some((row) => row.project_id !== projectId)) throw new Error(`URL already belongs to another project: ${url}`)
      const result = linkRows.length
        ? await supabase.from('project_links').update({platform, sort_order: sortOrder}).eq('id', linkRows[0].id)
        : await supabase.from('project_links').insert({project_id: projectId, platform, url, sort_order: sortOrder})
      if (result.error) throw new Error(result.error.message)
      summary.links++
    }
  }
  console.log(JSON.stringify({ok: true, summary}, null, 2))
} finally {
  await signOut(supabase)
}
