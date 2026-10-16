'use client'

import Link from 'next/link'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {generateResumeDraft, saveResumeDraft} from '@/app/admin/resume-actions'
import {resumeDraftSchema, type ResumeDraft} from '@/lib/resume/schema'

type Section = keyof ResumeDraft
type Field = {key: string; label: string; type?: 'date'|'checkbox'|'bullets'|'textarea'}
const sections: {key: Section; label: string; fields: Field[]}[] = [
  {key: 'experiences', label: 'Deneyim', fields: [
    {key:'company',label:'Şirket'}, {key:'job_title_tr',label:'Görev · Türkçe'}, {key:'job_title_en',label:'Görev · İngilizce'},
    {key:'start_date',label:'Başlangıç',type:'date'}, {key:'end_date',label:'Bitiş',type:'date'}, {key:'current_position',label:'Devam ediyor',type:'checkbox'},
    {key:'bullets_tr',label:'Yaptıklarım · Türkçe (her satır bir madde)',type:'bullets'}, {key:'bullets_en',label:'Yaptıklarım · İngilizce (her satır bir madde)',type:'bullets'},
  ]},
  {key:'education',label:'Eğitim',fields:[{key:'institution',label:'Kurum'},{key:'program',label:'Bölüm / program (dosyadaki adı)'},{key:'program_tr',label:'Bölüm · Türkçe'},{key:'program_en',label:'Bölüm · İngilizce'},{key:'start_date',label:'Başlangıç',type:'date'},{key:'end_date',label:'Bitiş',type:'date'},{key:'description_tr',label:'Açıklama · Türkçe',type:'textarea'},{key:'description_en',label:'Açıklama · İngilizce',type:'textarea'}]},
  {key:'volunteering',label:'Gönüllülük',fields:[{key:'organization',label:'Kurum'},{key:'role_tr',label:'Görev · Türkçe'},{key:'role_en',label:'Görev · İngilizce'},{key:'start_date',label:'Başlangıç',type:'date'},{key:'end_date',label:'Bitiş',type:'date'},{key:'bullets_tr',label:'Yaptıklarım · Türkçe (her satır bir madde)',type:'bullets'},{key:'bullets_en',label:'Yaptıklarım · İngilizce (her satır bir madde)',type:'bullets'}]},
]

