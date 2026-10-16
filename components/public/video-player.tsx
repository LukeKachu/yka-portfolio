'use client'

import {useState} from 'react'
import {useMediaAccess} from './use-media-access'
import {MediaConsentPlaceholder} from './media-consent-placeholder'
import {EmbeddedPlayer} from './embedded-player'

export function VideoPlayer({src, title, previewPoster, platform, locale, sourceUrl}: {src: string; title: string; poster?: string; previewPoster?:string; platform: string; locale: 'tr' | 'en';sourceUrl?:string}) {
  const {enabled,play} = useMediaAccess()
  const [playing, setPlaying] = useState(false)
  const playerUrl = new URL(src)
  if (!enabled) return <MediaConsentPlaceholder platform={platform} title={title} locale={locale} poster={previewPoster} sourceUrl={sourceUrl} onPlay={() => {setPlaying(true);play()}}/>
  if (!playing) playerUrl.searchParams.set('autoplay','0')
  return <EmbeddedPlayer src={playerUrl.toString()} title={title} locale={locale} platform={platform} sourceUrl={sourceUrl} playing={playing}/>
}
