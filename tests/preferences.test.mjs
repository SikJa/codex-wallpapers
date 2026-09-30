import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readPreferences,persistPreferences} from '../src/preferences.mjs';
test('disk preferences preserve newer selection and tolerate missing or malformed backup',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cw-prefs-'));
 try{
  assert.equal(await readPreferences(dir),null);
  const value={schema:1,updatedAt:200,settings:{selected:'a'.repeat(24),brightness:40}};
  assert.equal(await persistPreferences(dir,value),true);
  assert.equal(await persistPreferences(dir,{...value,updatedAt:100,settings:{selected:null}}),false);
  assert.deepEqual(await readPreferences(dir),value);
  await fs.writeFile(path.join(dir,'preferences.json'),'{broken');
  assert.equal(await readPreferences(dir),null);
  assert.equal(await persistPreferences(dir,value),true);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
