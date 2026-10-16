'use client'

import {useState} from 'react'
import {useConsent} from './cookie-consent'

// A play click enables this mounted player only, never other videos or a persistent cookie.
// A later privacy choice (including withdrawal in another tab) clears that request.
export function useMediaAccess() {
  const {consent} = useConsent()
  const [request,setRequest] = useState({consent,requested:false})
  if (request.consent !== consent) setRequest({consent,requested:false})
  return {
    enabled:Boolean(consent?.externalMedia) || (request.consent === consent && request.requested),
    play:() => setRequest({consent,requested:true}),
  }
}
