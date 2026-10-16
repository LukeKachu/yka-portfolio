import 'server-only'
import {cache} from 'react'
import {connection} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {isSupabaseConfigured, supabaseConfig} from '@/lib/supabase/config'
import {readPublicResult} from './read-result'

export type PublicRow = Record<string, unknown>

function schemaNotInitialized(error: {code?: string; message?: string} | null) {
  return error?.code === 'PGRST205' || Boolean(error?.message?.includes('schema cache'))
}

function connectionUnavailable(error: {code?: string; message?: string} | null) {
  return Boolean(error && (!error.code || /fetch failed|timeout|aborted|network/i.test(error.message || '')))
}

// Public pages always use the public role, even when their visitor is an admin.
// This prevents unpublished resume content leaking through an admin's session.
async function publicClient() {
  await connection()
  return createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    global: {fetch: (input, init) => fetch(input, {...init, cache:'no-store', signal: AbortSignal.timeout(8000)})},
  })
}

async function query(table: string, select = '*', order = 'sort_order'): Promise<PublicRow[]> {
  if (!isSupabaseConfigured) return []
  const {data, error} = await readPublicResult(async () => {
    const supabase = await publicClient()
    return supabase.from(table).select(select).order(order, {ascending: true})
  })
  if (schemaNotInitialized(error) || connectionUnavailable(error)) return []
  if (error) throw new Error(error.message)
  return (data || []) as unknown as PublicRow[]
}

const settingsRequest = cache(async () => {
  if (!isSupabaseConfigured) return {data:null, error:null}
  return readPublicResult(async () => {
    const supabase = await publicClient()
    return supabase.from('site_settings').select('*').eq('singleton_key', 'default').maybeSingle()
  })
})

export const getPublicDataStatus = cache(async () => {
  if (!isSupabaseConfigured) return 'unconfigured'
  const {error} = await settingsRequest()
  return connectionUnavailable(error) ? 'offline' : schemaNotInitialized(error) ? 'schema-missing' : 'ready'
})

export const getSettings = cache(async () => {
  if (!isSupabaseConfigured) return null
  const {data, error} = await settingsRequest()
  if (schemaNotInitialized(error) || connectionUnavailable(error)) return null
  if (error) throw new Error(error.message)
  return data as PublicRow | null
})

export async function getProjects(featuredOnly = false) {
  if (!isSupabaseConfigured) return []
  const {data, error} = await readPublicResult(async () => {
    const supabase = await publicClient()
    let request = supabase.from('projects').select('*, brands(name,slug), project_work_types(work_types(id,slug,label_tr,label_en)), project_roles(*), project_links(*), project_media(*)').eq('published', true).order('sort_order')
    if (featuredOnly) request = request.eq('featured', true)
    return request
  })
  if (schemaNotInitialized(error) || connectionUnavailable(error)) return []
  if (error) throw new Error(error.message)
  return (data || []) as PublicRow[]
}

export async function getProjectBySlug(slug: string) {
  if (!isSupabaseConfigured) return null
  const {data, error} = await readPublicResult(async () => {
    const supabase = await publicClient()
    return supabase.from('projects').select('*, brands(name,slug), project_work_types(work_types(id,slug,label_tr,label_en)), project_roles(*), project_media(*), project_links(*)').eq('slug', slug).eq('published', true).maybeSingle()
  })
  if (schemaNotInitialized(error) || connectionUnavailable(error)) return null
  if (error) throw new Error(error.message)
  return data as PublicRow | null
}

export const getExperiences = () => query('experiences')
export const getEducation = () => query('education')
export const getVolunteering = () => query('volunteering')
export const getSkillGroups = () => query('skill_groups', '*, skills(*)')
export const getLanguages = () => query('languages')
export const getAbout = async () => (await query('about', '*', 'created_at'))[0] || null

export function publicAssetUrl(bucket: string, path: unknown) {
  if (!path || !supabaseConfig.url) return null
  return `${supabaseConfig.url}/storage/v1/object/public/${bucket}/${String(path)}`
}
