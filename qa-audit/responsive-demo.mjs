import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND = 'http://localhost:5173'
const OUT_DIR = path.join(__dirname, 'output', 'responsive-demo')

async function login(page) {
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1200)
  await page.locator('input[type=email]').first().fill('admin@sriram.com')
  await page.locator('input[type=password]').first().fill('admin123')
  await page.locator('button[type=submit]').first().click()
  await page.waitForTimeout(3500)
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const viewports = [
  { label: '1366x768', width: 1366, height: 768 },
  { label: '1920x1080', width: 1920, height: 1080 },
]

const results = []

for (const vp of viewports) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await login(page)

  await page.goto(`${FRONTEND}/marketing/free-learning-resources`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  })
  await page.waitForTimeout(1500)
  results.push({
    viewport: vp.label,
    page: 'free-learning-resources-list',
    file: await shot(page, `${vp.label}-flr-list`),
  })

  await page.getByRole('button', { name: 'View' }).first().click()
  await page.waitForTimeout(1500)
  results.push({
    viewport: vp.label,
    page: 'free-learning-resources-view',
    file: await shot(page, `${vp.label}-flr-view`),
  })

  await page.goto(`${FRONTEND}/marketing/free-learning-resources`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Edit' }).first().click()
  await page.waitForTimeout(1500)
  results.push({
    viewport: vp.label,
    page: 'free-learning-resources-edit',
    file: await shot(page, `${vp.label}-flr-edit`),
  })

  await page.goto(`${FRONTEND}/users/manage`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(1500)
  results.push({
    viewport: vp.label,
    page: 'manage-users',
    file: await shot(page, `${vp.label}-manage-users`),
  })

  await browser.close()
}

console.log(JSON.stringify({ outDir: OUT_DIR, results }, null, 2))
