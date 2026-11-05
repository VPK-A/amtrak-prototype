/* Sprint 4 prototype: start-up */
TB.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
{ TB.v = 1; store.set('s4-v', '1'); /* one New booking design: no concept switch */ const d = store.get('s4-dev'); if (d === 'iphone' || d === 'ipad') TB.dev = d; }
const _render = render;
render = function () { document.documentElement.dataset.theme = TB.theme; _render(); syncBookHeader(); };
wireToolbar(); wireDevice(); render();
