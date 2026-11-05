// Live Google Maps check for the station map. Needs VITE_GOOGLE_MAPS_API_KEY in the environment (or .env.local):
// starts `vite` (dev server), then checks the real map loads, zoom and pan, markers from the prototype's station
// data, marker tap = highlight only, Select = confirm. Without a key it checks the fallback and says the live part
// was skipped. The key is never printed.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../..'), PORT = 5188;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
const envFile = path.join(ROOT, '.env.local');
const hasKey = !!process.env.VITE_GOOGLE_MAPS_API_KEY || (fs.existsSync(envFile) && /^VITE_GOOGLE_MAPS_API_KEY=\S+/m.test(fs.readFileSync(envFile, 'utf8')));
(async () => {
  const vite = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  const url = `http://localhost:${PORT}/`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(url); if (r.ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 500)); }
  const b = await chromium.launch(); const D_ = '#device ';
  const open = async (keyOverride) => {
    const p = await b.newPage({ viewport: { width: 1600, height: 1300 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.errs = errs;
    if (keyOverride !== undefined) await p.addInitScript(k => { Object.defineProperty(window, 'S4_CONFIG', { configurable: true, get() { return { googleMapsApiKey: k }; }, set() {} }); }, keyOverride);
    await p.goto(url); await p.waitForTimeout(1200);
    await p.evaluate(() => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('returning'); goLoc('stations:from'); }); await p.waitForTimeout(300);
    await p.click(D_ + '#ss-tab-map'); return p;
  };
  const st = p => p.evaluate(() => { const r = selRoute(); return { state: GM.state, reason: GM.reason, provider: (document.querySelector('#device .ss-map') || {}).dataset?.provider, sel: r && r.u.mapSel || null, z: r && r.u.map.z, lat: r && r.u.map.lat, lon: r && r.u.map.lon, from: D().booking.from }; });
  // ---- Fallback: no key ----
  let p = await open('');
  await p.waitForTimeout(500); let s = await st(p);
  ok(s.provider === 'placeholder' && s.reason === 'no-key', 'no key: placeholder map, existing path');
  await p.evaluate(() => document.querySelector('#device .map-pin').click()); await p.waitForTimeout(300);
  s = await st(p); ok(!!s.sel && !s.from, 'no key: marker highlights, field unchanged');
  await p.close();
  // ---- Live ----
  if (!hasKey) { console.log('SKIP live Google Maps: VITE_GOOGLE_MAPS_API_KEY is not set (environment or .env.local)'); }
  else {
    p = await open();
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const x = await st(p); if (x.state === 'ready' || x.state === 'failed') break; }
    s = await st(p);
    ok(s.state === 'ready' && s.provider === 'google', `Google Maps loaded (${s.state}${s.reason ? ': ' + s.reason : ''})`);
    if (s.state === 'ready') {
      await p.waitForTimeout(2500);
      const tiles = await p.evaluate(() => { const h = document.querySelector('#device .gmap-host'); return h ? h.querySelectorAll('img, canvas').length : 0; });
      ok(tiles > 0, `map tiles drawn (${tiles} images or canvases)`);
      const mk = await p.evaluate(() => ({ dom: document.querySelectorAll('#device .gmap-host .map-pin, #device .gmap-host .map-group').length, expected: visibleMarkers(selRoute().u.map).length, codes: [...document.querySelectorAll('#device .gmap-host .map-pin')].map(e => e.dataset.code) }));
      ok(mk.dom > 0 && mk.dom === mk.expected && mk.codes.every(c => STATIONS.some(x => x.code === c)), `markers from the prototype's station data (${mk.dom}: ${mk.codes.slice(0, 6).join(', ')}…)`);
      const z0 = (await st(p)).z; await p.click(D_ + '[data-a="map-zoom"][data-d="1"]'); await p.waitForTimeout(1500);
      ok((await st(p)).z === z0 + 1 && await p.evaluate(() => GM.map.getZoom() === selRoute().u.map.z), 'zoom in with the ADS button moves the Google camera');
      const box = await p.locator(D_ + '.ss-map').boundingBox(), before = await st(p);
      await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(2000);
      const after = await st(p); ok((Math.abs(after.lat - before.lat) > 1e-4 || Math.abs(after.lon - before.lon) > 1e-4) && after.sel === before.sel && !after.from, 'drag pans the map; nothing selected, booking unchanged');
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.wheel(0, 400); await p.waitForTimeout(2000);
      const wz = await st(p); ok(wz.z !== after.z && !wz.sel && !wz.from, 'wheel zooms the map; nothing selected');
      await p.evaluate(() => { const r = selRoute(); const g = geoOf('WAS'); Object.assign(r.u.map, { lat: g.lat, lon: g.lon, z: 11 }); render(); }); await p.waitForTimeout(2000);
      await p.locator(D_ + '.gmap-host .map-pin[data-code="WAS"]').click(); await p.waitForTimeout(600);
      s = await st(p); ok(s.sel === 'WAS' && !s.from && await p.locator(D_ + '.ss-mapcard #map-card').count() === 1, 'tapping a Google marker highlights it and opens the card; field unchanged');
      ok(await p.locator(D_ + '.gmap-host .map-pin.is-selected[data-code="WAS"]').count() === 1, 'highlighted marker shown on the Google map');
      await p.click(D_ + '.ss-mapcard [data-a="choose-station"]'); await p.waitForTimeout(600);
      ok(await p.evaluate(() => D().booking.from === 'WAS' && sheet().stack.length === 1), 'Select confirms: From is WAS and New booking returns');
      ok(!p.errs.length, 'no page errors ' + p.errs.join(' | '));
      await p.click(D_ + '#ff-to'); await p.waitForTimeout(400); await p.click(D_ + '#ss-tab-map'); await p.waitForTimeout(2500);
      await p.locator('#device').screenshot({ path: path.join(ROOT, 'test-results', 'googlemap-live.png') }).catch(() => {});
    }
    await p.close();
  }
  console.log('pass', pass, 'fail', fail); await b.close(); vite.kill();
})();
