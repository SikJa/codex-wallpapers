import fs from 'node:fs/promises'
import path from 'node:path'
import {spawn} from 'node:child_process'
import readline from 'node:readline'

export function usageSnapshot(result, now = Date.now()) {
  const bucket = result?.rateLimitsByLimitId?.codex ?? result?.rateLimits
  if (!bucket || (bucket.limitId && bucket.limitId !== 'codex')) throw Error('Codex quota unavailable')
  const windows = [bucket.primary, bucket.secondary].filter(w => typeof w?.usedPercent === 'number' && Number.isFinite(w.usedPercent))
  if (!windows.length) throw Error('Codex quota windows unavailable')
  const limiting = windows.reduce((a,b) => a.usedPercent >= b.usedPercent ? a : b)
  return {available:true,percent:Math.max(0,Math.min(100,Math.round(100-limiting.usedPercent))),
    updatedAt:now,resetAt:Number.isFinite(limiting.resetsAt) && limiting.resetsAt > 0 ? limiting.resetsAt*1000 : null,accent:'#b7bdc7'}
}

async function findEngine() {
  const bin = path.join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin')
  const candidates = []
  for (const entry of await fs.readdir(bin, {withFileTypes:true})) {
    if (!entry.isDirectory()) continue
    const file = path.join(bin, entry.name, 'codex.exe')
    try { candidates.push({file, time:(await fs.stat(file)).mtimeMs}) } catch {}
  }
  candidates.sort((a,b)=>b.time-a.time)
  if (!candidates.length) throw Error('Installed Codex engine unavailable')
  return candidates[0].file
}

// Short-lived, read-only official RPC. No prompts, login, UI injection or token copies.
export async function readNativeUsage() {
  const engine = await findEngine()
  const child = spawn(engine, ['app-server','--stdio','--disable','memories'], {windowsHide:true,stdio:['pipe','pipe','ignore']})
  const lines = readline.createInterface({input:child.stdout})
  const pending = new Map()
  let nextId = 0
  let failure = null
  function fail(error) {
    failure = error
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(error) }
    pending.clear()
  }
  child.on('error', fail)
  child.stdin.on('error', fail)
  child.on('exit', () => fail(Error('Codex RPC closed')))
  lines.on('line', line => {
    let message
    try { message=JSON.parse(line) } catch { return }
    const p=pending.get(message.id)
    if (!p) return
    clearTimeout(p.timer); pending.delete(message.id)
    if (message.error) p.reject(Error('Codex RPC request failed'))
    else p.resolve(message.result)
  })
  function request(method,params) {
    if (failure) return Promise.reject(failure)
    const id=++nextId
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(Error('Codex RPC timeout'))},15000)
      pending.set(id,{resolve,reject,timer})
      child.stdin.write(JSON.stringify({id,method,...(params===undefined?{}:{params})})+'\n')
    })
  }
  try {
    await request('initialize',{clientInfo:{name:'obs_usage_reader',version:'1.0'},capabilities:{experimentalApi:true,explicitGatewayOauth:true}})
    child.stdin.write(JSON.stringify({method:'initialized'})+'\n')
    return usageSnapshot(await request('account/rateLimits/read'))
  } finally {
    lines.close()
    child.stdin.end()
    const stop=setTimeout(()=>child.kill(),2000)
    stop.unref()
    child.once('exit',()=>clearTimeout(stop))
    for (const p of pending.values()) clearTimeout(p.timer)
  }
}
