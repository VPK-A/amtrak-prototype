// Google Maps surface for the station selector map: fallback (no key, network failure, rejected key), the Google
// path through a test double (markers, highlight vs confirm, pan/zoom never select, sync, back and reopen), and
// stations with missing or invalid coordinates (mock fixtures). Live Google rendering needs a real key: not covered.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = require('url').pathToFileURL(path.resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
const STUB = fs.readFileSync(path.join(__dirname, 'fixtures/google-maps-stub.js'), 'utf8');
const MOCK = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/stations.mock.json'), 'utf8')).stations;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch();
  const page = async (init = '', block = false) => {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 1300 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.errs = errs;
    if (block) await ctx.route(/maps\.googleapis\.com/, r => r.abort());
    if (init) await p.addInitScript(init);
    await p.goto(URL); return p;
  };
  const D_ = '#device ';
  const openMap = async (p, sc = 'returning', loc = 'stations:from') => { await p.evaluate(([sc, loc]) => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS(sc); goLoc(loc); }, [sc, loc]); await p.waitForTimeout(300); await p.click(D_ + '#ss-tab-map'); await p.waitForTimeout(400); };
  const provider = p => p.evaluate(() => (document.querySelector('#device .ss-map') || {}).dataset?.provider);
  const st = p => p.evaluate(() => { const r = selRoute(); return r && { sel: r.u.mapSel || null, z: r.u.map && r.u.map.z, lat: r.u.map && r.u.map.lat, from: D().booking.from, to: D().booking.to, view: r.u.view }; });

  // ---- 1. No key: placeholder map, same selection path ----
  let p = await page();
  await openMap(p);
  ok(await provider(p) === 'placeholder' && await p.evaluate(() => GM.reason) === 'no-key', 'no key: placeholder map, Google not requested');
  ok(await p.evaluate(() => ![...document.scripts].some(s => /maps\.googleapis/.test(s.src))), 'no key: no request to Google');
  await p.evaluate(() => document.querySelector('#device .map-pin[data-code="WAS"]').click()); await p.waitForTimeout(300);
  let s = await st(p); ok(s.sel === 'WAS' && s.from === null && await p.locator(D_ + '[data-k="map-select"]').count() === 1, 'fallback: marker highlights and opens the listing with Select; field unchanged');
  ok(/placeholder drawing \(Google Maps has no API key configured\)/.test(await p.evaluate(() => document.querySelector('#notes').innerText)), 'reviewer note explains the fallback');
  await p.click(D_ + '[data-k="map-select"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => D().booking.from) === 'WAS' && await p.evaluate(() => sheet().stack.length === 2 && sheet().stack[1].p.field === 'to'), 'fallback: Select confirms From and moves on to To');
  await p.close();

  // ---- 2. Network failure: placeholder takes over ----
  p = await page('window.S4_CONFIG = { googleMapsApiKey: "TEST-NETWORK" };', true);
  await openMap(p); await p.waitForTimeout(1500);
  ok(await provider(p) === 'placeholder' && await p.evaluate(() => GM.state + ':' + GM.reason) === 'failed:network', 'script blocked: falls back to the placeholder');
  ok(await p.evaluate(() => (V().analytics || []).some(e => e.ev === 'map_load_failed' && e.props.reason === 'network')), 'load failure tracked');
  await p.close();

  // ---- 3. Rejected key (real Google script, invalid key) ----
  p = await page('window.S4_CONFIG = { googleMapsApiKey: "INVALID-KEY-FOR-TEST" };');
  await openMap(p);
  let reached = false; for (let i = 0; i < 40 && !reached; i++) { await p.waitForTimeout(500); reached = await p.evaluate(() => GM.state === 'failed'); }
  const why = await p.evaluate(() => GM.state + ':' + GM.reason);
  ok(reached && await provider(p) === 'placeholder', `invalid key: falls back to the placeholder (${why})`);
  await p.evaluate(() => document.querySelector('#device .map-pin').click()); await p.waitForTimeout(300);
  ok(!!(await st(p)).sel, 'invalid key: markers still selectable');
  await p.close();

  // ---- 4. Google path (test double) ----
  p = await page(STUB + '\nwindow.S4_CONFIG = { googleMapsApiKey: "TEST-STUB" };');
  await openMap(p); await p.waitForTimeout(300);
  ok(await provider(p) === 'google' && await p.evaluate(() => !!document.querySelector('#device .gmap-slot .gmap-host[data-gmap-stub]')), 'Google map renders inside the existing map area');
  const opts = await p.evaluate(() => __gmStub.options[0]);
  ok(opts.disableDefaultUI === true && opts.clickableIcons === false && opts.gestureHandling === 'greedy' && opts.mapId === 'DEMO_MAP_ID', 'Google default UI off: ADS controls stay; DEMO_MAP_ID without a configured Map ID');
  ok(await p.locator(D_ + '.map-ctl [data-a="map-zoom"]').count() === 2 && await p.locator(D_ + '.map-ctl [data-a="map-locate"]').count() === 1, 'ADS zoom and locate controls kept');
  let n = await p.evaluate(() => ({ markers: __gmStub.markers.size, groups: visibleMarkers(selRoute().u.map).length, pins: document.querySelectorAll('#device .gmap-host .map-pin, #device .gmap-host .map-group').length }));
  ok(n.markers === n.groups && n.pins === n.groups && n.groups > 0, `markers for the visible area from the prototype’s station data (${n.groups})`);
  const cam = await p.evaluate(() => ({ c: __gmStub.maps[0].c, z: __gmStub.maps[0].z, m: selRoute().u.map }));
  ok(Math.abs(cam.c.lat - cam.m.lat) < 1e-9 && cam.z === cam.m.z, 'camera follows the existing initial view (most recent station)');
  // highlight, not confirm
  await p.evaluate(() => document.querySelector('#device .gmap-host .map-pin[data-code="WAS"]').click()); await p.waitForTimeout(300);
  s = await st(p); ok(s.sel === 'WAS' && s.from === null && await p.locator(D_ + '.ss-mapcard #map-card').count() === 1, 'marker tap highlights and opens the card; booking unchanged');
  ok(await p.evaluate(() => !!document.querySelector('#device .gmap-host .map-pin.is-selected[data-code="WAS"]')), 'highlighted marker shown on the Google map');
  // pan and zoom never select or change the booking
  await p.evaluate(() => { const m = __gmStub.maps[0]; m._user({ lat: m.c.lat + 0.05, lng: m.c.lng - 0.05 }); }); await p.waitForTimeout(200);
  const s2 = await st(p); ok(Math.abs(s2.lat - s.lat) > 0.01 && s2.sel === 'WAS' && s2.from === null, 'drag: view updates; highlight and booking unchanged');
  await p.evaluate(() => { const m = __gmStub.maps[0]; m._user(m.c, m.z - 1); }); await p.waitForTimeout(200);
  const s3 = await st(p); ok(s3.z === s2.z - 1 && s3.sel === 'WAS' && s3.from === null, 'pinch/wheel zoom: view updates only');
  ok(await p.evaluate(() => (V().analytics || []).some(e => e.ev === 'map_panned' && e.props.provider === 'google') && (V().analytics || []).some(e => e.ev === 'map_zoomed' && e.props.provider === 'google')), 'pan and zoom tracked');
  await p.click(D_ + '[data-a="map-zoom"][data-d="1"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => __gmStub.maps[0].z === selRoute().u.map.z), 'ADS zoom buttons drive the Google camera');
  // another marker replaces the highlight
  await p.evaluate(() => { const e = [...document.querySelectorAll('#device .gmap-host .map-pin')].find(x => x.dataset.code !== 'WAS'); window.__other = e.dataset.code; e.click(); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => selRoute().u.mapSel === window.__other && !!document.querySelector(`#device .gmap-host .map-pin.is-selected[data-code="${window.__other}"]`) && !document.querySelector('#device .gmap-host .map-pin.is-selected[data-code="WAS"]')), 'another marker replaces the highlight');
  // Details, then back: same view and highlight
  const before = await st(p);
  await p.click(D_ + '.ss-mapcard [data-a="map-details"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => sheet().stack.at(-1).s) === 'station-detail', 'Details opens station information');
  await p.click(D_ + '.pane:last-of-type [data-a="back"], ' + D_ + '[data-a="back"]'); await p.waitForTimeout(400);
  const after = await st(p); ok(after.sel === before.sel && after.z === before.z && Math.abs(after.lat - before.lat) < 1e-9 && await provider(p) === 'google' && await p.evaluate(() => !!document.querySelector('#device .gmap-slot .gmap-host')), 'back from Details: same Google map, view and highlight');
  // group list → highlight on the map (sync from the card's list)
  await openMap(p, 'new'); await p.waitForTimeout(300);
  const grp = await p.evaluate(() => { const g = document.querySelector('#device .gmap-host .map-group'); if (!g) return null; g.click(); return g.dataset.codes.split(','); }); await p.waitForTimeout(300);
  if (grp) {
    ok(await p.evaluate(c => selRoute().u.mapGroup && selRoute().u.mapGroup.join() === c.join() && __gmStub.maps[0].z === selRoute().u.map.z, grp), 'group marker: zooms in and lists the stations');
    await p.click(`${D_}.ss-mapcard [data-a="map-pin"][data-code="${grp[0]}"]`); await p.waitForTimeout(300);
    ok(await p.evaluate(c => selRoute().u.mapSel === c && !!document.querySelector(`#device .gmap-host .map-pin.is-selected[data-code="${c}"]`), grp[0]), 'choosing from the card list highlights that marker on the map');
  } else ok(false, 'expected a group marker in the predefined view');
  // confirm from the card, reopen from To
  await p.click(D_ + '[data-k="map-select"]'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => sheet().stack.length === 2 && sheet().stack[1].p.field === 'to' && !!D().booking.from && !D().booking.to), 'Select fills only the field being edited and stays open for To');
  await p.click(D_ + '.ss-head__back'); await p.waitForTimeout(400);
  await p.click(D_ + '#ff-to'); await p.waitForTimeout(300); await p.click(D_ + '#ss-tab-map'); await p.waitForTimeout(400);
  ok(await provider(p) === 'google' && await p.evaluate(() => !!document.querySelector('#device .gmap-slot .gmap-host') && !selRoute().u.mapSel && __gmStub.maps.length === 1), 'reopening: same Google map instance, nothing highlighted');
  await p.click(D_ + '#ss-tab-list'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => __gmStub.markers.size === 0 && !!document.querySelector('#device #ss-q')), 'List view: map markers removed, search back');
  await p.click(D_ + '.ss-head__back'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => sheet().stack.length === 1 && !D().booking.to), 'back out: To unchanged');
  // Map tiles simulated as failing still uses the existing failure state
  await openMap(p); await p.evaluate(() => { loc().map = 'fail'; render(); }); await p.waitForTimeout(200);
  ok(/The map couldn’t load/.test(await p.evaluate(() => document.querySelector('#device').innerText)), 'Location › Map › Fails to load: existing failure state kept');
  ok(!p.errs.length, 'no page errors (Google path) ' + p.errs.join(' | '));
  await p.close();

  // ---- 5. Missing or invalid coordinates (mock fixtures) ----
  p = await page(STUB + '\nwindow.S4_CONFIG = { googleMapsApiKey: "TEST-STUB" };');
  await p.evaluate(mock => { for (const m of mock) { const row = [m.code, m.city, m.state, m.st, m.name, '', m.zip]; STATIONS.push({ code: m.code, city: m.city, state: m.state, st: m.st, name: m.name, aliases: [], zip: m.zip }); ST[m.code] = STATIONS[STATIONS.length - 1]; if (m.geo) STATION_GEO[m.code] = m.geo; } }, MOCK);
  ok(await p.evaluate(() => geoIssues().sort().join()) === 'ZBD,ZNO,ZZE', 'missing, out-of-range and 0,0 coordinates flagged');
  await p.evaluate(() => { TB.v = 1; VS[1] = makeVS('returning'); goLoc('stations:from'); }); await p.waitForTimeout(300); await p.click(D_ + '#ss-tab-map'); await p.waitForTimeout(300);
  await p.evaluate(() => { const r = selRoute(); Object.assign(r.u.map, { lat: 40.2, lon: -76.7, z: 8 }); render(); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!document.querySelector('#device .gmap-host .map-pin[data-code="ZVA"], #device .gmap-host .map-group[data-codes*="ZVA"]') && !document.querySelector('#device .gmap-host [data-code="ZNO"], #device .gmap-host [data-code="ZBD"], #device .gmap-host [data-code="ZZE"]')), 'valid mock station on the map; invalid ones left off');
  ok(/Not on the map \(missing or invalid coordinates\): ZNO, ZBD, ZZE|Not on the map \(missing or invalid coordinates\): .*ZNO/.test(await p.evaluate(() => document.querySelector('#notes').innerText)), 'reviewer note lists them');
  await p.click(D_ + '#ss-tab-list'); await p.fill(D_ + '#ss-q', 'Nowhere'); await p.waitForTimeout(250);
  ok(await p.locator(D_ + '[data-a="choose-station"][data-code="ZNO"]').count() === 1, 'a station without coordinates is still found in search');
  await p.close();
  console.log('pass', pass, 'fail', fail); await b.close();
})();
