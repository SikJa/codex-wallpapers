import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import {fileURLToPath} from 'node:url'
import {dataRoot} from '../src/library.mjs'
import {readNativeUsage} from './native-usage.mjs'
import {readCameraConfig} from './camera-config.mjs'

const root=path.dirname(fileURLToPath(import.meta.url))
const dist=path.join(root,'dist')
const data=dataRoot()
const port=Number(process.env.CW_OBS_PORT||8794)
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid OBS overlay port')
const offline=()=>({available:false,percent:null,updatedAt:null,resetAt:null,accent:'#b7bdc7'})
let current=offline()
async function update(){
  try{current=await readNativeUsage()}catch{current=offline()}
}
let updating=false,lastPoll=0
async function tick(){if(updating||Date.now()-lastPoll<45000)return;updating=true;lastPoll=Date.now();try{await update()}finally{updating=false}}
const server=http.createServer(async(req,res)=>{
  if(!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])){res.writeHead(403).end();return}
  res.setHeader('Cache-Control','no-store')
  res.setHeader('X-Content-Type-Options','nosniff')
  if(req.url==='/state'){
    res.setHeader('Content-Type','application/json; charset=utf-8')
    res.end(JSON.stringify(current.available&&Date.now()-current.updatedAt>120000?offline():current));return
  }
  if(req.url==='/camera-config'){
    res.setHeader('Content-Type','application/json; charset=utf-8')
    try{res.end(JSON.stringify(await readCameraConfig(data)))}catch{res.writeHead(503).end(JSON.stringify({error:'Invalid camera-config.json'}))}
    return
  }
  // Optional local composition preview. Personal media/config stay in the data
  // folder; the existing OBS source and its root URL remain unchanged.
  const previewPath=req.url?.split('?')[0]
  const composition=['camera-preview','camera-overlay'].find(route=>previewPath===`/${route}`||previewPath?.startsWith(`/${route}/`))
  if(composition){
    const name=previewPath===`/${composition}`||previewPath===`/${composition}/`?'index.html':previewPath.slice(composition.length+2)
    if(!['index.html','app.js','style.css','camera.png'].includes(name)){res.writeHead(404).end();return}
    try{
      // Preserve existing private compositions as a complete set; never mix their
      // HTML with new built-in scripts when one of their files is missing.
      const custom=await fs.stat(path.join(data,composition,'index.html')).then(s=>s.isFile()).catch(()=>false)
      const base=custom?path.join(data,composition):path.join(root,'camera')
      const body=await fs.readFile(path.join(base,name))
      const mime=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'image/png'
      res.setHeader('Content-Type',mime);res.end(body)
    }catch{res.writeHead(404).end()}
    return
  }
  const pathname=req.url?.split('?')[0]
  const requestPath=pathname==='/'?'/index.html':pathname
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
// Recover promptly when Codex opens after OBS or finishes installing its runtime.
// Native refetches remain bounded by the 45-second freshness check above.
const timer=setInterval(tick,5000)
server.on('close',()=>clearInterval(timer))
