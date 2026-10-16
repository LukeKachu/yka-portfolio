import {test,expect} from '@playwright/test'

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
