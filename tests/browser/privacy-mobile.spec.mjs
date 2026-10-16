import {test,expect} from '@playwright/test'
import {mkdir} from 'node:fs/promises'

const external = /https:\/\/(?:[^/]*\.)?(?:youtube(?:-nocookie)?\.com|ytimg\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|videodelivery\.net|cloudflarestream\.com)\//i
const externalFrame = 'iframe[src*="twitter.com"],iframe[src*="instagram.com"],iframe[src*="tiktok.com"],iframe[src*="youtube"],iframe[src*="videodelivery"],iframe[src*="cloudflarestream"]'

test.beforeEach(async ({context}) => {
  // Isolate provider requests; QA never sends visitor information to social platforms.
  await context.route(external,route => route.fulfill({status:200,contentType:'text/html',body:'<html><body>Isolated media test frame</body></html>'}))
})

test('fresh visitors see players immediately with no permission banner, cookie or autoplay',async ({page,context}) => {
  const response=await page.request.get('/tr/work')
  const html=await response.text()
  expect(html).toMatch(/<iframe[^>]+src=/i)
  expect(html).not.toMatch(/<iframe[^>]+src="[^"]*autoplay=1/i)
  const requests=[]
  page.on('request',request => {if (external.test(request.url())) requests.push(request.url())})
  await page.goto('/tr/work')
  await expect(page.locator('.portfolio-card').first()).toBeVisible()
  await expect(page.locator(externalFrame).first()).toBeVisible()
  await expect(page.locator('.cookie-banner')).toHaveCount(0)
  await expect(page.locator('.media-click-preview')).toHaveCount(0)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect((await context.cookies()).find(cookie=>cookie.name==='yka-consent')).toBeUndefined()
  expect(requests.length).toBeGreaterThan(0)
  for (const src of await page.locator(externalFrame).evaluateAll(frames=>frames.map(frame=>frame.src))) {
    expect(new URL(src).searchParams.get('autoplay')).not.toBe('1')
  }
  await page.getByRole('button',{name:'Renk temasını değiştir'}).click()
  expect(await page.evaluate(()=>localStorage.getItem('yka-theme'))).toBeNull()
  await page.reload()
  await expect(page.locator(externalFrame).first()).toBeVisible()
  await mkdir('tmp/privacy-qa',{recursive:true})
  await page.screenshot({path:'tmp/privacy-qa/video-default-display.png',animations:'disabled'})
})

test('settings dialog closes on Escape without saving and restores focus',async ({page}) => {
  await page.goto('/tr/contact')
  const customize=page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true})
  await customize.click()
  const dialog=page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('checkbox').nth(0)).not.toBeChecked()
  await expect(dialog.getByRole('checkbox').nth(1)).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(customize).toBeFocused()
  await expect(page.locator('.cookie-banner')).toHaveCount(0)
})

for (const width of [320,375,390,430,768,1280]) {
  test(`public pages fit ${width}px, have usable navigation and automatic video display`,async ({page}) => {
    await page.setViewportSize({width,height:900})
    await page.goto('/tr')
    for (const path of ['/tr','/tr/work','/tr/resume','/tr/contact','/tr/privacy','/tr/cookies','/tr/terms','/en/contact','/en/resume']) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      const size = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
      expect(size.scroll,`${path} overflows at ${width}px`).toBeLessThanOrEqual(size.viewport)
      if (path === '/tr/work') {
        await expect(page.locator(externalFrame).first()).toBeVisible()
        await expect(page.locator('.media-click-preview')).toHaveCount(0)
      }
    }
    if (width<=600) {
      await page.getByRole('button',{name:/Menu/}).click()
      const work = page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Work',exact:true})
      await expect(work).toBeVisible()
      expect((await work.boundingBox()).height).toBeGreaterThanOrEqual(44)
      await work.click()
      await expect(page).toHaveURL(/\/en\/work$/)
      await expect(page.getByRole('button',{name:/Menu/})).toHaveAttribute('aria-expanded','false')
    }
  })
}

