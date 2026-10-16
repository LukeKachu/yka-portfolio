import {RecordForm} from '@/components/admin/record-form'
import {SetupRequired} from '@/components/admin/crud-page'
import {crudConfigs} from '@/components/admin/crud-config'
import {AssetUpload} from '@/components/admin/asset-upload'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {requireAdmin} from '@/lib/auth'

export default async function Page() {
  if (!isSupabaseConfigured) return <SetupRequired />
  const auth = await requireAdmin()
  const {data, error} = await auth!.supabase.from('site_settings').select('*').eq('singleton_key', 'default').maybeSingle()
  if (error) throw new Error(error.message)
  return <section><div className="admin-page-heading"><div><h1>Site Settings</h1><p>Global identity, contact, SEO and current resume PDF.</p></div></div><div className="admin-panel"><RecordForm config={crudConfigs.settings} record={data || {singleton_key: 'default'}} /></div>{data?.id ? <div className="admin-panel"><h2>Files</h2><AssetUpload bucket="resume-public" table="site_settings" column="resume_pdf_path" id={data.id} returnTo="/admin/settings" label="Resume PDF" accept="application/pdf"/><AssetUpload bucket="portfolio-public" table="site_settings" column="profile_photo_path" id={data.id} returnTo="/admin/settings" label="Profile photo" accept="image/*"/><AssetUpload bucket="portfolio-public" table="site_settings" column="social_image_path" id={data.id} returnTo="/admin/settings" label="Social sharing image" accept="image/*"/></div> : <p className="admin-notice">Save settings once before uploading files.</p>}</section>
}
