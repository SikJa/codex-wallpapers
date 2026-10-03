// Aggregate only local Codex session counters. No message text, titles, IDs or paths leave this module.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const MAX_FILE_BYTES=1024*1024*1024;
const localDay=value=>{
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return null;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};
const add=(map,key,value)=>{if(key&&value>0)map[key]=(map[key]||0)+value;};
const asCount=value=>Number.isSafeInteger(value)&&value>=0?value:null;

async function sessionAggregate(file){
  const dailyTokens={};let previous=0,maxSessionTokens=0,longestTaskSeconds=0,taskStarted=null,observed=false;
  const lines=readline.createInterface({input:fs.createReadStream(file,{encoding:'utf8'}),crlfDelay:Infinity});
  try{
    for await(const line of lines){
      // Large tool outputs and messages carry no counters. Do not parse their JSON.
      if(!line.includes('"type":"token_count"')&&!line.includes('"type":"task_started"')&&!line.includes('"type":"task_complete"')&&
         !/"type"\s*:\s*"(?:token_count|task_started|task_complete)"/.test(line))continue;
      let event;try{event=JSON.parse(line);}catch{continue;}
      if(event?.type!=='event_msg')continue;
      const payload=event.payload||{};
      if(payload.type==='task_started')taskStarted=Date.parse(event.timestamp);
      if(payload.type==='task_complete'&&Number.isFinite(taskStarted)){
        const elapsed=Math.floor((Date.parse(event.timestamp)-taskStarted)/1000);
        if(Number.isFinite(elapsed)&&elapsed>=0)longestTaskSeconds=Math.max(longestTaskSeconds,elapsed);
        taskStarted=null;
      }
      if(payload.type!=='token_count')continue;
      const count=asCount(payload.info?.total_token_usage?.total_tokens);
      const day=localDay(event.timestamp);
      if(count===null||!day)continue;
      // The session counter is cumulative and may reset. Sum forward deltas only.
      add(dailyTokens,day,count>=previous?count-previous:count);
      previous=count;maxSessionTokens=Math.max(maxSessionTokens,count);observed=true;
    }
  }finally{lines.close();}
  return {dailyTokens,maxSessionTokens,longestTaskSeconds,observed};
}

async function* sessionFiles(root){
  const dirs=[root];
  while(dirs.length){
    const dir=dirs.pop();let entries;
    try{entries=await fsp.readdir(dir,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')continue;throw error;}
    for(const entry of entries){const file=path.join(dir,entry.name);if(entry.isDirectory())dirs.push(file);else if(entry.isFile()&&entry.name.endsWith('.jsonl'))yield file;}
  }
}

function streaks(dailyTokens){
  const days=Object.keys(dailyTokens).filter(key=>dailyTokens[key]>0).sort();
  if(!days.length)return {currentStreakDays:0,longestStreakDays:0};
  let longest=0,run=0,prior=null;
  for(const day of days){const epoch=Date.parse(`${day}T12:00:00Z`);run=prior!==null&&epoch-prior===86400000?run+1:1;longest=Math.max(longest,run);prior=epoch;}
  const today=localDay(new Date());let cursor=Date.parse(`${today}T12:00:00Z`);
  const active=new Set(days);
  if(!active.has(today))cursor-=86400000;
  let current=0;
  while(active.has(new Date(cursor).toISOString().slice(0,10))){current++;cursor-=86400000;}
  return {currentStreakDays:current,longestStreakDays:longest};
}

export class LocalUsageIndex {
  constructor(root=path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'sessions')){this.root=path.resolve(root);this.cache=new Map();this.inFlight=null;}
  refresh(){if(this.inFlight)return this.inFlight;this.inFlight=this.#refresh().finally(()=>{this.inFlight=null;});return this.inFlight;}
  async #refresh(){
    const seen=new Set();let skippedFiles=0;
    for await(const file of sessionFiles(this.root)){
      seen.add(file);let stat;
      try{stat=await fsp.stat(file);}catch{skippedFiles++;continue;}
      if(stat.size>MAX_FILE_BYTES){skippedFiles++;continue;}
      const cached=this.cache.get(file);
      if(cached?.size===stat.size&&cached?.mtimeMs===stat.mtimeMs)continue;
      try{this.cache.set(file,{size:stat.size,mtimeMs:stat.mtimeMs,data:await sessionAggregate(file)});}catch{skippedFiles++;}
    }
    for(const file of this.cache.keys())if(!seen.has(file))this.cache.delete(file);
    const dailyTokens={};let sessions=0,maxSessionTokens=0,longestTaskSeconds=0;
    for(const {data} of this.cache.values()){
      if(!data.observed)continue;sessions++;
      maxSessionTokens=Math.max(maxSessionTokens,data.maxSessionTokens);
      longestTaskSeconds=Math.max(longestTaskSeconds,data.longestTaskSeconds);
      for(const [day,count] of Object.entries(data.dailyTokens))add(dailyTokens,day,count);
    }
    const sorted=Object.fromEntries(Object.entries(dailyTokens).sort(([a],[b])=>a.localeCompare(b)));
    return {source:'local-session-logs',generatedAt:new Date().toISOString(),coverage:{sessions,firstDay:Object.keys(sorted)[0]||null,lastDay:Object.keys(sorted).at(-1)||null,skippedFiles},totalTokens:Object.values(sorted).reduce((a,b)=>a+b,0),maxSessionTokens,longestTaskSeconds,...streaks(sorted),dailyTokens:sorted};
  }
}
