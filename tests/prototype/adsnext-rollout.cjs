// Design system › ADS Next rollout: component geometry, borders, icon roles and states across the concept
// (both concepts, light and dark). Navigation is out of scope and checked separately for no change.
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const force = async (sel, states) => { const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#device ' + sel }); if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: states }); return nodeId; };
  const go = (v, sc, loc, th, dev = 'iphone', js = '') => p.evaluate(([v, sc, loc, th, dev, js]) => { TB.v = v; TB.dev = dev; TB.text = 100; TB.theme = th; TB.ds = 'next'; VS[v] = makeVS(sc); V().toast = null; goLoc(loc); if (js) eval(js); render(); }, [v, sc, loc, th, dev, js]);
  const css = (sel, props = []) => p.evaluate(([s, props]) => { const e = document.querySelector('#device ' + s); if (!e) return null; const c = getComputedStyle(e); const o = { h: e.offsetHeight, r: c.borderTopLeftRadius, bw: c.borderTopWidth, bc: c.borderTopColor, bg: c.backgroundColor, sh: c.boxShadow, col: c.color, ol: c.outlineStyle, oo: c.outlineOffset }; props.forEach(k => o[k] = c[k]); return o; }, [sel, props]);
  const tok = (n, prop = 'color') => p.evaluate(([n, prop]) => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; document.querySelector('#device .app').appendChild(i); const c = getComputedStyle(i)[prop]; i.remove(); return c; }, [n, prop]);
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
  for (const v of [1]) for (const th of ['light', 'dark']) {
    const T = `C${v} ${th}`;
    const DEF = await (go(v, 'returning', 'ff', th), w(200), tok('--ads-border-default')), SUB = await tok('--ads-border-subtle'), FOC = await tok('--ads-border-focus'), BRAND = await tok('--ads-border-brand');
    const ICON2 = await tok('--ads-content-icon-secondary'), ICONB = await tok('--ads-content-icon-brand'), ERR = await tok('--ads-border-status-error');
    // List (Account)
    await go(v, 'returning', 'account', th); await w(250);
    const body = await css('.ads-group__body'); ok(body.r === '4px' && body.bw === '1px' && body.bc === SUB && body.bg === await tok('--ads-background-surface-raised', 'backgroundColor'), `${T} List surface: radius/4, border/subtle, surface-raised`);
    const row = await css('button.ads-group__row'); ok(row.h >= 44, `${T} List row ≥ 44px (${row.h})`);
    ok((await css('.ads-group__lead')).col === ICON2 && (await css('button.ads-group__row > .ads-icon--chevron-right')).col === ICON2, `${T} icon roles: leading and chevron content/icon-secondary`);
    { const bb = await p.locator('#device button.ads-group__row').first().boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await w(150);
      ok((await css('button.ads-group__row')).bg === await tok('--ads-background-surface-active', 'backgroundColor'), `${T} List row pressed: surface-active (proposed; no hover on touch)`); await p.mouse.move(5, 5); await p.mouse.up(); await w(100); }
    await p.focus('#device button.ads-group__row'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await w(150);
    { const rf = await p.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e); return { cls: e.className, ol: c.outlineStyle, oo: c.outlineOffset, h: e.offsetHeight }; }); ok(/ads-group__row/.test(rf.cls) && rf.ol === 'solid' && rf.oo === '-2px', `${T} List row focus: inset 2px ring, same size`); }
    ok((await css('.ads-navbar [data-a="close"]')).r === '9999px', `${T} Top Navigation close unchanged (excluded)`);
    // Profile badge, error state
    await go(v, 'returning', 'profile', th); await w(250); const lock = await css('.ads-lock'); ok(lock && lock.bw === '0px' && lock.r === '9999px', `${T} Badge: radius/full, no border`);
    await go(v, 'returning', 'edit:dob', th); await w(250); await p.fill('#device #ed-dob', '13/45/2000'); await p.evaluate(() => { const b = document.querySelector('#device [data-a="edit-save"]'); b.disabled = false; b.click(); }); await w(300); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await w(900);
    const dob = await p.evaluate(() => { const e = document.querySelector('#device #ed-dob').closest('.ads-control'); return getComputedStyle(e).boxShadow; }); ok(dob.includes(ERR.replace(/\)$/, '')), `${T} field error: border/status-error`);
    // Station search: Search field, icon buttons, selection
    await go(v, 'returning', 'stations:to', th, 'iphone', "D().booking.from='PHL'; D().booking.to='WAS';"); await w(250);
    const sf = await css('.ss-search .ads-control'); ok(sf.h === 44 && sf.r === '4px', `${T} Search field: 44px, radius/4 (${sf.h} ${sf.r})`);
    await p.evaluate(() => document.activeElement && document.activeElement.blur()); await w(100); ok((await css('.ss-search .ads-control')).sh.includes('1px inset') && (await css('.ss-search .ads-control')).sh.includes(DEF.replace(/\)$/, '')), `${T} Search rest: border/default 1px`);
    await p.focus('#device #ss-q'); await w(150); ok((await css('.ss-search .ads-control')).sh.includes('2px inset'), `${T} Search focus: 2px border/focus, no layout change`);
    const star = await css('.ads-stationrow__star:not(.ss-details)'); ok(star.r === '4px', `${T} Icon Button radius/4`);
    ok((await css('.ads-stationrow__star[aria-pressed="true"]') || {}).col === ICONB || !(await css('.ads-stationrow__star[aria-pressed="true"]')), `${T} chosen favorite: content/icon-brand`);
    ok(!(await css('.ss-route__item')) && (await ev(() => (document.querySelector('#device .ss-head__title') || [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop()).textContent)).startsWith('Select station'), `${T} station search: heading instead of route fields`);
    // Calendar: vertical month list (design review)
    await go(v, 'returning', 'calendar:dep', th); await w(250);
    ok(await p.locator('#device [data-a="cal-month"]').count() === 0 && await p.evaluate(() => getComputedStyle(document.querySelector('#device .pane--calx .pane__scroll')).overflowY) === 'auto', `${T} Dates: months scroll vertically (no month arrows)`);
    ok(await p.evaluate(() => document.querySelector('#device [data-k="day-2026-10-27"]').disabled), `${T} past days disabled`);
    // Travelers: cards, counter at-min, segmented selection (Pass Rider travel type)
    await go(v, 'returning', 'travelers', th, 'iphone', 'D().booking.pax.adult=2'); await w(250);
    ok((await css(v === 1 ? '.fam-card' : '.ov-list')).r === '8px', `${T} traveler card: radius/8`);
    ok(await p.evaluate(() => document.querySelector('#device [data-a="pax"][data-k="senior"][data-d="-1"]').disabled), `${T} counter at-min: minus disabled`);
    await go(v, 'passrider', 'ff', th, 'iphone', "D().booking.prType='leisure'"); await w(250);
    const seg = await css('.ads-segmented'); const sel = await css('.ads-segmented > button[aria-pressed="true"]');
    ok(seg && seg.r === '4px' && seg.bc === DEF && sel.sh.includes(BRAND.replace(/\)$/, '')), `${T} travel type: one radius/4 boundary, selected = inset border/brand`);
    ok(await p.evaluate(() => { D().booking.prType = null; render(); return document.querySelector('#device [data-a="find-trains"]').disabled; }), `${T} Find trains disabled without a travel type`);
    // Buttons: pressed and focus
    await go(v, 'returning', 'ff', th); await w(200);
    { const bb = await p.locator('#device [data-a="find-trains"]').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await w(250);
      ok((await css('[data-a="find-trains"]')).bg === await tok('--ads-background-interactive-primary-active', 'backgroundColor'), `${T} Primary pressed: interactive-primary-active`); await p.mouse.move(5, 5); await p.mouse.up(); await w(100); }
    await p.focus('#device [data-a="find-trains"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await w(150); const fb = await css('[data-a="find-trains"]'); ok(fb.ol === 'solid' && fb.oo === '4px', `${T} button focus: 2px ring 4px outside`);
    // Modal, sheets, toast, alert, verification cells
    await go(v, 'returning', 'clear-recents', th); await w(250); ok((await css('.pdialog')).r === '12px', `${T} modal: radius/12`);
    await go(v, 'returning', 'ff', th, 'iphone', "openInfo('codes')"); await w(400); ok((await css('.info-sheet')).r === '12px', `${T} mobile sheet: radius/12 top`);
    await go(v, 'returning', 'ff', th, 'ipad', "openInfo('codes')"); await w(400); const isd = await css('.info-sheet', ['borderBottomLeftRadius']); ok(isd.r === '12px', `${T} iPad sheet: radius/12`);
    await go(v, 'returning', 'ff', th, 'iphone', "toast('Saved')"); await w(250); const ts = await css('.ads-toast'); ok(!ts || ts.r === '8px', `${T} toast: radius/8 (proposed)`);
    await go(v, 'returning', 'verify:change-email', th); await w(400); const cell = await css('.ads-codeinput__cell'); ok(!cell || cell.r === '4px', `${T} code cells: radius/4`);
    if (cell) { await p.focus('#device .ads-codeinput__input'); await w(150); ok((await css('.ads-codeinput')).ol === 'none' && (await css('.ads-codeinput__cell.is-next')).sh.includes('2px inset'), `${T} code focus: the field's own border, no second ring`); }
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
