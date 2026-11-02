const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), D = '#device ', ev = (f, a) => p.evaluate(f, a);
  for (const v of [1, 3]) for (const dev of ['iphone', 'ipad']) {
    const T = `C${v} ${dev}`;
    await ev(([v, dev]) => { TB.v = v; TB.dev = dev; TB.text = 100; TB.theme = 'light'; VS[v] = makeVS('returning'); V().toast = null; goLoc('ff'); }, [v, dev]); await w(300);
    // reach station search by tapping From
    await p.locator(D + '[data-a="station"][data-field="from"], ' + D + '[data-field="from"][data-a]').first().click(); await w(500);
    const link = p.locator(D + '.ads-stationrow__header .ss-clearrec');
    ok(await link.count() === 1, `${T} Clear recents link in Recents header`);
    const m = await link.evaluate(e => { const c = getComputedStyle(e); return { h: e.offsetHeight, tt: c.textTransform, cls: e.className, color: c.color, dec: c.textDecorationLine }; });
    ok(m.h >= 44 && m.tt === 'none' && /ads-link/.test(m.cls) && m.dec === 'underline', `${T} ADS link, sentence case, underlined, ${Math.round(m.h)}px target`);
    if (dev === 'iphone' && v === 1) await p.screenshot({ path: '/tmp/claude-0/-home-user/9a0c8a65-02ea-5259-9ef5-407bb92f43bb/scratchpad/clearrec-c1.png', clip: await p.locator('#device').boundingBox() });
    if (dev === 'iphone' && v === 3) await p.screenshot({ path: '/tmp/claude-0/-home-user/9a0c8a65-02ea-5259-9ef5-407bb92f43bb/scratchpad/clearrec-c3.png', clip: await p.locator('#device').boundingBox() });
    // keyboard: focus and Enter opens dialog; Cancel keeps recents
    await link.focus(); await p.keyboard.press('Enter'); await w(350);
    ok(await ev(() => nav().dialog && nav().dialog.title) === 'Clear recent stations?', `${T} opens confirm dialog`);
    await p.locator(D + '[data-dlg="0"]').click(); await w(350);
    ok(await p.locator(D + '[aria-label="Recent stations"]').count() === 1 && await ev(() => nav().sheet && nav().sheet.stack.at(-1).s) === 'stations', `${T} Cancel keeps recents and station search`);
    await link.click(); await w(350); await p.locator(D + '[data-dlg="1"]').click(); await w(400);
    ok(await p.locator(D + '[aria-label="Recent stations"]').count() === 0 && await p.locator(D + '[aria-label="Favorite stations"]').count() === 1 && await ev(() => D().rec.length) === 0, `${T} Confirm clears recents; favorites stay`);
    ok(await ev(() => document.activeElement && document.activeElement.id) === 'ss-q' && await ev(() => nav().sheet.stack.at(-1).s) === 'stations', `${T} stays in station search, focus on search field`);
    ok(await ev(() => /Recent stations cleared/.test(document.querySelector('#device').innerText)), `${T} toast shown`);
  }
  // no recents -> no link
  await ev(() => { TB.v = 1; TB.dev = 'iphone'; VS[1] = makeVS('returning'); D().rec = []; goLoc('stations:from'); }); await w(300);
  ok(await p.locator(D + '.ss-clearrec').count() === 0, 'no link when there are no recents');
  // axe
  await ev(() => { VS[1] = makeVS('returning'); goLoc('stations:from'); }); await w(300);
  await p.addScriptTag({ path: require.resolve('axe-core/axe.min.js', { paths: [process.cwd(), __dirname] }) });
  for (const th of ['light', 'dark']) { await ev(t => { TB.theme = t; render(); }, th); await w(200);
    const r = await ev(() => axe.run({ include: ["#device"], exclude: [".dev-status"] }, { resultTypes: ["violations"] })); ok(r.violations.length === 0, `axe ${th}: ${r.violations.map(v => v.id).join(',') || 'clean'}`); }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
