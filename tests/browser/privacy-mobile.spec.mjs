import {test,expect} from '@playwright/test'
import {mkdir} from 'node:fs/promises'

const external = /https:\/\/(?:[^/]*\.)?(?:youtube(?:-nocookie)?\.com|ytimg\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|videodelivery\.net|cloudflarestream\.com)\//i
const externalFrame = 'iframe[src*="twitter.com"],iframe[src*="instagram.com"],iframe[src*="tiktok.com"],iframe[src*="youtube"],iframe[src*="videodelivery"],iframe[src*="cloudflarestream"]'

test('optional media is blocked before consent, rejection persists, and media can be enabled and revoked',async ({page,context}) => {
  const requests = []
  await context.route(external,async route => {
    requests.push(route.request().url())
    // Isolated network fixtures: no information is actually sent to media providers during QA.
    await route.fulfill({status:200,contentType:route.request().resourceType() === 'image' ? 'image/svg+xml' : 'text/html',body:route.request().resourceType() === 'image' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#435f3d"/></svg>' : '<html><body>Isolated media test frame</body></html>'})
  })
  await page.goto('/tr/work')
  await expect(page.getByRole('heading',{name:'Kontrol sende.'})).toBeVisible()
  await expect(page.locator('.portfolio-card').first()).toBeVisible()
  await expect(page.locator(externalFrame)).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await mkdir('tmp/privacy-qa',{recursive:true})
  await page.screenshot({path:'tmp/privacy-qa/cookie-banner.png'})
  await page.getByRole('button',{name:'İsteğe bağlıları reddet',exact:true}).click()
  await page.reload()
  await expect(page.locator('.cookie-banner')).toHaveCount(0)
  await expect(page.locator(externalFrame)).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await page.getByRole('button',{name:'Renk temasını değiştir'}).click()
  expect(await page.evaluate(() => localStorage.getItem('yka-theme'))).toBeNull()
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const dialogBox = await dialog.boundingBox()
  expect(Math.abs(dialogBox.x-(1280-dialogBox.width)/2)).toBeLessThan(2)
  await expect(dialog.getByRole('checkbox').nth(0)).not.toBeChecked()
  await expect(dialog.getByRole('checkbox').nth(1)).not.toBeChecked()
  await page.screenshot({path:'tmp/privacy-qa/cookie-settings.png'})
  await dialog.getByRole('checkbox').nth(0).check()
  await dialog.getByRole('checkbox').nth(1).check()
  await dialog.getByRole('button',{name:'Seçimimi kaydet'}).click()
  await expect(page.locator(externalFrame).first()).toBeVisible()
  expect(requests.length).toBeGreaterThan(0)
  await page.getByRole('button',{name:'Renk temasını değiştir'}).click()
  expect(await page.evaluate(() => localStorage.getItem('yka-theme'))).not.toBeNull()
  const second = await context.newPage()
  await second.goto('/tr/work')
  await expect(second.locator(externalFrame).first()).toBeVisible()
  await page.locator('.legal-footer').getByRole('button',{name:'Çerez tercihleri',exact:true}).click()
  await dialog.getByRole('button',{name:'İsteğe bağlıları reddet',exact:true}).click()
  await expect(page.locator(externalFrame)).toHaveCount(0)
  await expect(second.locator(externalFrame)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('yka-theme'))).toBeNull()
  const cookie = (await context.cookies()).find(item => item.name === 'yka-consent')
  const choice = JSON.parse(decodeURIComponent(cookie.value))
  expect(choice.preferences).toBe(false)
  expect(choice.externalMedia).toBe(false)
  await second.close()
})

test('settings dialog closes on Escape without granting permission and restores focus',async ({page}) => {
  await page.goto('/tr/contact')
  const customize = page.getByRole('button',{name:'Tercihlerimi seç'})
  await customize.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(customize).toBeFocused()
  await expect(page.locator('.cookie-banner')).toBeVisible()
})

for (const width of [320,375,390,430,768,1280]) {
  test(`public pages fit ${width}px, have usable navigation and no clipped media consent controls`,async ({page}) => {
    await page.setViewportSize({width,height:900})
    await page.goto('/tr')
    await page.getByRole('button',{name:'İsteğe bağlıları reddet',exact:true}).click()
    for (const path of ['/tr','/tr/work','/tr/resume','/tr/contact','/tr/privacy','/tr/cookies','/tr/terms','/en/contact','/en/resume']) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      const size = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
      expect(size.scroll,`${path} overflows at ${width}px`).toBeLessThanOrEqual(size.viewport)
      if (path === '/tr/work') {
        const clipped = await page.locator('.media-consent').evaluateAll(cards => cards.map(card => ({height:card.clientHeight,scroll:card.scrollHeight})).filter(card => card.scroll>card.height+2))
        expect(clipped).toEqual([])
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
  await page.screenshot({path:'tmp/privacy-qa/cookie-mobile.png'})
  await page.getByRole('button',{name:'İsteğe bağlıları reddet',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Telefon numarası'})).toHaveAttribute('type','tel')
  await expect(page.getByRole('link',{name:'KVKK aydınlatma metni'})).toBeVisible()
  await page.screenshot({path:'tmp/privacy-qa/contact-mobile.png',fullPage:true})
  await page.setViewportSize({width:1440,height:1050})
  await page.emulateMedia({colorScheme:'dark'})
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.screenshot({path:'tmp/privacy-qa/contact-desktop-dark.png',fullPage:true})
})

test('admin login stays usable on a narrow screen without submitting credentials',async ({page}) => {
  await page.setViewportSize({width:320,height:740})
  await page.goto('/admin/login')
  await expect(page.getByRole('heading')).toBeVisible()
  const width = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
  expect(width.scroll).toBeLessThanOrEqual(width.viewport)
  await expect(page.locator('.cookie-banner')).toHaveCount(0)
})

test('published project detail and short-screen consent dialog fit mobile without optional network traffic',async ({page}) => {
  await page.setViewportSize({width:320,height:568})
  await page.goto('/tr/work')
  await page.getByRole('button',{name:'Tercihlerimi seç'}).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect((await dialog.boundingBox()).height).toBeLessThanOrEqual(528)
  await dialog.getByRole('link',{name:'Gizlilik ve KVKK'}).click()
  await expect(page).toHaveURL(/\/tr\/privacy$/)
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button',{name:'İsteğe bağlıları reddet',exact:true}).click()
  await page.goto('/tr/work')
  const link = page.locator('.project-detail-link').first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page.locator('.project-detail h1')).toBeVisible()
  const width = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
  expect(width.scroll).toBeLessThanOrEqual(width.viewport)
  await expect(page.locator(externalFrame)).toHaveCount(0)
})
