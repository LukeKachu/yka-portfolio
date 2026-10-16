'use client'
import {ArrowIcon} from '@/components/public/arrow-icon'

import Image from 'next/image'
import {useId,useState} from 'react'

export function MediaConsentPlaceholder({platform,title,locale,poster,sourceUrl,onPlay}:{platform:string;title:string;locale:'tr'|'en';poster?:string;sourceUrl?:string;onPlay:()=>void}) {
  const infoId = useId()
  const [failed,setFailed] = useState(false)
  const hasPoster = Boolean(poster && !failed)
  const tr = locale === 'tr'
  const provider = platform === 'stream' ? 'Cloudflare Stream' : platform === 'x' ? 'X' : platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : 'Instagram'
  return <div className={`media-frame media-click-preview ${hasPoster ? 'media-click-preview-with-poster' : ''}`} aria-label={title}>
    {hasPoster ? <Image src={poster!} alt="" fill unoptimized className="media-click-poster" sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" onError={() => setFailed(true)}/> : null}
    <button className="media-click-play" type="button" onClick={onPlay} aria-label={`${title} — ${tr ? 'Videoyu izle' : 'Watch video'}`} aria-describedby={infoId}>
      <span className="media-platform">{provider}</span>
      <span className="media-click-center"><span className="media-click-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" focusable="false"><path d="m9 5 11 7-11 7z"/></svg></span>{!hasPoster ? <span className="media-click-title">{title}</span> : null}</span>
      <span className="media-click-label">{tr ? 'Videoyu izle' : 'Watch video'}<ArrowIcon/></span>
    </button>
    <div className="media-click-note"><p id={infoId}>{tr ? `Oynatınca yalnızca bu video için ${provider}’a bağlanırsın; IP/cihaz bilgileri paylaşılabilir ve sağlayıcı çerez kullanabilir.` : `Playing connects to ${provider} for this video only; IP/device information may be shared and the provider may use cookies.`}</p>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{tr ? 'Kaynak' : 'Source'}<ArrowIcon/></a> : null}</div>
  </div>
}
