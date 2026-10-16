'use client'
import {ArrowIcon} from '@/components/public/arrow-icon'

import {useRef, useState, type FormEvent} from 'react'
import Link from 'next/link'
import {contactRequestId} from '@/lib/contact/request-id'

export function ContactForm({locale, email, deliveryAvailable}: {locale:'tr'|'en'; email:string; deliveryAvailable:boolean}) {
  const startedAt = useRef(0)
  const submission = useRef({payload:'', id:''})
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [errorCode, setErrorCode] = useState('')
  const tr = locale === 'tr'
  const labels = tr ? {
    kicker:'01 / Projenden bahset', title:'İyi işler bir merhaba ile başlar.',
    name:'Ad soyad', nameHint:'Adın ve soyadın', email:'E-posta adresi', emailHint:'sana@ulasabilecegim.com',
    phone:'Telefon numarası', phoneHint:'+90 5xx xxx xx xx', phoneHelp:'Ülke koduyla birlikte yazabilirsin.',
    reason:'Ne üzerine konuşalım?', choose:'Bir konu seç', project:'Proje / iş birliği', role:'İş fırsatı', hello:'Tanışma / diğer',
    message:'Aklındaki fikir', messageHint:'Ne yapmak istiyorsun? Hedefini, kapsamını ve varsa zaman planını kısaca paylaş.',
    privacy:'İletişim bilgilerini yalnızca mesajına dönüş yapmak için istiyorum.',
    send:'Mesajı gönder', sending:'Gönderiliyor…', sent:'Mesajın gönderildi.',
    thanks:'Teşekkürler. Paylaştığın e-posta adresinden sana dönüş yapacağım.', another:'Yeni bir mesaj yaz',
    unavailable:'Form şu anda kullanılamıyor. Bana doğrudan e-posta gönderebilirsin.',
    error:'Mesaj gönderilemedi. Yazdıkların korunuyor; tekrar deneyebilir veya e-posta gönderebilirsin.',
    rate:'Kısa sürede çok fazla deneme yapıldı. Lütfen daha sonra tekrar dene.',
    fast:'Lütfen formu kontrol edip birkaç saniye sonra tekrar gönder.', invalid:'Lütfen alanları kontrol et. Mesajın en az 20 karakter olmalı.',
    mail:'E-posta gönder', required:'Tüm alanlar zorunlu.',
  } : {
    kicker:'01 / Tell me about it', title:'Good work starts with a hello.',
    name:'Full name', nameHint:'Your first and last name', email:'Email address', emailHint:'you@yourcompany.com',
    phone:'Phone number', phoneHint:'+44 7xxx xxx xxx', phoneHelp:'Include your country code if possible.',
    reason:'What brings you here?', choose:'Choose a topic', project:'Project / collaboration', role:'Job opportunity', hello:'Introduction / other',
    message:'What do you have in mind?', messageHint:'Share your idea, goals, scope and timeline, if you have one.',
    privacy:'Your contact details are requested only so I can reply to your enquiry.',
    send:'Send message', sending:'Sending…', sent:'Your message has been sent.',
    thanks:'Thank you. I’ll get back to you at the email address you shared.', another:'Write another message',
    unavailable:'The form is temporarily unavailable. You can email me directly instead.',
    error:'Your message could not be sent. Your text is preserved; try again or email me directly.',
    rate:'Too many attempts. Please try again later.', fast:'Please check the form and try again in a few seconds.',
    invalid:'Please check the fields. Your message must contain at least 20 characters.',
    mail:'Send an email', required:'All fields are required.',
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending' || status === 'sent') return
    const formData = new FormData(event.currentTarget)
    const payload = JSON.stringify(Object.fromEntries(formData))
    try {
      if (submission.current.payload !== payload) submission.current = {payload, id:contactRequestId()}
    } catch {setErrorCode('unavailable'); setStatus('error'); return}
    formData.set('requestId', submission.current.id)
    formData.set('startedAt', String(startedAt.current))
    setStatus('sending')
    setErrorCode('')
    try {
      const response = await fetch('/api/contact', {method:'POST', body:formData, signal:AbortSignal.timeout(25000)})
      const result = await response.json()
      if (response.ok && result.ok === true) setStatus('sent')
      else { setErrorCode(result.code || 'unavailable'); setStatus('error') }
    } catch { setErrorCode('unavailable'); setStatus('error') }
  }

  if (status === 'sent') return <section className="contact-form contact-success" aria-live="polite">
    <span className="contact-success-mark" aria-hidden="true"><ArrowIcon direction="up-right"/></span>
    <p className="eyebrow">YKA / {tr ? 'Mesaj alındı' : 'Message received'}</p>
    <h2>{labels.sent}</h2><p>{labels.thanks}</p>
    <button className="section-link" onClick={() => {startedAt.current = 0; submission.current = {payload:'', id:''}; setStatus('idle')}}>{labels.another} <span aria-hidden="true"><ArrowIcon direction="up-right"/></span></button>
  </section>

  const errorText = errorCode === 'rate_limited' ? labels.rate : errorCode === 'too_fast' ? labels.fast : errorCode === 'invalid' ? labels.invalid : labels.error
  return <form className="contact-form" onSubmit={submit} onFocus={() => {if (!startedAt.current) startedAt.current = Date.now()}} aria-busy={status === 'sending'}>
    <div className="contact-form-heading"><span>{labels.kicker}</span><h2>{labels.title}</h2><p>{labels.required}</p></div>
    {!deliveryAvailable ? <p className="contact-availability" role="status">{labels.unavailable} <a href={`mailto:${email}`}>{labels.mail} <ArrowIcon direction="up-right"/></a></p> : null}
    <label className="contact-honeypot" aria-hidden="true">Company website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <fieldset className="contact-fields" disabled={status === 'sending'}>
      <legend className="contact-honeypot">{tr ? 'İletişim bilgileri ve mesaj' : 'Contact details and message'}</legend>
      <div className="contact-form-row">
        <label className="contact-field"><span>{labels.name}</span><input name="name" minLength={2} maxLength={100} required autoComplete="name" placeholder={labels.nameHint}/></label>
        <label className="contact-field"><span>{labels.email}</span><input name="email" type="email" maxLength={200} required autoComplete="email" placeholder={labels.emailHint}/></label>
      </div>
      <div className="contact-form-row">
        <label className="contact-field"><span>{labels.phone}</span><input name="phone" type="tel" inputMode="tel" minLength={7} maxLength={30} pattern={String.raw`\+?[\d\s\(\)\.\-]{7,30}`} required autoComplete="tel" placeholder={labels.phoneHint} aria-describedby="contact-phone-help"/><small id="contact-phone-help">{labels.phoneHelp}</small></label>
        <label className="contact-field"><span>{labels.reason}</span><select name="reason" required defaultValue=""><option value="" disabled>{labels.choose}</option><option value="project">{labels.project}</option><option value="opportunity">{labels.role}</option><option value="other">{labels.hello}</option></select></label>
      </div>
      <label className="contact-field"><span>{labels.message}</span><textarea name="message" minLength={20} maxLength={4000} required rows={4} placeholder={labels.messageHint}/></label>
    </fieldset>
    <div className="contact-form-footer"><p>{labels.privacy} <Link href={`/${locale}/privacy`}>{tr ? 'KVKK aydınlatma metni' : 'Privacy notice'}</Link>. {tr ? 'Bu form pazarlama izni değildir.' : 'This form is not marketing consent.'}</p><button className="contact-submit" disabled={!deliveryAvailable || status === 'sending'}>{status === 'sending' ? labels.sending : labels.send}<span aria-hidden="true"><ArrowIcon direction="up-right"/></span></button></div>
    <div aria-live="polite" aria-atomic="true">{status === 'error' ? <p className="contact-error" role="alert">{errorText} <a href={`mailto:${email}`}>{labels.mail} <ArrowIcon direction="up-right"/></a></p> : null}</div>
  </form>
}
