import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
// Native React updater props identify the action; generic Update labels are ignored.
export function installUpdateHook(){
 if(window.__CW_UPDATE_HOOK__===2&&window.__CW_UPDATE_CLICK__)return;
 if(window.__CW_UPDATE_CLICK__)document.removeEventListener('click',window.__CW_UPDATE_CLICK__,true);
 window.__CW_UPDATE_HOOK__=2;
 const onClick=event=>{
  const button=event.target.closest?.('button');if(!button)return;
  let fiber=button[Object.keys(button).find(k=>k.startsWith('__reactFiber$'))];
  let props,action;const handlers=new Set();
  for(let i=0;fiber&&i<35;i++,fiber=fiber.return){const p=fiber.memoizedProps;if(!p)continue;if(typeof p.onClick==='function')handlers.add(p.onClick);if(!action&&p.primaryAction)action=p.primaryAction;if(typeof p.onRestart==='function'&&typeof p.onUpdate==='function'&&p.lifecycleState?.status){props=p;break;}}
  // The release banner has an object lifecycle. Match its actual primary
  // callback too, so dismiss/release-note buttons cannot trigger a restart.
  const releaseReady=props?.lifecycleState.status==='readyToRestart'&&action?.onClick===props.onRestart;
  const alphaReady=action?.label?.props?.id==='sidebarElectron.internalAlphaUpdateBanner.cta';
  if(!action||!handlers.has(action.onClick)||(!releaseReady&&!alphaReady))return;
  if(typeof window.cwArmUpdate!=='function')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(window.__CW_UPDATE_PENDING__)return;
  window.__CW_UPDATE_PENDING__=true;
  let done=false;
  const resume=()=>{if(done)return;done=true;clearTimeout(timer);window.__CW_UPDATE_PENDING__=false;delete window.__CW_UPDATE_RESUME__;action.onClick();};
  window.__CW_UPDATE_RESUME__=resume;
  // Native update remains usable even when the customization helper fails.
  const timer=setTimeout(resume,30000);window.cwArmUpdate('restart');
 };
 window.__CW_UPDATE_CLICK__=onClick;
 document.addEventListener('click',onClick,true);
}
export async function attachUpdateBridge(session,{repo,root,version}){
 await session.send('Runtime.enable');await session.send('Runtime.addBinding',{name:'cwArmUpdate'});
 session.socket.addEventListener('message',async event=>{
  let m;try{m=JSON.parse(event.data);}catch{return;}
  if(m.method!=='Runtime.bindingCalled'||m.params.name!=='cwArmUpdate'||m.params.payload!=='restart')return;
  try{
   await exec('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(repo,'windows/arm-update.ps1'),'-Repository',repo,'-DataRoot',root,'-PreviousVersion',version],{windowsHide:true,timeout:15000});
   // Wait for the independent helper to acquire its mutex before native shutdown.
   for(let i=0;i<125;i++){try{const a=JSON.parse((await fs.readFile(path.join(root,'update-handoff.json'),'utf8')).replace(/^\uFEFF/,''));if(a.previousVersion===version&&a.state==='waiting-for-official-update'&&Date.now()-Date.parse(a.time)<10000)break;}catch{}await new Promise(r=>setTimeout(r,80));}
  }catch(error){console.warn('Update handoff unavailable:',error.message);}
  await session.evaluate('window.__CW_UPDATE_RESUME__?.()').catch(()=>{});
 });
 await session.evaluate(`(${installUpdateHook.toString()})()`);
}