export function ResumeImport({currentUrl, aiConfigured}: {currentUrl: string; aiConfigured: boolean}) {
  const router = useRouter()
  const [pdfUrl, setPdfUrl] = useState(currentUrl)
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<ResumeDraft>(resumeDraftSchema.parse({}))
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewed, setReviewed] = useState(false)

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setBusy('upload')
    try {
      const data = new FormData(event.currentTarget)
      const response = await fetch('/admin/resume/upload', {method:'POST',body:data})
      const result = await response.json() as {error?: string; url?: string; text?: string; warning?: string}
      if (!response.ok || !result.url) throw new Error(result.error || 'PDF yüklenemedi.')
      setPdfUrl(result.url); setText(result.text || ''); setNotice(result.warning || 'PDF yüklendi. İndirme bağlantısı ve sitedeki PDF görünümü güncellendi. Deneyim kayıtları ayrıca aşağıdaki adımla oluşturulur.')
      router.refresh()
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'PDF yüklenemedi.')}
    finally {setBusy('')}
  }

  async function generate() {
    if (draft.experiences.length + draft.education.length + draft.volunteering.length && !window.confirm('Düzenlediğiniz yerel taslak değiştirilecek. Devam edilsin mi?')) return
    setError(''); setNotice(''); setBusy('generate')
    try {setDraft(await generateResumeDraft(text)); setReviewed(false); setNotice('Taslak hazır. İsimleri, tarihleri ve iki dildeki metinleri PDF ile karşılaştırın. Yıl/ay içeren tarihlerde gün 01 olarak temsil edilir.')}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Taslak oluşturulamadı.')}
    finally {setBusy('')}
  }

  function change(section: Section, index: number, key: string, value: unknown) {
    setReviewed(false)
    setDraft(previous => resumeDraftSchema.parse({...previous,[section]:previous[section].map((row,i) => i === index ? {...row,[key]:value} : row)}))
  }

  async function save() {
    if (!reviewed) return
    setBusy('save'); setError(''); setNotice('')
    try {
      const result = await saveResumeDraft(draft)
      setNotice(`${result.created} yeni taslak oluşturuldu; ${result.skipped} mevcut kayıt korundu. Yayımlamak için ilgili bölümde kayıtları açıp “Published” seçeneğini kullanın.`)
      setDraft(resumeDraftSchema.parse({})); setReviewed(false); router.refresh()
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Kaydedilemedi.')}
    finally {setBusy('')}
  }

  return <div className="admin-stack">
    <section className="admin-panel"><p className="admin-eyebrow">01 · Dosya</p><h2>CV dosyanı ekle</h2><p>PDF sitende görüntülenir ve indirilebilir. Eski dosya silinmez. En fazla 10 MB, 30 sayfa.</p><form onSubmit={upload} className="admin-upload"><label><span>CV · PDF</span><input name="file" type="file" accept="application/pdf" required disabled={Boolean(busy)}/></label><button className="admin-button" disabled={Boolean(busy)}>{busy === 'upload' ? 'Yükleniyor…' : 'PDF yükle / güncelle'}</button></form>{pdfUrl ? <a className="admin-button admin-button-secondary" href={pdfUrl} target="_blank" rel="noreferrer">Mevcut PDF’yi görüntüle ↗</a> : null}</section>
    <section className="admin-panel"><p className="admin-eyebrow">02 · İçerik</p><h2>CV’den sayfaya</h2><p>PDF’den çıkarılan metni referans alarak deneyim, eğitim ve gönüllülük kayıtlarını aşağıdan ekleyebilirsin. Mevcut kayıtları düzenlemek için bölüm bağlantılarını kullan.</p>
      {text ? <details className="resume-source"><summary>PDF’den çıkarılan metin</summary><pre>{text}</pre></details> : null}
      {aiConfigured ? <div className="admin-notice"><p>İsteğe bağlı taslak asistanı: bu düğmeye bastığında CV metni yapılandırılmış yapay zekâ sağlayıcısına gönderilir. Üretilen bilgiler önce burada incelemene açılır.</p><button className="admin-button" type="button" disabled={!text || Boolean(busy)} onClick={generate}>{busy === 'generate' ? 'Taslak hazırlanıyor…' : 'CV’den düzenlenebilir taslak oluştur'}</button></div> : <p className="admin-notice">Otomatik taslak asistanı isteğe bağlıdır; henüz bağlı değil. Aşağıdan kayıt ekleme ve PDF yükleme çalışır. Bağlantı adımları kurulum rehberinde.</p>}
      <div className="resume-manage-links"><Link href="/admin/resume/experience">Mevcut deneyimler ↗</Link><Link href="/admin/resume/education">Eğitim ↗</Link><Link href="/admin/resume/volunteering">Gönüllülük ↗</Link><Link href="/admin/resume/skills">Yetkinlikler ↗</Link><Link href="/admin/resume/languages">Diller ↗</Link></div>
    </section>
    {sections.map(section => <section className="admin-panel" key={section.key}><div className="admin-section-heading"><h2>{section.label}</h2><button className="admin-button admin-button-secondary" type="button" disabled={Boolean(busy)} onClick={() => {setReviewed(false); setDraft(previous => resumeDraftSchema.parse({...previous,[section.key]:[...previous[section.key],{}]}))}}>+ Kayıt ekle</button></div>
      {!draft[section.key].length ? <p className="admin-empty">Yeni taslak yok.</p> : draft[section.key].map((item,index) => {const record = item as Record<string,unknown>; return <fieldset className="resume-draft-entry" disabled={Boolean(busy)} key={index}><legend>{section.label} {index+1}</legend><div className="admin-form-grid">{section.fields.map(field => <label className={`admin-field ${field.type === 'bullets' || field.type === 'textarea' ? 'admin-field-wide' : ''} ${field.type === 'checkbox' ? 'admin-check' : ''}`} key={field.key}><span>{field.label}</span>{field.type === 'bullets' || field.type === 'textarea' ? <textarea rows={4} value={field.type === 'bullets' ? (record[field.key] as string[]).join('\n') : String(record[field.key] || '')} onChange={e => change(section.key,index,field.key,field.type === 'bullets' ? e.target.value.split('\n') : e.target.value)}/> : field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(record[field.key])} onChange={e => change(section.key,index,field.key,e.target.checked)}/> : <input type={field.type === 'date' ? 'date' : 'text'} value={String(record[field.key] || '')} onChange={e => change(section.key,index,field.key,e.target.value)}/>}</label>)}</div><button type="button" className="admin-remove-draft" onClick={() => {setReviewed(false); setDraft(previous => ({...previous,[section.key]:previous[section.key].filter((_,i) => i !== index)}))}}>Bu taslağı kaldır</button></fieldset>})}
    </section>)}
    <section className="admin-panel"><p className="admin-eyebrow">03 · İncele ve kaydet</p><h2>Yayın kontrolü sende</h2><p>Kaydetme işlemi yeni kayıtları yayımlanmamış taslak olarak ekler. Aynı kurum ve başlangıç tarihine sahip mevcut kayıtlar atlanır; üzerlerine yazılmaz. Yayımlamak için kayıtları ilgili bölümden ayrı ayrı onayla.</p><label className="admin-field admin-check"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} disabled={Boolean(busy)}/><span>Bilgileri CV dosyamla karşılaştırdım ve kontrol ettim.</span></label><button className="admin-button" type="button" disabled={!reviewed || Boolean(busy)} onClick={save}>{busy === 'save' ? 'Kaydediliyor…' : 'Kontrol ettiğim kayıtları taslak olarak kaydet'}</button></section>
    {notice ? <p className="admin-notice" role="status">{notice}</p> : null}{error ? <p className="admin-error" role="alert">{error}</p> : null}
  </div>
}
