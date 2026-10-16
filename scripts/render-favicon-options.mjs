import {chromium} from '@playwright/test'
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import sharp from 'sharp'

// Render code-native vector drafts in an isolated headless browser; the installed app icons stay untouched.
const browser = await chromium.launch({channel:'chrome',headless:true})
try {
  const page = await browser.newPage({viewport:{width:1280,height:1000},colorScheme:'light',deviceScaleFactor:1})
  await page.goto(pathToFileURL(resolve('design/favicon/index.html')).href)
  await page.screenshot({path:'design/favicon/options-light.png',fullPage:true})
  await page.emulateMedia({colorScheme:'dark'})
  await page.screenshot({path:'design/favicon/options-dark.png',fullPage:true})
  for (const name of ['01-wordmark','02-ligature','03-editorial']) {
    const svg = await readFile(`design/favicon/${name}.svg`)
    await sharp(svg).resize(256,256).png().toFile(`design/favicon/${name}.png`)
  }
  console.log('Three favicon drafts rendered. app/icon.svg, favicon.ico and apple-icon.png were not replaced.')
} finally {await browser.close()}
