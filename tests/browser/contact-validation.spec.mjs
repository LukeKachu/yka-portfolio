import {test,expect} from '@playwright/test'

test('skip link is hidden during form editing but remains reachable by keyboard',async({page})=>{
  await page.setViewportSize({width:320,height:740})
  await page.goto('/tr/contact')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await expect(page.locator('.skip-link')).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.locator('textarea[name="message"]').fill('An isolated message that stays in this browser only.')
  const skip=await page.locator('.skip-link').evaluate(el=>({focused:el.matches(':focus'),bottom:el.getBoundingClientRect().bottom,transform:getComputedStyle(el).transform}))
  expect(skip.focused).toBe(false)
  expect(skip.bottom,JSON.stringify(skip)).toBeLessThanOrEqual(0)
})

for(const width of [320,375,430,740]) {
  test(`phone-free draft works at ${width}px, remains readable and never sends (${width})`,async({page})=>{
    await page.setViewportSize({width,height:width===740?360:740})
    await page.route('**/api/contact',()=>{throw new Error('A draft must never submit to the API')})
    for(const locale of ['tr','en']) {
      await page.goto(`/${locale}/contact`)
      const prepare=page.locator('.contact-submit')
      test.skip(!(await prepare.innerText()).match(/taslağını|draft/),'Use isolated widget harness for configured server-delivery testing.')
      await page.locator('input[name="name"]').fill('Browser QA')
      await page.locator('input[name="email"]').fill('visitor@example.com')
      await page.locator('select[name="reason"]').selectOption('other')
      await page.locator('textarea[name="message"]').fill('A genuine-looking isolated draft. No message is sent or stored.')
      await expect(page.locator('input[name="phone"]')).not.toHaveAttribute('required')
      for(const control of await page.locator('.contact-fields input,.contact-fields select,.contact-fields textarea').all()) {
        expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44)
        if(width<=600)expect(await control.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
      }
      await prepare.click()
      const link=page.locator('.contact-draft-ready a')
      await expect(link).toBeVisible()
      expect(new URL(await link.getAttribute('href')).searchParams.get('body')).not.toMatch(/(?:Telefon|Phone):/)
      await expect(page.locator('.contact-success')).toHaveCount(0)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await page.locator('textarea[name="message"]').fill('A revised draft message exceeding twenty characters.')
      await expect(link).toHaveCount(0)
    }
    await page.screenshot({path:`tmp/privacy-qa/contact-optional-${width}.png`,fullPage:true})
  })
}

test('a long message never reports a message-length error when the phone field is invalid',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tr/contact')
  const posts=[]
  page.on('request',request=>{if(request.method()==='POST')posts.push(request.url())})
  await page.getByRole('textbox',{name:'Ad soyad',exact:true}).fill('Browser QA')
  await page.getByRole('textbox',{name:'E-posta adresi',exact:true}).fill('visitor@example.com')
  await page.getByRole('textbox',{name:'Telefon numarası',exact:true}).fill('not-a-number')
  await page.locator('select[name="reason"]').selectOption('project')
  await page.locator('textarea[name="message"]').fill('This message is deliberately longer than twenty characters. Nothing is sent during this test.')
  await page.locator('.contact-submit').click()
  await expect(page.getByRole('textbox',{name:'Telefon numarası',exact:true})).toHaveAttribute('aria-invalid','true')
  await expect(page.getByRole('textbox',{name:'Telefon numarası',exact:true})).toBeFocused()
  await expect(page.locator('#contact-phone-error')).toContainText('7–15')
  await expect(page.locator('#contact-message-error')).toHaveCount(0)
  await expect(page.locator('.contact-error')).not.toContainText('20 karakter')
  expect(posts).toEqual([])
  await page.getByRole('textbox',{name:'Telefon numarası',exact:true}).fill('+90 555 123 45 67')
  await expect(page.locator('#contact-phone-error')).toHaveCount(0)
})

test('short messages and bad emails have distinct inline errors in both locales',async({page})=>{
  for(const locale of ['tr','en']) {
    await page.goto(`/${locale}/contact`)
    await page.locator('input[name="name"]').fill('Browser QA')
    await page.locator('input[name="email"]').fill('invalid-email')
    await page.locator('input[name="phone"]').fill('+90 555 1234567')
    await page.locator('select[name="reason"]').selectOption('other')
    await page.locator('textarea[name="message"]').fill('Short text')
    await page.locator('.contact-submit').click()
    await expect(page.locator('#contact-email-error')).toBeVisible()
    await expect(page.locator('#contact-message-error')).toContainText('20–4000')
    await expect(page.locator('input[name="email"]')).toBeFocused()
    await expect(page.locator('#contact-phone-error')).toHaveCount(0)
  }
})

test('neutral autofill-resistant bot trap still rejects populated fields without sending',async({page})=>{
  await page.goto('/tr/contact')
  const posts=[]
  page.on('request',request=>{if(request.method()==='POST')posts.push(request.url())})
  await page.locator('input[name="name"]').fill('Browser QA')
  await page.locator('input[name="email"]').fill('visitor@example.com')
  await page.locator('input[name="phone"]').fill('+90 555 1234567')
  await page.locator('select[name="reason"]').selectOption('other')
  await page.locator('textarea[name="message"]').fill('A message longer than twenty characters. Nothing is sent.')
  await page.locator('input[name="contact_check"]').fill('bot',{force:true})
  await page.locator('.contact-submit').click()
  await expect(page.locator('.contact-error')).toContainText('Form doğrulanamadı')
  await expect(page.locator('.contact-error')).not.toContainText('20 karakter')
  expect(posts).toEqual([])
  await expect(page.locator('.contact-success')).toHaveCount(0)
})
