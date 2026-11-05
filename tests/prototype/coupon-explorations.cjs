// Coupon or promotional code explorations (Prototype controls › Coupon screen):
// 1 Deals in the coupon view (tabs), 2 Focused coupon view with a Deals entry beside it. Checks the preserved
// capabilities, deals behaviour, states (selected, empty, loading, error, used, expired, eligibility pending),
// navigation and axe, in both explorations. The current design stays the default.
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
  const open = (mode, o = {}) => ev(([mode, o]) => { CX.mode = mode; CX.data = o.data || 'ok'; TB.v = 1; TB.dev = 'iphone'; TB.theme = o.th || 'light'; VS[1] = makeVS(o.sc || 'returning'); V().toast = null; goLoc('ff'); const b = D().booking; b.from = o.from === undefined ? 'NYP' : o.from; b.to = o.to === undefined ? 'WAS' : o.to; if (o.code) { b.codeText = o.code; b.code = clone(D().coupons.find(c => c.code === o.code) || { code: o.code }); b.codeSrc = 'saved'; } render(); }, [mode, o]).then(() => w(400)).then(() => click('#ff-coderow', 700));

  // Current design stays the default
  ok(await ev(() => document.querySelector('#tbCmpCoupon').value) === 'current' && await ev(() => CX.mode) === 'current', 'default: Current design');
  ok(await ev(() => [...document.querySelectorAll('#tbCmpCoupon option')].map(o => o.textContent).join('|')) === 'Current design|Exploration 1 · Deals in the coupon view|Exploration 2 · Focused, deals beside it', 'Coupon screen control lists both explorations');

  for (const mode of ['integrated', 'focused']) {
    const T = mode === 'integrated' ? 'E1' : 'E2';
    const toDeals = async () => { if (mode === 'integrated') await click('[data-a="cx-tab"][data-v="deals"]'); else await click('[data-a="cx-deals"]', 600); };
    const back = () => click('.ads-navbar [data-a="back"]', 500);
    // ---- the primary view ----
    await open(mode);
    ok(await top() === 'ff>dcode' && /Coupon or promotional code/.test(await txt()), `${T} one primary view opened from the coupon row`);
    ok(await p.locator(D_ + '#ff-code').count() === 1 && await ev(() => { const f = document.querySelector('#device #ff-code'), s = document.querySelector('#device .cx-list, #device .cx-tabs'); return f.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING; }), `${T} manual entry comes first`);
    ok(await ev(() => { const l = document.querySelector('#device label[for="ff-code"]'), i = document.querySelector('#device .dcode__head [data-a="code-info"]'); return /^Code/.test(l.textContent) && i && i.getAttribute('aria-label') === 'About coupon and promotion codes'; }), `${T} info icon beside the Code label`);
    await click('.dcode__head [data-a="code-info"]', 400); ok(await ev(() => !!document.querySelector('.info-sheet')) && /About coupon and promotion codes/.test(await ev(() => document.querySelector('.info-sheet').innerText)), `${T} info opens the codes information`); await ev(() => A['info-close']()); await w(300);
    ok(await p.locator(D_ + '.pane [data-a="close"]').count() === 0 && await p.locator(D_ + '.ads-navbar [data-a="back"]').count() === 1, `${T} Back, no Close X`);
    // saved codes inline
    ok(await p.locator(D_ + 'input[data-a="cx-pick"]').count() === 3 && /Fall Northeast sale/.test(await txt()) && /V123/.test(await txt()) && /Expires Nov 30, 2026/.test(await txt()) && /Northeast Regional, Coach/.test(await txt()), `${T} current saved codes inline with title, code, expiry and restrictions`);
    ok(await ev(() => !document.querySelector('.info-sheet') && !document.querySelector('#device [data-a="code-saved"]')), `${T} no saved-code sheet stacked over the coupon view`);
    // used and expired: secondary, distinguished, not applicable
    ok(await ev(() => { const d = document.querySelector('#device details.cx-past'); return d && !d.open && /Used and expired \(2\)/.test(d.querySelector('summary').textContent); }), `${T} used and expired in a closed disclosure`);
    await click('details.cx-past > summary', 300);
    ok(await ev(() => { const d = document.querySelector('#device details.cx-past'); return d.open && /Used/.test(d.innerText) && /Expired/.test(d.innerText) && !d.querySelector('input, [data-a="cx-pick"], [data-a="cx-usecode"]') && /Can’t be applied/.test(d.innerText); }), `${T} used and expired codes are badged and can't be applied`);
    await ev(() => render()); await w(200); ok(await ev(() => document.querySelector('#device details.cx-past').open), `${T} disclosure stays open across updates`);
    // select a saved code: fills the field, says it's checked later, never valid
    await click('label:has(input[data-code="V123"])', 400);
    ok((await bk()).codeText === 'V123' && await ev(() => document.querySelector('#device #ff-code').value) === 'V123' && await ev(() => document.querySelector('#device input[data-code="V123"]').checked), `${T} choosing a saved code fills the field (selected state)`);
    ok(/Fall Northeast sale selected\. We’ll check this code when you find trains\./.test(await txt()) && !/Code applied|valid for/.test(await txt()), `${T} selected code isn't presented as valid before the check`);
    // clear and manual entry
    await click('[data-a="code-remove"]', 400); ok((await bk()).codeText === '' && await ev(() => !document.querySelector('#device input[data-a="cx-pick"]:checked')), `${T} Clear empties the field and the selection`);
    await p.fill(D_ + '#ff-code', 'zx9a'); await p.locator(D_ + '#ff-code').blur(); await w(300);
    ok((await bk()).codeText === 'ZX9A' && /We’ll check this code when you find trains/.test(await txt()), `${T} typing a code (edited to upper case)`);
    // code details (secondary view) and Back
    await click('[data-a="cx-codeinfo"][data-code="60412233445566"]', 600);
    ok(await top() === 'ff>dcode>cx-code' && /Needs at least 2 travelers/.test(await txt()) && await p.locator(D_ + '[data-a="cx-usecode"]').count() === 1, `${T} code details in a secondary view`);
    await back(); ok(await top() === 'ff>dcode' && (await bk()).codeText === 'ZX9A', `${T} Back from details keeps the typed code`);
    // ---- deals ----
    await toDeals();
    const t = await txt();
    ok(/Deals for this trip/.test(t) && /Northeast midweek saver/.test(t) && /Matches your trip/.test(t) && /Final check when you find trains/.test(t), `${T} deals for this trip: a match is labelled and still checked at Find trains`);
    ok(/Saver fares/.test(t) && /Needs checking/.test(t) && /No code needed/.test(t), `${T} eligibility pending explains what still needs checking`);
    ok(!/Kids ride for half[^]*Deals for this trip/.test(t) && /Saved deals/.test(t) && /different from codes saved to your account/.test(t), `${T} saved deals distinguished from saved codes`);
    ok(await ev(() => { const k = [...document.querySelectorAll('#device .cx-deal')].find(l => /Kids ride for half/.test(l.innerText)); return k && /Doesn’t match this trip/.test(k.innerText) && /Add a child aged 2 to 12/.test(k.innerText) && k.querySelector('[data-a="cx-usedeal"]').disabled; }), `${T} a saved deal that doesn't fit says why and can't be used`);
    // replace an existing code with a deal
    await click('[data-a="cx-usedeal"][data-id="midweek"]', 400);
    ok(await dlg() === 'Replace your code?' && /Only one coupon or promotion code can be used per booking\. Northeast midweek saver \(MIDW\) will replace the code ZX9A\./.test(await ev(() => document.querySelector('.pdialog').innerText.replace(/\s+/g, ' '))), `${T} using a deal over another code asks to replace it`);
    await p.locator('.pdialog [data-dlg="1"]').click(); await w(300); ok((await bk()).codeText === 'ZX9A', `${T} Keep current code keeps it`);
    await click('[data-a="cx-usedeal"][data-id="midweek"]', 400); await p.locator('.pdialog [data-dlg="0"]').click(); await w(700);
    ok((await bk()).codeText === 'MIDW' && await top() === 'ff>dcode' && await ev(() => document.querySelector('#device #ff-code').value) === 'MIDW' && /Northeast midweek saver selected\. We’ll check this code when you find trains/.test(await txt()), `${T} Use deal fills the Code field in the coupon view`);
    // save / unsave a deal
    await toDeals(); await click('[data-a="cx-savedeal"][data-id="midweek"]', 400);
    ok(await ev(() => D().savedDeals.includes('midweek')) && await ev(() => document.querySelector('#device [data-a="cx-savedeal"][data-id="midweek"]').getAttribute('aria-pressed')) === 'true', `${T} save a deal (pressed state)`);
    // terms in a secondary view
    await click('[data-a="cx-dealinfo"][data-id="weekend"]', 600);
    ok(await top() === (mode === 'integrated' ? 'ff>dcode>cx-deal' : 'ff>dcode>cx-deals>cx-deal') && /Terms/.test(await txt()) && /Depart Friday, Saturday or Sunday/.test(await txt()) && /One coupon or promotion code per booking/.test(await txt()), `${T} deal terms in a secondary view, with the combining rule`);
    ok(await p.locator(D_ + '.pane__foot [data-a="cx-usedeal"]:disabled').count() === 1, `${T} Use deal disabled for a deal that doesn't fit, with the reason`);
    await back();
    // browse all deals and back: booking preserved
    const before = JSON.stringify(await bk());
    await click('[data-a="cx-alldeals"]', 600);
    ok(/All deals/.test(await txt()) && await ev(() => document.querySelectorAll('#device .cx-deal').length) === 6, `${T} Browse all deals lists every offer`);
    await back(); if (mode === 'focused') await back();
    ok(await top() === 'ff>dcode' && JSON.stringify(await bk()) === before && await ev(() => document.querySelector('#device #ff-code').value) === 'MIDW', `${T} back from browsing: booking and code unchanged`);
    await axe(`${T} light`);
    // Done returns to booking with the selection
    await click('[data-a="dcode-done"]', 500);
    ok(await top() === 'ff' && /MIDW/.test(await ev(() => document.querySelector('#device #ff-coderow').innerText)), `${T} Done returns to New booking with the code`);
    // validation timing unchanged: a bad format is caught at Find trains
    await ev(() => { setCodeText(D().booking, 'AB1'); render(); }); await click('[data-a="find-trains"]', 500);
    ok((await bk()).codeState === 'invalid' && /This code isn’t valid/.test(await txt()), `${T} the code is still checked at Find trains`);
    await click('#ff-coderow', 600); ok(/This code isn’t valid/.test(await txt()) && await ev(() => document.querySelector('#device #ff-code').getAttribute('aria-invalid')) === 'true', `${T} the error shows on the Code field too`);

    // ---- states ----
    await open(mode, { data: 'loading' });
    ok(await p.locator(D_ + '.cpn-loading[role="status"]').count() >= 1 && await p.locator(D_ + '#ff-code').count() === 1, `${T} loading: placeholders, code entry still available`);
    await w(1700); ok(await p.locator(D_ + 'input[data-a="cx-pick"]').count() === 3, `${T} loading finishes`);
    await open(mode, { data: 'error' });
    ok(/We couldn’t load your saved codes/.test(await txt()) && /You can still enter a code above/.test(await txt()) && await p.locator(D_ + '[data-a="cx-retry"]').count() === 1, `${T} error: message, Try again, entry still works`);
    await axe(`${T} error`);
    await click('[data-a="cx-retry"]', 1600); ok(await p.locator(D_ + 'input[data-a="cx-pick"]').count() === 3, `${T} Try again loads the codes`);
    await open(mode, { data: 'empty' });
    ok(/No saved codes/.test(await txt()) && await p.locator(D_ + 'details.cx-past').count() === 0, `${T} empty: no saved codes, no history`);
    await toDeals(); ok(/No deals for this trip right now/.test(await txt()) && /No saved deals/.test(await txt()), `${T} empty: no deals`);
    await open(mode, { from: '', to: '' }); await toDeals();
    ok(await ev(() => { const a = [...document.querySelectorAll('#device .cx-deal')].find(l => /Auto Train fall offer/.test(l.innerText)); return a && /Needs checking/.test(a.innerText) && /Choose your stations/.test(a.innerText) && !a.querySelector('[data-a="cx-usedeal"]').disabled; }), `${T} without stations, route deals are pending (not matched)`);
    await open(mode, { sc: 'guest' });
    ok(/Sign in to see your saved codes/.test(await txt()), `${T} guest: sign in for saved codes, entry still works`);
    await open(mode, { code: 'V123', th: 'dark' }); await axe(`${T} dark, code selected`);
  }
  // switching back to Current design restores the original screen
  await ev(() => { CX.mode = 'current'; render(); }); await w(300);
  ok(await p.locator(D_ + '[data-a="code-saved"]').count() === 1 && await p.locator(D_ + '.cx-entry').count() === 0, 'Current design: original code screen');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
