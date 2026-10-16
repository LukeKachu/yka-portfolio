import Link from 'next/link'
import {LEGAL_UPDATED,notices,type LegalKind} from '@/lib/privacy/notices'
import {CookieSettingsButton} from './cookie-consent'

export function LegalNotice({locale,kind}:{locale:'tr'|'en';kind:LegalKind}) {
  const notice = notices[locale][kind]
  const tr = locale === 'tr'
  return <main className="legal-page"><header className="page-heading"><p className="eyebrow">YKA / {tr ? 'Şeffaflık' : 'Transparency'}</p><h1>{notice.title}</h1><p>{notice.intro}</p><small>{tr ? 'Son güncelleme' : 'Last updated'}: <time dateTime={LEGAL_UPDATED}>{new Intl.DateTimeFormat(locale,{dateStyle:'long',timeZone:'UTC'}).format(new Date(LEGAL_UPDATED))}</time></small></header>
    <div className="legal-layout"><nav aria-label={tr ? 'Bu sayfada' : 'On this page'}><span>{tr ? 'Bu sayfada' : 'On this page'}</span>{notice.sections.map((section,index) => <a key={section.title} href={`#legal-${index+1}`}>{section.title}</a>)}</nav><div className="legal-content">{notice.sections.map((section,index) => <section key={section.title} id={`legal-${index+1}`}><h2><span>{String(index+1).padStart(2,'0')}</span>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <div className="legal-contact"><p>{tr ? 'Bir soru veya hak talebi için:' : 'For a question or rights request:'}</p><a href="mailto:yusufkerimaltay77@gmail.com">yusufkerimaltay77@gmail.com ↗</a><CookieSettingsButton locale={locale}/></div>
      <p className="legal-related"><Link href={`/${locale}/privacy`}>{tr ? 'Gizlilik / KVKK' : 'Privacy'}</Link><Link href={`/${locale}/cookies`}>{tr ? 'Çerez politikası' : 'Cookies'}</Link><Link href={`/${locale}/terms`}>{tr ? 'Kullanım bilgileri' : 'Site information'}</Link></p>
      <p className="legal-sources">{tr ? 'Resmî bilgi:' : 'Official guidance:'} <a href="https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-" target="_blank" rel="noopener noreferrer">KVKK</a> · <a href="https://www.kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber" target="_blank" rel="noopener noreferrer">{tr ? 'Çerez rehberi' : 'Cookie guidance'}</a></p>
    </div></div>
  </main>
}
