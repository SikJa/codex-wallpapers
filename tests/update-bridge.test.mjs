import test from 'node:test';
import assert from 'node:assert/strict';
import {installUpdateHook} from '../src/update-bridge.mjs';
function fixture(status,{dismiss=false,alpha=false,bridge=true}={}){
 let listener,armed=0,restarts=0,blocked=0;
 global.window=bridge?{cwArmUpdate:()=>armed++}:{};
 global.document={addEventListener:(_,fn)=>listener=fn};
 const restart=()=>restarts++,update=()=>{},dismissFn=()=>{};
 const action={status:'available',onClick:status==='readyToRestart'?restart:update,label:{props:{id:alpha?'sidebarElectron.internalAlphaUpdateBanner.cta':'sidebar.updateBanner.update'}}};
 const fiber={memoizedProps:{onClick:dismiss?dismissFn:action.onClick},return:{memoizedProps:{primaryAction:action},return:alpha?null:{memoizedProps:{lifecycleState:{status},onRestart:restart,onUpdate:update},return:null}}};
 const button={__reactFiber$test:fiber};installUpdateHook();
 const click=()=>listener({target:{closest:()=>button},preventDefault:()=>blocked++,stopImmediatePropagation:()=>blocked++});click();
 return {counts:()=>({armed,blocked,restarts}),click,resume:()=>window.__CW_UPDATE_RESUME__?.()};
}
test('real native object lifecycle arms before restart, deduplicates and resumes once',()=>{const r=fixture('readyToRestart');r.click();assert.deepEqual(r.counts(),{armed:1,blocked:4,restarts:0});r.resume();r.resume();assert.equal(r.counts().restarts,1)});
test('download, installed, dismiss and missing bridge leave native action untouched',()=>{for(const [s,options] of [['available',{}],['downloading',{}],['installed',{}],['readyToRestart',{dismiss:true}],['readyToRestart',{bridge:false}]]){const r=fixture(s,options);assert.equal(r.counts().armed,0);assert.equal(r.counts().blocked,0)}});
test('internal alpha exact primary action is recognized',()=>{const r=fixture('readyToRestart',{alpha:true});assert.equal(r.counts().armed,1);r.resume();assert.equal(r.counts().restarts,1)});
