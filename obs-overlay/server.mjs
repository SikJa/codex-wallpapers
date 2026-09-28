import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fileURLToPath} from 'node:url'
import {dataRoot} from '../src/library.mjs'
import {Session,targets} from '../src/cdp.mjs'

const exec=promisify(execFile)
const root=path.dirname(fileURLToPath(import.meta.url))
const dist=path.join(root,'dist')
const data=dataRoot()
const port=Number(process.env.CW_OBS_PORT||8794)
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid OBS overlay port')
const offline=()=>({available:false,percent:null,updatedAt:null,resetAt:null,accent:'#b7bdc7'})
let current=offline(),lastIdentity=''
const readEndpoint=async()=>JSON.parse((await fs.readFile(path.join(data,'endpoint.json'),'utf8')).replace(/^\uFEFF/,''))
const validAccent=value=>/^#[0-9a-f]{6}$/i.test(value)?value:'#b7bdc7'
async function verify(endpoint){
  const id=`${endpoint.version}:${endpoint.browserId}:${endpoint.port}`
  if(id===lastIdentity)return
  await exec('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve(root,'../windows/identity.ps1'),'-VerifyEndpoint',path.join(data,'endpoint.json')],{windowsHide:true,timeout:15000})
  lastIdentity=id
}
const readNative=`(async()=>{
  const usage=window.__CW_USAGE__;
  if(!document.querySelector('main[data-app-shell-main-surface]')||!usage?.getSnapshot)return null;
  let snapshot=usage.getSnapshot();
  if(!snapshot.updatedAt||Date.now()-snapshot.updatedAt>45000){
    const el=document.querySelector('main[data-app-shell-main-surface]');
    let fiber=el?.[Object.keys(el).find(k=>k.startsWith('__reactFiber$'))];
    let client=null;
    while(fiber&&!client){
      for(const value of Object.values(fiber.memoizedProps||{})){
        if(value&&typeof value.getQueryCache==='function'&&typeof value.refetchQueries==='function'){client=value;break;}
      }
      fiber=fiber.return;
    }
    const query=client?.getQueryCache().findAll({queryKey:['rate-limit-status'],exact:false})
      .find(q=>q.queryKey.length===3&&q.state.data?.rate_limit);
    if(query&&query.state.fetchStatus!=='fetching'){
      await client.refetchQueries({predicate:q=>q.queryKey[0]==='rate-limit-status'&&q.queryKey.length===3},{cancelRefetch:false});
    }
    snapshot=usage.getSnapshot();
  }
  return {...snapshot,accent:getComputedStyle(document.documentElement).getPropertyValue('--cw-accent').trim(),visible:!document.hidden};
})()`
async function update(){
  try{
    const endpoint=await readEndpoint()
    await verify(endpoint)
    const pages=await targets(endpoint)
    let chosen=null
    for(const page of pages){
      const session=new Session(page.webSocketDebuggerUrl)
      try{
        await session.open()
        const result=await session.evaluate(readNative)
        if(result?.percent!=null&&(result.visible||!chosen))chosen=result
        if(result?.visible&&result.percent!=null)break
      }finally{session.close()}
    }
    if(!chosen||!Number.isFinite(chosen.percent)||!chosen.updatedAt||Date.now()-chosen.updatedAt>120000){current=offline();return}
    current={available:true,percent:Math.max(0,Math.min(100,Math.round(chosen.percent))),updatedAt:chosen.updatedAt,resetAt:chosen.resetAt??null,accent:validAccent(chosen.accent)}
  }catch{lastIdentity='';current=offline()}
}
let updating=false
async function tick(){if(updating)return;updating=true;try{await update()}finally{updating=false}}
const server=http.createServer(async(req,res)=>{
  if(!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])){res.writeHead(403).end();return}
  res.setHeader('Cache-Control','no-store')
  res.setHeader('X-Content-Type-Options','nosniff')
  if(req.url==='/state'){
    res.setHeader('Content-Type','application/json; charset=utf-8')
    res.end(JSON.stringify(current));return
  }
  const requestPath=req.url==='/'?'/index.html':req.url?.split('?')[0]
  if(!requestPath||!/^\/(?:index\.html|assets\/[\w.-]+\.(?:js|css))$/.test(requestPath)){res.writeHead(404).end();return}
  const file=path.resolve(dist,'.'+requestPath)
  if(!file.startsWith(dist+path.sep)){res.writeHead(404).end();return}
  try{
    const body=await fs.readFile(file)
    res.setHeader('Content-Type',requestPath==='/index.html'?'text/html; charset=utf-8':/\.js$/.test(file)?'text/javascript; charset=utf-8':'text/css; charset=utf-8')
    res.end(body)
  }catch{res.writeHead(404).end()}
})
await fs.access(path.join(dist,'index.html'))
server.listen(port,'127.0.0.1',()=>console.log(`OBS overlay: http://127.0.0.1:${port}/`))
void tick()
const timer=setInterval(tick,45000)
server.on('close',()=>clearInterval(timer))
