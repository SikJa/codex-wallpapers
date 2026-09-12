import fs from 'node:fs/promises';
import path from 'node:path';
const files=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.git','node_modules','test-results'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.md'))files.push(p);}}
await walk('.');let links=0;
for(const file of files){
 const text=await fs.readFile(file,'utf8');
 const refs=[...text.matchAll(/(?:src|href)="([^"]+)"|\]\(([^\s)]+)\)/g)].map(m=>m[1]||m[2]);
 for(const ref of refs){if(/^(https?:|#)/.test(ref))continue;await fs.access(path.resolve(path.dirname(file),ref.split('#')[0]));links++;}
}
for(const name of ['README.md','README.es.md','README.pt-BR.md']){
 const text=await fs.readFile(name,'utf8');
 for(const target of ['README.md','README.es.md','README.pt-BR.md'])if(!text.includes(`href="${target}"`))throw Error('Missing language link: '+name);
 if((text.match(/gallery-[\w-]+\.jpg/g)||[]).length!==12)throw Error('Six linked gallery images required: '+name);
}
for(const file of await fs.readdir('docs/assets'))if(file.endsWith('.jpg')){
 const bytes=await fs.readFile(path.join('docs/assets',file));
 if(bytes[0]!==255||bytes[1]!==216||bytes.length>1024*1024)throw Error('Invalid or oversized documentation image: '+file);
}
console.log(`PASS: ${files.length} Markdown files, ${links} local links, three language switches and six gallery images per README.`);
