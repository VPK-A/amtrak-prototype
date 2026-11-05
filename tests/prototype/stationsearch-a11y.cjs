// NMA-1084 / NMA-1085: axe and overflow on the station map, nearby and recovery states, native prompts, details, Train status, Multi-Ride
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js', { paths: [process.cwd(), __dirname] }), 'utf8');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, reducedMotion: 'reduce' });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href); await p.addScriptTag({ content: AXE });
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const S = [
    ['list', 'stations:from', {}, ''], ['map', 'stations:from', {}, "sheet().stack.at(-1).u.view='map'"], ['map selected', 'stations:from', {}, "const r=sheet().stack.at(-1); r.u.view='map'; r.u.map={lat:38.9,lon:-77.0,z:9}; r.u.mapSel='WAS'"],
    ['map group', 'stations:from', {}, "const r=sheet().stack.at(-1); r.u.view='map'; r.u.map={lat:42.35,lon:-71.06,z:10}; r.u.mapGroup=['BOS','BBY']"], ['map location', 'stations:from', { perm: 'precise' }, "sheet().stack.at(-1).u.view='map'"],
    ['map offline', 'stations:from', {}, "sheet().stack.at(-1).u.view='map'; V().net='offline'"], ['map fail', 'stations:from', { map: 'fail' }, "sheet().stack.at(-1).u.view='map'"],
    ['nearby results', 'stations:from', { perm: 'precise' }, "Object.assign(sheet().stack.at(-1).u, {near:{st:'results', radius:20, approx:false, results: nearbySearch(devicePos()).results}})"],
    ['nearby approx', 'stations:from', { perm: 'approx' }, "Object.assign(sheet().stack.at(-1).u, {near:{st:'results', radius:20, approx:true, results: nearbySearch(devicePos()).results}})"],
    ...['denied-first', 'denied', 'services-off', 'unavailable', 'data', 'none', 'offline'].map(k => ['near ' + k, 'stations:from', {}, `sheet().stack.at(-1).u.near={st:'${k}'}`]),
    ['loading', 'stations:from', {}, "sheet().stack.at(-1).u.near={st:'loading'}"],
    ['ios prompt', 'stations:from', { platform: 'ios' }, "nav().native={kind:'perm',platform:'ios',precise:true,done(){}}"], ['android prompt', 'stations:from', { platform: 'android' }, "nav().native={kind:'perm',platform:'android',precise:true,done(){}}"],
    ['settings', 'stations:from', {}, "nav().native={kind:'settings',what:'app',platform:'ios'}"],
    ['details', 'stations:from', {}, "push('station-detail',{code:'NYP',field:'from'},0)"], ['train status', 'tab:train-status', {}, ''], ['multi-ride', 'tab:book', {}, "A['bk-passes']()"]];
  let n = 0, runs = 0;
  for (const dev of ['iphone', 'ipad']) for (const theme of ['light', 'dark']) for (const text of [100, 140]) for (const v of [1]) for (const [name, loc, L, js] of S) {
    runs++;
    await p.evaluate(([dev, theme, text, v, loc, L, js]) => { TB.dev = dev; TB.theme = theme; TB.text = text; TB.v = v; VS[v] = makeVS('returning'); V().loc = Object.assign(LOC_DEFAULT(), L); V().toast = null; goLoc(loc); if (js) eval(js); render(); }, [dev, theme, text, v, loc, L, js]);
    await p.waitForTimeout(350);
    const r = await p.evaluate(async () => (await axe.run({ include: ['#device'], exclude: ['.dev-status'] }, { resultTypes: ['violations'] })).violations.map(v => v.id + ':' + v.nodes.slice(0, 2).map(x => x.target.join(' ')).join(',')));
    const of = await p.evaluate(() => { const out = []; document.querySelectorAll('#device .pane__body, #device .app-main, #device .map-card, #device .native__card').forEach(el => { if (el.scrollWidth > el.clientWidth + 2) out.push('overflow:' + el.className.split(' ')[0]); }); return out; });
    const all = [...r, ...of]; if (all.length) { n++; if (n < 15) console.log(`${dev}/${theme}/${text}/v${v} ${name}`, all); }
  }
  console.log(`issues ${n} of ${runs}`); await b.close(); })();
