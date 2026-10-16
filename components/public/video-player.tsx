'use client'

import {useState} from 'react'
import {VideoPreview} from './video-preview'
import {useConsent} from './cookie-consent'
import {MediaConsentPlaceholder} from './media-consent-placeholder'

export function VideoPlayer({src, title, poster, platform, locale, sourceUrl}: {src: string; title: string; poster?: string; platform: string; locale: 'tr' | 'en';sourceUrl?:string}) {
  const {consent} = useConsent()
  const [playing, setPlaying] = useState(false)
  const [posterFailed,setPosterFailed] = useState(false)
  const playerUrl = new URL(src)
  if (!consent?.externalMedia) return <MediaConsentPlaceholder platform={platform} title={title} locale={locale} poster={poster} sourceUrl={sourceUrl}/>
  if (!playing) playerUrl.searchParams.set('autoplay','0')
  return <div className={`media-frame media-stage media-stage-${platform}`}>
    {playing || !poster || posterFailed ? <iframe src={playerUrl.toString()} title={title} loading={playing ? 'eager' : 'lazy'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> : <VideoPreview poster={poster} title={title} platform={platform} locale={locale} onPlay={() => setPlaying(true)} onPosterError={() => setPosterFailed(true)}/>}
  </div>
}
