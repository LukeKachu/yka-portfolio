'use client'

import {useState} from 'react'
import {useConsent} from './cookie-consent'
import {externalMediaVisible} from '@/lib/privacy/consent'

// New visitors see players immediately. An existing explicit opt-out is respected.
// A play click can override that opt-out for this mounted player only.
export function useMediaAccess() {
  const {consent} = useConsent()
  const [request,setRequest] = useState({consent,requested:false})
  if (request.consent !== consent) setRequest({consent,requested:false})
  return {
    enabled:externalMediaVisible(consent) || (request.consent === consent && request.requested),
    play:() => setRequest({consent,requested:true}),
  }
}
