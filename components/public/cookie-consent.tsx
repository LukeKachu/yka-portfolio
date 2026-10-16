'use client'

import Link from 'next/link'
import {createContext,useContext,useEffect,useMemo,useRef,useState,useSyncExternalStore,type ReactNode} from 'react'
import {CONSENT_COOKIE,CONSENT_MAX_AGE,externalMediaVisible,makeConsent,parseConsent,type ConsentChoices,type ConsentRecord} from '@/lib/privacy/consent'

type ConsentContextValue = {consent:ConsentRecord|null;ready:boolean;openSettings:()=>void}
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
  try {if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(EVENT)} catch { /* Private browsers may block channels. */ }
  if (channel) channel.onmessage = change
  return () => {window.removeEventListener(EVENT,change);window.removeEventListener('focus',change);window.clearInterval(timer);channel?.close()}
}
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
  return <button type="button" className="cookie-settings-link" onClick={openSettings}>{locale==='tr'?'Çerez tercihleri':'Cookie preferences'}</button>
}

export function CookieConsentProvider({locale,children,initialConsent=null}:{locale:'tr'|'en';children:ReactNode;initialConsent?:string|null}) {
  // Match server/client HTML so an explicit opt-out never briefly loads a player.
  const raw = useSyncExternalStore(subscribe,snapshot,() => initialConsent)
  const ready = useSyncExternalStore(subscribeReady,clientReady,serverReady)
  const consent = useMemo(() => parseConsent(raw),[raw])
  const [sessionConsent,setSessionConsent] = useState<ConsentRecord|null>(null)
  const effective = consent || sessionConsent
  const [opened,setOpened] = useState(false)
  const [draft,setDraft] = useState<ConsentChoices>({preferences:false,externalMedia:true})
  const dialog = useRef<HTMLDialogElement>(null)
  const tr = locale==='tr'
  function openSettings() {
    setDraft({preferences:effective?.preferences || false,externalMedia:externalMediaVisible(effective)})
    setOpened(true)
  }
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal()
    if (!opened && dialog.current?.open) dialog.current?.close()
  },[opened])

  function save(choices:ConsentChoices) {
    const serialized = JSON.stringify(makeConsent(choices))
    try {document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`} catch { /* Session-only choice still works. */ }
    setSessionConsent(snapshot()===serialized?null:parseConsent(serialized))
    if (!choices.preferences) {try {localStorage.removeItem('yka-theme')} catch { /* Storage may be blocked. */ }}
    window.dispatchEvent(new Event(EVENT))
    try {if (typeof BroadcastChannel !== 'undefined') {const channel=new BroadcastChannel(EVENT);channel.postMessage('updated');channel.close()}} catch { /* Same-tab updates still work. */ }
    setOpened(false)
  }

  return <ConsentContext.Provider value={{consent:effective,ready,openSettings}}>
    {children}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-dialog-title" onClose={() => setOpened(false)}>
      <div className="cookie-dialog-heading"><div><p className="eyebrow">YKA / {tr?'Gizlilik merkezi':'Privacy centre'}</p><h2 id="cookie-dialog-title">{tr?'Çerez ve görünüm tercihlerin':'Cookies and display preferences'}</h2></div><button type="button" className="cookie-close" aria-label={tr?'Tercihleri kaydetmeden kapat':'Close without saving'} onClick={() => setOpened(false)}>×</button></div>
      <p>{tr?'Video oynatıcıları ilk ziyarette görünür; onları izlemek için bu pencereyi açman gerekmez. Aşağıdaki gösterim ayarı bir açık rıza kaydı değildir. Seçimlerini kaydedersen 180 gün hatırlanır.':'Video players are visible on a first visit; you do not need to open this window to watch them. The display setting below is not a record of consent. Saved choices are remembered for 180 days.'}</p>
      <div className="cookie-category"><div><h3>{tr?'Zorunlu kayıtlar':'Essential records'}</h3><p>{tr?'Bu pencerede kaydettiğin seçimi hatırlayan çerez ve yalnızca admin girişi için kullanılan oturum çerezleri.':'The cookie remembering choices saved here, and session cookies used only for admin sign-in.'}</p></div></div>
      <label className="cookie-category"><div><h3>{tr?'Tema seçimini hatırla':'Remember theme'}</h3><p id="cookie-preferences-help">{tr?'İsteğe bağlıdır ve başlangıçta kapalıdır. Açmazsan tema düğmesi yine çalışır; seçimin kalıcı kaydedilmez.':'Optional and off by default. The theme toggle still works when disabled, but its choice is not saved.'}</p></div><input type="checkbox" aria-label={tr?'Tema seçimini hatırla':'Remember theme'} aria-describedby="cookie-preferences-help" checked={draft.preferences} onChange={event => setDraft({...draft,preferences:event.target.checked})}/></label>
      <label className="cookie-category"><div><h3>{tr?'Video oynatıcılarını göster':'Show video players'}</h3><p id="cookie-media-help">{tr?'Varsayılan olarak açıktır. YouTube/Google, Instagram/Meta, TikTok, X ve Cloudflare Stream ile doğrudan bağlantı kurulabilir; IP/cihaz bilgileri iletilebilir, sağlayıcılar kendi çerezlerini kullanabilir ve verileri yurt dışında işleyebilir. Kapatıp kaydedersen yeni oynatıcı yüklemeleri durur. Önceden kaydedilmiş kapatma tercihleri de korunur.':'On by default. Players may connect directly to YouTube/Google, Instagram/Meta, TikTok, X and Cloudflare Stream, share IP/device information, use provider cookies and process data outside Türkiye. Disable and save to stop new player loads. Previously saved opt-outs are also respected.'}</p></div><input type="checkbox" aria-label={tr?'Video oynatıcılarını göster':'Show video players'} aria-describedby="cookie-media-help" checked={draft.externalMedia} onChange={event => setDraft({...draft,externalMedia:event.target.checked})}/></label>
      <p className="cookie-no-tracking">{tr?'Sitenin ayrıca eklenmiş analiz/reklam takip kodu yoktur; gömülü platformların kendi takibini engellediğimiz iddia edilmez. Daha önce iletilen veriler geri alınamaz; sağlayıcı çerezlerini tarayıcından veya sağlayıcının ayarlarından silebilirsin.':'The site has no separately installed analytics/advertising tracker; this does not mean embedded providers cannot track. Data already sent cannot be recalled; remove provider cookies through browser/provider settings.'} <Link href={`/${locale}/privacy`} onClick={() => setOpened(false)}>{tr?'Gizlilik ve KVKK':'Privacy notice'}</Link></p>
      <div className="cookie-actions"><button type="button" onClick={() => save({preferences:false,externalMedia:draft.externalMedia})}>{tr?'Tema kaydını reddet':'Decline saved theme'}</button><button type="button" onClick={() => save(draft)}>{tr?'Seçimimi kaydet':'Save choices'}</button></div>
    </dialog>
  </ConsentContext.Provider>
}
