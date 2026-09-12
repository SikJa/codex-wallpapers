// Executed once per Codex window. Wallpaper rendering has no network or filesystem access.
(options => {
  if(window.__CODEX_WALLPAPERS_PUBLIC__)return 'present';
  if(!document.querySelector('main[data-app-shell-main-surface]'))throw Error('Unsupported Codex shell');
  if(window.__CODEX_DREAM_SKIN_STATE__)throw Error('Another wallpaper mod is active; preserve it and stop.');
  const KEY='codex-wallpapers.preferences.v1';
  const defaults={selected:null,enabled:true,fit:'cover',brightness:32,sidebarOpacity:97,composerOpacity:98,cardOpacity:62,sidebarRadius:14,composerRadius:18,settingsRadius:18,paletteMode:'auto',accent:'#cbd5e1',surface:'#121316',sidebar:'#111318',motion:'system'};
  function sanitize(input={}){
    const p={...defaults};
    for(const k of ['selected'])if(input[k]===null||/^[a-f0-9]{24}$/.test(input[k]))p[k]=input[k];
    for(const [k,min,max] of [['brightness',15,65],['sidebarOpacity',80,100],['composerOpacity',80,100],['cardOpacity',40,100],['sidebarRadius',0,28],['composerRadius',0,28],['settingsRadius',0,28]])if(Number.isFinite(input[k]))p[k]=Math.max(min,Math.min(max,input[k]));
    for(const [k,values] of Object.entries({fit:['cover','contain'],paletteMode:['auto','manual'],motion:['system','play','pause']}))if(values.includes(input[k]))p[k]=input[k];
    for(const k of ['accent','surface','sidebar'])if(/^#[a-f0-9]{6}$/i.test(input[k]))p[k]=input[k];
    if(typeof input.enabled==='boolean')p.enabled=input.enabled;
    return p;
  }
  const readPrefs=()=>{try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return sanitize();}};
  let prefs=readPrefs(),current=null,seq=0,disposed=false,filter='all',lastFocus=null;
  const items=new Map(),chunks=new Map(),urls=new Set();
  const surface=document.createElement('style');surface.id='cw-surfaces';document.head.append(surface);
  const host=document.createElement('div');host.id='cw-picker';host.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:1000';
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>${options.modalCSS}dialog{pointer-events:auto}</style><dialog aria-labelledby="heading"><header><div><h1 id="heading">Your wallpapers</h1><p>Your space, your way.</p></div><button id="close" aria-label="Close wallpapers">×</button></header>
    <section id="guide" hidden><strong>Add a wallpaper with your agent</strong><p>Attach a local image or video to Codex and ask: “Import this file into codex-wallpapers and apply it.”</p><p>We recommend Wallpaper Engine on Steam as a source. Respect each creator’s permissions. Wallpaper Engine scenes are not MP4 files: use an exportable image or video, or a recording you have permission to make.</p><p>No wallpapers are bundled or downloaded automatically. Supported formats: JPG, PNG, WebP, MP4 and WebM.</p></section>
    <div id="layout"><section id="collection"><div id="toolbar"><div id="filters" role="group" aria-label="Filter wallpapers"><button data-kind="all" aria-pressed="true">All</button><button data-kind="image" aria-pressed="false">Images</button><button data-kind="video" aria-pressed="false">Videos</button></div><input id="search" type="search" placeholder="Search wallpapers" aria-label="Search wallpapers"></div><div id="grid"></div><div id="empty"><h2>Start with your own wallpaper.</h2><p>Your library starts empty. Choose an image or video and let your agent import it.</p><button id="empty-help">How to add wallpapers</button></div><div id="no-results" hidden>No results for this search.</div></section>
    <aside id="details"><img id="preview" alt="" hidden><h2 id="current">No wallpaper selected</h2><div id="dimensions"></div>
    <label><span>Fit</span><select id="fit"><option value="cover">Fill without stretching</option><option value="contain">Fit entire image</option></select></label>
    <label><span>Brightness <output id="brightness-out"></output></span><input id="brightness" aria-label="Brightness" type="range" min="15" max="65"></label>
    <label><span>Motion</span><select id="motion"><option value="system">Respect reduced motion</option><option value="play">Play</option><option value="pause">Pause</option></select></label>
    <details><summary>Appearance</summary><label><span>Palette</span><select id="paletteMode"><option value="auto">Match wallpaper</option><option value="manual">Custom colors</option></select></label>
    <label><span>Accent</span><input id="accent" type="color"></label><label><span>Surfaces</span><input id="surface" type="color"></label><label><span>Sidebar</span><input id="sidebar" type="color"></label>
    ${[['sidebarOpacity','Sidebar opacity',80,100],['composerOpacity','Composer opacity',80,100],['cardOpacity','Suggestion opacity',40,100],['sidebarRadius','Sidebar corners',0,28],['composerRadius','Composer corners',0,28],['settingsRadius','Settings corners',0,28]].map(([id,label,min,max])=>`<label><span>${label}<output id="${id}-out"></output></span><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}"></label>`).join('')}</details>
    <div id="actions"><button id="toggle">Disable wallpaper</button><button id="reset">Reset settings</button><button id="help">Add wallpapers</button></div></aside></div><p id="status" role="status">Preparing your library…</p></dialog>`;
  document.body.append(host);const q=id=>root.getElementById(id),dialog=root.querySelector('dialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function save(){localStorage.setItem(KEY,JSON.stringify(prefs));}
  function notice(text){q('status').textContent=text;}
  function renderControls(){for(const k of Object.keys(defaults)){const el=q(k);if(el)el.value=String(prefs[k]);const out=q(k+'-out');if(out)out.textContent=prefs[k]+(k.includes('Radius')?' px':'%');}q('toggle').textContent=prefs.enabled?'Disable wallpaper':'Enable wallpaper';for(const k of ['accent','surface','sidebar'])q(k).disabled=prefs.paletteMode==='auto';}
  function palette(item){const p=prefs.paletteMode==='auto'?item?.palette:prefs;return Object.fromEntries(['accent','surface','sidebar'].map(k=>[k,/^#[a-f0-9]{6}$/i.test(p?.[k])?p[k]:defaults[k]]));}
  function appearance(){
    const active=prefs.enabled&&!!current;document.documentElement.classList.toggle('cw-active',active);
    const p=palette(items.get(prefs.selected));
    surface.textContent=options.appearanceCSS+`html.cw-active{--cw-accent:${p.accent};--cw-surface:${p.surface};--cw-sidebar:${p.sidebar};--cw-sidebar-opacity:${prefs.sidebarOpacity}%;--cw-composer-opacity:${prefs.composerOpacity}%;--cw-card-opacity:${prefs.cardOpacity}%;--cw-sidebar-radius:${prefs.sidebarRadius}px;--cw-composer-radius:${prefs.composerRadius}px;--cw-settings-radius:${prefs.settingsRadius}px;}`;
    if(current){current.hidden=!active;current.style.objectFit=prefs.fit;current.style.filter=`brightness(${prefs.brightness/100})`;if(current.tagName==='VIDEO'){if(!active||document.hidden||prefs.motion==='pause'||(prefs.motion==='system'&&reduced.matches))current.pause();else current.play().catch(()=>notice('The video is ready. Open Wallpapers to resume playback.'));}}
    renderControls();
  }
  function updateDetails(){const item=items.get(prefs.selected);q('preview').hidden=!item;if(item){q('preview').src=item.thumbnail;q('current').textContent=item.title;q('dimensions').textContent=`${item.width} × ${item.height} · ${item.kind==='video'?'Video':'Image'}`;}else{q('current').textContent='No wallpaper selected';q('dimensions').textContent='';}for(const b of q('grid').children)b.setAttribute('aria-pressed',String(b.dataset.id===prefs.selected));}
  function updateFilter(){let visible=0;for(const b of q('grid').children){const i=items.get(b.dataset.id);b.hidden=!((filter==='all'||i.kind===filter)&&i.title.toLocaleLowerCase().includes(q('search').value.toLocaleLowerCase()));if(!b.hidden)visible++;}q('empty').hidden=items.size>0;q('no-results').hidden=visible>0||items.size===0;}
  async function select(id,{persist=true}={}){
    const item=items.get(id);if(!item)throw Error('Wallpaper unavailable');const ticket=++seq;
    const media=document.createElement(item.kind==='video'?'video':'img');media.id='cw-media';media.setAttribute('aria-hidden','true');
    if(item.kind==='video'){media.muted=true;media.defaultMuted=true;media.loop=true;media.playsInline=true;media.preload='auto';}
    try{
      await new Promise((resolve,reject)=>{const finish=error=>{clearTimeout(timer);media.onload=media.onloadeddata=media.onerror=null;error?reject(error):resolve();};const timer=setTimeout(()=>finish(Error('Loading timed out')),10000);media.onload=media.onloadeddata=()=>finish();media.onerror=()=>finish(Error('Unsupported format'));media.src=item.url;});
      if(ticket!==seq||disposed){media.removeAttribute('src');media.load?.();return false;}
      if((media.videoWidth||media.naturalWidth)!==item.width||(media.videoHeight||media.naturalHeight)!==item.height)throw Error('The resolution does not match the imported file');
      const old=current;current=media;document.body.prepend(media);prefs.selected=id;appearance();old?.pause?.();old?.remove();old?.removeAttribute('src');old?.load?.();
      if(persist)save();updateDetails();
      const ratio=prefs.fit==='cover'?Math.max(innerWidth*devicePixelRatio/item.width,innerHeight*devicePixelRatio/item.height):Math.min(innerWidth*devicePixelRatio/item.width,innerHeight*devicePixelRatio/item.height);
      notice(`${item.title} applied.${ratio>1.05?' Upscaled on this display; it may look less sharp.':''}`);return true;
    }catch(e){media.removeAttribute('src');media.load?.();if(ticket===seq)notice(e.message+'. Your previous wallpaper is unchanged.');throw e;}
  }
  function register(meta,base64){
    if(items.has(meta.id))return;
    if(!/^[a-f0-9]{24}$/.test(meta.id)||!['image','video'].includes(meta.kind)||typeof meta.title!=='string')throw Error('Invalid media');
    const parts=chunks.get(meta.id);if(!parts||parts.size!==meta.size)throw Error('Incomplete media transfer');
    chunks.delete(meta.id);const url=URL.createObjectURL(new Blob(parts.bytes,{type:meta.mime}));urls.add(url);
    const thumbnail=URL.createObjectURL(new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/jpeg'}));urls.add(thumbnail);
    items.set(meta.id,{...meta,url,thumbnail});const b=document.createElement('button');b.dataset.id=meta.id;b.setAttribute('aria-pressed','false');
    const img=document.createElement('img');img.src=thumbnail;img.alt='';const title=document.createElement('strong');title.textContent=meta.title;const detail=document.createElement('small');detail.textContent=`${meta.kind==='video'?'Video':'Image'} · ${meta.width} × ${meta.height}`;b.append(img,title,detail);b.onclick=()=>select(meta.id).catch(()=>{});q('grid').append(b);updateFilter();
  }
  function append(id,base64){let p=chunks.get(id);if(!p){p={size:0,bytes:[]};chunks.set(id,p);}const b=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));p.size+=b.length;if(p.size>128*1024*1024)throw Error('Media too large');p.bytes.push(b);}
  const open=()=>{lastFocus=document.activeElement;if(!dialog.open)dialog.showModal();appearance();};
  const close=()=>dialog.close();q('close').onclick=close;dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();});
  q('help').onclick=q('empty-help').onclick=()=>{q('guide').hidden=!q('guide').hidden;};
  q('toggle').onclick=()=>{prefs.enabled=!prefs.enabled;save();appearance();};
  q('reset').onclick=()=>{prefs={...defaults,selected:prefs.selected};save();appearance();notice('Settings reset.');};
  for(const k of Object.keys(defaults)){const el=q(k);if(!el)continue;el.addEventListener('input',()=>{prefs=sanitize({...prefs,[k]:el.type==='range'?Number(el.value):el.value});save();appearance();});}
  q('search').oninput=updateFilter;for(const b of q('filters').children)b.onclick=()=>{filter=b.dataset.kind;for(const x of q('filters').children)x.setAttribute('aria-pressed',String(x===b));updateFilter();};
  const menuSelector='button[aria-label="Abrir menú de perfil"],button[aria-label="Open profile menu"]';
  const menuHandlers=new Map();
  function insertMenu(){
    const trigger=document.querySelector(menuSelector);if(!trigger)return;
    const menu=[...document.querySelectorAll('[role="menu"]')].find(e=>e.getAttribute('aria-labelledby')===trigger.id);
    if(!menu||menu.querySelector('[data-cw-menu]'))return;
    const settings=[...menu.querySelectorAll('[role="menuitem"]')].find(e=>/^(Configuración|Settings)/.test(e.textContent.trim()));if(!settings)return;
    const item=settings.cloneNode(true);item.removeAttribute('id');item.removeAttribute('data-radix-collection-item');item.removeAttribute('data-highlighted');item.dataset.cwMenu='true';item.tabIndex=-1;
    const row=item.firstElementChild;if(!row||row.children.length<2)return;while(row.children.length>2)row.lastElementChild.remove();row.children[1].textContent='Wallpapers';
    const svg=item.querySelector('svg');if(svg){svg.setAttribute('viewBox','0 0 20 20');svg.innerHTML='<rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor"/><path d="m4 14 4-4 3 3 2-2 3 3" fill="none" stroke="currentColor"/>';}
    const activate=e=>{e.preventDefault();e.stopPropagation();item.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));setTimeout(open,30);};item.onclick=activate;item.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')activate(e);};item.onpointermove=()=>item.focus();settings.after(item);
    for(const [old,handler] of menuHandlers)if(!old.isConnected){old.removeEventListener('keydown',handler,true);menuHandlers.delete(old);}
    if(!menuHandlers.has(menu)){const handler=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const rows=[...menu.querySelectorAll('[role="menuitem"]')],i=rows.indexOf(document.activeElement);if(i<0)return;e.preventDefault();e.stopImmediatePropagation();rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus();};menuHandlers.set(menu,handler);menu.addEventListener('keydown',handler,true);}
  }
  const observer=new MutationObserver(insertMenu);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-labelledby','aria-label']});insertMenu();
  const visibility=()=>appearance();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
  const storage=e=>{if(e.key!==KEY)return;const next=readPrefs(),previous=prefs;prefs=next;if(items.has(next.selected)&&current?.src!==items.get(next.selected).url)select(next.selected,{persist:false}).catch(()=>{if(prefs===next){prefs=previous;appearance();updateDetails();}});else{appearance();updateDetails();}};window.addEventListener('storage',storage);
  function dispose(){disposed=true;seq++;window.__CW_USAGE__?.dispose();observer.disconnect();for(const [menu,handler] of menuHandlers)menu.removeEventListener('keydown',handler,true);menuHandlers.clear();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);window.removeEventListener('storage',storage);current?.pause?.();current?.remove();host.remove();surface.remove();document.documentElement.classList.remove('cw-active');document.querySelectorAll('[data-cw-menu]').forEach(e=>e.remove());for(const url of urls)URL.revokeObjectURL(url);items.clear();chunks.clear();delete window.__CODEX_WALLPAPERS_PUBLIC__;}
  const api={append,register,select,open,close,dispose,ids:()=>[...items.keys()],status:()=>({count:items.size,selected:prefs.selected,enabled:prefs.enabled,media:!!current,profileButton:!!document.querySelector('[data-cw-menu]'),settings:{...prefs}}),async ready(){renderControls();updateFilter();if(items.has(prefs.selected))await select(prefs.selected);else{notice(items.size?'Choose your first wallpaper.':'Your library is empty. Add your first wallpaper with your agent.');}return api.status();}};
  window.__CODEX_WALLPAPERS_PUBLIC__=api;renderControls();return 'installed';
})
