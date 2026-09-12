import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { safePath,readLibrary,atomicJSON,importMedia,paletteFromRGB,paletteFromPixels } from '../src/library.mjs';
test('library starts empty and rejects traversal/corruption',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'cw-test-'));
 try{
  assert.deepEqual((await readLibrary(root)).items,[]);
  for(const p of ['../outside','media/../../outside','C:\\Windows\\file','/etc/passwd'])assert.throws(()=>safePath(root,p));
  await atomicJSON(path.join(root,'library.json'),{schema:99,items:[]});
  await assert.rejects(readLibrary(root),/Unsupported/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('unsupported input is rejected before importing',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'cw-test-'));
 try{const p=path.join(root,'scene.pkg');await fs.writeFile(p,'scene');await assert.rejects(importMedia(p,{root}),/Scene/);assert.equal((await fs.readdir(root)).length,1);}
 finally{await fs.rm(root,{recursive:true,force:true});}
});
test('palette keeps dark readable surfaces for extreme colors',()=>{
 for(const rgb of [[0,0,0],[255,255,255],[255,0,0]]){const p=paletteFromRGB(rgb);for(const v of Object.values(p))assert.match(v,/^#[0-9a-f]{6}$/);assert.ok(parseInt(p.surface.slice(1,3),16)<30);}
});
test('small colored regions affect the palette without brightening dark surfaces',()=>{
 const red=new Uint8Array(3000),blue=new Uint8Array(3000);
 for(let i=0;i<300;i+=3){red.set([180,20,15],i);blue.set([15,20,180],i);}
 const r=paletteFromPixels(red),b=paletteFromPixels(blue);
 assert.notEqual(r.accent,b.accent);assert.notEqual(r.surface,b.surface);
 assert.equal(paletteFromPixels(new Uint8Array(3000)).accent,'#bdc2cb');
});
