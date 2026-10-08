import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const requiredMarkers=['data-app-shell-main-surface','Open profile menu','rate-limit-status','account/usage/read','data-thread-scroll-footer'];
export function probeArchive(file){
 const fd=fs.openSync(file,'r');
 try{
  const prelude=Buffer.alloc(16);if(fs.readSync(fd,prelude,0,16,0)!==16)throw Error('Invalid archive');
  const headerSize=prelude.readUInt32LE(4),jsonLength=prelude.readUInt32LE(12),size=fs.fstatSync(fd).size;
  if(headerSize>16*1024*1024||jsonLength>headerSize||jsonLength<2)throw Error('Invalid archive header');
  const header=Buffer.alloc(jsonLength);if(fs.readSync(fd,header,0,jsonLength,16)!==jsonLength)throw Error('Incomplete archive header');
  const tree=JSON.parse(header.toString()),found=new Set();
  function walk(node,prefix=''){
   for(const [name,entry] of Object.entries(node.files||{})){
    const relative=prefix?prefix+'/'+name:name;
    if(entry.files){walk(entry,relative);continue}
    if(!/^webview\/assets\/.+\.js$/.test(relative)||entry.unpacked)continue;
    const start=8+headerSize+Number(entry.offset);
    if(!Number.isSafeInteger(entry.size)||entry.size<0||entry.size>32*1024*1024||!Number.isSafeInteger(start)||start<16+jsonLength||start+entry.size>size)throw Error('Invalid archive entry');
    const content=Buffer.alloc(entry.size);if(fs.readSync(fd,content,0,entry.size,start)!==entry.size)throw Error('Incomplete archive entry');
    const source=content.toString('utf8');for(const marker of requiredMarkers)if(source.includes(marker))found.add(marker);
   }
  }
  walk(tree);const missing=requiredMarkers.filter(marker=>!found.has(marker));return {schema:1,compatible:missing.length===0,missing,checkedAt:new Date().toISOString(),scope:'static-interface-probe'};
 }finally{fs.closeSync(fd)}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=probeArchive(process.argv[2]);console.log(JSON.stringify(result));process.exitCode=result.compatible?0:2}catch{console.log(JSON.stringify({schema:1,compatible:false,reason:'Package inspection failed'}));process.exitCode=2}
}
