'use client'

import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import * as tus from 'tus-js-client'
import {archivePendingVideo, beginVideoUpload, syncVideoStatus} from '@/app/admin/video-actions'

export function StreamUpload({projectId, configured, videoId, initialStatus, pendingVideoId, pendingStatus}: {projectId: string; configured: boolean; videoId?: string; initialStatus?: string; pendingVideoId?: string; pendingStatus?: string}) {
  const router = useRouter()
  const upload = useRef<tus.Upload | null>(null)
  const [status, setStatus] = useState(pendingStatus || (initialStatus !== 'ready' ? initialStatus : '') || '')
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [duration, setDuration] = useState(10)
  useEffect(() => () => {void upload.current?.abort()}, [])
  useEffect(() => {
    if (status !== 'processing') return
    let active = true
    const timer = setInterval(async () => {
      try {const next = await syncVideoStatus(projectId); if (active) {setStatus(next); if (next === 'ready') router.refresh()}}
      catch {if (active) {setError('Durum kontrolü kesildi. “Durumu kontrol et” ile tekrar deneyin.'); clearInterval(timer)}}
    }, 8000)
    return () => {active = false; clearInterval(timer)}
  }, [status, projectId, router])
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('video')
    if (!(file instanceof File) || !file.size || !/^video\//.test(file.type)) {setError('Lütfen bir video dosyası seçin.'); return}
    setError(''); setBusy(true); setPaused(false)
    try {
      const uploader = new tus.Upload(file, {
        fingerprint: async () => `yka-stream-${projectId}-${file.name}-${file.size}-${file.lastModified}`,
        retryDelays: [0, 3000, 5000, 10000, 20000], chunkSize: 50 * 1024 * 1024, removeFingerprintOnSuccess: true,
        onError: () => {setError('Yükleme tamamlanamadı. Aynı dosyayı seçerek kaldığınız yerden devam edebilirsiniz.'); setBusy(false)},
        onProgress: (bytes, total) => setProgress(Math.round(bytes / total * 100)),
        onSuccess: async () => {setBusy(false); setStatus('processing'); try {setStatus(await syncVideoStatus(projectId)); router.refresh()} catch {setError('Yükleme tamamlandı. İşleme durumunu kontrol edin.')}},
      })
      const previous = await uploader.findPreviousUploads()
      if (previous[0]) uploader.resumeFromPreviousUpload(previous[0])
      else {const result = await beginVideoUpload({projectId, name: file.name, size: file.size, maxDurationSeconds: duration * 60}); uploader.options.uploadUrl = result.uploadUrl}
      upload.current = uploader
      setStatus('uploading'); uploader.start()
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Yükleme başlatılamadı.'); setBusy(false)}
  }
  const labels: Record<string, string> = {uploading: 'Yükleniyor', processing: 'Görüntü kaliteleri hazırlanıyor', ready: 'Oynatmaya hazır', error: 'Video işlenemedi'}
  return <section className="admin-panel"><p className="admin-eyebrow">01 · Video</p><h2>Yükle, işle, oynat</h2>
    <p>Yüksek kaliteli videon doğrudan Stream’e yüklenir. Farklı bağlantı hızları için otomatik hazırlanır; sitenin sunucusundan geçmez.</p>
    {videoId && initialStatus === 'ready' ? <p className="admin-notice">Oynatmaya hazır bir video var. Yeni sürüm işlenirken mevcut video gösterilmeye devam eder. Eski dosya otomatik silinmez.</p> : null}
    {!configured ? <p className="admin-notice">Stream bağlantısı henüz kurulmadı. Önce <code>docs/video-and-resume-setup.md</code> rehberindeki iki sunucu değişkenini tanımlayın. Mevcut videolar çalışmaya devam eder.</p> : null}
    {status ? <p className={`admin-notice ${status === 'error' ? 'admin-error' : ''}`} role="status">{labels[status] || status}</p> : null}
    {status !== 'ready' && status !== 'processing' ? <form className="admin-form" onSubmit={start}><div className="admin-form-grid">
      <label className="admin-field"><span>Video dosyası</span><input name="video" type="file" accept="video/*" required disabled={!configured || busy}/></label><label className="admin-field"><span>En fazla süre (dakika)</span><input type="number" min="1" max="600" value={duration} onChange={e => setDuration(Number(e.target.value))} disabled={busy}/></label></div>
      <small>Videoya yakın bir süre seçin; Stream bu süre kadar geçici kota ayırır. Orijinal dosyanızı ayrıca saklayın.</small>
      <div className="admin-actions"><button className="admin-button" disabled={!configured || busy}>{busy ? `%${progress} yükleniyor` : pendingVideoId ? 'Aynı dosyayla yüklemeye devam et' : videoId ? 'Yeni sürümü yükle' : 'Videoyu yükle'}</button>{busy ? <button className="admin-button admin-button-secondary" type="button" onClick={() => {if (paused) {upload.current?.start(); setPaused(false)} else {void upload.current?.abort(); setPaused(true)}}}>{paused ? 'Devam et' : 'Duraklat'}</button> : null}</div>
      {busy ? <progress max="100" value={progress} aria-label="Video yükleme ilerlemesi"/> : null}</form> : null}
    {(videoId || pendingVideoId) && !busy ? <button className="admin-button admin-button-secondary" type="button" onClick={async () => {setError(''); try {setStatus(await syncVideoStatus(projectId)); router.refresh()} catch (reason) {setError(reason instanceof Error ? reason.message : 'Durum alınamadı.')}}}>Durumu kontrol et</button> : null}
    {status === 'ready' ? <button className="admin-button admin-button-secondary" type="button" onClick={() => setStatus('')}>Başka bir video sürümü yükle</button> : null}
    {(pendingVideoId || pendingStatus) && !busy ? <button className="admin-remove-draft" type="button" onClick={async () => {
      if (!window.confirm('Tamamlanmamış yükleme arşivlenecek. Mevcut hazır video korunacak; Stream dosyası silinmeyecek. Devam edilsin mi?')) return
      try {await archivePendingVideo(projectId); setStatus(''); setError(''); router.refresh()} catch {setError('Yükleme arşivlenemedi.')}
    }}>Tamamlanmamış yüklemeyi arşivle</button> : null}
    {error ? <p className="admin-error" role="alert">{error}</p> : null}
  </section>
}
