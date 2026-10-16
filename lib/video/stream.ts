import 'server-only'

export const streamConfigured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN)

function streamEndpoint() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!streamConfigured || !account || !/^[a-f0-9]{32}$/i.test(account)) throw new Error('Cloudflare Stream henüz yapılandırılmadı. Kurulum rehberini izleyin.')
  return `https://api.cloudflare.com/client/v4/accounts/${account}/stream`
}

export async function createStreamUpload(size: number, name: string, maxDurationSeconds: number) {
  const metadata = Object.entries({name, maxDurationSeconds: String(maxDurationSeconds), expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()})
    .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`).join(',')
  const response = await fetch(`${streamEndpoint()}?direct_user=true`, {
    method: 'POST', headers: {Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`, 'Tus-Resumable': '1.0.0', 'Upload-Length': String(size), 'Upload-Metadata': metadata},
    signal: AbortSignal.timeout(30000), cache: 'no-store',
  })
  const uploadUrl = response.headers.get('location')
  const videoId = response.headers.get('stream-media-id')
  if (!response.ok || !uploadUrl || !videoId || !/^[a-f0-9]{32}$/i.test(videoId)) throw new Error('Video yükleme bağlantısı oluşturulamadı. Stream hesabını ve kotasını kontrol edin.')
  const url = new URL(uploadUrl)
  if (url.protocol !== 'https:' || !(url.hostname.endsWith('.videodelivery.net') || url.hostname.endsWith('.cloudflarestream.com'))) throw new Error('Geçersiz yükleme adresi.')
  return {uploadUrl, videoId}
}

export async function getStreamVideo(id: string) {
  if (!/^[a-f0-9]{32}$/i.test(id)) throw new Error('Geçersiz video kimliği.')
  const response = await fetch(`${streamEndpoint()}/${id}`, {headers: {Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`}, cache: 'no-store', signal: AbortSignal.timeout(15000)})
  if (!response.ok) throw new Error('Video işleme durumu alınamadı.')
  const data = await response.json() as {success: boolean; result?: {readyToStream?: boolean; status?: {state: string}; thumbnail?: string; preview?: string; duration?: number; input?: {width?: number; height?: number}}}
  if (!data.success || !data.result) throw new Error('Stream geçerli bir video döndürmedi.')
  const video = data.result
  const status = video.readyToStream ? 'ready' : video.status?.state === 'error' ? 'error' : 'processing'
  // The preview origin includes the account's public customer code; no API token is returned.
  const preview = video.preview ? new URL(video.preview) : null
  const playerUrl = preview?.protocol === 'https:' && preview.hostname.endsWith('.cloudflarestream.com') ? `${preview.origin}/${id}/iframe` : `https://iframe.videodelivery.net/${id}`
  return {status, playerUrl, duration: video.duration || null}
}
