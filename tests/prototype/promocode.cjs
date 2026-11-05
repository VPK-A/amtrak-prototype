// Typed promotion code: this booking only; abandoning the booking clears it; account coupons untouched.
// Lounge passes removed from the coupon wallet and saved-code picker. (Both concepts)
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const click = async s => { await p.locator(D_ + s).first().click(); await w(300); };
  const wallet = () => ev(() => JSON.stringify([D().coupons, D().couponsPast || []]));
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  // New booking (Figma 3295:51258): the coupon row opens the code screen; Done returns
  const openCode = () => click('#ff-coderow');
  const enterCode = async c => { await openCode(); await p.fill(D_ + '#ff-code', c); await p.locator(D_ + '#ff-code').blur(); await w(200); await click('[data-a="dcode-done"]'); };
  const rowVal = () => ev(() => (document.querySelector('#device #ff-coderow .ads-selectrow__value') || {}).textContent);
  for (const v of [1]) {
    const T = `C${v}`;
    await ev(v => { TB.v = v; TB.dev = 'iphone'; VS[v] = makeVS('returning'); goLoc('tab:book'); }, v); await w(300);
    const before = await wallet();
    await click('[data-a="open-booking"]');
    await enterCode('fall');
    ok(await ev(() => D().booking.codeText === 'FALL' && D().booking.codeSrc === 'manual'), `${T} typed code entered (FALL)`);
    // navigate within the booking: stations, dates, travelers, Find trains check
    await click('#ff-from'); await p.fill(D_ + '#ss-q', 'NYP'); await w(150); await click('[data-a="choose-station"][data-code="NYP"]');
    await click('#ff-to'); await p.fill(D_ + '#ss-q', 'WAS'); await w(150); await click('[data-a="choose-station"][data-code="WAS"]');
    await click('#ff-dep'); await p.locator(D_ + '.psheet [data-a="back"], ' + D_ + '.psheet .pane__foot .ads-btn').first().click(); await w(300);
    await click('[data-a="pick-travelers"]'); await click('[data-a="pick-travelers-done"]');
    ok(await rowVal() === 'FALL', `${T} code kept while editing and navigating within the booking`);
    await click('[data-a="find-trains"]'); await w(900);
    ok(await ev(() => D().booking.codeText) === 'FALL', `${T} code kept through the Find trains check`);
    ok(await wallet() === before && !(await ev(() => savedCodes().some(c => c.code === 'FALL'))), `${T} entering and checking never adds to My coupons or Saved codes`);
    if ((await ev(() => sheet().stack.length)) > 1) await ev(() => { popTo(0); });
    await w(200);
    // abandon: Exit booking says the code isn't kept
    await click('.psheet [data-a="close"]');
    ok(/promotion code you entered isn’t kept/.test(await txt()), `${T} Exit booking says the typed code isn't kept`);
    await click('[data-dlg="1"]'); await w(300);
    ok(await ev(() => !nav().sheet && D().booking.codeText === '' && D().booking.from === 'NYP'), `${T} after abandoning: code cleared, trip details kept`);
    await click('[data-a="open-booking"]');
    ok(await rowVal() === 'Apply discount code', `${T} new booking starts with an empty code (row shows the prompt)`);
    ok(await wallet() === before, `${T} account coupons unchanged after abandoning`);
    // removing a typed code doesn't touch account coupons
    await openCode(); await p.fill(D_ + '#ff-code', 'ABCD'); await p.locator(D_ + '#ff-code').blur(); await w(250); await click('[data-a="code-remove"]'); await click('[data-a="dcode-done"]');
    ok(await ev(() => D().booking.codeText === '') && await wallet() === before, `${T} removing a typed code leaves account coupons alone`);
    // a saved code chosen from Saved codes is an account coupon: kept on abandoning, wallet unchanged
    await openCode(); await click('[data-a="code-saved"]'); await p.locator('.info-sheet [data-a="dcode-pick"][data-code="V123"]').click(); await w(300); await click('[data-a="dcode-done"]');
    await click('.psheet [data-a="close"]'); if (await p.locator(D_ + '[data-dlg="1"]').count()) await click('[data-dlg="1"]');
    ok(await ev(() => D().booking.codeText === 'V123') && await wallet() === before, `${T} a chosen saved code stays selected; wallet unchanged`);
    await click('[data-a="open-booking"]'); await openCode(); await click('[data-a="code-remove"]');
    ok(await wallet() === before && /still in My coupons/.test(await ev(() => (V().toast || {}).msg || '')), `${T} removing a saved code from the booking keeps it in My coupons`);
    // the close button with only a typed code: still asks, and still clears
    await click('[data-a="dcode-done"]'); await enterCode('WXYZ'); await p.focus(D_ + '#ff-coderow'); await p.keyboard.press('Escape'); await w(300);
    if (await p.locator(D_ + '[data-dlg="1"]').count()) await click('[data-dlg="1"]');
    ok(await ev(() => !nav().sheet && D().booking.codeText === ''), `${T} Escape → Exit booking clears the typed code`);
    // ---- Lounge passes removed ----
    await ev(() => { goLoc('coupons'); }); await w(400);
    const t = await txt();
    ok(!/lounge/i.test(t) && await ev(() => !D().coupons.some(c => /lounge/i.test(c.kind + c.name)) && !(D().couponsPast || []).some(c => /lounge/i.test(c.kind + c.name))), `${T} no lounge passes in My coupons (available, used or expired)`);
    ok(await p.locator(D_ + '.cpn [data-a="coupon-apply"]').count() === await ev(() => D().coupons.length), `${T} every available coupon has Apply`);
    await ev(() => { goLoc('profile'); }); await w(300); ok(/My coupons/.test(await txt()) && new RegExp(`${await ev(() => D().coupons.length)} available`).test(await txt()), `${T} coupon count matches the wallet`);
    await ev(() => { goLoc('ff'); }); await w(300); await openCode(); ok(/Saved codes 3 available/.test(await txt()), `${T} Saved codes count: 3`);
    await click('[data-a="code-saved"]'); ok(!/lounge/i.test(await ev(() => document.querySelector('.info-sheet').innerText)), `${T} saved-code picker has no lounge passes`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
