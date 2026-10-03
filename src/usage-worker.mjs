import {parentPort} from 'node:worker_threads';
import {readAccountUsage} from './usage-account.mjs';

parentPort.on('message',async message=>{
  if(message!=='refresh')return;
  try{parentPort.postMessage({snapshot:await readAccountUsage()});}
  catch(error){parentPort.postMessage({snapshot:null,error:error.message});}
});
