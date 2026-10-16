'use client'
import {ArrowIcon} from '@/components/public/arrow-icon'

import Image from 'next/image'

export function VideoPreview({poster,title,platform,locale,onPlay,onPosterError}: {poster:string; title:string; platform:string; locale:'tr'|'en'; onPlay:()=>void; onPosterError?:()=>void}) {
  return <button className="media-play" type="button" aria-label={`${title} — ${locale === 'tr' ? 'Videoyu oynat' : 'Play video'}`} onClick={onPlay}>
    <Image className="media-poster" src={poster} alt="" fill unoptimized sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" onError={onPosterError || onPlay}/>
    <span className="media-platform">{platform === 'stream' ? 'YKA FILM' : platform.toUpperCase()}</span>
    <span className="media-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false"><path d="m9 5 11 7-11 7z"/></svg></span><span className="media-play-label">{locale === 'tr' ? 'Videoyu izle' : 'Watch video'} <span><ArrowIcon direction="up-right"/></span></span>
  </button>
}
