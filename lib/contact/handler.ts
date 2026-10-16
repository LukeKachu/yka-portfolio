import {createHash} from 'node:crypto'
import {z} from 'zod'
import {contactSchema,contactErrorFields,type ContactField} from './schema.ts'
export {contactSchema} from './schema.ts'

type Config = {apiKey?:string; from?:string; siteUrl?:string}
type RpcResult = {data:unknown; error:{message:string}|null}
type Dependencies = {config:Config; save:(args:Record<string,string|null>)=>PromiseLike<RpcResult>; send?:typeof fetch}

export function contactEmailConfigured(config:Config) {
  const from = config.from?.trim() || ''
  const address = from.match(/<([^<>]+)>$/)?.[1] || from
  return Boolean(config.apiKey?.trim() && !/[\r\n]/.test(from) && z.email().safeParse(address).success)
}

function reply(code:string, status:number,fields?:ContactField[]) {
  return Response.json({ok:false,code,...(fields?.length?{fields}:{})}, {status,headers:{'Cache-Control':'no-store',...(status === 429 ? {'Retry-After':'3600'} : {})}})
}

async function boundedForm(request:Request) {
  if (!request.body || Number(request.headers.get('content-length')) > 32768) throw new Error('body')
  const reader = request.body.getReader()
  const chunks:Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const {done,value} = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 32768) {await reader.cancel(); throw new Error('body')}
      chunks.push(value)
    }
  } finally {reader.releaseLock()}
  return new Response(Buffer.concat(chunks), {headers:{'Content-Type':request.headers.get('content-type') || ''}}).formData()
}

const escapeHtml = (value:string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))

// The route injects server-only configuration. Neither credentials nor provider errors are returned to the browser.
export async function handleContact(request:Request, {config,save,send=fetch}:Dependencies) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [new URL(request.url).origin]
  if (config.siteUrl) {try {allowedOrigins.push(new URL(config.siteUrl).origin)} catch {/* Ignore an invalid optional site URL. */}}
  if (!origin || !allowedOrigins.includes(origin) || request.headers.get('sec-fetch-site') === 'cross-site') return reply('forbidden',403)
  let form:FormData
  try {form = await boundedForm(request)} catch {return reply('invalid_request',400)}
  const parsed = contactSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) {
    // Return only public field names, never submitted values, Zod details or bot checks.
    if (parsed.error.issues.some(issue=>issue.path[0]==='website')) return reply('invalid',400)
    const fields=contactErrorFields(parsed.error.issues)
    return fields.length?reply('invalid',400,fields):reply('refresh_required',400)
  }
  const data = parsed.data
  const elapsed = Date.now() - data.startedAt
  if (elapsed < 2500 || elapsed > 86400000) return reply('too_fast',400)
  if (!contactEmailConfigured(config)) return reply('unavailable',503)

  // Cloudflare supplies this verified client address; prefer it to a forwarded chain.
  const ip = request.headers.get('cf-connecting-ip')?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const userAgent = (request.headers.get('user-agent') || '').slice(0,500)
  const fingerprint = createHash('sha256').update(`${ip}|${userAgent}`).digest('hex')
  let saved:RpcResult
  try {
    saved = await save({p_name:data.name,p_email:data.email,p_phone:data.phone,p_reason:data.reason,p_message:data.message,
      p_fingerprint:fingerprint,p_user_agent:userAgent,p_request_id:data.requestId})
  } catch {return reply('unavailable',503)}
  if (saved.error) return reply(saved.error.message.includes('Rate limit') ? 'rate_limited' : 'unavailable', saved.error.message.includes('Rate limit') ? 429 : 503)
  if (!z.uuid().safeParse(saved.data).success) return reply('unavailable',503)

  const reason = {project:'Proje / iş birliği',opportunity:'İş fırsatı',other:'Tanışma / diğer'}[data.reason]
  const text = `YKA — Yeni iletişim mesajı\n\nAd soyad: ${data.name}\nE-posta: ${data.email}\nTelefon: ${data.phone}\nKonu: ${reason}\n\n${data.message}\n\nKayıt: ${saved.data}`
  const html = `<div style="background:#f5f4ef;padding:32px;font-family:Arial,sans-serif;color:#19221b"><div style="max-width:600px;margin:auto"><p style="color:#435f3d;font-weight:bold;letter-spacing:2px">YKA / İLETİŞİM</p><h1 style="font-size:26px">Yeni bir mesajın var.</h1><p><b>Ad soyad:</b> ${escapeHtml(data.name)}<br><b>E-posta:</b> ${escapeHtml(data.email)}<br><b>Telefon:</b> ${escapeHtml(data.phone)}<br><b>Konu:</b> ${reason}</p><div style="padding:24px;background:#fcfbf7;border:1px solid #d6d8cd;white-space:pre-wrap;line-height:1.7">${escapeHtml(data.message)}</div><p style="font-size:12px;color:#686e64">Bu e-postayı yanıtlayarak doğrudan ziyaretçiye dönüş yapabilirsin.<br>Kayıt: ${saved.data}</p></div></div>`
  try {
    const response = await send('https://api.resend.com/emails', {
      method:'POST',signal:AbortSignal.timeout(12000),
      headers:{Authorization:`Bearer ${config.apiKey!.trim()}`,'Content-Type':'application/json','Idempotency-Key':`contact/${saved.data}`},
      body:JSON.stringify({from:config.from!.trim(),to:['yusufkerimaltay77@gmail.com'],reply_to:data.email,subject:`YKA | ${reason}`,text,html}),
    })
    if (!response.ok) return reply('unavailable',503)
    const result = await response.json()
    if (!z.uuid().safeParse(result.id).success) return reply('unavailable',503)
  } catch {return reply('unavailable',503)}
  // Success means the email provider accepted the message, not a guarantee of inbox delivery.
  return Response.json({ok:true}, {headers:{'Cache-Control':'no-store'}})
}
