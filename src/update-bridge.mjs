import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
// Native React updater props identify the action; generic Update labels are ignored.
export function installUpdateHook(){
 if(window.__CW_UPDATE_HOOK__)return;
 window.__CW_UPDATE_HOOK__=true;
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('button');if(!button)return;
  let fiber=button[Object.keys(button).find(k=>k.startsWith('__reactFiber$'))];
  let props;for(let i=0;fiber&&i<35;i++,fiber=fiber.return){const p=fiber.memoizedProps;if(p&&typeof p.onRestart==='function'&&typeof p.onUpdate==='function'&&typeof p.lifecycleState==='string'){props=p;break;}}
  if(!props||!['readyToRestart','alreadyDownloaded'].includes(props.lifecycleState))return;
  if(typeof window.cwArmUpdate!=='function')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(window.__CW_UPDATE_PENDING__)return;
  window.__CW_UPDATE_PENDING__=true;
  let done=false;
  const resume=()=>{if(done)return;done=true;window.__CW_UPDATE_PENDING__=false;delete window.__CW_UPDATE_RESUME__;props.onRestart();};
  window.__CW_UPDATE_RESUME__=resume;
  // Native update remains usable even when the customization helper fails.
  setTimeout(resume,4000);window.cwArmUpdate('restart');
 },true);
}
export async function attachUpdateBridge(session,{repo,root,version}){
 await session.send('Runtime.enable');await session.send('Runtime.addBinding',{name:'cwArmUpdate'});
 session.socket.addEventListener('message',async event=>{
  let m;try{m=JSON.parse(event.data);}catch{return;}
  if(m.method!=='Runtime.bindingCalled'||m.params.name!=='cwArmUpdate'||m.params.payload!=='restart')return;
  try{
   const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(repo,'windows/update-handoff.ps1'),'-Repository',repo,'-DataRoot',root,'-PreviousVersion',version],{detached:true,windowsHide:true,stdio:'ignore'});
   await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject)});child.unref();
   // Wait for the independent helper to acquire its mutex before native shutdown.
   for(let i=0;i<25;i++){try{const a=JSON.parse((await fs.readFile(path.join(root,'update-handoff.json'),'utf8')).replace(/^\uFEFF/,''));if(a.previousVersion===version&&a.state==='waiting-for-official-update'&&Date.now()-Date.parse(a.time)<10000)break;}catch{}await new Promise(r=>setTimeout(r,80));}
  }catch(error){console.warn('Update handoff unavailable:',error.message);}
  await session.evaluate('window.__CW_UPDATE_RESUME__?.()').catch(()=>{});
 });
 await session.evaluate(`(${installUpdateHook.toString()})()`);
}
