import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {readFileSync} from 'node:fs'
import sharp from 'sharp'
import test from 'node:test'
import config from '../next.config.ts'
import {contactRequestId} from '../lib/contact/request-id.ts'
import {isPrivateIPv4,previewCandidates} from '../lib/preview/network.ts'

const require = createRequire(import.meta.url)

test('installed Next.js and native image processing versions include the audited security patches', () => {
  const next = require('next/package.json').version.split('.').map(Number)
  assert.ok(next[0]>16 || next[0]===16 && (next[1]>3 || next[1]===3 && next[2]>=8))
  const sharp = JSON.parse(readFileSync(new URL('../node_modules/sharp/package.json',import.meta.url),'utf8')).version.split('.').map(Number)
  assert.ok(sharp[0]>0 || sharp[1]>35 || sharp[1]===35 && sharp[2]>=5)
})

test('baseline response headers restrict framing, MIME sniffing, referrers and unnecessary device access',async () => {
  assert.equal(config.poweredByHeader,false)
  const rules = await config.headers()
  const global = rules.find(rule => rule.source === '/:path*')
  const headers = Object.fromEntries(global.headers.map(header => [header.key.toLowerCase(),header.value]))
  assert.equal(headers['x-content-type-options'],'nosniff')
  assert.equal(headers['x-frame-options'],'SAMEORIGIN')
  assert.equal(headers['referrer-policy'],'strict-origin-when-cross-origin')
  for (const device of ['camera','microphone','geolocation','payment','usb']) assert.ok(headers['permissions-policy'].includes(`${device}=()`))
  for (const directive of ["base-uri 'self'","object-src 'none'","frame-ancestors 'self'","form-action 'self'"]) assert.ok(headers['content-security-policy'].includes(directive))
  // No permissive script policy or blanket source restrictions that break the real social-media players.
  assert.doesNotMatch(headers['content-security-policy'],/unsafe-inline|unsafe-eval|default-src/)
})

test('LAN preview candidates cannot bind to loopback, public or non-local interfaces', () => {
  for (const address of ['10.0.0.2','172.16.0.2','172.31.255.254','192.168.1.2']) assert.equal(isPrivateIPv4(address),true)
  for (const address of ['0.0.0.0','127.0.0.1','8.8.8.8','172.15.0.2','172.32.0.2','169.254.1.2','192.168.999.1','::1']) assert.equal(isPrivateIPv4(address),false)
  assert.deepEqual(previewCandidates({wifi:[{family:'IPv4',address:'192.168.1.2',internal:false}],vpn:[{family:'IPv4',address:'8.8.8.8',internal:false}],loopback:[{family:'IPv4',address:'127.0.0.1',internal:true}]}),[{name:'wifi',address:'192.168.1.2'}])
})

test('contact deduplication IDs work with getRandomValues only, without requiring HTTPS randomUUID', () => {
  const source = {getRandomValues:array => {array.fill(0);return array}}
  assert.equal(contactRequestId(source),'00000000-0000-4000-8000-000000000000')
  const ids = Array.from({length:100},() => contactRequestId())
  assert.equal(new Set(ids).size,100)
  for (const id of ids) assert.match(id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
})

test('the selected modular YKA matches the installed SVG, ICO and Apple icon pixels',async () => {
  const svg = readFileSync(new URL('../app/icon.svg',import.meta.url))
  const selected = readFileSync(new URL('../design/favicon/03-editorial.svg',import.meta.url))
  assert.deepEqual(await sharp(svg).resize(64,64).raw().toBuffer(),await sharp(selected).resize(64,64).raw().toBuffer())
  const apple = readFileSync(new URL('../app/apple-icon.png',import.meta.url))
  assert.deepEqual(await sharp(apple).raw().toBuffer(),await sharp(svg).resize(180,180).raw().toBuffer())
  const ico = readFileSync(new URL('../app/favicon.ico',import.meta.url))
  assert.equal(ico.readUInt16LE(2),1)
  assert.equal(ico.readUInt16LE(4),3)
  for (const [index,size] of [16,32,48].entries()) {
    const entry = 6+index*16
    const image = ico.subarray(ico.readUInt32LE(entry+12),ico.readUInt32LE(entry+12)+ico.readUInt32LE(entry+8))
    const metadata = await sharp(image).metadata()
    assert.equal(metadata.width,size)
    assert.deepEqual(await sharp(image).raw().toBuffer(),await sharp(svg).resize(size,size).raw().toBuffer())
  }
})
