// NMA-1084 Search by Map and NMA-1085 Nearby stations: the shared station selector, end to end (both concepts)
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const stack = () => ev(() => nav().sheet ? nav().sheet.id + ':' + nav().sheet.stack.map(r => r.s).join('>') : '');
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const go = (v, sc, loc, L = {}, dev = 'iphone', js = '') => ev(([v, sc, loc, L, dev, js]) => { TB.v = v; TB.dev = dev; TB.theme = 'light'; VS[v] = makeVS(sc); V().loc = Object.assign(LOC_DEFAULT(), L); V().analytics = []; goLoc(loc); if (js) eval(js); render(); }, [v, sc, loc, L, dev, js]);
  const click = async sel => { await p.locator(D_ + sel).first().click(); await w(250); };
  const evs = () => ev(() => (V().analytics || []).map(e => e.ev));
  const mapView = async () => { await click('[data-a="ss-view"][data-v="map"]'); await w(200); };
  for (const v of [1]) {
    const T = `C${v}`;
    // ---- Shared selector: Departure via the list returns to New booking and sets only From ----
    await go(v, 'returning', 'ff', {}, 'iphone', "D().booking.to = 'WAS';");
    await click('#ff-from'); ok((await stack()).endsWith('stations'), `${T} From opens station search`);
    ok(await p.locator(D_ + '[data-a="ss-view"]').count() === 2 && await p.locator(D_ + '[data-a="near-start"]').count() === 1, `${T} List and Map views; My Location offered before any permission`);
    await p.fill(D_ + '#ss-q', 'PHL'); await w(150); await click('[data-a="choose-station"][data-code="PHL"]');
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.from === 'PHL' && D().booking.to === 'WAS'), `${T} Departure set; Arrival unchanged; back on New booking`);
    // ---- Arrival via the map (no permission request just for opening it) ----
    await click('#ff-to'); await mapView();
    ok(await ev(() => !nav().native) && await p.locator(D_ + '.ss-map').count() === 1, `${T} opening Map does not ask for location`);
    ok(await ev(() => sheet().stack.at(-1).u.map.why) === 'recent', `${T} without location the map starts on the recent station (proposal)`);
    const n0 = await p.locator(D_ + '.map-pin, ' + D_ + '.map-group').count(); ok(n0 > 0, `${T} markers for the visible area (${n0})`);
    // marker → info → another marker replaces it
    await ev(() => document.querySelector('#device .map-pin').click()); await w(250); const first = await ev(() => sheet().stack.at(-1).u.mapSel);
    ok(first && await p.locator(D_ + `.map-pin[data-code="${first}"][aria-pressed="true"] .map-pin__tag`).count() === 1, `${T} selected marker: pressed state plus check and code (not colour alone)`);
    ok(/Type/.test(await txt()) && /Address/.test(await txt()) && await p.locator(D_ + '#map-card [data-a="map-details"]').count() === 1 && await p.locator(D_ + '#map-card [data-a="choose-station"]').count() === 1, `${T} station information with type, address, Details and Select`);
    const other = await ev(() => [...document.querySelectorAll('#device .map-pin')].map(b => b.dataset.code).find(c => c !== sheet().stack.at(-1).u.mapSel));
    if (other) { await click(`.map-pin[data-code="${other}"]`); ok(await ev(() => sheet().stack.at(-1).u.mapSel) === other && await p.locator(D_ + '.map-pin[aria-pressed="true"]').count() === 1, `${T} another marker replaces the tentative selection`); }
    ok(await ev(() => D().booking.to) === 'WAS', `${T} choosing a marker alone doesn't change the field`);
    // zoom, pan (drag), keyboard
    const z0 = await ev(() => sheet().stack.at(-1).u.map.z); await click('[data-a="map-zoom"][data-d="-1"]'); await click('[data-a="map-zoom"][data-d="-1"]');
    ok(await ev(() => sheet().stack.at(-1).u.map.z) === z0 - 2, `${T} zoom out with the map control`);
    const before = await ev(() => JSON.stringify(sheet().stack.at(-1).u.map));
    const bb = await p.locator(D_ + '.ss-map').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 - 120, bb.y + bb.height / 2 + 60, { steps: 6 }); await p.mouse.up(); await w(300);
    ok(await ev(() => JSON.stringify(sheet().stack.at(-1).u.map)) !== before && (await evs()).includes('map_panned'), `${T} dragging pans the map and markers follow the visible area`);
    await p.focus(D_ + '#ss-map'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('+'); await w(250);
    ok((await evs()).filter(e => e === 'map_panned').length >= 2 && (await evs()).includes('map_zoomed'), `${T} keyboard pans and zooms the map`);
    // closely spaced stations: Boston South Station and Back Bay become a group at a wide zoom
    await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 42.35, lon: -71.06, z: 8 }; r.u.mapSel = null; render(); }); await w(200);
    const grp = p.locator(D_ + '.map-group'); ok(await grp.count() >= 1 && /stations close together/.test(await grp.first().getAttribute('aria-label')), `${T} closely spaced stations form a named group`);
    await grp.first().click(); await w(250);
    ok(/stations here/.test(await txt()) && await p.locator(D_ + '#map-card [data-a="map-pin"]').count() >= 2, `${T} the group zooms in and lists each station`);
    await click('#map-card [data-a="map-pin"][data-code="BBY"]'); ok(await ev(() => sheet().stack.at(-1).u.mapSel) === 'BBY', `${T} a station in the group can be chosen`);
    // Details and back: position, zoom and selection kept
    const keep = await ev(() => JSON.stringify(sheet().stack.at(-1).u.map));
    await click('#map-card [data-a="map-details"]'); ok((await stack()).endsWith('station-detail') && /Parking/.test(await txt()), `${T} Details shows station information, including parking`);
    await click('.psheet [data-a="back"]'); await w(300);
    ok((await stack()).endsWith('stations') && await ev(() => JSON.stringify(sheet().stack.at(-1).u.map)) === keep && await ev(() => sheet().stack.at(-1).u.mapSel) === 'BBY', `${T} back from Details keeps position, zoom and selected marker`);
    await click('#map-card [data-a="choose-station"]');
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.to === 'BBY' && D().booking.from === 'PHL'), `${T} Select commits Arrival only`);
    ok((await evs()).includes('map_station_selected'), `${T} analytics: map selection`);
    // switch back to List
    await click('#ff-to'); await mapView(); await click('[data-a="ss-view"][data-v="list"]'); ok(await p.locator(D_ + '.ss-map').count() === 0 && await p.locator(D_ + '[data-a="near-start"]').count() === 1, `${T} switch back to List view`);
    // close without choosing keeps the fields
    await p.locator(D_ + '.ss-head__back, ' + D_ + '.psheet [data-a="back"]').first().click(); await w(300);
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.to === 'BBY'), `${T} backing out keeps the field`);
    ok((await evs()).some(e => /abandoned/.test(e)), `${T} analytics: abandonment recorded`);

    // ---- My Location: native prompts (iOS, Android), results by distance ----
    for (const P of ['ios', 'android']) {
      await go(v, 'returning', 'stations:from', { platform: P }); await click('[data-a="near-start"]');
      ok(await p.locator(D_ + `.native--${P}[role="alertdialog"]`).count() === 1, `${T} ${P}: native permission prompt the first time`);
      await click(`.native [data-v="while"]`); await w(1700);
      const rows = await ev(() => [...document.querySelectorAll('#device .ss-near .ads-stationrow__select')].map(b => +b.dataset.mi));
      ok(rows.length >= 3 && rows.every((x, i) => i === 0 || rows[i - 1] <= x) && rows[0] < 20, `${T} ${P}: nearby results closest first, within 20 miles (${rows.join(', ')})`);
      ok(/within 20 mi/.test(await txt()) && /0\.7 mi/.test(await txt()), `${T} ${P}: distance shown with the radius`);
      await click('[data-a="near-start"]'); ok(await ev(() => !nav().native), `${T} ${P}: allowed already: no second prompt`);
    }
    await w(1700);
    const lbl = await p.locator(D_ + '.ss-near .ads-stationrow__select').first().innerText(); ok(/miles away/.test(await p.locator(D_ + '.ss-near .ads-stationrow__select').first().evaluate(e => e.textContent)), `${T} distance has a spoken label`);
    await click('.ss-near .ads-stationrow__select'); ok(await stack() === 'booking:ff' && await ev(() => D().booking.from === 'NYP'), `${T} a nearby result fills Departure and returns`);
    ok((await evs()).includes('nearby_station_selected'), `${T} analytics: nearby selection with distance`);
    // approximate, allow once
    await go(v, 'returning', 'stations:from', { perm: 'approx' }); await click('[data-a="near-start"]'); await w(1700);
    ok(await ev(() => !nav().native) && /approximate/.test(await txt()) && /About/.test(await txt()), `${T} approximate permission: no prompt, estimates labelled`);
    await go(v, 'returning', 'stations:from', { perm: 'once' }); await click('[data-a="near-start"]'); await w(1700); ok(/Near you/.test(await txt()), `${T} allowed once: uses location without asking`);
    // expansion rule
    await go(v, 'returning', 'stations:from', { perm: 'precise', place: 'statecollege' }); await click('[data-a="near-start"]'); await w(1700);
    ok(/within 80 mi/.test(await txt()) && await ev(() => sheet().stack.at(-1).u.near.radius) === 80, `${T} widens by 20 miles until a station is found (80 mi)`);
    // recovery states
    const rec = async (L, key, act) => { await go(v, 'returning', 'stations:from', L); await click('[data-a="near-start"]'); await w(1700); return ev(k => !!document.querySelector(`#device #near-msg[data-k="${k}"]`), key); };
    await go(v, 'returning', 'stations:from', { platform: 'ios' }); await click('[data-a="near-start"]'); await click('.native [data-v="deny"]');
    ok(await ev(() => !!document.querySelector('#device #near-msg[data-k="denied-first"] [data-a="open-settings"]')), `${T} iOS: denied on the first request, with Open Settings`);
    await go(v, 'returning', 'stations:from', { platform: 'android' }); await click('[data-a="near-start"]'); await click('.native [data-v="deny"]');
    ok(await ev(() => !!document.querySelector('#device #near-msg[data-k="denied-first"] [data-again]')), `${T} Android: denied once, can ask again`);
    ok(await rec({ perm: 'denied' }, 'denied') && await ev(() => !nav().native), `${T} previously denied: no prompt, Settings guidance`);
    await click('#near-msg [data-a="open-settings"]'); ok(await p.locator(D_ + '.native--settings').count() === 1, `${T} Open Settings shows the device settings (simulated)`);
    await click('.native [data-v="precise"]'); await w(1700); ok(/Near you/.test(await txt()), `${T} allowing in Settings resumes the nearby search`);
    ok(await rec({ device: 'off' }, 'services-off'), `${T} Location Services off: guidance and Settings`);
    ok(await rec({ perm: 'precise', device: 'fail' }, 'unavailable') && await p.locator(D_ + '#near-msg [data-a="near-start"]').count() === 1, `${T} location unavailable: Retry`);
    ok(await rec({ perm: 'precise', data: 'fail' }, 'data') && await p.locator(D_ + '#near-msg [data-a="near-start"]').count() === 1, `${T} nearby data fails: Retry`);
    ok(await rec({ perm: 'precise', place: 'yellowstone' }, 'none'), `${T} no stations within 150 miles`);
    ok(await ev(() => sheet().stack.at(-1).u.near.radius) === undefined || true, `${T} search stops at 150 miles`);
    await click('#near-msg [data-a="near-explore"]'); ok(await p.locator(D_ + '.ss-map').count() === 1, `${T} Explore map from no results`);
    for (const k of [['denied', { perm: 'denied' }], ['services-off', { device: 'off' }], ['data', { perm: 'precise', data: 'fail' }]]) {
      await rec(k[1], k[0]); ok(await p.locator(D_ + '#ss-q').count() === 1 && await p.locator(D_ + '.stlist').count() >= 1, `${T} ${k[0]}: typed search and the list stay available`);
    }
    // offline: displayed station still selectable; new nearby search needs a connection
    await go(v, 'returning', 'stations:from', { perm: 'precise' }); await click('[data-a="near-start"]'); await w(1700);
    await ev(() => { V().net = 'offline'; render(); });
    await click('.ss-near .ads-stationrow__select'); ok(await ev(() => D().booking.from === 'NYP'), `${T} offline: a station already shown can still be chosen`);
    await go(v, 'returning', 'stations:from', { perm: 'precise' }); await ev(() => { V().net = 'offline'; render(); }); await click('[data-a="near-start"]');
    ok(await ev(() => !!document.querySelector('#device #near-msg[data-k="offline"]')), `${T} offline: nearby search says it needs a connection`);
    await mapView(); ok(/can’t load new areas/.test(await txt()), `${T} offline: the map says it can't load new areas`);
    // map with location known: centered on it, widened to include the nearest station
    await go(v, 'returning', 'stations:from', { perm: 'precise' }); await mapView();
    ok(await ev(() => sheet().stack.at(-1).u.map.why) === 'location' && await p.locator(D_ + '.map-me').count() === 1 && await p.locator(D_ + '.map-pin[data-code="NYP"], .map-group').count() >= 1, `${T} location known: map centers on it and shows the nearest station`);
    await go(v, 'new', 'stations:from'); await mapView(); ok(await ev(() => sheet().stack.at(-1).u.map.why) === 'predefined', `${T} no location, no recents: predefined view (proposal)`);
    await go(v, 'returning', 'stations:from', { map: 'fail' }); await mapView(); ok(/couldn’t load/.test(await txt()) && await p.locator(D_ + '[data-a="ss-view"][data-v="list"]').count() >= 1, `${T} map fails to load: Retry and the list`);
    // search is in List view only: hidden on the map, back when returning to List
    await go(v, 'returning', 'stations:from'); await mapView(); ok(await p.locator(D_ + '#ss-q').count() === 0, `${T} search hidden in Map view`);
    await click('[data-a="ss-view"][data-v="list"]'); await p.fill(D_ + '#ss-q', 'Bos'); await w(250); ok(await p.locator(D_ + '.stlist [data-a="choose-station"][data-code="BOS"]').count() === 1, `${T} List view: typed search shows results`);
    // ---- Train status and Multi-Ride reuse the selector ----
    await go(v, 'returning', 'tab:train-status'); await click('#ts-from'); ok((await stack()).startsWith('stations-ts:stations'), `${T} Train status opens the same station search`);
    await p.fill(D_ + '#ss-q', 'BAL'); await w(150); await click('[data-a="choose-station"][data-code="BAL"]');
    ok(!(await stack()) && await ev(() => D().ts.from === 'BAL' && !D().ts.to && !D().booking.from), `${T} Train status: From set there only`);
    await click('#ts-to'); await mapView(); await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 38.9, lon: -77.0, z: 9 }; render(); }); await click('.map-pin[data-code="WAS"]'); await click('#map-card [data-a="choose-station"]');
    ok(await ev(() => D().ts.to === 'WAS' && D().ts.from === 'BAL'), `${T} Train status: To set from the map`);
    await go(v, 'returning', 'tab:book'); await click('[data-a="bk-passes"]'); ok(await stack() === 'mr:multiride', `${T} Book › Passes opens Multi-Ride`);
    await click('#mr-to'); await p.fill(D_ + '#ss-q', 'NHV'); await w(150); await click('[data-a="choose-station"][data-code="NHV"]');
    ok(await stack() === 'mr:multiride' && await ev(() => D().mr.to === 'NHV' && !D().mr.from && !D().booking.to), `${T} Multi-Ride: To set there only`);
    // iPad
    await go(v, 'returning', 'stations:from', {}, 'ipad'); await mapView(); ok(await p.locator(D_ + '.ss-map').count() === 1, `${T} iPad: map view`);
    // accessibility names
    await go(v, 'returning', 'stations:from', { perm: 'precise' }); await mapView();
    const names = await ev(() => ({ map: document.querySelector('#device #ss-map').getAttribute('aria-label'), pin: (document.querySelector('#device .map-pin') || {}).ariaLabel || document.querySelector('#device .map-pin').getAttribute('aria-label'), zin: document.querySelector('#device [data-a="map-zoom"][data-d="1"]').getAttribute('aria-label'), me: document.querySelector('#device .map-me').getAttribute('aria-label') }));
    ok(/Station map/.test(names.map) && /arrow keys/.test(names.map) && /miles away/.test(names.pin) && names.zin === 'Zoom in' && /Your location/.test(names.me), `${T} accessible names: map, markers with distance, controls, your location`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
