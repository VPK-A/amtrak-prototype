// NMA-600 Scenario 3: search by landmark. A matched landmark lists its nearest stations, closest first, after any station
// matches. Landmark search needs a connection: offline it says so and station search still works.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.addScriptTag({ content: AXE });
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 400) => p.waitForTimeout(ms), D = '#device ';
  const lists = () => ev(() => [...document.querySelectorAll('#device .ss-listpanel .stlist')].map(u => ({ label: u.getAttribute('aria-label'), codes: [...u.querySelectorAll('.ads-stationrow__code')].map(c => c.textContent), mi: [...u.querySelectorAll('.ss-dist [aria-hidden]')].map(d => parseFloat(d.textContent)) })));
  const type = async q => { await p.fill(D + '#ss-q', q); await w(); };
  await ev(() => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('returning'); goLoc('stations:from'); }); await w(800);
  await type('Empire'); let L = await lists();
  ok(L.length === 1 && /Empire State Building/.test(L[0].label) && L[0].codes[0] === 'NYP', 'a landmark lists its nearest stations: Empire State Building, New York Penn first');
  ok(L[0].mi.every((m, i) => i === 0 || m >= L[0].mi[i - 1]), 'stations near a landmark are in order of distance, closest first');
  ok(await ev(() => /Near Empire State Building/.test(document.querySelector('#device .ss-landmark .ads-stationrow__header').textContent)), 'the group is labelled with the landmark');
  await type('Capitol'); L = await lists();
  ok(L[0].label === 'Search results' && L[0].codes.includes('WAS') && /US Capitol/.test(L[1].label), 'station matches come first, then landmarks (code, city, state, name, ZIP before landmark)');
  await type('fenway'); L = await lists(); ok(/Fenway Park/.test(L[0].label) && L[0].codes[0] === 'BBY', 'matching ignores case; Fenway Park lists Boston Back Bay first');
  await type('Sears'); L = await lists(); ok(L.some(x => /Willis Tower/.test(x.label)), 'other names match too (Sears Tower → Willis Tower)');
  ok(await ev(() => /including stations near/.test(document.querySelector('#device .ss-listpanel [role="status"]').textContent)), 'the result count says landmark stations are included');
  await axe_run();
  async function axe_run() { const v = await ev(async () => (await axe.run('#device .ss-listpanel', { resultTypes: ['violations'] })).violations.map(x => x.id)); ok(!v.length, 'axe landmark results ' + v.join(',')); }
  await p.click(D + '.ss-landmark [data-a="choose-station"]'); await w(600);
  ok(await ev(() => selTarget('ff').from) === 'CHI', 'choosing a station from a landmark group fills the field');
  await ev(() => { VS[1] = makeVS('returning'); V().net = 'offline'; goLoc('stations:from'); }); await w(800);
  await type('Fenway');
  ok(await p.locator(D + '.ss-landmark').count() === 0 && /Searching by landmark needs a connection/.test(await ev(() => document.querySelector('#device .ss-listpanel').innerText)), 'offline: landmark search says it needs a connection');
  await type('Bos'); L = await lists(); ok(L.length && L[0].codes.includes('BOS'), 'offline: station search still works');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
