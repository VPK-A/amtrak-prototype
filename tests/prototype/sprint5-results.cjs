// Sprint 5 · Fare search results: the approved stories (NMA-748, 1094, 1096, 759, 1098, 1097, 1095), the proposed
// designs being tagged as such, Sprint 4 rules still holding (cart, assistance), and axe in light and dark.
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
  const open = async (sc = 'returning', js = '', th = 'light') => { await ev(([sc, js, th]) => { TB.v = 1; TB.dev = 'iphone'; TB.orient = 'portrait'; TB.theme = th; VS[1] = makeVS(sc); V().toast = null; goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; b.dep = '2026-11-05'; if (js) eval(js); render(); }, [sc, js, th]); await w(300); };
  const find = async () => { await p.locator(D_ + '[data-a="find-trains"]').click(); await w(1200); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  // Proposed tags can be hidden by a skin (wireframe branch), so they're checked in the markup, not on screen
  const tags = () => ev(() => [...document.querySelectorAll('#device .s5-tag')].map(e => e.textContent).join(' | '));
  const stack = () => ev(() => nav().sheet ? nav().sheet.stack.map(r => r.s + (r.p.leg || '')).join('>') : '');
  const cards = () => ev(() => [...document.querySelectorAll('#device .s5-trip')].map(c => ({ id: c.dataset.trip, text: c.innerText.replace(/\s+/g, ' '), cls: [...c.querySelectorAll('.s5-class')].map(b => [b.dataset.cls, b.disabled, b.querySelector('.s5-class__price').textContent]) })));
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };

  // ---- NMA-748 one-way results ----
  await open(); await find();
  let t = await txt(), c = await cards();
  ok(await stack() === 'ff>handoff' && /Departure/.test(t), 'Find trains opens the Departure results');
  ok(/NYP New York .* WAS Washington/.test(t) && /Thu, Nov 5 · 1 adult · 11 trains/.test(t), 'AC1 header: route, date, travelers and number of results');
  ok(c.length === 11, 'AC7 every trip returned is shown (11), none truncated');
  const segs = await ev(() => s5Sorted(s5Trips(D().booking, 'dep').list).map(x => [x.segs, x.dep, x.status, x.low]));
  ok(segs.every((x, i) => !i || x[0] > segs[i - 1][0] || (x[0] === segs[i - 1][0] && x[1] >= segs[i - 1][1])), 'AC6 default order: most direct first, then earliest departure');
  ok(segs.findIndex(x => x[2] === 'canceled') < segs.findIndex(x => x[0] > 1) && segs.findIndex(x => x[3] === Infinity) < segs.findIndex(x => x[0] > 1), 'AC6 canceled and sold-out trips keep their sorted place');
  ok(c.some(x => /Canceled/.test(x.text)) && c.some(x => /Delayed 25 min/.test(x.text)), 'AC4 delayed and canceled trips are shown');
  ok(c.some(x => x.cls.length && x.cls.every(k => k[2] === 'Sold out')), 'AC5 a fully sold-out trip is still shown');
  await open('returning', "D().booking.dep = TODAY_S"); await find();
  ok((await cards()).every(x => !/6:10 AM|7:00 AM/.test(x.text)) && (await cards()).some(x => /Delayed/.test(x.text)), 'AC4 departed trains are gone today; a delayed one stays until it actually leaves');
  await open('rpa'); await find();
  ok((await cards()).length === 11, 'AC3 a discount doesn’t filter out trips');

  // ---- NMA-1094 trip card ----
  await open(); await find(); c = await cards();
  const by = id => c.find(x => x.id === id);
  ok(/Northeast Regional 171/.test(by('t1').text) && /6:10 AM .*8:44 AM/.test(by('t1').text) && /2h 34m · Direct/.test(by('t1').text), 'train name and number, departure, arrival, duration, Direct');
  ok(/9:25 AM 9:50 AM/.test(by('t3').text.replace(/Scheduled |Now /g, '')), 'delayed: scheduled and updated times both shown');
  ok(await ev(() => !!document.querySelector('#device [data-trip="t3"] s.s5-was') && !!document.querySelector('#device [data-trip="t3"] b.s5-now')), 'delayed: updated time is visually distinct from the scheduled one');
  ok(/\+1 day/.test(by('t8').text) && /Overnight/.test(by('t8').text), 'arrival on a later day and the overnight indicator (direct)');
  ok(/Overnight/.test(by('t11').text) && /3 segments/.test(by('t11').text), 'overnight indicator on a multi-segment trip, with its number of segments');
  ok(/2 segments · 45m layover in Philadelphia/.test(by('t9').text), 'multi-segment: segments and layover');
  ok(/Self-transfer: change stations/.test(by('t10').text) && await ev(() => !!document.querySelector('#device [data-trip="t10"] .ads-icon--trip-multiple-mixed')), 'mixed service icon and the self-transfer indicator');

  // ---- NMA-1096 classes of service ----
  ok(by('t1').cls.map(k => k[0]).join() === 'Coach,Business' && by('t2').cls.map(k => k[0]).join() === 'Business,First' && by('t7').cls.map(k => k[0]).join() === 'Coach,Rooms', 'classes in order; First only on Acela, rooms on non-Acela; unoffered classes hidden');
  ok(by('t4').cls[1][1] && by('t4').cls[1][2] === 'Sold out' && !by('t4').cls[0][1], 'a sold-out class is shown and disabled beside an available one');
  ok(/^\$\d+$/.test(by('t1').cls[0][2]), 'lowest fare shown per class');

  // ---- NMA-1098 / 1097 / 1095 ----
  ok(/Seat prices are per traveler, one way/.test(await txt()), 'pricing note on the results screen');
  await p.locator(D_ + '[data-topic="s5-pricing"]').click(); await w(400);
  ok(/Seats/.test(await txt()) && /Rooms/.test(await txt()) && /total for all travelers/.test(await txt()), 'pricing sheet explains seat and room prices'); await axe('pricing sheet');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await p.locator(D_ + '[data-topic="s5-fares"]').click(); await w(400);
  ok(/Compare fare types/.test(await txt()) && /Flex/.test(await txt()) && await stack() === 'ff>handoff', 'fare types open without leaving results');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  ok(!/crosses the U.S.–Canada border/.test(await txt()), 'no border information on a domestic trip');
  await open('returning', "s5().outcome = 'border'"); await find();
  ok(/This trip crosses the U.S.–Canada border/.test(await txt()), 'border information on a cross-border trip');
  await p.locator(D_ + '[data-topic="s5-border"]').click(); await w(400);
  ok(/passport/.test(await txt()), 'border sheet shows what to expect');

  await open(); await find(); await p.locator(D_ + '[data-trip="t1"] .s5-details').click(); await w(400);
  ok(/Trip details/.test(await txt()) && /Amenities and add-ons/.test(await txt()) && await stack() === 'ff>handoff', 'Details opens trip details (Services) without leaving results');
  await p.locator(D_ + '#s5d-route').click(); await w(300);
  ok(/Washington/.test(await ev(() => document.querySelector('#device #s5d-panel').innerText)) && !/Amenities/.test(await txt()), 'the Route tab shows the stops'); await axe('trip details');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  // ---- NMA-759 unsuccessful searches ----
  await open('returning', "s5().outcome = 'nodate'"); await find();
  ok(/No trains on Thu, Nov 5/.test(await txt()) && /next trains are on Sat, Nov 7/.test(await txt()) && await stack() === 'ff', 'no trains on the date: says so and names the next date');
  await p.locator(D_ + '.pdialog button', { hasText: 'See trains on Sat, Nov 7' }).click(); await w(500);
  ok(await stack() === 'ff>handoff' && /Sat, Nov 7/.test(await txt()), 'the next date opens its results');
  await open('returning', "s5().outcome = 'noroute'"); await find();
  ok(/No trains between these stations/.test(await txt()) && await stack() === 'ff', 'route not served');
  await p.locator(D_ + '.pdialog button', { hasText: 'Change stations' }).click(); await w(300);
  ok(await ev(() => D().booking.from === 'NYP' && D().booking.to === 'WAS'), 'Fare Finder values are kept after an error');
  await open('assist', "s5().outcome = 'assist'"); await find();
  ok(/Assistance isn’t available at this station/.test(await txt()), 'assistance not available');
  await p.locator(D_ + '.pdialog button', { hasText: 'Continue without assistance' }).click(); await w(500);
  ok(await stack() === 'ff>handoff' && /Searching without your assistance request/.test(await txt()) && await ev(() => !!D().booking.s5AssistAck && D().booking.assistOn), 'continuing records the acknowledgment and keeps the saved answers');
  await open('returning', "V().net = 'error'"); await find();
  ok(/We couldn’t search right now/.test(await txt()) && !/\b\d{3}\b error|Error code/.test(await txt()) && await p.locator(D_ + '[data-a="retry"]').count() === 1, 'technical failure: clear message, retry, no codes');

  // ---- Offline on results, cart (Sprint 4 rule), round trip (proposed) ----
  await open(); await find(); await ev(() => { V().net = 'offline'; render(); }); await w(200);
  await p.locator(D_ + '[data-a="s5-fare"]:not([disabled])').first().click(); await w(300);
  ok(/You’re offline/.test(await txt()) && await stack() === 'ff>handoff' && !(await ev(() => (D().cart || []).length)), 'offline: results stay visible, choosing a fare is blocked');
  await ev(() => { V().net = 'online'; V().toast = null; render(); });
  // ---- Choose a fare (proposed; follows the current app: class, fare options, price, Continue) ----
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  t = await txt();
  ok(await stack() === 'ff>handoff>s5faredep' && /Choose a fare/.test(t) && /Proposed · Fare selection/.test(await tags()) && !(await ev(() => (D().cart || []).length)), 'choosing a class opens Choose a fare, tagged Proposed; nothing in the cart yet');
  ok(/Northeast Regional 171/.test(t) && /6:10 AM → to 8:44 AM|6:10 AM → 8:44 AM/.test(t) && await ev(() => document.querySelector('#device .pane:last-child .s5-ctab[aria-selected="true"]').dataset.v === 'Coach'), 'the trip summary and the chosen class tab are shown');
  ok(/Value/.test(t) && /Flex/.test(t) && /30% cancellation fee/.test(t) && /Full refund/.test(t) && /per traveler/.test(t), 'fare options show their price and rules');
  const amt = () => ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  const a1 = await amt(); await p.locator(D_ + '.pane:last-child #s5f-Flex').check({ force: true }); await w(300);
  ok(a1 !== await amt() && await ev(() => document.querySelector('#device .pane:last-child [data-a="cart-add"]').dataset.fare) === 'Flex' && /for 1 traveler/.test(await txt()), 'choosing a fare updates the price and what Continue adds');
  await p.locator(D_ + '.pane:last-child #s5c-Business').click(); await w(300);
  ok(/Extra legroom/.test(await txt()) && await ev(() => document.querySelector('#device .pane:last-child [data-a="cart-add"]').dataset.cls) === 'Business', 'class tabs switch class without going back to results'); await axe('choose a fare');
  await open(); await find(); await p.locator(D_ + '[data-trip="t4"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await ev(() => document.querySelector('#device .pane:last-child #s5c-Business').disabled) && /Sold out/.test(await txt()), 'a sold-out class is shown and disabled on the class tabs');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(await ev(() => (D().cart || []).length === 1) && await stack() === 'ff>handoff>s5faredep>s5sum' && /In your cart/.test(await txt()) && /1 Coach seat · Value/.test(await txt()), 'Continue adds to the simulated cart and shows the trip summary (Sprint 4 abandon rule still has something to act on)');
  await open('returning', "D().booking.trip = 'rt'; D().booking.ret = '2026-11-08'"); await find();
  await p.locator(D_ + '[data-a="s5-fare"]:not([disabled])').first().click(); await w(500); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
  ok(await stack() === 'ff>handoff>s5faredep>handoffret' && /WAS Washington .* NYP New York/.test(await txt()) && /Proposed · NMA-1109/.test(await tags()) && !(await ev(() => (D().cart || []).length)), 'round-trip: the return step follows the departure fare, tagged Proposed');
  await p.locator(D_ + '.pane:last-child [data-a="s5-fare"]:not([disabled])').first().click(); await w(500); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
  ok(/Departure · Thu, Nov 5/.test(await txt()) && /Return · Sun, Nov 8/.test(await txt()), 'the trip summary shows both legs');

  // ---- Canadian stations and real border crossings ----
  ok(await ev(() => ['TWO', 'MTR', 'VAC'].every(c => ST[c] && ST[c].country === 'CA') && ST.NYP.country === 'US'), 'Toronto, Montreal and Vancouver are stations');
  await open('returning', "D().booking.to = 'MTR'"); await find(); t = await txt();
  ok(/MTR Montreal/.test(t) && /Adirondack/.test(t) && /This trip crosses the U.S.–Canada border/.test(t) && (await cards()).every(x => /Crosses the border/.test(x.text)), 'New York to Montreal: Adirondack trips, border alert and card flags without the test control');
  await open('returning', "const b = D().booking; b.from = 'SEA'; b.to = 'VAC'"); await find();
  ok(/Amtrak Cascades/.test(await txt()) && /crosses the U.S.–Canada border/.test(await txt()), 'Seattle to Vancouver: Cascades, crosses the border');
  await open('returning', "const b = D().booking; b.from = 'WAS'; b.to = 'TWO'"); await find();
  ok(/Maple Leaf/.test(await txt()) && /2 segments/.test(await txt()), 'Washington to Toronto connects to the Maple Leaf');
  await open('returning', "const b = D().booking; b.from = 'TWO'; b.to = 'MTR'"); await find();
  ok(/No trains between these stations/.test(await txt()) && await stack() === 'ff', 'Toronto to Montreal is not an Amtrak route');
  await open(); await find();
  ok(!/crosses the U.S.–Canada border/.test(await txt()), 'domestic trips still show no border information');

  // ---- Results drawer: Pay with points, and the trip total on a round trip (proposed) ----
  ok(await p.locator(D_ + '.pane:last-child .pane__foot #s5-points').count() === 1, 'Departure has a drawer with Pay with points');
  await p.locator(D_ + '#s5-points').check({ force: true }); await w(300);
  ok(await ev(() => D().booking.pay === 'points') && /pts/.test(await ev(() => document.querySelector('#device .s5-class__price').textContent)), 'turning on points switches the prices to points');
  await open('returning', "const b = D().booking; b.code = { code: 'FALL', benefit: '10% off' }; b.codeText = 'FALL'; b.codeState = 'applied'"); await find();
  await p.locator(D_ + '#s5-points').click({ force: true }); await w(300);
  ok(/Use points and remove your code\?/.test(await txt()) && await ev(() => D().booking.pay !== 'points'), 'with a code, turning on points asks first (points searches don’t take codes)');
  await p.locator('.pdialog button', { hasText: 'Keep my code' }).click(); await w(300);
  ok(await ev(() => D().booking.code && D().booking.pay !== 'points'), 'Keep my code leaves cash and the code');
  await p.locator(D_ + '#s5-points').click({ force: true }); await w(300); await p.locator('.pdialog button', { hasText: 'Use points' }).click(); await w(300);
  ok(await ev(() => !D().booking.code && D().booking.pay === 'points'), 'Use points removes the code');
  await open('returning', "const b = D().booking; b.trip = 'rt'; b.ret = '2026-11-08'"); await find();
  ok(!/Trip total/.test(await ev(() => document.querySelector('#device .pane:last-child .pane__foot').innerText)), 'Departure drawer has no total yet');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  const depAmt = await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(700);
  let f = await ev(() => document.querySelector('#device .pane:last-child .pane__foot').innerText.replace(/\s+/g, ' '));
  ok(f.includes('Trip total so far ' + depAmt) && !/Choose a fare/.test(f) && /Pay with points/.test(f) && await ev(() => !document.querySelector('#device .pane:last-child .s5-totacc').open), 'Return drawer: trip total so far, collapsed by default, with Pay with points');
  await p.locator(D_ + '.pane:last-child .s5-totacc > summary').click(); await w(300);
  f = await ev(() => document.querySelector('#device .pane:last-child .pane__foot').innerText.replace(/\s+/g, ' '));
  ok(f.includes('Departure ' + depAmt) && /Return Choose a fare/.test(f), 'opening it shows the departure cost and the return still to choose');
  await p.locator(D_ + '#s5-points').check({ force: true }); await w(300);
  ok(await ev(() => document.querySelector('#device .pane:last-child .s5-totacc').open), 'it stays open after switching to points'); await p.locator(D_ + '#s5-points').uncheck({ force: true }); await w(300);
  await p.locator(D_ + '.pane:last-child [data-a="s5-fare"]:not([disabled])').first().click(); await w(500);
  f = await ev(() => document.querySelector('#device .pane:last-child .pane__foot').innerText.replace(/\s+/g, ' '));
  const num = x => +x.replace(/[^0-9.]/g, ''), m = f.match(/Trip total (\$[\d.,]+) Departure (\$[\d.,]+) Return (\$[\d.,]+)/);
  ok(m && Math.abs(num(m[2]) + num(m[3]) - num(m[1])) < 0.01 && f.includes('Return ' + m[3] + ' for 1 traveler'), `return fare: trip total, each leg, and the return price by Continue (${f})`); await axe('return fare with total');

  // ---- Proposed designs are tagged; flagged stories are in the notes ----
  await open(); await find(); t = await tags();
  ok(['NMA-755', 'NMA-758', 'NMA-1092/1093', 'NMA-1138'].every(k => t.includes('Proposed · ' + k)), 'proposed designs carry a Proposed tag with the story number');
  ok(await ev(() => [...NOTES.scope].some(n => /NMA-760/.test(n) && /NMA-762/.test(n) && /NMA-1140/.test(n) && /NMA-1141/.test(n))), 'open stories are flagged in the reviewer notes');
  ok(await ev(() => [...document.querySelector('#tbS5').options].length === S5_OUTCOMES.length) && /\(Sprint 5\)/.test(await ev(() => document.querySelector('label[for="tbS5"]').textContent)), 'the new control is labelled (Sprint 5)');
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'leisure'"); await find();
  ok((await cards())[0].cls.every(k => k[2] === 'Pass Rider fare'), 'Pass Rider: no unapproved prices shown');
  await open(); await find(); await axe('results light');
  await open('returning', '', 'dark'); await find(); await axe('results dark');
  ok(!errs.length, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  await br.close(); process.exit(res.every(r => r[0]) ? 0 : 1);
})();
