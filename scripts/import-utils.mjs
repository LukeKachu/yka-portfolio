import {createClient} from '@supabase/supabase-js'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required server-side environment variable: ${name}`)
  return value
}

export async function createImportClient() {
  const supabase = createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {auth: {persistSession: false, autoRefreshToken: false}},
  )
  const {error: signInError} = await supabase.auth.signInWithPassword({
    email: required('SUPABASE_IMPORT_ADMIN_EMAIL'),
    password: required('SUPABASE_IMPORT_ADMIN_PASSWORD'),
  })
  if (signInError) throw new Error(`Admin sign-in failed: ${signInError.message}`)
  const {data: isAdmin, error: adminError} = await supabase.rpc('is_admin')
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut()
    throw new Error('The authenticated user is not authorized by public.is_admin().')
  }
  return supabase
}

export function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function reconcileOne(supabase, table, filters, values) {
  let request = supabase.from(table).select('id')
  for (const [column, value] of Object.entries(filters)) request = request.eq(column, value)
  const {data: matches, error: findError} = await request.limit(2)
  if (findError) throw new Error(`${table} lookup failed: ${findError.message}`)
  if (matches.length > 1) throw new Error(`${table} has multiple rows for reconciliation key ${JSON.stringify(filters)}.`)
  if (matches.length === 1) {
    const {error} = await supabase.from(table).update(values).eq('id', matches[0].id)
    if (error) throw new Error(`${table} update failed: ${error.message}`)
    return {id: matches[0].id, created: false}
  }
  const {data, error} = await supabase.from(table).insert(values).select('id').single()
  if (error) throw new Error(`${table} insert failed: ${error.message}`)
  return {id: data.id, created: true}
}

export async function signOut(supabase) {
  await supabase.auth.signOut()
}
