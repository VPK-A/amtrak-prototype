// Station search, Amtrak.com logic (NMA-600): up to 3 characters lists stations as before; 4 or more suggests places
// (cities, states and provinces, landmarks, ZIP codes) plus stations whose own name matches; choosing a place lists the
// stations closest to it. Landmark and ZIP search need a connection.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.addScriptTag({ content: AXE });
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 400) => p.waitForTimeout(ms), D = '#device ';
  const places = () => ev(() => [...document.querySelectorAll('#device .ss-placerow')].map(x => x.querySelector('.ss-placerow__name').textContent + ' | ' + x.querySelector('.ss-placerow__sub').textContent));
  const codes = () => ev(() => [...document.querySelectorAll('#device .ss-listpanel .ads-stationrow__code')].map(x => x.textContent));
  const dists = () => ev(() => [...document.querySelectorAll('#device .ss-listpanel .ss-dist [aria-hidden]')].map(d => parseFloat(d.textContent)));
  const type = async q => { await p.fill(D + '#ss-q', q); await w(); };
  const choose = async i => { await p.click(`${D}[data-a="ss-place"][data-i="${i}"]`); await w(500); };
  const go = async net => { await ev(net => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('returning'); V().net = net; goLoc('stations:from'); }, net); await w(800); };
  await go('online');
  await type('Bos'); ok((await places()).length === 0 && (await codes()).includes('BOS'), '3 characters or fewer: the station list, as before');
  await type('PHL'); ok((await codes())[0] === 'PHL', 'station codes still work');
  await type('Phil'); ok((await places())[0] === 'Philadelphia, PA | City · Pennsylvania' && (await codes()).every(c => c === 'PHN'), '4+ characters: places to choose from (a city), plus stations named for it');
  await axe('place suggestions');
  await choose(0);
  const c = await codes(), d = await dists();
  ok(c[0] === 'PHL' && d.every((m, i) => i === 0 || m >= d[i - 1]), 'choosing a city lists stations closest first, with distances');
  ok(/Stations near Philadelphia, PA, closest first/.test(await ev(() => document.querySelector('#device .ss-place').innerText)) && await ev(() => document.activeElement.classList.contains('ss-place__t')), 'the results say which place, and focus moves there');
  await axe('stations near a place');
  await p.click(D + '[data-a="ss-place-clear"]'); await w(); ok((await places()).length > 0 && await ev(() => document.activeElement.id) === 'ss-q', 'Change returns to the place suggestions, focus in the field');
  await choose(0); await type('Philly'); ok(await p.locator(D + '.ss-place').count() === 0, 'typing again clears the chosen place');
  await type('Calif'); ok((await places())[0] === 'California | State', 'a state is a place'); await choose(0);
  ok((await codes()).length > 0 && /Stations in California/.test(await ev(() => document.querySelector('#device .ss-place').innerText)), 'choosing a state lists its stations');
  await type('Empire'); ok((await places()).some(x => x.startsWith('Empire State Building | Landmark')), 'a landmark is a place'); await choose(0); ok((await codes())[0] === 'NYP', 'Empire State Building: New York Penn first');
  await type('1910'); const zi = (await places()).indexOf('19104 | ZIP code · Philadelphia, PA'); ok(zi >= 0, 'a ZIP code is a place'); await choose(zi); ok((await codes())[0] === 'PHL', 'ZIP 19104: Philadelphia first');
  await type('Princ'); const pi = (await places()).indexOf('Princeton, NJ | City · New Jersey'); ok(pi >= 0, 'a city without its own station is a place'); await choose(pi); ok((await codes())[0] === 'PJC', 'Princeton: Princeton Junction first');
  await type('Moynihan'); ok((await places()).length === 0 && (await codes())[0] === 'NYP', 'a station’s own name still finds it (Moynihan → New York Penn)');
  await type('Penn'); ok((await codes()).includes('NYP') && (await places()).some(x => x.startsWith('Pennsylvania')), 'station names and places together (Penn)');
  await type('Nowhere'); ok(/No results for “Nowhere”/.test(await ev(() => document.querySelector('#device .ss-listpanel').innerText)), 'no match: No results');
  await type('Phil'); await choose(0); await p.click(D + '.ss-listpanel [data-a="choose-station"]'); await w(600); ok(await ev(() => selTarget('ff').from) === 'PHL', 'choosing a station near a place fills the field');
  await go('offline');
  await type('Empire'); ok(!(await places()).some(x => /Landmark/.test(x)) && /needs a connection/.test(await ev(() => document.querySelector('#device .ss-listpanel').innerText)), 'offline: no landmarks or ZIP codes, and it says why');
  await type('Phil'); ok((await places())[0].startsWith('Philadelphia, PA'), 'offline: cities still work');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
  async function axe(n) { const v = await ev(async () => (await window.axe.run('#device .ss-listpanel', { resultTypes: ['violations'] })).violations.map(x => x.id)); ok(!v.length, 'axe ' + n + ' ' + v.join(',')); }
})();
