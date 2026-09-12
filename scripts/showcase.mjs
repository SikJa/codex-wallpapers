// Render documentation screenshots with the real runtime and a demo shell.
// The input manifest and original media stay outside Git.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {importMedia,readLibrary} from '../src/library.mjs';
import {payload,applyWindow} from '../src/apply.mjs';
const pw=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)):await import('playwright');
if(!process.argv[2])throw Error('Pass a private JSON manifest: [{file,title,slug,source}]');
const manifest=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const temp=path.resolve('test-results');await fs.mkdir(temp,{recursive:true});
const base=await fs.mkdtemp(path.join(temp,'showcase-')),items=[];
for(const entry of manifest){if(!/^[a-z0-9-]+$/.test(entry.slug))throw Error('Invalid slug');items.push({...entry,item:await importMedia(entry.file,{root:base,title:entry.title})});}
const html=await fs.readFile('scripts/showcase.html'),out=path.resolve('docs/assets');await fs.mkdir(out,{recursive:true});
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await pw.chromium.launch({headless:true,...(process.env.CW_TEST_BROWSER?{executablePath:process.env.CW_TEST_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:820},deviceScaleFactor:1.5});await page.goto(`http://127.0.0.1:${server.address().port}`);
 await applyWindow({evaluate:s=>page.evaluate(s)},await readLibrary(base),base,await payload());
 for(const {item,slug} of items){
  await page.evaluate(id=>window.__CODEX_WALLPAPERS_PUBLIC__.select(id),item.id);
  await page.evaluate(async()=>{const video=document.querySelector('#cw-media');if(video?.tagName==='VIDEO'){video.pause();if(video.duration>2){video.currentTime=1;await new Promise(r=>video.addEventListener('seeked',r,{once:true}));}}const css=getComputedStyle(document.documentElement);for(const key of ['accent','surface','sidebar']){const c=css.getPropertyValue('--cw-'+key).trim();document.querySelector(`[data-swatch=${key}]`).style.background=c;document.querySelector(`[data-label=${key}]`).textContent=c.toUpperCase();}});
  await page.screenshot({path:path.join(out,`gallery-${slug}.jpg`),type:'jpeg',quality:88});
 }
 await page.evaluate(id=>window.__CODEX_WALLPAPERS_PUBLIC__.select(id),items[0].item.id);
 await page.locator('#profile').click();await page.locator('[data-cw-menu]').click();await page.locator('dialog').waitFor({state:'visible'});
 await page.screenshot({path:path.join(out,'picker.jpg'),type:'jpeg',quality:88});
 await page.locator('#details details').evaluate(e=>e.open=true);
 await page.locator('#details').screenshot({path:path.join(out,'details.jpg'),type:'jpeg',quality:88});
 await page.keyboard.press('Escape');
 const shot=await fs.readFile(path.join(out,`gallery-${items[0].slug}.jpg`));
 await page.setViewportSize({width:1600,height:1100});
 await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#07090d;color:#f0f2f6;font-family:'Segoe UI',sans-serif;padding:64px 76px;overflow:hidden}.top{display:flex;justify-content:space-between;align-items:center;color:#aeb6c5;font:13px monospace;letter-spacing:2px}.tag{border:1px solid #ffffff26;border-radius:30px;padding:8px 14px;font-size:10px}h1{font-size:84px;line-height:1.02;font-weight:500;letter-spacing:-4px;margin:34px 0 22px}p{font-size:21px;color:#8d97a9;margin:0 0 32px}img{display:block;width:100%;border:1px solid #ffffff20;border-radius:19px;box-shadow:0 32px 100px #000;object-fit:cover;object-position:top}.mini{position:absolute;right:78px;top:185px;font:12px/2 monospace;color:#718097;text-align:right}</style></head><body><div class="top"><span>CODEX WALLPAPERS</span><span class="tag">WINDOWS · PREVIEW</span></div><h1>Your space.<br>Your Codex.</h1><p>Wallpapers, colors & a little more you.</p><div class="mini">LOCAL WALLPAPERS<br>ADAPTIVE COLOR<br>YOUR OWN COLLECTION</div><img src="data:image/jpeg;base64,${shot.toString('base64')}"></body></html>`);
 await page.locator('img').evaluate(e=>e.decode());await page.screenshot({path:path.join(out,'hero.jpg'),type:'jpeg',quality:88});
 await fs.writeFile(path.join(temp,'showcase-summary.json'),JSON.stringify(items.map(({item,slug,source})=>({slug,title:item.title,palette:item.palette,source})),null,2));
 console.log(JSON.stringify({screenshots:items.length+3,palettes:items.map(({slug,item})=>({slug,accent:item.palette.accent,surface:item.palette.surface}))},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
