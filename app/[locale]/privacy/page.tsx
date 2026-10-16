import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {isLocale} from '../content'
import {LegalNotice} from '@/components/public/legal-notice'
import {notices} from '@/lib/privacy/notices'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale} = await params
  if (!isLocale(locale)) return {}
  return {title:`${notices[locale].privacy.title} — YKA`,description:notices[locale].privacy.intro,alternates:{canonical:`/${locale}/privacy`,languages:{tr:'/tr/privacy',en:'/en/privacy'}}}
}
export default async function PrivacyPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  return <LegalNotice locale={locale} kind="privacy"/>
}
