import {NextResponse} from 'next/server'
import {extractText, getDocumentProxy} from 'unpdf'
import {getAdminSession} from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60
const maxBytes = 10 * 1024 * 1024

export async function POST(request: Request) {
  const {supabase, user, isAdmin} = await getAdminSession()
  if (!supabase || !user || !isAdmin) return NextResponse.json({error: 'Yönetici girişi gerekli.'}, {status: 401})
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({error: 'Geçersiz istek kaynağı.'}, {status: 403})
  if (Number(request.headers.get('content-length') || 0) > maxBytes + 65536) return NextResponse.json({error: 'PDF en fazla 10 MB olabilir.'}, {status: 413})
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size || file.size > maxBytes || file.type !== 'application/pdf') return NextResponse.json({error: 'En fazla 10 MB boyutunda bir PDF seçin.'}, {status: 400})
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (new TextDecoder().decode(bytes.subarray(0,5)) !== '%PDF-') return NextResponse.json({error: 'Dosya geçerli bir PDF değil.'}, {status: 400})
    let text = ''
    let warning = ''
    const document = await getDocumentProxy(bytes.slice())
    try {
      if (document.numPages > 30) return NextResponse.json({error: 'CV en fazla 30 sayfa olabilir.'}, {status: 400})
      const extracted = await extractText(document, {mergePages: true})
      text = extracted.text.slice(0,80000)
      if (text.trim().length < 30) warning = 'Bu PDF taranmış bir görüntü olabilir. Dosya görüntülenebilir, fakat metin çıkarılamadı. Deneyimleri elle ekleyebilirsiniz.'
    } finally {await document.loadingTask.destroy()}
    const path = `cv/${user.id}/${crypto.randomUUID()}.pdf`
    const {error: uploadError} = await supabase.storage.from('resume-public').upload(path, bytes, {contentType: 'application/pdf', upsert: false})
    if (uploadError) return NextResponse.json({error: 'PDF yüklenemedi. resume-public bucket ve yönetici izinlerini kontrol edin.'}, {status: 502})
    const {error: saveError} = await supabase.from('site_settings').upsert({singleton_key: 'default', resume_pdf_path: path}, {onConflict: 'singleton_key'})
    if (saveError) return NextResponse.json({error: 'Dosya yüklendi fakat site ayarına bağlanamadı. Site ayarlarını kontrol edin.'}, {status: 502})
    const {data} = supabase.storage.from('resume-public').getPublicUrl(path)
    return NextResponse.json({text, url: data.publicUrl, warning}, {headers: {'Cache-Control': 'no-store'}})
  } catch {return NextResponse.json({error: 'PDF okunamadı. Şifresiz, geçerli bir PDF ile tekrar deneyin.'}, {status: 400})}
}
