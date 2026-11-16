import 'server-only'
import {createClient} from '@supabase/supabase-js'
import {supabaseConfig} from '@/lib/supabase/config'

// A separate, stateless, server-only client. Never inherit browser auth/cookies or
// accept this header from the visitor. The key authorizes only the contact RPC.
export async function saveContactMessage(args:Record<string,string|null>) {
  const secret=process.env.CONTACT_GATEWAY_SECRET?.trim()
  if (!secret||!/^[a-f0-9]{64}$/.test(secret)||!supabaseConfig.url||!supabaseConfig.publishableKey) {
    throw new Error('Secure contact delivery is not configured.')
  }
  const supabase=createClient(supabaseConfig.url,supabaseConfig.publishableKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{'x-contact-gateway-key':secret}},
  })
  return supabase.rpc('submit_contact_message_v3',args).abortSignal(AbortSignal.timeout(8000))
}
