// Profile aligned to Figma Sprint 4 (PF.1): round 36px Back and Close, no grabber; six groups in order;
// each row a label above its value; empty values read "Not added"; read-only rows plain with no chevron (screen
// readers still hear "Can't be changed"); helper lines under Name, Assistance and Amtrak employee; axe light and dark.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ content: AXE });
  const ev = (f, a) => p.evaluate(f, a), w = ms => p.waitForTimeout(ms);
  const open = th => ev(th => { TB.v = 1; TB.dev = 'iphone'; TB.theme = th; VS[1] = makeVS('returning'); goLoc('profile'); }, th).then(() => w(600));
  const pane = '#device .pane--profile';
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .pane--profile', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };
  await open('light');
  ok(await ev(p => { const b = document.querySelector(p + ' .ads-navbar [data-a="back"]'); return b && b.classList.contains('ads-navbar__iconback') && !b.textContent.trim(); }, pane), 'icon-only Back');
  ok(await ev(p => { const c = document.querySelector(p + ' .ads-navbar__trail [data-a="close"]'); const b = getComputedStyle(c, '::before'); return c && b.content !== 'none' && b.borderRadius === '9999px' && b.width === '36px'; }, pane) && await p.locator('#device .psheet .ads-sheet__grabber').count() === 0, 'round 36px close (Figma Icon Button · Small), no grabber');
  const titles = await ev(p => [...document.querySelectorAll(p + ' .ads-group__title')].map(t => t.textContent), pane);
  ok(titles.join() === 'Name,Contact,Discounts,Assistance,Amtrak employee,Coupons', `groups in order (${titles})`);
  const rows = await ev(p => [...document.querySelectorAll(p + ' .ads-group__row')].map(r => { const l = r.querySelector('.ads-group__label'), v = r.querySelector('.ads-group__value'); return { l: l.textContent, v: v ? v.textContent : '', ls: parseFloat(getComputedStyle(l).fontSize), vs: v ? parseFloat(getComputedStyle(v).fontSize) : 0, above: v ? l.getBoundingClientRect().bottom <= v.getBoundingClientRect().top + 1 : false, chev: !!r.querySelector('.ads-icon--chevron-right'), ro: r.tagName === 'DIV' }; }), pane);
  ok(rows.map(r => r.l).join() === 'Name,Guest Rewards number,Middle initial,Email,Phone,Billing address,Date of birth,Passenger discounts,Assistance requests,Employee pass,My coupons', 'rows match the design');
  ok(rows.every(r => r.above && r.ls < r.vs), 'every row: a smaller label above its value');
  ok(['Middle initial', 'Date of birth', 'Passenger discounts', 'Assistance requests', 'Employee pass'].every(l => rows.find(r => r.l === l).v === 'Not added') && !rows.some(r => r.v === 'Add'), 'empty values read “Not added”');
  ok(rows.filter(r => r.ro).map(r => r.l).join() === 'Name,Guest Rewards number' && rows.filter(r => r.ro).every(r => !r.chev) && rows.filter(r => !r.ro).every(r => r.chev), 'read-only rows plain; the rest have a chevron');
  ok(await ev(p => [...document.querySelectorAll(p + ' .ads-lock')].every(x => x.getBoundingClientRect().width <= 1), pane) && await p.locator(pane + ' .ads-lock').count() === 2, '“Can’t be changed” kept for screen readers only');
  const foot = await ev(p => [...document.querySelectorAll(p + ' .ads-group__foot')].map(f => f.textContent), pane);
  ok(/Need to change your name\? Call us at 1-800-307-5000/.test(foot[0]) && foot.some(f => /Used for you as Traveler 1/.test(f)) && foot.some(f => /Used for Pass Rider booking/.test(f)), 'helper lines kept');
  await p.click(pane + ' [data-k="row-phone"]'); await w(600); ok(await ev(() => sheet().stack.at(-1).s === 'edit'), 'rows still open their editors');
  await ev(() => { const r = sheet().stack.at(-1); r.u.dirty = false; popTo(sheet().stack.length - 2); }); await w(400);
  await axe('light'); await open('dark'); await axe('dark');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
