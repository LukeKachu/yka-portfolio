import {networkInterfaces} from 'node:os'
import {access} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {previewCandidates} from '../lib/preview/network.ts'

// Explicit local-network preview only. No tunnel, router configuration, firewall edits or external deployment.
const args = process.argv.slice(2)
const options = {port:'3001',host:null,check:false}
for (let index=0;index<args.length;index++) {
  if (args[index] === '--check') options.check=true
  else if (args[index] === '--host' && args[index+1]) options.host=args[++index]
  else if (args[index] === '--port' && args[index+1]) options.port=args[++index]
  else throw new Error('Use --check, --host <local private IPv4>, or --port <1024-65535>.')
}
const candidates = previewCandidates(networkInterfaces())
const selected = options.host ? candidates.find(item => item.address === options.host) : candidates.length === 1 ? candidates[0] : null
if (!selected) {
  console.log('Select your connected Wi-Fi/Ethernet address using --host. Available private addresses:')
  candidates.forEach(item => console.log(`${item.name}: ${item.address}`))
  throw new Error('No unambiguous local private interface selected. No server was started.')
}
const port = Number(options.port)
if (!/^\d+$/.test(options.port) || !Number.isInteger(port) || port<1024 || port>65535) throw new Error('Invalid preview port.')
await access(new URL('../.next/BUILD_ID',import.meta.url)).catch(() => {throw new Error('First run npm run build. No development server will be exposed.')})
console.log(`Phone URL (same Wi-Fi): http://${selected.address}:${port}/tr`)
console.log(`Selected local interface: ${selected.name}`)
console.log('Use a trusted private network only. The computer must stay on. Stop with Ctrl+C.')
console.log('This is HTTP: do not enter admin passwords or confidential personal data. No internet sharing is configured.')
if (!options.check) {
  const require = createRequire(import.meta.url)
  const child = spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname',selected.address,'--port',String(port)],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit',env:{...process.env,NODE_ENV:'production'}})
  child.on('error',() => {console.error('Local preview could not start.');process.exitCode=1})
  child.on('exit',code => {process.exitCode=code ?? 1})
  process.on('SIGINT',() => child.kill('SIGINT'))
  process.on('SIGTERM',() => child.kill('SIGTERM'))
} else console.log('Read-only check complete: no port opened and no server started.')
