import * as React from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {createPortal} from 'react-dom'
import {ThinkingOrb} from 'thinking-orbs'
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import {resetCountdown} from '../reset-countdown'
import './panel.css'

type LocalSnapshot={source:'official-account-usage';generatedAt:string;coverage:{days:number;firstDay:string|null;lastDay:string|null};totalTokens:number|null;peakDailyTokens:number|null;longestTaskSeconds:number|null;currentStreakDays:number|null;longestStreakDays:number|null;dailyTokens:Record<string,number>}
type Identity={name:string|null;plan:string|null;nativeAvatar:string|null}
type Rate={percent:number|null;resetAt:number|null;updatedAt:number|null;plan?:string|null}
type PanelAPI={version:number;setSnapshot:(data:LocalSnapshot|null)=>void;status:()=>object;dispose:()=>void}
declare global{interface Window{__CW_USAGE_PANEL__?:PanelAPI;__CW_USAGE__?:{getSnapshot?:()=>Rate}}}

const PROFILE='button[aria-label="Open profile menu"],button[aria-label="Abrir menú de perfil"],button[aria-label="Abrir menu de perfil"]'
const PHOTO_KEY='codex-wallpapers.usage-photo.v1'
const plans=new Set(['Free','Plus','Pro','Pro Max','Team','Business','Enterprise','Edu'])
const compact=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1})
const readable=(n:number|null|undefined)=>n===null||n===undefined?'—':compact.format(n)
const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const dayFormatter=new Intl.DateTimeFormat('en',{month:'short',day:'numeric'})
const dayText=(d:Date)=>dayFormatter.format(d)
const duration=(n:number)=>n?`${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m`:'—'
const profile=()=>document.querySelector<HTMLButtonElement>(PROFILE)
const rate=():Rate=>window.__CW_USAGE__?.getSnapshot?.()||{percent:null,resetAt:null,updatedAt:null,plan:null}

function identity():Identity{
  const trigger=profile();const menu=trigger&&[...document.querySelectorAll<HTMLElement>('[role="menu"]')].find(e=>e.getAttribute('aria-labelledby')===trigger.id)
  const lines=(menu?.innerText||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
  const nativePlan=rate().plan
  const maybePlan=lines.find(x=>plans.has(x))||(nativePlan?nativePlan.replace(/\b\w/g,x=>x.toUpperCase()):null)
  const menuActions=/^(Usage|Uso|Settings|Configuración|Wallpapers|Fondos|Sign out|Cerrar sesión|Invite a friend|Invita a un amigo|Show pet|Mostrar mascota)$/i
  const name=lines.find(x=>x!==maybePlan&&!menuActions.test(x)&&!/^\d+%/.test(x))||null
  const nativeAvatar=trigger?.querySelector<HTMLImageElement>('img')?.src||null
  return {name:name?.slice(0,80)||null,plan:maybePlan,nativeAvatar}
}
function savedPhoto(){try{const value=localStorage.getItem(PHOTO_KEY);return value&&/^data:image\/(jpeg|png|webp);base64,/.test(value)&&value.length<400000?value:null}catch{return null}}
async function openNativeUsage(){
  const trigger=profile();if(!trigger)return false
  if(trigger.getAttribute('aria-expanded')!=='true')trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0,buttons:1,isPrimary:true}))
  for(let i=0;i<20;i++){
    const menu=[...document.querySelectorAll<HTMLElement>('[role="menu"]')].find(e=>e.getAttribute('aria-labelledby')===trigger.id)
    const action=menu&&[...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(e=>/^(Usage|Uso)/i.test(e.textContent?.trim()||''))
    if(action){action.click();return true}
    await new Promise(resolve=>setTimeout(resolve,50))
  }
  return false
}
function dayList(){const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),today.getDate());start.setDate(start.getDate()-363);return Array.from({length:364},(_,i)=>{const day=new Date(start);day.setDate(start.getDate()+i);return {key:dayKey(day),date:day}})}
let days=dayList()

