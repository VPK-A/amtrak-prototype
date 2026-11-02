// Book landing, Sprint 4 review presentation: header, New booking, supporting links; no discovery or rebooking
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); if (!c) console.log('FAIL ' + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href); await p.waitForFunction(() => typeof TB !== 'undefined');
  const w = ms => p.waitForTimeout(ms), D = '#device ';
  const go = (v, sc, dev = 'iphone', text = 100, theme = 'light', orient = 'portrait') => p.evaluate(([v, sc, dev, text, theme, orient]) => { TB.v = v; TB.dev = dev; TB.text = text; TB.theme = theme; TB.orient = orient; VS[v] = makeVS(sc); goLoc('tab:book'); }, [v, sc, dev, text, theme, orient]);
  const stack = () => p.evaluate(() => nav().sheet ? nav().sheet.id + ':' + nav().sheet.stack.map(r => r.s).join('>') : '');
  const txt = () => p.evaluate(() => document.querySelector('#device .app').innerText.replace(/\s+/g, ' '));
  for (const dev of ['iphone', 'ipad']) for (const v of [1, 3]) {
    const T = `C${v} ${dev}`;
    await go(v, 'returning', dev); await w(250); const t = await txt();
    ok(/New booking/.test(t) && /Where to\?/.test(t) && /Passes/.test(t), `${T} New booking entry and Passes`);
    ok(!/Recommended trips|Favorite stations|Book again|Rebook|Explore/.test(t) && await p.locator(D + '.bk-card, .bk-trip').count() === 0, `${T} no discovery, rebooking or Explore`);
    if (dev === 'iphone') ok(/Hi, Alex/.test(t) && /Select Plus · 12,450 pts/.test(t) && await p.locator(D + '.app-tabbar [data-tab="book"][aria-current="page"]').count() === 1, `${T} member header, Book active`);
    await p.click(D + '[data-a="open-booking"]'); await w(600); ok((await stack()) === 'booking:ff', `${T} New booking opens the Fare Finder`);
    await p.click(D + '.sheet-layer [data-a="close"]'); await w(300); if (await p.locator(D + '[data-dlg="1"]').count()) await p.locator(D + '[data-dlg="1"]').click(); await w(600);
    ok(!(await stack()) && await p.evaluate(() => document.activeElement && document.activeElement.dataset.a) === 'open-booking', `${T} exit returns to Book, focus on the entry`);
    await p.click(D + '[data-a="bk-passes"]'); await w(500); ok((await stack()) === 'explore:stub', `${T} Passes opens its placeholder`); await p.click(D + '.sheet-layer [data-a="close"]'); await w(500);
    await go(v, 'guest', dev); await w(200); ok(/Sign in/.test(await txt()), `${T} guest header`);
    for (const [text, theme, orient] of [[140, 'light', 'portrait'], [100, 'dark', 'portrait'], [120, 'light', 'landscape']]) {
      await go(v, 'returning', dev, text, theme, orient); await w(250);
      const o = await p.evaluate(() => { const d = document.querySelector('#device .app-main').getBoundingClientRect(); return [...document.querySelectorAll('#device .bk *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > d.right + 1; }).length; });
      ok(o === 0, `${T} ${text}% ${theme} ${orient}: fits (${o})`);
    }
  }
  console.log('errors:', errs.length ? errs.join('\n') : 'none'); console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
