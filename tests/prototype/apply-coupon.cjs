// Apply coupon (New booking › Coupon or promotional code), matched to Figma Sprint 4 node 3346:47066:
// icon-only Back and title, the code field with info and clear, the helper line, "Your coupons" list with an info
// button per row, Apply; choosing another code replaces it without a confirmation; format, used and expired
// errors keep the value; upgrade coupons excluded; Details keeps scroll and the typed code; Back keeps the booking.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ content: AXE });
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const click = async (s, ms = 450) => { await p.locator(D_ + s).first().click(); await w(ms); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const top = () => ev(() => { const sh = sheet(); return sh ? sh.stack.map(r => r.s).join('>') : 'none'; });
  const dlg = () => ev(() => nav().dialog ? nav().dialog.title : null);
  const bk = () => ev(() => JSON.parse(JSON.stringify(D().booking)));
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };
  const open = (o = {}) => ev(o => { TB.v = 1; TB.dev = 'iphone'; TB.theme = o.th || 'light'; VS[1] = makeVS(o.sc || 'returning'); V().net = o.net || 'online'; V().toast = null; if (o.upgrades) D().coupons.push({ code: '60777700001212', kind: 'Upgrade coupon', name: '12-hour upgrade', benefit: 'Upgrade on trips up to 12 hours', issued: '2026-08-01', exp: '2027-08-01' }, { code: '60777700004848', kind: 'Upgrade coupon', name: '48-hour upgrade', benefit: 'Upgrade on trips up to 48 hours', issued: '2026-08-01', exp: '2027-08-01' }); goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; b.trip = 'rt'; b.ret = addDays(b.dep, 3); b.pax.adult = 2; b.tdisc = { 'adult-2': 'military' }; if (o.code) { b.codeText = o.code; b.codeSrc = 'saved'; } render(); }, o).then(() => w(400)).then(() => click('#ff-coderow', 700));
  const save = () => click('[data-a="apc-save"]', 600);

  // ---- layout (Figma 3346:47066) ----
  await open({ upgrades: true });
  ok(await top() === 'ff>dcode' && await ev(() => document.querySelector('#device .pane .ads-navbar__title').textContent) === 'Apply code', 'title "Apply code"');
  ok(await ev(() => { const b = document.querySelector('#device .pane .ads-navbar [data-a="back"]'); return b && b.classList.contains('ads-navbar__iconback') && !b.textContent.trim() && /^Back to/.test(b.getAttribute('aria-label')) && b.offsetWidth >= 44; }), 'icon-only Back, 44px, with an accessible name');
  ok(await p.locator(D_ + '.pane [data-a="close"]').count() === 0 && await p.locator(D_ + '.psheet .ads-sheet__grabber').count() === 0, 'no X and no grabber');
  ok(await ev(() => document.querySelector('#device label[for="apc-in"]').textContent) === 'Coupon or promotional code' && await ev(() => document.querySelector('#device #apc-in').placeholder) === 'Apply code', 'field label and placeholder');
  ok(await p.locator(D_ + '.apc-label [data-a="code-info"][aria-label="About coupon and promotion codes"]').count() === 1, 'info icon beside the label');
  ok(/Codes should be 4 or 14 characters long\./.test(await txt()), 'helper line');
  ok(await ev(() => { const f = document.querySelector('#device .apc-field'), y = document.querySelector('#device .apc-yours'); return [...document.querySelector('#device .pane--apc .pane__body').children].find(e => e.offsetHeight) === f && (f.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'the field is first, then Your coupons');
  ok(/Your coupons/.test(await txt()) && await ev(() => document.querySelectorAll('#device .apc-list > li').length) === 3, 'Your coupons: one list of the three saved codes');
  const row = await ev(() => document.querySelector('#device .apc-row').innerText.replace(/\s+/g, ' '));
  ok(/Fall Northeast sale Code: 60310045672211 Expires: 11\/30\/2026 20% off Northeast Regional Coach/.test(row) && await p.locator(D_ + '.apc-row [data-a="apc-details"]').count() === 3, `row: name, code, expiry, benefit (Figma AP.1 order) and an info button (${row})`);
  ok(await p.locator(D_ + '[data-a="apc-save"]').count() === 1 && await ev(() => document.querySelector('#device .pane__foot [data-a="apc-save"]').textContent.trim()) === 'Apply', 'Apply in the footer');
  const t = await txt();
  ok(!/deal|Used and expired|upgrade|notification channel|Only one coupon/i.test(t) && await p.locator('#tbCmpCoupon').count() === 0, 'no deals, used/expired, upgrade coupons, internal notes or switcher');
  // ---- choose, switch without a popup, save ----
  await click('[data-a="apc-pick"][data-code="60310045672211"]', 300);
  ok(await ev(() => document.querySelector('#device #apc-in').value) === '60310045672211' && await ev(() => document.querySelector('#device [data-a="apc-pick"][data-code="60310045672211"]').getAttribute('aria-pressed')) === 'true', 'choosing a coupon fills the field and marks the row');
  await click('[data-a="apc-pick"][data-code="60998877665544"]', 300);
  ok(!(await dlg()) && await ev(() => document.querySelector('#device #apc-in').value) === '60998877665544' && await ev(() => document.querySelector('#device [data-a="apc-pick"][data-code="60310045672211"]').getAttribute('aria-pressed')) === 'false', 'switching codes replaces it with no confirmation');
  const before = await bk(); ok(before.codeText === '', 'choosing doesn’t change the booking until Apply');
  await save();
  const b1 = await bk();
  ok(await top() === 'ff' && b1.codeText === '60998877665544' && /60998877665544/.test(await ev(() => document.querySelector('#device #ff-coderow').innerText)), 'Apply applies it and returns to Fare Finder');
  ok(b1.from === 'NYP' && b1.to === 'WAS' && b1.trip === 'rt' && b1.ret === before.ret && b1.pax.adult === 2 && b1.tdisc['adult-2'] === 'military', 'other booking selections kept');
  // switching an applied code: no popup either
  await click('#ff-coderow', 700);
  ok(await ev(() => document.querySelector('#device #apc-in').value) === '60998877665544', 'reopening shows the applied code');
  await click('[data-a="apc-pick"][data-code="60310045672211"]', 300); await save();
  ok(!(await dlg()) && (await bk()).codeText === '60310045672211', 'replacing an applied code needs no confirmation');
  // ---- typing, clearing and errors (value kept) ----
  await click('#ff-coderow', 700);
  await click('[data-a="apc-clear"]', 300); ok(await ev(() => document.querySelector('#device #apc-in').value) === '' && await ev(() => document.activeElement.id) === 'apc-in', 'the clear button empties the field');
  const tryCode = async v => { await p.fill(D_ + '#apc-in', v); await w(200); await save(); await w(200); return { top: await top(), err: await ev(() => (document.querySelector('#device #apc-in-h.ads-helper--error') || {}).innerText || ''), val: await ev(() => (document.querySelector('#device #apc-in') || {}).value) }; };
  let r = await tryCode('AB1'); ok(r.top === 'ff>dcode' && /isn’t valid/.test(r.err) && r.val === 'AB1', 'wrong length: inline error, value kept');
  r = await tryCode('60123456789012'); ok(/already been used/.test(r.err) && r.val === '60123456789012', 'used coupon: inline error');
  r = await tryCode('60555544443333'); ok(/expired/.test(r.err), 'expired coupon: inline error');
  r = await tryCode('zq7m'); ok(r.top === 'ff' && (await bk()).codeText === 'ZQ7M' && (await bk()).codeSrc === 'manual' && await ev(() => !D().coupons.some(c => c.code === 'ZQ7M')), 'a typed 4-character code is saved to the booking only');
  await click('#ff-coderow', 700); await click('[data-a="apc-clear"]', 300); await save();
  ok(await top() === 'ff' && (await bk()).codeText === '', 'saving an empty field removes the code');
  // ---- information and Details ----
  await click('#ff-coderow', 700);
  await click('.apc-label [data-a="code-info"]', 400);
  ok(/Promo codes have 4 letters or numbers\. Coupon codes have 14/.test(await ev(() => document.querySelector('.info-sheet').innerText)), 'information explains the code types');
  await ev(() => A['info-close']()); await w(300);
  await p.fill(D_ + '#apc-in', 'HALF'); await ev(() => { const s = document.querySelector('#device .pane--apc .pane__scroll'); s.scrollTop = 200; }); await w(150);
  const sc = await ev(() => document.querySelector('#device .pane--apc .pane__scroll').scrollTop);
  await click('[data-a="apc-details"][data-code="60412233445566"]', 600);
  ok(await top() === 'ff>dcode' && await ev(() => (nav().info || { stack: [] }).stack[0]) === 'coupon:60412233445566' && /Select Plus companion/.test(await ev(() => document.querySelector('#device .info-sheet').innerText)), 'the info button opens the coupon details in a bottom sheet (Figma AP.4)');
  await click('.info-sheet [data-a="info-close"]', 600);
  ok(await ev(() => document.querySelector('#device #apc-in').value) === 'HALF' && Math.abs(await ev(() => document.querySelector('#device .pane--apc .pane__scroll').scrollTop) - sc) <= 2, `Back from details keeps the typed code and scroll (${sc})`);
  await axe('light');
  // Back without saving keeps the booking as it was
  await click('.pane .ads-navbar [data-a="back"]', 600);
  ok(await top() === 'ff' && !(await dlg()) && (await bk()).codeText === '', 'Back returns to Fare Finder without saving the typed code');
  // upgrade coupons stay in My coupons
  await ev(() => { nav().sheet = null; goLoc('coupons'); }); await w(500);
  ok(/12-hour upgrade/.test(await txt()) && /48-hour upgrade/.test(await txt()), 'upgrade coupons still in Profile › My coupons');
  // ---- states ----
  await open({ sc: 'new' }); ok(/You don’t have any coupons/.test(await txt()) && await p.locator(D_ + '#apc-in').count() === 1, 'empty state');
  await open({ sc: 'guest' }); ok(/Sign in to see coupons saved to your account/.test(await txt()), 'guest state');
  await open({ net: 'slow' }); ok(await p.locator(D_ + '.cpn-loading[role="status"]').count() === 1, 'loading state'); await w(1700); ok(await ev(() => document.querySelectorAll('#device .apc-row').length) === 3, 'loading finishes');
  await open({ net: 'error' }); ok(/We couldn’t load your saved codes/.test(await txt()) && await p.locator(D_ + '.ads-alert [data-a="coupon-retry"]').count() === 1 && await p.locator(D_ + '.apc-skel').count() === 3 && await ev(() => { const a = document.querySelector('#device .pane--apc .ads-alert'), f = document.querySelector('#device #apc-in'); return a.getBoundingClientRect().bottom <= f.getBoundingClientRect().top; }), 'error state: alert above the field with Reload, three placeholders (Figma AP.7)'); await axe('error');
  await open({ th: 'dark', code: '60310045672211' }); await axe('dark, selected');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
