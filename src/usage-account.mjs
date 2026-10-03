import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile);
const count=value=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:null;
export function accountSnapshot(data,now=new Date()){
  if(!data?.summary||!Array.isArray(data.dailyUsageBuckets))throw Error('Unsupported account usage response');
  const s=data.summary,dailyTokens={};
  for(const day of data.dailyUsageBuckets){if(!/^\d{4}-\d{2}-\d{2}$/.test(day.startDate)||count(day.tokens)===null)throw Error('Invalid account usage bucket');dailyTokens[day.startDate]=day.tokens;}
  const keys=Object.keys(dailyTokens).sort();
  return {source:'official-account-usage',generatedAt:now.toISOString(),coverage:{days:keys.length,firstDay:keys[0]||null,lastDay:keys.at(-1)||null},totalTokens:count(s.lifetimeTokens),peakDailyTokens:count(s.peakDailyTokens),longestTaskSeconds:count(s.longestRunningTurnSec),currentStreakDays:count(s.currentStreakDays),longestStreakDays:count(s.longestStreakDays),dailyTokens};
}
export async function officialBinary(){
  const {stdout}=await exec('powershell.exe',['-NoProfile','-Command',"$p=Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1; if(-not $p -or $p.SignatureKind -ne 'Store' -or $p.IsDevelopmentMode){throw 'Official package unavailable'}; Join-Path $p.InstallLocation 'app/resources/codex.exe'"],{windowsHide:true,timeout:15000});
  const binary=stdout.trim();if(!path.isAbsolute(binary))throw Error('Official Codex binary unavailable');return binary;
}
export async function readAccountUsage(binary){
  binary??=await officialBinary();
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,['app-server','--stdio'],{windowsHide:true,stdio:['pipe','pipe','ignore']});
    let buffer='',finished=false;
    const finish=(error,data)=>{if(finished)return;finished=true;clearTimeout(timer);child.stdin.end();child.kill();error?reject(error):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Account usage request timed out')),50000);
    const send=value=>child.stdin.write(JSON.stringify(value)+'\n');
    child.on('error',()=>finish(Error('Could not start the official account usage reader')));
    child.stdin.on('error',()=>finish(Error('Account usage reader disconnected')));
    child.on('exit',()=>{if(!finished)finish(Error('Account usage reader exited before replying'))});
    child.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.length>16*1024*1024)return finish(Error('Account usage response too large'));let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let message;try{message=JSON.parse(line)}catch{continue}if(message.id!==1&&message.id!==2)continue;if(message.error)return finish(Error('Official account usage unavailable'));if(message.id===1){send({method:'initialized'});send({id:2,method:'account/usage/read'})}else{try{finish(null,accountSnapshot(message.result))}catch(error){finish(error)}}}});
    send({id:1,method:'initialize',params:{clientInfo:{name:'codex_wallpapers_usage',version:'0.1.6'},capabilities:{experimentalApi:true}}});
  });
}
