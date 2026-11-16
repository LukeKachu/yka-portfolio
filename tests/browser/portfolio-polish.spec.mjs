import {test,expect} from '@playwright/test'

test.beforeEach(async({context})=>{
  await context.route(/https:\/\/(?:[^/]*\.)?(?:youtube(?:-nocookie)?\.com|ytimg\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com)\//i,route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated player fixture</body></html>'}))
})

test('CV is a real downloadable public PDF outside the repository and localized resume remains readable',async({page,request})=>{
  for(const locale of ['tr','en']){
    await page.goto(`/${locale}/resume`)
    const href=await page.locator('.resume-download').getAttribute('href')
    expect(new URL(href).pathname).toContain('/storage/v1/object/public/resume-public/')
    const pdf=await request.get(href)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')
    expect((await pdf.body()).subarray(0,5).toString()).toBe('%PDF-')
    expect(await page.locator('.resume-document iframe').getAttribute('src')).toBe(href)
    await expect(page.locator('.volunteering-card')).toContainText(locale==='tr'?'Pamukkale Üniversitesi İşletme Kulübü':'Pamukkale University Business Community')
  }
})

test('publication reach is localized, separates X impressions and includes the new video',async({page})=>{
  for(const locale of ['tr','en']){
    await page.goto(`/${locale}/work`)
    await expect(page.locator('.reach-number')).toHaveText(locale==='tr'?'19,5M+':'19.5M+')
    await page.locator('.portfolio-reach summary').click()
    await expect(page.locator('.reach-disclosure')).toContainText(locale==='tr'?'19.500.000':'19,500,000')
    await expect(page.locator('.reach-disclosure')).toContainText(locale==='tr'?'video oynatma sayısı değildir':'not video plays')
    await expect(page.locator('.portfolio-card h3').first()).toContainText(locale==='tr'?'Yatır Kazan':'Deposit and Earn')
    await expect(page.locator('.portfolio-card').first().locator('iframe')).toHaveAttribute('src',/De9VbLouGso/)
  }
})

test('home, project details and 404 fit narrow mobile and desktop without changing navigation or form',async({page})=>{
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900})
    for(const path of ['/tr','/tr/work/okx-tr-50-usdt-x','/en/work/not-a-real-project','/tr/nonexistent-review-page']){
      await page.goto(path)
      await expect(page.locator('main,article.project-detail').first()).toBeVisible()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      if(path==='/tr'){
        await expect(page.locator('.capability-group')).toHaveCount(3)
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/yka-social.png$/)
        await page.screenshot({path:`tmp/privacy-qa/polish-home-${width}.png`,fullPage:true})
      }
      if(path==='/tr/work/okx-tr-50-usdt-x')await expect(page.locator('.project-body')).toContainText('Fikir ve senaryo')
      if(path.includes('not-a-real')||path.includes('nonexistent')){
        const content=page.locator('.not-found-page')
        await expect(content).toContainText('404')
        await expect(content.getByRole('link',{name:path.startsWith('/en')?'Contact':'İletişim',exact:true})).toHaveAttribute('href',path.startsWith('/en')?'/en/contact':'/tr/contact')
      }
    }
  }
})
