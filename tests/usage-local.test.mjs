import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {LocalUsageIndex} from '../src/usage-local.mjs';

test('aggregates only local counters, handles resets and updates changed sessions',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'cw-usage-'));
  try{
    const sessions=path.join(root,'sessions');await fs.mkdir(sessions);
    const file=path.join(sessions,'session.jsonl');
    const line=(type,timestamp,payload)=>JSON.stringify({type,timestamp,payload})+'\n';
    const count=(timestamp,tokens)=>line('event_msg',timestamp,{type:'token_count',info:{total_token_usage:{total_tokens:tokens}}});
    await fs.writeFile(file,[line('response_item','2026-09-20T10:00:00Z',{type:'message',role:'user',content:[{text:'SECRET DO NOT COPY'}]}),line('event_msg','2026-09-20T10:00:00Z',{type:'task_started'}),count('2026-09-20T10:01:00Z',100),count('2026-09-20T10:02:00Z',150),count('2026-09-20T10:03:00Z',20),line('event_msg','2026-09-20T10:05:00Z',{type:'task_complete'})].join(''));
    const index=new LocalUsageIndex(sessions);
    const first=await index.refresh();
    assert.equal(first.totalTokens,170);assert.equal(first.maxSessionTokens,150);assert.equal(first.longestTaskSeconds,300);assert.equal(first.coverage.sessions,1);
    assert.equal(JSON.stringify(first).includes('SECRET'),false);assert.equal(JSON.stringify(first).includes(file),false);
    const worker=new Worker(new URL('../src/usage-worker.mjs',import.meta.url),{env:{...process.env,CODEX_HOME:root}});
    try{const reply=once(worker,'message');worker.postMessage('refresh');assert.equal((await reply)[0].snapshot.totalTokens,170);}finally{await worker.terminate();}
    await fs.appendFile(file,count('2026-09-20T10:06:00Z',30));
    const second=await index.refresh();assert.equal(second.totalTokens,180);
    await fs.rm(file);const third=await index.refresh();assert.equal(third.totalTokens,0);assert.equal(third.coverage.sessions,0);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
