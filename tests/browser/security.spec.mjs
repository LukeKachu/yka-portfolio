import {test,expect} from '@playwright/test'

test('public and login responses include baseline security headers',async ({request}) => {
  for (const path of ['/tr','/tr/contact','/admin/login']) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const headers = response.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(headers['x-powered-by']).toBeUndefined()
  }
})

test('anonymous visitors are redirected from every admin entry point without exposing admin data',async ({request}) => {
  for (const path of ['/admin','/admin/projects','/admin/resume','/admin/settings','/admin/resume/upload']) {
    const response = await request.get(path,{maxRedirects:0})
    expect([303,307,308]).toContain(response.status())
    const location = new URL(response.headers().location,'http://localhost:3000')
    expect(location.pathname).toBe('/admin/login')
  }
})
