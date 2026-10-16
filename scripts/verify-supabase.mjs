import {readFile} from 'node:fs/promises'
import process from 'node:process'

if (process.env.NODE_ENV === 'production') {
  console.error('Connection verification is development-only.')
  process.exit(1)
}

const source = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(
  source.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
    const separator = line.indexOf('=')
    return [line.slice(0, separator), line.slice(separator + 1)]
  }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('Supabase connection variables are missing.')
  process.exit(1)
}

try {
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: {apikey: key},
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  console.log('Supabase connection succeeded.')
} catch {
  console.error('Supabase connection failed.')
  process.exit(1)
}
