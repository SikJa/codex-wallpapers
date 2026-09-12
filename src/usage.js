// Reads only the existing native usage query; no separate authentication or storage.
(() => {
  if (window.__CW_USAGE__) return window.__CW_USAGE__;
  const selector = 'button[aria-label="Abrir menú de perfil"],button[aria-label="Open profile menu"],button[aria-label="Abrir menu de perfil"]';
  const queryKey = ['rate-limit-status'];
  const style = document.createElement('style');
  style.textContent = `[data-cw-usage]{flex:none;margin-inline-start:auto;padding-inline-start:8px;font-size:11px;font-weight:400;white-space:nowrap;font-variant-numeric:tabular-nums;opacity:.8;color:inherit;background:none;border:0;box-shadow:none}
  @supports(background-clip:text){[data-cw-usage]{background:linear-gradient(110deg,currentColor 0%,currentColor 42%,#fff 50%,currentColor 58%,currentColor 100%);background-size:300% 100%;background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:cw-usage-shimmer 9s ease-in-out infinite}}
  @keyframes cw-usage-shimmer{0%,65%{background-position:100% 0}90%,100%{background-position:0% 0}}
  @media(prefers-reduced-motion:reduce){[data-cw-usage]{animation:none;background:none;-webkit-text-fill-color:currentColor}}`;
  document.head.append(style);
  let client = null, unsubscribe = null, disposed = false, pending = false;
  const labels = () => ['left', 'Usage unavailable', 'Updated automatically'];
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
    try { query = client?.getQueryCache().find({queryKey, exact: true}); } catch { /* A native API change must not break rendering. */ }
    const rate = query?.state.data?.rate_limit;
    const windows = [rate?.primary_window, rate?.secondary_window]
      .filter(w => typeof w?.used_percent === 'number' && Number.isFinite(w.used_percent));
    const at = query?.state.dataUpdatedAt || 0;
    const fresh = windows.length > 0 && Date.now() - at < 120000;
    let badge = trigger.querySelector('[data-cw-usage]');
    if (!badge) {
      badge = document.createElement('span');
      badge.dataset.cwUsage = '';
      trigger.append(badge);
    }
    const [remaining, unavailable, updated] = labels();
    const percent = Math.max(0, Math.min(100, Math.round(100 - Math.max(...windows.map(w => w.used_percent)))));
    const text = fresh ? `${percent}% ${remaining}` : '—';
    const title = fresh ? `${updated} · ${new Date(at).toLocaleTimeString()}` : unavailable;
    if (badge.textContent !== text) badge.textContent = text;
    if (badge.title !== title) badge.title = title;
    if (badge.getAttribute('aria-label') !== title) badge.setAttribute('aria-label', title);
  }
  async function refresh() {
    if (disposed) return;
    try {
      const found = locate();
      if (found !== client) {
        unsubscribe?.(); client = found;
        unsubscribe = client?.getQueryCache().subscribe(event => {
          if (event.query?.queryKey?.length === 1 && event.query.queryKey[0] === queryKey[0]) render();
        });
      }
      render();
      if (!client || pending || document.hidden) return;
      const query = client.getQueryCache().find({queryKey, exact: true});
      if (!query || query.state.fetchStatus === 'fetching' || Date.now() - query.state.dataUpdatedAt < 30000) return;
      pending = true;
      await client.refetchQueries({queryKey, exact: true, type: 'all'}, {cancelRefetch: false});
    } catch { /* Native query unavailable after an app update: keep the app usable. */ }
    finally { pending = false; render(); }
  }
  const observer = new MutationObserver(render);
  observer.observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'lang']});
  const timer = setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('focus', refresh);
  const api = {
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
