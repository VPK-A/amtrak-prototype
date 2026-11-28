// Station selector: heading with Back above the List / Map tabs, search below the tabs (List view only), no route
// fields, prominent map with floating controls and a floating station card
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.addScriptTag({ content: AXE });
  const q = (f, a) => p.evaluate(f, a), wait = () => p.waitForTimeout(450);
  const axe = async n => { const v = await q(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.map(y => y.target.join(' ')).filter(t => !t.includes('dev-status')).length).filter(x => !x.endsWith(':0'))); ok(!v.length, `axe ${n} ${v.join(',')}`); };
  for (const [dev, theme] of [['iphone', 'light'], ['iphone', 'dark'], ['ipad', 'light']]) {
    await q(([d, t]) => { TB.v = 1; TB.dev = d; TB.theme = t; VS[1] = makeVS('returning'); goLoc('stations:from'); }, [dev, theme]); await wait(); const tag = `${dev}/${theme}`;
    ok(await q(() => !document.querySelector('#tbMapVer')), `${tag} no map version switcher`);
    ok(await q(() => !document.querySelector('#device .ss-route') && !!document.querySelector('#device #ss-q') && !!document.querySelector('#device #ss-tab-map')), `${tag} list: no route fields; search and tabs`);
    await axe(`${tag} updated list`);
    // Order (Figma 3295:51259): heading (+ Back on iPhone) → tabs → From / To group → search → favorites and recents (no Nearby stations link)
    ok(await q(d => { const el = s => document.querySelector('#device ' + s); const pos = s => { const e = el(s); return e ? e.getBoundingClientRect().top : NaN; };
      const head = d === 'iphone' ? pos('.ss-head') : pos('.pane .ads-navbar__title'); const order = [head, pos('.ss-views'), pos('.ss-group'), pos('#ss-q'), pos('.stsection')];
      return order.every((v, i) => !isNaN(v) && (i === 0 || v > order[i - 1])); }, dev), `${tag} order: heading, tabs, From/To, search, favorites`);
    ok(await q(d => { const t = d === 'iphone' ? document.querySelector('#device .ss-head__title') : [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop(); return t && t.textContent.startsWith('Select station') && (d !== 'iphone' || /departure/.test(t.textContent)) && document.querySelector('#device #ss-q').placeholder === 'Search departure stations' && document.querySelector('#device label[for="ss-q"]').textContent === 'Search departure stations' && document.querySelector('#device #ss-f-from').getAttribute('aria-current') === 'true' && (d !== 'iphone' || !!document.querySelector('#device .ss-head__back')); }, dev), `${tag} From: heading, placeholder, Back`);
    ok(await q(d => d !== 'iphone' || getComputedStyle(document.querySelector('#device .ss-head__title')).fontSize === getComputedStyle(document.documentElement).getPropertyValue('--ads-type-body-emphasis-size').trim() || parseFloat(getComputedStyle(document.querySelector('#device .ss-head__title')).fontSize) <= 18, dev), `${tag} heading uses body-emphasis size`);
    ok(await q(() => { const top = document.querySelector('#device .ss-top'); return top && top.contains(document.querySelector('#device .ss-group')) && top.contains(document.querySelector('#device #ss-q')) && !document.querySelector('#device .ss-nearlink') && getComputedStyle(top).borderBottomStyle === 'solid' && !document.querySelector('#device .ss-myloc'); }), `${tag} From/To and search sit together above the lists; no Nearby stations link or My Location row`);
    ok(await q(() => document.querySelector('#device .stsection').getBoundingClientRect().top - document.querySelector('#device .pane__scroll').getBoundingClientRect().top < 480), `${tag} results start high (compact)`);
    await p.click('#device #ss-tab-map'); await wait();
    ok(await q(d => d !== 'iphone' || (!!document.querySelector('#device .ss-head__back') && document.querySelector('#device .ss-head__title').textContent.startsWith('Select station')), dev), `${tag} Map view keeps heading and Back`);
    ok(await q(() => !document.querySelector('#device #ss-q') && !document.querySelector('#device .ss-route') && document.querySelector('#device .ss-map').getBoundingClientRect().height > 600), `${tag} map: no search, no route fields, prominent map`);
    await p.evaluate(() => document.querySelector('#device .map-pin[data-code="WAS"]').click()); await wait();
    ok(await q(() => !!document.querySelector('.ss-mapcard #map-card [data-a="map-details"]') && !!document.querySelector('#device .pane__foot [data-k="map-select"]')), `${tag} floating listing with Details, Select in the footer`);
    await axe(`${tag} updated map + card`);
    await p.click('#device [aria-label="Zoom out"]'); await wait();
    ok(await q(() => !!document.querySelector('#map-card')), `${tag} map interactive with card visible`);
    await p.evaluate(() => { const e = [...document.querySelectorAll('#device .map-pin')].find(x => x.dataset.code !== 'WAS'); window.__c = e.dataset.code; e.click(); }); await wait();
    ok(await q(() => document.querySelector('#map-card-t').textContent.includes(ST[window.__c].city)), `${tag} card updates for another station`);
    // Station listing (Figma 3336:40155): code, city, station; info and save; 20px above the bottom of the map
    ok(await q(() => { const c = document.querySelector('#device #map-card'); return c.querySelector('.map-listing__code').textContent === window.__c && c.querySelectorAll('.map-listing__acts .ads-icon-btn').length === 2 && !c.querySelector('.ss-group'); }), `${tag} station listing: code, city and station; info and save`);
    ok(await q(() => { const c = document.querySelector('#device .ss-mapcard').getBoundingClientRect(), m = document.querySelector('#device .ss-map').getBoundingClientRect(), k = m.width / document.querySelector('#device .ss-map').offsetWidth; return Math.abs(m.bottom - c.bottom - 20 * k) < 2 && Math.abs(m.right - c.right - 20 * k) < 2; }), `${tag} listing sits 20px from the map's bottom and right edges`);
    await p.click('#device [data-k="map-select"]'); await wait();
    const after = await q(() => { const r = sheet().stack.at(-1), b = D().booking; return { s: r.s, view: r.u.view, f: r.p.field, both: !!(b.from && b.to), search: !!document.querySelector('#device #ss-q') }; });
    ok(after.both ? after.s === 'ff' : (after.s === 'stations' && after.view === 'list' && after.f === 'to' && after.search), `${tag} Select on the map: back to the list while To is still needed, otherwise to New booking (${JSON.stringify(after)})`);
    if (after.s === 'ff') { await p.click('#device #ff-from'); await wait(); }
    await p.click('#device #ss-tab-map'); await wait();
    await p.evaluate(() => { const e = [...document.querySelectorAll('#device .map-pin')].find(x => x.dataset.code !== D().booking.from && x.dataset.code !== D().booking.to); window.__d = e.dataset.code; e.click(); }); await wait();
    ok(await q(() => document.querySelector('#device .map-listing__code').textContent === window.__d && document.querySelector('#device [data-k="map-select"]').dataset.code === window.__d), `${tag} a tapped station shows in the listing, with Select for it`);
    await p.focus('#device #ss-map'); await p.keyboard.press('Escape'); await wait();
    ok(await q(() => !document.querySelector('#map-card') && !document.querySelector('#device [data-k="map-select"]') && sheet().stack.at(-1).s === 'stations'), `${tag} Escape clears the listing and Select, and stays on the map`);
    await p.click('#device #ss-tab-list'); await wait();
    ok(await q(() => !!document.querySelector('#device #ss-q')), `${tag} search returns in List view`);
    await q(() => { D().booking.from = null; goLoc('stations:to'); }); await wait(); // From empty: the selector stays for it after To
    ok(await q(d => (d === 'iphone' ? document.querySelector('#device .ss-head__title') : [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop()).textContent.startsWith('Select station') && document.querySelector('#device #ss-q').placeholder === 'Search arrival stations' && document.querySelector('#device label[for="ss-q"]').textContent === 'Search arrival stations' && document.querySelector('#device #ss-f-to').getAttribute('aria-current') === 'true', dev), `${tag} To: heading, placeholder and the To field outlined`);
    await p.click('#device [data-k="st-rec-PHL"]'); await wait();
    ok(await q(() => D().booking.to === 'PHL' && D().booking.from !== 'PHL' && sheet().stack.at(-1).s === 'stations' && sheet().stack.at(-1).p.field === 'from'), `${tag} choosing fills To only, then the selector stays open on From`);
    ok(await q(() => /set as your arrival station\. Now choose your departure station\./.test(document.querySelector('#device .ss-top [role="status"]').textContent) && document.activeElement.id === 'ss-f-from'), `${tag} the move to the other field is announced; focus on that field, not search`);
    await p.click('#device [data-k="st-rec-BOS"]'); await wait();
    ok(await q(() => D().booking.from === 'BOS' && D().booking.to === 'PHL' && sheet().stack.length === 1), `${tag} after both stations, back on New booking`);
    if (dev === 'iphone') { await p.click('#device #ff-from'); await wait(); await p.click('#device .ss-head__back'); await wait(); ok(await q(() => sheet().stack.length === 1 && sheet().stack[0].s === 'ff'), `${tag} Back returns to New booking`); }
  }
  console.log('pass', pass, 'fail', fail); await b.close();
})();
