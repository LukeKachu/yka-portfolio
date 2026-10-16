import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir:'./tests/browser',
  outputDir:'./tmp/privacy-test-results',
  timeout:90000,
  expect:{timeout:10000},
  workers:1,
  reporter:'list',
  use:{baseURL:process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',channel:'chrome',headless:true,viewport:{width:1280,height:900},reducedMotion:'reduce',screenshot:'only-on-failure'},
})
