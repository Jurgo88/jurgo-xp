// Renders scripts/og-image.html to public/og-image.png (1200x630 share image).
// Run: node scripts/make-og-image.mjs   (needs Playwright + Chromium)
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// require() so a globally installed Playwright works too (NODE_PATH=$(npm root -g))
const { chromium } = createRequire(import.meta.url)('playwright')

const html = new URL('./og-image.html', import.meta.url)
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(html.href, { waitUntil: 'networkidle' })
await page.screenshot({ path: out })
await browser.close()
console.log('wrote', out)
