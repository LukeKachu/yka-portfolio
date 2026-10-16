'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {z} from 'zod'
import {requireAdmin} from '@/lib/auth'
import {createClient} from '@/lib/supabase/server'
import {translateFields} from '@/lib/translation/server'

const allowedTables = new Set([
  'brands', 'work_types', 'projects', 'experiences', 'education', 'volunteering',
  'skill_groups', 'skills', 'about', 'site_settings', 'project_links',
  'languages',
])

const projectSchema = z.object({
  internal_name: z.string().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), brand_id: z.string().uuid().nullable(),
  project_date: z.string().nullable(), live_url: z.string().url().nullable(), title_tr: z.string().nullable(), title_en: z.string().nullable(),
  short_description_tr: z.string().nullable(), short_description_en: z.string().nullable(), description_tr: z.string().nullable(), description_en: z.string().nullable(),
  context_tr: z.string().nullable(), context_en: z.string().nullable(), seo_title_tr: z.string().nullable(), seo_title_en: z.string().nullable(),
  seo_description_tr: z.string().nullable(), seo_description_en: z.string().nullable(), featured: z.boolean(), published: z.boolean(), sort_order: z.number(),
})

function cleanForm(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => [key, value === '' ? null : value]),
  ) as Record<string, unknown>
}

export async function signIn(formData: FormData) {
  const parsed = z.object({email: z.email(), password: z.string().min(8), next: z.string().optional()}).safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect('/admin/login?error=invalid')
  const supabase = await createClient()
  const {error} = await supabase.auth.signInWithPassword({email: parsed.data.email, password: parsed.data.password})
  if (error) redirect('/admin/login?error=credentials')
  const {data: isAdmin, error: adminError} = await supabase.rpc('is_admin')
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=unauthorized')
  }
  redirect(parsed.data.next?.startsWith('/admin') ? parsed.data.next : '/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function saveRecord(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase is not configured.')
  const table = String(formData.get('_table') || '')
  const id = String(formData.get('_id') || '')
  const returnTo = String(formData.get('_returnTo') || '/admin')
  if (!allowedTables.has(table) || !returnTo.startsWith('/admin')) throw new Error('Invalid admin operation.')
  const values = cleanForm(formData)
  const booleanColumns: Record<string,string[]> = {projects:['published','featured'],experiences:['published','current_position'],education:['published'],volunteering:['published'],skill_groups:['published'],languages:['published'],about:['published']}
  for (const key of booleanColumns[table] || []) values[key] = formData.get(key) === 'on'
  for (const key of ['sort_order']) if (key in values) values[key] = Number(values[key] || 0)
  for (const key of ['bullets_tr', 'bullets_en']) {
    if (typeof values[key] === 'string') values[key] = values[key].split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  }
  const query = id ? auth.supabase.from(table).update(values).eq('id', id) : auth.supabase.from(table).insert(values)
  const {error} = await query
  if (error) throw new Error(error.message)
  revalidatePath(returnTo)
  redirect(returnTo)
}

export async function deleteRecord(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase is not configured.')
  const table = String(formData.get('_table') || '')
  const id = String(formData.get('_id') || '')
  const returnTo = String(formData.get('_returnTo') || '/admin')
  if (!allowedTables.has(table) || !id || !returnTo.startsWith('/admin')) throw new Error('Invalid admin operation.')
  const {error} = await auth.supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(returnTo)
}

