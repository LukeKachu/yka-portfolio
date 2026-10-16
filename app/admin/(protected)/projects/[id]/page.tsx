import {notFound} from 'next/navigation'
import {ProjectForm} from '@/components/admin/project-form'
import {SetupRequired} from '@/components/admin/crud-page'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {requireAdmin} from '@/lib/auth'
import {ProjectMedia} from '@/components/admin/project-media'
import {StreamUpload} from '@/components/admin/stream-upload'
import {VideoMetrics} from '@/components/admin/video-metrics'
import {streamConfigured} from '@/lib/video/stream'

export default async function EditProjectPage({params}: {params: Promise<{id: string}>}) {
  if (!isSupabaseConfigured) return <SetupRequired />
  const {id} = await params
  const auth = await requireAdmin()
  const [projectResult, brandsResult, typesResult, selectedResult, rolesResult, linksResult, mediaResult] = await Promise.all([
    auth!.supabase.from('projects').select('*').eq('id', id).maybeSingle(), auth!.supabase.from('brands').select('id,name').order('sort_order'),
    auth!.supabase.from('work_types').select('id,internal_name').order('sort_order'), auth!.supabase.from('project_work_types').select('work_type_id').eq('project_id', id),
    auth!.supabase.from('project_roles').select('*').eq('project_id', id).order('sort_order'), auth!.supabase.from('project_links').select('*').eq('project_id', id).order('sort_order'),
    auth!.supabase.from('project_media').select('*').eq('project_id', id).order('sort_order'),
  ])
  if (!projectResult.data) notFound()
  return <section><div className="admin-page-heading"><div><h1>{projectResult.data.internal_name}</h1><p>Önce video ve sonuçlar; ardından metin, yayın durumu ve görseller.</p></div></div><StreamUpload projectId={id} configured={streamConfigured} videoId={projectResult.data.stream_video_id || undefined} initialStatus={projectResult.data.stream_status || undefined} pendingVideoId={projectResult.data.pending_stream_video_id || undefined} pendingStatus={projectResult.data.pending_stream_status || undefined}/><VideoMetrics project={projectResult.data}/><details className="admin-panel"><summary>03 · Proje metinleri ve yayın ayarları</summary><ProjectForm project={projectResult.data} brands={brandsResult.data || []} workTypes={typesResult.data || []} selectedWorkTypes={(selectedResult.data || []).map((row) => row.work_type_id)} roles={rolesResult.data || []} links={linksResult.data || []} /></details><details className="admin-panel"><summary>04 · Görseller ve mevcut dosya yüklemeleri</summary><ProjectMedia projectId={id} media={mediaResult.data || []}/></details></section>
}