function Heatmap({snapshot}:{snapshot:LocalSnapshot|null}){
  const [mode,setMode]=React.useState<'daily'|'weekly'|'cumulative'>('daily')
  const [selected,setSelected]=React.useState<number|null>(null)
  const [tip,setTip]=React.useState<{x:number;y:number}|null>(null)
  const selectDay=(i:number,e:HTMLElement)=>{setSelected(i);const r=e.getBoundingClientRect();setTip({x:Math.max(8,Math.min(innerWidth-230,r.left+r.width/2-110)),y:Math.max(8,r.top-46)})}
  const values=React.useMemo(()=>{let sum=0;return days.map((day,index)=>{const daily=snapshot?.dailyTokens[day.key]||0;sum+=daily;return mode==='daily'?daily:mode==='weekly'?days.slice(Math.max(0,index-6),index+1).reduce((n,d)=>n+(snapshot?.dailyTokens[d.key]||0),0):sum})},[snapshot,mode])
  const positives=values.filter(Boolean).sort((a,b)=>a-b),high=positives[Math.floor((positives.length-1)*.9)]||1
  return <section className="cwp-activity"><div className="cwp-row"><strong>Token activity</strong><span>Last 12 months · your account</span><div className="cwp-tabs">{(['daily','weekly','cumulative'] as const).map(m=><button key={m} className={mode===m?'active':''} onClick={()=>{setMode(m);setSelected(null)}}>{m[0].toUpperCase()+m.slice(1)}</button>)}</div></div>
    {snapshot?<><div className="cwp-map" role="grid" aria-label="Official token activity">{days.map((d,i)=>{const value=values[i],level=value?Math.min(4,Math.max(1,Math.ceil(value/high*4))):0;return <button key={d.key} type="button" role="gridcell" className={`cwp-cell level-${level}`} aria-label={`${dayText(d.date)}: ${value.toLocaleString('en')} ${mode==='daily'?'tokens':'tokens, '+mode}`} title={`${dayText(d.date)}: ${value.toLocaleString('en')} tokens`} onPointerEnter={e=>selectDay(i,e.currentTarget)} onPointerLeave={()=>setTip(null)} onFocus={e=>selectDay(i,e.currentTarget)} onBlur={()=>setTip(null)} onClick={e=>selectDay(i,e.currentTarget)}/ >})}</div><div className="cwp-months"><span>{dayText(days[0].date)}</span><span>{dayText(days[91].date)}</span><span>{dayText(days[182].date)}</span><span>{dayText(days[273].date)}</span><span>{dayText(days[363].date)}</span></div><div className="cwp-day-value">{selected===null?'Hover or select a day for its tokens':`${readable(values[selected])} tokens · ${dayText(days[selected].date)}${mode==='weekly'?' · previous 7 days':mode==='cumulative'?' · cumulative':''}`}</div></>:<p className="cwp-unavailable">Official account usage unavailable.</p>}
    {selected!==null&&tip&&createPortal(<div className="cwp-day-tooltip" role="tooltip" style={{left:tip.x,top:tip.y}}><strong>{values[selected].toLocaleString('en')} tokens</strong><span>{dayText(days[selected].date)} · {mode==='daily'?'this day':mode==='weekly'?'previous 7 days':'cumulative'}</span></div>,document.body)}
  </section>
}
function History({snapshot}:{snapshot:LocalSnapshot|null}){
  const weeks=Array.from({length:12},(_,i)=>{const slice=days.slice(days.length-(12-i)*7,days.length-(11-i)*7);return {week:`${dayText(slice[0].date)}–${dayText(slice.at(-1)!.date)}`,tokens:slice.reduce((n,d)=>n+(snapshot?.dailyTokens[d.key]||0),0)}})
  return <div className="cwp-history"><div className="cwp-section-title"><strong>Usage history</strong><span>12 weeks · account tokens</span></div>{snapshot?<div className="cwp-chart" data-shadcn-area-adaptation="true"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeks} margin={{top:8,right:5,bottom:0,left:0}}><defs><linearGradient id="cwp-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cwp-accent)" stopOpacity={.35}/><stop offset="95%" stopColor="var(--cwp-accent)" stopOpacity={.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.08)"/><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill:'#777984',fontSize:9}} tickFormatter={(_,i)=>i===0?'12w ago':i===11?'Now':''}/><YAxis hide domain={[0,'auto']}/><Tooltip cursor={{stroke:'var(--cwp-accent)',strokeOpacity:.4}} content={({active,payload})=>active&&payload?.length?<div className="cwp-tooltip"><span>{payload[0].payload.week}</span><strong>{readable(Number(payload[0].value))} tokens</strong></div>:null}/><Area dataKey="tokens" type="monotone" stroke="var(--cwp-accent)" strokeWidth={2} fill="url(#cwp-area)" dot={false} activeDot={{r:4,fill:'var(--cwp-accent)'}} animationDuration={1500}/></AreaChart></ResponsiveContainer></div>:<p className="cwp-unavailable">Official account history unavailable.</p>}</div>
}
function App({panelHost,onSnapshot}:{panelHost:HTMLElement;onSnapshot:(set:(s:LocalSnapshot|null)=>void)=>void}){
  const [snapshot,setSnapshot]=React.useState<LocalSnapshot|null>(null),[account,setAccount]=React.useState<Identity>(identity),[usage,setUsage]=React.useState<Rate>(rate),[photo,setPhoto]=React.useState<string|null>(savedPhoto),[open,setOpen]=React.useState(false),[notice,setNotice]=React.useState(''),[clock,setClock]=React.useState(Date.now)
  const input=React.useRef<HTMLInputElement>(null),panel=React.useRef<HTMLElement>(null),triggerRef=React.useRef<HTMLButtonElement>(null)
  const [active,setActive]=React.useState(()=>!document.hidden&&document.hasFocus())
  React.useEffect(()=>{const sync=()=>setActive(!document.hidden&&document.hasFocus());document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);window.addEventListener('blur',sync);return()=>{document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);window.removeEventListener('blur',sync)}},[])
  React.useEffect(()=>{onSnapshot(setSnapshot);const update=()=>{if(dayKey(days.at(-1)!.date)!==dayKey(new Date()))days=dayList();const next=identity();setAccount(old=>{const merged={name:next.name||old.name,plan:next.plan||old.plan,nativeAvatar:next.nativeAvatar||old.nativeAvatar};return merged.name===old.name&&merged.plan===old.plan&&merged.nativeAvatar===old.nativeAvatar?old:merged});const current=rate();setUsage(old=>old.percent===current.percent&&old.resetAt===current.resetAt&&old.updatedAt===current.updatedAt&&old.plan===current.plan?old:current)};let queued:ReturnType<typeof setTimeout>|null=null;const schedule=()=>{if(queued===null)queued=setTimeout(()=>{queued=null;if(!document.hidden)update()},250)};const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});const timer=setInterval(update,30_000);return()=>{observer.disconnect();clearInterval(timer);if(queued!==null)clearTimeout(queued)}},[onSnapshot])
  React.useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key===PHOTO_KEY)setPhoto(savedPhoto())};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[])
  React.useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};const outside=(e:PointerEvent)=>{if(!e.composedPath().includes(panel.current!)&&!e.composedPath().includes(triggerRef.current!))setOpen(false)};document.addEventListener('keydown',onKey);document.addEventListener('pointerdown',outside,true);return()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',outside,true)}},[open])
  React.useEffect(()=>{if(!open)return;setClock(Date.now());const timer=window.setInterval(()=>setClock(Date.now()),60_000);return()=>window.clearInterval(timer)},[open])
  async function choosePhoto(file?:File){if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setNotice('Choose a JPG, PNG or WebP under 5 MB.');return}try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.fillStyle='#090a0d';ctx.fillRect(0,0,256,256);const scale=Math.min(256/bitmap.width,256/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;ctx.drawImage(bitmap,(256-w)/2,(256-h)/2,w,h);bitmap.close();const uri=canvas.toDataURL('image/jpeg',.86);if(uri.length>400000)throw Error('Image is too large');localStorage.setItem(PHOTO_KEY,uri);setPhoto(uri);setNotice('Photo saved on this computer only.')}catch{setNotice('Could not save this photo.')}}
  const stats:[[string,string],[string,string],[string,string],[string,string],[string,string]]=[
    [readable(snapshot?.totalTokens),'Lifetime tokens'],[readable(snapshot?.peakDailyTokens),'Peak daily tokens'],[duration(snapshot?.longestTaskSeconds||0),'Longest task'],[snapshot?.currentStreakDays!=null?`${snapshot.currentStreakDays} days`:'—','Current streak'],[snapshot?.longestStreakDays!=null?`${snapshot.longestStreakDays} days`:'—','Longest streak']]
  const avatar=photo||account.nativeAvatar
  const countdown=resetCountdown(usage.resetAt,clock)
  const spanish=/^es(?:-|$)/i.test(document.documentElement.lang||navigator.language)
  return <><button ref={triggerRef} className="cwp-trigger" type="button" aria-label={usage.percent===null?'Usage unavailable':`Usage: ${usage.percent}% remaining`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}><span className="cwp-orb"><ThinkingOrb state="composing" size={32} paused={!active} speed={1.2} theme="dark" aria-hidden="true"/></span><strong>{usage.percent??'—'}<small>{usage.percent===null?'':'%'}</small></strong></button>
    {open&&createPortal(<section ref={panel} className="cwp-panel" role="dialog" aria-label="Usage preview"><header className="cwp-profile"><button className="cwp-close" type="button" aria-label="Close usage preview" onClick={()=>setOpen(false)}>×</button><div className="cwp-avatar">{avatar?<img src={avatar} alt="Account avatar"/>:<span aria-hidden="true">◯</span>}<button className="cwp-add-photo" type="button" aria-label="Choose a profile photo" title="Choose a profile photo" onClick={()=>input.current?.click()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg></button></div><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>{void choosePhoto(e.target.files?.[0]);e.target.value=''}}/><h2>{account.name||'Account'}</h2><div className="cwp-plan">{account.plan||'Plan unavailable'}</div></header>
      <div className="cwp-stats">{stats.map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="cwp-limit"><span>{usage.percent===null?'Native limit unavailable':`${usage.percent}% remaining · native limit`}</span><span title={usage.resetAt?new Date(usage.resetAt).toLocaleString():undefined}>{countdown?`${spanish?'Se restablece en':'Resets in'} ${countdown}`:spanish?'Reinicio no disponible':'Reset unavailable'}</span></div><Heatmap snapshot={snapshot}/><div className="cwp-bottom"><History snapshot={snapshot}/><button className="cwp-open-usage" onClick={async()=>{if(await openNativeUsage())setOpen(false);else setNotice('Could not open native usage. Open it from the profile menu.')}}>View full usage <span aria-hidden="true">›</span></button>{notice&&<p className="cwp-notice" role="status">{notice}</p>}</div></section>,panelHost)}
  </>
}