export async function saveProject(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase is not configured.')
  const id = String(formData.get('_id') || '')
  const raw = cleanForm(formData)
  const parsed = projectSchema.safeParse({
    ...raw, brand_id: raw.brand_id || null, project_date: raw.project_date || null, live_url: raw.live_url || null,
    featured: formData.get('featured') === 'on', published: formData.get('published') === 'on', sort_order: Number(raw.sort_order || 0),
  })
  if (!parsed.success) throw new Error('Invalid project fields.')
  const result = id
    ? await auth.supabase.from('projects').update(parsed.data).eq('id', id).select('id').single()
    : await auth.supabase.from('projects').insert(parsed.data).select('id').single()
  if (result.error) throw new Error(result.error.message)
  const projectId = result.data.id
  const workTypeIds = formData.getAll('work_type_ids').map(String)
  await auth.supabase.from('project_work_types').delete().eq('project_id', projectId)
  if (workTypeIds.length) {
    const {error} = await auth.supabase.from('project_work_types').insert(workTypeIds.map((work_type_id) => ({project_id: projectId, work_type_id})))
    if (error) throw new Error(error.message)
  }
  const rolesTr = String(formData.get('_roles_tr') || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean)
  const rolesEn = String(formData.get('_roles_en') || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean)
  await auth.supabase.from('project_roles').delete().eq('project_id', projectId)
  const roleCount = Math.max(rolesTr.length, rolesEn.length)
  if (roleCount) await auth.supabase.from('project_roles').insert(Array.from({length: roleCount}, (_, index) => ({project_id: projectId, role_tr: rolesTr[index] || null, role_en: rolesEn[index] || null, sort_order: index})))
  const platforms = ['youtube', 'instagram', 'tiktok', 'website', 'other'] as const
  await auth.supabase.from('project_links').delete().eq('project_id', projectId)
  const links = platforms.flatMap((platform, index) => {
    const url = String(formData.get(`_link_${platform}`) || '').trim()
    return url ? [{project_id: projectId, platform, url, sort_order: index}] : []
  })
  if (links.length) await auth.supabase.from('project_links').insert(links)
  revalidatePath('/admin/projects')
  revalidatePath('/en/work')
  revalidatePath('/tr/work')
  redirect(`/admin/projects/${projectId}`)
}

export async function deleteProject(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase is not configured.')
  const id = String(formData.get('_id') || '')
  if (!id) throw new Error('Missing project ID.')
  const {error} = await auth.supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
  redirect('/admin/projects')
}

export async function uploadAsset(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase is not configured.')
  const bucket = String(formData.get('_bucket') || '')
  const table = String(formData.get('_table') || '')
  const column = String(formData.get('_column') || '')
  const id = String(formData.get('_id') || '')
  const returnTo = String(formData.get('_returnTo') || '/admin')
  const file = formData.get('file')
  const allowedColumns: Record<string, string[]> = {projects: ['cover_path', 'primary_media_path'], site_settings: ['profile_photo_path', 'resume_pdf_path', 'social_image_path'], about: ['profile_image_path']}
  if (!(file instanceof File) || !file.size || !['portfolio-public', 'resume-public'].includes(bucket) || !allowedColumns[table]?.includes(column) || !id || !returnTo.startsWith('/admin')) throw new Error('Invalid upload.')
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const path = `${table}/${id}/${crypto.randomUUID()}-${safeName}`
  const {error: uploadError} = await auth.supabase.storage.from(bucket).upload(path, file, {upsert: false, contentType: file.type})
  if (uploadError) throw new Error(uploadError.message)
  const {error: updateError} = await auth.supabase.from(table).update({[column]: path}).eq('id', id)
  if (updateError) throw new Error(updateError.message)
  revalidatePath(returnTo)
}

export async function translateProject(formData: FormData) {
  const auth = await requireAdmin(); if (!auth) throw new Error('Supabase is not configured.')
  const id=String(formData.get('_id')||''); const source=String(formData.get('_source')) as 'tr'|'en'; const target=source==='tr'?'en':'tr'
  if(!id||!['tr','en'].includes(source))throw new Error('Invalid translation request.')
  const bases=['title','short_description','description','context','seo_title','seo_description'];const columns=bases.map((base)=>`${base}_${source}`)
  const {data,error}=await auth.supabase.from('projects').select(columns.join(',')).eq('id',id).single();if(error)throw new Error(error.message)
  const sourceRecord=data as unknown as Record<string,unknown>
  const fields=Object.fromEntries(bases.flatMap((base)=>{const value=sourceRecord[`${base}_${source}`];return typeof value==='string'&&value.trim()?[[base,value]]:[]}))
  if(!Object.keys(fields).length)throw new Error('Source language has no text to translate.')
  const translated=await translateFields(source,target,fields);const patch:Record<string,string>=Object.fromEntries(Object.entries(translated).map(([base,value])=>[`${base}_${target}`,value]));patch[`translation_status_${target}`]='needs_review'
  const {error:updateError}=await auth.supabase.from('projects').update(patch).eq('id',id);if(updateError)throw new Error(updateError.message);revalidatePath(`/admin/projects/${id}`)
}

