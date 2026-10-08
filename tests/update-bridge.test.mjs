import test from 'node:test';
import assert from 'node:assert/strict';
import {installUpdateHook} from '../src/update-bridge.mjs';
function fixture(props){
 let listener,armed=0,restarts=0,blocked=0;
 global.window={cwArmUpdate:()=>armed++};
 global.document={addEventListener:(_,fn)=>listener=fn};
 const button={__reactFiber$test:{memoizedProps:{...props,onRestart:()=>restarts++,onUpdate:()=>{}},return:null}};
 installUpdateHook();
 listener({target:{closest:()=>button},preventDefault:()=>blocked++,stopImmediatePropagation:()=>blocked++});
 return {armed,blocked,restart:()=>{window.__CW_UPDATE_RESUME__?.();return restarts;}};
}
test('native ready updater arms before restarting, once',()=>{const r=fixture({lifecycleState:'readyToRestart'});assert.equal(r.armed,1);assert.equal(r.blocked,2);assert.equal(r.restart(),1);assert.equal(r.restart(),1)});
test('download and unrelated update actions are untouched',()=>{for(const state of ['available','downloading',undefined]){const r=fixture({lifecycleState:state});assert.equal(r.armed,0);assert.equal(r.blocked,0)}});
