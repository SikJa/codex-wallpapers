export function resetCountdown(resetAt:number|null|undefined,now=Date.now()):string|null{
  if(!Number.isFinite(resetAt)||!resetAt||resetAt<=now)return null
  const minutes=Math.ceil((resetAt-now)/60000)
  if(minutes<60)return `${minutes} min`
  const hours=Math.floor(minutes/60)
  const days=Math.floor(hours/24)
  const remainder=hours%24
  return days?`${days} d ${remainder} h`:`${hours} h`
}
