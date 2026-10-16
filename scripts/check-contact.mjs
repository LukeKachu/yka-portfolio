import {createClient} from '@supabase/supabase-js'
import {contactEmailConfigured} from '../lib/contact/handler.ts'
import {turnstileConfiguration} from '../lib/contact/turnstile.ts'

// Read-only preflight. Never prints configuration values or sends an email.
const config = {apiKey:process.env.RESEND_API_KEY,from:process.env.CONTACT_FROM_EMAIL}
let ready = true
const protection=turnstileConfiguration({siteKey:process.env.TURNSTILE_SITE_KEY,secretKey:process.env.TURNSTILE_SECRET_KEY})
console.log(`Turnstile protection: ${protection==='required'?'CONFIGURED (server verification required; live challenge not tested)':protection==='incomplete'?'INCOMPLETE (both runtime keys are required)':'NOT ENABLED (existing anti-spam checks remain)'}`)
if(protection==='incomplete')ready=false
for (const [name,present] of [['RESEND_API_KEY',Boolean(config.apiKey?.trim())],['CONTACT_FROM_EMAIL',Boolean(config.from?.trim())]]) {
  console.log(`${name}: ${present ? 'configured (value hidden)' : 'MISSING'}`)
}
if (!contactEmailConfigured(config)) {console.log('Email delivery: NOT READY. Configure a Resend key and verified-domain sender.'); ready=false}
else {
  const testSender = /(?:^|<)onboarding@resend\.dev>?$/i.test(config.from.trim())
  console.log(testSender ? 'Sender mode: OWNER-ONLY TEST. The recipient must be the email associated with the Resend account.' : 'Sender mode: CUSTOM DOMAIN. Verify domain ownership/DNS in Resend; this check cannot confirm it.')
  console.log('API credentials: present, but acceptance by Resend has NOT been tested.')
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (url && key) {
  try {
    const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
    const {error} = await supabase.from('contact_messages').select('phone,request_id').limit(0).abortSignal(AbortSignal.timeout(8000))
    const missingColumns = error && ['42703','PGRST204'].includes(error.code)
    const missingTable = error && ['42P01','PGRST205'].includes(error.code)
    console.log(`Contact database columns: ${!error ? 'OK' : missingColumns ? 'MISSING (apply 202610160007_contact_phone.sql)' : missingTable ? 'MISSING (apply contact migrations 004, then 007)' : 'UNVERIFIED (connection or database permission error)'}`)
    if (error) ready=false
  } catch {console.log('Contact database: UNREACHABLE'); ready=false}
} else {console.log('Supabase public connection: NOT CONFIGURED'); ready=false}
console.log('Live email delivery: NOT TESTED by this read-only check.')
if (!ready) process.exitCode=1
