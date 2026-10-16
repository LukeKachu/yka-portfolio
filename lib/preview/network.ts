import {isIP} from 'node:net'

export function isPrivateIPv4(address:string) {
  if (isIP(address) !== 4) return false
  const [first,second] = address.split('.').map(Number)
  return first === 10 || first === 192 && second === 168 || first === 172 && second >= 16 && second <= 31
}

export function previewCandidates(interfaces:Record<string,Array<{family:string;address:string;internal:boolean}>|undefined>) {
  return Object.entries(interfaces).flatMap(([name,rows]) => (rows || []).filter(row => row.family === 'IPv4' && !row.internal && isPrivateIPv4(row.address)).map(row => ({name,address:row.address})))
}