test('contact mobile/light and desktop/dark render with privacy notice, phone and all fields',async ({page}) => {
  await mkdir('tmp/privacy-qa',{recursive:true})
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tr/contact')
  await page.getByRole('button',{name:/^Menü/}).click()
  await page.getByRole('button',{name:'Renk temasını değiştir'}).click()
  await page.getByRole('button',{name:/^Kapat/}).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme','light')
  await page.screenshot({path:'tmp/privacy-qa/cookie-mobile.png'})
  await expect(page.getByRole('textbox',{name:'Telefon numarası'})).toHaveAttribute('type','tel')
  await expect(page.getByRole('link',{name:'KVKK aydınlatma metni'})).toBeVisible()
  await page.screenshot({path:'tmp/privacy-qa/contact-mobile.png',fullPage:true})
  await page.setViewportSize({width:1440,height:1050})
  await page.emulateMedia({colorScheme:'dark'})
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.screenshot({path:'tmp/privacy-qa/contact-desktop-dark.png',fullPage:true})
})

test('existing explicit media opt-outs block providers in server HTML and allow one video without settings',async ({page,context,baseURL}) => {
  const record={version:1,updatedAt:Date.now(),preferences:false,externalMedia:false}
  const stored=encodeURIComponent(JSON.stringify(record))
  await context.addCookies([{name:'yka-consent',value:stored,url:baseURL}])
  const response=await page.request.get('/tr/work')
  expect(await response.text()).not.toMatch(/<iframe[^>]+src=/i)
  const requests=[]
  page.on('request',request=>{if(external.test(request.url()))requests.push(request.url())})
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tr/work')
  await expect(page.locator('.media-click-preview').first()).toBeVisible()
  await expect(page.locator(externalFrame)).toHaveCount(0)
  expect(requests).toHaveLength(0)
  for (const platform of ['Instagram','YouTube','TikTok','X']) {
    const card=page.locator('.media-click-preview').filter({has:page.locator('.media-platform',{hasText:new RegExp(`^${platform}$`)})}).first()
    const before=await page.locator('.media-click-preview').count()
    await card.getByRole('button',{name:/Videoyu izle/}).click()
    await expect(page.locator('.media-click-preview')).toHaveCount(before-1)
    await expect(page.locator(externalFrame).first()).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    expect((await context.cookies()).find(cookie=>cookie.name==='yka-consent')?.value).toBe(stored)
    await page.reload()
    await expect(page.locator(externalFrame)).toHaveCount(0)
  }
})

test('restored portfolio grid shows published projects on desktop and mobile without autoplay',async({page})=>{
  await page.goto('/tr/work')
  expect(await page.locator('.portfolio-card').count()).toBeGreaterThan(3)
  await expect(page.locator('.website-grid')).toBeVisible()
  await page.setViewportSize({width:390,height:844})
  await expect(page.locator(externalFrame).first()).toBeVisible()
  for (const src of await page.locator(externalFrame).evaluateAll(frames=>frames.map(frame=>frame.src))) expect(new URL(src).searchParams.get('autoplay')).not.toBe('1')
  await page.goto('/tr')
  await expect(page.locator('.hero h1')).toBeVisible()
  await expect(page.locator('.signature-mark')).toHaveText('YKA.')
  await expect(page.locator('.portfolio-grid .portfolio-card')).toHaveCount(3)
})

test('unconfigured email offers an honest usable draft, never a fake sent confirmation',async({page})=>{
  await page.goto('/tr/contact')
  const prepare=page.getByRole('button',{name:'E-posta taslağını hazırla',exact:true})
  test.skip(!(await prepare.count()),'Live sender configured: actual delivery must be tested separately with consent.')
  await expect(prepare).toBeEnabled()
  await expect(page.locator('.contact-availability')).toHaveCount(0)
  const posts=[]
  page.on('request',request=>{if(request.method()==='POST')posts.push(request.url())})
  await page.getByRole('textbox',{name:'Ad soyad',exact:true}).fill('Browser QA')
  await page.getByRole('textbox',{name:'E-posta adresi',exact:true}).fill('visitor@example.com')
  await page.getByRole('textbox',{name:'Telefon numarası',exact:true}).fill('+90 555 1234567')
  await page.locator('select[name="reason"]').selectOption('project')
  await page.locator('textarea[name="message"]').fill('This is an isolated draft check. Nothing is sent or saved.')
  await prepare.click()
  const draft=page.locator('.contact-draft-ready a')
  await expect(draft).toBeVisible()
  const url=new URL(await draft.getAttribute('href'))
  expect(url.protocol).toBe('mailto:')
  expect(url.pathname).toBe('yusufkerimaltay77@gmail.com')
  expect(url.searchParams.get('body')).toContain('+90 555 1234567')
  expect(posts).toEqual([])
  await expect(page.locator('.contact-success')).toHaveCount(0)
})

