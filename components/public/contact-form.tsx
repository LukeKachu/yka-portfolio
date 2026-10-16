'use client'
import {ArrowIcon} from '@/components/public/arrow-icon'

import {useRef, useState, type FormEvent} from 'react'
import Link from 'next/link'
import {contactRequestId} from '@/lib/contact/request-id'
import {contactMailto} from '@/lib/contact/mailto'
import {contactFieldsSchema,contactErrorFields,contactFieldNames,contactFieldMessages,type ContactField} from '@/lib/contact/schema'
import {TurnstileWidget} from './turnstile-widget'

export function ContactForm({locale, email, deliveryAvailable,turnstileSiteKey}: {locale:'tr'|'en'; email:string; deliveryAvailable:boolean;turnstileSiteKey?:string}) {
  const startedAt = useRef(0)
  const submission = useRef({payload:'', id:''})
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [errorCode, setErrorCode] = useState('')
  const [draftLink,setDraftLink] = useState('')
  const [invalidFields,setInvalidFields]=useState<ContactField[]>([])
  const [challengeToken,setChallengeToken]=useState('')
  const [challengeAttempt,setChallengeAttempt]=useState(0)
  const tr = locale === 'tr'
  const fieldMessages=contactFieldMessages[locale]
  const labels = tr ? {
    kicker:'01 / Projenden bahset', title:'Bir proje notu bırak.',
    name:'Ad soyad', nameHint:'Adın ve soyadın', email:'E-posta adresi', emailHint:'sana@ulasabilecegim.com',
    phone:'Telefon numarası', phoneHint:'+90 5xx xxx xx xx', phoneHelp:'Ülke koduyla birlikte yazabilirsin.',
    reason:'Ne üzerine konuşalım?', choose:'Bir konu seç', project:'Proje / iş birliği', role:'İş fırsatı', hello:'Tanışma / diğer',
    message:'Aklındaki fikir', messageHint:'Ne yapmak istiyorsun? Hedefini, kapsamını ve varsa zaman planını kısaca paylaş.',
    privacy:'İletişim bilgilerini yalnızca mesajına dönüş yapmak için istiyorum.',
    send:'Mesajı gönder', sending:'Gönderiliyor…', sent:'Mesajın gönderildi.',
    thanks:'Teşekkürler. Paylaştığın e-posta adresinden sana dönüş yapacağım.', another:'Yeni bir mesaj yaz',
    error:'Mesaj gönderilemedi. Yazdıkların korunuyor; tekrar deneyebilir veya e-posta gönderebilirsin.',
    rate:'Kısa sürede çok fazla deneme yapıldı. Lütfen daha sonra tekrar dene.',
    fast:'Lütfen formu kontrol edip birkaç saniye sonra tekrar gönder.', invalid:'Form doğrulanamadı. Sayfayı yenileyip tekrar dene.',
    fields:'Lütfen işaretlenen alanları kontrol et.',refresh:'Form oturumu doğrulanamadı. Sayfayı yenileyip tekrar dene.',
    captcha:'Güvenlik doğrulamasını tamamlayıp tekrar gönder. Yazdıkların korunuyor.',captchaUnavailable:'Güvenlik kontrolüne şu anda ulaşılamıyor. Biraz sonra tekrar dene veya doğrudan e-posta ile ulaş.',
    mail:'E-posta gönder', required:'Tüm alanlar zorunlu.',
  } : {
    kicker:'01 / Tell me about it', title:'Leave a project note.',
    name:'Full name', nameHint:'Your first and last name', email:'Email address', emailHint:'you@yourcompany.com',
    phone:'Phone number', phoneHint:'+44 7xxx xxx xxx', phoneHelp:'Include your country code if possible.',
    reason:'What brings you here?', choose:'Choose a topic', project:'Project / collaboration', role:'Job opportunity', hello:'Introduction / other',
    message:'What do you have in mind?', messageHint:'Share your idea, goals, scope and timeline, if you have one.',
    privacy:'Your contact details are requested only so I can reply to your enquiry.',
    send:'Send message', sending:'Sending…', sent:'Your message has been sent.',
    thanks:'Thank you. I’ll get back to you at the email address you shared.', another:'Write another message',
    error:'Your message could not be sent. Your text is preserved; try again or email me directly.',
    rate:'Too many attempts. Please try again later.', fast:'Please check the form and try again in a few seconds.',
    invalid:'The form could not be validated. Refresh the page and try again.',
    fields:'Please check the highlighted fields.',refresh:'The form session could not be verified. Refresh the page and try again.',
    captcha:'Complete the security check and try again. Your message is preserved.',captchaUnavailable:'The security service is temporarily unavailable. Try again later or email me directly.',
    mail:'Send an email', required:'All fields are required.',
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending' || status === 'sent') return
    const form=event.currentTarget
    const formData = new FormData(form)
    // A neutral DOM name avoids website/company autofill false positives.
    // Keep the existing server-side bot check and API field unchanged.
    formData.set('website',String(formData.get('contact_check')||''))
    formData.delete('contact_check')
    const checked=contactFieldsSchema.safeParse(Object.fromEntries(formData))
    if (!checked.success) {
      const fields=contactErrorFields(checked.error.issues)
      setInvalidFields(fields)
      setErrorCode(fields.length?'invalid_fields':'invalid')
      setStatus('error')
      if (fields.length) requestAnimationFrame(()=>{const control=form.elements.namedItem(fields[0]);if(control instanceof HTMLElement)control.focus()})
      return
    }
    setInvalidFields([])
    if (!deliveryAvailable) {
      if (formData.get('website')) {setErrorCode('invalid');setStatus('error');return}
      const read=(key:string)=>String(formData.get(key)||'')
      const link=contactMailto(email,{name:read('name'),email:read('email'),phone:read('phone'),reason:read('reason'),message:read('message')},locale)
      setDraftLink(link)
      setErrorCode('')
      setStatus('idle')
      return
    }
    if(turnstileSiteKey&&!challengeToken){setErrorCode('captcha_required');setStatus('error');return}
    // Keep challenge tokens out of the deduplication payload: retries use a fresh
    // challenge while reusing the same database submission and email identity.
    const payload = JSON.stringify(Object.fromEntries(formData))
    try {
      if (submission.current.payload !== payload) submission.current = {payload, id:contactRequestId()}
    } catch {setErrorCode('unavailable'); setStatus('error'); return}
    formData.set('requestId', submission.current.id)
    formData.set('startedAt', String(startedAt.current))
    if(turnstileSiteKey)formData.set('cf-turnstile-response',challengeToken)
    setStatus('sending')
    setErrorCode('')
    try {
      const response = await fetch('/api/contact', {method:'POST', body:formData, signal:AbortSignal.timeout(35000)})
      const result = await response.json()
      if (response.ok && result.ok === true) setStatus('sent')
      else {
        const fields=contactFieldNames.filter(field=>Array.isArray(result.fields)&&result.fields.includes(field))
        setInvalidFields(fields)
        setErrorCode(fields.length?'invalid_fields':result.code || 'unavailable')
        setStatus('error')
        if (fields.length) requestAnimationFrame(()=>{const control=form.elements.namedItem(fields[0]);if(control instanceof HTMLElement)control.focus()})
      }
    } catch { setErrorCode('unavailable'); setStatus('error') }
    finally {if(turnstileSiteKey){setChallengeToken('');setChallengeAttempt(previous=>previous+1)}}
  }

  if (status === 'sent') return <section className="contact-form contact-success" aria-live="polite">
    <span className="contact-success-mark" aria-hidden="true"><ArrowIcon direction="up-right"/></span>
    <p className="eyebrow">YKA / {tr ? 'Mesaj alındı' : 'Message received'}</p>
    <h2>{labels.sent}</h2><p>{labels.thanks}</p>
    <button className="section-link" onClick={() => {startedAt.current = 0; submission.current = {payload:'', id:''};setChallengeToken('');setChallengeAttempt(previous=>previous+1); setStatus('idle')}}>{labels.another} <span aria-hidden="true"><ArrowIcon direction="up-right"/></span></button>
  </section>

  const errorText = errorCode === 'rate_limited' ? labels.rate : errorCode === 'too_fast' ? labels.fast : errorCode === 'captcha_unavailable'?labels.captchaUnavailable : ['captcha_required','captcha_failed'].includes(errorCode)?labels.captcha : errorCode === 'invalid_fields' ? labels.fields : errorCode === 'refresh_required' ? labels.refresh : ['invalid','invalid_request'].includes(errorCode) ? labels.invalid : labels.error
  const fieldError=(field:ContactField)=>invalidFields.includes(field)?<small id={`contact-${field}-error`} className="contact-field-error">{fieldMessages[field]}</small>:null
  const fieldAttributes=(field:ContactField)=>({id:`contact-${field}`,'aria-invalid':invalidFields.includes(field)?true:undefined,'aria-describedby':invalidFields.includes(field)?`contact-${field}-error`:undefined})
  return <form className="contact-form" noValidate onSubmit={submit} onFocus={() => {if (!startedAt.current) startedAt.current = Date.now()}} onInput={event=>{const name=(event.target as HTMLInputElement).name;setInvalidFields(previous=>previous.includes(name as ContactField)?previous.filter(field=>field!==name):previous)}} aria-busy={status === 'sending'}>
    <div className="contact-form-heading"><span>{labels.kicker}</span><h2>{labels.title}</h2><p>{labels.required}</p></div>
    {!deliveryAvailable ? <p className="contact-composer-note">{tr?'Bilgilerini yaz; taslağını hazırlayıp e-posta uygulamandan gönderebilirsin.':'Fill in your details, prepare the draft, then send it from your email app.'}</p> : null}
    <label className="contact-honeypot" aria-hidden="true">Leave this field empty<input name="contact_check" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true"/></label>
    <fieldset className="contact-fields" disabled={status === 'sending'}>
      <legend className="contact-honeypot">{tr ? 'İletişim bilgileri ve mesaj' : 'Contact details and message'}</legend>
      <div className="contact-form-row">
        <label className="contact-field"><span>{labels.name}</span><input {...fieldAttributes('name')} name="name" aria-label={labels.name} minLength={2} maxLength={100} required autoComplete="name" placeholder={labels.nameHint}/>{fieldError('name')}</label>
        <label className="contact-field"><span>{labels.email}</span><input {...fieldAttributes('email')} name="email" type="email" aria-label={labels.email} maxLength={200} required autoComplete="email" placeholder={labels.emailHint}/>{fieldError('email')}</label>
      </div>
      <div className="contact-form-row">
        <label className="contact-field"><span>{labels.phone}</span><input {...fieldAttributes('phone')} name="phone" type="tel" inputMode="tel" minLength={7} maxLength={30} required autoComplete="tel" placeholder={labels.phoneHint} aria-label={labels.phone} aria-describedby={`contact-phone-help${invalidFields.includes('phone')?' contact-phone-error':''}`}/><small id="contact-phone-help">{labels.phoneHelp}</small>{fieldError('phone')}</label>
        <label className="contact-field"><span>{labels.reason}</span><select {...fieldAttributes('reason')} name="reason" aria-label={labels.reason} required defaultValue=""><option value="" disabled>{labels.choose}</option><option value="project">{labels.project}</option><option value="opportunity">{labels.role}</option><option value="other">{labels.hello}</option></select>{fieldError('reason')}</label>
      </div>
      <label className="contact-field"><span>{labels.message}</span><textarea {...fieldAttributes('message')} name="message" aria-label={labels.message} minLength={20} maxLength={4000} required rows={4} placeholder={labels.messageHint}/>{fieldError('message')}</label>
    </fieldset>
    {deliveryAvailable&&turnstileSiteKey?<TurnstileWidget key={challengeAttempt} siteKey={turnstileSiteKey} locale={locale} onToken={setChallengeToken}/>:null}
    <div className="contact-form-footer"><p>{labels.privacy} <Link href={`/${locale}/privacy`}>{tr ? 'KVKK aydınlatma metni' : 'Privacy notice'}</Link>. {tr ? 'Bu form pazarlama izni değildir.' : 'This form is not marketing consent.'}</p><button className="contact-submit" disabled={status === 'sending'||Boolean(deliveryAvailable&&turnstileSiteKey&&!challengeToken)}>{status === 'sending' ? labels.sending : deliveryAvailable?labels.send:tr?'E-posta taslağını hazırla':'Prepare email draft'}<span aria-hidden="true"><ArrowIcon direction="up-right"/></span></button></div>
    {draftLink?<p className="contact-draft-ready" role="status">{tr?'Taslağın hazır. ':'Your draft is ready. '}<a href={draftLink}>{tr?'E-posta uygulamasında aç':'Open in your email app'}</a>{tr?' ve gönderimi orada tamamla. Bu aşamada site üzerinden mesaj gönderilmedi.':' and complete sending there. No message has been sent by the site at this stage.'}</p>:null}
    <div aria-live="polite" aria-atomic="true">{status === 'error' ? <p className="contact-error" role="alert">{errorText} <a href={`mailto:${email}`}>{labels.mail} <ArrowIcon direction="up-right"/></a></p> : null}</div>
  </form>
}
