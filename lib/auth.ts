import {redirect} from 'next/navigation'
import {isSupabaseConfigured} from './supabase/config'
import {createClient} from './supabase/server'

export async function getAdminSession() {
  if (!isSupabaseConfigured) return {supabase: null, user: null, isAdmin: false}
  const supabase = await createClient()
  const {data: {user}, error: userError} = await supabase.auth.getUser()
  if (userError || !user) return {supabase, user: null, isAdmin: false}
  const {data: isAdmin, error: adminError} = await supabase.rpc('is_admin')
  if (adminError) throw new Error('Unable to verify administrator authorization.')
  return {supabase, user, isAdmin: isAdmin === true}
}

export async function requireAdmin() {
  const {supabase, user, isAdmin} = await getAdminSession()
  if (!supabase) return null
  if (!user) redirect('/admin/login')
  if (!isAdmin) redirect('/admin/login?error=unauthorized')
  return {supabase, user}
}
