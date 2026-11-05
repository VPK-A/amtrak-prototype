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
    // Order: heading (+ Back on iPhone) → tabs → search → My Location → favorites and recents
    ok(await q(d => { const el = s => document.querySelector('#device ' + s); const pos = s => { const e = el(s); return e ? e.getBoundingClientRect().top : NaN; };
      const head = d === 'iphone' ? pos('.ss-head') : pos('.pane .ads-navbar__title'); const order = [head, pos('.ss-views'), pos('#ss-q'), pos('.ss-myloc'), pos('.stsection')];
      return order.every((v, i) => !isNaN(v) && (i === 0 || v > order[i - 1])); }, dev), `${tag} order: heading, tabs, search, My Location, favorites`);
    ok(await q(d => { const t = d === 'iphone' ? document.querySelector('#device .ss-head__title') : [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop(); return t && t.textContent === 'Select departure station' && document.querySelector('#device #ss-q').placeholder === 'Search departure stations' && (d !== 'iphone' || !!document.querySelector('#device .ss-head__back')); }, dev), `${tag} From: heading, placeholder, Back`);
    ok(await q(d => d !== 'iphone' || getComputedStyle(document.querySelector('#device .ss-head__title')).fontSize === getComputedStyle(document.documentElement).getPropertyValue('--ads-type-body-emphasis-size').trim() || parseFloat(getComputedStyle(document.querySelector('#device .ss-head__title')).fontSize) <= 18, dev), `${tag} heading uses body-emphasis size`);
    ok(await q(() => { const t = s => document.querySelector('#device ' + s).getBoundingClientRect(); const g1 = t('.ss-views').top - t('.ss-head, .ss-views').top, g2 = t('#ss-q').closest ? 0 : 0; const a = t('.ss-views').bottom, b = t('.ss-search--upd').top, c = t('.ss-search--upd').bottom, e = t('.ss-myloc').top, f = t('.ss-near').bottom, h = t('.stsection').top; return Math.abs((b - a) - 12) < 1.5 && Math.abs((e - c) - 12) < 1.5 && Math.abs((h - f) - 12) < 1.5; }), `${tag} 12 px rhythm: tabs, search, My Location, lists`);
    ok(await q(() => document.querySelector('#device .stsection').getBoundingClientRect().top - document.querySelector('#device .pane__scroll').getBoundingClientRect().top < 330), `${tag} results start high (compact)`);
    await p.click('#device #ss-tab-map'); await wait();
    ok(await q(d => d !== 'iphone' || (!!document.querySelector('#device .ss-head__back') && document.querySelector('#device .ss-head__title').textContent === 'Select departure station'), dev), `${tag} Map view keeps heading and Back`);
    ok(await q(() => !document.querySelector('#device #ss-q') && !document.querySelector('#device .ss-route') && document.querySelector('#device .ss-map').getBoundingClientRect().height > 600), `${tag} map: no search, no route fields, prominent map`);
    await p.evaluate(() => document.querySelector('#device .map-pin[data-code="WAS"]').click()); await wait();
    ok(await q(() => !!document.querySelector('.ss-mapcard #map-card [data-a="map-details"]') && !!document.querySelector('.ss-mapcard [data-a="choose-station"]')), `${tag} floating card with Details and Select`);
    await axe(`${tag} updated map + card`);
    await p.click('#device [aria-label="Zoom out"]'); await wait();
    ok(await q(() => !!document.querySelector('#map-card')), `${tag} map interactive with card visible`);
    await p.evaluate(() => { const e = [...document.querySelectorAll('#device .map-pin')].find(x => x.dataset.code !== 'WAS'); window.__c = e.dataset.code; e.click(); }); await wait();
    ok(await q(() => document.querySelector('#map-card-t').textContent.includes(ST[window.__c].city)), `${tag} card updates for another station`);
    await p.click('#device [data-a="map-unselect"]'); await wait();
    ok(await q(() => !document.querySelector('#map-card')), `${tag} card dismissed`);
    await p.click('#device #ss-tab-list'); await wait();
    ok(await q(() => !!document.querySelector('#device #ss-q')), `${tag} search returns in List view`);
    await q(() => goLoc('stations:to')); await wait();
    ok(await q(d => (d === 'iphone' ? document.querySelector('#device .ss-head__title') : [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop()).textContent === 'Select arrival station' && document.querySelector('#device #ss-q').placeholder === 'Search arrival stations', dev), `${tag} To: heading and placeholder`);
    await p.click('#device [data-k="st-rec-PHL"]'); await wait();
    ok(await q(() => D().booking.to === 'PHL' && D().booking.from !== 'PHL'), `${tag} choosing fills To only`);
    if (dev === 'iphone') { await p.click('#device #ff-from'); await wait(); await p.click('#device .ss-head__back'); await wait(); ok(await q(() => sheet().stack.length === 1 && sheet().stack[0].s === 'ff'), `${tag} Back returns to New booking`); }
  }
  console.log('pass', pass, 'fail', fail); await b.close();
})();
