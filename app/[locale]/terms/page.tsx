import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {isLocale} from '../content'
import {LegalNotice} from '@/components/public/legal-notice'
import {notices} from '@/lib/privacy/notices'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale} = await params
  if (!isLocale(locale)) return {}
  return {title:`${notices[locale].terms.title} — YKA`,description:notices[locale].terms.intro,alternates:{canonical:`/${locale}/terms`,languages:{tr:'/tr/terms',en:'/en/terms'}}}
}
export default async function TermsPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  return <LegalNotice locale={locale} kind="terms"/>
}
