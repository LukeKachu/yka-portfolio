'use client'

import {useState} from 'react'
import {saveVideoMetrics} from '@/app/admin/video-actions'

export function VideoMetrics({project}: {project: Record<string, unknown>}) {
  const xMetric = project.source_views == null && project.source_impressions != null
  const prefix = xMetric ? 'source_impressions' : 'source_views'
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('')
    const data = new FormData(event.currentTarget)
    try {
      await saveVideoMetrics({projectId: String(project.id), views: String(data.get('views')), platform: String(data.get('platform')), date: String(data.get('date')), url: String(data.get('url') || '')})
      setMessage('İzlenme bilgisi kaydedildi. Yayımlanmış projede görünür.')
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Kaydedilemedi.')}
    finally {setBusy(false)}
  }
  return <section className="admin-panel"><p className="admin-eyebrow">02 · Sonuçlar</p><h2>İzlenme / görüntülenme</h2><p>Bu değerler çalışma kartlarında tek tek gösterilmez; yalnızca sayfa üstündeki toplamı besler. Kaynak ve ölçüm tarihini burada düzenleyebilirsiniz. X gönderi görüntülenmesi video izlenmesinden ayrı saklanır. Sayaçlar otomatik güncellenmez. Aynı sayıyı birden fazla projeye girmeyin.</p>
    <form className="admin-form" onSubmit={save}><div className="admin-form-grid">
      <label className="admin-field"><span>İzlenme / görüntülenme sayısı</span><input name="views" type="number" min="0" max="999999999999999" step="1" required defaultValue={project[prefix] == null ? '' : String(project[prefix])}/></label>
      <label className="admin-field"><span>Kaynak</span><select name="platform" defaultValue={xMetric ? 'x' : String(project.source_views_platform || 'instagram')}><option value="instagram">Instagram video izlenmesi</option><option value="youtube">YouTube video izlenmesi</option><option value="tiktok">TikTok video izlenmesi</option><option value="campaign">Reklam kampanyası raporu (video izlenmesi)</option><option value="x">X gönderi görüntülenmesi (video oynatması değil)</option></select></label>
      <label className="admin-field"><span>Ölçüm tarihi</span><input name="date" type="date" required max={new Date().toISOString().slice(0,10)} defaultValue={String(project[`${prefix}_date`] || '')}/></label>
      <label className="admin-field"><span>Herkese açık kaynak bağlantısı (X için zorunlu)</span><input name="url" type="url" placeholder="https://…" defaultValue={String(project[`${prefix}_url`] || '')}/></label>
    </div><small>Özel rapor, reklam hesabı veya erişim anahtarı içeren bağlantı eklemeyin.</small><button className="admin-button" disabled={busy}>{busy ? 'Kaydediliyor…' : 'İzlenmeyi kaydet'}</button></form>
    {message ? <p className="admin-notice" role="status">{message}</p> : null}{error ? <p className="admin-error" role="alert">{error}</p> : null}
  </section>
}
