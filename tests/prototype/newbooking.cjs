// New booking modal against Figma Sprint 4 node 3295:51258: layout and geometry, DS tokens, component states,
// both trip types, the booking interactions, iOS safe area and scrolling, no concept toggle, axe in light and dark.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const go = (sc = 'returning', o = {}) => ev(([sc, o]) => { TB.v = 1; TB.dev = o.dev || 'iphone'; TB.orient = o.orient || 'portrait'; TB.text = 100; TB.theme = o.th || 'light'; VS[1] = makeVS(sc); V().toast = null; goLoc('ff'); if (o.fill) { const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); } }, [sc, o]).then(() => w(500));
  const box = s => ev(s => { const d = document.querySelector('#device').getBoundingClientRect(), e = document.querySelector('#device ' + s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left - d.left), y: Math.round(r.top - d.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom - d.top) }; }, s);
  const cs = (s, k) => ev(([s, k]) => { const e = document.querySelector('#device ' + s); return e ? getComputedStyle(e)[k] : null; }, [s, k]);
  const tok = (n, prop = 'color') => ev(([n, prop]) => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; (document.querySelector('#device .psheet') || document.querySelector('#device .app')).appendChild(i); const c = getComputedStyle(i)[prop]; i.remove(); return c; }, [n, prop]);
  const near = (a, b, t = 3) => Math.abs(a - b) <= t;
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const click = async s => { await p.locator(D_ + s).first().click(); await w(350); };

  // ---- No concept toggle ----
  ok(await p.locator('#tbVersion').count() === 0 && !/Brand forward|Familiar/.test(await ev(() => document.querySelector('#protoCtl').innerText)), 'prototype controls: no Familiar / Brand forward toggle');
  ok(await ev(() => TB.v) === 1 && !/Brand forward/.test(await ev(() => JSON.stringify(FLOWS))), 'one New booking design; no Concept 3 entries in the flow list');

  // ---- Layout and geometry (iPhone 390 × 844), matched to the Figma frame ----
  await go('returning', { fill: true });
  const sh = await box('.psheet'), hd = await box('.ads-sheet-header'), cl = await box('.ads-sheet-header__close'), ti = await box('.ads-sheet-header__title'), br_ = await box('.ads-sheet-header__brand');
  ok(sh.y === 58 && await cs('.psheet', 'borderTopLeftRadius') === '12px' && await p.locator(D_ + '.psheet .ads-sheet__grabber').count() === 0, `sheet: top 58, radius/12, no grabber (${JSON.stringify(sh)})`);
  ok(hd.h === 76 && await cs('.ads-sheet-header', 'backgroundColor') === await tok('--ads-brand-midnight-blue', 'backgroundColor'), `header: 76px, brand/midnight blue (${hd.h})`);
  ok(cl.w === 36 && cl.h === 36 && cl.x === 20 && await cs('.ads-sheet-header__close', 'borderTopLeftRadius') === '9999px' && await cs('.ads-sheet-header__close', 'borderTopColor') === await tok('--ads-border-subtle') && /Close/.test(await ev(() => document.querySelector('#device .ads-sheet-header__close').getAttribute('aria-label'))), `close: 36px outlined circle at x 20 (border/subtle), named Close (${JSON.stringify(cl)})`);
  ok(await ev(() => { const c = getComputedStyle(document.querySelector('#device .ads-sheet-header__close'), '::before'); return c.content !== 'none' && c.top === '-4px' && c.left === '-4px'; }), 'close: 44px touch target around the 36px circle');
  ok(ti.x === 64 && await cs('.ads-sheet-header__title', 'fontSize') === '20px' && +(await cs('.ads-sheet-header__title', 'fontWeight')) >= 600 && /New booking/.test(await ev(() => document.querySelector('#device .ads-sheet-header__title').textContent)), `title: H3 20px semibold, 8px after the close (${ti.x})`);
  ok(br_.w === 160 && br_.x + br_.w === 390 && await p.locator(D_ + '.ads-sheet-header__brand svg').count() === 2 && await ev(() => document.querySelector('#device .ads-sheet-header__brand').getAttribute('aria-hidden')) === 'true', 'brand arrows: 160px at the trailing edge, two arrow ends, hidden from assistive tech');
  const tb = await box('.trip-tabs');
  ok(tb.y === hd.b + 12 && tb.h === 44 && tb.x === 20 && tb.w === 350, `trip tabs: 12px below the header, 44px, 20px margins (${JSON.stringify(tb)})`);
  ok(await ev(() => { const s = [...document.querySelectorAll('#device .trip-tabs .ads-tab')]; return s.length === 2 && Math.abs(s[0].offsetWidth - s[1].offsetWidth) < 2; }) && await ev(() => getComputedStyle(document.querySelector('#device .trip-tabs [aria-selected="true"]'), '::after').backgroundColor) === await tok('--ads-border-brand', 'backgroundColor'), 'tabs: equal widths, active indicator border/brand');
  const sg = await box('.ads-stationgroup'), sw = await box('.ads-swap-btn'), dg = await box('.ads-dategroup');
  ok(sg.y === tb.b + 24 && near(sg.h, 145, 4), `station group: 24px below the tabs, ~145px (${JSON.stringify(sg)})`);
  ok(sw.w === 44 && sw.h === 44 && near(sw.x + sw.w, sg.x + sg.w - 12, 1) && near(sw.y + 22, sg.y + sg.h / 2, 1) && await cs('.ads-swap-btn', 'borderTopLeftRadius') === '9999px', `swap: 44px circle, 12px from the edge, on the divider (${JSON.stringify(sw)})`);
  ok(await cs('.ads-swap-btn', 'backgroundColor') === await tok('--ads-background-interactive-primary', 'backgroundColor') && await cs('.ads-swap-btn', 'boxShadow') !== 'none', 'swap: interactive-primary with the small elevation');
  ok(await cs('.ads-stationgroup__code', 'fontSize') === '20px' && await cs('.ads-stationgroup__city', 'fontSize') === '13px' && await cs('.ads-stationgroup__facility', 'fontSize') === '11px', 'station field: code H3 20, city 13, facility 11');
  ok(dg.y === sg.b + 24 && near(dg.h, 79, 4) && await ev(() => document.querySelectorAll('#device .ads-dategroup .ads-fieldgroup__field').length) === 2, `date group: two columns, ~79px (${JSON.stringify(dg)})`);
  ok(await cs('.ads-fieldgroup', 'borderTopColor') === await tok('--ads-border-default') && await cs('.ads-fieldgroup', 'borderTopLeftRadius') === '4px' && await cs('.ads-fieldgroup', 'backgroundColor') === await tok('--ads-background-surface-default', 'backgroundColor'), 'field groups: 1px border/default, radius/4, surface-default');
  const trl = await box('.ffc-travfield .ads-selectrow__label'), trb = await box('#ff-trav'), crb = await box('#ff-coderow');
  ok(trl.y >= dg.b + 20 && trb.h === 53 && crb.h === 53 && trb.x === 20 && trb.w === 350, `selector rows: 53px, full width (${trb.h}, ${crb.h})`);
  ok(await ev(() => !!document.querySelector('#device #ff-trav .ads-icon--person') && !!document.querySelector('#device #ff-trav .ads-icon--chevron-right') && !document.querySelector('#device #ff-coderow .ads-icon--person')), 'Travelers row: person icon and chevron; code row: chevron only');
  ok(/Travelers\s*1 adult/.test(await txt()) && /Coupon or promotional code\s*Apply code/.test(await txt()), 'row labels and values as designed');
  const ft = await box('.ads-actionfooter'), pr = await box('.ads-pointsrow'), fb = await box('.ads-actionfooter [data-a="find-trains"]');
  ok(ft.y === 699 && ft.b === 844 && fb.h === 44 && fb.w === 350 && fb.b === 824 && pr.b <= fb.y - 16, `action footer: from y 699, Find trains 44px full width, 20px bottom (${JSON.stringify(ft)} ${JSON.stringify(fb)})`);
  ok(await cs('.ads-actionfooter', 'backgroundColor') === await tok('--ads-background-surface-raised', 'backgroundColor') && await cs('.ads-actionfooter', 'borderTopColor') === await tok('--ads-border-subtle'), 'footer: surface-raised with a border/subtle rule');
  ok(/Pay with points\s*12,450 points available/.test(await txt()) && await p.locator(D_ + '.ads-pointsrow input[role="switch"]').count() === 1, 'points row: title, balance and a switch');
  ok(await ev(() => /env\(safe-area-inset-bottom\)/.test([...document.styleSheets].flatMap(s => [...s.cssRules]).filter(r => r.selectorText && r.selectorText.includes('ads-actionfooter')).map(r => r.cssText).join(' '))), 'footer keeps clear of the iOS home indicator (safe-area inset)');
  ok(await ev(() => document.querySelector('#device .psheet').getAttribute('data-platform')) === 'ios', 'the sheet uses the iOS type layer');

  // ---- Component states ----
  ok(await ev(() => document.querySelector('#device .trip-tabs [data-v="ow"]').getAttribute('aria-selected')) === 'true', 'tabs: One-way selected by default');
  await go('returning');
  ok(await p.locator(D_ + '.ads-swap-btn:disabled').count() === 1 && /Where from\?/.test(await txt()) && /Where to\?/.test(await txt()), 'empty: placeholders, swap disabled');
  await click('[data-a="find-trains"]');
  ok(await p.locator(D_ + '.ads-stationgroup.ads-fieldgroup--error').count() === 1 && await p.locator(D_ + '#ff-from[aria-invalid="true"]').count() === 1 && await p.locator(D_ + '#ff-from-err').count() === 1 && await ev(() => document.activeElement.id) === 'ff-from', 'error: station group in error, From invalid with its message, focus on From');
  ok(await cs('.ads-stationgroup', 'borderTopColor') === await tok('--ads-border-status-error'), 'error border uses border/status-error');
  await go('returning', { fill: true }); await p.focus(D_ + '#ff-to'); await p.keyboard.press('Shift+Tab'); await w(150);
  ok(await ev(() => { const e = document.activeElement, c = getComputedStyle(e); return e.id === 'ff-from' && c.outlineStyle === 'solid' && c.outlineWidth === '2px'; }), 'focus: 2px ring on the station field');
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await w(100); // To, then the swap button
  ok(await ev(() => document.activeElement.matches('.ads-swap-btn') && getComputedStyle(document.activeElement).outlineStyle === 'solid'), 'focus: swap button shows its ring');

  // ---- Both trip types ----
  ok(/Departure date\s*\d\d\/\d\d\/\d{4}/.test(await txt()) && /Return date\s*Add return/.test(await txt()), 'one-way: departure date (MM/DD/YYYY) and Add return');
  await click('#ff-addret');
  ok(await ev(() => D().booking.trip === 'rt' && !!D().booking.ret) && await ev(() => document.querySelector('#device .trip-tabs [data-v="rt"]').getAttribute('aria-selected')) === 'true' && await p.locator(D_ + '#ff-ret').count() === 1, 'Add return switches to Round-trip with a return date');
  await click('.trip-tabs [data-v="ow"]'); ok(await ev(() => D().booking.trip === 'ow' && D().booking.ret === null), 'One-way tab removes the return');
  await click('.trip-tabs [data-v="rt"]'); ok(await ev(() => D().booking.trip === 'rt') && /Return date\s*\d\d\/\d\d\/\d{4}/.test(await txt()), 'Round-trip tab shows the return date');
  await p.focus(D_ + '.trip-tabs [data-v="rt"]'); await p.keyboard.press('ArrowLeft'); await w(300);
  ok(await ev(() => D().booking.trip) === 'ow', 'tabs: arrow keys switch trip type');
  await ev(() => { const b = D().booking; b.trip = 'rt'; b.ret = null; render(); }); await click('[data-a="find-trains"]');
  ok(await p.locator(D_ + '.ads-dategroup.ads-fieldgroup--error').count() === 1 && /Choose a return date/.test(await txt()), 'round-trip without a return: date group in error');

  // ---- Booking interactions ----
  await go('returning', { fill: true });
  await click('.ads-swap-btn'); ok(await ev(() => D().booking.from === 'WAS' && D().booking.to === 'NYP') && await ev(() => document.activeElement.matches('.ads-swap-btn')), 'swap exchanges From and To and keeps focus');
  await click('#ff-from'); ok(await ev(() => sheet().stack.at(-1).s === 'stations' && sheet().stack.at(-1).p.field === 'from'), 'From opens the station selector');
  await p.fill(D_ + '#ss-q', 'BOS'); await w(200); await click('[data-a="choose-station"][data-code="BOS"]');
  ok(await ev(() => D().booking.from === 'BOS' && D().booking.to === 'NYP' && sheet().stack.length === 1), 'changing only From returns at once; To kept');
  await click('#ff-dep'); ok(await ev(() => sheet().stack.at(-1).s === 'calendar'), 'Departure date opens the calendar');
  await ev(() => popTo(0)); await w(300);
  await click('#ff-trav'); ok(await ev(() => sheet().stack.at(-1).s === 'travelers'), 'Travelers row opens Traveler selection');
  await ev(() => popTo(0)); await w(300);
  await click('#ff-coderow'); ok(await ev(() => sheet().stack.at(-1).s === 'dcode') && await p.locator(D_ + '#apc-in').count() === 1, 'code row opens Apply coupon');
  await click('[data-a="apc-pick"][data-code="V123"]'); await click('[data-a="apc-save"]');
  ok(await ev(() => sheet().stack.length === 1 && D().booking.codeText === 'V123') && /V123/.test(await ev(() => document.querySelector('#device #ff-coderow').innerText)), 'Save code; the row shows the code');
  await p.locator(D_ + '.ads-pointsrow .ads-switch').click(); await w(300);
  ok(await ev(() => D().booking.pay) === 'points' && await p.locator(D_ + '#ff-coderow').count() === 0 && await ev(() => document.querySelector('#device #ff-points').checked), 'Pay with points on: points search, code row hidden');
  await p.locator(D_ + '.ads-pointsrow .ads-switch').click(); await w(300);
  ok(await ev(() => D().booking.pay) === 'cash' && await p.locator(D_ + '#ff-coderow').count() === 1, 'Pay with points off: code row back');
  await go('returning', { fill: true }); await click('[data-a="find-trains"]'); await w(900);
  ok(await ev(() => sheet().stack.at(-1).s === 'handoff'), 'Find trains with a complete trip opens the search hand-off');
  await go('returning'); await ev(() => { const b = D().booking; b.from = 'NYP'; render(); }); await click('.ads-sheet-header__close');
  ok(!/Exit booking|Abandon booking/.test(await txt()) && await ev(() => !nav().sheet && D().booking.from === 'NYP'), 'close before a cart: no question; the selection is kept');
  await go('passrider');
  ok(await p.locator(D_ + '#ff-points').count() === 0 && await p.locator(D_ + '#ff-coderow').count() === 0 && await ev(() => { const t = document.querySelector('#device #ff-mode'), tabs = document.querySelector('#device .trip-tabs'); return t && t.value === 'pr' && (t.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'Pass Rider: Booking type dropdown on Pass Rider, above the tabs; no points or code');

  // ---- Scrolling on small screens, iPad, landscape ----
  await go('returning', { fill: true, orient: 'landscape' });
  ok(await ev(() => { const s = document.querySelector('#device .pane--nb .pane__scroll'); return s.scrollHeight > s.clientHeight && getComputedStyle(s).overflowY === 'auto'; }) && await box('.ads-actionfooter').then(f => f.b <= 390), 'iPhone landscape: the form scrolls, the footer stays pinned');
  await go('returning', { fill: true, dev: 'ipad' });
  ok(await ev(() => { const s = document.querySelector('#device .psheet'), r = s.getBoundingClientRect(); return r.width <= 620 && getComputedStyle(s).borderTopLeftRadius === '12px'; }) && await p.locator(D_ + '.ads-sheet-header__brand').count() === 1, 'iPad: centered modal with the same header');
  ok(await ev(() => [...document.querySelectorAll('#device .psheet button, #device .psheet [role="switch"]')].filter(e => e.offsetParent).every(e => { return (e.closest('label.ads-switch') || e).offsetHeight >= 44 || e.closest('.ads-tabs') || (e.matches('.ads-sheet-header__close') && getComputedStyle(e, '::before').top === '-4px'); })), 'touch targets: every control in the modal is at least 44px tall');

  // ---- axe ----
  for (const th of ['light', 'dark']) {
    await go('returning', { fill: true, th }); await p.addScriptTag({ content: AXE });
    const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(v => v.id + ':' + v.nodes.length));
    ok(v.length === 0, `axe ${th}: no violations (${v.join(', ')})`);
    await go('returning', { th }); await ev(() => A['find-trains'](null, '0')); await w(400);
    const v2 = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(v => v.id + ':' + v.nodes.length));
    ok(v2.length === 0, `axe ${th} with errors: no violations (${v2.join(', ')})`);
  }
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
