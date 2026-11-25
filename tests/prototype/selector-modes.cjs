// Station selector design decision: From / To in the selector, and it stays open until both stations are chosen.
// The Prototype controls option (and the single-field mode) was retired.
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const click = async (s, ms = 450) => { await p.locator(D_ + s).first().click(); await w(ms); };
  const stack = () => ev(() => sheet() ? sheet().stack.map(r => r.s).join('>') : 'none');
  const open = () => ev(() => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('new'); goLoc('ff'); }).then(() => w(400));
  const pin = async c => { for (let i = 0; i < 4; i++) { const hit = await ev(c => { const d = document.querySelector('#device .map-pin[data-code="' + c + '"]'); if (d) { d.click(); return 'pin'; } const g = [...document.querySelectorAll('#device .map-group')].find(x => x.dataset.codes.split(',').includes(c)); if (g) { g.click(); return 'group'; } return ''; }, c); await w(450); if (hit !== 'group') return; } }; // close stations share a group pin: tap it to zoom in first
  const toMap = async () => { await click('#ss-tab-map', 600); await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 40.0, lon: -75.0, z: 8 }; render(); }); await w(300); };

  ok(await ev(() => !document.querySelector('#tbCmpSel') && !document.querySelector('#tbCmpAssist') && !document.querySelector('#tbCmpBp') && !document.querySelector('#tbCmpPrSel')), 'retired comparison options are gone from Prototype controls');

  // ---- From / To in the selector (default) ----
  await open(); await click('#ff-from', 700);
  ok(await p.locator(D_ + '.ss-group').count() === 1 && await ev(() => document.querySelector('#device .ss-head__title').textContent.startsWith('Select station')), 'pair: From / To group in List view');
  await p.fill(D_ + '#ss-q', 'NYP'); await w(200); await click('[data-a="choose-station"][data-code="NYP"]');
  ok(await ev(() => sheet().stack.at(-1).s === 'stations' && sheet().stack.at(-1).p.field === 'to' && D().booking.from === 'NYP'), 'pair: stays open on To after From');
  await toMap(); await pin('PHL');
  ok(await ev(() => { const c = document.querySelector('#device #map-card'); return c && c.classList.contains('map-listing') && c.querySelector('.map-listing__code') && !c.querySelector('.ss-group') && !!c.querySelector('[data-a="map-details"]') && !!c.querySelector('[data-a="fav"]') && !!document.querySelector('#device .pane__foot [data-k="map-select"]'); }) && /PHL/.test(await ev(() => document.querySelector('#device #map-card').innerText)), 'pair: the Figma station listing (code, city, station, info, save) with Select in the footer');
  await click('[data-k="map-select"]');
  ok(await stack() === 'ff' && await ev(() => D().booking.to === 'PHL'), 'pair: after both, back on New booking');

  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
