import Link from 'next/link'
import {requireAdmin} from '@/lib/auth'
import {publicAssetUrl} from '@/lib/data/public'
import {resumeAiConfigured} from '@/lib/resume/extract'
import {ResumeImport} from '@/components/admin/resume-import'
const sections = [['Deneyim','experience'],['Eğitim','education'],['Gönüllülük','volunteering'],['Yetkinlikler','skills'],['Diller','languages']]
export default async function Page() {
  const auth = await requireAdmin()
  const result = auth ? await auth.supabase.from('site_settings').select('resume_pdf_path').eq('singleton_key','default').maybeSingle() : null
  if (result?.error) throw new Error('CV ayarları okunamadı.')
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">YKA · Özgeçmiş</p><h1>CV ve deneyimler</h1><p>Dosyanı yükle, bilgileri kontrol et, hazır olduğunda yayımla.</p></div></div><div className="admin-grid">{sections.map(([label,path]) => <Link className="admin-card" href={`/admin/resume/${path}`} key={path}><h2>{label}</h2><span>Kayıtları düzenle →</span></Link>)}</div>{auth ? <ResumeImport currentUrl={publicAssetUrl('resume-public',result?.data?.resume_pdf_path) || '/cv/Yusuf-Kerim-Altay-Social-Media-CV.pdf'} aiConfigured={resumeAiConfigured}/> : <p className="admin-notice">Önce Supabase bağlantısını yapılandırın.</p>}</section>
}
