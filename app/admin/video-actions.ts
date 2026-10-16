'use server'

import {z} from 'zod'
import {revalidatePath} from 'next/cache'
import {requireAdmin} from '@/lib/auth'
import {createStreamUpload, getStreamVideo} from '@/lib/video/stream'
import {socialSource} from '@/lib/video/social'

function refresh() {
  revalidatePath('/[locale]', 'layout')
  revalidatePath('/admin/projects')
}

export async function beginVideoUpload(input: {projectId: string; name: string; size: number; maxDurationSeconds: number}) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  const values = z.object({projectId: z.uuid(), name: z.string().min(1).max(255), size: z.number().int().positive().max(30 * 1024 ** 3), maxDurationSeconds: z.number().int().min(1).max(36000)}).parse(input)
  const {data: project, error} = await auth.supabase.from('projects').select('id,pending_stream_video_id,pending_stream_status').eq('id', values.projectId).single()
  if (error) throw new Error('Video alanları hazır değil. Önce 202610160005_video_and_resume.sql migration dosyasını uygulayın.')
  if (project.pending_stream_video_id) throw new Error('Bu projede tamamlanmamış bir yükleme var. Aynı dosyayla devam edin veya durumu kontrol edin.')
  const {error: claimError} = await auth.supabase.from('projects').update({pending_stream_status:'uploading'}).eq('id',values.projectId).is('pending_stream_video_id',null).or('pending_stream_status.is.null,pending_stream_status.eq.error').select('id').single()
  if (claimError) throw new Error('Bu proje için yükleme zaten başlatılmış. Aynı tarayıcı ve dosyayla devam edin.')
  let upload
  try {upload = await createStreamUpload(values.size, values.name, values.maxDurationSeconds)}
  catch (reason) {await auth.supabase.from('projects').update({pending_stream_status:null}).eq('id',values.projectId).is('pending_stream_video_id',null); throw reason}
  const {error: saveError} = await auth.supabase.from('projects').update({pending_stream_video_id: upload.videoId, pending_stream_status: 'uploading'}).eq('id', values.projectId).is('pending_stream_video_id', null).select('id').single()
  if (saveError) throw new Error('Yükleme kaydı oluşturulamadı. Tekrar denemeden önce Stream hesabını kontrol edin.')
  return upload
}

export async function syncVideoStatus(projectId: string) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  z.uuid().parse(projectId)
  const {data, error} = await auth.supabase.from('projects').select('stream_video_id,pending_stream_video_id,stream_previous_video_ids').eq('id', projectId).single()
  const videoId = data?.pending_stream_video_id || data?.stream_video_id
  if (error || !videoId) throw new Error('Video kaydı bulunamadı.')
  const video = await getStreamVideo(videoId)
  const patch = data.pending_stream_video_id && video.status !== 'ready'
    ? {pending_stream_status:video.status}
    : {stream_video_id:videoId,stream_status:video.status,stream_preview_url:video.playerUrl,stream_duration_seconds:video.duration,
      ...(data.pending_stream_video_id ? {pending_stream_video_id:null,pending_stream_status:null,stream_previous_video_ids:Array.from(new Set([...(data.stream_previous_video_ids || []),...(data.stream_video_id ? [data.stream_video_id] : [])]))} : {})}
  const {error: updateError} = await auth.supabase.from('projects').update(patch).eq('id', projectId).eq(data.pending_stream_video_id ? 'pending_stream_video_id' : 'stream_video_id', videoId).select('id').single()
  if (updateError) throw new Error('Video durumu kaydedilemedi.')
  refresh()
  revalidatePath(`/admin/projects/${projectId}`)
  return video.status
}

export async function saveVideoMetrics(input: {projectId: string; views: string; platform: string; date: string; url: string}) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  const values = z.object({projectId: z.uuid(), views: z.string().regex(/^\d{1,15}$/).transform(Number).refine(Number.isSafeInteger), platform: z.enum(['instagram','youtube','tiktok','campaign','x']), date: z.iso.date(), url: z.union([z.literal(''), z.url().refine(value => /^https?:\/\//.test(value))])}).parse(input)
  if (values.date > new Date().toISOString().slice(0,10)) throw new Error('Ölçüm tarihi gelecekte olamaz.')
  const source = socialSource(values.url)
  if (values.platform === 'x' && source?.platform !== 'x') throw new Error('X gönderi görüntülenmesi için geçerli X gönderi bağlantısı gereklidir.')
  if (values.platform !== 'x' && source && source.platform !== values.platform) throw new Error('Kaynak bağlantısı seçilen platformla eşleşmiyor.')
  const patch = values.platform === 'x'
    ? {source_impressions:values.views,source_impressions_date:values.date,source_impressions_url:source!.url}
    : {source_views: values.views, source_views_platform: values.platform, source_views_date: values.date, source_views_url: values.url || null}
  const {error} = await auth.supabase.from('projects').update(patch).eq('id', values.projectId).select('id').single()
  if (error) throw new Error('İzlenme kaydedilemedi. Video migration dosyasının uygulandığından emin olun.')
  refresh()
  revalidatePath(`/admin/projects/${values.projectId}`)
}

export async function archivePendingVideo(projectId: string) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  z.uuid().parse(projectId)
  const {data,error} = await auth.supabase.from('projects').select('pending_stream_video_id,stream_previous_video_ids').eq('id',projectId).single()
  if (error) throw new Error('Yükleme bilgisi okunamadı.')
  const history = Array.from(new Set([...(data.stream_previous_video_ids || []),...(data.pending_stream_video_id ? [data.pending_stream_video_id] : [])]))
  const {error: updateError} = await auth.supabase.from('projects').update({pending_stream_video_id:null,pending_stream_status:null,stream_previous_video_ids:history}).eq('id',projectId).select('id').single()
  if (updateError) throw new Error('Yükleme arşivlenemedi.')
  revalidatePath(`/admin/projects/${projectId}`)
}
