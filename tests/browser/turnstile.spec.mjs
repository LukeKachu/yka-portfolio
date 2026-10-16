import {test,expect} from '@playwright/test'
import {build} from 'esbuild'

let bundle
test.beforeAll(async()=>{
  // Render the real form with explicit props in a route-intercepted harness.
  // No .env edits, real keys, provider traffic, messages or database writes.
  const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {ContactForm} from './components/public/contact-form';createRoot(document.getElementById('root')).render(<ContactForm locale="tr" email="owner@example.com" deliveryAvailable={true} turnstileSiteKey="1x00000000000000000000AA"/>);`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'}})
  bundle=result.outputFiles[0].text
})

test.beforeEach(async({page})=>{
  page.on('pageerror',error=>console.log('Isolated widget harness:',error.message))
  await page.route('**/__turnstile_harness',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root" style="max-width:600px;margin:20px"></div><style>*{box-sizing:border-box}.contact-field{display:flex;flex-direction:column;margin:10px 0}.contact-honeypot{display:none}.contact-captcha-widget{width:100%}input,textarea,select{width:100%}</style><script src="/turnstile-test-bundle.js"></script></body></html>'}))
  await page.route('**/turnstile-test-bundle.js',route=>route.fulfill({contentType:'text/javascript',body:bundle}))
  await page.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'text/javascript',body:`window.qaChallenge={count:0};window.turnstile={render:function(el,options){const id=String(++window.qaChallenge.count);const button=document.createElement('button');button.type='button';button.textContent='QA complete challenge';button.onclick=()=>options.callback('isolated-token-'+id);el.replaceChildren(button);window.qaChallenge.options=options;window.qaChallenge.size=options.size;return id},remove:function(){},reset:function(){window.qaChallenge.options.callback('isolated-reset-token')}};`}))
})

async function fill(page) {
  await page.locator('input[name="name"]').fill('Browser QA')
  await page.locator('input[name="email"]').fill('visitor@example.com')
  await page.locator('input[name="phone"]').fill('+90 555 1234567')
  await page.locator('select[name="reason"]').selectOption('other')
  await page.locator('textarea[name="message"]').fill('This isolated test message is longer than twenty characters.')
}

test('verification gates sending and retries use fresh tokens without duplicating the submission identity',async({page})=>{
  const posts=[]
  await page.route('**/api/contact',async route=>{
    posts.push(route.request().postData())
    await route.fulfill({status:posts.length===1?503:200,contentType:'application/json',body:posts.length===1?' {"ok":false,"code":"unavailable"}':'{"ok":true}'})
  })
  await page.goto('/__turnstile_harness')
  await fill(page)
  await expect(page.locator('.contact-submit')).toBeDisabled()
  await page.getByRole('button',{name:'QA complete challenge'}).click()
  await expect(page.locator('.contact-submit')).toBeEnabled()
  await page.locator('.contact-submit').click()
  await expect(page.locator('.contact-error')).toBeVisible()
  await expect(page.locator('.contact-submit')).toBeDisabled()
  await expect(page.locator('textarea[name="message"]')).toHaveValue('This isolated test message is longer than twenty characters.')
  await page.getByRole('button',{name:'QA complete challenge'}).click()
  await page.locator('.contact-submit').click()
  await expect(page.locator('.contact-success')).toBeVisible()
  const value=(body,name)=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]+)'))?.[1]
  expect(value(posts[0],'requestId')).toBeTruthy()
  expect(value(posts[0],'requestId')).toBe(value(posts[1],'requestId'))
  expect(value(posts[0],'cf-turnstile-response')).not.toBe(value(posts[1],'cf-turnstile-response'))
})

test('expiry disables sending and the compact widget fits a narrow mobile form',async({page})=>{
  await page.setViewportSize({width:320,height:740})
  await page.goto('/__turnstile_harness')
  await page.getByRole('button',{name:'QA complete challenge'}).click()
  await expect(page.locator('.contact-submit')).toBeEnabled()
  await expect.poll(()=>page.evaluate(()=>window.qaChallenge.size)).toBe('compact')
  // Trigger the provider callback in this isolated fixture, not the live widget.
  await page.evaluate(()=>window.qaChallenge.options['expired-callback']())
  await expect(page.locator('.contact-submit')).toBeDisabled()
  await expect(page.locator('.contact-captcha')).toContainText('süresi doldu')
  await page.getByRole('button',{name:'Yeniden doğrula'}).click()
  await expect(page.locator('.contact-submit')).toBeEnabled()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})
