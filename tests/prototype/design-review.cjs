// Design-review revisions: (1) Dates (Figma 3554:123276): Select dates, vertical months, Save selection / Clear / Back;
// (2) "Replace your discount?" before Passenger with disability replaces another discount;
// (3) Back / Close / abandon-booking rules (no X under Fare Finder, abandon only with a cart).
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const click = async (s, ms = 450) => { await p.locator(D_ + s).first().click(); await w(ms); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const top = () => ev(() => { const sh = sheet(); return sh ? sh.stack.map(r => r.s).join('>') : 'none'; });
  const dlg = () => ev(() => nav().dialog ? nav().dialog.title : null);
  const bk = () => ev(() => JSON.parse(JSON.stringify(D().booking)));
  const open = (sc = 'returning', o = {}) => ev(([sc, o]) => { TB.v = 1; TB.dev = 'iphone'; TB.orient = 'portrait'; TB.theme = 'light'; TB.text = 100; VS[1] = makeVS(sc); V().toast = null; goLoc('tab:book'); A['open-booking'](); const b = D().booking; if (o.from) { b.from = o.from; b.to = o.to; } if (o.trip) b.trip = o.trip; if (o.dep) b.dep = o.dep; if (o.ret !== undefined) b.ret = o.ret; render(); }, [sc, o]).then(() => w(500));
  const visibleMonths = () => ev(() => { const sc = document.querySelector('#device .pane--calx .pane__scroll'), r0 = sc.getBoundingClientRect(), hb = sc.querySelector('.calx-head').getBoundingClientRect().bottom; return [...sc.querySelectorAll('.calx-month')].filter(m => { const r = m.getBoundingClientRect(); return r.top >= hb - 1 && r.bottom <= r0.bottom + 1; }).map(m => m.dataset.month); });

  // ================= 1. Dates =================
  await open('returning', { from: 'NYP', to: 'WAS', trip: 'ow', dep: '2026-10-29', ret: null });
  await click('#ff-dep', 700);
  ok(await top() === 'ff>calendar' && await p.locator(D_ + '.pane--calx [data-a="close"]').count() === 0 && await p.locator(D_ + '.pane--calx .ads-navbar [data-a="back"]').count() === 1, 'Dates: Back, no Close X');
  ok((await visibleMonths())[0] === '2026-10' && await ev(() => getComputedStyle(document.querySelector('#device .calx-head')).position) === 'sticky' && await p.locator(D_ + '.calx-head .calx-group [aria-current="true"]#calx-f-dep').count() === 1, `the date card is pinned above the months, Departure outlined; the current month is fully visible (${await visibleMonths()})`);
  ok(await ev(() => getComputedStyle(document.querySelector('#device .pane--calx .pane__scroll')).overflowY) === 'auto' && await p.locator(D_ + '.cal-nav, [data-a="cal-month"]').count() === 0, 'months scroll vertically; no month paging buttons');
  ok(await ev(() => { const t = document.querySelector('#device [data-k="day-2026-10-28"]'); return t.classList.contains('ads-day--today') && /today/.test(t.getAttribute('aria-label')); }), 'today is marked (and announced)');
  ok(await ev(() => document.querySelector('#device [data-k="day-2026-10-27"]').disabled), 'past dates disabled');
  // one-way
  await click('[data-k="day-2026-11-05"]', 300);
  ok((await bk()).dep === '2026-10-29' && await ev(() => sheet().stack[1].u.cal.dep) === '2026-11-05', 'one-way: choosing a date changes the draft only');
  ok(await ev(() => document.querySelector('#device [data-k="day-2026-11-05"]').getAttribute('aria-pressed')) === 'true' && await ev(() => document.querySelector('#device .pane .ads-navbar__title').textContent) === 'Select date', 'one-way: Select date; the departure is marked');
  ok(await ev(() => [...document.querySelectorAll('#device .pane--calx .pane__foot .ads-btn')].map(b => b.textContent + (b.classList.contains('ads-btn--secondary') ? ':secondary' : '')).join()) === 'Save selection,Clear:secondary' && await p.locator(D_ + '.calx-legend, ' + D_ + '.cal-pick').count() === 0, 'footer: Save selection and a secondary Clear; no legend or tabs');
  ok(await ev(() => { const t = document.querySelector('#device [data-k="day-2026-10-28"]'); return getComputedStyle(t, '::after').width === '4px' && getComputedStyle(t).textDecorationLine === 'none'; }) && await ev(() => getComputedStyle(document.querySelector('#device [data-k="day-2026-10-27"]')).textDecorationLine) === 'none', 'today has a dot; past days greyed, not struck through');
  await click('[data-a="calx-clear"]', 300);
  ok(await p.locator(D_ + '[data-a="calx-done"]:disabled').count() === 0 && await ev(() => [...document.querySelectorAll('#device .calx [aria-pressed="true"]')].map(e => e.dataset.k).join()) === 'day-2026-10-28', 'Clear resets the departure to today; Save selection stays available');
  await click('[data-k="day-2026-11-05"]', 300);
  await click('[data-a="calx-done"]');
  ok(await top() === 'ff' && (await bk()).dep === '2026-11-05' && (await bk()).ret === null && /11\/05\/2026/.test(await txt()), 'Done saves the date and returns to Fare Finder');
  await click('#ff-dep', 700); await click('[data-k="day-2026-12-01"]', 300); await click('.pane--calx .ads-navbar [data-a="back"]');
  ok(await top() === 'ff' && (await bk()).dep === '2026-11-05' && !(await dlg()), 'Back returns to Fare Finder without saving and without a warning');
  // end of the 335-day window
  await click('#ff-dep', 700);
  const lastOk = await ev(() => addDays(TODAY_S, WINDOW_DAYS)), past = await ev(() => addDays(TODAY_S, WINDOW_DAYS + 1));
  await ev(() => { const sc = document.querySelector('#device .pane--calx .pane__scroll'); sc.scrollTop = sc.scrollHeight; }); await w(200);
  ok(await ev(s => { const e = document.querySelector(`#device [data-k="day-${s}"]`); const sc = document.querySelector('#device .pane--calx .pane__scroll').getBoundingClientRect(), r = e.getBoundingClientRect(); return !e.disabled && r.bottom <= sc.bottom + 1; }, lastOk), `the last day of the window (${lastOk}) is reachable by scrolling and selectable`);
  ok(await ev(s => { const e = document.querySelector(`#device [data-k="day-${s}"]`); return !e || e.disabled; }, past), 'the day after the window is unavailable');
  await click(`[data-k="day-${lastOk}"]`, 300); await click('[data-a="calx-done"]'); ok((await bk()).dep === lastOk, 'the last day of the window can be saved');

  // round trip across two months
  await open('returning', { from: 'NYP', to: 'WAS', trip: 'rt', dep: '2026-11-02', ret: '2026-11-04' });
  await click('#ff-dep', 700);
  ok(await ev(() => document.querySelector('#device .pane .ads-navbar__title').textContent) === 'Select dates' && await ev(() => ['2026-11-02', '2026-11-04'].every(s => document.querySelector(`#device [data-k="day-${s}"]`).getAttribute('aria-pressed') === 'true')) && await ev(() => sheet().stack[1].u.cal.edit) === 'dep', 'round trip: Select dates; both dates marked; the next tap changes the departure');
  await click('[data-k="day-2026-10-30"]', 300);
  ok(await ev(() => sheet().stack[1].u.cal.edit) === 'ret' && await ev(() => sheet().stack[1].u.cal.ret) === '2026-11-04', 'new departure before the return: return kept; the next tap sets the return');
  ok(await ev(() => sheet().stack[1].u.cal.dep) === '2026-10-30', 'the departure is kept');
  await click('[data-k="day-2026-11-03"]', 300);
  const range = await ev(() => ({ start: document.querySelector('#device [data-k="day-2026-10-30"]').className, mid: document.querySelector('#device [data-k="day-2026-11-01"]').className, end: document.querySelector('#device [data-k="day-2026-11-03"]').className, today: document.querySelector('#device [data-k="day-2026-10-28"]').className }));
  ok(/range-start/.test(range.start) && /in-range/.test(range.mid) && /range-end/.test(range.end) && /today/.test(range.today) && !/in-range/.test(range.today), 'departure, between, return and today are distinct across the month boundary');
  ok((await visibleMonths()).length >= 1, 'a full month stays on screen while editing');
  ok(await ev(() => sheet().stack[1].u.cal.ret) === '2026-11-03' && await ev(() => sheet().stack[1].u.cal.edit) === 'dep', 'after the return, the next tap changes the departure again');
  await click('[data-a="calx-done"]'); const r1 = await bk();
  ok(r1.dep === '2026-10-30' && r1.ret === '2026-11-03' && r1.trip === 'rt' && r1.from === 'NYP' && r1.to === 'WAS', 'Done saves a round trip spanning two months; other selections kept');
  // editing the return directly
  await click('#ff-ret', 700);
  ok(await ev(() => sheet().stack[1].u.cal.edit) === 'ret', 'opening from Return edits the return');
  await click('[data-k="day-2026-11-10"]', 300); await click('[data-a="calx-done"]');
  ok((await bk()).ret === '2026-11-10' && (await bk()).dep === '2026-10-30', 'editing only the return');
  // invalid return
  await click('#ff-dep', 700); await click('[data-k="day-2026-11-20"]', 400);
  const c = await ev(() => sheet().stack[1].u.cal);
  ok(c.dep === '2026-11-20' && c.ret === '2026-11-20' && c.edit === 'ret', 'a departure after the return: the return moves to the same day; Return stays active');
  ok(await p.locator(D_ + '#calx-f-ret[aria-current="true"]').count() === 1 && !/is before your new departure/.test(await txt()), 'Return is outlined; no warning text');
  ok(await ev(() => document.querySelector('#device [data-k="day-2026-11-19"]').disabled && !document.querySelector('#device [data-k="day-2026-11-20"]').disabled), 'Return active: earlier dates disabled, same day allowed');
  await click('[data-k="day-2026-11-22"]', 300);
  ok((await ev(() => sheet().stack[1].u.cal.ret)) === '2026-11-22' && await p.locator(D_ + '[data-a="calx-done"]:disabled').count() === 0, 'the next tap sets the return');
  await click('[data-a="calx-done"]'); ok((await bk()).dep === '2026-11-20' && (await bk()).ret === '2026-11-22', 'saved after the new return');
  await click('#ff-dep', 700); await click('[data-k="day-2026-12-01"]', 300); await click('.pane--calx .ads-navbar [data-a="back"]');
  ok((await bk()).dep === '2026-11-20' && (await bk()).ret === '2026-11-22' && !(await dlg()), 'Back after an invalid edit keeps the saved dates');
  await p.addScriptTag({ content: AXE });
  await click('#ff-dep', 700);
  for (const th of ['light', 'dark']) { await ev(th => { TB.theme = th; render(); }, th); await w(300); const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id)); ok(!v.length, `Dates axe ${th} (${v})`); }
  await ev(() => { TB.theme = 'light'; render(); });

  // ================= 2. Replace your discount? =================
  const toTravelers = async (sc = 'returning') => { await open(sc, { from: 'NYP', to: 'WAS' }); await click('#ff-trav', 600); };
  const assistDisability = async (key = 'adult-1') => { await p.click(`${D_}#ask-${key}`, { force: true }); await w(1000); await click('label:has(input[name$="-cat"][value="disability"])', 250); await click('label:has(input[name$="-dis"][value="vision"])', 250); };
  await toTravelers(); await p.selectOption(D_ + '#td-adult-1', 'military'); await w(300);
  ok(await ev(() => tdiscOf(D().booking, travelerList(D().booking)[0])) === 'military', 'Traveler 1 has Military selected');
  await assistDisability(); await click('[data-a="assist-confirm"]');
  ok(await dlg() === 'Replace your discount?', 'Military → Passenger with disability asks first');
  const dt = await ev(() => document.querySelector('.pdialog').innerText.replace(/\s+/g, ' '));
  ok(/The Passenger with disability discount will replace your Military discount\. Only one discount can be applied per traveler\./.test(dt) && /Replace discount/.test(dt) && /Keep editing/.test(dt), 'dialog copy and actions as specified');
  ok(await ev(() => [...document.querySelectorAll('.pdialog [data-dlg]')].map(b => b.textContent + ':' + b.className.includes('--secondary')).join()) === 'Replace discount:false,Keep editing:true', 'Replace discount is primary, Keep editing secondary');
  await p.locator('.pdialog [data-dlg="1"]').click(); await w(400);
  ok(await top() === 'ff>travelers>assist' && !(await dlg()), 'Keep editing returns to the questionnaire');
  ok(await ev(() => !!document.querySelector('#device input[name$="-cat"][value="disability"]:checked') && !!document.querySelector('#device input[name$="-dis"][value="vision"]:checked')), 'answers preserved');
  ok(await ev(() => !assistRec(D().booking, 'adult-1').done && tdiscOf(D().booking, travelerList(D().booking)[0]) === 'military'), 'nothing saved; Military unchanged');
  await click('[data-a="assist-confirm"]'); await p.locator('.pdialog [data-dlg="0"]').click(); await w(700);
  ok(await top() === 'ff>travelers' && await ev(() => assistRec(D().booking, 'adult-1').done && assistRec(D().booking, 'adult-1').m.cat === 'disability'), 'Replace discount saves the answers and returns to Traveler selection');
  const card = await ev(() => document.querySelector('#device #tc-adult-1').innerText.replace(/\s+/g, ' '));
  ok(/Passenger with disability/.test(card) && /Applied based on this traveler’s assistance information\. It replaced the Military discount\./.test(card), `card shows the applied discount and why (${card.slice(0, 160)})`);
  ok(await p.locator(D_ + '#td-adult-1').count() === 0, 'the applied discount isn’t offered as a choice again');
  // no confirmation: same discount already applies
  await p.click(`${D_}[data-a="assist-edit"][data-t="adult-1"]`); await w(800); await click('label:has(input[name$="-dis"][value="hearing"])', 250); await click('[data-a="assist-confirm"]', 600);
  ok(!(await dlg()) && await top() === 'ff>travelers', 'no confirmation when Passenger with disability already applies');
  // no confirmation: no discount selected
  await toTravelers(); ok(await ev(() => tdiscOf(D().booking, travelerList(D().booking)[0])) === 'none', 'Traveler 1 starts with no discount');
  await assistDisability(); await click('[data-a="assist-confirm"]', 600);
  ok(!(await dlg()) && await ev(() => tdiscOf(D().booking, travelerList(D().booking)[0])) === 'pwd', 'no confirmation when no discount was selected; Passenger with disability applied');
  // no confirmation: station help without a disability
  await toTravelers(); await p.selectOption(D_ + '#td-adult-1', 'military'); await w(300);
  await p.click(`${D_}#ask-adult-1`, { force: true }); await w(1000); await click('label:has(input[name$="-cat"][value="station"])', 250); await click('[data-a="assist-confirm"]', 600);
  ok(!(await dlg()) && await ev(() => tdiscOf(D().booking, travelerList(D().booking)[0])) === 'military', 'no confirmation for station assistance without a disability; Military kept');

  // ================= 3. Back, Close and abandon booking =================
  // 1 Fare Finder → Dates → Back
  await open('returning', { from: 'NYP', to: 'WAS' }); await click('#ff-dep', 700); await click('.pane--calx .ads-navbar [data-a="back"]');
  ok(await top() === 'ff' && !(await dlg()), '1 Fare Finder → Dates → Back returns to Fare Finder without a warning');
  // no X under Fare Finder
  await click('#ff-from', 600); ok(await p.locator(D_ + '.pane--focus [data-a="close"]').count() === 0 && await p.locator(D_ + '.ss-head__back, [data-a="back"]').count() >= 1, 'station search: Back, no Close X');
  await click('.ss-head__back'); ok(await top() === 'ff', 'station search Back → Fare Finder');
  await click('#ff-trav', 600); ok(await p.locator(D_ + '.pane [data-a="close"]').count() === 0 && await p.locator(D_ + '.ads-navbar [data-a="back"]').count() === 1 && await p.locator(D_ + '.ads-navbar [data-a="trav-cancel"]').count() === 0, 'Traveler selection: Back, no Close X, Done kept');
  // 2 Traveler selection → Assistance → Back
  await p.click(`${D_}#ask-adult-1`, { force: true }); await w(1000);
  ok(await p.locator(D_ + '.pane [data-a="close"]').count() === 0 && await p.locator(D_ + '[data-a="assist-confirm"]').count() === 1, 'Assistance: Back, no Close X, Confirm kept');
  await click('.ads-navbar [data-a="back"]'); ok(await top() === 'ff>travelers' && !(await dlg()), '2 Traveler selection → Assistance → Back returns to Traveler selection');
  // Back from Traveler selection keeps what was saved, never asks to abandon
  await ev(() => { D().booking.pax.adult = 2; render(); }); await click('.ads-navbar [data-a="back"]');
  ok(await top() === 'ff' && !(await dlg()) && (await bk()).pax.adult === 1, 'Traveler selection Back: unsaved changes dropped, saved data kept, no dialog');
  // 3 Fare Finder → results → Back preserves every selection
  await open('returning', { from: 'NYP', to: 'WAS', trip: 'rt', dep: '2026-11-02', ret: '2026-11-09' });
  await ev(() => { const b = D().booking; b.pax.adult = 2; b.tdisc = { 'adult-2': 'military' }; b.pay = 'cash'; setCodeText(b, 'FALL'); setAssistRec(b, 'adult-1', { cat: 'station', dis: [], needs: [], wc: null }); b.assistOn = true; render(); }); await w(300);
  const before = JSON.stringify(await bk());
  await click('[data-a="find-trains"]', 1000);
  ok(await top() === 'ff>handoff' && /Search results/.test(await txt()), 'Find trains opens results');
  ok(await p.locator(D_ + '.pane [data-a="close"]').count() === 0, 'results: no Close X');
  await click('.ads-navbar [data-a="back"]');
  const after = await bk();
  ok(await top() === 'ff' && !(await dlg()), '3 results → Back returns directly to Fare Finder (not Book)');
  ok(after.from === 'NYP' && after.to === 'WAS' && after.dep === '2026-11-02' && after.ret === '2026-11-09' && after.pax.adult === 2 && after.tdisc['adult-2'] === 'military' && after.codeText === 'FALL' && after.pay === 'cash' && assistCatOf(after), 'origin, destination, dates, travelers, discounts, assistance, coupon and payment kept');
  function assistCatOf(b) { return JSON.stringify(b).includes('"station"'); }
  // 4 Exit before a cart exists
  await click('.ads-sheet-header__close');
  ok(!(await dlg()) && await top() === 'none' && await ev(() => nav().tab) === 'book', '4 exiting Fare Finder before a cart: no dialog, back to Book');
  await click('[data-a="open-booking"]', 500);
  const re = await bk(); ok(re.from === 'NYP' && re.ret === '2026-11-09' && re.codeText === 'FALL' && /FALL/.test(await txt()), 'reopening Fare Finder restores the saved search selections, including the code');
  await p.keyboard.press('Escape'); await w(400); ok(!(await dlg()) && await top() === 'none', 'Escape at Fare Finder before a cart: no dialog');
  // 5 Exit with an item in the cart
  await click('[data-a="open-booking"]', 500); await click('[data-a="find-trains"]', 1000);
  // Sprint 5 (proposed, NMA-1109 and fare selection): a round trip chooses the departure class and fare, then the return, before anything is in the cart
  await click('[data-a="s5-fare"]:not([disabled])', 600); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
  ok(await top() === 'ff>handoff>s5fare>handoff', 'round trip: continuing from the departure fare opens the Return step');
  await p.locator(D_ + '.pane:last-child [data-a="s5-fare"]:not([disabled])').first().click(); await w(600); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
  ok(await ev(() => (D().cart || []).length) === 1, 'a sample train is in the cart');
  for (let i = 0; i < 6 && await top() !== 'ff'; i++) { await p.locator(D_ + '.pane:last-child .ads-navbar [data-a="back"]').click(); await w(600); }
  ok(await top() === 'ff' && !(await dlg()), 'Back from results with a cart: Fare Finder, no dialog');
  await click('.ads-sheet-header__close');
  ok(await dlg() === 'Abandon booking?' && await ev(() => [...document.querySelectorAll('.pdialog [data-dlg]')].map(b => b.textContent).join()) === 'Continue booking,Abandon booking', '5 exiting with a cart asks: Continue booking / Abandon booking');
  await p.locator('.pdialog [data-dlg="0"]').click(); await w(400);
  ok(!(await dlg()) && await top() === 'ff' && await ev(() => (D().cart || []).length) === 1, 'Continue booking keeps the cart and stays on the same screen');
  await click('.ads-sheet-header__close'); await p.locator('.pdialog [data-dlg="1"]').click(); await w(500);
  ok(await top() === 'none' && await ev(() => nav().tab) === 'book' && await ev(() => (D().cart || []).length) === 0, 'Abandon booking clears the cart and returns to Book');
  ok(await ev(() => D().booking.codeText) === '', 'Abandon booking clears the typed promotion code');

  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
