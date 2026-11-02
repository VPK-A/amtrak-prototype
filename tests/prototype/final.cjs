// Final review: refinements 1-15, Profile stories, saved preferences, email artifacts, eligibility (both concepts)
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); if (!c) console.log('FAIL ' + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), D = '#device ', ev = (f, a) => p.evaluate(f, a);
  const go = (v, sc, loc = 'ff', net = 'online') => ev(([v, sc, loc, net]) => { TB.v = v; TB.dev = 'iphone'; TB.text = 100; TB.theme = 'light'; VS[v] = makeVS(sc); VS[v].net = net; V().toast = null; goLoc(loc); }, [v, sc, loc, net]);
  const dclick = async sel => { await p.locator(D + sel).first().dispatchEvent('click'); await w(250); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const stack = () => ev(() => nav().sheet ? nav().sheet.stack.map(r => r.s).join('>') : '');
  const dlg = () => ev(() => nav().dialog && nav().dialog.title);
  const dlgBtn = async i => { await p.locator(D + `[data-dlg="${i}"]`).click(); await w(350); };
  const pickMode = async v => { await dclick('[data-a="mode-open"]'); await p.locator(`.info-sheet [data-a="mode-pick"][data-v="${v}"]`).dispatchEvent('click'); await w(250); };
  for (const v of [1, 3]) {
    const T = `C${v}`;
    // 1 avatar token
    await go(v, 'returning', 'tab:book');
    const av = await ev(() => { const a = document.querySelector('#device .ads-appheader .ads-avatar'), c = getComputedStyle(a), probe = document.createElement('i'); probe.style.background = 'var(--ads-background-surface-selected)'; document.querySelector('#device').appendChild(probe); const want = getComputedStyle(probe).backgroundColor; probe.remove(); return [c.backgroundColor, want]; });
    ok(av[0] === av[1], `${T} 1 avatar fill is the surface-selected token (${av[0]})`);
    // 2 Book landing focus
    const t2 = await txt();
    ok(!/Recommended trips|Favorite stations|Routes near me|Book again|Rebook|Explore/.test(t2) && /New booking/.test(t2) && /Passes/.test(t2), `${T} 2 Book landing: no discovery, rebooking or Explore; New booking kept`);
    await go(v, 'returning', 'stations:from'); ok(await p.locator(D + '[aria-label="Favorite stations"]').count() === 1, `${T} 2 favorites still in the station selector`);
    // 3-6 coupon field and saved codes
    await go(v, 'returning'); const t3 = await txt();
    ok(/Coupon or promotion code Optional/.test(t3) && !/Discount code/.test(t3), `${T} 3 label "Coupon or promotion code", optional`);
    ok(await ev(() => !document.querySelector('#device #dcode .ads-icon--payment-voucher')), `${T} 4 no ticket icon in the field`);
    ok(await p.locator(D + '#dcode .ads-group [data-a="code-saved"]').count() === 1 && /Saved codes 3 available/.test(t3) && await p.locator(D + '.dcode__saved, .linkbtn[data-a="code-saved"]').count() === 0, `${T} 6 saved codes is a DS row with count and chevron`);
    await dclick('[data-a="code-saved"]');
    ok(await ev(() => { const s = document.querySelector('.info-sheet'); return s && /^Saved codes/.test(s.querySelector('.info-title').textContent) && /Choose a coupon or promotion code for this trip\./.test(s.innerText) && /Expires/.test(s.innerText); }), `${T} 5 saved-code sheet copy, expiry kept`);
    await p.locator('.info-sheet [data-a="dcode-pick"][data-code="V123"]').dispatchEvent('click'); await w(300);
    ok(await ev(() => D().booking.codeText === 'V123' && D().booking.codeState === '') && /selected/.test(await txt()) && !/Code applied/.test(await txt()), `${T} 5 selecting doesn't apply before validation`);
    ok(await p.locator(D + '#ff-code').inputValue() === 'V123', `${T} 3 manual field shows the selected code`);
    // 7 cash/points radio group
    const pay = await ev(() => { const f = document.querySelector('#device .payset'); if (!f) return null; const fb = document.querySelector('#device [data-a="find-trains"]').getBoundingClientRect(), r = f.getBoundingClientRect(); return { radios: f.querySelectorAll('input[type=radio]').length, h: Math.round(r.height), btnH: Math.round(fb.height), checked: f.querySelector('input:checked').dataset.v }; });
    ok(pay && pay.radios === 2 && pay.checked === 'cash' && pay.h < pay.btnH, `${T} 7 cash/points is a compact radio group, cash default (${JSON.stringify(pay)})`);
    await dclick('.payset input[data-v="points"]'); ok(await ev(() => D().booking.pay) === 'points' && await p.locator(D + '#ff-code').count() === 0, `${T} 7 points hides the code field`);
    await go(v, 'guest'); await dclick('.payset input[data-v="points"]'); ok(/sign in to use your points after you choose a fare/.test(await txt()), `${T} 7 guest points kept`);
    // 8 no "Choosing"
    await go(v, 'returning', 'stations:to'); ok(!/Choosing|Changing/.test(await txt()), `${T} 8 station search without "Choosing"`);
    await go(v, 'returning', 'calendar:dep'); await ev(() => { D().booking.trip = 'rt'; D().booking.ret = D().booking.dep; render(); }); ok(!/Choosing/.test(await ev(() => document.querySelector('#device').innerHTML)), `${T} 8 calendar without "Choosing" (incl. labels)`);
    // 9-10 favorites star, selected state
    await go(v, 'returning', 'stations:from'); await ev(() => { D().booking.from = 'NYP'; render(); });
    ok(await p.locator(D + '[data-a="fav"] .ads-icon--bookmark-filled').count() >= 1 && await p.locator(D + '.ads-icon--star, .ads-icon--star-filled').count() === 0, `${T} 9 bookmark icons, no star`);
    await dclick('[data-a="fav"][data-code="PHL"]'); ok(await ev(() => favList(D()).join()) === 'NYP,PHL', `${T} 9 favorite add keeps alphabetical order`);
    await dclick('[data-a="fav"][data-code="PHL"]'); ok(await ev(() => !D().fav.includes('PHL')), `${T} 9 favorite remove`);
    const sel = await ev(() => { const li = document.querySelector('#device .ads-stationrow[aria-current="true"]'); return li && { check: !!li.querySelector('.ss-check'), sr: /selected/.test(li.innerText), bg: getComputedStyle(li.querySelector('.ads-stationrow__select')).backgroundColor }; });
    ok(sel && sel.check && sel.sr, `${T} 10 selected station: check icon and "selected" text, not color alone`);
    await go(v, 'passrider', 'stations:from'); await ev(() => { D().booking.prType = 'business'; render(); }); await p.fill(D + '#ss-q', 'Lorton'); await w(150);
    ok(await p.locator(D + '[data-a="choose-station"][data-code="LOR"]').first().isDisabled(), `${T} 10 disabled station state (Auto Train in Business)`);
    // 11 service animal inside the questionnaire only
    await go(v, 'returning', 'travelers'); ok(!/Bringing a service animal/.test(await txt()), `${T} 11 no standalone service-animal shortcut on Travelers`);
    await p.evaluate(() => { const b = D().booking, on = !travelerList(b).some(t => asks(b, t.key)); travelerList(b).forEach(t => setAsk(b, t.key, on)); render(); }); await ev(() => { V().net = 'online'; }); await dclick('[data-a="assist-answer"][data-t="adult-1"]'); await w(950);
    await ev(() => { const r = sheet().stack[sheet().stack.length - 1]; r.u.d = { cat: 'disability', dis: ['vision'], wc: '', needs: [], for: '' }; render(); }); await w(150);
    ok(await p.locator(D + '[data-topic="service-animals"]').count() === 1 && /Large service animal/.test(await txt()), `${T} 11 service-animal guidance inside the disability branch`);
    // 12 title Assistance + traveler label
    ok(await ev(() => [...document.querySelectorAll('#device .sheet-layer h2, #device .sheet-layer h3')].some(h => h.textContent.trim() === 'Assistance')) && /For Traveler 1 · Adult/.test(await txt()), `${T} 12 title "Assistance" with traveler label`);
    // 13 DS stepper and limits
    await go(v, 'returning', 'travelers');
    const step = await ev(() => { const c = document.querySelector('#device .ffc-count .ads-counter'), s = c.querySelector('.ads-counter__step'), cs = getComputedStyle(c); return { radius: cs.borderTopLeftRadius, h: s.getBoundingClientRect().height, minusAdult: document.querySelector('#device [data-a="pax"][data-k="adult"][data-d="-1"]').getAttribute('aria-label') }; });
    ok(step.radius !== '999px' && step.h >= 40 && /Remove one: Adult/.test(step.minusAdult), `${T} 13 DS stepper (radius ${step.radius}, ${step.h}px steps, labeled)`);
    ok(await p.locator(D + '[data-a="pax"][data-k="senior"][data-d="-1"]').isDisabled(), `${T} 13 minimum disables decrement`);
    await ev(() => { D().booking.pax.adult = 8; render(); }); ok(await p.locator(D + '[data-a="pax"][data-k="adult"][data-d="1"]').isDisabled(), `${T} 13 8-seat maximum disables increment`);
    // 14 exit booking
    await go(v, 'returning'); await ev(() => { D().booking.from = 'NYP'; D().booking.to = 'WAS'; D().booking.pax.adult = 2; render(); });
    await dclick('[data-a="pick-travelers"]'); await w(300);
    await p.locator(D + '.sheet-layer [data-a="close"]').first().dispatchEvent('click'); await w(300);
    ok(await dlg() === 'Exit booking?' && await ev(() => nav().dialog.actions.map(a => a[0]).join()) === 'Keep booking,Exit booking', `${T} 14 close asks "Exit booking?" with Keep/Exit`);
    await dlgBtn(0); ok(await stack() === 'ff>travelers' && await ev(() => D().booking.pax.adult === 2 && D().booking.from === 'NYP'), `${T} 14 Keep booking keeps the step and values`);
    await dclick('[data-a="back"], [data-a="pick-travelers-done"]'); await w(300);
    ok(await stack() === 'ff' && !(await dlg()), `${T} 14 Back between levels doesn't ask`);
    await p.keyboard.press('Escape'); await w(200); await ev(() => { if (!nav().dialog) { document.querySelector('#device .sheet-layer').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } }); await w(200);
    ok(await dlg() === 'Exit booking?', `${T} 14 Escape at the root asks too`); await dlgBtn(0);
    await ev(() => A.scrim(null, '0')); await w(200); ok(await dlg() === 'Exit booking?', `${T} 14 scrim asks too`);
    await dlgBtn(1); ok(!(await stack()) && await ev(() => D().booking.from === 'NYP'), `${T} 14 Exit booking closes; trip details kept per retention policy`);
    // 15 booking type entry and sheet, per eligibility group
    const groups = { triplink: ['Corporate (TripLink)', 'Personal'], passrider: ['Pass Rider', 'Regular'], 'passrider-nopass': ['Pass Rider', 'Regular'], 'passrider-retiree': ['Pass Rider', 'Regular'], 'passrider-spouse': ['Pass Rider', 'Regular'], 'passrider-dependent': ['Pass Rider', 'Regular'], 'passrider-minor': ['Pass Rider', 'Regular'], 'triplink-passrider': ['Corporate (TripLink)', 'Pass Rider', 'Regular'], returning: null, guest: null };
    for (const [sc, opts] of Object.entries(groups)) {
      await go(v, sc); const has = await p.locator(D + '[data-a="mode-open"]').count();
      if (!opts) { ok(has === 0, `${T} 15 ${sc}: no booking type entry`); continue; }
      await dclick('[data-a="mode-open"]'); const got = await ev(() => [...document.querySelectorAll('.info-sheet [data-a="mode-pick"]')].map(i => i.closest('label').querySelector('.ads-choice__label > span').textContent).join(','));
      ok(has === 1 && got === opts.join(','), `${T} 15 ${sc}: only eligible modes (${got})`);
      await ev(() => { nav().info = null; render(); });
    }
    ok(await p.locator(D + '[data-key="intent"]').count() === 0, `${T} 15 no stacked mode switches`);
    await go(v, 'triplink-passrider'); ok(/Booking type Regular/.test(await txt()) && await ev(() => D().booking.intent) === 'standard', `${T} 15 dual eligibility: nothing special preselected`);
    // mode changes update points, coupons, discounts, travelers
    await go(v, 'passrider'); await pickMode('personal');
    ok(await p.locator(D + '#ff-code').count() === 1 && await p.locator(D + '.payset').count() === 1 && /Booking type Regular/.test(await txt()), `${T} mode → Regular: code and points back`);
    await pickMode('pr'); ok(await p.locator(D + '#ff-code').count() === 0 && await p.locator(D + '.payset').count() === 0 && await p.locator(D + '[data-a="pr-type"]').count() === 2, `${T} mode → Pass Rider: code and points gone, travel type shown`);
    await go(v, 'triplink'); ok(/Booking type Corporate \(TripLink\)/.test(await txt()) && await p.locator(D + '[data-a="pr-type"]').count() === 0, `${T} TripLink separate from Pass Rider Business`);
    await pickMode('personal'); await ev(() => { D().booking.pax.adult = 3; render(); }); await pickMode('corporate'); ok(await ev(() => paxAll(D().booking.pax)) === 1, `${T} corporate keeps 1 traveler`);
    await go(v, 'passrider-minor'); await pickMode('pr'); ok(await ev(() => D().booking.intent) === 'standard' && /15 or younger/.test(await ev(() => document.querySelector('.info-sheet').innerText)), `${T} minor dependent can't start Pass Rider; reason shown`);
    await ev(() => { nav().info = null; render(); });
    for (const [sc, comp] of [['passrider', true], ['passrider-nopass', true], ['passrider-retiree', false], ['passrider-spouse', false], ['passrider-dependent', false]]) {
      await go(v, sc, 'travelers'); await ev(() => { if (!D().booking.prType) D().booking.prType = 'leisure'; render(); });
      ok((await p.locator(D + '[data-k="comp"]').count() > 0) === comp, `${T} ${sc}: companion passes ${comp ? 'shown' : 'hidden'}`);
    }
    // traveler answers stay separate
    await go(v, 'returning'); await ev(() => { const b = D().booking; b.pax.adult = 2; b.assistOn = true; setAssistRec(b, 'adult-1', { cat: 'disability', dis: ['vision'], wc: null, needs: [] }); setAssistRec(b, 'adult-2', { cat: 'station', dis: [], wc: null, needs: ['seat'] }); b.tdisc['adult-2'] = 'military'; render(); });
    ok(await ev(() => { const b = D().booking; return assistRec(b, 'adult-1').m.cat === 'disability' && assistRec(b, 'adult-2').m.cat === 'station' && tdiscOf(b, { key: 'adult-1', type: 'adult', i: 1 }) === 'pwd' && tdiscOf(b, { key: 'adult-2', type: 'adult', i: 2 }) === 'military'; }), `${T} individual traveler answers and discounts stay separate`);
    // Profile defaults vs booking edits
    await go(v, 'assist'); ok(await ev(() => D().booking.assistDone && D().booking.assistFromProfile), `${T} profile assistance prefills Traveler 1`);
    await ev(() => { setAssistRec(D().booking, 'adult-1', { cat: 'station', dis: [], wc: null, needs: [] }); }); ok(await ev(() => D().assist.cat) === 'disability', `${T} booking edit doesn't change Profile`);
    // ---- Profile stories ----
    await go(v, 'passrider', 'profile'); const tp = await txt();
    ok(/Alex Rivera/.test(tp) && /7012 3456 78/.test(tp) && /1-800-307-5000/.test(tp) && /Assistance requests/.test(tp), `${T} 19 name/number read-only, Customer Care, Assistance in Profile`);
    // MI once
    await go(v, 'returning', 'edit:mi'); await p.fill(D + 'input[data-f="mi"]', 'J'); await p.locator(D + 'input[data-f="mi"]').dispatchEvent('change'); await w(80); await dclick('[data-a="edit-save"]'); await w(300); if (await dlg()) await dlgBtn(1); await w(1000);
    ok(await ev(() => D().profile.mi === 'J') && await p.locator(D + '[data-a="edit"][data-field="mi"]').count() === 0, `${T} 19 middle initial added once, then read-only`);
    // DOB invalid then valid
    await go(v, 'returning', 'edit:dob'); await p.fill(D + 'input[data-f="dob"]', '02/30/1990'); await p.locator(D + 'input[data-f="dob"]').dispatchEvent('change'); await w(80); await dclick('[data-a="edit-save"]'); await w(300);
    ok(/Please enter a valid date/.test(await txt()), `${T} 919 invalid date error`);
    await p.fill(D + 'input[data-f="dob"]', '04/15/1988'); await p.locator(D + 'input[data-f="dob"]').dispatchEvent('change'); await w(80); await dclick('[data-a="edit-save"]'); await w(1000);
    ok(await ev(() => D().profile.dob) === '04/15/1988', `${T} 919 date saved`);
    // NMA-20
    await go(v, 'passrider', 'edit:employee'); const te = await txt();
    ok(await p.locator(D + 'input[data-f="emp"]').count() === 0 && !/remove/i.test(te) && /Remaining passes 5 of 16/.test(te) && /New passes are issued Jan 1, 2027/.test(te), `${T} 20 no delete control; remaining passes and renewal`);
    await p.fill(D + 'input[data-f="pass"]', '12345'); await p.locator(D + 'input[data-f="pass"]').dispatchEvent('change'); await w(80); await dclick('[data-a="edit-save"]'); await w(300);
    ok(/Pass number not recognized/.test(await txt()), `${T} 20 validation`);
    for (const sc of ['passrider-dependent', 'passrider-spouse', 'passrider-retiree']) { await go(v, sc, 'edit:employee'); ok(!/Remaining passes|of 16/.test(await txt()), `${T} 20 ${sc} sees no allocated pass counts`); }
    await go(v, 'passrider-removed', 'profile'); ok(/employee pass/i.test(await txt()) && /Not added/.test(await txt()) && await ev(() => D().booking.intent) === 'standard', `${T} 20 backend removal: details gone, Pass Rider off`);
    await go(v, 'new', 'edit:employee'); await p.fill(D + 'input[data-f="pass"]', '418200774'); await p.locator(D + 'input[data-f="pass"]').dispatchEvent('change'); await p.fill(D + 'input[data-f="index"]', '001'); await p.locator(D + 'input[data-f="index"]').dispatchEvent('change'); await w(80); await dclick('[data-a="edit-save"]'); await w(1000);
    ok(await ev(() => !!D().employee) && /Pass details added/.test(await txt()), `${T} 20 add with save feedback`);
    // NMA-21 email change + notifications
    await go(v, 'returning', 'verify:change-email'); await p.fill(D + '#vf-new', 'alex.new@example.com'); await p.locator(D + '#vf-new').dispatchEvent('change'); await dclick('[data-a="vf-newemail"]'); await w(900);
    await p.fill(D + '#vf-code', '123456').catch(() => {}); await ev(() => { const c = nav().cover; if (c) { c.u.d.code = '123456'; render(); } }); await dclick('[data-a="vf-verify"]'); await w(900); await dclick('[data-a="vf-finish"]'); await w(400);
    const out = await ev(() => (V().outbox || []).map(e => e.kind + '>' + e.to).join('|'));
    ok(await ev(() => D().profile.email) === 'alex.new@example.com' && /email-changed-new>alex\.new@example\.com/.test(out) && /email-changed-old>alex\.rivera@example\.com/.test(out), `${T} 21 email changed; mock notifications to old and new (${out})`);
    // NMA-22 phone intl
    await go(v, 'returning', 'edit:phone'); await dclick('input[data-f="region"][value="intl"]'); await p.fill(D + 'input[data-f="intl"]', '12'); await p.locator(D + 'input[data-f="intl"]').dispatchEvent('change'); await dclick('[data-a="edit-save"]'); await w(300);
    ok(/Enter a valid phone number/.test(await txt()) && await p.locator(D + 'select[data-f="cc"]').count() === 1, `${T} 22 international format and country code validation`);
    // NMA-23 billing delete
    await go(v, 'returning', 'edit:address'); await dclick('[data-a="addr-remove"]'); ok(await dlg() === 'Remove billing address?', `${T} 23 delete asks first`);
    await dlgBtn(1); await w(900); ok(await ev(() => !D().profile.address.street) && /Billing address removed/.test(await txt()), `${T} 23 address removed`);
    // NMA-26-28 Profile assistance: failure keeps answers, retry saves
    await go(v, 'returning', 'assist-profile', 'error'); await ev(() => { const r = sheet().stack[sheet().stack.length - 1]; r.u.d = { cat: 'station', dis: [], wc: '', needs: ['seat'], for: '' }; render(); });
    ok(await p.locator(D + 'input[data-f="cat"]').count() === 2, `${T} 26 Profile offers two types only`);
    await dclick('[data-a="assist-save"]'); await w(900);
    ok(/couldn’t save/i.test(await txt()) && await ev(() => sheet().stack[sheet().stack.length - 1].u.d.cat === 'station' && !D().assist.cat), `${T} 28 failed save keeps the answers`);
    await ev(() => { V().net = 'online'; }); await dclick('[data-a="retry"]'); await w(900);
    ok(await ev(() => D().assist.cat === 'station' && D().assist.needs.includes('seat')), `${T} 28 retry saves station assistance with accessible seat`);
    await go(v, 'returning', 'assist-profile'); await ev(() => { const r = sheet().stack[sheet().stack.length - 1]; r.u.d = { cat: 'disability', dis: [], wc: '', needs: [], for: '' }; render(); }); await dclick('[data-a="assist-save"]'); await w(300);
    ok(await ev(() => !D().assist.cat), `${T} 27 disability branch requires a disability before saving`);
    // NMA-43 / 566
    await go(v, 'returning', 'discounts'); await dclick('input[data-f="type"][value="rpa"]'); await p.fill(D + '#rpa-id', '123'); await p.locator(D + '#rpa-id').dispatchEvent('change'); await dclick('[data-a="disc-save"]'); await w(300);
    ok(/Check your membership number/.test(await txt()), `${T} 43 RPA needs a 6-10 digit ID`);
    await ev(() => openInfo('rules')); await w(300); ok(/Content pending/.test(await ev(() => document.querySelector('.info-sheet').textContent)), `${T} 566 missing guidance marked pending`);
  }
  // NMA-992 email artifact, reviewer controller
  await ev(() => { setChrome(true, false); document.querySelector('#ctlEmails').open = true; }); await w(200);
  await p.click('[data-mail-reset="0"]'); await w(200); ok(await ev(() => !(V().outbox || []).some(e => e.kind === 'password-reset')), '992 abandoned reset: no email');
  await p.click('[data-mail-reset="1"]'); await w(200);
  ok(await ev(() => (V().outbox || [])[0].kind === 'password-reset' && V().outbox[0].status === 'delivered'), '992 completed reset: confirmation email');
  await p.selectOption('#tbMail', 'fail'); await p.click('[data-mail-reset="1"]'); await w(200);
  ok(await ev(() => V().outbox[0].status === 'failed'), '992 delivery failure recorded; reset still successful');
  await p.click('#emails [data-mail-id]'); await w(200);
  const mail = await ev(() => document.querySelector('#mailPreview').innerText);
  ok(/Mock email · not sent/.test(mail) && /Delivery failed/.test(mail) && /Act now/.test(mail) && /Customer Care/.test(mail) && !/password:|Password123/i.test(mail) && /changed on/.test(mail), '992 preview: labeled mock, date/time, guidance, no password');
  await p.click('[data-mail-close]'); await w(100);
  ok(await ev(() => document.querySelectorAll('#emails [data-mail-kind]').length === 3), 'every email design is inspectable from the controller');
  // customer UI stays clean
  for (const v of [1, 3]) for (const sc of ['returning', 'passrider', 'triplink', 'guest']) { await go(v, sc); const h = await ev(() => document.querySelector('#device').innerText); ok(!/NMA-\d/.test(h) && await p.locator('#device .pq:visible').count() === 0, `C${v} ${sc}: no Jira IDs or question markers in the app`); }
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  require('fs').writeFileSync('final-results.json', JSON.stringify(res));
  await br.close();
})();
