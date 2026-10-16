import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {isLocale} from '../content'
import {LegalNotice} from '@/components/public/legal-notice'
import {notices} from '@/lib/privacy/notices'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale} = await params
  if (!isLocale(locale)) return {}
  return {title:`${notices[locale].cookies.title} — YKA`,description:notices[locale].cookies.intro,alternates:{canonical:`/${locale}/cookies`,languages:{tr:'/tr/cookies',en:'/en/cookies'}}}
}
export default async function CookiesPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  return <LegalNotice locale={locale} kind="cookies"/>
}
