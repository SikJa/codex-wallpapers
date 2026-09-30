import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { dataRoot, readLibrary, safePath, atomicJSON } from './library.mjs';
import { Session, targets } from './cdp.mjs';
import {readPreferences,persistPreferences} from './preferences.mjs';
const exec=promisify(execFile),root=dataRoot();
const ownFile=fileURLToPath(import.meta.url),repo=path.dirname(path.dirname(ownFile));
const read=p=>fs.readFile(path.join(repo,p),'utf8');
export async function payload(){
  const [appearanceCSS,modalCSS,panelCSS,panelJS]=await Promise.all(['src/appearance.css','src/modal.css','src/usage-panel.bundle.css','src/usage-panel.bundle.js'].map(read));
  return `${await read('src/runtime.js')}(${JSON.stringify({appearanceCSS,modalCSS})});\n${await read('src/usage.js')}();\ntry{(()=>{const style=document.createElement('style');style.id='cw-usage-panel-style';style.textContent=${JSON.stringify(panelCSS)};document.head.append(style);})();\n${panelJS}\n}catch(error){document.getElementById('cw-usage-panel-style')?.remove();console.warn('Codex Wallpapers usage preview unavailable:',error);}`;
}
export async function applyWindow(session, library, base, code){
  const owner=crypto.randomUUID();
  const acquired=await session.evaluate(`(()=>{if(window.__CW_TRANSFER_LOCK__?.until>Date.now())return false;window.__CW_TRANSFER_LOCK__={owner:${JSON.stringify(owner)},until:Date.now()+120000};return true})()`);
  if(!acquired)throw Error('Another wallpaper transfer is already running in this window.');
  try{return await transferWindow(session,library,base,code);}
  finally{await session.evaluate(`(()=>{if(window.__CW_TRANSFER_LOCK__?.owner===${JSON.stringify(owner)})delete window.__CW_TRANSFER_LOCK__;})()`).catch(()=>{});}
}
async function transferRequested(session, library, base){
  const requested=await session.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.takeRequests()');
  let transferred=0;
  for(const id of requested){
    const item=library.items.find(candidate=>candidate.id===id);
    if(!item){
      await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.reject(${JSON.stringify(id)},'Wallpaper unavailable')`).catch(()=>{});
      continue;
    }
    try{
      const bytes=await fs.readFile(safePath(base,item.file));
      if(bytes.length!==item.size||crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Imported file changed: '+item.id);
      for(let off=0;off<bytes.length;off+=192*1024)await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.append(${JSON.stringify(item.id)},${JSON.stringify(bytes.subarray(off,off+192*1024).toString('base64'))})`);
      await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.supply(${JSON.stringify(item.id)})`);
      transferred++;
    }catch(error){
      await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.reject(${JSON.stringify(id)},${JSON.stringify(error.message)})`).catch(()=>{});
      throw error;
    }
  }
  return transferred;
}
async function transferWindow(session, library, base, code){
  const exists=await session.evaluate('!!window.__CODEX_WALLPAPERS_PUBLIC__');
  if(!exists){
    await session.evaluate(code);
    const saved=await readPreferences(base);
    if(saved)await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.restorePreferences(${JSON.stringify(saved)})`);
    await session.evaluate('window.__CW_INSTALL_GUARD__=setTimeout(()=>window.__CODEX_WALLPAPERS_PUBLIC__?.dispose(),60000)');
  }
  try {
    const ids=await session.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.ids()');
    for(const item of library.items){
      if(ids.includes(item.id))continue;
      const thumbnail=(await fs.readFile(safePath(base,item.preview))).toString('base64');
      const {file,preview,sha256,...meta}=item;
      await session.evaluate(`window.__CODEX_WALLPAPERS_PUBLIC__.catalog(${JSON.stringify(meta)},${JSON.stringify(thumbnail)})`);
    }
    await session.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.ready()');
    await transferRequested(session,library,base);
    const status=await session.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.status()');
    await persistPreferences(base,await session.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.preferencesSnapshot()'));
    await session.evaluate('clearTimeout(window.__CW_INSTALL_GUARD__);delete window.__CW_INSTALL_GUARD__');
    return status;
  } catch(e){
    // Preserve a running customization if only a newly imported file failed.
    if(!exists)await session.evaluate('clearTimeout(window.__CW_INSTALL_GUARD__);window.__CODEX_WALLPAPERS_PUBLIC__?.dispose()').catch(()=>{});
    throw e;
  }
}
async function verifyOwner(endpoint){
  const script=path.join(repo,'windows','identity.ps1');
  await exec('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script,'-VerifyEndpoint',path.join(root,'endpoint.json')],{windowsHide:true,timeout:20000});
  const verified=JSON.parse((await fs.readFile(path.join(root,'endpoint.json'),'utf8')).replace(/^\uFEFF/,''));
  if(verified.browserId!==endpoint.browserId)throw Error('Endpoint changed during validation');
}
async function run(){
  if(process.argv.includes('--check')){const l=await readLibrary();for(const i of l.items){await fs.access(safePath(root,i.file));await fs.access(safePath(root,i.preview));}await payload();console.log(JSON.stringify({ready:true,count:l.items.length}));return;}
  const watch=process.argv.includes('--watch');
  const endpoint=JSON.parse((await fs.readFile(path.join(root,'endpoint.json'),'utf8')).replace(/^\uFEFF/,''));
  await verifyOwner(endpoint);
  let lock;
  if(watch){try{lock=await fs.open(path.join(root,`watch-${endpoint.browserId}.lock`),'wx');}catch(e){if(e.code==='EEXIST'){console.log('Window listener already started for this browser.');return;}throw e;}}
  const seen=new Map(),code=await payload();let failures=0,first=true;
  let usageSnapshot=null,scanStartedAt=0,scan=false,workerAlive=true;
  const worker=new Worker(new URL('./usage-worker.mjs',import.meta.url));worker.unref();
  worker.on('message',message=>{scan=false;if(message.snapshot)usageSnapshot=message.snapshot;else if(message.error)console.warn('Local usage scan unavailable:',message.error)});
  worker.on('error',error=>{workerAlive=false;scan=false;console.warn('Local usage worker unavailable:',error.message)});
  worker.on('exit',()=>{workerAlive=false;scan=false});
  const refreshUsage=()=>{
    if(!workerAlive||scan||Date.now()-scanStartedAt<5*60*1000)return;
    scanStartedAt=Date.now();
    scan=true;worker.postMessage('refresh');
  };
  const writeStatus=async value=>atomicJSON(path.join(root,'status.json'),{time:new Date().toISOString(),...value});
  try {
    do{
      refreshUsage();
      let list;
      try{list=await targets(endpoint);failures=0;}catch(e){if(!watch||++failures>=3)throw e;await new Promise(r=>setTimeout(r,2000));continue;}
      const library=await readLibrary();
      const libraryGeneration=library.items.map(item=>`${item.id}:${item.sha256}`).join('|');
      for(const id of seen.keys())if(!list.some(t=>t.id===id))seen.delete(id);
      for(const t of list){
        const s=new Session(t.webSocketDebuggerUrl);try{
          await s.open();
          const probe=await s.evaluate('({main:!!document.querySelector("main[data-app-shell-main-surface]"),url:location.href,time:performance.timeOrigin,present:!!window.__CODEX_WALLPAPERS_PUBLIC__})');
          if(!probe.main)continue;
          const generation=String(probe.time);
          const previous=seen.get(t.id),needsInstall=!previous||previous.generation!==generation||previous.libraryGeneration!==libraryGeneration||!probe.present;
          let status;
          if(needsInstall){
            seen.set(t.id,{generation,libraryGeneration}); // One install attempt per document/library generation.
            status=await applyWindow(s,library,root,code);
          }else{
            await transferRequested(s,library,root);
            status=await s.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.status()');
            await persistPreferences(root,await s.evaluate('window.__CODEX_WALLPAPERS_PUBLIC__.preferencesSnapshot()'));
          }
          const state=seen.get(t.id);
          if(usageSnapshot&&state?.usageGeneratedAt!==usageSnapshot.generatedAt){
            await s.evaluate(`window.__CW_USAGE_PANEL__?.setSnapshot(${JSON.stringify(usageSnapshot)})`);
            state.usageGeneratedAt=usageSnapshot.generatedAt;
          }
          await writeStatus({state:'ready',target:t.id,...status});first=false;
        }catch(e){await writeStatus({state:'window-failed',target:t.id,error:e.message});if(!watch)throw e;}
        finally{s.close();}
      }
      if(!watch&&first)throw Error('No ready Codex window. Open the personalized shortcut first.');
      if(watch)await new Promise(r=>setTimeout(r,2000));
    }while(watch);
  } finally {await worker.terminate();if(lock){await lock.close();await fs.rm(path.join(root,`watch-${endpoint.browserId}.lock`),{force:true});}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===ownFile)run().catch(e=>{console.error(e.message);process.exitCode=1;});
