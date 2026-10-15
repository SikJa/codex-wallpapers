import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {createServer} from 'node:net'
import {spawn} from 'node:child_process'
import {pathToFileURL} from 'node:url'

const pw = process.env.PLAYWRIGHT_MODULE ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)) : await import('playwright')
await fs.mkdir('test-results', {recursive: true})
const data = await fs.mkdtemp(path.resolve('test-results/obs-'))
await fs.writeFile(path.join(data, 'camera-config.json'), JSON.stringify({
  bannerMessages: ['Use $ to talk to your bot'], priorityMessage: 'Use $ to talk to your bot',
  socials: [{network: 'discord', handle: 'https://discord.gg/example'}],
}))
const reservation = createServer()
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve))
const port = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const url = `http://127.0.0.1:${port}`
// Isolate all data and disable engine discovery; browser usage is an explicit fixture.
const child = spawn(process.execPath, ['obs-overlay/server.mjs'], {windowsHide: true,
  env: {...process.env, CW_OBS_PORT: String(port), CODEX_WALLPAPERS_DATA: data, LOCALAPPDATA: data}, stdio: 'ignore'})
let browser
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url + '/state')).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.equal((await (await fetch(url + '/state')).json()).available, false)
  assert.equal((await fetch(url + '/camera-overlay/secret.json')).status, 404)
  browser = await pw.chromium.launch({headless: true, ...(process.env.CW_TEST_BROWSER ? {executablePath: process.env.CW_TEST_BROWSER} : {})})
  const errors = []
  for (const [route, width, height] of [['camera-preview', 1000, 900], ['camera-overlay', 400, 500], ['camera-overlay', 320, 430]]) {
    const page = await browser.newPage({viewport: {width, height}})
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/state', route => route.fulfill({json: {available: true, percent: 74, resetAt: Date.now() + 100000000, updatedAt: Date.now(), accent: '#b7bdc7'}}))
    await page.goto(url + '/' + route)
    await page.waitForFunction(() => window.__INTERLEAVE_PREVIEW__?.holdSeconds === 24)
    await page.locator('#ip-play').evaluate(el => el.click())
    await page.frameLocator('iframe').locator('.value').filter({hasText: '74'}).waitFor()
    await page.evaluate(() => window.__INTERLEAVE_ACTIONS__.next())
    await page.waitForFunction(() => window.__INTERLEAVE_PREVIEW__.index === 1)
    for (let direction = 0; direction < 2; direction++) {
      await page.evaluate(() => window.__INTERLEAVE_ACTIONS__.swap())
      await page.waitForTimeout(200)
      assert.equal(await page.locator('.ip-beam').first().evaluate(el => getComputedStyle(el).visibility), 'hidden')
      await page.waitForTimeout(600)
      const geometry = await page.evaluate(() => {
        const banner = document.querySelector('.ip-banner').getBoundingClientRect()
        const usage = document.querySelector('.ip-usage').getBoundingClientRect()
        const svg = document.querySelector('.ip-mark svg').getBoundingClientRect()
        const mark = document.querySelector('.ip-mark path').getBoundingClientRect()
        return {overlap: Math.min(banner.bottom, usage.bottom) - Math.max(banner.top, usage.top),
          right: Math.max(banner.right, usage.right), bottom: Math.max(banner.bottom, usage.bottom),
          centered: Math.abs((svg.left + svg.right - mark.left - mark.right) / 2) < 1 && Math.abs((svg.top + svg.bottom - mark.top - mark.bottom) / 2) < 1,
          beam: getComputedStyle(document.querySelector('.ip-beam')).visibility}
      })
      assert.ok(geometry.overlap <= 0, 'cards must not overlap at rest')
      assert.ok(geometry.centered, 'Discord glyph must be centered in its SVG')
      assert.equal(geometry.beam, 'visible')
      if (route === 'camera-overlay') {
        assert.ok(geometry.right <= width && geometry.bottom <= height, 'capture must fit its viewport')
        assert.equal(await page.locator('.ip-camera').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
      }
    }
    await page.screenshot({path: `test-results/${route}-${width}.png`})
    await page.emulateMedia({reducedMotion: 'reduce'})
    assert.equal(await page.locator('.ip-beam path').first().evaluate(el => getComputedStyle(el).animationName), 'none')
    await page.close()
  }
  // Existing personal HTML must remain authoritative and never mix with new assets.
  await fs.mkdir(path.join(data, 'camera-overlay'))
  await fs.writeFile(path.join(data, 'camera-overlay/index.html'), '<p>Private fixture</p>')
  assert.match(await (await fetch(url + '/camera-overlay')).text(), /Private fixture/)
  assert.equal((await fetch(url + '/camera-overlay/app.js')).status, 404)
  assert.deepEqual(errors, [])
  console.log('PASS: shared preview/capture, real built orb with fixture quota, 3 viewport cases, both swaps, centered Discord, beam visibility, reduced motion, private override isolation.')
} finally {
  await browser?.close()
  child.kill()
}
