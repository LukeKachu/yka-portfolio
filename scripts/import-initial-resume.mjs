import {readFile} from 'node:fs/promises'
import {createImportClient, normalize, reconcileOne, signOut} from './import-utils.mjs'

const seed = JSON.parse(await readFile(new URL('../seed/resume.json', import.meta.url), 'utf8'))
const supabase = await createImportClient()
const summary = {siteSettings: 0, experiences: 0, education: 0, volunteering: 0, skillGroups: 0, skills: 0, languages: 0}

try {
  const {data: settingsRows, error: settingsFindError} = await supabase.from('site_settings').select('id').eq('singleton_key', 'default').limit(2)
  if (settingsFindError) throw new Error(settingsFindError.message)
  if (settingsRows.length > 1) throw new Error('Multiple default site_settings rows exist; refusing to choose one.')
  const settingsResult = settingsRows.length
    ? await supabase.from('site_settings').update(seed.siteSettings).eq('id', settingsRows[0].id)
    : await supabase.from('site_settings').insert(seed.siteSettings)
  if (settingsResult.error) throw new Error(`site_settings reconciliation failed: ${settingsResult.error.message}`)
  summary.siteSettings = 1

  for (const row of seed.experiences) {
    await reconcileOne(supabase, 'experiences', {company: row.company, start_date: row.start_date}, row)
    summary.experiences++
  }
  for (const row of seed.education) {
    await reconcileOne(supabase, 'education', {institution: row.institution, start_date: row.start_date}, row)
    summary.education++
  }
  for (const row of seed.volunteering) {
    await reconcileOne(supabase, 'volunteering', {organization: row.organization, start_date: row.start_date}, row)
    summary.volunteering++
  }

  const {data: existingGroups, error: groupsError} = await supabase.from('skill_groups').select('id,title_en')
  if (groupsError) throw new Error(groupsError.message)
  for (const group of seed.skillGroups) {
    const matchingGroups = existingGroups.filter((item) => normalize(item.title_en) === normalize(group.title_en))
    if (matchingGroups.length > 1) throw new Error(`Duplicate skill group: ${group.title_en}`)
    let groupId
    if (matchingGroups.length) {
      groupId = matchingGroups[0].id
      const {error} = await supabase.from('skill_groups').update({title_tr: group.title_tr, title_en: group.title_en, sort_order: group.sort_order, published: group.published}).eq('id', groupId)
      if (error) throw new Error(error.message)
    } else {
      const {data, error} = await supabase.from('skill_groups').insert({title_tr: group.title_tr, title_en: group.title_en, sort_order: group.sort_order, published: group.published}).select('id').single()
      if (error) throw new Error(error.message)
      groupId = data.id
    }
    summary.skillGroups++
    const {data: existingSkills, error: skillsError} = await supabase.from('skills').select('id,name').eq('group_id', groupId)
    if (skillsError) throw new Error(skillsError.message)
    for (const [sortOrder, skill] of group.skills.entries()) {
      const matches = existingSkills.filter((item) => normalize(item.name) === normalize(skill.name))
      if (matches.length > 1) throw new Error(`Duplicate skill in ${group.title_en}: ${skill.name}`)
      const values = {group_id: groupId, ...skill, sort_order: sortOrder}
      const result = matches.length
        ? await supabase.from('skills').update(values).eq('id', matches[0].id)
        : await supabase.from('skills').insert(values)
      if (result.error) throw new Error(result.error.message)
      summary.skills++
    }
  }

  const {error: languageCheckError} = await supabase.from('languages').select('id').limit(1)
  if (languageCheckError) throw new Error(`Languages support is not installed. Run 202608300003_add_languages.sql first: ${languageCheckError.message}`)
  for (const row of seed.languages) {
    await reconcileOne(supabase, 'languages', {name_en: row.name_en}, row)
    summary.languages++
  }

  console.log(JSON.stringify({ok: true, summary}, null, 2))
} finally {
  await signOut(supabase)
}
