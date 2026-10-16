'use client'

import {createBrowserClient} from '@supabase/ssr'
import {supabaseConfig} from './config'

export function createClient() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error('Supabase is not configured.')
  }
  return createBrowserClient(supabaseConfig.url, supabaseConfig.publishableKey)
}
