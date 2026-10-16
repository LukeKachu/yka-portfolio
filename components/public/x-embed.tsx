'use client'

import {useSyncExternalStore} from 'react'
import {useConsent} from './cookie-consent'
import {MediaConsentPlaceholder} from './media-consent-placeholder'

function subscribeTheme(change:()=>void) {
  const observer = new MutationObserver(change)
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
  return () => observer.disconnect()
}
const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
const serverTheme = () => 'light'

export function XEmbed({id,title,locale}: {id:string; title:string; locale:'tr'|'en'}) {
  const {consent} = useConsent()
  const theme = useSyncExternalStore(subscribeTheme,currentTheme,serverTheme)
  if (!consent?.externalMedia) return <MediaConsentPlaceholder platform="X" title={title} locale={locale} sourceUrl={`https://x.com/i/status/${id}`}/>
  // Use X's own isolated embed, the same frame rendered by its widget library.
  // No per-video cover files, ID-to-image registry or parent-page widget script.
  const params = new URLSearchParams({id,dnt:'true',lang:locale,theme,hideThread:'true'})
  return <div className="media-frame media-stage media-stage-x" aria-label={title}>
    <iframe src={`https://platform.twitter.com/embed/Tweet.html?${params}`} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>
    <a className="social-source-link" href={`https://x.com/i/status/${id}`} target="_blank" rel="noreferrer">{locale === 'tr' ? 'X üzerinde izle' : 'Watch on X'} ↗</a>
  </div>
}
