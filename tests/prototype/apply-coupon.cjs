// Apply coupon (New booking › Coupon or promotional code): title, Back without an X, code entry directly below the
// header with its information, add vs apply, inline feedback, stacked cards with Apply and Details, applied state,
// replace confirmation, no switcher, no Deals or deal content, no used/expired section, upgrade coupons excluded,
// Details and Back restore scroll and the typed code, Back preserves the booking, empty/loading/error, axe.
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
  const open = (o = {}) => ev(o => { TB.v = 1; TB.dev = 'iphone'; TB.theme = o.th || 'light'; VS[1] = makeVS(o.sc || 'returning'); V().net = o.net || 'online'; V().toast = null; if (o.upgrades) D().coupons.push({ code: '60777700001212', kind: 'Upgrade coupon', name: '12-hour upgrade', benefit: 'Upgrade to Business or First on trips up to 12 hours', issued: '2026-08-01', exp: '2027-08-01' }, { code: '60777700004848', kind: 'Upgrade coupon', name: '48-hour upgrade', benefit: 'Upgrade on trips up to 48 hours', issued: '2026-08-01', exp: '2027-08-01' }); goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; b.trip = 'rt'; b.ret = addDays(b.dep, 3); b.pax.adult = 2; b.tdisc = { 'adult-2': 'military' }; render(); }, o).then(() => w(400)).then(() => click('#ff-coderow', 700));

  // ---- header, structure, no switcher, no deals ----
  await open({ upgrades: true });
  ok(await top() === 'ff>dcode' && await ev(() => document.querySelector('#device .pane .ads-navbar__title').textContent) === 'Apply coupon', 'title is "Apply coupon"');
  ok(await p.locator(D_ + '.pane .ads-navbar [data-a="back"]').count() === 1 && await p.locator(D_ + '.pane [data-a="close"]').count() === 0, 'Back, no X that exits the booking');
  ok(await ev(() => { const body = document.querySelector('#device .pane--apc .pane__body'), first = [...body.children].find(e => e.offsetHeight > 0); return first && first.matches('.apc-add') && /^Add a coupon or promotion code/.test(first.querySelector('h3').textContent); }), 'code entry is directly below the header');
  ok(await ev(() => { const a = document.querySelector('#device .apc-add'), v = document.querySelector('#device .apc-avail'); return a.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING; }), 'code entry sits above the available coupons');
  ok(await ev(() => !!document.querySelector('#device .apc-head [data-a="code-info"][aria-label="About coupon and promotion codes"]')), 'information icon beside the heading, with an accessible name');
  ok(await ev(() => { const l = document.querySelector('#device label[for="apc-in"]'); return l && l.textContent.trim() === 'Code'; }) && await p.locator(D_ + '[data-a="apc-add"]').count() === 1, 'one labeled Code field and an Add button');
  ok(await p.locator('#tbCmpCoupon, #tbCmpCxData').count() === 0, 'no coupon-screen dropdown in Prototype controls');
  const t = await txt();
  ok(!/\bDeals?\b|deal/i.test(t) && await p.locator(D_ + '[role="tablist"]').count() === 0, 'no Deals tab and no deal content');
  ok(!/Used and expired|Can’t be applied|limited time|notification channel/i.test(t), 'no used/expired section and no internal notes');
  ok(!/Only one coupon or promotion code per booking/i.test(t), 'no "only one code per booking" statement');
  ok(!/upgrade/i.test(t) && await ev(() => D().coupons.filter(c => /upgrade/i.test(c.kind)).length) === 2, 'upgrade coupons in the account are excluded from this page');
  await ev(() => { nav().sheet = null; goLoc('coupons'); }); await w(500);
  ok(/12-hour upgrade/.test(await txt()) && /48-hour upgrade/.test(await txt()), 'upgrade coupons still show in Profile › My coupons');
  // ---- cards ----
  await open();
  const cards = await ev(() => [...document.querySelectorAll('#device .apc-card')].map(c => ({ t: c.innerText.replace(/\s+/g, ' '), apply: !!c.querySelector('[data-a="apc-apply"]'), det: !!c.querySelector('[data-a="apc-details"]') })));
  ok(cards.length === 3 && cards.every(c => c.apply && c.det), `stacked cards with Apply and Details (${cards.length})`);
  ok(/Fall Northeast sale/.test(cards[0].t) && /20% off Northeast Regional Coach/.test(cards[0].t) && /Promotion code/.test(cards[0].t) && /V123/.test(cards[0].t) && /Expires Mon, Nov 30, 2026/.test(cards[0].t), 'card: name, benefit, type, code and expiry');
  ok(await ev(() => { const c = getComputedStyle(document.querySelector('#device .apc-card')), s = getComputedStyle(document.querySelector('#device .pane--apc .pane__scroll')); return c.backgroundColor !== s.backgroundColor && c.borderTopStyle === 'solid' && parseFloat(c.borderTopLeftRadius) >= 8; }), 'white rounded cards with a subtle border on the page background');
  // ---- information ----
  await click('.apc-head [data-a="code-info"]', 400);
  const info = await ev(() => document.querySelector('.info-sheet') && document.querySelector('.info-sheet').innerText);
  ok(/Promo codes have 4 letters or numbers\. Coupon codes have 14/.test(info) && /My coupons/.test(info), 'information explains code types and where to find them');
  await ev(() => A['info-close']()); await w(300);
  // ---- add: inline feedback keeps the value ----
  const add = async v => { await p.fill(D_ + '#apc-in', v); await click('[data-a="apc-add"]', 500); return { err: await ev(() => (document.querySelector('#device #apc-in-h.ads-helper--error') || {}).innerText || ''), val: await ev(() => document.querySelector('#device #apc-in').value), inv: await ev(() => document.querySelector('#device #apc-in').getAttribute('aria-invalid')) }; };
  let r = await add('AB1'); ok(/isn’t valid/.test(r.err) && r.val === 'AB1' && r.inv === 'true', 'invalid format: inline error, value kept');
  r = await add('EXP12345678901'); await w(400); r = { err: await ev(() => (document.querySelector('#device #apc-in-h.ads-helper--error') || {}).innerText || ''), val: await ev(() => document.querySelector('#device #apc-in').value) };
  ok(/expired/.test(r.err) && r.val === 'EXP12345678901', 'expired coupon: inline error, value kept');
  r = await add('60123456789012'); ok(/already been used/.test(r.err) && r.val === '60123456789012', 'used coupon: inline error, value kept');
  r = await add('60555544443333'); ok(/expired/.test(r.err), 'expired coupon from the account: inline error');
  r = await add('60412233445566'); ok(/already in your account/.test(r.err), 'duplicate coupon: inline error');
  r = await add('v123'); ok(/already in your account|already in your list/.test(r.err) && r.val === 'V123', 'duplicate promotion code: inline error');
  // promotion code: 4 characters, added (not applied), stays with this booking
  r = await add('zq7m');
  ok(!r.err && r.val === '' && await ev(() => !!document.querySelector('#device .apc-card[data-code="ZQ7M"]')) && (await bk()).codeText === '', 'a 4-character promotion code is added to the list, not applied');
  ok(await ev(() => !D().coupons.some(c => c.code === 'ZQ7M')), 'a typed promotion code isn’t saved to the account');
  // coupon: 14 characters, added to the account
  await p.fill(D_ + '#apc-in', '60111122223333'); await click('[data-a="apc-add"]', 1200);
  ok(await ev(() => D().coupons.some(c => c.code === '60111122223333')) && (await bk()).codeText === '' && await ev(() => !!document.querySelector('#device [data-a="apc-apply"][data-code="60111122223333"]')), 'a 14-character coupon is added to the account and listed, not applied');
  // ---- apply, applied state, replace ----
  const before = await bk();
  await click('[data-a="apc-apply"][data-code="V123"]');
  ok((await bk()).codeText === 'V123' && await ev(() => { const c = document.querySelector('#device .apc-card[data-code="V123"]'); return c.classList.contains('is-applied') && /Applied/.test(c.innerText) && !!c.querySelector('[data-a="apc-remove"]'); }), 'applying marks the card Applied');
  ok(/We’ll check it against your trip when you find trains/.test(await txt()) && (await bk()).codeState === '', 'applied but not presented as valid before the trip check');
  await click('[data-a="apc-apply"][data-code="60998877665544"]', 400);
  ok(await dlg() === 'Replace your code?' && /Service recovery credit \(60998877665544\) will replace Fall Northeast sale \(V123\) on this booking\./.test(await ev(() => document.querySelector('.pdialog').innerText.replace(/\s+/g, ' '))) && await ev(() => [...document.querySelectorAll('.pdialog [data-dlg]')].map(b => b.textContent).join()) === 'Replace code,Keep current code', 'replacing says which replaces which, with confirm and cancel');
  await p.locator('.pdialog [data-dlg="1"]').click(); await w(300); ok((await bk()).codeText === 'V123', 'Keep current code keeps it');
  await click('[data-a="apc-apply"][data-code="60998877665544"]', 400); await p.locator('.pdialog [data-dlg="0"]').click(); await w(400);
  ok((await bk()).codeText === '60998877665544', 'Replace code applies the new one');
  // ---- Details: secondary view; Back restores scroll and the typed code ----
  await p.fill(D_ + '#apc-in', 'HALF'); await ev(() => { const s = document.querySelector('#device .pane--apc .pane__scroll'); s.scrollTop = 220; }); await w(150);
  const sc = await ev(() => document.querySelector('#device .pane--apc .pane__scroll').scrollTop);
  await click('[data-a="apc-details"][data-code="60412233445566"]', 600);
  ok(await top() === 'ff>dcode>apc-detail' && /Select Plus companion/.test(await txt()) && /Benefit/.test(await txt()) && /Expires/.test(await txt()), 'Details shows the full terms in a secondary view');
  await click('.ads-navbar [data-a="back"]', 600);
  ok(await ev(() => document.querySelector('#device #apc-in').value) === 'HALF' && Math.abs(await ev(() => document.querySelector('#device .pane--apc .pane__scroll').scrollTop) - sc) <= 2, `Back from Details restores the typed code and scroll position (${sc})`);
  await axe('light');
  // ---- Back preserves the booking; Fare Finder summary updated ----
  await click('.pane .ads-navbar [data-a="back"]', 600);
  const after = await bk();
  ok(await top() === 'ff' && !(await dlg()), 'Back returns to Fare Finder without a dialog');
  ok(after.from === 'NYP' && after.to === 'WAS' && after.trip === 'rt' && after.ret === before.ret && after.pax.adult === 2 && after.tdisc['adult-2'] === 'military' && after.pay === before.pay, 'every other booking selection kept');
  ok(/60998877665544/.test(await ev(() => document.querySelector('#device #ff-coderow').innerText)), 'Fare Finder summary shows the applied code');
  // the trip check still happens at Find trains
  await click('[data-a="find-trains"]', 1000); ok(await top() === 'ff>handoff', 'the applied code goes through the existing Find trains check');
  // ---- states ----
  await open({ sc: 'new' });
  ok(/You don’t have any coupons/.test(await txt()) && await p.locator(D_ + '#apc-in').count() === 1, 'empty: message, entry still available');
  await open({ sc: 'guest' });
  ok(/Sign in to see coupons saved to your account/.test(await txt()), 'guest: empty with sign-in note');
  await p.fill(D_ + '#apc-in', '60111122223333'); await click('[data-a="apc-add"]', 400);
  ok(await ev(() => !!document.querySelector('#device .apc-card[data-code="60111122223333"]') && !D().coupons.length), 'guest: an added coupon stays with this booking');
  await open({ net: 'slow' });
  ok(await p.locator(D_ + '.cpn-loading[role="status"]').count() === 1, 'loading state');
  await w(1700); ok(await ev(() => document.querySelectorAll('#device .apc-card').length) === 3, 'loading finishes');
  await open({ net: 'error' });
  ok(/We couldn’t load your coupons/.test(await txt()) && await p.locator(D_ + '[data-a="coupon-retry"]').count() === 1, 'error state with Try again');
  await axe('error');
  await open({ th: 'dark' }); await click('[data-a="apc-apply"][data-code="V123"]'); await axe('dark, applied');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
