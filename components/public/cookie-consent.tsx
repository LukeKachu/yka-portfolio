'use client'

import Link from 'next/link'
import {createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode} from 'react'
import {CONSENT_COOKIE, CONSENT_MAX_AGE, makeConsent, parseConsent, type ConsentChoices, type ConsentRecord} from '@/lib/privacy/consent'

type ConsentContextValue = {consent:ConsentRecord|null; ready:boolean; openSettings:()=>void}
const ConsentContext = createContext<ConsentContextValue|null>(null)
const EVENT = 'yka-consent-change'

function snapshot() {
  try {return decodeURIComponent(document.cookie.split('; ').find(part => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length+1) || '') || null} catch {return null}
}
function subscribe(change:()=>void) {
  window.addEventListener(EVENT,change)
  window.addEventListener('focus',change)
  const timer = window.setInterval(change,60000)
  let channel:BroadcastChannel|null = null
  try {if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(EVENT)} catch {/* Some private browsers block channels. */}
  if (channel) channel.onmessage = change
  return () => {window.removeEventListener(EVENT,change); window.removeEventListener('focus',change); window.clearInterval(timer); channel?.close()}
}
const serverSnapshot = () => null
const clientReady = () => true
const serverReady = () => false
const subscribeReady = () => () => {}

export function useConsent() {
  const context = useContext(ConsentContext)
  if (!context) throw new Error('Cookie consent must be inside the public consent provider.')
  return context
}

export function CookieSettingsButton({locale}:{locale:'tr'|'en'}) {
  const {openSettings} = useConsent()
  return <button type="button" className="cookie-settings-link" onClick={openSettings}>{locale === 'tr' ? 'Çerez tercihleri' : 'Cookie preferences'}</button>
}

