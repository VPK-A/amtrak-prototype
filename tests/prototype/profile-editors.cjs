// Profile editors and My coupons against Figma Sprint 4 (3418:113979 Middle initial, 3427:120590 Phone, 3427:124991
// Billing address, 3430:129513 Date of birth, 3430:133325 Passenger discounts, 3430:137973 Assistance requests,
// 3430:140680 Employee pass, 3430:147004 My coupons): chevron Back, title, plain close, Save in the action footer, no
// grabber; Save with nothing changed returns; required markers kept on Billing address and Employee pass; axe.
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
  const top = () => ev(() => sheet().stack.at(-1).s);
  const open = async (k, sc = 'returning', th = 'light') => { await ev(([sc, th]) => { TB.v = 1; TB.dev = 'iphone'; TB.theme = th; VS[1] = makeVS(sc); goLoc('profile'); }, [sc, th]); await w(500); await p.click(`${D_}[data-k="${k}"]`); await w(600); };
  const pane = () => ev(() => [...document.querySelectorAll('#device .pane')].pop().innerText);
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };
  const shell = () => ev(() => { const pn = [...document.querySelectorAll('#device .pane')].pop(); const b = pn.querySelector('.ads-navbar [data-a="back"]'); return { title: pn.querySelector('.ads-navbar__title').textContent, iconBack: !!b && b.classList.contains('ads-navbar__iconback') && !b.textContent.trim(), close: !!pn.querySelector('.ads-navbar__trail [data-a="close"]'), save: (pn.querySelector('.pane__foot .ads-btn--block') || {}).textContent, cancel: !!pn.querySelector('.ads-navbar__btn'), grabber: !!document.querySelector('#device .psheet .ads-sheet__grabber') }; });

  for (const [k, title, sc, close] of [['row-mi', 'Middle initial'], ['row-phone', 'Phone'], ['row-address', 'Billing address'], ['row-dob', 'Date of birth'], ['row-disc', 'Passenger discounts'], ['row-assist', 'Assistance requests'], ['row-employee', 'Employee pass', 'passrider'], ['row-coupons', 'My coupons', 'returning', false]]) {
    await open(k, sc);
    const s = await shell();
    ok(s.title === title && s.iconBack && s.close === (close !== false) && s.save === 'Save' && !s.cancel && !s.grabber, `${title}: chevron Back, title, ${close === false ? 'no close' : 'close'}, Save in the footer, no grabber (${JSON.stringify(s)})`);
    if (k !== 'row-coupons') { await p.click(D_ + '.pane__foot [data-a]'); await w(500); ok(await top() === 'profile', `${title}: Save with nothing changed returns to Profile`); }
  }
  // Middle initial: no marker, helper
  await open('row-mi'); ok(/One letter\. You can add this once; it can’t be changed later\./.test(await pane()) && await p.locator(D_ + 'label[for="ed-mi"] .ads-field__marker').count() === 0, 'Middle initial: helper, no marker');
  await p.click(D_ + '.pane__foot [data-a="edit-save"]'); await w(300);
  // Phone card
  await open('row-phone');
  ok(await ev(() => { const c = document.querySelector('#device .ed-card'); return c && /Mobile phone number/.test(c.querySelector('.ed-card__title').textContent) && c.querySelector('#ph-mobile') && c.querySelector('input[name="ph-region"]'); }) && /Must be 10 digits; numbers only\./.test(await pane()) && /Switching the type keeps the number you entered for each type\./.test(await pane()), 'Phone: one card with the number, Number type and helpers');
  ok(await ev(() => document.querySelector('#device #ph-mobile').compareDocumentPosition(document.querySelector('#device input[name="ph-region"]')) & Node.DOCUMENT_POSITION_FOLLOWING), 'Phone: the number comes before Number type');
  await p.click(D_ + '[data-a="ph-more"]'); await w(300);
  ok(await p.locator(D_ + '.ed-card').count() === 2 && await p.locator(D_ + '#ph-home').count() === 1 && await p.locator(D_ + '[data-a="ph-more"]').count() === 0, 'Add phone number adds a card for other numbers');
  await p.fill(D_ + '#ph-mobile', '2154445358'); await w(200); await p.click(D_ + '.pane__foot [data-a="edit-save"]'); await w(1200);
  ok(await top() === 'profile' && await ev(() => D().profile.phone.mobile) === '2154445358', 'Phone: Save stores a change and returns');
  // Billing address
  await open('row-address');
  const req = await ev(() => ['ad-country', 'ad-street', 'ad-city', 'ad-state', 'ad-zip'].every(id => document.querySelector(`#device label[for="${id}"] .ads-field__marker--required`)) && !!document.querySelector('#device label[for="ad-apt"] .ads-field__marker--optional'));
  ok(req, 'Billing address: required markers kept; Apt optional');
  ok(await ev(() => { const s = document.querySelector('#device #ad-state').getBoundingClientRect(), z = document.querySelector('#device #ad-zip').getBoundingClientRect(); return z.top > s.bottom && Math.abs(s.width - z.width) < 2; }) && await p.locator(D_ + '.tworow').count() === 0, 'Billing address: State, then ZIP code, one column');
  ok(await p.locator(D_ + '.ads-btn--destructive[data-a="addr-remove"]').count() === 1, 'Billing address: Remove billing address is a destructive button');
  await axe('Billing address');
  await p.click(D_ + '.pane .ads-navbar [data-a="back"]'); await w(400);
  // Date of birth
  await open('row-dob'); ok(await ev(() => document.querySelector('#device #ed-dob').placeholder) === 'MM/DD/YYYY' && await p.locator(D_ + 'label[for="ed-dob"] .ads-field__marker--optional').count() === 1 && await p.locator(D_ + '#ed-dob-h').count() === 0, 'Date of birth: optional, placeholder, no helper');
  await p.fill(D_ + '#ed-dob', '13/45/1990'); await w(200); await p.click(D_ + '.pane__foot [data-a="edit-save"]'); await w(300);
  ok(await top() === 'edit' && /Enter a valid date/.test(await pane()), 'Date of birth: invalid date blocked');
  await p.click(D_ + '.pane .ads-navbar [data-a="back"]'); await w(400); ok(await ev(() => nav().dialog && nav().dialog.title) === 'Discard changes?', 'Back with changes asks Discard changes?'); await ev(() => closeDialog(nav().dialog.actions[1][2])); await w(300);
  // Passenger discounts
  await open('row-disc'); ok(!/content pending/.test(await pane()) && /Passenger types and discount rules/.test(await pane()), 'Passenger discounts: descriptions as in the design; rules link');
  // Assistance requests
  await open('row-assist'); ok(await ev(() => [...document.querySelectorAll('#device input[name$="-cat"]')].map(i => i.value).join()) === 'disability,station' && !/With nothing selected/.test(await pane()), 'Assistance requests: two types, no empty-state line');
  // Employee pass
  await open('row-employee', 'passrider');
  ok(await ev(() => ['ee-rel', 'ee-pass', 'ee-index'].every(id => document.querySelector(`#device label[for="${id}"] .ads-field__marker--required`))) && /Must be 9 digits\./.test(await pane()) && /Must be 3 digits\./.test(await pane()), 'Employee pass: required markers kept; helpers');
  await axe('Employee pass');
  // My coupons
  await open('row-coupons');
  ok(/Coupons sent to you by email can be added here and used by anyone you share them with\./.test(await pane()) && await ev(() => document.querySelector('#device #cpn-in').placeholder) === 'Apply code' && await p.locator(D_ + '.cpn-addcard [data-a="code-info"]').count() === 1 && /Codes should be 4 or 14 characters long\./.test(await pane()), 'My coupons: intro, add card with info, field and helper');
  const rows = await ev(() => [...document.querySelectorAll('#device .cpl-list[aria-label="Available coupons"] .cpl')].map(r => r.innerText.replace(/\n/g, ' | ')));
  ok(rows.length === 3 && /Fall Northeast sale \| Code: V123 \| Expires: \d\d\/\d\d\/\d{4} \| 20% off Northeast Regional Coach\./.test(rows[0]) && await p.locator(D_ + '.cpl-list[aria-label="Available coupons"] .cpl__info').count() === 3, `Available: name, code, expiry, benefit, info (${rows[0]})`);
  ok(await ev(() => document.querySelector('#device #cpn-past-h').getAttribute('aria-expanded')) === 'false' && await p.locator(D_ + '#cpn-past-panel[hidden]').count() === 1, 'Used and expired starts collapsed');
  await p.click(D_ + '#cpn-past-h'); await w(300);
  ok(await ev(() => document.querySelector('#device #cpn-past-h').getAttribute('aria-expanded')) === 'true' && await p.locator(D_ + '#cpn-past-panel .cpl').count() >= 1, 'Used and expired expands');
  await p.click(D_ + '.cpl__info >> nth=0'); await w(400); ok(await ev(() => !!nav().info), 'the info button opens coupon details'); await ev(() => A['info-close']()); await w(300);
  await p.fill(D_ + '#cpn-in', 'ab'); await w(100); await p.click(D_ + '[data-a="coupon-add"]'); await w(300);
  ok(/This code isn’t valid/.test(await pane()) && await ev(() => document.querySelector('#device #cpn-in').value) === 'AB' || /This code isn’t valid/.test(await pane()), 'wrong length: inline error');
  await p.fill(D_ + '#cpn-in', '60111122223333'); await w(100); await p.click(D_ + '.pane__foot [data-a="coupons-save"]'); await w(1500);
  ok(await top() === 'profile' && await ev(() => D().coupons.some(c => c.code === '60111122223333')), 'Save adds a typed code and returns to Profile');
  await open('row-coupons'); await axe('My coupons');
  await open('row-phone', 'returning', 'dark'); await axe('Phone, dark');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
