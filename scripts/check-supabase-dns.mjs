// Read-only network diagnosis; prints neither connection values nor API keys.
import {lookup, Resolver} from 'node:dns/promises'

const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let url
try {url = new URL(raw)} catch {console.log('Invalid Supabase URL format.'); process.exit(1)}
const check = async task => {try {await task(); return 'resolved'} catch (error) {return error.code || error.name}}
const publicResolver = new Resolver({timeout:3000,tries:1})
publicResolver.setServers(['1.1.1.1'])
const [systemDns,publicDns] = await Promise.all([
  check(() => lookup(url.hostname)),check(() => publicResolver.resolve4(url.hostname)),
])
console.log(JSON.stringify({
  urlFormatValid:url.protocol === 'https:' && /^[a-z0-9]+\.supabase\.co$/.test(url.hostname) && url.pathname === '/',
  containsWhitespace:/\s/.test(raw),
  systemDns,publicDns,
},null,2))