test('video visibility changes sync across tabs; declining saved theme does not hide videos',async ({page,context}) => {
  await page.goto('/tr/work')
  const second=await context.newPage()
  await second.goto('/tr/work')
  await expect(second.locator(externalFrame).first()).toBeVisible()
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await dialog.getByRole('checkbox').nth(0).check()
  await dialog.getByRole('button',{name:'Seçimimi kaydet',exact:true}).click()
  await page.getByRole('button',{name:'Renk temasını değiştir'}).click()
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('yka-theme'))).not.toBeNull()
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  await dialog.getByRole('checkbox').nth(1).uncheck()
  await dialog.getByRole('button',{name:'Seçimimi kaydet',exact:true}).click()
  await expect(page.locator(externalFrame)).toHaveCount(0)
  await expect(second.locator(externalFrame)).toHaveCount(0)
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  await dialog.getByRole('checkbox').nth(1).check()
  await dialog.getByRole('button',{name:'Tema kaydını reddet',exact:true}).click()
  await expect(page.locator(externalFrame).first()).toBeVisible()
  await expect(second.locator(externalFrame).first()).toBeVisible()
  expect(await page.evaluate(()=>localStorage.getItem('yka-theme'))).toBeNull()
  const cookie=(await context.cookies()).find(cookie=>cookie.name==='yka-consent')
  expect(JSON.parse(decodeURIComponent(cookie.value))).toMatchObject({preferences:false,externalMedia:true})
  await second.close()
})

test('page canonical/language URLs stay on the same page and all public arrows are SVGs',async ({page}) => {
  for (const locale of ['tr','en']) {
    for (const suffix of ['','/work','/resume','/contact']) {
      await page.goto(`/${locale}${suffix}`)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(`/${locale}${suffix}$`))
      await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute('href',new RegExp(`/tr${suffix}$`))
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href',new RegExp(`/en${suffix}$`))
      expect(await page.locator('body').innerText()).not.toMatch(/[↗↘→←↓↑▶▷]/u)
      expect(await page.locator('svg.arrow-icon').count()).toBeGreaterThan(0)
    }
  }
  await page.goto('/tr/work')
  const details = page.locator('.project-detail-link').first()
  const path = await details.getAttribute('href')
  await details.click()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(`${path}$`))
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href',new RegExp(`${path.replace('/tr/','/en/')}$`))
})

test('admin login stays usable on a narrow screen without submitting credentials',async ({page}) => {
  await page.setViewportSize({width:320,height:740})
  await page.goto('/admin/login')
  await expect(page.getByRole('heading')).toBeVisible()
  const width = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
  expect(width.scroll).toBeLessThanOrEqual(width.viewport)
  await expect(page.locator('.cookie-banner')).toHaveCount(0)
})

test('published project detail and short-screen preferences fit mobile with default players',async ({page}) => {
  await page.setViewportSize({width:320,height:568})
  await page.goto('/tr/work')
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect((await dialog.boundingBox()).height).toBeLessThanOrEqual(528)
  await dialog.getByRole('link',{name:'Gizlilik ve KVKK'}).click()
  await expect(page).toHaveURL(/\/tr\/privacy$/)
  await expect(dialog).not.toBeVisible()
  await page.goto('/tr/work')
  const link = page.locator('.project-detail-link').first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page.locator('.project-detail h1')).toBeVisible()
  const width = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
  expect(width.scroll).toBeLessThanOrEqual(width.viewport)
  await expect(page.locator(externalFrame).first()).toBeVisible()
})
