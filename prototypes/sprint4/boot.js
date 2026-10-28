/* Sprint 4 prototype: start-up */
TB.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
{ const v = store.get('s4-v'); if (['1', '2', '3'].includes(v)) TB.v = +v; const d = store.get('s4-dev'); if (d === 'iphone' || d === 'ipad') TB.dev = d; if (store.get('s4-easy') === '1') TB.easy = true; }
const _render = render;
render = function () { document.documentElement.dataset.theme = TB.theme; _render(); };
wireToolbar(); wireDevice(); render();
