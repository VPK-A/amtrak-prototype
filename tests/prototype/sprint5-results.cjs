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
  const open = async (sc = 'returning', js = '', th = 'light') => { await ev(([sc, js, th]) => { TB.v = 1; TB.dev = 'iphone'; TB.orient = 'portrait'; TB.theme = th; TB.s5v = TB.s5vNext || 'legacy'; VS[1] = makeVS(sc); V().toast = null; goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; b.dep = '2026-11-05'; if (js) eval(js); render(); }, [sc, js, th]); await w(300); };
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
  ok(/NYP New York .* WAS Washington/.test(t) && /Thu, Nov 5 · 1 adult · 11 trips/.test(t), 'AC1 header: route, date, travelers and number of results');
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
  ok(/Self-transfer: change stations/.test(by('t10').text) && await ev(() => !document.querySelector('#device .s5-trip__svc .ads-icon') && /Train and bus/.test(document.querySelector('#device [data-trip="t10"] .s5-trip__svc').textContent)), 'no service icon on the card (service type stays for screen readers) and the self-transfer indicator');

  // ---- NMA-1096 classes of service ----
  ok(by('t1').cls.map(k => k[0]).join() === 'Coach,Business' && by('t2').cls.map(k => k[0]).join() === 'Business,First' && by('t7').cls.map(k => k[0]).join() === 'Coach,Rooms', 'classes in order; First only on Acela, rooms on non-Acela; unoffered classes hidden');
  ok(by('t4').cls[1][1] && by('t4').cls[1][2] === 'Sold out' && !by('t4').cls[0][1], 'a sold-out class is shown and disabled beside an available one');
  ok(/^\$\d+$/.test(by('t1').cls[0][2]), 'lowest fare shown per class');

  // ---- NMA-1098 / 1097 / 1095 ----
  ok(/Seat prices are per traveler, one way/.test(await txt()), 'pricing note on the results screen');
  await p.locator(D_ + '[data-topic="s5-pricing"]').click(); await w(400);
  ok(/Seats/.test(await txt()) && /Rooms/.test(await txt()) && /total for all travelers/.test(await txt()), 'pricing sheet explains seat and room prices'); await axe('pricing sheet');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  ok(await ev(() => TB.s5c == null) && await p.locator(D_ + '[data-topic="s5-classes"]').count() === 1 && await p.locator(D_ + '.s5-tools [data-topic="s5-fares"]').count() === 1, 'Concept Update 1 is the default: Compare classes on results, with the fare comparison beside it (NMA-1097)');
  ok(!/crosses the U.S.–Canada border/.test(await txt()), 'no border information on a domestic trip');
  await open('returning', "s5().outcome = 'border'"); await find();
  ok(/This trip crosses the U.S.–Canada border/.test(await txt()), 'border information on a cross-border trip');
  await p.locator(D_ + '[data-topic="s5-border"]').click(); await w(400);
  ok(/passport/.test(await txt()), 'border sheet shows what to expect');

  await open(); await find(); await p.locator(D_ + '[data-trip="t1"] .s5-details').click(); await w(400);
  ok(/Trip details/.test(await txt()) && /Washington/.test(await ev(() => document.querySelector('#device #s5d-panel').innerText)) && !/Amenities/.test(await txt()) && await stack() === 'ff>handoff', 'NMA-1093: Details opens the route without leaving results');
  const nStops = () => ev(() => document.querySelectorAll('#device #s5d-panel .s5-stop').length);
  const s0 = await nStops(); await p.locator(D_ + '[data-a="s5-stops"]').first().click(); await w(300);
  ok(s0 === 2 && await nStops() > 2 && /Hide stops/.test(await txt()) && /Times can change/.test(await txt()), `NMA-1093: collapsed to first and last stop by default, expands to every stop (${s0})`); await axe('trip details');
  await p.locator(D_ + '#s5d-services').click(); await w(300);
  ok(/Amenities and add-ons/.test(await txt()) && /Sprint 6 · NMA-1092/.test(await tags()), 'Services (NMA-1092) is tagged Sprint 6');
  await ev(() => { s5().dtab = 'route'; });
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await p.locator(D_ + '[data-trip="t2"] .s5-details').click(); await w(400);
  ok(/Nonstop · /.test(await txt()) && await p.locator(D_ + '[data-a="s5-stops"]').count() === 0, 'NMA-1093: a nonstop train says so, with no expand');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await p.locator(D_ + '[data-trip="t10"] .s5-details').click(); await w(400);
  t = await txt();
  ok(/Connection in .* · 1h 10m/.test(t) && /Self-transfer/.test(t) && /partner bus company/.test(t) && await ev(() => document.querySelectorAll('#device .s5-seg').length) === 2, 'NMA-1093: each segment separately, with the connection, self-transfer and the bus operator');
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
  ok(!/Assistance isn’t available at this station/.test(await txt()) && await stack() === 'ff>handoff' && await ev(() => !S5_OUTCOMES.some(o => o[0] === 'assist')), 'assistance not available moved to NMA-620 (Sprint 7): no Sprint 5 dialog or outcome');
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
  ok(await stack() === 'ff>handoff>s5faredep' && /Choose a fare/.test(t) && /Proposed · Fare selection/.test(t) && !(await ev(() => (D().cart || []).length)), 'choosing a class opens Choose a fare, tagged Proposed; nothing in the cart yet');
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
  ok(await stack() === 'ff>handoff>s5faredep>handoffret' && /WAS Washington .* NYP New York/.test(await txt()) && /Sprint 6 · NMA-1109/.test(await txt()) && !(await ev(() => (D().cart || []).length)), 'round-trip: the return step follows the departure fare, tagged Proposed');
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
  ok(await ev(() => [...document.querySelector('#tbS5c').options].map(o => o.text.split(':')[0]).join()) === 'Concept Update 1,Concept Update 3,Concept Update 4' && /\(Sprint 5\)/.test(await ev(() => document.querySelector('label[for="tbS5c"]').textContent)), 'concept switcher: Current, Concept Update 1, Concept Update 2 (labelled Sprint 5)');
  await open('returning', "TB.s5c = 'c1'"); await find();
  ok(await p.locator(D_ + '[data-topic="s5-fares"]').count() === 1 && await p.locator(D_ + '[data-topic="s5-classes"]').count() === 1 && /Proposed · Concept Update 1/.test(await tags()), 'Concept 1: Compare classes and Compare fares on results; tagged Proposed');
  await p.locator(D_ + '[data-topic="s5-classes"]').click(); await w(400);
  t = await txt();
  ok(/Compare classes/.test(t) && /Seat/.test(t) && /Lounge/.test(t) && await ev(() => [...document.querySelectorAll('#device .s5-cmp__col')].map(e => e.textContent).join()) === 'Coach,Business,First,Private rooms' && await stack() === 'ff>handoff', 'Concept 1: Compare classes sheet compares each class on these trains without leaving results'); await axe('compare classes');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await p.locator(D_ + '.pane:last-child [data-topic="s5-fares"]').count() === 1, 'Concept 1: fare types are compared on Choose a fare');
  ok(await ev(() => { TB.s5c = 'c2'; return s5c(); }) === 'c1' && await ev(() => { TB.s5c = null; return s5c(); }) === 'c1', 'retired concepts (Current, Concept Update 2) fall back to Concept Update 1'); await ev(() => { TB.s5c = null; });

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
  ok(/3 travelers need 2 Roomettes/.test(await txt()) && /for 3 travelers, 2 rooms/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)) && await ev(u => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent === '$' + (u * 2).toLocaleString('en-US', { minimumFractionDigits: 2 }), unit), 'Choose a fare: says how many rooms, and the total covers both rooms');
  await open('returning', "D().booking.pax.adult = 3"); await find(); c = await cards();
  const card11 = c.find(x => x.id === 't11').cls.find(k => k[0] === 'Rooms')[2];
  await p.locator(D_ + '[data-trip="t11"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  const cb3 = await ev(() => [...document.querySelectorAll('#device .s5-combo')].map(c => c.innerText.replace(/\s+/g, ' ')));
  ok(cb3.every(x => /total for 3 travelers, 2 rooms/.test(x) && /2 rooms for 3 travelers/.test(x) && /3 Coach seats/.test(x) && !/: 1 room\b/.test(x)) && cb3[0].includes(card11.replace('from ', 'From ')), `multi-segment rooms: 2 rooms for 3 travelers, seats for all 3, totals for the party, cheapest = card (${card11})`);
  await p.locator(D_ + '.pane:last-child [data-a="s5-combo"]').last().click(); await w(500);
  const amt3 = await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  ok(/2 Roomettes for 3 travelers/.test(await txt()) && /for 3 travelers, 2 rooms/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)) && /total for 3 travelers, 2 rooms/.test(await txt()), 'the combination’s fares are totals for 3 travelers in 2 rooms');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok((await txt()).includes(amt3.replace('.00', '')), `the trip summary shows the same total (${amt3})`);
  await open(); await find();
  await p.locator(D_ + '[data-trip="t9"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok((await ev(() => document.querySelectorAll('#device .s5-combo').length)) === 1 && /Coach \+ Coach/.test(await txt()), 'Coach on a multi-segment trip is a single all-Coach combination');
  await open(); await find();
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await stack() === 'ff>handoff>s5faredep', 'a direct trip still goes straight to Choose a fare');

  // ---- Overarching updates: header, full screen, Sprint 6 tag, price-first card ----
  await open(); await find();
  ok(await ev(() => { const h = document.querySelector('#device .pane:last-child .ads-navbar__title'); return /NYP New York → WAS Washington/.test(h.textContent) && /Departure · Thu, Nov 5 · 1 adult · 11 trips/.test(h.querySelector('.ads-navbar__sub').textContent); }), 'the route, date, travelers and number of trains are in the header');
  ok(await ev(() => { const s = document.querySelector('#device .psheet'); const d = document.querySelector('#device').getBoundingClientRect(); return s.classList.contains('psheet--full') && Math.abs(s.getBoundingClientRect().top - d.top) < 1 && s.getBoundingClientRect().height >= d.height - 1; }), 'results open full screen, not as a drawer');
  ok(await ev(() => { const c = document.querySelector('#device [data-trip="t1"]'); const amt = c.querySelector('.s5-from__amt'), tm = c.querySelector('.s5-trip__times'); const lo = Math.min(...[...c.querySelectorAll('.s5-class__price')].map(e => +e.textContent.replace(/[^0-9.]/g, '')).filter(Boolean)); return +amt.textContent.replace(/[^0-9.]/g, '') === lo && parseFloat(getComputedStyle(amt).fontSize) > parseFloat(getComputedStyle(tm).fontSize); }), 'the card leads with its lowest price, larger than the times');
  ok(await ev(() => /Canceled/.test(document.querySelector('#device [data-trip="t5"] .s5-from').textContent) && /Sold out/.test(document.querySelector('#device [data-trip="t6"] .s5-from').textContent)), 'canceled and sold-out trips say so where the price would be');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(/Sprint 6 · Out of scope for Sprint 5/.test(await txt()) && await ev(() => !!document.querySelector('#device .pane:last-child .s5-s6 .ads-alert--warning')), 'Choose a fare carries a Sprint 6, out of scope for Sprint 5, tag');
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(/Sprint 6 · Out of scope for Sprint 5/.test(await txt()), 'and so does the trip summary');
  await open(); await find(); await p.locator(D_ + '[data-trip="t11"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  ok(/Sprint 6 · Out of scope for Sprint 5/.test(await txt()), 'and the class combinations');
  // ---- Concept Update 3: rails by type of trip ----
  await open('returning', "TB.s5c = 'c3'"); await find();
  const rails = await ev(() => [...document.querySelectorAll('#device .s5-rail')].map(r => [r.querySelector('.s5-rail__h').firstChild.textContent.trim(), [...r.querySelectorAll('.s5-trip')].map(t => t.dataset.trip).join()]));
  ok(JSON.stringify(rails) === JSON.stringify([['Direct trains', 't1,t2,t3,t4,t5,t6,t7,t8'], ['Multiple trains', 't9,t11'], ['Trips with a bus', 't10']]), `rails: direct, multiple trains, with a bus; every trip, in the default order (${JSON.stringify(rails)})`);
  ok(await ev(() => getComputedStyle(document.querySelector('#device .s5-rail__list')).overflowX === 'auto') && /Proposed · Concept Update 3/.test(await tags()), 'rails scroll sideways; tagged Proposed'); await axe('rails');
  await p.locator(D_ + '.s5-rail [data-trip="t9"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await stack() === 'ff>handoff>s5combodep', 'a card in a rail works the same (multi-segment opens its combinations)');
  // ---- Concept Update 4: departure board ----
  await open('returning', "TB.s5c = 'c4'"); await find();
  ok(await ev(() => [...document.querySelectorAll('#device .s5-row')].map(r => r.dataset.trip).join()) === await ev(() => s5Sorted(s5Trips(D().booking, 'dep').list).map(t => t.id).join()) && await ev(() => !document.querySelector('#device .s5-row .s5-class')), 'departure board: one row per trip, in the default order, classes folded away');
  await p.locator(D_ + '.s5-jump', { hasText: 'Lowest fare' }).click(); await w(400);
  const lowRow = await ev(() => [...document.querySelectorAll('#device .s5-row.is-open')].map(r => r.dataset.trip).join());
  ok(lowRow === 't8' && await ev(() => document.activeElement.id === 's5row-t8') && await ev(() => document.querySelector('#device .s5-row.is-open .s5-class') !== null), `Jump to Lowest fare opens that row in place (${lowRow})`);
  await p.locator(D_ + '#s5row-t1').click(); await w(300);
  ok(await ev(() => document.querySelector('#device #s5row-t1').getAttribute('aria-expanded')) === 'true' && /Proposed · Concept Update 4/.test(await tags()), 'a row opens when tapped; tagged Proposed'); await axe('departure board');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(await stack() === 'ff>handoff>s5faredep', 'choosing a class from the board opens Choose a fare');
  await ev(() => { TB.s5c = null; });

  // ---- Proposed designs are tagged; flagged stories are in the notes ----
  await open(); await find(); t = await txt();
  ok(!/Proposed · NMA-(755|758|760|761|762|1093|1140)/.test(await tags()), 'stories Ready for Design carry no Proposed tag');
  ok(await ev(() => [...NOTES.scope].some(n => /Sprint 6/.test(n) && /1097/.test(n) && /1109/.test(n) && /1092/.test(n) && /757/.test(n) && /Cancelled: NMA-1105, 1138, 1141 and 1169/.test(n))) && await ev(() => [...NOTES.scope].some(n => /NMA-620/.test(n))), 'Sprint 6 moves, cancellations and the NMA-620 move are in the reviewer notes');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  await p.locator(D_ + '.pane:last-child [data-topic="s5-fares"]').click(); await w(300);
  ok(/Compare fare types/.test(await txt()) && /Flex/.test(await txt()) && /About this fare/.test(await txt()) && /Refundability/.test(await txt()) && /Restrictions/.test(await txt()), 'fare comparison (NMA-1097) opens from Choose a fare with description, refundability and restrictions');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);

  // ---- NMA-758 (Ready for Design): sort and filter ----
  await open(); await find();
  const shown = () => ev(() => [...document.querySelectorAll('#device .s5-trip')].map(c => c.dataset.trip).join());
  const allIds = await shown();
  await p.locator(D_ + '[data-a="s5-sf-open"]').click(); await w(400);
  t = await txt();
  ok(/Sort and filter/.test(t) && ['Most direct', 'Departure time', 'Shortest trip', 'Lowest fare', 'Time of day', 'Route', 'Class of service', 'Add-ons', '12a–6a', '6p–12a', 'Acela', 'Bike', 'Golf'].every(x => t.includes(x)) && await ev(() => document.querySelector('#device #s5s-direct').checked), 'the sheet has the four sorts (Most direct by default) and the four filter groups, from the trips returned');
  await p.locator(D_ + 'label[for="s5sf-route-Acela"]').click(); await w(200);
  ok(/Show 2 trains/.test(await txt()), 'the button counts the trains that match');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  ok(await shown() === allIds && await p.locator(D_ + '.s5-sf__n').count() === 0, 'closing without saving changes nothing');
  await p.locator(D_ + '[data-a="s5-sf-open"]').click(); await w(400);
  ok(await ev(() => !document.querySelector('#device #s5sf-route-Acela').checked), 'reopening starts from the saved choices');
  await p.locator(D_ + 'label[for="s5sf-route-Acela"]').click(); await w(150);
  await p.locator(D_ + 'label[for="s5sf-cls-First"]').click(); await w(150);
  await p.locator(D_ + 'label[for="s5s-dep"]').click(); await w(150);
  await p.locator(D_ + '[data-a="s5-sf-save"]').click(); await w(400);
  ok(await shown() === 't2,t6' && (await ev(() => document.querySelector('#device .s5-sf__n').textContent)) === '2' && /Showing 2 of 11 trains · sorted by departure time/.test(await txt()), `saving filters the trips and shows the count of filters (${await shown()})`);
  await p.locator(D_ + '[data-a="s5-sf-open"]').click(); await w(400);
  await p.locator(D_ + '[data-a="s5-sf-clear"]').click(); await w(200);
  ok(await ev(() => document.querySelector('#device #s5s-direct').checked && ![...document.querySelectorAll('#device .info-sheet input[type=checkbox]')].some(x => x.checked)), 'Clear all resets every section to the default');
  await p.locator(D_ + 'label[for="s5sf-tod-night"]').click(); await w(150);
  await p.locator(D_ + '[data-a="s5-sf-save"]').click(); await w(400);
  ok(/No trains match your filters/.test(await txt()) && await p.locator(D_ + '[data-a="s5-sf-reset"]').count() === 1, 'filters with no matches say so');
  await p.locator(D_ + '[data-a="s5-sf-reset"]').click(); await w(300);
  ok(await shown() === allIds, 'Clear filters brings every trip back'); await axe('sort and filter');
  await open('returning', "s5().outcome = 'single'"); await find();
  ok(await p.locator(D_ + '[data-a="s5-sf-open"]').count() === 0, 'one trip: no Sort and filter');

  // ---- NMA-760 (Ready for Design): service and station alerts ----
  await open('returning', "s5().outcome = 'alerts'"); await find();
  const al = await ev(() => [...document.querySelectorAll('#device .s5-alert__type')].map(e => e.textContent));
  ok(al.join('|') === 'Service alert|Station alert · Philadelphia|Station alert · New York|Station alert · Washington|Passenger service notice', `alerts in order: service, station (transfer, origin, destination; most recent first), passenger notice (${al.join('|')})`);
  await p.locator(D_ + '[data-a="s5-alert"]').first().click(); await w(400);
  ok(/winter storm/.test(await txt()) && await stack() === 'ff>handoff', 'an alert opens its full text in the app');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  ok(await p.locator(D_ + '[data-a="s5-fare"]:not([disabled])').count() > 0, 'alerts never block choosing a trip'); await axe('alerts');
  // ---- NMA-755 (approved): Lowest fare, Fastest trip and Sale ----
  const badges = () => ev(() => Object.fromEntries([...document.querySelectorAll('#device .s5-trip')].map(c => [c.dataset.trip, [...c.querySelectorAll('.ads-badge')].map(b => b.textContent).join('/')])));
  let bd = await badges();
  ok(/Fastest trip/.test(bd.t2) && /Lowest fare/.test(bd.t8) && /Sale/.test(bd.t3) && /Delayed/.test(bd.t3) && /Sale/.test(bd.t9), 'Lowest fare, Fastest trip and Sale badges; a delayed trip keeps its badge');
  ok(!/Lowest|Fastest|Sale/.test(bd.t5) && !/Lowest|Fastest|Sale/.test(bd.t6), 'no badges on canceled or fully sold-out trips');
  ok(await ev(() => /Sale fare available/.test(document.querySelector('#device [data-trip="t3"] [data-cls="Business"]').textContent) && !/Sale/.test(document.querySelector('#device [data-trip="t3"] [data-cls="Coach"]').textContent)), 'Sale also marks the class that has the sale fare');
  // Private rooms: choose the room type first (Roomette, Bedroom, Family Room), then the fare type
  await open(); await find();
  await p.locator(D_ + '[data-trip="t7"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  t = await txt();
  const rt = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-room')].map(o => [o.querySelector('.s5-fopt__head span').textContent, o.querySelector('input').disabled, o.querySelector('input').checked]));
  ok(rt.map(x => x[0]).join() === 'Roomette,Bedroom,Family Room' && rt[0][2] && rt[2][1] && /Sold out/.test(t) && /Included in all rooms/.test(t) && /Up to 2 adults and 2 children/.test(t), `room types come first; Roomette chosen; a sold-out type can’t be chosen (${JSON.stringify(rt)})`);
  ok(await ev(() => { const h = [...document.querySelectorAll('#device .pane:last-child .s5-dsec')].map(e => e.textContent); return h.indexOf('Room type') < h.indexOf('Fare'); }), 'the room type comes before the fare type');
  const rmAmt = await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  await p.locator(D_ + '.pane:last-child label[for="s5r-bedroom"]').click(); await w(300);
  const bdAmt = await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot__amt').textContent);
  ok(+bdAmt.replace(/[$,]/g, '') > +rmAmt.replace(/[$,]/g, '') && await ev(() => document.querySelector('#device .pane:last-child [data-a="cart-add"]').dataset.rtype) === 'bedroom', `choosing a Bedroom changes the fares and total (${rmAmt} → ${bdAmt})`);
  await p.locator(D_ + '.pane:last-child [data-a="cart-add"]').click(); await w(500);
  ok(/1 Bedroom for 1 traveler/.test(await txt()) && (await txt()).includes(bdAmt.replace('.00', '')), 'the trip summary names the room type and its total');
  await open('returning', "const b = D().booking; b.pax.adult = 2; b.pax.child = 2"); await find();
  await p.locator(D_ + '[data-trip="t11"] [data-a="s5-fare"][data-cls="Rooms"]').click(); await w(500);
  await p.locator(D_ + '.pane:last-child [data-a="s5-combo"]').first().click(); await w(500);
  t = await txt();
  ok(/Room type/.test(t) && /4 travelers need 2 Roomettes/.test(t) && /for 1 room/.test(t), 'a family of 4: 2 Roomettes, or 1 Family Room');
  await p.locator(D_ + '.pane:last-child label[for="s5r-family"]').click(); await w(300);
  ok(/1 Family Room for 4 travelers/.test(await txt()) && /for 4 travelers, 1 room/.test(await ev(() => document.querySelector('#device .pane:last-child .s5-ffoot').innerText)), 'choosing the Family Room: 1 room for the 4 travelers, across the combination');
  // Fare types by class and route (fare-type definitions)
  await open(); await find();
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  let fnames = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt__head > span:first-child')].map(e => e.textContent));
  ok(fnames.join() === 'Value,Flex,Flex+' && !/Choose a seat|Seat choice included/.test(await txt()) && /2 carry-on free · 2 checked bags free/.test(await txt()) && /1 carry-on free · no free checked bags/.test(await txt()), `reserved Coach: Value, Flex, Flex+; no seat choice; bag allowance per fare (${fnames})`);
  await p.locator(D_ + '.pane:last-child #s5c-Business').click(); await w(300);
  ok(/Choose a seat for a fee/.test(await txt()) && /Seat choice included/.test(await txt()), 'Business: seat choice for a fee on Value and Flex, included with Flex+');
  await p.evaluate(() => document.querySelector('#device .pane:last-child #s5f-FlexPlus').scrollIntoView()); await p.locator(D_ + '.pane:last-child label[for="s5f-FlexPlus"]').click(); await w(300);
  ok(await ev(() => document.querySelector('#device .pane:last-child [data-a="cart-add"]').dataset.fare) === 'Flex+', 'Flex+ can be chosen');
  await open('returning', "const b = D().booking; b.from = 'SEA'; b.to = 'VAC'"); await find();
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(/Choose a seat for a fee/.test(await txt()) && /Seat choice included/.test(await txt()), 'Cascades Coach: seat choice by fare');
  await open('returning', "const b = D().booking; b.from = 'EMY'; b.to = 'SAC'"); await find();
  ok(/Capitol Corridor/.test(await txt()) && (await cards()).every(x => x.cls.map(k => k[0]).join() === 'Coach'), 'Capitol Corridor: unreserved Coach only');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  fnames = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt__head > span:first-child')].map(e => e.textContent));
  ok(fnames.join() === 'Flex' && /Unreserved: sit in any open Coach seat/.test(await txt()), `unreserved Coach: Flex only (${fnames})`);
  await p.locator(D_ + '.pane:last-child [data-a="back"]').click(); await w(400);
  await p.locator(D_ + '[data-trip="t2"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  fnames = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt__head > span:first-child')].map(e => e.textContent));
  ok(fnames.join() === 'Sale,Flex', `unreserved Coach with a sale: Sale and Flex (${fnames})`);
  // Sale is a fare type: the Sale badge means a Sale fare is one of the choices for that trip and class
  await open(); await find();
  const t3b = await ev(() => document.querySelector('#device [data-trip="t3"] [data-cls="Business"] .s5-class__price').textContent);
  await p.locator(D_ + '[data-trip="t3"] [data-a="s5-fare"][data-cls="Business"]').click(); await w(500);
  const fopts = await ev(() => [...document.querySelectorAll('#device .pane:last-child .s5-fopt')].map(o => [o.querySelector('.s5-fopt__head span').textContent, o.querySelector('.s5-fopt__price').textContent.split(' ')[0], o.querySelector('input').checked]));
  ok(fopts.map(f => f[0]).join() === 'Sale,Value,Flex,Flex+' && fopts[0][1] === t3b && fopts[0][2] && /50% cancellation fee/.test(await txt()), `a class with a sale offers a Sale fare type first, at the card’s price (${JSON.stringify(fopts)})`);
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
  ok(Object.values(bd).every(x => !/Lowest|Fastest/.test(x)) && /New train/.test(bd.t4), 'AC6: one result shows no Lowest fare or Fastest trip, but New train still shows');
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'business'"); await find(); bd = await badges();
  ok(Object.values(bd).every(x => !/Lowest fare|Sale/.test(x)) && Object.values(bd).some(x => /Fastest trip/.test(x)), 'Pass Rider business: no Lowest fare and no Sale; Fastest trip still shows');
  // ---- Meeting decisions ----
  await open(); await find(); c = await cards();
  ok(/^\$\d+$/.test(c.find(x => x.id === 't9').cls[0][2]), 'NMA-1138 → NMA-1096: multi-segment trips are priced like single-segment ones (no “from”)');
  ok(/Only 2 seats left at this price/.test(c.find(x => x.id === 't1').text) && /Only 4 seats left at this price/.test(c.find(x => x.id === 't1').text), 'NMA-762: low inventory is shown for each class it applies to, at its price');
  ok(/Only 1 room left at this price/.test(c.find(x => x.id === 't7').text), 'NMA-762: rooms can carry it too');
  await p.locator(D_ + '[data-trip="t1"] [data-a="s5-fare"][data-cls="Coach"]').click(); await w(500);
  ok(/Only 2 seats left at this price/.test(await txt()), 'NMA-762: and on that fare when choosing it');
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
  c = await cards();
  ok(/^\$\d+\.\d\d$/.test(c[0].cls[0][2]) && /Retail fares, before your Pass Rider discount/.test(await txt()) && !/Pass Rider fare/.test(await txt()), 'NMA-1140 Leisure: retail fares, with the policy');
  await p.locator(D_ + '[data-topic="s5-prpolicy"]').click(); await w(400);
  ok(/Pass Rider pricing/.test(await txt()) && /Within 1 hour of departure/.test(await txt()), 'NMA-1140: the Pass Rider policy opens from results');
  await p.locator(D_ + '[data-a="info-close"]').last().click({ force: true }); await w(300);
  await open('passrider', "const b = D().booking; b.intent = 'pr'; b.prType = 'business'"); await find(); c = await cards();
  ok(c.filter(x => x.cls.some(k => !k[1])).every(x => x.cls.filter(k => !k[1]).every(k => k[2] === '$0')), 'NMA-1140 Business travel: every class offered shows $0');
  await open(); await find(); await axe('results light');
  await open('returning', '', 'dark'); await find(); await axe('results dark');
  // ---- Sprint 5/6 story alignment (2026-11-27) ----
  await open('returning', "b.from = 'NYP'; b.to = 'MTR';"); await find();
  await p.locator(D_ + '[data-a="s5-sf-open"]').click(); await w(500);
  ok(/Sort by/.test(await txt()), 'NMA-758: Sort and filter opens on a cross-border route');
  await ev(() => { nav().info = null; render(); }); await p.locator(D_ + '.s5-details').first().click(); await w(500);
  ok(/crosses the U\.S\.–Canada border/.test(await txt()) && await p.locator(D_ + '.info-body [data-a="info-push"][data-topic="s5-border"]').count() === 1 && /Total trip time: .* stops?/.test(await txt()), 'NMA-1093: route details show border inspection info, with the number of stops');
  await ev(() => { nav().info = null; render(); });
  await open('returning'); await find(); await ev(() => openInfo('s5-trip:t11')); await w(400);
  ok(await p.locator(D_ + '.info-body .s5-seg').count() === 3 && await p.locator(D_ + '.info-body .s5-conn').count() === 2, 'NMA-1093: a 3-segment trip lists each segment and both connections');
  await ev(() => openInfo('s5-trip:t3')); await w(400);
  ok(await p.locator(D_ + '.info-body .s5-stop .s5-was').count() >= 2, 'NMA-1093: a delayed train shows scheduled and updated times in the route');
  await ev(() => { nav().info = null; render(); });
  ok(await ev(() => { const l = s5Trips(D().booking, 'dep').list, by = k => [...l].sort(S5_SORTS[k][1]); return by('dep').every((t, i, a) => !i || a[i - 1].dep < t.dep || (a[i - 1].dep === t.dep && a[i - 1].arr <= t.arr)) && by('fare').every((t, i, a) => !i || a[i - 1].first <= t.first); }), 'NMA-758: departure ties sort by arrival; lowest fare uses the first available class');
  await open('returning', "b.trip = 'rt'; b.ret = '2026-11-08'; s5().outcome = 'nodate-both'"); await find();
  ok(/No trains on your dates/.test(await txt()) && /return on/.test(await txt()), 'NMA-759 BR#1.2: both dates unavailable, with the next dates for each');
  await ev(() => { nav().dialog = null; render(); });
  await open('returning', "s5().outcome = 'alerts'"); await find();
  ok(/Station alert · Philadelphia/.test(await txt()), 'NMA-760 AC#2: the transfer station has its alert');
  await open('passrider', "b.prType = 'business'"); await find();
  ok(await ev(() => s5Trips(D().booking, 'dep').list.filter(t => /Acela/.test(t.name)).every(t => !('First' in t.cls))), 'NMA-1140 AC#1: no Acela First on Pass Rider business travel');
  await open('returning', "b.disc = 'military'; b.code = clone(PROFILE_CODES[0]); b.codeState = 'applied';"); await find();
  ok(/Fall Northeast sale: 20% off Northeast Regional Coach, Military apply/.test(await txt()) && !/NMA-764/.test(await tags()), 'NMA-764: the card names the code and the traveler discount together');
  await p.locator(D_ + '[data-topic="s5-disc"]').first().click(); await w(400);
  ok(/Your discounts/.test(await txt()) && /active-duty/.test(await txt()), 'NMA-764: discount rules open from the card');
  await ev(() => { nav().info = null; render(); });
  await open('guest'); await find();
  ok(await p.locator(D_ + '[data-a="sign-in"][data-k="s5-signin"]').count() === 1, 'NMA-975 AC1: guests can sign in from results');
  await ev(() => { V().net = 'offline'; render(); }); await p.locator(D_ + '[data-k="s5-signin"]').click(); await w(400);
  ok(await ev(() => !nav().cover) && /offline/i.test(await txt()), 'NMA-975: offline, sign-in says a connection is needed and doesn’t open');
  await ev(() => { V().net = 'online'; V().toast = null; D().booking.pax.adult = 2; render(); startVerify('sign-in'); endVerify(true); }); await w(500);
  ok(await ev(() => D().signedIn && D().booking.from === 'NYP' && D().booking.pax.adult === 2 && nav().sheet && nav().sheet.stack.some(r => r.s === 'handoff')), 'NMA-975 AC3: after sign-in the results, search and travelers are still there');
  // ---- Figma search results concepts (switcher) ----
  ok(await ev(() => { delete TB.s5v; return s5v() === 'f1' && S5_VIEWS.length === 4 && !!document.querySelector('#tbS5v'); }), 'Concept 1 is the default design; the switcher lists three concepts and the earlier design');
  for (const v of ['f1', 'f2', 'f3']) {
    await ev(v => { TB.s5vNext = v; }, v); await open('returning', "b.disc = 'military'"); await find();
    const c = await cards(), t3 = c.find(x => x.id === 't3'), t5 = c.find(x => x.id === 't5');
    ok(c.length === 11 && c.every(x => x.id) && await p.locator(D_ + '.s5f--' + v).count() === 11, v + ': every trip is listed in the Figma card');
    ok(/Delayed/.test(t3.text) && /Sale/.test(t3.cls.map(x => x[2]).join() + t3.text) && /Military applies/.test(t3.text) && t3.cls.length === 2 && /Canceled/.test(t5.text) && t5.cls.length === 0, v + ': delay, sale, discount and classes are kept; a canceled trip offers no fares');
    ok(/Lowest fare/.test(c.map(x => x.text).join(' ')) && /Fastest trip/.test(c.map(x => x.text).join(' ')) && /Few seats left/.test(c.find(x => x.id === 't1').text) && await p.locator(D_ + '[data-trip="t1"] .s5-class[aria-label*="only 2 seats left at this price"]').count() === 1, v + ': NMA-755 indicators under the duration and the NMA-762 urgency signal per class (count in the accessible name)');
    await axe('Figma ' + v);
  }
  await ev(() => { TB.s5vNext = 'f2'; }); await open('returning'); await find();
  ok(/11 results/.test(await txt()) && /Sort by: Most direct/.test(await txt()) && await p.locator(D_ + '.ads-navbar .s5-hbtn[data-a="s5-sf-open"]').count() === 1, 'Concept 2: results count and sort link, with Filter in the header');
  await p.locator(D_ + '.ads-navbar .s5-hbtn').click(); await w(400); ok(/Sort by/.test(await txt()) && /Time of day/.test(await txt()), 'Concept 2: Filter opens sort and filter (NMA-758)');
  await ev(() => { nav().info = null; TB.s5vNext = 'f1'; }); await open('returning'); await find();
  await p.locator(D_ + '[data-a="s5f-open"][data-trip="t9"]').click(); await w(400);
  ok(await p.locator(D_ + '[data-trip="t9"] .s5f__sum li').count() === 3 && /Service summary/.test(await txt()) && /Reserved seats/.test(await txt()) && await p.locator(D_ + '[data-trip="t9"] .s5fa__sel select option').count() === 2 && await p.locator(D_ + '#s5d-route').click().then(() => w(400)).then(() => p.locator(D_ + '[data-trip="t9"] .s5fr').count()) === 2 && /Departs/.test(await txt()) && /Layover/.test(await txt()) && await p.locator(D_ + '[data-trip="t9"] .s5-class').count() === 2, 'Concept 1: a card opens in place to the service summary, amenities, route and fares');
  await p.locator(D_ + '[data-trip="t9"] [data-a="s5-fare"]').first().click(); await w(600);
  ok(/s5combo|s5fare/.test(await stack()), 'Concept 1: choosing a class still goes on to fares');
  await ev(() => { nav().info = null; TB.s5vNext = 'f1'; }); await open('returning'); await find();
  ok(await p.locator(D_ + '.ads-navbar [data-a="s5-menu"]').count() === 1 && await p.locator(D_ + '.s5-tools__links').isHidden(), 'Concept 1: the header has the options button; the row of links is gone');
  await p.locator(D_ + '[data-a="s5-menu"]').click(); await w(400);
  ok(await p.locator(D_ + '.s5-menu__row').count() === 4 && /Sort and filter/.test(await txt()) && /Compare classes/.test(await txt()) && /Compare fares/.test(await txt()) && /How prices are shown/.test(await txt()), 'Concept 1: options list sort and filter, both comparisons and pricing');
  await p.locator(D_ + '.s5-menu__row[data-topic="s5-fares"]').click(); await w(400); ok(/Refundability/.test(await txt()), 'Concept 1: Compare fares opens from the menu (NMA-1097)');
  await ev(() => { nav().info = null; render(); }); await p.locator(D_ + '[data-a="s5f-open"][data-trip="t1"]').click(); await w(400);
  ok(/Quiet car/.test(await txt()) && !/Add-ons\s*$/m.test(await ev(() => [...document.querySelectorAll('#device .s5fa__item summary')].map(e => e.textContent.trim()).join('\n'))) && await ev(() => document.querySelector('#device [data-trip="t1"]').closest('li') && true), 'Concept 1: amenities list has no Add-ons row');
  await ev(() => { s5().fopen = null; render(); }); ok(await ev(() => Math.round(document.querySelector('#device [data-trip="t1"]').getBoundingClientRect().height)) === 208, 'Concept 1: a collapsed card is 208px tall, as in Figma');
  await ev(() => { delete TB.s5vNext; TB.s5v = 'legacy'; });
  ok(!errs.length, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  await br.close(); process.exit(res.every(r => r[0]) ? 0 : 1);
})();
