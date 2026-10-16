type Row = Record<string, unknown>

// Platform IDs, not tracking parameters or alternate /p/ and /reel/ paths,
// identify a publication. Never execute pasted embed markup.
export function socialSource(value: unknown) {
  try {
    const url = new URL(String(value))
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    let id: string | undefined
    if (host === 'instagram.com' && (id = url.pathname.match(/^\/(?:[^/]+\/)?(?:p|reel|reels)\/([\w-]+)\/?$/)?.[1]))
      return {platform:'instagram', id, key:`instagram:${id}`, url:`https://www.instagram.com/p/${id}/`}
    if (['x.com','twitter.com'].includes(host) && (id = url.pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/)?.[1]))
      return {platform:'x', id, key:`x:${id}`, url:`https://x.com/i/status/${id}`}
    if (host === 'tiktok.com' && (id = url.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/)?.[1]))
      return {platform:'tiktok', id, key:`tiktok:${id}`, url:`https://www.tiktok.com${url.pathname.replace(/\/$/,'')}`}
    if ((host === 'youtube.com' || host === 'youtu.be') && (id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)\/?$/)?.[1]) && /^[\w-]{11}$/.test(id))
      return {platform:'youtube', id, key:`youtube:${id}`, url:`https://www.youtube.com/watch?v=${id}`}
  } catch { /* An invalid URL is not a playable social source. */ }
  return null
}

export function isVideoProject(project: Row) {
  return project.stream_status === 'ready'
    || ((project.project_media as Row[]) || []).some(item => item.kind === 'video')
    || ((project.project_links as Row[]) || []).some(link => socialSource(link.url))
}

export function metricCount(value: unknown): bigint | null {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return null
  if (!/^(0|[1-9]\d*)$/.test(String(value ?? ''))) return null
  return BigInt(String(value))
}

export function metricDate(value: unknown): string | null {
  const date = String(value || '')
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date ? date : null
}

export function compactReach(total:bigint, locale:'tr'|'en') {
  const scale = total >= 1_000_000_000n ? 1_000_000_000n : total >= 1_000_000n ? 1_000_000n : total >= 1_000n ? 1_000n : 1n
  const units = {1000000000:'B',1000000:'M',1000:'K',1:''}
  if (scale === 1n) return {value:new Intl.NumberFormat(locale).format(total),unit:'',plus:false}
  // A quiet milestone, rounded down so it never overstates recorded reach.
  return {value:new Intl.NumberFormat(locale).format(total/scale),unit:units[Number(scale) as keyof typeof units],plus:total%scale > 0n}
}

export function summarizeReach(projects: Row[]) {
  const entries = new Map<string, {count:bigint; date:string; kind:'video'|'post'}>()
  const videos = projects.filter(project => project.published === true && isVideoProject(project))
  let measured = 0
  for (const project of videos) {
    let hasMetric = false
    for (const kind of ['video','post'] as const) {
      const prefix = kind === 'video' ? 'source_views' : 'source_impressions'
      const count = metricCount(project[prefix])
      const date = metricDate(project[`${prefix}_date`])
      if (count === null || !date) continue
      const platform = String(project.source_views_platform)
      const source = socialSource(project[`${prefix}_url`])
      if (kind === 'video' && !['instagram','youtube','tiktok','campaign'].includes(platform)) continue
      if (kind === 'video' && source && source.platform !== platform) continue
      if (kind === 'post' && source?.platform !== 'x') continue
      const key = `${kind}:${source?.key || String(project.id)}`
      const previous = entries.get(key)
      // A duplicate publication is one snapshot, not extra reach.
      if (!previous || date > previous.date || (date === previous.date && count > previous.count)) entries.set(key,{count,date,kind})
      hasMetric = true
    }
    if (hasMetric) measured++
  }
  const snapshots = [...entries.values()]
  const videoViews = snapshots.filter(item => item.kind === 'video').reduce((sum,item) => sum + item.count,0n)
  const postViews = snapshots.filter(item => item.kind === 'post').reduce((sum,item) => sum + item.count,0n)
  const dates = snapshots.map(item => item.date).sort()
  return {total:videoViews + postViews, videoViews, postViews, measured, publications:videos.length, missing:videos.length - measured, dates, hasMetrics:snapshots.length > 0}
}
