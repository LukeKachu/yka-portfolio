import Link from 'next/link'
import {notFound} from 'next/navigation'
import type {ReactNode} from 'react'
import {copy, isLocale, locales} from './content'
import {getSettings, getPublicDataStatus, publicAssetUrl} from '@/lib/data/public'
import type {Metadata} from 'next'
import {PublicNavigation} from '@/components/public/public-navigation'
import {CookieConsentProvider,CookieSettingsButton} from '@/components/public/cookie-consent'

export async function generateMetadata({params}: {params: Promise<{locale:string}>}): Promise<Metadata> {
  const {locale}=await params;if(!isLocale(locale))return {}
  const settings=await getSettings();const site=String(settings?.production_site_url||process.env.NEXT_PUBLIC_SITE_URL||'')
  const title=String(settings?.[`seo_title_${locale}`]||settings?.full_name||'Yusuf Kerim Altay')
  const description=String(settings?.[`seo_description_${locale}`]||'')
  return {title,description,metadataBase:site?new URL(site):undefined,alternates:{canonical:`/${locale}`,languages:{en:'/en',tr:'/tr','x-default':'/en'}},openGraph:{title,description,locale:locale==='tr'?'tr_TR':'en_US',type:'website'},twitter:{card:'summary_large_image',title,description}}
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}))
}

export default async function LocaleLayout({children, params}: {children: ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  const text = copy[locale]
  const settings = await getSettings()
  const dataStatus = await getPublicDataStatus()
  const resumeUrl = publicAssetUrl('resume-public', settings?.resume_pdf_path)

  return (
    <CookieConsentProvider locale={locale}><div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main-content">{locale === 'tr' ? 'İçeriğe geç' : 'Skip to content'}</a>
      <header>
        <Link className="site-name" href={`/${locale}`} aria-label="YKA — Yusuf Kerim Altay"><span className="site-wordmark">YKA<span>.</span></span><span className="site-brand-caption">Yusuf Kerim Altay</span></Link>
        <PublicNavigation locale={locale}/>
      </header>
      {dataStatus === 'offline' ? <div className="content-notice" role="status">{locale === 'tr' ? 'İçerik bağlantısı şu anda kurulamıyor. Çalışmalar ve deneyim bilgileri bağlantı yeniden sağlandığında görünecek.' : 'The content connection is temporarily unavailable. Work and experience will appear when the connection is restored.'}</div> : null}
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="site-footer"><Link href={`/${locale}`} className="footer-brand">YKA<span>.</span></Link><span>© {new Date().getFullYear()} Yusuf Kerim Altay</span>{resumeUrl ? <a href={resumeUrl} target="_blank" rel="noreferrer">{text.downloadResume} ↗</a> : <span>İstanbul · Türkiye</span>}<nav className="legal-footer" aria-label={locale === 'tr' ? 'Gizlilik ve site bilgileri' : 'Privacy and site information'}><Link href={`/${locale}/privacy`}>{locale === 'tr' ? 'Gizlilik / KVKK' : 'Privacy'}</Link><Link href={`/${locale}/cookies`}>{locale === 'tr' ? 'Çerez politikası' : 'Cookies'}</Link><Link href={`/${locale}/terms`}>{locale === 'tr' ? 'Kullanım bilgileri' : 'Site terms'}</Link><CookieSettingsButton locale={locale}/></nav></footer>
    </div></CookieConsentProvider>
  )
}
