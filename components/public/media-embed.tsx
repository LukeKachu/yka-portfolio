import {publicAssetUrl} from '@/lib/data/public'
import {VideoPlayer} from './video-player'
import {XEmbed} from './x-embed'
import {socialSource} from '@/lib/video/social'
import {publicationPoster} from '@/lib/video/posters'

type Row = Record<string, unknown>

export function MediaEmbed({links, media = [], title, project = {}, locale = 'tr'}: {links: Row[]; media?: Row[]; title: string; compact?: boolean; project?: Row; locale?: 'tr' | 'en'}) {
  const ordered = [...media].sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  const cover = publicAssetUrl('portfolio-public', project.cover_path || ordered.find(item => item.kind === 'image')?.storage_path) || undefined
  const streamId = String(project.stream_video_id || '')
  if (/^[a-f0-9]{32}$/i.test(streamId) && project.stream_status === 'ready') {
    const storedUrl = String(project.stream_preview_url || '')
    const validUrl = /^https:\/\/(?:customer-[a-z0-9]+\.cloudflarestream\.com|iframe\.videodelivery\.net)\//i.test(storedUrl)
    const thumbnail=validUrl && storedUrl.includes('.cloudflarestream.com/') ? `${new URL(storedUrl).origin}/${streamId}/thumbnails/thumbnail.jpg?time=1s&width=800` : `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=1s&width=800`
    return <VideoPlayer src={validUrl ? storedUrl : `https://iframe.videodelivery.net/${streamId}`} title={title} poster={cover || thumbnail} platform="stream" locale={locale}/>
  }
  const uploaded = ordered.find(item => item.kind === 'video' && item.storage_path)
  if (uploaded) return <div className="media-frame media-stage media-frame-uploaded"><video src={publicAssetUrl('portfolio-public', uploaded.storage_path) || undefined} controls preload="none" poster={cover} playsInline aria-label={title}/></div>
  const playable = [...links].sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)).find(link => socialSource(link.url))
  const website = links.find(link => link.platform === 'website')
  if (!playable && website?.url) {
    const url = String(website.url)
    return <a className="media-frame media-stage media-website" href={url} target="_blank" rel="noreferrer"><span className="media-platform">WEB SITE</span><span className="website-symbol" aria-hidden="true">↗</span><strong>{title}</strong><small>{url.replace(/^https?:\/\//,'').replace(/\/$/,'')}</small></a>
  }
  const url = String(playable?.url || '')
  const source = socialSource(url)
  const poster = cover || publicationPoster(source?.key)
  if (source?.platform === 'x') return <XEmbed key={source.id} id={source.id} title={title} locale={locale}/>
  if (source?.platform === 'tiktok') return <VideoPlayer src={`https://www.tiktok.com/player/v1/${source.id}?autoplay=1&rel=0`} title={title} poster={poster} platform="tiktok" locale={locale} sourceUrl={source.url}/>
  const youtubeId = url.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
  if (youtubeId) return <VideoPlayer src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`} title={title} poster={cover || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} platform="youtube" locale={locale} sourceUrl={`https://www.youtube.com/watch?v=${youtubeId}`}/>
  const instagramId = url.match(/instagram\.com\/(?:[^/]+\/)?(?:reel|p|reels)\/([a-zA-Z0-9_-]+)/i)?.[1]
  if (instagramId) {
    const src=`https://www.instagram.com/reel/${instagramId}/embed/`
    return <VideoPlayer src={src} title={title} poster={cover} platform="instagram" locale={locale} sourceUrl={`https://www.instagram.com/p/${instagramId}/`}/>
  }
  return <div className="media-frame media-stage media-fallback"><span>YKA</span></div>
}
