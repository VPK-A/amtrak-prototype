// Prototype controls › Station selector: "From / To in the selector, stays open" (default) and "Single field,
// returns after one choice" (no From / To in List or Map, the station card only, back after one station).
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
  const setMode = async v => { await p.click('#chromeToggle'); await p.selectOption('#tbCmpSel', v); await p.click('#chromeToggle'); await w(300); };
  const open = () => ev(() => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('new'); goLoc('ff'); }).then(() => w(400));
  const pin = c => ev(c => document.querySelector('#device .map-pin[data-code="' + c + '"]').click(), c).then(() => w(450));
  const toMap = async () => { await click('#ss-tab-map', 600); await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 40.0, lon: -75.0, z: 8 }; render(); }); await w(300); };

  ok(await ev(() => document.querySelector('#tbCmpSel').value) === 'pair' && await ev(() => [...document.querySelectorAll('#tbCmpSel option')].map(o => o.textContent).join('|')) === 'From / To in the selector, stays open|Single field, returns after one choice', 'control: two options, From / To by default');
  ok(await ev(() => document.querySelector('#protoCtl').contains(document.querySelector('#tbCmpSel')) && !document.querySelector('#device #tbCmpSel')), 'the control lives in Prototype controls, not in the app');

  // ---- From / To in the selector (default) ----
  await open(); await click('#ff-from', 700);
  ok(await p.locator(D_ + '.ss-group').count() === 1 && await ev(() => document.querySelector('#device .ss-head__title').textContent.startsWith('Select station')), 'pair: From / To group in List view');
  await p.fill(D_ + '#ss-q', 'NYP'); await w(200); await click('[data-a="choose-station"][data-code="NYP"]');
  ok(await ev(() => sheet().stack.at(-1).s === 'stations' && sheet().stack.at(-1).p.field === 'to' && D().booking.from === 'NYP'), 'pair: stays open on To after From');
  await toMap(); await pin('PHL');
  ok(await ev(() => { const c = document.querySelector('#device #map-card'); return c && c.classList.contains('map-listing') && c.querySelector('.map-listing__code') && !c.querySelector('.ss-group') && !!c.querySelector('[data-a="map-details"]') && !!c.querySelector('[data-a="fav"]') && !!document.querySelector('#device .pane__foot [data-k="map-select"]'); }) && /PHL/.test(await ev(() => document.querySelector('#device #map-card').innerText)), 'pair: the Figma station listing (code, city, station, info, save) with Select in the footer');
  await click('[data-k="map-select"]');
  ok(await stack() === 'ff' && await ev(() => D().booking.to === 'PHL'), 'pair: after both, back on New booking');

  // ---- Single field ----
  await setMode('single'); await open(); await click('#ff-from', 700);
  ok(await p.locator(D_ + '.ss-group').count() === 0 && await ev(() => document.querySelector('#device .ss-head__title').textContent) === 'Select departure station', 'single: no From / To in List view; heading names the field');
  ok(await p.locator(D_ + '#ss-q').count() === 1 && await p.locator(D_ + '.ss-nearlink').count() === 1 && await p.locator(D_ + '.stsection').count() >= 1, 'single: search, Nearby stations and the lists stay');
  await p.fill(D_ + '#ss-q', 'NYP'); await w(200); await click('[data-a="choose-station"][data-code="NYP"]');
  ok(await stack() === 'ff' && await ev(() => D().booking.from === 'NYP' && !D().booking.to) && await ev(() => document.activeElement.id) === 'ff-from', 'single: choosing fills From only and returns to New booking');
  await click('#ff-to', 700); ok(await ev(() => document.querySelector('#device .ss-head__title').textContent) === 'Select arrival station', 'single: To heading');
  await toMap(); ok(await p.locator(D_ + '.ss-group').count() === 0, 'single: no From / To in Map view');
  await pin('PHL');
  ok(await ev(() => { const c = document.querySelector('#device #map-card'); return c && c.classList.contains('map-listing') && c.querySelector('.map-listing__code') && !c.querySelector('.ss-group') && !!c.querySelector('[data-a="map-details"]') && !!c.querySelector('[data-a="fav"]') && !!document.querySelector('#device .pane__foot [data-k="map-select"]'); }), 'single: the same station listing, Select in the footer');
  await click('[data-k="map-select"]');
  ok(await stack() === 'ff' && await ev(() => D().booking.from === 'NYP' && D().booking.to === 'PHL'), 'single: Select fills To only and returns');
  // the setting persists and switches back
  await p.reload(); await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  ok(await ev(() => document.querySelector('#tbCmpSel').value) === 'single', 'the setting is remembered');
  await setMode('pair'); await open(); await click('#ff-from', 700); ok(await p.locator(D_ + '.ss-group').count() === 1, 'switching back restores From / To');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
