import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {probeArchive,requiredMarkers} from '../src/compatibility-probe.mjs';
test('New package candidates require every interface marker; malformed archives fail closed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cw-compat-'));
 try{
  const file=path.join(dir,'app.asar');
  const write=source=>{const bytes=Buffer.from(source),json=Buffer.from(JSON.stringify({files:{webview:{files:{assets:{files:{'test.js':{size:bytes.length,offset:'0'}}}}}}}));const prelude=Buffer.alloc(16);prelude.writeUInt32LE(json.length+8,4);prelude.writeUInt32LE(json.length,12);fs.writeFileSync(file,Buffer.concat([prelude,json,bytes]));};
  write(requiredMarkers.join(' '));assert.equal(probeArchive(file).compatible,true);
  write(requiredMarkers.slice(1).join(' '));assert.deepEqual(probeArchive(file).missing,[requiredMarkers[0]]);
  fs.writeFileSync(file,'broken');assert.throws(()=>probeArchive(file));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
