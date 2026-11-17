// Wireframe skin (branch figma-make/sprint5-wireframe): every visible color is grey, and the kit's font loads.
// Walks several screens in light and dark and checks the computed text, background and border colors.
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), D_ = '#device ';
  const colored = () => p.evaluate(() => {
    const sat = c => { const m = c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] === 0)) return 0; const v = [+m[1], +m[2], +m[3]]; return Math.max(...v) - Math.min(...v); };
    const bad = [];
    for (const el of document.querySelectorAll('#device *')) { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      for (const k of ['color', 'backgroundColor', 'borderTopColor', 'outlineColor']) if (sat(cs[k]) > 6) { bad.push(`${el.className || el.tagName} ${k} ${cs[k]}`); break; } }
    return bad.slice(0, 5);
  });
  for (const th of ['light', 'dark']) {
    await p.evaluate(th => { TB.v = 1; TB.dev = 'iphone'; TB.orient = 'portrait'; TB.theme = th; VS[1] = makeVS('returning'); render(); }, th); await w(400);
    let b = await colored(); ok(!b.length, `${th}: Book landing is greyscale ${b.join(' | ')}`);
    await p.evaluate(() => { goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'MTR'; b.dep = '2026-11-05'; b.trip = 'rt'; b.ret = '2026-11-08'; render(); }); await w(400);
    b = await colored(); ok(!b.length, `${th}: Fare Finder is greyscale ${b.join(' | ')}`);
    await p.locator(D_ + '[data-a="find-trains"]').click(); await w(1200);
    b = await colored(); ok(!b.length, `${th}: results (border alert, badges, tags) are greyscale ${b.join(' | ')}`);
    await p.locator(D_ + '[data-a="s5-fare"]:not([disabled])').first().click(); await w(500);
    b = await colored(); ok(!b.length, `${th}: Choose a fare is greyscale ${b.join(' | ')}`);
    await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
    await p.locator(D_ + '.pane:last-child [data-a="s5-fare"]:not([disabled])').first().click(); await w(500); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
    b = await colored(); ok(!b.length, `${th}: Trip summary, success alert and handoff are greyscale ${b.join(' | ')}`);
  }
  ok(await p.evaluate(async () => { await document.fonts.ready; return getComputedStyle(document.querySelector('#device .ads-btn, #device button')).fontFamily.includes('Patrick Hand'); }), 'the kit font (Patrick Hand) is applied');
  ok(!errs.length, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  await br.close(); process.exit(res.every(r => r[0]) ? 0 : 1);
})();
