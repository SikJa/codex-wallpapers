import React from 'react'
import {createRoot} from 'react-dom/client'
import {ThinkingOrb} from 'thinking-orbs'
import {resetCountdown} from '../src/reset-countdown'
import './style.css'

type Usage={available:boolean;percent:number|null;updatedAt:number|null;accent:string;resetAt:number|null}
const fallback:Usage={available:false,percent:null,updatedAt:null,accent:'#b7bdc7',resetAt:null}

function Digits({value}:{value:string}){
  const ref=React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(()=>{
    const group=ref.current
    if(!group)return
    group.classList.remove('is-animating')
    void group.offsetHeight
    group.classList.add('is-animating')
  },[value])
  return <span ref={ref} className="t-digit-group" aria-hidden="true">{[...value].map((ch,i)=><span key={`${i}-${ch}`} className="t-digit" data-stagger={i===value.length-2?'1':i===value.length-1?'2':undefined}>{ch}</span>)}</span>
}

function Overlay(){
  const [usage,setUsage]=React.useState<Usage>(fallback)
  const [clock,setClock]=React.useState(Date.now)
  React.useEffect(()=>{
    let alive=true
    const refresh=async()=>{
      try{
        const response=await fetch('/state',{cache:'no-store'})
        if(!response.ok)throw Error('Usage endpoint unavailable')
        const next=await response.json() as Usage
        if(alive)setUsage(next)
      }catch{if(alive)setUsage(fallback)}
    }
    void refresh()
    const timer=window.setInterval(refresh,10_000)
    const countdownTimer=window.setInterval(()=>setClock(Date.now()),60_000)
    return()=>{alive=false;window.clearInterval(timer);window.clearInterval(countdownTimer)}
  },[])
  const ready=usage.available&&usage.percent!==null
  const value=ready?String(usage.percent):'—'
  const accent=/^#[0-9a-f]{6}$/i.test(usage.accent)?usage.accent:fallback.accent
  const countdown=ready?resetCountdown(usage.resetAt,clock):null
  return <main className={`overlay ${ready?'is-ready':'is-waiting'}`} style={{'--accent':accent} as React.CSSProperties} aria-label={ready?`Codex: ${usage.percent}% de uso restante`:'Uso de Codex no disponible'}>
    <div className="orb" aria-hidden="true"><ThinkingOrb state="composing" size={64} speed={1.2} theme="dark"/></div>
    <div className="copy"><span className="eyebrow">CODEX <i/> USO RESTANTE</span><div className="value"><Digits value={value}/>{ready&&<span className="percent" aria-hidden="true">%</span>}</div><span className="reset">{countdown?`Se restablece en ${countdown}`:ready?'Reinicio no disponible':'Esperando datos de Codex'}</span></div>
    <span className="sr-only">{ready?`${usage.percent}% restante${countdown?`, se restablece en ${countdown}`:''}`:'Esperando un dato actualizado de Codex'}</span>
  </main>
}

createRoot(document.getElementById('root')!).render(<Overlay/>)
