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
    ok(await p.locator(D_ + '[data-a="ss-view"]').count() === 2 && await p.locator(D_ + '[data-a="near-start"]').count() === 0, `${T} List and Map views; no Nearby stations link`);
    await p.fill(D_ + '#ss-q', 'PHL'); await w(150); await click('[data-a="choose-station"][data-code="PHL"]');
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.from === 'PHL' && D().booking.to === 'WAS'), `${T} Departure changed; Arrival kept; back on New booking at once`);
    // ---- Arrival via the map (no permission request just for opening it) ----
    await click('#ff-to'); await mapView();
    ok(await ev(() => !nav().native) && await p.locator(D_ + '.ss-map').count() === 1, `${T} opening Map does not ask for location`);
    ok(await ev(() => sheet().stack.at(-1).u.map.why) === 'recent', `${T} without location the map starts on the recent station (proposal)`);
    const n0 = await p.locator(D_ + '.map-pin, ' + D_ + '.map-group').count(); ok(n0 > 0, `${T} markers for the visible area (${n0})`);
    // marker → info → another marker replaces it
    await ev(() => document.querySelector('#device .map-pin').click()); await w(250); const first = await ev(() => sheet().stack.at(-1).u.mapSel);
    ok(first && await p.locator(D_ + `.map-pin.is-selected[data-code="${first}"][aria-pressed="true"]`).count() === 1 && /Washington|,/.test(await p.locator(D_ + '#map-card-t').innerText()), `${T} selected marker: pressed state, tinted badge, and the listing names it (not colour alone)`);
    ok(await p.locator(D_ + '#map-card.map-listing').count() === 1 && await p.locator(D_ + '#map-card [data-a="map-details"]').count() === 1 && await p.locator(D_ + '#map-card [data-a="fav"]').count() === 1 && await p.locator(D_ + '.pane__foot [data-k="map-select"]').count() === 1, `${T} station listing with info and save, Select in the footer`);
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
    // open the group holding Back Bay (with more stations, a wide group can open into smaller ones)
    for (let i = 0; i < 4 && !(await p.locator(D_ + '#map-card [data-a="map-pin"][data-code="BBY"]').count()); i++) { await ev(() => { const g = [...document.querySelectorAll('#device .map-group, #device #map-card [data-a="map-group"]')].find(x => (x.dataset.codes || '').split(',').includes('BBY')); if (g) g.click(); }); await w(250); }
    ok(/stations here/.test(await txt()) && await p.locator(D_ + '#map-card [data-a="map-pin"]').count() >= 2, `${T} the group zooms in and lists each station`);
    await click('#map-card [data-a="map-pin"][data-code="BBY"]'); ok(await ev(() => sheet().stack.at(-1).u.mapSel) === 'BBY', `${T} a station in the group can be chosen`);
    // Details and back: position, zoom and selection kept
    const keep = await ev(() => JSON.stringify(sheet().stack.at(-1).u.map));
    await click('#map-card [data-a="map-details"]'); ok((await stack()).endsWith('station-detail') && /Parking/.test(await txt()), `${T} Details shows station information, including parking`);
    await click('.psheet [data-a="back"]'); await w(300);
    ok((await stack()).endsWith('stations') && await ev(() => JSON.stringify(sheet().stack.at(-1).u.map)) === keep && await ev(() => sheet().stack.at(-1).u.mapSel) === 'BBY', `${T} back from Details keeps position, zoom and selected marker`);
    await click('[data-k="map-select"]');
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.to === 'BBY' && D().booking.from === 'PHL'), `${T} map, both set: Select commits Arrival only and returns to New booking`);
    ok((await evs()).includes('map_station_selected'), `${T} analytics: map selection`);
    // switch back to List
    await click('#ff-to'); await mapView(); await click('[data-a="ss-view"][data-v="list"]'); ok(await p.locator(D_ + '.ss-map').count() === 0 && await p.locator(D_ + '[data-a="near-start"]').count() === 0 && await p.locator(D_ + '#ss-q').count() === 1, `${T} switch back to List view`);
    // close without choosing keeps the fields
    await p.locator(D_ + '.ss-head__back, ' + D_ + '.psheet [data-a="back"]').first().click(); await w(300);
    ok(await stack() === 'booking:ff' && await ev(() => D().booking.to === 'BBY'), `${T} backing out keeps the field`);
    ok((await evs()).some(e => /abandoned/.test(e)), `${T} analytics: abandonment recorded`);

    // ---- Nearby stations: permission drives the list (no "Nearby stations" link) ----
    await go(v, 'returning', 'stations:from'); await w(300);
    ok(await p.locator(D_ + '[data-a="near-start"]').count() === 0 && await p.locator(D_ + '.ss-nearlist, ' + D_ + '#near-msg').count() === 0 && await ev(() => !nav().native), `${T} not asked yet: the default view, no link, no prompt, no alert`);
    for (const P of ['ios', 'android']) {
      await go(v, 'returning', 'stations:from', { platform: P, perm: 'precise' }); await w(1700);
      const rows = await ev(() => [...document.querySelectorAll('#device .ss-nearlist .ads-stationrow__select')].map(b => +b.dataset.mi));
      ok(await ev(() => !nav().native) && rows.length >= 3 && rows.every((x, i) => i === 0 || rows[i - 1] <= x) && rows[0] < 20, `${T} ${P}: allowed: nearby stations show by default, closest first, within 20 miles (${rows.join(', ')})`);
      ok(/within 20 mi/.test(await txt()) && /0\.7 mi/.test(await txt()), `${T} ${P}: distance shown with the radius`);
      ok(await ev(() => document.querySelector('#device .ss-nearlist').compareDocumentPosition(document.querySelector('#device .stsection:not(.ss-nearlist)')) & 4), `${T} ${P}: Near you comes before Saved`);
    }
    ok(await p.locator(D_ + '.ss-nearlist .ads-stationrow__select').first().evaluate(e => /miles away/.test(e.textContent)), `${T} distance has a spoken label`);
    await click('.ss-nearlist .ads-stationrow__select'); ok(await ev(() => D().booking.from === 'NYP' && sheet().stack.at(-1).p.field === 'to'), `${T} a nearby result fills Departure; the selector moves on to To`);
    ok(await p.locator(D_ + '.ss-nearlist').count() === 1 && await ev(() => sheet().stack.at(-1).u.near.st) === 'results', `${T} found once per session: shown straight away for To`);
    await click('.ss-head__back');
    ok((await evs()).includes('nearby_station_selected'), `${T} analytics: nearby selection with distance`);
    // approximate, allow once
    await go(v, 'returning', 'stations:from', { perm: 'approx' }); await w(1700);
    ok(await ev(() => !nav().native) && /approximate/.test(await txt()) && /About/.test(await txt()), `${T} approximate permission: estimates labelled`);
    await go(v, 'returning', 'stations:from', { perm: 'once' }); await w(1700); ok(/Near you/.test(await txt()), `${T} allowed once: nearby stations show`);
    // expansion rule
    await go(v, 'returning', 'stations:from', { perm: 'precise', place: 'statecollege' }); await w(1700);
    ok(/within 40 mi/.test(await txt()) && await ev(() => sheet().stack.at(-1).u.near.radius) === 40, `${T} widens by 20 miles until a station is found (40 mi: Altoona from State College)`);
    // denied: a dismissible alert with Open settings
    const rec = async (L, key) => { await go(v, 'returning', 'stations:from', L); await w(1700); return ev(k => !!document.querySelector(`#device #near-msg[data-k="${k}"]`), key); };
    ok(await rec({ perm: 'denied' }, 'denied') && await ev(() => !nav().native) && /Location isn’t enabled/.test(await txt()) && /You can still search by name or browse the map/.test(await txt()), `${T} denied: “Location isn’t enabled” alert on opening, no prompt`);
    ok(await p.locator(D_ + '#near-msg [data-a="open-settings"]').innerText() === 'Open settings' && await p.locator(D_ + '#near-msg [data-a="loc-alert-dismiss"]').count() === 1 && await ev(() => document.querySelector('#device #near-msg').closest('.ss-top') !== null), `${T} denied: Open settings link and a dismiss button, under the search field`);
    await click('#near-msg [data-a="loc-alert-dismiss"]');
    ok(await p.locator(D_ + '#near-msg').count() === 0 && await ev(() => document.activeElement.id) === 'ss-q' && await p.locator(D_ + '.stsection').count() >= 1, `${T} dismissed: the default view; focus moves to the search field`);
    await click('.ss-head__back'); await click('#ff-from'); await w(300);
    ok(await p.locator(D_ + '#near-msg').count() === 0, `${T} dismissed: stays dismissed for the session`);
    await rec({ perm: 'denied', platform: 'ios' }, 'denied'); await click('#near-msg [data-a="open-settings"]');
    ok(await ev(() => [...document.querySelectorAll('#device .native--prefs button')].map(b => b.textContent).join('|')) === 'Always|Only While Using the App|Never' && /Amtrak Location Preferences/.test(await txt()), `${T} Open settings: the app’s location preferences (simulated)`);
    await click('.native [data-v="keep"]');
    ok(await p.locator(D_ + '.native').count() === 0 && await p.locator(D_ + '#near-msg').count() === 0 && await p.locator(D_ + '.ss-nearlist').count() === 0, `${T} still denied (Never): the default view, without the alert`);
    await rec({ perm: 'denied', platform: 'ios' }, 'denied'); await click('#near-msg [data-a="open-settings"]'); await click('.native button:nth-of-type(2)'); await w(1700);
    ok(/Near you/.test(await txt()) && await p.locator(D_ + '#near-msg').count() === 0, `${T} allowed in settings: nearby stations show`);
    await rec({ perm: 'denied', platform: 'android' }, 'denied'); await click('#near-msg [data-a="open-settings"]');
    ok(await p.locator(D_ + '.native--settings.native--android').count() === 1, `${T} Android: Open settings shows the app’s location settings (simulated)`);
    await click('.native [data-v="precise"]'); await w(1700); ok(/Near you/.test(await txt()), `${T} Android: allowing in settings shows nearby stations`);
    // other states when location is allowed
    ok(await rec({ perm: 'precise', device: 'off' }, 'services-off'), `${T} Location Services off: guidance and Settings`);
    ok(await rec({ perm: 'precise', device: 'fail' }, 'unavailable') && await p.locator(D_ + '#near-msg [data-a="near-start"]').count() === 1, `${T} location unavailable: Retry`);
    ok(await rec({ perm: 'precise', data: 'fail' }, 'data') && await p.locator(D_ + '#near-msg [data-a="near-start"]').count() === 1, `${T} nearby data fails: Retry`);
    ok(await rec({ perm: 'precise', place: 'yellowstone' }, 'none'), `${T} no stations within 150 miles`);
    await click('#near-msg [data-a="near-explore"]'); ok(await p.locator(D_ + '.ss-map').count() === 1, `${T} Explore map from no results`);
    for (const k of [['denied', { perm: 'denied' }], ['services-off', { perm: 'precise', device: 'off' }], ['data', { perm: 'precise', data: 'fail' }]]) {
      await rec(k[1], k[0]); ok(await p.locator(D_ + '#ss-q').count() === 1 && await p.locator(D_ + '.stlist').count() >= 1, `${T} ${k[0]}: typed search and the list stay available`);
    }
    // offline: displayed station still selectable; a new nearby search needs a connection
    await go(v, 'returning', 'stations:from', { perm: 'precise' }); await w(1700);
    await ev(() => { V().net = 'offline'; render(); });
    await click('.ss-nearlist .ads-stationrow__select'); ok(await ev(() => D().booking.from === 'NYP'), `${T} offline: a station already shown can still be chosen`);
    await go(v, 'returning', 'stations:from', { perm: 'precise' }, 'iphone', "V().net = 'offline';"); await w(300);
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
    ok(!(await stack()) && await ev(() => D().ts.from === 'BAL' && !D().booking.from) && /Baltimore, MD · BAL/.test(await ev(() => document.querySelector('#device #ts-from').innerText)), `${T} Train status: the station shows on the search entry; the booking is untouched`);
    ok(await p.locator(D_ + '#ts-to, [data-a="ts-check"], #tsn').count() === 0 && /Arrivals and departures/.test(await ev(() => document.querySelector('#device').innerText)), `${T} Train status: one station search entry, no From/To, Check status or train number`);
    await click('#ts-from'); ok(await ev(() => document.querySelector('#device .ss-head__title').textContent) === 'Select station' && await ev(() => document.querySelector('#device #ss-q').placeholder) === 'Search stations' && await p.locator(D_ + '.ss-group').count() === 0, `${T} Train status: selector says Select station, with no From / To group`);
    await mapView(); await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 38.9, lon: -77.0, z: 9 }; render(); }); await click('.map-pin[data-code="WAS"]'); await click('[data-k="map-select"]');
    ok(await ev(() => D().ts.from === 'WAS'), `${T} Train status: station changed from the map`);
    await go(v, 'returning', 'tab:book'); await click('[data-a="bk-passes"]'); ok(await stack() === 'mr:multiride', `${T} Book › Passes opens Multi-Ride`);
    await click('#mr-to'); await p.fill(D_ + '#ss-q', 'NHV'); await w(150); await click('[data-a="choose-station"][data-code="NHV"]');
    ok(await ev(() => D().mr.to === 'NHV' && !D().mr.from && !D().booking.to && sheet().stack.at(-1).p.field === 'from'), `${T} Multi-Ride: To set there only; the selector moves on to From`);
    await p.fill(D_ + '#ss-q', 'BOS'); await w(150); await click('[data-a="choose-station"][data-code="BOS"]');
    ok(await stack() === 'mr:multiride' && await ev(() => D().mr.from === 'BOS' && D().mr.to === 'NHV'), `${T} Multi-Ride: both set, back to Multi-Ride`);
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
