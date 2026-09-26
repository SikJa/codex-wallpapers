// Reads only the existing native usage query; no separate authentication or storage.
(() => {
  if (window.__CW_USAGE__?.version === 6) return window.__CW_USAGE__;
  window.__CW_USAGE__?.dispose?.();
  document.getElementById('cw-usage-style')?.remove();
  const selector = 'button[aria-label="Abrir menú de perfil"],button[aria-label="Open profile menu"],button[aria-label="Abrir menu de perfil"],button[aria-label="Open settings"],button[aria-label="Abrir configuración"]';
  const queryKey = ['rate-limit-status'];
  const findUsageQuery = () => client?.getQueryCache().findAll({queryKey, exact: false})
    .filter(q => q.queryKey.length === 3 && q.state.data?.rate_limit)
    .sort((a, b) => (b.state.dataUpdatedAt || 0) - (a.state.dataUpdatedAt || 0))[0] || null;
  const style = document.createElement('style');
  style.id = 'cw-usage-style';
  style.textContent = `[data-cw-usage]{width:34px;height:34px;flex:none;position:relative;display:grid;place-items:center;--cw-gauge-color:var(--cw-accent,#cbd5e1);font:700 9px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;pointer-events:none}
  [data-cw-usage] svg{position:absolute;inset:0;width:34px;height:34px;overflow:visible}
  [data-cw-usage] circle{fill:none;stroke-width:3;stroke-linecap:round}
  [data-cw-usage] circle.cw-track{stroke:var(--cw-gauge-color);opacity:.22}
  [data-cw-usage] circle.cw-progress{stroke:url(#cw-usage-metal);transition:stroke-dasharray .35s ease}
  [data-cw-usage] circle.cw-glint{stroke:#fff;stroke-width:1.8;opacity:0;transform-origin:17px 17px}
  [data-cw-usage][data-fresh="true"] circle.cw-glint{animation:cw-usage-glint 30s linear infinite}
  [data-cw-usage] stop.cw-metal-dark{stop-color:color-mix(in srgb,var(--cw-gauge-color) 65%,#14151c)}
  [data-cw-usage] stop.cw-metal-light{stop-color:color-mix(in srgb,var(--cw-gauge-color) 60%,white)}
  [data-cw-usage] stop.cw-metal-main{stop-color:var(--cw-gauge-color)}
  [data-cw-usage] span{position:relative;color:#f5f7f5;text-shadow:0 1px 2px #000a}
  @keyframes cw-usage-glint{0%,4%,100%{opacity:0;transform:rotate(131deg)}.7%{opacity:.85}3.3%{opacity:.85;transform:rotate(409deg)}}
  @media(prefers-reduced-motion:reduce){[data-cw-usage] circle.cw-progress{transition:none}[data-cw-usage] circle.cw-glint{animation:none}}`;
  document.head.append(style);
  let client = null, unsubscribe = null, disposed = false, pending = false;
  const labels = () => ['left', 'Usage unavailable', 'Updated automatically'];
  const circumference = 2 * Math.PI * 13.5;
  const sweep = circumference * 278 / 360;
  function locate() {
    const el = document.querySelector('main[data-app-shell-main-surface]');
    let fiber = el?.[Object.keys(el).find(k => k.startsWith('__reactFiber$'))];
    while (fiber) {
      for (const value of Object.values(fiber.memoizedProps || {})) {
        if (value && typeof value.getQueryCache === 'function' && typeof value.refetchQueries === 'function') return value;
      }
      fiber = fiber.return;
    }
    return null;
  }
  function render() {
    if (disposed) return;
    const trigger = document.querySelector(selector);
    if (!trigger) return;
    let query;
    try { query = findUsageQuery(); } catch { /* A native API change must not break rendering. */ }
    const rate = query?.state.data?.rate_limit;
    const windows = [rate?.primary_window, rate?.secondary_window]
      .filter(w => typeof w?.used_percent === 'number' && Number.isFinite(w.used_percent));
    const at = query?.state.dataUpdatedAt || 0;
    const fresh = windows.length > 0 && Date.now() - at < 120000;
    const profileRow = trigger.closest('.sidebar-item')?.parentElement;
    if (!profileRow?.parentElement?.closest('nav')) return;
    const footer = profileRow.parentElement;
    let badge = footer.querySelector(':scope > [data-cw-usage]');
    if (!badge) {
      badge = document.createElement('div');
      badge.dataset.cwUsage = '';
      badge.setAttribute('role', 'img');
      badge.innerHTML = '<svg viewBox="0 0 34 34" aria-hidden="true"><defs><linearGradient id="cw-usage-metal" x1="0" y1="0" x2="1" y2="1"><stop class="cw-metal-dark" offset="0"/><stop class="cw-metal-main" offset=".42"/><stop class="cw-metal-light" offset=".64"/><stop class="cw-metal-main" offset=".82"/><stop class="cw-metal-dark" offset="1"/></linearGradient></defs><circle class="cw-track" cx="17" cy="17" r="13.5" transform="rotate(131 17 17)"></circle><circle class="cw-progress" cx="17" cy="17" r="13.5" transform="rotate(131 17 17)"></circle><circle class="cw-glint" cx="17" cy="17" r="13.5"></circle></svg><span></span>';
      footer.prepend(badge);
    }
    const [remaining, unavailable, updated] = labels();
    const percent = Math.max(0, Math.min(100, Math.round(100 - Math.max(...windows.map(w => w.used_percent)))));
    const text = fresh ? `${percent}%` : '—';
    const title = fresh ? `${updated} · ${new Date(at).toLocaleTimeString()}` : unavailable;
    if (badge.querySelector('span').textContent !== text) badge.querySelector('span').textContent = text;
    badge.style.opacity = fresh ? '1' : '.5';
    badge.dataset.fresh = String(fresh);
    badge.dataset.level = percent <= 20 ? 'low' : percent <= 60 ? 'mid' : 'high';
    badge.style.setProperty('--cw-gauge-color', fresh ? `color-mix(in srgb,${percent <= 20 ? '#e65c63' : percent <= 60 ? '#e5a548' : '#4ec58b'} 82%,var(--cw-accent,#cbd5e1))` : 'var(--cw-accent,#cbd5e1)');
    badge.querySelector('.cw-track').style.strokeDasharray = `${sweep} ${circumference}`;
    badge.querySelector('.cw-progress').style.strokeDasharray = `${sweep * (fresh ? percent : 0) / 100} ${circumference}`;
    badge.querySelector('.cw-glint').style.strokeDasharray = `5 ${circumference}`;
    if (badge.title !== title) badge.title = title;
    const description = fresh ? `${percent}% ${remaining}. ${title}` : unavailable;
    if (badge.getAttribute('aria-label') !== description) badge.setAttribute('aria-label', description);
  }
  async function refresh() {
    if (disposed) return;
    try {
      const found = locate();
      if (found !== client) {
        unsubscribe?.(); client = found;
        unsubscribe = client?.getQueryCache().subscribe(event => {
          if (event.query?.queryKey?.[0] === queryKey[0] && event.query.queryKey.length === 3) render();
        });
      }
      render();
      if (!client || pending || document.hidden) return;
      const query = findUsageQuery();
      if (!query || query.state.fetchStatus === 'fetching' || Date.now() - query.state.dataUpdatedAt < 30000) return;
      pending = true;
      await client.refetchQueries({predicate: query => query.queryKey[0] === queryKey[0] && query.queryKey.length === 3}, {cancelRefetch: false});
    } catch { /* Native query unavailable after an app update: keep the app usable. */ }
    finally { pending = false; render(); }
  }
  const observer = new MutationObserver(render);
  observer.observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'lang']});
  const timer = setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('focus', refresh);
  const api = {
    version: 6,
    refresh,
    dispose() {
      disposed = true; clearInterval(timer); observer.disconnect(); unsubscribe?.();
      document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh);
      document.querySelectorAll('[data-cw-usage]').forEach(el => el.remove()); style.remove();
      if (window.__CW_USAGE__ === api) delete window.__CW_USAGE__;
    },
  };
  window.__CW_USAGE__ = api;
  refresh();
  return api;
})
