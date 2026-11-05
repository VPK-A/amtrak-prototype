const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
const SP = require('os').tmpdir() + '/';
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ path: require.resolve('axe-core/axe.min.js', { paths: [process.cwd(), __dirname] }) });
  const w = ms => p.waitForTimeout(ms), D = '#device ', ev = (f, a) => p.evaluate(f, a);
  const axe = async T => { const r = await ev(async () => (await axe.run({ include: ['#device'], exclude: ['.dev-status'] }, { resultTypes: ['violations'] })).violations.map(v => v.id + ' ' + v.nodes.slice(0,2).map(n => n.target.join(' ')).join(','))); ok(!r.length, `${T} axe ${r.join('|') || 'clean'}`); };
  for (const v of [1]) for (const th of ['light', 'dark']) {
    const T = `C${v} ${th}`;
    await ev(([v, th]) => { TB.v = v; TB.dev = 'iphone'; TB.text = 100; TB.theme = th; VS[v] = makeVS('returning'); V().toast = null; goLoc('ff'); }, [v, th]); await w(400);
    const tl = p.locator(D + '.trip-tabs[role="tablist"]');
    ok(await tl.count() === 1 && await p.locator(D + '.trip-tabs .ads-tab[role="tab"]').count() === 2 && await p.locator(D + '.ads-segmented [data-a="trip"]').count() === 0, `${T} trip type is ADS tabs`);
    await p.screenshot({ path: `${SP}tabs-c${v}-${th}.png`, clip: await p.locator('#device').boundingBox() });
    await axe(`${T} Fare Finder`);
    await p.locator(D + '.trip-tabs [data-v="ow"]').focus(); await p.keyboard.press('ArrowRight'); await w(300);
    ok(await ev(() => D().booking.trip) === 'rt' && await ev(() => document.activeElement.dataset.v) === 'rt' && await p.locator(D + '.trip-tabs [data-v="rt"]').getAttribute('tabindex') === '0', `${T} arrow key selects Round-trip, focus follows`);
    await p.locator(D + '.trip-tabs [data-v="ow"]').click(); await w(300); ok(await ev(() => D().booking.trip) === 'ow', `${T} click selects One-way`);
    await p.locator(D + '.trip-tabs [data-v="rt"]').click(); await w(300);
    await ev(() => goLoc('calendar:dep')); await w(400);
    ok(await p.locator(D + '.cal-pick[role="tablist"] [role="tab"]').count() === 2, `${T} calendar Depart/Return are tabs`);
    await p.locator(D + '.cal-pick [data-v="ret"]').click(); await w(300);
    ok(await p.locator(D + '.cal-pick [data-v="ret"]').getAttribute('aria-selected') === 'true', `${T} Return tab selects`);
    if (th === 'light') await p.screenshot({ path: `${SP}tabs-cal-c${v}.png`, clip: await p.locator('#device').boundingBox() });
    await axe(`${T} calendar`);
    await ev(() => goLoc('tab:trips')); await w(300);
    ok(await p.locator(D + '.tabpage .ads-tabs [role="tab"]').count() === 3, `${T} Trips uses tabs`); await axe(`${T} Trips`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
