import {parentPort} from 'node:worker_threads';
import {LocalUsageIndex} from './usage-local.mjs';

const index=new LocalUsageIndex();
parentPort.on('message',async message=>{
  if(message!=='refresh')return;
  try{parentPort.postMessage({snapshot:await index.refresh()});}
  catch(error){parentPort.postMessage({error:error.message});}
});
