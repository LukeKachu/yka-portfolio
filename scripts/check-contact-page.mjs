import assert from 'node:assert/strict'

// Local HTTP smoke check. No valid enquiry is submitted; no records or emails are created.
const base = 'http://localhost:3000'
for (const locale of ['tr','en']) {
  const response = await fetch(`${base}/${locale}/contact`,{signal:AbortSignal.timeout(30000)})
  assert.equal(response.status,200)
  const html = await response.text()
  assert.match(html,/name="phone"/)
  assert.match(html,/autocomplete="tel"/i)
  assert.match(html,/mailto:yusufkerimaltay77@gmail\.com/)
  assert.match(html,/\/icon\.svg/)
  const phoneInput = html.match(/<input\b[^>]*name="phone"[^>]*>/)?.[0]
  const pattern = phoneInput?.match(/pattern="([^"]+)"/)?.[1]
  assert.ok(pattern)
  const validator = new RegExp(`^(?:${pattern})$`,'v')
  assert.ok(validator.test('+90 (555) 123 45 67'))
  assert.ok(!validator.test('not a number'))
  console.log(`/${locale}/contact: 200; phone, international phone pattern, direct email and favicon OK`)
}
for (const path of ['/icon.svg','/favicon.ico','/apple-icon.png']) {
  const response = await fetch(`${base}${path}`,{signal:AbortSignal.timeout(10000)})
  assert.equal(response.status,200)
  console.log(`${path}: 200 (${response.headers.get('content-type')})`)
}
for (const [origin,status] of [[base,400],['https://invalid.example',403]]) {
  const response = await fetch(`${base}/api/contact`,{method:'POST',headers:{origin},body:new FormData()})
  assert.equal(response.status,status)
  assert.equal((await response.json()).ok,false)
}
console.log('Invalid / cross-origin submissions: rejected; no data written.')
