import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {pathToFileURL} from 'node:url'

const modulePath=process.env.PLAYWRIGHT_MODULE
if(!modulePath)throw Error('Set PLAYWRIGHT_MODULE to an installed playwright/index.mjs')
const {chromium}=await import(pathToFileURL(modulePath))
const browser=await chromium.launch({headless:true,executablePath:process.env.CW_TEST_BROWSER})
try{
  const page=await browser.newPage({viewport:{width:300,height:100},deviceScaleFactor:2})
  page.on('pageerror',error=>console.error('PAGE ERROR:',error.message))
  page.on('response',response=>{if(response.status()>=400)console.error('HTTP ERROR:',response.status(),response.url())})
  await page.goto('http://127.0.0.1:8794/')
  const actual=await (await fetch('http://127.0.0.1:8794/state')).json()
  await page.waitForFunction(percent=>document.querySelector('main')?.getAttribute('aria-label')?.includes(`${percent}%`),actual.percent,{timeout:5000})
  assert.equal(actual.available,true)
  assert.equal(await page.locator('.orb').count(),1)
  assert.equal(await page.locator('.t-digit-group').textContent(),String(actual.percent))
  if(actual.resetAt&&actual.resetAt>Date.now())assert.match(await page.locator('.reset').textContent(),/^Se restablece en (\d+ d \d+ h|\d+ h|\d+ min)$/)
  const background=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor)
  assert.equal(background,'rgba(0, 0, 0, 0)')
  await page.waitForFunction(()=>[...document.querySelectorAll('.t-digit')].every(el=>el.getAnimations().every(animation=>animation.playState==='finished')))
  await fs.mkdir('test-results',{recursive:true})
  await page.screenshot({path:'test-results/obs-usage-overlay.png',omitBackground:true})
  console.log(`PASS: live ${actual.percent}% shown with original orb and transparent canvas.`)
}finally{await browser.close()}
