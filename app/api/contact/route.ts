import 'server-only'
import {createClient} from '@/lib/supabase/server'
import {handleContact} from '@/lib/contact/handler'

export const runtime = 'nodejs'

export async function POST(request:Request) {
  return handleContact(request, {
    config:{apiKey:process.env.RESEND_API_KEY,from:process.env.CONTACT_FROM_EMAIL,siteUrl:process.env.NEXT_PUBLIC_SITE_URL},
    async save(args) {
      const supabase = await createClient()
      return supabase.rpc('submit_contact_message_v2',args).abortSignal(AbortSignal.timeout(8000))
    },
  })
}