export function CookieConsentProvider({locale,children}:{locale:'tr'|'en';children:ReactNode}) {
  const raw = useSyncExternalStore(subscribe,snapshot,serverSnapshot)
  const ready = useSyncExternalStore(subscribeReady,clientReady,serverReady)
  const consent = useMemo(() => parseConsent(raw),[raw])
  const [sessionConsent,setSessionConsent] = useState<ConsentRecord|null>(null)
  const effective = consent || sessionConsent
  const [opened,setOpened] = useState(false)
  const [draft,setDraft] = useState<ConsentChoices>({preferences:false,externalMedia:false})
  const dialog = useRef<HTMLDialogElement>(null)
  const tr = locale === 'tr'
  function openSettings() {
    setDraft({preferences:effective?.preferences || false,externalMedia:effective?.externalMedia || false})
    setOpened(true)
  }
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal()
    if (!opened && dialog.current?.open) dialog.current?.close()
  },[opened])

  function save(choices:ConsentChoices) {
    const record = makeConsent(choices)
    // If cookies are disabled, keep the explicit choice for this tab only.
    const serialized = JSON.stringify(record)
    try {document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`} catch {/* Session choice still works. */}
    setSessionConsent(snapshot() === serialized ? null : record)
    if (!choices.preferences) {try {localStorage.removeItem('yka-theme')} catch {/* Storage may be blocked. */}}
    window.dispatchEvent(new Event(EVENT))
    try {if (typeof BroadcastChannel !== 'undefined') {const channel = new BroadcastChannel(EVENT); channel.postMessage('updated'); channel.close()}} catch {/* Same-tab updates still work. */}
    setOpened(false)
  }
  const reject = () => save({preferences:false,externalMedia:false})
  const accept = () => save({preferences:true,externalMedia:true})

  return <ConsentContext.Provider value={{consent:effective,ready,openSettings}}>
    {children}
    {!effective ? <aside className="cookie-banner" aria-labelledby="cookie-banner-title" aria-label={tr ? 'Çerez tercihleri' : 'Cookie preferences'}>
      <div><p className="eyebrow">YKA / {tr ? 'Gizlilik tercihin' : 'Your privacy'}</p><h2 id="cookie-banner-title">{tr ? 'Kontrol sende.' : 'You’re in control.'}</h2><p>{tr ? 'Video kartları her zaman görünür. Videoyu izlemek için karttaki oynat düğmesine basabilirsin; tüm videoları açma ve tema kaydı seçenekleri sana bağlı.' : 'Video cards are always visible. Press play on a card to watch that video; enabling all videos and saved theme preferences is optional.'} <Link href={`/${locale}/cookies`}>{tr ? 'Çerez bilgileri' : 'Cookie details'}</Link></p></div>
      <div className="cookie-actions"><button type="button" onClick={reject}>{tr ? 'İsteğe bağlıları reddet' : 'Reject optional'}</button><button type="button" onClick={openSettings}>{tr ? 'Tercihlerimi seç' : 'Customize'}</button><button type="button" onClick={accept}>{tr ? 'Tümünü kabul et' : 'Accept all'}</button></div>
    </aside> : null}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-dialog-title" onClose={() => setOpened(false)}>
      <div className="cookie-dialog-heading"><div><p className="eyebrow">YKA / {tr ? 'Gizlilik merkezi' : 'Privacy centre'}</p><h2 id="cookie-dialog-title">{tr ? 'Çerez tercihlerin' : 'Cookie preferences'}</h2></div><button type="button" className="cookie-close" aria-label={tr ? 'Tercihleri kaydetmeden kapat' : 'Close without saving'} onClick={() => setOpened(false)}>×</button></div>
      <p>{tr ? 'Seçimin 180 gün saklanır. Alt bilgideki “Çerez tercihleri” bağlantısıyla her zaman değiştirebilirsin. Daha önce yüklenen üçüncü tarafların kendi çerezlerini onların ayarlarından veya tarayıcından silebilirsin.' : 'Your choice is saved for 180 days and can be changed using the footer link. Cookies already set by external providers can be removed through their settings or your browser.'}</p>
      <div className="cookie-category"><div><h3>{tr ? 'Zorunlu' : 'Essential'} <span>{tr ? 'Her zaman açık' : 'Always on'}</span></h3><p>{tr ? 'Bu seçimi hatırlayan çerez ve yalnızca admin girişi sırasında kullanılan oturum çerezleri. Siteyi güvenli kullanmak için gereklidir.' : 'The cookie that remembers this choice and session cookies used only for admin sign-in. Required for these functions.'}</p></div></div>
      <label className="cookie-category"><div><h3>{tr ? 'Tercihler' : 'Preferences'}</h3><p id="cookie-preferences-help">{tr ? 'Açık/koyu tema seçimini bu tarayıcıda saklar. İzin vermezsen tema düğmesi yine çalışır, seçimin kalıcı kaydedilmez.' : 'Saves your light/dark theme on this browser. The theme toggle still works without permission, but its choice is not saved.'}</p></div><input type="checkbox" aria-label={tr ? 'Tercihler' : 'Preferences'} aria-describedby="cookie-preferences-help" checked={draft.preferences} onChange={event => setDraft({...draft,preferences:event.target.checked})}/></label>
      <label className="cookie-category"><div><h3>{tr ? 'Harici medya' : 'External media'}</h3><p id="cookie-media-help">{tr ? 'YouTube/Google, Instagram/Meta, TikTok, X ve Cloudflare Stream oynatıcılarını ve uzak kapaklarını açar. IP adresi ve cihaz bilgileri bu sağlayıcılara iletilebilir; kendi çerezlerini kullanabilir, verileri yurt dışında işleyebilirler. Bu genel izin olmadan da karttaki “Videoyu izle” düğmesiyle sadece seçtiğin videoyu açabilirsin.' : 'Enables YouTube/Google, Instagram/Meta, TikTok, X and Cloudflare Stream players and remote previews. They may receive your IP/device information, use cookies and process data outside Türkiye. Without this group permission, you can still press “Watch video” on a card to open only that video.'}</p></div><input type="checkbox" aria-label={tr ? 'Harici medya' : 'External media'} aria-describedby="cookie-media-help" checked={draft.externalMedia} onChange={event => setDraft({...draft,externalMedia:event.target.checked})}/></label>
      <p className="cookie-no-tracking">{tr ? 'Sitede ayrıca eklenmiş analiz veya reklam takip kodu bulunmuyor.' : 'The site has no separately installed analytics or advertising tracker.'} <Link href={`/${locale}/privacy`} onClick={() => setOpened(false)}>{tr ? 'Gizlilik ve KVKK' : 'Privacy notice'}</Link></p>
      <div className="cookie-actions"><button type="button" onClick={reject}>{tr ? 'İsteğe bağlıları reddet' : 'Reject optional'}</button><button type="button" onClick={() => save(draft)}>{tr ? 'Seçimimi kaydet' : 'Save choices'}</button><button type="button" onClick={accept}>{tr ? 'Tümünü kabul et' : 'Accept all'}</button></div>
    </dialog>
  </ConsentContext.Provider>
}
