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
  ok(await ev(() => document.querySelector('#device [data-topic="s5-fares"]').textContent.trim()) === 'Understand fare types', 'the fare types link reads Understand fare types');
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
  t = await txt();
  ok(await ev(() => D().booking.pay === 'points' && !!D().booking.code) && !(await ev(() => document.querySelector('.pdialog'))) && /Promo codes and coupons don’t apply to points/.test(t) && /Passenger discounts still apply/.test(t), 'NMA-761 AC#3: with a code, points switch straight away and the results say the code isn’t used');
  ok(!/Code FALL applies/.test(t), 'NMA-761 AC#3: the code is not shown as applying to points');
  await p.locator(D_ + '#s5-points').uncheck({ force: true }); await w(300);
  ok(/Code FALL applies/.test(await txt()) && !/isn’t used while prices are in points/.test(await txt()), 'switching back to cash brings the code back');
  await open('returning', "const b = D().booking; b.pay = 'points'"); await find();
  ok(await p.locator(D_ + '#s5-points').count() === 1 && /Prices in points/.test(await txt()) && !/Proposed · NMA-761/.test(await tags()), 'NMA-761 AC#1: a points search shows points, with the switch on results (approved, no Proposed tag)');
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'leisure'"); await find();
  ok(await p.locator(D_ + '#s5-points').count() === 0, 'NMA-761 AC#4: no cash/points switch for Pass Rider');
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

  // ---- Results concepts (design exploration): compare the experience of each class ----
  ok(await ev(() => [...document.querySelector('#tbS5c').options].map(o => o.text.split(':')[0]).join()) === 'Current,Concept Update 1,Concept Update 2' && /\(Sprint 5\)/.test(await ev(() => document.querySelector('label[for="tbS5c"]').textContent)), 'concept switcher: Current, Concept Update 1, Concept Update 2 (labelled Sprint 5)');
  await open('returning', "TB.s5c = 'current'"); await find();
  ok(await p.locator(D_ + '[data-topic="s5-classes"]').count() === 0 && await p.locator(D_ + '.s5-class__exp').count() === 0, 'Current: no class comparison');
  await open('returning', "TB.s5c = 'c1'"); await find();
  ok(await p.locator(D_ + '[data-topic="s5-fares"]').count() === 0 && await p.locator(D_ + '[data-topic="s5-classes"]').count() === 1 && /Proposed · Concept Update 1/.test(await tags()), 'Concept 1: Compare classes replaces fare types on results; tagged Proposed');
  await p.locator(D_ + '[data-topic="s5-classes"]').click(); await w(400);
  t = await txt();
  ok(/Compare classes/.test(t) && /Seat/.test(t) && /Lounge/.test(t) && await ev(() => [...document.querySelectorAll('#device .s5-cmp__col')].map(e => e.textContent).join()) === 'Coach,Business,First,Private rooms' && await stack() === 'ff>handoff', 'Concept 1: Compare classes sheet compares each class on these trains without leaving results'); await axe('compare classes');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await p.locator(D_ + '.pane:last-child [data-topic="s5-fares"]').count() === 1, 'Concept 1: fare types are compared on Choose a fare');
  await open('returning', "TB.s5c = 'c2'"); await find(); c = await cards();
  ok(/Reclining seat/.test(c[0].text) && await ev(() => document.querySelector('#device [data-trip="t1"] .s5-class').getAttribute('aria-label').includes('Reclining seat')) && /Proposed · Concept Update 2/.test(await tags()), 'Concept 2: each class shows its seat type and amenities, also in its accessible name');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await stack() === 'ff>handoff>s5faredep', 'Concept 2: choosing a class still opens Choose a fare'); await open('returning', "TB.s5c = 'current'");

  // ---- Discount pricing concept (exploration): strikethrough for one traveler ----
  ok(await ev(() => [...document.querySelector('#tbS5d').options].map(o => o.value).join()) === 'current,strike' && /\(Sprint 5\)/.test(await ev(() => document.querySelector('label[for="tbS5d"]').textContent)), 'discount pricing switcher: Current and Strikethrough (labelled Sprint 5)');
  const code = "const b = D().booking; b.code = { code: 'FALL', benefit: '20% off' }; b.codeText = 'FALL'; b.codeState = 'applied'";
  const strikeOf = id => ev(id => [...document.querySelectorAll(`#device [data-trip="${id}"] .s5-class`)].map(x => [x.querySelector('.s5-strike') && x.querySelector('.s5-strike').textContent.replace('Was ', ''), (x.querySelector('.s5-netp') || x.querySelector('.s5-class__price')).textContent.replace('Now ', '')]), id);
  await open('returning', code + "; TB.s5d = 'current'"); await find();
  ok((await strikeOf('t1')).every(x => !x[0]), 'Current: no strikethrough; prices before discounts');
  await open('returning', code + "; TB.s5d = 'strike'"); await find();
  let sk = await strikeOf('t1');
  ok(sk.every(x => x[0] && Math.round(+x[0].slice(1) * 0.8) === +x[1].slice(1)), `Strikethrough: one traveler with a 20% code shows the full price struck through and the code price (${JSON.stringify(sk)})`);
  ok(/Seat prices include Code FALL/.test(await txt()) && /Price includes Code FALL/.test(await txt()) && /Proposed · Discount pricing/.test(await tags()), 'the results and cards name the discount; tagged Proposed');
  ok(await ev(() => /with Code FALL/.test(document.querySelector('#device [data-trip="t1"] .s5-class').getAttribute('aria-label'))), 'screen readers hear the discount on each class');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await ev(() => document.querySelector('#device .pane:last-child .s5-fopt .s5-strike') !== null) && /with Code FALL/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)) && await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent) === sk[0][1] + '.00', 'Choose a fare carries the struck-through fare and the discounted total');
  await open('returning', "D().booking.disc = 'military'; TB.s5d = 'strike'"); await find();
  sk = await strikeOf('t1');
  ok(sk.every(x => x[0] && Math.round(+x[0].slice(1) * 0.9) === +x[1].slice(1)) && /Seat prices include Military/.test(await txt()), 'a traveler discount type (Military) also shows as strikethrough');
  await open('returning', code + "; D().booking.pax.adult = 2; TB.s5d = 'strike'"); await find();
  ok((await strikeOf('t1')).every(x => !x[0]) && /Code FALL applies/.test(await txt()), 'more than one traveler keeps the current pattern');
  await open('returning', code + "; D().booking.pay = 'points'; TB.s5d = 'strike'"); await find();
  ok((await strikeOf('t1')).every(x => !x[0]), 'points: codes don’t apply, so no strikethrough from a code');
  await ev(() => { TB.s5d = 'current'; });

  // ---- Multi-segment: trip segments, class combinations, then fare types ----
  await open(); await find();
  await p.locator(D_ + '[data-trip="t11"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  t = await txt();
  ok(await stack() === 'ff>handoff>s5combodep' && /Your trip segments/.test(t) && /Segment 1 of 3/.test(t) && /Segment 3 of 3/.test(t) && (t.match(/Layover in/g) || []).length === 2, 'a multi-segment class opens the trip segments with each layover');
  const combos = await ev(() => [...document.querySelectorAll('#device .s5-combo')].map(c => [c.querySelector('.s5-combo__title').textContent, c.querySelector('.s5-combo__price b').textContent, c.querySelectorAll('.s5-combo__segs li').length]));
  const cardRooms = c.find(x => x.id === 't11') ? c.find(x => x.id === 't11').cls.find(k => k[0] === 'Rooms')[2] : null;
  ok(combos.length === 2 && combos.every(x => /Private room/.test(x[0]) && x[2] === 3) && cardRooms === 'from ' + combos[0][1], `room combinations list each segment’s class; the cheapest matches the card’s price (${cardRooms} / ${JSON.stringify(combos)})`);
  ok(/Amenities by segment/.test(t) && /Select a fare type/.test(t) && /Proposed · Class combinations/.test(await tags()), 'each combination has amenities by segment and Select a fare type; tagged Proposed'); await axe('class combinations');
  await p.locator(D_ + '.pane:last-child [data-a="s5-combo"]').last().click(); await w(500);
  ok(await stack() === 'ff>handoff>s5combodep>s5faredep' && new RegExp(combos[1][0].replace(/[+]/g, '\\+')).test(await txt()) && /Value/.test(await txt()) && /Flex/.test(await txt()) && await ev(() => document.querySelector('#device .pane:last-child [data-a="cart-add"]').dataset.combo) === '1', 'Select a fare type opens the fare types for that combination');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(await ev(() => (D().cart || []).length === 1) && new RegExp(combos[1][0].replace(/[+]/g, '\\+')).test(await txt()), 'Continue adds it; the trip summary names the combination');
  // Party size: a private room holds up to 2 travelers; seats are per traveler; totals cover the whole party
  await open('returning', "D().booking.pax.adult = 3"); await find(); c = await cards();
  const unit = await ev(() => s5Trips(D().booking, 'dep').list.find(t => t.id === 't7').cls.Rooms);
  ok(c.find(x => x.id === 't7').cls.find(k => k[0] === 'Rooms')[2] === 'from $' + (unit * 2).toLocaleString('en-US'), '3 travelers: a direct trip’s room price is the total for the 2 rooms they need');
  await p.locator(D_ + '[data-trip="t7"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  ok(/3 travelers need 2 rooms/.test(await txt()) && /for 3 travelers, 2 rooms/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)) && await ev(u => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent === '$' + (u * 2).toLocaleString('en-US', { minimumFractionDigits: 2 }), unit), 'Choose a fare: says how many rooms, and the total covers both rooms');
  await open('returning', "D().booking.pax.adult = 3"); await find(); c = await cards();
  const card11 = c.find(x => x.id === 't11').cls.find(k => k[0] === 'Rooms')[2];
  await p.locator(D_ + '[data-trip="t11"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  const cb3 = await ev(() => [...document.querySelectorAll('#device .s5-combo')].map(c => c.innerText.replace(/\s+/g, ' ')));
  ok(cb3.every(x => /total for 3 travelers, 2 rooms/.test(x) && /2 rooms for 3 travelers/.test(x) && /3 Coach seats/.test(x) && !/: 1 room\b/.test(x)) && cb3[0].includes(card11.replace('from ', 'From ')), `multi-segment rooms: 2 rooms for 3 travelers, seats for all 3, totals for the party, cheapest = card (${card11})`);
  await p.locator(D_ + '.pane:last-child [data-a="s5-combo"]').last().click(); await w(500);
  const amt3 = await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  ok(/2 rooms for 3 travelers/.test(await txt()) && /for 3 travelers, 2 rooms/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)) && /total for 3 travelers, 2 rooms/.test(await txt()), 'the combination’s fares are totals for 3 travelers in 2 rooms');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok((await txt()).includes(amt3.replace('.00', '')), `the trip summary shows the same total (${amt3})`);
  await open(); await find();
  await p.locator(D_ + '[data-trip="t9"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok((await ev(() => document.querySelectorAll('#device .s5-combo').length)) === 1 && /Coach \+ Coach/.test(await txt()), 'Coach on a multi-segment trip is a single all-Coach combination');
  await open(); await find();
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await stack() === 'ff>handoff>s5faredep', 'a direct trip still goes straight to Choose a fare');

  // ---- Proposed designs are tagged; flagged stories are in the notes ----
  await open(); await find(); t = await tags();
  ok(['NMA-758', 'NMA-1092/1093', 'NMA-762'].every(k => t.includes('Proposed · ' + k)) && !/NMA-755|NMA-1138|NMA-761/.test(t), 'proposed designs carry a Proposed tag; approved NMA-755 and NMA-761, and consolidated NMA-1138, don’t');
  ok(await ev(() => [...NOTES.scope].some(n => /NMA-760/.test(n) && /NMA-1140/.test(n) && /NMA-1141/.test(n) && /NMA-705/.test(n))), 'open stories are flagged in the reviewer notes');
  // ---- NMA-755 (approved): Lowest fare, Fastest trip and Sale ----
  const badges = () => ev(() => Object.fromEntries([...document.querySelectorAll('#device .s5-trip')].map(c => [c.dataset.trip, [...c.querySelectorAll('.ads-badge')].map(b => b.textContent).join('/')])));
  let bd = await badges();
  ok(/Fastest trip/.test(bd.t2) && /Lowest fare/.test(bd.t8) && /Sale/.test(bd.t3) && /Delayed/.test(bd.t3) && /Sale/.test(bd.t9), 'Lowest fare, Fastest trip and Sale badges; a delayed trip keeps its badge');
  ok(!/Lowest|Fastest|Sale/.test(bd.t5) && !/Lowest|Fastest|Sale/.test(bd.t6), 'no badges on canceled or fully sold-out trips');
  ok(await ev(() => /Sale fare available/.test(document.querySelector('#device [data-trip="t3"] [data-cls="Business"]').textContent) && !/Sale/.test(document.querySelector('#device [data-trip="t3"] [data-cls="Coach"]').textContent)), 'Sale also marks the class that has the sale fare');
  // Sale is a fare type: the Sale badge means a Sale fare is one of the choices for that trip and class
  await open(); await find();
  const t3b = await ev(() => document.querySelector('#device [data-trip="t3"] [data-cls="Business"] .s5-class__price').textContent);
  await p.locator(D_ + '[data-trip="t3"] [data-a="s5-fare"][data-cls="Business"]').click(); await w(500);
  const fopts = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt')].map(o => [o.querySelector('.s5-fopt__head span').textContent, o.querySelector('.s5-fopt__price').textContent.split(' ')[0], o.querySelector('input').checked]));
  ok(fopts.map(f => f[0]).join() === 'Sale,Value,Flex' && fopts[0][1] === t3b && fopts[0][2] && /50% cancellation fee/.test(await txt()), `a class with a sale offers a Sale fare type first, at the card’s price (${JSON.stringify(fopts)})`);
  ok(+fopts[1][1].slice(1) > +fopts[0][1].slice(1), 'Value costs more than Sale');
  await p.locator(D_ + '.pane:last-child #s5c-Coach').click(); await w(300);
  ok(!(await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt__head span:first-child')].some(e => e.textContent === 'Sale'))), 'a class without a sale has no Sale fare');
  await p.locator(D_ + '.pane:last-child #s5c-Business').click(); await w(300); await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(/Sale/.test(await txt()) && await ev(() => D().s5sel.dep.fare === 'Sale'), 'choosing the Sale fare carries into the cart and summary');
  await open('returning', "const b = D().booking; b.from = 'NYP'; b.to = 'BOS'; window._s5o = window._s5o || s5Trips; s5Trips = (o => (b, l) => { const r = o(b, l); if (r.list.length < 8) return r; r.list.find(t => t.id === 't7').cls.Coach = r.list.find(t => t.id === 't8').cls.Coach; r.list.forEach(t => { t.low = Math.min(...Object.values(t.cls).filter(x => x != null).concat(Infinity)); }); return r; })(s5Trips)"); await find();
  bd = await badges();
  ok(/Lowest fare/.test(bd.t7) && /Lowest fare/.test(bd.t8), 'tied options both get the badge');
  await ev(() => { s5Trips = window._s5o; });
  await open('returning', "s5().outcome = 'single'"); await find(); bd = await badges();
  ok(Object.values(bd).every(x => !/Lowest|Fastest/.test(x)), 'AC5: one result shows no Lowest fare or Fastest trip');
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'business'"); await find(); bd = await badges();
  ok(Object.values(bd).every(x => !/Lowest fare|Sale/.test(x)) && Object.values(bd).some(x => /Fastest trip/.test(x)), 'Pass Rider business: no Lowest fare and no Sale; Fastest trip still shows');
  // ---- Meeting decisions ----
  await open(); await find(); c = await cards();
  ok(/^\$\d+$/.test(c.find(x => x.id === 't9').cls[0][2]), 'NMA-1138 → NMA-1096: multi-segment trips are priced like single-segment ones (no “from”)');
  ok(/2 left at this price/.test(c.find(x => x.id === 't1').text), 'NMA-762: low inventory is shown for a specific class at its price');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(/Only 2 left at this price/.test(await txt()), 'NMA-762: and on that fare when choosing it');
  await open('returning', "s5().outcome = 'hold'"); await find();
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(!/\d+:\d\d remaining|timer/i.test(await txt()), 'NMA-757: no visible hold timer');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(400);
  ok(/Prices have been refreshed/.test(await txt()) && /30 minutes/.test(await txt()) && !(await ev(() => (D().cart || []).length)), 'NMA-757: after the 30-minute hold, Continue refreshes prices before anything is added');
  await p.locator('.pdialog button', { hasText: 'Review price' }).click(); await w(300);
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(await ev(() => (D().cart || []).length === 1), 'NMA-757: continuing again adds the refreshed fare');
  ok(await ev(() => [...document.querySelector('#tbS5').options].length === S5_OUTCOMES.length) && /\(Sprint 5\)/.test(await ev(() => document.querySelector('label[for="tbS5"]').textContent)), 'the new control is labelled (Sprint 5)');
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'leisure'"); await find();
  ok((await cards())[0].cls.every(k => k[2] === 'Pass Rider fare'), 'Pass Rider: no unapproved prices shown');
  await open(); await find(); await axe('results light');
  await open('returning', '', 'dark'); await find(); await axe('results dark');
  ok(!errs.length, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  await br.close(); process.exit(res.every(r => r[0]) ? 0 : 1);
})();