export async function approveProjectTranslation(formData: FormData) {
  const auth=await requireAdmin();if(!auth)throw new Error('Supabase is not configured.')
  const id=String(formData.get('_id')||'');const language=String(formData.get('_language'));if(!id||!['tr','en'].includes(language))throw new Error('Invalid approval request.')
  const {error}=await auth.supabase.from('projects').update({[`translation_status_${language}`]:'approved'}).eq('id',id);if(error)throw new Error(error.message);revalidatePath(`/admin/projects/${id}`)
}

export async function saveSkill(formData: FormData) {
  const auth=await requireAdmin();if(!auth)throw new Error('Supabase is not configured.')
  const id=String(formData.get('_id')||'');const group_id=String(formData.get('group_id')||'');const name=String(formData.get('name')||'').trim()
  if(!group_id||!name)throw new Error('Skill group and name are required.')
  const values={group_id,name,name_tr:String(formData.get('name_tr')||'')||null,name_en:String(formData.get('name_en')||'')||null,sort_order:Number(formData.get('sort_order')||0)}
  const result=id?await auth.supabase.from('skills').update(values).eq('id',id):await auth.supabase.from('skills').insert(values);if(result.error)throw new Error(result.error.message);revalidatePath('/admin/resume/skills')
}

export async function uploadProjectMedia(formData: FormData) {
  const auth=await requireAdmin();if(!auth)throw new Error('Supabase is not configured.')
  const projectId=String(formData.get('_projectId')||'');const kind=String(formData.get('kind')||'');const file=formData.get('file')
  if(!(file instanceof File)||!file.size||!projectId||!['image','video','screenshot_desktop','screenshot_mobile'].includes(kind))throw new Error('Invalid project media.')
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');const path=`projects/${projectId}/gallery/${crypto.randomUUID()}-${safe}`
  const {error:uploadError}=await auth.supabase.storage.from('portfolio-public').upload(path,file,{contentType:file.type});if(uploadError)throw new Error(uploadError.message)
  const {error}=await auth.supabase.from('project_media').insert({project_id:projectId,kind,storage_path:path,alt_tr:String(formData.get('alt_tr')||'')||null,alt_en:String(formData.get('alt_en')||'')||null,sort_order:Number(formData.get('sort_order')||0)});if(error)throw new Error(error.message);revalidatePath(`/admin/projects/${projectId}`)
}

export async function registerProjectMedia(input:{projectId:string;kind:'image'|'video'|'screenshot_desktop'|'screenshot_mobile';storagePath:string;altTr?:string;altEn?:string;sortOrder:number}){
  const auth=await requireAdmin();if(!auth)throw new Error('Supabase is not configured.')
  const parsed=z.object({projectId:z.uuid(),kind:z.enum(['image','video','screenshot_desktop','screenshot_mobile']),storagePath:z.string().min(5).max(1000),altTr:z.string().max(300).optional(),altEn:z.string().max(300).optional(),sortOrder:z.number().int()}).safeParse(input)
  if(!parsed.success||!parsed.data.storagePath.startsWith(`projects/${parsed.data.projectId}/gallery/`))throw new Error('Invalid project media metadata.')
  const {error}=await auth.supabase.from('project_media').insert({project_id:parsed.data.projectId,kind:parsed.data.kind,storage_path:parsed.data.storagePath,alt_tr:parsed.data.altTr||null,alt_en:parsed.data.altEn||null,sort_order:parsed.data.sortOrder})
  if(error)throw new Error(error.message)
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);revalidatePath('/tr');revalidatePath('/en');revalidatePath('/tr/work');revalidatePath('/en/work')
}

export async function deleteProjectMedia(formData: FormData) {
  const auth=await requireAdmin();if(!auth)throw new Error('Supabase is not configured.')
  const id=String(formData.get('_id')||'');const projectId=String(formData.get('_projectId')||'');const path=String(formData.get('_path')||'')
  if(!id||!projectId||!path)throw new Error('Invalid media deletion.')
  const {error}=await auth.supabase.from('project_media').delete().eq('id',id);if(error)throw new Error(error.message)
  await auth.supabase.storage.from('portfolio-public').remove([path]);revalidatePath(`/admin/projects/${projectId}`)
}
