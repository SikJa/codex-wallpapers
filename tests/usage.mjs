import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const pw=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)):await import('playwright');
const browser=await pw.chromium.launch({headless:true,...(process.env.CW_TEST_BROWSER?{executablePath:process.env.CW_TEST_BROWSER}:{})});
try{
 const page=await browser.newPage();await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
 await page.setContent('<html lang="en"><head></head><body><main data-app-shell-main-surface></main><button aria-label="Open profile menu">Demo</button></body></html>');
 await page.evaluate(()=>{
  window.calls=0;window.subscribers=new Set();
  window.nativeQuery={queryKey:['rate-limit-status'],state:{dataUpdatedAt:Date.now(),fetchStatus:'idle',data:{rate_limit:{primary_window:{used_percent:12},secondary_window:{used_percent:38}}}}};
  const cache={find:()=>window.nativeQuery,subscribe:fn=>{window.subscribers.add(fn);return()=>window.subscribers.delete(fn)}};
  const client={getQueryCache:()=>cache,async refetchQueries(){window.calls++;nativeQuery.state.dataUpdatedAt=Date.now();for(const f of subscribers)f({query:nativeQuery})}};
  document.querySelector('main').__reactFiber$test={memoizedProps:{value:client},return:null};
 });
 await page.evaluate((await fs.readFile('src/usage.js','utf8'))+'()');
 assert.equal(await page.locator('[data-cw-usage]').textContent(),'62% left');
 assert.equal(await page.evaluate(()=>window.calls),0);
 await page.clock.fastForward(31000);
 assert.equal(await page.evaluate(()=>window.calls),1);
 // Native updates reach the badge without opening a menu.
 await page.evaluate(()=>{nativeQuery.state.data.rate_limit.primary_window.used_percent=65;for(const f of subscribers)f({query:nativeQuery})});
 assert.equal(await page.locator('[data-cw-usage]').textContent(),'35% left');assert.equal(await page.locator('[role=menu]').count(),0);
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));
 await page.clock.fastForward(150000);assert.equal(await page.evaluate(()=>window.calls),1);assert.equal(await page.locator('[data-cw-usage]').textContent(),'—');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.documentElement.lang='pt-BR';window.dispatchEvent(new Event('focus'))});
 await page.waitForFunction(()=>document.querySelector('[data-cw-usage]').textContent==='35% left');assert.equal(await page.evaluate(()=>window.calls),2);
 await page.evaluate(()=>window.__CW_USAGE__.dispose());await page.clock.fastForward(90000);assert.equal(await page.locator('[data-cw-usage]').count(),0);assert.equal(await page.evaluate(()=>window.calls),2);assert.equal(await page.evaluate(()=>window.subscribers.size),0);
 console.log('PASS: native usage events, automatic 30s refresh, hidden pause, stale data, English labels across host locales and cleanup.');
}finally{await browser.close()}
