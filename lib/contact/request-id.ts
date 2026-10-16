// getRandomValues also works on trusted local-network HTTP previews, unlike randomUUID.
// This is a per-submission deduplication identifier, not an authentication credential.
export function contactRequestId(source:Pick<Crypto,'getRandomValues'> = globalThis.crypto):string {
  const bytes = source.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes,byte => byte.toString(16).padStart(2,'0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