function install(){if(window.__CW_USAGE_PANEL__)return;const badge=document.querySelector('[data-cw-usage]');if(!badge||!window.__CW_USAGE__)throw Error('Native usage indicator unavailable');const host=document.createElement('div'),panelHost=document.createElement('div');host.id='cwp-trigger-host';panelHost.id='cwp-panel-host';badge.before(host);document.body.append(panelHost);document.documentElement.classList.add('cwp-installed');let root:Root|undefined,snapshotSetter:((s:LocalSnapshot|null)=>void)|null=null,pendingSnapshot:LocalSnapshot|null=null,queued=false;const observer=new MutationObserver(()=>{if(host.isConnected||queued)return;queued=true;queueMicrotask(()=>{queued=false;const current=document.querySelector('[data-cw-usage]');if(current&&!host.isConnected)current.before(host);if(!panelHost.isConnected)document.body.append(panelHost)})});try{root=createRoot(host);root.render(<App panelHost={panelHost} onSnapshot={set=>{snapshotSetter=set;if(pendingSnapshot)set(pendingSnapshot)}}/>);observer.observe(document.body,{childList:true,subtree:true});window.__CW_USAGE_PANEL__={version:1,setSnapshot(data){if(data!==null&&(data.source!=='official-account-usage'||!data.dailyTokens)){if((data as unknown as {unavailable?:boolean}).unavailable){pendingSnapshot=null;snapshotSetter?.(null)}return}pendingSnapshot=data;snapshotSetter?.(data)},status(){return {trigger:host.isConnected&&!!host.querySelector('button'),photoSaved:!!savedPhoto(),hasAccountData:!!pendingSnapshot}},dispose(){observer.disconnect();root?.unmount();host.remove();panelHost.remove();document.documentElement.classList.remove('cwp-installed');delete window.__CW_USAGE_PANEL__}}}catch(error){observer.disconnect();root?.unmount();host.remove();panelHost.remove();document.documentElement.classList.remove('cwp-installed');throw error}}
install()




