import {execFileSync} from 'node:child_process'
import {readFileSync, statSync} from 'node:fs'
import {parseEnv} from 'node:util'

// Inspect only Git candidates, never temporary tooling or ignored secrets.
// Diagnostics deliberately contain paths/rule names, never matching values.
const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {encoding:'utf8'}).split('\0').filter(Boolean))]
let localEnv = {}
try {localEnv = parseEnv(readFileSync('.env.local', 'utf8'))} catch (error) {if (error.code !== 'ENOENT') throw error}
const privateValues = Object.entries(localEnv)
  .filter(([name,value]) => /(?:PASSWORD|TOKEN|API_KEY|SECRET|PRIVATE_KEY|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|ANON_KEY|SUPABASE_URL)$/.test(name) && value.length >= 8)
  .map(([,value]) => Buffer.from(value))
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub credential', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['OpenAI credential', /\bsk-(?:proj-|svcacct-)[A-Za-z0-9_-]{24,}\b/],
  ['Supabase privileged credential', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
]
const issues = []
for (const file of files) {
  if (/^(?:public\/cv\/|seed\/resume\.json$|scripts\/reconcile-site-content\.mjs$)/.test(file)) issues.push([file,'personal CV content must not be tracked'])
  if (/(?:^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*)$/.test(file) && file !== '.env.example') issues.push([file,'environment file'])
  if (/^(?:tmp|node_modules|\.next|\.open-next|\.wrangler|test-results|playwright-report)\//.test(file)) issues.push([file,'local/generated artifact'])
  const size = statSync(file).size
  if (size > 95 * 1024 * 1024) {issues.push([file,'file exceeds repository size budget']); continue}
  const bytes = readFileSync(file)
  if (privateValues.some(value => bytes.includes(value))) issues.push([file,'contains a configured connection value or credential'])
  if (bytes.includes(0)) continue
  const source = bytes.toString('utf8')
  for (const [rule,pattern] of patterns) if (pattern.test(source)) issues.push([file,rule])
}
for (const [file,rule] of issues) console.error(`${file}: ${rule}`)
console.log(`Repository preflight: ${files.length} candidate files; ${issues.length} issue(s). No credential values printed.`)
if (issues.length) process.exitCode = 1
