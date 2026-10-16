'use client'

import Image from 'next/image'
import {useConsent} from './cookie-consent'
import {localPoster} from '@/lib/privacy/consent'

export function MediaConsentPlaceholder({platform,title,locale,poster,sourceUrl}:{platform:string;title:string;locale:'tr'|'en';poster?:string;sourceUrl?:string}) {
  const {openSettings} = useConsent()
  const tr = locale === 'tr'
  return <div className={`media-frame media-consent ${localPoster(poster) ? 'media-consent-with-poster' : ''}`} aria-label={title}>
    {localPoster(poster) ? <Image src={poster!} alt="" fill unoptimized className="media-consent-poster" sizes="(max-width: 520px) 100vw, 33vw"/> : null}
    <span className="media-platform">{platform === 'stream' ? 'CLOUDFLARE STREAM' : platform.toUpperCase()}</span>
    <div className="media-consent-copy"><span className="media-consent-symbol" aria-hidden="true">▷</span><h3>{tr ? 'İzin verirsen, burada.' : 'Here, with your permission.'}</h3><p>{tr ? 'Oynatıcı ve uzak önizleme, yalnızca harici medya izniyle yüklenir.' : 'The external player and remote preview load only with your permission.'}</p><button type="button" onClick={openSettings}>{tr ? 'Medya tercihlerini aç' : 'Manage media preferences'} <span aria-hidden="true">↗</span></button></div>
    {sourceUrl ? <a className="media-consent-source" href={sourceUrl} target="_blank" rel="noopener noreferrer">{tr ? 'Kaynağında aç' : 'Open original'} ↗</a> : <span className="media-consent-source">{tr ? 'İzin verilmeden yüklenmez' : 'Not loaded without permission'}</span>}
  </div>
}
