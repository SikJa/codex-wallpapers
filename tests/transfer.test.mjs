import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyWindow } from '../src/apply.mjs';

test('a window receives thumbnails plus only its requested wallpaper payload',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'cw-transfer-'));
  try{
    await fs.mkdir(path.join(root,'media'));await fs.mkdir(path.join(root,'previews'));
    const selected='111111111111111111111111',bytes=crypto.randomBytes(1024*1024+17);
    await fs.writeFile(path.join(root,'media',`${selected}.mp4`),bytes);
    const items=[];
    for(const [index,id] of [selected,'222222222222222222222222','333333333333333333333333'].entries()){
      await fs.writeFile(path.join(root,'previews',`${id}.jpg`),Buffer.from([0xff,0xd8,0xff,0xd9]));
      items.push({id,title:`Wallpaper ${index}`,kind:'video',mime:'video/mp4',file:`media/${id}.mp4`,preview:`previews/${id}.jpg`,size:index?64*1024*1024:bytes.length,sha256:index?'0'.repeat(64):crypto.createHash('sha256').update(bytes).digest('hex'),width:1920,height:1080,duration:20,palette:{}});
    }
    const appendIds=[],catalogIds=[];
    let installed=false,requested=false;
    const session={async evaluate(expression){
      if(expression.includes('if(window.__CW_TRANSFER_LOCK__'))return true;
      if(expression==='!!window.__CODEX_WALLPAPERS_PUBLIC__')return installed;
      if(expression==='INSTALL'){installed=true;return 'installed';}
      if(expression.includes('.ids()'))return [];
      if(expression.includes('.catalog(')){catalogIds.push(expression.match(/\.catalog\("([a-f0-9]+)"|\.catalog\(\{"id":"([a-f0-9]+)"/)?.slice(1).find(Boolean));return;}
      if(expression.includes('.ready()'))return {count:items.length};
      if(expression.includes('.takeRequests()')){if(requested)return [];requested=true;return [selected];}
      if(expression.includes('.append(')){appendIds.push(expression.match(/\.append\("([a-f0-9]+)"/)?.[1]);return;}
      if(expression.includes('.supply('))return true;
      if(expression.includes('.status()'))return {count:items.length,selected,media:true,pending:0};
      return undefined;
    }};
    const status=await applyWindow(session,{schema:1,items},root,'INSTALL');
    assert.equal(status.media,true);
    assert.deepEqual(catalogIds,items.map(item=>item.id));
    assert.ok(appendIds.length>1);
    assert.deepEqual([...new Set(appendIds)],[selected]);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
