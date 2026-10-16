'use client'

import Script from 'next/script'
import {useEffect,useRef,useState} from 'react'

type Options={sitekey:string;action:string;theme:'dark'|'light';language:'tr'|'en';size:'compact'|'flexible';'response-field':boolean;callback:(token:string)=>void;'expired-callback':()=>void;'error-callback':()=>void;'timeout-callback':()=>void}
type TurnstileApi={render:(container:HTMLElement,options:Options)=>string;remove:(id:string)=>void;reset:(id:string)=>void}
declare global {interface Window {turnstile?:TurnstileApi}}

export function TurnstileWidget({siteKey,locale,onToken}:{siteKey:string;locale:'tr'|'en';onToken:(token:string)=>void}) {
  const container=useRef<HTMLDivElement>(null)
  const widget=useRef<string|null>(null)
  const [ready,setReady]=useState(false)
  const [size,setSize]=useState<'compact'|'flexible'>('compact')
  const [issue,setIssue]=useState<'loading'|'verified'|'error'|'expired'>('loading')
  const tr=locale==='tr'

  useEffect(()=>{
    if (!container.current) return
    const observer=new ResizeObserver(entries=>setSize(entries[0].contentRect.width<300?'compact':'flexible'))
    observer.observe(container.current)
    return ()=>observer.disconnect()
  },[])

  useEffect(()=>{
    const api=window.turnstile
    if (!ready||!api||!container.current) return
    let active=true
    onToken('')
    try {
      widget.current=api.render(container.current,{
        sitekey:siteKey,action:'portfolio_contact',language:locale,size,
        theme:document.documentElement.dataset.theme==='light'?'light':'dark',
        'response-field':false,
        callback:token=>{if(active){onToken(token);setIssue('verified')}},
        'expired-callback':()=>{if(active){onToken('');setIssue('expired')}},
        'error-callback':()=>{if(active){onToken('');setIssue('error')}},
        'timeout-callback':()=>{if(active){onToken('');setIssue('expired')}},
      })
    } catch {queueMicrotask(()=>{if(active){onToken('');setIssue('error')}})}
    return ()=>{active=false;if(widget.current!==null){try{api.remove(widget.current)}catch{/* Widget may already have been removed by the provider. */}widget.current=null}}
  },[ready,siteKey,locale,size,onToken])

  return <section className="contact-captcha" aria-label={tr?'Bot koruması':'Bot protection'}>
    <Script id="contact-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>{onToken('');setIssue('error')}}/>
    <span>{tr?'Güvenlik doğrulaması':'Security verification'}</span>
    <div ref={container} className="contact-captcha-widget"/>
    <p role="status" aria-live="polite">{issue==='verified'?(tr?'Doğrulandı. Mesajını gönderebilirsin.':'Verified. You can send your message.'):issue==='error'?(tr?'Doğrulama yüklenemedi. Bağlantını ve reklam engelleyicini kontrol et veya doğrudan e-posta ile ulaş.':'Verification could not load. Check your connection/ad blocker or email me directly.'):issue==='expired'?(tr?'Doğrulamanın süresi doldu. Lütfen tekrar doğrula.':'Verification expired. Please verify again.'):(tr?'Kısa bir güvenlik kontrolü yapılıyor.':'Running a brief security check.')}</p>
    {ready&&(issue==='error'||issue==='expired')?<button type="button" className="section-link" onClick={()=>{if(widget.current!==null&&window.turnstile){onToken('');setIssue('loading');window.turnstile.reset(widget.current)}}}>{tr?'Yeniden doğrula':'Verify again'}</button>:null}
  </section>
}
