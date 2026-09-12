export class Session {
  constructor(url) { this.url=url; this.pending=new Map(); this.seq=0; }
  async open() {
    this.socket=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.socket.close();reject(Error('CDP connection timeout'));},5000);
      this.socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      this.socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('CDP connection failed'));},{once:true});
    });
    this.socket.addEventListener('message',event=>{const m=JSON.parse(event.data);const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);});
    this.socket.addEventListener('close',()=>this.rejectPending());
  }
  rejectPending(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('CDP session closed'));}this.pending.clear();}
  send(method,params={},timeout=15000){return new Promise((resolve,reject)=>{const id=++this.seq;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`CDP timeout: ${method}`));},timeout);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}));});}
  async evaluate(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
  close(){this.rejectPending();this.socket?.close();}
}
export async function targets(endpoint){
  if(!Number.isInteger(endpoint.port)||endpoint.port<1024||endpoint.port>65535||!/^[\w-]+$/.test(endpoint.browserId))throw Error('Invalid endpoint identity');
  const get=async p=>{const r=await fetch(`http://127.0.0.1:${endpoint.port}/json/${p}`,{signal:AbortSignal.timeout(4000),redirect:'error'});if(!r.ok)throw Error('CDP unavailable');return r.json();};
  const version=await get('version');
  if(new URL(version.webSocketDebuggerUrl).pathname!==`/devtools/browser/${endpoint.browserId}`)throw Error('Browser identity changed; open the personalized shortcut again when Codex is closed.');
  return (await get('list')).filter(t=>t.type==='page'&&t.url.startsWith('app://')).map(t=>{
    if(!/^[\w-]+$/.test(t.id))throw Error('Invalid target');
    return {...t,webSocketDebuggerUrl:`ws://127.0.0.1:${endpoint.port}/devtools/page/${t.id}`};
  });
}
