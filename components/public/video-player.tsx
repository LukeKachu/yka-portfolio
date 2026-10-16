'use client'

import {useState} from 'react'
import {VideoPreview} from './video-preview'
import {useMediaAccess} from './use-media-access'
import {MediaConsentPlaceholder} from './media-consent-placeholder'

export function VideoPlayer({src, title, poster, previewPoster, platform, locale, sourceUrl}: {src: string; title: string; poster?: string; previewPoster?:string; platform: string; locale: 'tr' | 'en';sourceUrl?:string}) {
  const {enabled,play} = useMediaAccess()
  const [playing, setPlaying] = useState(false)
  const [posterFailed,setPosterFailed] = useState(false)
  const playerUrl = new URL(src)
  if (!enabled) return <MediaConsentPlaceholder platform={platform} title={title} locale={locale} poster={previewPoster} sourceUrl={sourceUrl} onPlay={() => {setPlaying(true);play()}}/>
  if (!playing) playerUrl.searchParams.set('autoplay','0')
  return <div className={`media-frame media-stage media-stage-${platform}`}>
    {playing || !poster || posterFailed ? <iframe src={playerUrl.toString()} title={title} loading={playing ? 'eager' : 'lazy'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> : <VideoPreview poster={poster} title={title} platform={platform} locale={locale} onPlay={() => setPlaying(true)} onPosterError={() => setPosterFailed(true)}/>}
  </div>
}
