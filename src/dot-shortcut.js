(() => {
  if (window.__CW_DOT_SHORTCUT__) return;
  const sourceSelector='aside [data-sidebar-destination="builtin:orbit"]';
  let button=null,frame=0,signature='';
  function sync(){
    frame=0;
    const rail=document.querySelector('[data-app-navigation-rail="true"]');
    const source=document.querySelector(sourceSelector);
    const template=rail?.querySelector('button[data-sidebar-destination="builtin:home"]');
    const list=template?.parentElement?.parentElement;
    if(!source||!template||!list){button?.remove();button=null;signature='';return;}
    if(!button?.isConnected){
      button=document.createElement('button');button.type='button';button.className=template.className;
      for(const name of ['data-color','data-variant','data-squircle','data-uniform','data-size','data-icon-size'])if(template.hasAttribute(name))button.setAttribute(name,template.getAttribute(name));
      button.dataset.cwDotShortcut='true';
      button.addEventListener('click',()=>document.querySelector(sourceSelector)?.click());
      list.append(button);signature='';
    }
    const name=source.querySelector('.text-fade-truncate')?.textContent.trim()||'Your dot';
    const icon=source.querySelector('[data-codex-pet-id],svg,img');
    // Reuse only the native avatar presentation, never React handlers or routing IDs.
    const next=name+'|'+(icon?.getAttribute('data-codex-pet-id')||icon?.getAttribute('src')||icon?.tagName||'');
    if(next!==signature){
      signature=next;button.replaceChildren();
      if(icon){const copy=icon.cloneNode(true);copy.removeAttribute('id');copy.setAttribute('aria-hidden','true');button.append(copy);}
      else button.textContent='·';
      button.setAttribute('aria-label','Open '+name);button.title=name;
    }
    const selected=source.classList.contains('bg-primary-ghost-hover');
    if(button.hasAttribute('data-selected')!==selected)button.toggleAttribute('data-selected',selected);
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(sync);};
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-sidebar-destination','data-codex-pet-id']});
  window.__CW_DOT_SHORTCUT__={dispose(){observer.disconnect();cancelAnimationFrame(frame);button?.remove();delete window.__CW_DOT_SHORTCUT__;}};
  sync();
})();
