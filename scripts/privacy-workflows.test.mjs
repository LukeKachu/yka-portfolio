import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import {CONSENT_MAX_AGE,CONSENT_VERSION,externalMediaVisible,localPoster,makeConsent,parseConsent} from '../lib/privacy/consent.ts'
import {notices} from '../lib/privacy/notices.ts'
import {localizedPageMetadata} from '../lib/seo/metadata.ts'

test('canonical, language alternates and Open Graph URLs identify the current route, not its parent', () => {
  for (const locale of ['tr','en']) for (const path of ['work','resume','contact','work/project-example']) {
    const meta = localizedPageMetadata(locale,path,'Page title','Page description')
    assert.equal(meta.alternates.canonical,`/${locale}/${path}`)
    assert.deepEqual(meta.alternates.languages,{tr:`/tr/${path}`,en:`/en/${path}`,'x-default':`/en/${path}`})
    assert.equal(meta.openGraph.url,`/${locale}/${path}`)
  }
})

test('saved choices accept only explicit versioned booleans and do not invent theme consent', () => {
  const now = Date.now()
  const valid = makeConsent({preferences:false,externalMedia:false},now)
  assert.deepEqual(parseConsent(JSON.stringify(valid),now),valid)
  for (const raw of [null,'','invalid','null','{}',JSON.stringify({...valid,version:CONSENT_VERSION+1}),JSON.stringify({...valid,externalMedia:'true'}),JSON.stringify({...valid,preferences:1}),JSON.stringify({...valid,updatedAt:now+120000})]) assert.equal(parseConsent(raw,now),null)
  assert.equal(parseConsent(JSON.stringify(valid),now+CONSENT_MAX_AGE*1000),null)
  assert.equal(parseConsent(JSON.stringify(valid),now+CONSENT_MAX_AGE*1000-1)?.externalMedia,false)
})

test('new visitors see media by default without granting theme consent; existing media opt-outs are preserved', () => {
  const accepted = makeConsent({preferences:true,externalMedia:true})
  const withdrawn = makeConsent({preferences:false,externalMedia:false})
  assert.equal(parseConsent(JSON.stringify(accepted)).externalMedia,true)
  assert.deepEqual(parseConsent(JSON.stringify(withdrawn)),withdrawn)
  assert.equal(externalMediaVisible(null),true)
  assert.equal(externalMediaVisible(accepted),true)
  assert.equal(externalMediaVisible(withdrawn),false)
  assert.equal(Boolean(parseConsent(null)?.preferences),false)
})

test('unconsented local preview cannot escape to a remote or protocol-relative host', () => {
  assert.equal(localPoster('/media/posters/example.webp'),true)
  for (const value of [undefined,'','https://i.ytimg.com/video.jpg','//external.example/image.jpg','/\\external.example/image.jpg','data:image/png;base64,AA','javascript:alert(1)']) assert.equal(localPoster(value),false)
})

test('all legal notices are bilingual and match real providers without fictitious certifications', () => {
  for (const locale of ['tr','en']) {
    assert.deepEqual(Object.keys(notices[locale]).sort(),['cookies','privacy','terms'])
    const content = JSON.stringify(notices[locale])
    for (const provider of ['Supabase','Resend','Google','TikTok','Cloudflare']) assert.ok(content.includes(provider))
    assert.ok(content.includes('yusufkerimaltay77@gmail.com'))
    assert.doesNotMatch(content,/100% (?:compliant|uyumlu)|ISO 27001 certified|GDPR certified/i)
  }
})

test('automatic players preserve explicit opt-outs server-side and do not fabricate consent; contact remains separate', async () => {
  const player = await readFile(new URL('../components/public/video-player.tsx',import.meta.url),'utf8')
  const x = await readFile(new URL('../components/public/x-embed.tsx',import.meta.url),'utf8')
  const media = await readFile(new URL('../components/public/media-embed.tsx',import.meta.url),'utf8')
  const form = await readFile(new URL('../components/public/contact-form.tsx',import.meta.url),'utf8')
  for (const source of [player,x]) {
    assert.ok(source.indexOf('if (!enabled)') < source.indexOf('<EmbeddedPlayer'))
    assert.match(source,/useMediaAccess/)
    assert.match(source,/onPlay=/)
    assert.match(source,/MediaConsentPlaceholder/)
  }
  assert.doesNotMatch(media,/<iframe/)
  const preview = await readFile(new URL('../components/public/media-consent-placeholder.tsx',import.meta.url),'utf8')
  const access = await readFile(new URL('../components/public/use-media-access.ts',import.meta.url),'utf8')
  assert.doesNotMatch(preview,/openSettings|useConsent|youtube-nocookie\.com|ytimg\.com/)
  assert.match(preview,/aria-describedby/)
  assert.doesNotMatch(access,/document\.cookie\s*=|localStorage\.setItem/)
  assert.match(access,/externalMediaVisible\(consent\)/)
  const layout = await readFile(new URL('../app/[locale]/layout.tsx',import.meta.url),'utf8')
  const provider = await readFile(new URL('../components/public/cookie-consent.tsx',import.meta.url),'utf8')
  assert.match(layout,/\(await cookies\(\)\)\.get\(CONSENT_COOKIE\)/)
  assert.match(layout,/initialConsent=\{initialConsent\}/)
  assert.doesNotMatch(layout,/\.getAll\(/)
  assert.doesNotMatch(provider,/<aside|cookie-banner|Tümünü kabul et/)
  assert.match(provider,/save\(\{preferences:false,externalMedia:draft\.externalMedia\}\)/)
  assert.match(form,/KVKK aydınlatma metni/)
  assert.doesNotMatch(form,/name="(?:marketing|consent)"[^>]*required/)
})
