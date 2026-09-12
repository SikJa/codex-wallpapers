import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const files=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.local','test-results'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(p);}}
await walk('.');
for(const p of files){
 if(/\.(mjs|js)$/.test(p)){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
 if(/\.(mp4|webm|png|jpg|jpeg|webp|ico|exe|lnk|log)$/i.test(p))throw Error('Private/generated media in source tree: '+p);
 const text=await fs.readFile(p,'utf8');
 if(/C:[/\\]Users[/\\](?!Public\b)[A-Za-z]/i.test(text))throw Error('Personal information in '+p);
}
console.log(`PASS: ${files.length} source files; JavaScript syntax and private-file scan.`);
