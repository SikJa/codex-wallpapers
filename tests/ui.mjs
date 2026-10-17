import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { importMedia,readLibrary } from '../src/library.mjs';
import { payload,applyWindow } from '../src/apply.mjs';
const pw=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)):await import('playwright');
const exec=promisify(execFile),out=path.resolve('test-results');await fs.mkdir(out,{recursive:true});
const data=await fs.mkdtemp(path.join(out,'library-'));
const png=path.join(data,'test-input.png'),video=path.join(data,'test-input.mp4');
await exec(process.env.FFMPEG||'ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x123548:s=1280x720','-frames:v','1',png]);
await exec(process.env.FFMPEG||'ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=s=640x360:r=24','-t','1','-c:v','libx264','-pix_fmt','yuv420p',video]);
const image=await importMedia(png,{root:data,title:'Imagen de prueba <script>'});const movie=await importMedia(video,{root:data,title:'Video de prueba'});
assert.equal((await importMedia(png,{root:data})).id,image.id);assert.equal((await readLibrary(data)).items.length,2);
const html=await fs.readFile('tests/fixture.html');const server=createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const results=[];
try{
 browser=await pw.chromium.launch({headless:true,...(process.env.CW_TEST_BROWSER?{executablePath:process.env.CW_TEST_BROWSER}:{})});const context=await browser.newContext({viewport:{width:1200,height:820}});const page=await context.newPage();const url=`http://127.0.0.1:${server.address().port}/`;await page.goto(url);const code=await payload();
 await applyWindow({evaluate:x=>page.evaluate(x)},{schema:1,items:[]},data,code);
 assert.equal(await page.locator('#cw-media').count(),0);await page.locator('#profile').click();assert.equal(await page.locator('[data-cw-menu]').textContent(),'Wallpapers');await page.locator('[data-cw-menu]').click();await page.locator('#empty').waitFor({state:'visible'});await page.screenshot({path:path.join(out,'empty-library.png')});results.push('Empty library; profile button; native dialog');
 assert.equal(await page.locator('#heading').textContent(),'Your wallpapers');
 assert.equal(await page.locator('#search').getAttribute('placeholder'),'Search wallpapers');
 assert.equal(await page.locator('#toggle').textContent(),'Disable wallpaper');
 assert.ok((await page.locator('#close').boundingBox()).width>=40);
 await page.locator('#close').click();
 assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
 await page.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.open());
 await page.keyboard.press('Escape');
 const library=await readLibrary(data);
 await applyWindow({evaluate:x=>page.evaluate(x)},library,data,code);
 await page.evaluate(id=>window.__CODEX_WALLPAPERS_PUBLIC__.select(id),image.id);
 await applyWindow({evaluate:x=>page.evaluate(x)},library,data,code);
 assert.equal(await page.locator('#cw-media').count(),1);assert.equal(await page.locator('#cw-media').evaluate(e=>e.naturalWidth),1280);
 assert.equal(await page.locator('aside.app-shell-left-panel > div > div.max-w-full').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'14px');
 assert.notEqual(await page.locator('aside.app-shell-left-panel > div > div.max-w-full').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cw-sidebar-opacity').trim()),'48%');
 assert.equal(await page.locator('[data-settings]').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'18px');assert.equal(await page.locator('[data-settings]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 assert.equal(await page.locator('textarea').count(),1);await page.locator('textarea').fill('El compositor sigue funcionando.');results.push('Image; palette; rounded settings; composer input preserved');
 await page.locator('#profile').click();await page.locator('[data-cw-menu]').click();await page.locator('[data-kind=video]').click();assert.equal(await page.locator('#grid button:visible').count(),1);await page.locator('#search').fill('missing');assert.equal(await page.locator('#grid button:visible').count(),0);await page.locator('#search').fill('');await page.locator('[data-kind=all]').click();await page.screenshot({path:path.join(out,'populated-library.png')});await page.keyboard.press('Escape');
 await page.evaluate(id=>window.__CODEX_WALLPAPERS_PUBLIC__.select(id),movie.id);await applyWindow({evaluate:x=>page.evaluate(x)},library,data,code);await page.waitForTimeout(300);assert.equal(await page.locator('#cw-media').evaluate(e=>e.videoWidth),640);assert.equal(await page.locator('#cw-media').evaluate(e=>e.muted),true);assert.equal(await page.locator('#cw-media').evaluate(e=>e.paused),false);
 await context.grantPermissions([]);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('#cw-media').evaluate(e=>e.paused),true);results.push('Search/filters; video muted; reduced-motion pause');
 // Current Codex places a solid native background behind the composer footer.
 await page.evaluate(()=>{const footer=document.createElement('div');footer.dataset.threadScrollFooter='true';footer.innerHTML='<div class="pointer-events-none absolute inset-x-0 bg-surface" style="background:rgb(0,0,0)"></div>';document.body.append(footer);});
 assert.equal(await page.locator('[data-thread-scroll-footer] > .bg-surface').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 results.push('Native footer background remains transparent behind composer');
 // A second independent document receives the complete runtime and saved choice.
 const second=await context.newPage();await second.goto(url);await applyWindow({evaluate:x=>second.evaluate(x)},await readLibrary(data),data,code);assert.equal((await second.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).selected,movie.id);await second.evaluate(id=>window.__CODEX_WALLPAPERS_PUBLIC__.select(id),image.id);await page.waitForTimeout(300);await applyWindow({evaluate:x=>page.evaluate(x)},library,data,code);assert.equal((await page.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).selected,image.id);results.push('Second window + synchronized saved selection');
 // A corrupt media entry must never replace the active background.
 const failure=await page.evaluate(async()=>{const api=window.__CODEX_WALLPAPERS_PUBLIC__,id='aaaaaaaaaaaaaaaaaaaaaaaa',before=document.querySelector('#cw-media').dataset.cwId;api.catalog({id,title:'Broken',kind:'image',mime:'image/png',size:6,width:2,height:2,palette:{}},'');await api.select(id);api.takeRequests();api.append(id,btoa('broken'));try{await api.supply(id);return false}catch(e){api.reject(id,e.message);return document.querySelector('#cw-media').dataset.cwId===before;}});assert.equal(failure,true);results.push('Failed media selection preserves previous wallpaper');
 // Recreated renderer restores the selected wallpaper; concurrent transfers stop.
 await second.reload();await applyWindow({evaluate:x=>second.evaluate(x)},await readLibrary(data),data,code);assert.equal((await second.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).selected,image.id);
 await second.evaluate(()=>window.__CW_TRANSFER_LOCK__={owner:'test',until:Date.now()+10000});await assert.rejects(applyWindow({evaluate:x=>second.evaluate(x)},await readLibrary(data),data,code),/Another wallpaper transfer/);await second.evaluate(()=>delete window.__CW_TRANSFER_LOCK__);results.push('Renderer recreation restores choice; simultaneous transfer rejected');
 // Hidden windows keep only the lightweight catalog until they become visible.
 const hidden=await context.newPage();await hidden.goto(url);await hidden.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));await applyWindow({evaluate:x=>hidden.evaluate(x)},library,data,code);assert.equal((await hidden.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).media,false);await hidden.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await applyWindow({evaluate:x=>hidden.evaluate(x)},library,data,code);assert.equal((await hidden.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).media,true);await hidden.close();results.push('Hidden window defers wallpaper payload until visible');
 await page.setViewportSize({width:620,height:820});await page.locator('#profile').click();await page.locator('[data-cw-menu]').click();const overflow=await page.locator('dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(overflow,false);await page.screenshot({path:path.join(out,'narrow-library.png')});await page.keyboard.press('Escape');
 await page.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.dispose());assert.equal(await page.locator('#cw-media').count(),0);assert.equal(await page.locator('[data-cw-menu]').count(),0);assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('cw-active')),false);results.push('Narrow modal; cleanup restores native surfaces');
 // A brand-new storage partition must recover the last selection from disk.
 const clean=await browser.newContext();const restarted=await clean.newPage();await restarted.goto(url);
 await applyWindow({evaluate:x=>restarted.evaluate(x)},await readLibrary(data),data,code);
 assert.equal((await restarted.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status())).selected,image.id);
 assert.equal(await restarted.locator('#cw-media').count(),1);
 await clean.close();results.push('Disk backup restores wallpaper after browser storage is lost');
 // A failed first transfer must not erase the selection saved for next startup.
 const startup=await browser.newContext();const blank=await startup.newPage();await blank.goto(url);await blank.evaluate(code);
 const retained=await blank.evaluate(()=>{const api=window.__CODEX_WALLPAPERS_PUBLIC__,id='bbbbbbbbbbbbbbbbbbbbbbbb';api.catalog({id,title:'Saved but unreadable',kind:'image',mime:'image/png',size:6,width:2,height:2,palette:{}},'');return api.select(id).then(()=>{api.takeRequests();api.reject(id,'Read failed');return api.preferencesSnapshot().settings.selected===id&&!api.status().media;});});
 assert.equal(retained,true);await startup.close();results.push('Failed startup transfer preserves saved selection without an active wallpaper');
 // Shuffle uses the real picker, transfer path and a controlled browser clock.
 const shuffleContext=await browser.newContext({viewport:{width:1200,height:820}});
 const shufflePage=await shuffleContext.newPage();await shufflePage.goto(url);
 await applyWindow({evaluate:x=>shufflePage.evaluate(x)},library,data,code);
 await shufflePage.clock.install();await shufflePage.clock.pauseAt(new Date());
 await shufflePage.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.open());
 assert.equal(await shufflePage.locator('#shuffle').inputValue(),'false');
 assert.equal(await shufflePage.locator('#shuffleMinutes').isDisabled(),true);
 await shufflePage.locator('#shuffle').selectOption('true');
 await shufflePage.locator('#shuffleMinutes').fill('1');await shufflePage.locator('#shuffleMinutes').dispatchEvent('change');
 await shufflePage.screenshot({path:path.join(out,'shuffle-desktop.png')});
 await shufflePage.setViewportSize({width:620,height:820});
 assert.equal(await shufflePage.locator('dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
 await shufflePage.screenshot({path:path.join(out,'shuffle-narrow.png')});
 const selection=()=>shufflePage.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status().selected);
 const beforeShuffle=await selection();await shufflePage.clock.runFor(59999);assert.equal(await selection(),beforeShuffle);
 await shufflePage.clock.runFor(1);await shufflePage.waitForFunction(id=>window.__CODEX_WALLPAPERS_PUBLIC__.status().selected!==id,beforeShuffle);
 await applyWindow({evaluate:x=>shufflePage.evaluate(x)},library,data,code);
 assert.equal(await shufflePage.locator('#cw-media').evaluate(e=>e.dataset.cwId),await selection());
 // Settings and the shuffled selection survive loss of browser storage.
 const freshShuffle=await browser.newContext();const freshPage=await freshShuffle.newPage();await freshPage.goto(url);
 await applyWindow({evaluate:x=>freshPage.evaluate(x)},library,data,code);
 const restored=await freshPage.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.status().settings);
 assert.equal(restored.shuffle,true);assert.equal(restored.shuffleMinutes,1);assert.equal(restored.selected,await selection());await freshShuffle.close();
 // Off, disabled wallpaper and hidden windows do not rotate.
 await shufflePage.locator('#shuffle').selectOption('false');const stopped=await selection();await shufflePage.clock.runFor(120000);assert.equal(await selection(),stopped);
 await shufflePage.locator('#shuffle').selectOption('true');await shufflePage.locator('#toggle').click();await shufflePage.clock.runFor(120000);assert.equal(await selection(),stopped);await shufflePage.locator('#toggle').click();
 await shufflePage.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await shufflePage.clock.runFor(120000);assert.equal(await selection(),stopped);
 await shufflePage.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 await shufflePage.clock.runFor(60000);await shufflePage.waitForFunction(id=>window.__CODEX_WALLPAPERS_PUBLIC__.status().selected!==id,stopped);
 await shufflePage.evaluate(()=>window.__CODEX_WALLPAPERS_PUBLIC__.dispose());await shufflePage.clock.runFor(120000);assert.equal(await shufflePage.locator('#cw-media').count(),0);
 await shuffleContext.close();results.push('Shuffle interval, no immediate repeat, disk recovery, off/hidden/disabled pause, resume and disposal');
 console.log(JSON.stringify({passed:results},null,2));await fs.writeFile(path.join(out,'ui-results.json'),JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
