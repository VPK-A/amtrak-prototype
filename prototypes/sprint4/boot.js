/* Sprint 4 prototype: start-up */
TB.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
{ const v = store.get('s4-v'); if (['1', '3'].includes(v)) TB.v = +v; /* only reviewed concepts are restored */ const d = store.get('s4-dev'); if (d === 'iphone' || d === 'ipad') TB.dev = d; }
const _render = render;
render = function () { document.documentElement.dataset.theme = TB.theme; _render(); };
wireToolbar(); wireDevice(); render();
