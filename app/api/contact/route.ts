import 'server-only'
import {saveContactMessage} from '@/lib/contact/database'
import {handleContact} from '@/lib/contact/handler'

export const runtime = 'nodejs'

export async function POST(request:Request) {
  return handleContact(request, {
    config:{apiKey:process.env.RESEND_API_KEY,from:process.env.CONTACT_FROM_EMAIL,siteUrl:process.env.NEXT_PUBLIC_SITE_URL,turnstileSiteKey:process.env.TURNSTILE_SITE_KEY,turnstileSecretKey:process.env.TURNSTILE_SECRET_KEY,gatewaySecret:process.env.CONTACT_GATEWAY_SECRET,requireSecureDelivery:true},
    save:saveContactMessage,
  })
}
