export const CONSENT_COOKIE = 'yka-consent'
export const CONSENT_VERSION = 1
export const CONSENT_DAYS = 180
export const CONSENT_MAX_AGE = CONSENT_DAYS * 86400
export type ConsentChoices = {preferences:boolean; externalMedia:boolean}
export type ConsentRecord = ConsentChoices & {version:number; updatedAt:number}

// Media visibility is not proof of consent. Keep explicit legacy opt-outs intact.
export function externalMediaVisible(record:ConsentRecord|null) {
  return record?.externalMedia !== false
}

export function parseConsent(raw:string|null, now=Date.now()):ConsentRecord|null {
  try {
    if (!raw) return null
    const record = JSON.parse(raw)
    if (record.version !== CONSENT_VERSION || typeof record.preferences !== 'boolean' || typeof record.externalMedia !== 'boolean'
      || !Number.isSafeInteger(record.updatedAt) || record.updatedAt > now + 60000 || now - record.updatedAt >= CONSENT_MAX_AGE * 1000) return null
    return {version:record.version,updatedAt:record.updatedAt,preferences:record.preferences,externalMedia:record.externalMedia}
  } catch {return null}
}

export function makeConsent(choices:ConsentChoices, now=Date.now()):ConsentRecord {
  return {version:CONSENT_VERSION,updatedAt:now,preferences:choices.preferences,externalMedia:choices.externalMedia}
}

export function localPoster(poster?:string) {
  return Boolean(poster?.startsWith('/') && !poster.startsWith('//') && !poster.includes('\\'))
}
