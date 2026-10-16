'use client'

import {useEffect} from 'react'
import {useConsent} from './cookie-consent'

export function ThemeToggle({locale}:{locale:'tr'|'en'}){
  const {consent,ready} = useConsent()
  const persistent = Boolean(consent?.preferences)
  useEffect(() => {
    if (!ready) return
    try {const saved=persistent ? localStorage.getItem('yka-theme') : null; if(!persistent)localStorage.removeItem('yka-theme'); document.documentElement.dataset.theme=saved==='dark'||saved==='light'?saved:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'} catch {document.documentElement.dataset.theme='light'}
  }, [persistent,ready])
  function toggle(){const next=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=next?'dark':'light';if(persistent)try{localStorage.setItem('yka-theme',next?'dark':'light')}catch{/* The theme works even if browser storage is unavailable. */}}
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={locale==='tr'?'Renk temasını değiştir':'Change color theme'} title={locale==='tr'?'Gece / gündüz':'Dark / light'}><span className="theme-icon-light" aria-hidden="true">●</span><span className="theme-icon-dark" aria-hidden="true">☀</span></button>
}
