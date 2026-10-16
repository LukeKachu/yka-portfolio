'use client'
import {ArrowIcon} from '@/components/public/arrow-icon'

import {useSyncExternalStore} from 'react'
import {useMediaAccess} from './use-media-access'
import {MediaConsentPlaceholder} from './media-consent-placeholder'

function subscribeTheme(change:()=>void) {
  const observer = new MutationObserver(change)
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
  return () => observer.disconnect()
}
const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
const serverTheme = () => 'light'

export function XEmbed({id,title,locale,poster}: {id:string; title:string; locale:'tr'|'en';poster?:string}) {
  const {enabled,play} = useMediaAccess()
  const theme = useSyncExternalStore(subscribeTheme,currentTheme,serverTheme)
  if (!enabled) return <MediaConsentPlaceholder platform="x" title={title} locale={locale} poster={poster} sourceUrl={`https://x.com/i/status/${id}`} onPlay={play}/>
  // Use X's own isolated embed, the same frame rendered by its widget library.
  // No per-video cover files, ID-to-image registry or parent-page widget script.
  const params = new URLSearchParams({id,dnt:'true',lang:locale,theme,hideThread:'true'})
  return <div className="media-frame media-stage media-stage-x" aria-label={title}>
    <iframe src={`https://platform.twitter.com/embed/Tweet.html?${params}`} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>
    <a className="social-source-link" href={`https://x.com/i/status/${id}`} target="_blank" rel="noreferrer">{locale === 'tr' ? 'X üzerinde izle' : 'Watch on X'} <ArrowIcon direction="up-right"/></a>
  </div>
}
