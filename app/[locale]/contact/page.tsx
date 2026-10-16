import {ArrowIcon} from '@/components/public/arrow-icon'
import {notFound} from 'next/navigation'
import {isLocale} from '../content'
import {getSettings} from '@/lib/data/public'
import {ContactForm} from '@/components/public/contact-form'
import {contactEmailConfigured} from '@/lib/contact/handler'
import {localizedPageMetadata} from '@/lib/seo/metadata'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params
  if (!isLocale(locale)) return {}
  return localizedPageMetadata(locale,'contact',locale==='tr'?'İletişim':'Contact',locale==='tr'?'İçerik, dijital pazarlama ve yeni iş birlikleri için Yusuf Kerim Altay ile iletişime geç.':'Get in touch with Yusuf Kerim Altay about content, digital marketing and collaborations.')
}

export default async function ContactPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params
  if (!isLocale(locale)) notFound()
  const settings = await getSettings()
  const tr = locale === 'tr'
  const email = 'yusufkerimaltay77@gmail.com'
  const deliveryAvailable = contactEmailConfigured({apiKey:process.env.RESEND_API_KEY,from:process.env.CONTACT_FROM_EMAIL})
  return <main className="contact-page">
    <header className="contact-page-heading">
      <p className="eyebrow"><span className="status-dot"/>{tr ? 'Yeni fikirlere, iyi iş birliklerine.' : 'New ideas. Thoughtful collaborations.'}</p>
      <h1>{tr ? <>Aklında bir fikir mi var?<br/><span>Konuşalım.</span></> : <>Something in mind?<br/><span>Let’s talk.</span></>}</h1>
    </header>
    <section className="contact-layout" aria-label={tr ? 'İletişime geç' : 'Get in touch'}>
      <div className="contact-aside">
        <p className="contact-intro">{tr ? 'Bir markanın hikâyesi, yeni bir içerik ya da sıradaki dijital deneyim. Nereden başlayacağımızı birlikte bulalım.' : 'A brand story, a new piece of content or your next digital experience. Let’s find the right starting point together.'}</p>
        <a className="contact-direct" href={`mailto:${email}`}><span>{tr ? 'Doğrudan yaz' : 'Write directly'}<strong>{email}</strong></span><span aria-hidden="true"><ArrowIcon direction="up-right"/></span></a>
        <div className="contact-disciplines"><p className="eyebrow">{tr ? 'Birlikte neler yapabiliriz?' : 'What can we work on?'}</p><ul><li><span>01</span>{tr ? 'İçerik & sosyal medya' : 'Content & social media'}</li><li><span>02</span>{tr ? 'Dijital pazarlama' : 'Digital marketing'}</li><li><span>03</span>{tr ? 'Web & dijital deneyimler' : 'Web & digital experiences'}</li></ul></div>
        <div className="contact-meta"><span>{settings?.location ? String(settings.location) : 'İstanbul, Türkiye'}</span>{settings?.linkedin_url ? <a href={String(settings.linkedin_url)} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowIcon direction="up-right"/></a> : null}</div>
      </div>
      <ContactForm locale={locale} email={email} deliveryAvailable={deliveryAvailable}/>
    </section>
  </main>
}
