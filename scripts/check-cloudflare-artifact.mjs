import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {parseEnv} from 'node:util'

// OpenNext can copy .env files into its generated output. A local build must
// never silently ship one-time import credentials or private API keys.
const root = '.open-next'
if (!existsSync(join(root,'worker.js'))) throw new Error('Build the Cloudflare Worker before deployment.')
let localEnv = {}
try {localEnv = parseEnv(readFileSync('.env.local','utf8'))} catch (error) {if (error.code !== 'ENOENT') throw error}
const privateValues = Object.entries({...localEnv,...process.env})
  .filter(([name,value]) => !name.startsWith('NEXT_PUBLIC_') && /(?:PASSWORD|TOKEN|API_KEY|SECRET|PRIVATE_KEY|SERVICE_ROLE_KEY)$/.test(name) && value?.length >= 8)
  .map(([,value]) => Buffer.from(value))
const issues = []
function inspect(directory) {
  for (const entry of readdirSync(directory,{withFileTypes:true})) {
    const file = join(directory,entry.name)
    if (entry.isSymbolicLink()) {issues.push(file); continue}
    if (entry.isDirectory()) {inspect(file); continue}
    const bytes = readFileSync(file)
    if (/^\.env/.test(entry.name) || privateValues.some(value => bytes.includes(value)) || bytes.includes(Buffer.from('SUPABASE_IMPORT_ADMIN_PASSWORD'))) issues.push(file)
  }
}
inspect(root)
for (const file of issues) console.error(`Deployment blocked: private/local configuration detected in ${file}`)
if (issues.length) {
  console.error('Use a clean Cloudflare Git build without .env files or import credentials. Set runtime secrets in the Cloudflare Dashboard. No secret values printed.')
  process.exitCode = 1
} else console.log('Cloudflare artifact preflight passed. No known private configuration embedded; this is not a full security audit.')
