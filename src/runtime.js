// Executed once per Codex window. No networking, filesystem or account API access.
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
  root.innerHTML=`<style>${options.modalCSS}dialog{pointer-events:auto}</style><dialog aria-labelledby="heading"><header><div><h1 id="heading">Tus fondos</h1><p>Tu espacio, a tu manera.</p></div><button id="close" aria-label="Cerrar fondos">×</button></header>
    <section id="guide" hidden><strong>Agregá un fondo con tu agente</strong><p>Adjuntá una imagen o video local a Codex y pedile: «Importá este archivo en codex-wallpapers y aplicalo».</p><p>Recomendamos Wallpaper Engine de Steam como fuente, respetando los permisos de cada autor. Una escena de Wallpaper Engine no equivale a un MP4: usá una imagen o video exportable, o una captura que tengas permiso de hacer.</p><p>No se incluyen fondos ni se descargan automáticamente. Formatos: JPG, PNG, WebP, MP4 y WebM.</p></section>
    <div id="layout"><section id="collection"><div id="toolbar"><div id="filters" role="group" aria-label="Filtrar fondos"><button data-kind="all" aria-pressed="true">Todos</button><button data-kind="image" aria-pressed="false">Imágenes</button><button data-kind="video" aria-pressed="false">Videos</button></div><input id="search" type="search" placeholder="Buscar fondo" aria-label="Buscar fondo"></div><div id="grid"></div><div id="empty"><h2>Empezá con un fondo tuyo.</h2><p>Esta biblioteca viene vacía. Elegí una imagen o video y tu agente se encarga de importarlo.</p><button id="empty-help">Cómo agregar fondos</button></div><div id="no-results" hidden>Sin resultados para esa búsqueda.</div></section>
    <aside id="details"><img id="preview" alt="" hidden><h2 id="current">Ningún fondo seleccionado</h2><div id="dimensions"></div>
    <label><span>Encuadre</span><select id="fit"><option value="cover">Llenar sin estirar</option><option value="contain">Completo, con franjas</option></select></label>
    <label><span>Brillo <output id="brightness-out"></output></span><input id="brightness" aria-label="Brillo" type="range" min="15" max="65"></label>
    <label><span>Movimiento</span><select id="motion"><option value="system">Respetar movimiento reducido</option><option value="play">Reproducir</option><option value="pause">Pausar</option></select></label>
    <details><summary>Apariencia</summary><label><span>Paleta</span><select id="paletteMode"><option value="auto">Automática según el fondo</option><option value="manual">Colores propios</option></select></label>
    <label><span>Acento</span><input id="accent" type="color"></label><label><span>Superficies</span><input id="surface" type="color"></label><label><span>Barra lateral</span><input id="sidebar" type="color"></label>
    ${[['sidebarOpacity','Opacidad de barra lateral',80,100],['composerOpacity','Opacidad del compositor',80,100],['cardOpacity','Opacidad de sugerencias',40,100],['sidebarRadius','Esquinas de barra lateral',0,28],['composerRadius','Esquinas del compositor',0,28],['settingsRadius','Esquinas de Configuración',0,28]].map(([id,label,min,max])=>`<label><span>${label}<output id="${id}-out"></output></span><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}"></label>`).join('')}</details>
    <div id="actions"><button id="toggle">Desactivar fondo</button><button id="reset">Restablecer ajustes</button><button id="help">Agregar fondos</button></div></aside></div><p id="status" role="status">Preparando tu biblioteca…</p></dialog>`;
  document.body.append(host);const q=id=>root.getElementById(id),dialog=root.querySelector('dialog');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function save(){localStorage.setItem(KEY,JSON.stringify(prefs));}
  function notice(text){q('status').textContent=text;}
  function renderControls(){for(const k of Object.keys(defaults)){const el=q(k);if(el)el.value=String(prefs[k]);const out=q(k+'-out');if(out)out.textContent=prefs[k]+(k.includes('Radius')?' px':'%');}q('toggle').textContent=prefs.enabled?'Desactivar fondo':'Activar fondo';for(const k of ['accent','surface','sidebar'])q(k).disabled=prefs.paletteMode==='auto';}
  function palette(item){const p=prefs.paletteMode==='auto'?item?.palette:prefs;return Object.fromEntries(['accent','surface','sidebar'].map(k=>[k,/^#[a-f0-9]{6}$/i.test(p?.[k])?p[k]:defaults[k]]));}
  function appearance(){
    const active=prefs.enabled&&!!current;document.documentElement.classList.toggle('cw-active',active);
    const p=palette(items.get(prefs.selected));
    surface.textContent=options.appearanceCSS+`html.cw-active{--cw-accent:${p.accent};--cw-surface:${p.surface};--cw-sidebar:${p.sidebar};--cw-sidebar-opacity:${prefs.sidebarOpacity}%;--cw-composer-opacity:${prefs.composerOpacity}%;--cw-card-opacity:${prefs.cardOpacity}%;--cw-sidebar-radius:${prefs.sidebarRadius}px;--cw-composer-radius:${prefs.composerRadius}px;--cw-settings-radius:${prefs.settingsRadius}px;}`;
    if(current){current.hidden=!active;current.style.objectFit=prefs.fit;current.style.filter=`brightness(${prefs.brightness/100})`;if(current.tagName==='VIDEO'){if(!active||document.hidden||prefs.motion==='pause'||(prefs.motion==='system'&&reduced.matches))current.pause();else current.play().catch(()=>notice('El video está listo; abrí Fondos para reanudar la reproducción.'));}}
    renderControls();
  }
  function updateDetails(){const item=items.get(prefs.selected);q('preview').hidden=!item;if(item){q('preview').src=item.thumbnail;q('current').textContent=item.title;q('dimensions').textContent=`${item.width} × ${item.height} · ${item.kind==='video'?'Video':'Imagen'}`;}else{q('current').textContent='Ningún fondo seleccionado';q('dimensions').textContent='';}for(const b of q('grid').children)b.setAttribute('aria-pressed',String(b.dataset.id===prefs.selected));}
  function updateFilter(){let visible=0;for(const b of q('grid').children){const i=items.get(b.dataset.id);b.hidden=!((filter==='all'||i.kind===filter)&&i.title.toLocaleLowerCase().includes(q('search').value.toLocaleLowerCase()));if(!b.hidden)visible++;}q('empty').hidden=items.size>0;q('no-results').hidden=visible>0||items.size===0;}
  async function select(id,{persist=true}={}){
    const item=items.get(id);if(!item)throw Error('Fondo no disponible');const ticket=++seq;
    const media=document.createElement(item.kind==='video'?'video':'img');media.id='cw-media';media.setAttribute('aria-hidden','true');
    if(item.kind==='video'){media.muted=true;media.defaultMuted=true;media.loop=true;media.playsInline=true;media.preload='auto';}
    try{
      await new Promise((resolve,reject)=>{const finish=error=>{clearTimeout(timer);media.onload=media.onloadeddata=media.onerror=null;error?reject(error):resolve();};const timer=setTimeout(()=>finish(Error('Tiempo de carga agotado')),10000);media.onload=media.onloadeddata=()=>finish();media.onerror=()=>finish(Error('Formato no compatible'));media.src=item.url;});
      if(ticket!==seq||disposed){media.removeAttribute('src');media.load?.();return false;}
      if((media.videoWidth||media.naturalWidth)!==item.width||(media.videoHeight||media.naturalHeight)!==item.height)throw Error('La resolución no coincide con el archivo importado');
      const old=current;current=media;document.body.prepend(media);prefs.selected=id;appearance();old?.pause?.();old?.remove();old?.removeAttribute('src');old?.load?.();
      if(persist)save();updateDetails();
      const ratio=prefs.fit==='cover'?Math.max(innerWidth*devicePixelRatio/item.width,innerHeight*devicePixelRatio/item.height):Math.min(innerWidth*devicePixelRatio/item.width,innerHeight*devicePixelRatio/item.height);
      notice(`${item.title} aplicado.${ratio>1.05?' Se amplía en esta pantalla; puede perder nitidez.':''}`);return true;
    }catch(e){media.removeAttribute('src');media.load?.();if(ticket===seq)notice(e.message+'. Se conserva el fondo anterior.');throw e;}
  }
  function register(meta,base64){
    if(items.has(meta.id))return;
    if(!/^[a-f0-9]{24}$/.test(meta.id)||!['image','video'].includes(meta.kind)||typeof meta.title!=='string')throw Error('Invalid media');
    const parts=chunks.get(meta.id);if(!parts||parts.size!==meta.size)throw Error('Incomplete media transfer');
    chunks.delete(meta.id);const url=URL.createObjectURL(new Blob(parts.bytes,{type:meta.mime}));urls.add(url);
    const thumbnail=URL.createObjectURL(new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/jpeg'}));urls.add(thumbnail);
    items.set(meta.id,{...meta,url,thumbnail});const b=document.createElement('button');b.dataset.id=meta.id;b.setAttribute('aria-pressed','false');
    const img=document.createElement('img');img.src=thumbnail;img.alt='';const title=document.createElement('strong');title.textContent=meta.title;const detail=document.createElement('small');detail.textContent=`${meta.kind==='video'?'Video':'Imagen'} · ${meta.width} × ${meta.height}`;b.append(img,title,detail);b.onclick=()=>select(meta.id).catch(()=>{});q('grid').append(b);updateFilter();
  }
  function append(id,base64){let p=chunks.get(id);if(!p){p={size:0,bytes:[]};chunks.set(id,p);}const b=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));p.size+=b.length;if(p.size>128*1024*1024)throw Error('Media too large');p.bytes.push(b);}
  const open=()=>{lastFocus=document.activeElement;if(!dialog.open)dialog.showModal();appearance();};
  const close=()=>dialog.close();q('close').onclick=close;dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();});
  q('help').onclick=q('empty-help').onclick=()=>{q('guide').hidden=!q('guide').hidden;};
  q('toggle').onclick=()=>{prefs.enabled=!prefs.enabled;save();appearance();};
  q('reset').onclick=()=>{prefs={...defaults,selected:prefs.selected};save();appearance();notice('Ajustes restablecidos.');};
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
    const row=item.firstElementChild;if(!row||row.children.length<2)return;while(row.children.length>2)row.lastElementChild.remove();row.children[1].textContent='Fondos';
    const svg=item.querySelector('svg');if(svg){svg.setAttribute('viewBox','0 0 20 20');svg.innerHTML='<rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor"/><path d="m4 14 4-4 3 3 2-2 3 3" fill="none" stroke="currentColor"/>';}
    const activate=e=>{e.preventDefault();e.stopPropagation();item.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));setTimeout(open,30);};item.onclick=activate;item.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')activate(e);};item.onpointermove=()=>item.focus();settings.after(item);
    for(const [old,handler] of menuHandlers)if(!old.isConnected){old.removeEventListener('keydown',handler,true);menuHandlers.delete(old);}
    if(!menuHandlers.has(menu)){const handler=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const rows=[...menu.querySelectorAll('[role="menuitem"]')],i=rows.indexOf(document.activeElement);if(i<0)return;e.preventDefault();e.stopImmediatePropagation();rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus();};menuHandlers.set(menu,handler);menu.addEventListener('keydown',handler,true);}
  }
  const observer=new MutationObserver(insertMenu);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-labelledby','aria-label']});insertMenu();
  const visibility=()=>appearance();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
  const storage=e=>{if(e.key!==KEY)return;const next=readPrefs(),previous=prefs;prefs=next;if(items.has(next.selected)&&current?.src!==items.get(next.selected).url)select(next.selected,{persist:false}).catch(()=>{if(prefs===next){prefs=previous;appearance();updateDetails();}});else{appearance();updateDetails();}};window.addEventListener('storage',storage);
  function dispose(){disposed=true;seq++;observer.disconnect();for(const [menu,handler] of menuHandlers)menu.removeEventListener('keydown',handler,true);menuHandlers.clear();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);window.removeEventListener('storage',storage);current?.pause?.();current?.remove();host.remove();surface.remove();document.documentElement.classList.remove('cw-active');document.querySelectorAll('[data-cw-menu]').forEach(e=>e.remove());for(const url of urls)URL.revokeObjectURL(url);items.clear();chunks.clear();delete window.__CODEX_WALLPAPERS_PUBLIC__;}
  const api={append,register,select,open,close,dispose,ids:()=>[...items.keys()],status:()=>({count:items.size,selected:prefs.selected,enabled:prefs.enabled,media:!!current,profileButton:!!document.querySelector('[data-cw-menu]'),settings:{...prefs}}),async ready(){renderControls();updateFilter();if(items.has(prefs.selected))await select(prefs.selected);else{notice(items.size?'Elegí tu primer fondo.':'Biblioteca vacía. Agregá tu primer fondo con el agente.');}return api.status();}};
  window.__CODEX_WALLPAPERS_PUBLIC__=api;renderControls();return 'installed';
})
