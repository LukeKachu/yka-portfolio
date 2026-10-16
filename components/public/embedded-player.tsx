'use client'

import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import {ArrowIcon} from './arrow-icon'

const touchQuery='(max-width: 760px), (pointer: coarse)'
function subscribe(change:()=>void) {
  const query=window.matchMedia(touchQuery)
  query.addEventListener('change',change)
  return ()=>query.removeEventListener('change',change)
}
const touchSnapshot=()=>window.matchMedia(touchQuery).matches
const serverSnapshot=()=>true

/** Keep native previews visible, but never let a preview iframe capture page swipes. */
export function EmbeddedPlayer({src,title,locale,platform,sourceUrl,playing=false}:{src:string;title:string;locale:'tr'|'en';platform:string;sourceUrl?:string;playing?:boolean}) {
  const touch=useSyncExternalStore(subscribe,touchSnapshot,serverSnapshot)
  const [watching,setWatching]=useState(false)
  const dialog=useRef<HTMLDialogElement>(null)
  const trigger=useRef<HTMLButtonElement>(null)
  const tr=locale==='tr'

  useEffect(()=>{
    if (!watching) return
    const modal=dialog.current
    if (!modal) return
    modal.showModal()
    const overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    return ()=>{
      document.body.style.overflow=overflow
      if (modal.open) modal.close()
    }
  },[watching])

  function close() {
    setWatching(false)
    trigger.current?.focus({preventScroll:true})
  }
  const frame=(preview:boolean)=><iframe src={src} title={title} loading={preview&&!playing?'lazy':'eager'} inert={preview&&touch} tabIndex={preview&&touch?-1:0} referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen/>

  return <div className={`media-frame media-stage media-stage-${platform} ${sourceUrl?'media-with-source':''} ${touch?'embed-scroll-safe':''}`}>
    {!watching?frame(true):null}
    <button ref={trigger} className="embed-preview-open" type="button" onClick={()=>setWatching(true)} aria-label={`${tr?'Oynatıcıyı aç':'Open player'}: ${title}`} aria-haspopup="dialog">
      <span><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 5 10 7-10 7Z"/></svg>{tr?'Oynatıcıyı aç':'Open player'}<ArrowIcon/></span>
    </button>
    {sourceUrl?<a className="player-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{tr?'Kaynağında aç':'Open original'}<ArrowIcon/></a>:null}
    <dialog ref={dialog} className="embed-dialog" aria-label={`${tr?'Video oynatıcı':'Video player'}: ${title}`} onCancel={close} onClose={close}>
      <div className="embed-dialog-toolbar"><span>{title}</span><button type="button" onClick={close} autoFocus>{tr?'Kapat':'Close'}<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div>
      <div className="embed-dialog-frame">{watching?frame(false):null}</div>
      {sourceUrl?<a className="embed-dialog-source" href={sourceUrl} target="_blank" rel="noopener noreferrer">{tr?'Kaynağında aç':'Open original'}<ArrowIcon/></a>:null}
    </dialog>
  </div>
}
