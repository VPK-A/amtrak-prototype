// Design system › ADS Next: New booking normalized against ADS Next (Global) and Mobile ADS: radius, borders and states, both concepts
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const go = (v, sc, dev = 'iphone', th = 'light') => p.evaluate(([v, sc, dev, th]) => { TB.v = v; TB.dev = dev; TB.text = 100; TB.theme = th; TB.ds = 'next'; VS[v] = makeVS(sc); V().toast = null; goLoc('ff'); }, [v, sc, dev, th]);
  const css = (sel, props) => p.evaluate(([s, props]) => { const e = document.querySelector('#device ' + s); if (!e) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect(); const o = { w: r.width, h: e.offsetHeight }; props.forEach(k => o[k] = c[k]); return o; }, [sel, props]);
  const tok = n => p.evaluate(n => { const i = document.createElement('i'); i.style.color = `var(${n})`; document.querySelector('#device .app').appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c; }, n);
  const P = ['borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'boxShadow', 'outlineStyle', 'outlineOffset'];
  for (const v of [1, 3]) for (const th of ['light', 'dark']) {
    const T = `C${v} ${th}`;
    await go(v, 'returning', 'iphone', th);
    const def = await tok('--ads-border-default'), foc = await tok('--ads-border-focus'), brand = await tok('--ads-border-brand'), err = await tok('--ads-border-status-error'), sub = await tok('--ads-border-subtle');
    for (const id of ['#ff-from', '#ff-to', '#ff-dep', '#ff-trav']) {
      const s = await css(id, P);
      ok(s && s.h === 60 && s.borderTopWidth === '1px' && s.borderTopColor === def && s.borderTopLeftRadius === '4px', `${T} ${id} rest: 60px field, 1px border/default, radius/4`);
    }
    const code = await css('.dcode .ads-control', P); ok(code.h === 44 && code.borderTopLeftRadius === '4px' && code.boxShadow.includes(def.replace(/\)$/, '')), `${T} coupon input rest: 44px, radius/4, border/default`);
    const saved = await css('.dcode .ads-group__body', P); ok(saved && saved.borderTopLeftRadius === '4px' && saved.borderTopColor === sub, `${T} saved codes List surface: radius/4, border/subtle`);
    const find = await css('[data-a="find-trains"]', P); ok(find.h === 44 && find.borderTopLeftRadius === '4px', `${T} Find trains: Primary, Default 44px, radius/4`);
    const swap = await css('[data-a="swap"]', P); ok(swap.h === 44 && swap.borderTopLeftRadius === '4px' && swap.borderTopWidth === '1px', `${T} swap: Tertiary icon-only Button 44px, radius/4`);
    const close = await css('.psheet .ads-navbar [data-a="close"]', ['borderTopWidth', 'backgroundColor']); ok(close.h === 44 && close.borderTopWidth === '0px' && close.backgroundColor === 'rgba(0, 0, 0, 0)', `${T} close: borderless Icon Button, 44px target`);
    const sheet = await css('.psheet', ['borderTopLeftRadius']); ok(sheet.borderTopLeftRadius === '12px', `${T} mobile sheet: radius/12`);
    if (v === 3) { const card = await css('.ffc-surface', ['borderTopLeftRadius']); ok(card.borderTopLeftRadius === '8px', `${T} Brand forward form card: radius/8`); }
    // focus: thicken the field's own border, no layout or corner change
    const before = await css('#ff-from', P);
    await p.focus('#device [data-a="trip"][aria-selected="true"]'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
    const f = await css('#ff-from', P);
    ok(await p.evaluate(() => document.activeElement.id) === 'ff-from' && f.borderTopColor === foc && f.boxShadow.includes('1px inset') && f.outlineStyle === 'none' && f.w === before.w && f.h === before.h && f.borderTopLeftRadius === '4px', `${T} field focus: 2px border/focus, same size and corner`);
    await p.focus('#device #ff-code'); await p.waitForTimeout(250);
    ok((await css('.dcode .ads-control', P)).boxShadow.includes('2px inset'), `${T} coupon focus: border thickens to 2px`);
    await p.focus('#device [data-a="find-trains"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
    const ff = await css('[data-a="find-trains"]', P); ok(ff.outlineStyle === 'solid' && ff.outlineOffset === '4px' && ff.h === 44, `${T} button focus: 2px ring 4px outside, no reflow`);
    // error
    await p.evaluate(() => document.activeElement.blur()); await p.locator('#device [data-a="find-trains"]').click(); await p.waitForTimeout(250);
    const e1 = await css('#ff-to', P); ok(e1.borderTopColor === err && e1.borderTopWidth === '1px' && await p.locator('#device .ads-routefield__to #ff-to-err').count() === 1, `${T} error: border/status-error, message on the field's own helper`);
    // disabled
    ok(await p.evaluate(() => document.querySelector('#device [data-a="swap"]').disabled), `${T} swap disabled with no stations`);
    if (v === 1 && th === 'light') {
      await go(1, 'returning', 'ipad'); await p.locator('#device #ff-from').click(); await p.waitForTimeout(300);
      const sel = await css('#ff-from', P); ok(sel.borderTopColor === brand && sel.borderTopWidth === '1px', `${T} iPad selected (picker open): border/brand`);
      ok((await css('.psheet', ['borderTopLeftRadius'])).borderTopLeftRadius === '12px', `${T} iPad modal: radius/12`);
      await go(1, 'passrider'); ok(await p.evaluate(() => document.querySelector('#device [data-a="find-trains"]').disabled), `${T} Pass Rider Find trains disabled until a travel type is chosen (flagged exception)`);
    }
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
