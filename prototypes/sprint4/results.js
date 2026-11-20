// =====================================================================
// Sprint 5 · Fare search results (replaces the Sprint 4 "handoff" placeholder; the route name stays 'handoff')
// Sprint 5 stories Ready for Design (Jira, 2026-11-19): NMA-748 one-way results, NMA-1094 trip card info,
//   NMA-1096 classes of service (regular and TripLink/corporate), NMA-759 unsuccessful searches, NMA-1098 pricing
//   explanation (not Pass Rider), NMA-1095 border crossing, NMA-755 trip tags (with New train), NMA-761 cash or
//   points, NMA-758 sort and filter, NMA-762 low inventory, NMA-760 service and station alerts, NMA-1093 route
//   details, NMA-1140 Pass Rider classes and policy.
// Moved to Sprint 6 (shown with a "Sprint 6" tag): NMA-1097 fare comparison table, NMA-1109 round-trip,
//   NMA-1092 available services, NMA-757 fare hold, NMA-705 Buy Points.
// Still in grooming ("Proposed" tag): NMA-764 discounts and coupons. Cancelled: NMA-1105 (Sale is in NMA-755),
//   NMA-1138 (in NMA-1096), NMA-1141 (TripLink is in NMA-1096), NMA-1169 class comparison.
// NMA-759's "assistance not available" case moved to NMA-620 (Sprint 7), so it isn't a Sprint 5 outcome.
// Built from existing components only: Card, Badge, Alert, Button, Link, Accordion, Radio, Info sheet, Dialog.
// All trips, fares and content are mock data standing in for the back end (S3P) and AEM.
// =====================================================================
const S5_OUTCOMES = [['results', 'Trains found'], ['border', 'Trip crosses the U.S.–Canada border'], ['soldout', 'Every train sold out'], ['single', 'Only one train'],
  ['nodate', 'No trains on the departure date'], ['nodate-ret', 'No trains on the return date (round-trip)'], ['noroute', 'Route not served'], ['alerts', 'Trains found, with service and station alerts'], ['hold', 'Fare hold expired after 30 minutes (Sprint 6)']];
const s5 = () => (V().s5 = V().s5 || { outcome: 'results', sort: 'direct', filt: s5NoFilt() });
const s5NoFilt = () => ({ tod: [], route: [], cls: [], add: [] });
// Results concepts (Sprint 5 exploration, from design feedback): compare the experience of each class of service
// (seat type, amenities) on results, instead of leading with fare types.
// Moving forward with Concept Updates 1, 3 and 4 (decided 2026-11-20); Current and Concept Update 2 are retired.
const S5_CONCEPTS = [['c1', 'Concept Update 1: compare classes'], ['c3', 'Concept Update 3: rails by type of trip'], ['c4', 'Concept Update 4: departure board']];
const s5c = () => { const v = typeof TB !== 'undefined' && TB.s5c; return S5_CONCEPTS.some(c => c[0] === v) ? v : 'c1'; };
// Discount pricing concept (Sprint 5 exploration): for a single traveler, seat prices show the discounted price with
// the full price struck through. The discount is the applied promo code or coupon (not in points, NMA-761 AC#3) or,
// failing that, the traveler's discount type. More than one traveler keeps the current pattern. Percentages are
// sample values; the back end prices discounts. Rooms are already priced with discounts (NMA-1098), so they don't change.
const S5_DISC_MODES = [['current', 'Current'], ['strike', 'Strikethrough for one traveler']];
const s5dm = () => (typeof TB !== 'undefined' && TB.s5d) || 'current';
const S5_TDISC_PCT = { military: 10, rpa: 10, senior: 10, pwd: 10, companion: 10, childfare: 50 };
function s5Disc(b) {
  if (s5dm() !== 'strike' || !['standard', 'personal'].includes(intentOf(b)) || travelerCount(b) !== 1) return null;
  const pts = b.pay === 'points';
  if (b.code && b.codeState !== 'ineligible' && !pts) {
    const ben = (b.code.benefit || ''), pc = ben.match(/(\d+)%/), off = ben.match(/\$(\d+)/);
    return { label: `Code ${b.code.code || b.codeText}`, net: p => Math.max(0, pc ? Math.round(p * (100 - +pc[1]) / 100) : off ? p - +off[1] : Math.round(p * 0.9)) };
  }
  const t = paxList(b)[0], k = t && tdiscOf(b, t), pct = S5_TDISC_PCT[k];
  return pct ? { label: TDISC_LABEL[k], net: p => Math.round(p * (100 - pct) / 100) } : null;
}
// Price after the concept's discount (seats only); unchanged in the current design
const s5Net = (b, p, cls) => { const d = s5Disc(b); return d && p != null && cls !== 'Rooms' ? d.net(p) : p; };
// Struck-through full price + discounted price, for display
const s5Strike = (b, p, cls) => { const n = s5Net(b, p, cls); return n !== p ? `<s class="s5-was s5-strike"><span class="ads-sr-only">Was </span>${s5Price(b, p)}</s> <span class="s5-netp"><span class="ads-sr-only">Now </span>${s5Price(b, n)}</span>` : s5Price(b, p); };
// Product-level features by class (sample content; it would come from the content source)
const S5_EXP = {
  Coach: { seat: 'Reclining seat, no middle seat', short: 'Reclining seat', legroom: 'Generous legroom', food: 'Café car, for purchase', lounge: 'Not included', bags: '2 carry-on and 2 checked bags', points: '2 points per $1', icons: ['seat', 'wifi', 'cafe'] },
  Business: { seat: 'Wider leather seat, reserved', short: 'Leather seat', legroom: 'Extra legroom', food: 'Free non-alcoholic drinks', lounge: 'Not included', bags: '2 carry-on and 2 checked bags', points: '3 points per $1', icons: ['seat', 'wifi', 'cafe'] },
  First: { seat: 'Wide leather seat, 1-2 layout', short: 'Wide seat, 1-2 layout', legroom: 'Most legroom', food: 'At-seat meal service', lounge: 'Club lounge before you board', bags: '2 carry-on and 2 checked bags', points: '3 points per $1', icons: ['seat', 'cafe', 'lounge'] },
  Rooms: { seat: 'Private room; seats become beds', short: 'Private room, beds', legroom: 'Private space', food: 'Meals in the dining car included', lounge: 'Lounge access and an attendant', bags: '2 carry-on and 2 checked bags', points: '3 points per $1', icons: ['bedroom', 'lounge', 'cafe'] }
};
// Only features that differ by class are compared; Wi-Fi and bags are the same in every class, so they're a footnote.
const S5_EXP_ROWS = [['seat', 'seat', 'Seat'], ['legroom', 'person', 'Legroom'], ['food', 'cafe', 'Food and drink'], ['lounge', 'lounge', 'Lounge'], ['points', 'star', 'Guest Rewards']];
INFO['s5-classes'] = { title: 'Compare classes', body: () => {
  const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1], leg = top && top.p.leg === 'ret' ? 'ret' : 'dep';
  const offered = S5_CLASS_ORDER.filter(k => s5Trips(D().booking, leg).list.some(t => k in t.cls));
  const val = (k, f) => f === 'wifi' ? 'Free basic Wi-Fi' : S5_EXP[k][f];
  return `<p>${s5tag('Concept Update 1')}</p><p class="ads-body-small">What each class of service on these trains includes. Fare types and their rules are compared in the next step, when you choose a fare.</p>
    <div class="s5-cmp__head" aria-hidden="true">${offered.map(k => `<span class="s5-cmp__col">${s5ClsName(k)}</span>`).join('')}</div>
    ${S5_EXP_ROWS.map(([f, i, l]) => `<div class="s5-cmp__row"><h3 class="ads-group__title s5-cmp__feat">${ic(i, 'ads-icon--sm')}${l}</h3><dl class="s5-cmp__vals">${offered.map(k => `<div class="s5-cmp__val"><dt class="ads-sr-only">${s5ClsName(k)}</dt><dd>${val(k, f)}</dd></div>`).join('')}</dl></div>`).join('')}
    <p class="ads-body-small s5-cmp__all">${ic('wifi', 'ads-icon--sm')} Free Wi-Fi and ${ic('luggage', 'ads-icon--sm')} 2 carry-on and 2 checked bags in every class.</p><p class="info-draft">Sample content. Features by class come from the content source.</p>${snote('Concept Update 1 (design exploration): results show an experience comparison instead of a fare comparison. Fare types move to Choose a fare. This conflicts with NMA-1097 (approved), which puts fare types on results.')}`; } };
const s5tag = id => `<span class="ads-lock s5-tag" title="Proposed design, story not yet approved">Proposed · ${id}</span>`;
const s5s6 = id => `<span class="ads-lock s5-tag s5-tag--s6" title="Planned for Sprint 6">Sprint 6 · ${id}</span>`;
const s5hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
const s5time = m => { const d = ((m % 1440) + 1440) % 1440, h = Math.floor(d / 60), mm = d % 60; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const s5dur = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
const S5_NOW = 9 * 60 + 41; // the device clock (9:41 AM): trains that already left today aren't returned
const S5_CLASS_ORDER = ['Coach', 'Business', 'First', 'Rooms']; // NMA-1096 BR#1.5
const S5_SVC = { train: ['train', 'Train'], trains: ['trip-multiple-train', 'Multiple trains'], mixed: ['trip-multiple-mixed', 'Train and bus'], bus: ['bus', 'Bus'] };

const S5_NEW_TRAIN_ON = true; // NMA-755 AC8: showing the New train badge is configurable
const S5_UNRESERVED = ['SAC', 'EMY', 'OKJ']; // Capitol Corridor stations in the mock: unreserved Coach
// Mock back end: the same search always returns the same trips. Times, durations and fares come "from the back end".
function s5Trips(b, leg) {
  const from = leg === 'ret' ? b.to : b.from, to = leg === 'ret' ? b.from : b.to, date = leg === 'ret' ? b.ret : b.dep;
  const h = s5hash([from, to].sort().join('')), base = 150 + h % 180, fare = 29 + h % 60, out = s5().outcome, via = ST[['PHL', 'NYP', 'WAS', 'CHI', 'ALB'].find(c => c !== from && c !== to && ST[c])];
  // sale (NMA-755) and left (NMA-762) come from the back end per class of service, never from train capacity
  const T = (o) => Object.assign({ svc: 'train', segs: 1, status: 'ok', delay: 0, sale: [], left: {}, add: [], isNew: false }, o);
  let list = [
    T({ id: 't1', num: '171', name: 'Northeast Regional', dep: 6 * 60 + 10, dur: base, cls: { Coach: fare, Business: fare + 38 }, left: { Coach: 2, Business: 4 }, add: ['Bike', 'Pet'] }),
    T({ id: 't2', num: '2151', name: 'Acela', dep: 7 * 60, dur: Math.round(base * 0.82), cls: { Business: fare + 86, First: fare + 210 } }),
    T({ id: 't3', num: '93', name: 'Northeast Regional', dep: 9 * 60 + 25, dur: base + 12, status: 'delayed', delay: 25, cls: { Coach: fare + 8, Business: fare + 46 }, sale: ['Business'], add: ['Pet'] }),
    T({ id: 't4', num: '125', name: 'Northeast Regional', dep: 10 * 60 + 35, dur: base + 6, cls: { Coach: fare + 8, Business: null }, isNew: true, add: ['Bike', 'Pet'] }),
    T({ id: 't5', num: '79', name: 'Carolinian', dep: 11 * 60 + 15, dur: base + 20, status: 'canceled', cls: { Coach: fare + 4, Business: fare + 40 } }),
    T({ id: 't6', num: '2165', name: 'Acela', dep: 13 * 60, dur: Math.round(base * 0.82), cls: { Business: null, First: null } }),
    T({ id: 't7', num: '19', name: 'Crescent', dep: 14 * 60 + 15, dur: base + 28, cls: { Coach: fare - 6, Rooms: fare + 312 }, roomSold: ['family'], left: { Rooms: 1 }, add: ['Bike', 'Pet', 'Golf'] }),
    T({ id: 't8', num: '67', name: 'Northeast Regional', dep: 21 * 60 + 40, dur: base + 190, cls: { Coach: fare - 10, Business: fare + 30 }, add: ['Pet'] }),
    T({ id: 't9', svc: 'trains', segs: 2, num: '141 + 195', name: 'Northeast Regional, 2 trains', dep: 9 * 60 + 50, dur: base + 95, layover: 45, via, segNames: ['Northeast Regional', 'Northeast Regional'], cls: { Coach: fare + 14, Business: fare + 61 }, sale: ['Coach'], add: ['Bike'] }),
    T({ id: 't10', svc: 'mixed', segs: 2, num: '8012 + 181', name: 'Thruway Bus and Northeast Regional', dep: 12 * 60 + 20, dur: base + 140, layover: 70, via, self: true, segNames: ['Thruway Bus', 'Northeast Regional'], segSvc: ['bus', 'train'], cls: { Coach: fare + 2 } }),
    T({ id: 't11', svc: 'trains', segs: 3, num: '449 + 49 + 29', name: 'Lake Shore Limited and Capitol Limited, 3 trains', dep: 15 * 60 + 40, dur: base + 1210, layover: 185, via, segNames: ['Lake Shore Limited', 'Capitol Limited', 'Northeast Regional'], segOffers: [['Coach', 'Rooms'], ['Coach', 'Rooms'], ['Coach']], cls: { Coach: fare + 72, Rooms: fare + 540 }, add: ['Bike', 'Pet'] })
  ];
  const xb = s5Border(from, to); if (xb) list = s5BorderTrips(from, to, h, fare);
  // Unreserved Coach (Capitol Corridor): Coach only, no private rooms; Sale and Flex fares only
  if (S5_UNRESERVED.includes(from) && S5_UNRESERVED.includes(to)) list = [
    T({ id: 't1', num: '524', name: 'Capitol Corridor', dep: 6 * 60 + 50, dur: 170, unreserved: true, cls: { Coach: 36 } }),
    T({ id: 't2', num: '528', name: 'Capitol Corridor', dep: 9 * 60 + 53, dur: 171, unreserved: true, cls: { Coach: 31 }, sale: ['Coach'] }),
    T({ id: 't3', num: '530', name: 'Capitol Corridor', dep: 11 * 60 + 8, dur: 157, unreserved: true, cls: { Coach: 36 } })
  ];
  if (date === TODAY_S) list = list.filter(t => t.status === 'canceled' || t.dep + t.delay > S5_NOW); // NMA-748 AC#4: delayed trains stay until they actually leave; canceled stay by schedule
  if (out === 'soldout') list.forEach(t => Object.keys(t.cls).forEach(k => t.cls[k] = null));
  if (out === 'single') list = list.filter(t => t.id === 't4').map(t => Object.assign(t, { cls: { Coach: fare + 8, Business: fare + 52 } }));
  if (!S5_NEW_TRAIN_ON) list.forEach(t => { t.isNew = false; });
  list.forEach(t => { t.routes = [...new Set(t.segNames || [t.name])]; });
  list.forEach(t => { t.arr = t.dep + t.dur; t.days = Math.floor(t.arr / 1440); t.low = Math.min(...Object.values(t.cls).filter(x => x != null).concat(Infinity)); t.border = out === 'border' || xb; });
  return { from, to, date, list, border: out === 'border' || xb };
}
// Cross-border trips (Sprint 5): real Amtrak corridors into Canada. Montreal: Adirondack from New York via Albany.
// Toronto: Maple Leaf from New York via Albany and Niagara Falls. Vancouver: Cascades from Seattle and Portland, plus Thruway buses.
const s5Border = (a, b) => ST[a] && ST[b] && ST[a].country !== ST[b].country;
function s5BorderTrips(from, to, h, fare) {
  const T = o => Object.assign({ svc: 'train', segs: 1, status: 'ok', delay: 0, sale: [], left: {} }, o), ca = ST[from].country === 'CA' ? from : to, us = ca === from ? to : from, out = ca === to;
  const near = { MTR: ['NYP', 'ALB'], TWO: ['NYP', 'ALB'], VAC: ['SEA', 'PDX'] }[ca], hub = near[0], direct = near.includes(us);
  const viaHub = ST[us === hub ? near[1] : hub];
  const base = { MTR: { NYP: 660, ALB: 520 }, TWO: { NYP: 750, ALB: 600 }, VAC: { SEA: 245, PDX: 470 } }[ca], d = direct ? base[us] : base[hub] + 150 + h % 300;
  const legName = { MTR: ['Adirondack', out ? '69' : '68'], TWO: ['Maple Leaf', out ? '63' : '64'], VAC: ['Amtrak Cascades', out ? '517' : '516'] }[ca];
  if (ca === 'VAC') return [
    T({ id: 't1', num: out ? '517' : '516', name: 'Amtrak Cascades', dep: 7 * 60 + 40, dur: direct ? d : d, segs: direct ? 1 : 2, svc: direct ? 'train' : 'trains', layover: direct ? 0 : 50, via: direct ? null : viaHub, cls: { Coach: fare + 12, Business: fare + 41 } }),
    T({ id: 't2', num: out ? '8501' : '8502', name: 'Thruway Bus', svc: direct ? 'bus' : 'mixed', segs: direct ? 1 : 2, layover: direct ? 0 : 65, via: direct ? null : viaHub, dep: 11 * 60 + 5, dur: d + 25, cls: { Coach: fare - 4 } }),
    T({ id: 't3', num: out ? '519' : '518', name: 'Amtrak Cascades', dep: 17 * 60 + 50, dur: d + 10, segs: direct ? 1 : 2, svc: direct ? 'train' : 'trains', layover: direct ? 0 : 55, via: direct ? null : viaHub, cls: { Coach: fare + 6, Business: null } })
  ];
  return [
    T({ id: 't1', num: legName[1], name: legName[0], dep: (direct ? (us === 'ALB' ? 10 * 60 + 40 : 7 * 60 + 15) : 6 * 60 + 5) + (out ? 0 : 200), dur: d, segs: direct ? 1 : 2, svc: direct ? 'train' : 'trains', layover: direct ? 0 : 60, via: direct ? null : viaHub, cls: { Coach: fare + 48, Business: fare + 96 } }),
    T({ id: 't2', num: `${legName[1]} + 8721`, name: `${legName[0]} and Thruway Bus`, svc: 'mixed', segs: 2, layover: 40, via: viaHub, self: false, dep: 9 * 60 + 50, dur: d + 140, cls: { Coach: fare + 30 } })
  ];
}
// NMA-748 AC#6: most direct, then earliest scheduled departure, then shortest, then lowest fare. Status and inventory never move a trip.
const S5_SORTS = { direct: ['Most direct', (a, b) => a.segs - b.segs || a.dep - b.dep || a.dur - b.dur || a.low - b.low], dep: ['Departure time', (a, b) => a.dep - b.dep || a.segs - b.segs], dur: ['Shortest trip', (a, b) => a.dur - b.dur || a.dep - b.dep], fare: ['Lowest fare', (a, b) => a.low - b.low || a.dep - b.dep] };
const s5Sorted = (list) => [...list].sort(S5_SORTS[s5().sort][1]);
const s5Travelers = b => { const it = intentOf(b), n = travelerCount(b); return it === 'standard' || it === 'personal' ? paxSummary(b) : `${n} traveler${n === 1 ? '' : 's'}`; };
// NMA-761 (approved): the back end returns points prices; the app never converts. This mock shows 1 point as about 2.9 cents.
const s5Price = (b, usd) => b.pay === 'points' && ['standard', 'personal'].includes(intentOf(b)) ? `${(Math.round(usd / 0.029 / 10) * 10).toLocaleString('en-US')} pts` : `$${usd.toLocaleString('en-US')}`;
const s5Cents = v => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---------- Supporting content (configurable: comes from AEM, never hard-coded in the app) ----------
INFO['s5-pricing'] = { title: 'How prices are shown', body: () => `<p><b>Seats</b> (Coach, Business, First): the price is for one adult, one way, before discounts. Discounts you chose are applied in your cart.</p><p><b>Rooms</b>: the price is the total for all travelers in the room, with your discounts already applied.</p><p>Each price is the lowest fare still available in that class.</p>${snote('NMA-1098: pricing explanation. Content is configurable (AEM) and available offline.')}` };
INFO['s5-fares'] = { title: 'Compare fare types', body: () => {
  const s6 = `<p>${s5s6('NMA-1097 fare comparison table')}</p>`;
  const rows = [['Changes', n => S5_FT[n].changes], ['Cancellation', n => S5_FT[n].cancel], ['Guest Rewards points', () => '100% of points earned'], ['Personal item', () => '1 free'], ['Carry-on bags', n => `${S5_FT[n].carry} free, $20 per extra`], ['Checked bags', n => `${S5_FT[n].checked || 'None'} free, $20 per extra`], ['Seat choice', n => ({ Sale: 'Not available (Cascades Coach: auto-assigned)', Value: 'For a fee in Business and on Cascades Coach', Flex: 'For a lower fee in Business and on Cascades Coach', 'Flex+': 'Included in Business and on Cascades Coach' })[n]]];
  return `${s6}<div class="s5-fares">${Object.keys(S5_FT).map(n => `<details class="ads-accordion ads-accordion--sm s5-fares__ft"${n === 'Sale' ? ' open' : ''}><summary>${n}${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="cpn-dl">${rows.map(([l, f]) => `<dt>${l}</dt><dd>${f(n)}</dd>`).join('')}</dl></div></details>`).join('')}</div>
    <p class="ads-body-small"><b>Which fares you’ll see:</b> reserved Coach and Business offer Value, Flex and Flex+. Unreserved Coach offers Flex. Sale is added when a trip and class have a sale fare.</p>
    <p class="info-draft">Sample content from the fare-type definitions. Bag fees and seat-choice prices come from the content source.</p>${snote('NMA-1097 “Fare comparison table” moved to Sprint 6 (Ready for Design there). Content comes from the back end and works offline. Fare types follow the definitions for Coach Reserved (all routes and Cascades), Business and Coach Unreserved. First and private rooms aren’t in those definitions yet.')}`; } };
INFO['s5-prpolicy'] = { title: 'Pass Rider pricing', body: () => `<p><b>Leisure travel</b></p><p>Prices shown are retail fares. Your Pass Rider discount is applied when you choose a fare. Within 1 hour of departure, the discounted Pass Rider fare is shown instead.</p><p>Child and disability discounts are applied on top of your Pass Rider discount.</p><p><b>Business travel</b></p><p>Every class you can book shows $0. On Acela, Business class is available and First class isn’t.</p><p class="info-draft">Sample policy. The policy text comes from the content source (AEM).</p>${snote('NMA-1140 (Ready for Design): classes offered and Pass Rider prices come from the back end; the app shows what’s returned. Auto Train restrictions are NMA-1016. Leisure discount details on results are NMA-764 (grooming). Testing can’t finish before Jan 18; design and build are in Sprint 5.')}` };
INFO['s5-border'] = { title: 'Crossing the U.S.–Canada border', body: () => `<p><b>Before you book</b></p><p>Every traveler needs a valid passport or other approved travel document. Enter each traveler’s name exactly as it appears on that document.</p><p><b>At the border</b></p><p>Customs and immigration officers board the train or meet it at the station. Inspections can add time to your trip.</p><p><b>Good to know</b></p><p>Arrive at least 60 minutes before departure. Children traveling without both parents may need a consent letter.</p><p class="info-draft">Sample content. Requirements come from the content source.</p>${snote('NMA-1095: shown only when the trip crosses the U.S.–Canada border. Content is configurable and available offline.')}` };
// NMA-758 (Ready for Design): Sort (one option, Most direct by default) and Filters (time of day, route, class of
// service, add-ons; any number, OR within a group). Routes, classes and add-ons come from the trips returned.
// Exit discards changes; Show trains saves them; Clear all resets to the default. Works offline.
const S5_TOD = [['night', '12a–6a', 0, 360], ['morning', '6a–12p', 360, 720], ['afternoon', '12p–6p', 720, 1080], ['evening', '6p–12a', 1080, 1440]];
const S5_ADDONS = ['Bike', 'Pet', 'Golf'];
const s5FiltCount = f => f.tod.length + f.route.length + f.cls.length + f.add.length;
const s5Filtered = (list, f) => list.filter(t => (!f.tod.length || f.tod.some(k => { const x = S5_TOD.find(y => y[0] === k), m = t.dep % 1440; return m >= x[2] && m < x[3]; }))
  && (!f.route.length || t.routes.some(r => f.route.includes(r))) && (!f.cls.length || f.cls.some(k => k in t.cls)) && (!f.add.length || f.add.some(a => t.add.includes(a))));
const s5Leg = () => { const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1]; return top && top.p && top.p.leg === 'ret' ? 'ret' : 'dep'; };
INFO['s5-sort'] = { title: 'Sort and filter', body: () => {
  const st = s5(), d = st.draft = st.draft || { sort: st.sort, f: JSON.parse(JSON.stringify(st.filt)) };
  const all = s5Trips(D().booking, s5Leg()).list, n = s5Filtered(all, d.f).length;
  const routes = [...new Set(all.flatMap(t => t.routes))], clss = S5_CLASS_ORDER.filter(k => all.some(t => k in t.cls)), adds = S5_ADDONS.filter(a => all.some(t => t.add.includes(a)));
  const box = (g, v, l) => { const id = `s5sf-${g}-${v.replace(/\W+/g, '')}`; return `<label class="ads-choice ads-checkbox" for="${id}"><input type="checkbox" id="${id}" data-a="s5-sf" data-g="${g}" data-v="${esc(v)}" ${d.f[g].includes(v) ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${esc(l)}</span></span></label>`; };
  const set = (g, legend, items) => items.length ? `<fieldset class="ads-fieldset s5-sortset"><legend class="ads-group__title">${legend}</legend>${items.join('')}</fieldset>` : '';
  return `<fieldset class="ads-fieldset s5-sortset"><legend class="ads-group__title">Sort by</legend>${Object.entries(S5_SORTS).map(([k, [l]]) => `<label class="ads-choice ads-radio" for="s5s-${k}"><input type="radio" name="s5sort" id="s5s-${k}" data-a="s5-sf" data-g="sort" data-v="${k}" ${d.sort === k ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${l}</span></span></label>`).join('')}</fieldset>
    <h3 class="s5-sf__h">Filter by</h3>
    ${set('tod', 'Time of day', S5_TOD.map(([k, l]) => box('tod', k, l)))}${set('route', 'Route', routes.map(r => box('route', r, r)))}${set('cls', 'Class of service', clss.map(k => box('cls', k, s5ClsName(k))))}${set('add', 'Add-ons', adds.map(a => box('add', a, a)))}

    <p class="info-draft">Time of day uses the scheduled departure. Routes, classes and add-ons list what these trips offer, as returned by the back end. Closing without “Show” keeps your current results.</p><div class="s5-sf__actions"><button class="ads-btn ads-btn--block" type="button" data-a="s5-sf-save">${n ? `Show ${n} train${n === 1 ? '' : 's'}` : 'Show results'}</button><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="s5-sf-clear">Clear all</button></div>${snote('NMA-758 (Ready for Design): Most direct is the default sort. Filters can be combined; within a group a trip matches any choice. The count of filters shows next to “Sort and filter” on results. Sort and filter is hidden when there’s only one trip. Add-ons beyond Bike, Pet and Golf are NMA-1172 (future).')}`;
} };
A['s5-sf-open'] = () => { s5().draft = null; openInfo('s5-sort', '[data-a="s5-sf-open"]'); };
A['s5-sf'] = t => { const d = s5().draft, g = t.dataset.g, v = t.dataset.v; if (g === 'sort') d.sort = v; else d.f[g] = d.f[g].includes(v) ? d.f[g].filter(x => x !== v) : [...d.f[g], v]; pendingFocus = `#${t.id}`; render(); };
A['s5-sf-save'] = () => { const st = s5(), d = st.draft; st.sort = d.sort; st.filt = d.f; st.draft = null; nav().info = null; pendingFocus = '[data-a="s5-sf-open"]'; render(); };
A['s5-sf-clear'] = () => { s5().draft = { sort: 'direct', f: s5NoFilt() }; pendingFocus = '#s5s-direct'; render(); };
A['s5-sf-reset'] = () => { s5().filt = s5NoFilt(); pendingFocus = '[data-a="s5-sf-open"]'; render(); };

// Trip details: Route (NMA-1093, Ready for Design) and Services (NMA-1092, Sprint 6), as in the current app
const S5_AMENITIES = [['luggage', 'Checked baggage', 'Check up to 2 bags at staffed stations on this train. Carry-on bags are always free.'], ['cafe', 'Café car', 'Snacks, light meals and drinks for purchase.'], ['lounge', 'Lounge access', 'Station lounges for private room travelers before you board.', true], ['wifi', 'Free Wi-Fi', 'Basic Wi-Fi for browsing and email.'], ['pet', 'Pet', 'Small dogs and cats up to 20 lb in a carrier. A fee applies.']];
// Northeast Corridor stops in order (sample); a segment lists the ones between its two ends. Other routes: ends only.
const S5_NEC = [['New York'], ['Newark', 'Newark, NJ · Newark Penn Station'], ['Metropark', 'Metropark, NJ · Metropark Station'], ['Trenton', 'Trenton, NJ · Trenton Transit Center'], ['Philadelphia'], ['Wilmington', 'Wilmington, DE · Joseph R. Biden, Jr. Railroad Station'], ['Baltimore', 'Baltimore, MD · Penn Station'], ['Washington']];
const s5Between = (a, z) => { const i = S5_NEC.findIndex(x => x[0] === a), j = S5_NEC.findIndex(x => x[0] === z); if (i < 0 || j < 0) return []; const seg = i < j ? S5_NEC.slice(i + 1, j) : S5_NEC.slice(j + 1, i).reverse(); return seg.filter(x => x[1]).map(x => x[1]); };
A['s5-dtab'] = t => { s5().dtab = t.dataset.v; pendingFocus = `#s5d-${t.dataset.v}`; render(); };
A['s5-stops'] = t => { const o = s5().stops = s5().stops || {}; o[t.dataset.k] = !o[t.dataset.k]; pendingFocus = `[data-a="s5-stops"][data-k="${t.dataset.k}"]`; render(); };
function s5Details(id) {
  const b = D().booking, leg = s5Leg(), r = s5Trips(b, leg), t = r.list.find(x => x.id === id); if (!t) return { title: 'Trip details', body: () => '' };
  const tab = s5().dtab || 'route', tb = (k, l) => `<button class="ads-tab" type="button" role="tab" id="s5d-${k}" aria-selected="${tab === k}" aria-controls="s5d-panel" tabindex="${tab === k ? 0 : -1}" data-a="s5-dtab" data-v="${k}">${l}</button>`;
  const am = S5_AMENITIES.filter(([, , , rooms]) => !rooms || 'Rooms' in t.cls);
  const services = `<p>${s5s6('NMA-1092')}</p><div class="ads-summary s5-dsum"><p class="ads-summary__title s5-dsum__name">${ic(S5_SVC[t.svc][0])}${esc(t.name)} ${t.num}</p><p class="s5-dsum__icons" aria-hidden="true">${am.map(([i]) => ic(i)).join('')}</p><p class="s5-dsum__cls">${S5_CLASS_ORDER.filter(k => k in t.cls).map(k => k === 'Rooms' ? 'Private rooms' : k).join(', ')}</p></div>
    <h3 class="ads-group__title s5-dsec">Amenities and add-ons</h3><div class="s5-amen">${am.map(([i, n, d]) => `<details class="ads-accordion ads-accordion--sm"><summary><span class="s5-amen__label">${ic(i)}${n}</span>${ic('chevron-down')}</summary><div class="ads-accordion__panel"><p>${d}</p></div></details>`).join('')}</div>`;
  // NMA-1093: collapsed by default (first and last stop of each segment); expand to every stop. Nonstop trains say so.
  // Multi-segment trips list each segment, with the connection between them; self-transfers explain the change of station.
  const day = m => fmtShort(addDays(r.date, Math.floor(m / 1440))), stn = s => `${esc(s.city)}, ${s.st} · ${esc(s.name)}`;
  const segs = t.segs === 1 ? [{ name: `${t.name} ${t.num}`, svc: t.svc, a: [t.dep, stn(ST[r.from])], z: [t.arr, stn(ST[r.to])], ac: ST[r.from].city, zc: ST[r.to].city }] : (() => {
    const leg1 = Math.round((t.dur - t.layover) / t.segs), names = t.segNames, nums = String(t.num).split(' + ');
    return names.map((n, i) => { const a = t.dep + i * (leg1 + t.layover), z = a + leg1; const A0 = i ? t.via : ST[r.from], Z0 = i === names.length - 1 ? ST[r.to] : t.via; return { name: `${n} ${nums[i] || ''}`.trim(), svc: (t.segSvc || [])[i] || 'train', a: [a, stn(A0)], z: [z, stn(Z0)], ac: A0.city, zc: Z0.city }; });
  })();
  const nonstop = t.segs === 1 && /Acela/.test(t.name) && t.id === 't2';
  const segHtml = segs.map((s, i) => {
    const k = `${t.id}-${i}`, openStops = (s5().stops || {})[k], mids = nonstop || s.svc === 'bus' ? [] : s5Between(s.ac, s.zc).filter((x, j) => /Acela/.test(s.name) ? j % 2 === 0 : true), span = s.z[0] - s.a[0];
    const mid = mids.map((x, j) => { const m = s.a[0] + Math.round(span * (j + 1) / (mids.length + 1)); return `<li class="s5-stop s5-stop--mid"><span class="s5-stop__t">${s5time(m)}</span><span class="s5-stop__n">${esc(x)}</span></li>`; }).join('');
    const conn = i < segs.length - 1 ? `<p class="s5-conn">${ic(t.self ? 'walk' : 'clock', 'ads-icon--sm')}<span><b>Connection in ${esc(t.via.city)} · ${s5dur(t.layover)}</b>${t.self ? '<br>Self-transfer: you change stations on your own. Allow time to collect bags and walk between stations.' : ''}</span></p>` : '';
    return `<section class="s5-seg" aria-label="Segment ${i + 1}: ${esc(s.name)}"><p class="s5-seg__h">${ic(s.svc === 'bus' ? 'bus' : 'train', 'ads-icon--sm')}<b>${esc(s.name)}</b>${s.svc === 'bus' ? '<span class="s5-seg__op">Operated by a partner bus company</span>' : ''}</p>
      <ol class="s5-stops"><li class="s5-stop"><span class="s5-stop__t">${s5time(s.a[0])}<br><span class="ads-text-secondary">${day(s.a[0])}</span></span><span class="s5-stop__n">${s.a[1]}</span></li>${openStops ? mid : ''}<li class="s5-stop"><span class="s5-stop__t">${s5time(s.z[0])}<br><span class="ads-text-secondary">${day(s.z[0])}</span></span><span class="s5-stop__n">${s.z[1]}</span></li></ol>
      ${nonstop ? `<p class="s5-seg__ns">Nonstop · ${s5dur(t.dur)}</p>` : mids.length ? `<button class="ads-link ads-link--sm linkbtn" type="button" data-a="s5-stops" data-k="${k}" aria-expanded="${!!openStops}">${openStops ? 'Hide stops' : `Show all ${mids.length + 2} stops`}</button>` : ''}</section>${conn}`;
  }).join('');
  const note = V().net === 'offline' ? alertBox('info', 'You’re offline', 'These are the last times we received. They might not be up to date.') : `<p class="ads-helper">${ic('info-circle', 'ads-icon--sm')}<span>Times can change before your trip. ${t.status === 'delayed' ? `This train is running ${t.delay} minutes late.` : ''}</span></p>`;
  const route = `${note}${segHtml}<p class="s5-seg__tot">Total trip time: ${s5dur(t.dur)}</p>`;
  return { title: 'Trip details', body: () => `<div class="ads-tabs ads-tabs--fill" role="tablist" aria-label="Trip details">${tb('route', 'Route')}${tb('services', 'Services')}</div><div id="s5d-panel" role="tabpanel" aria-labelledby="s5d-${tab}" class="s5-dpanel">${tab === 'services' ? services : route}</div><p class="info-draft">Sample stops and times. Route details come from the back end (travel services); self-transfer and inspection details from AEM.</p>${snote('NMA-1093 (Ready for Design): route details for every trip, including delayed, canceled and sold-out ones. Open: the label for the time between segments (“Connection” here; today “Layover”). Services is NMA-1092, moved to Sprint 6.')}` };
}

// ---------- Trip card (NMA-1094 trip info, NMA-1096 classes of service) ----------
// Card parts, shared by the card, the rails and the departure board (same rules, different layouts)
function s5Parts(t, r, b, ctx) {
  const svc = S5_SVC[t.svc], canceled = t.status === 'canceled', delayed = t.status === 'delayed', it = intentOf(b);
  const badge = canceled ? `<span class="ads-badge ads-badge--error">Canceled</span>` : delayed ? `<span class="ads-badge ads-badge--warning">Delayed ${t.delay} min</span>` : '';
  // NMA-755: every tied option gets the badge; none on canceled or fully sold-out trips; Sale when any open class has a sale fare
  const onSale = !canceled && ctx.sale && t.sale.some(k => t.cls[k] != null);
  const tags = !canceled && t.low !== Infinity ? [ctx.tags && ctx.low != null && t.low === ctx.low ? ['Lowest fare', 'success'] : null, ctx.tags && t.dur === ctx.fast ? ['Fastest trip', 'success'] : null, onSale ? ['Sale', 'info'] : null, t.isNew ? ['New train', 'neutral'] : null].filter(Boolean).map(([x, k]) => `<span class="ads-badge${k === 'neutral' ? '' : ` ads-badge--${k}`}">${x}</span>`).join('') : '';
  // Delayed: the scheduled time is struck through, with the updated time beside it (NMA-1094)
  const tm = (m) => delayed ? `<span class="s5-t"><s class="s5-was"><span class="ads-sr-only">Scheduled </span>${s5time(m)}</s> <b class="s5-now"><span class="ads-sr-only">Now </span>${s5time(m + t.delay)}</b></span>` : `<span class="s5-t"><b>${s5time(m)}</b></span>`;
  const day = t.days ? ` <span class="s5-day">+${t.days} day${t.days > 1 ? 's' : ''}</span>` : '';
  const times = `<span class="s5-trip__times">${tm(t.dep)}<span class="s5-arrow" aria-hidden="true">→</span><span class="ads-sr-only">to</span>${tm(t.arr)}${day}</span>`;
  const meta = [s5dur(t.dur), t.segs === 1 ? 'Direct' : `${t.segs} segments`, t.segs > 1 ? `${s5dur(t.layover)} layover in ${esc(t.via.city)}` : ''].filter(Boolean).join(' · ');
  const flags = [t.days ? `<span class="s5-flag">${ic('overnight', 'ads-icon--sm')}Overnight</span>` : '', t.self ? `<span class="s5-flag">${ic('walk', 'ads-icon--sm')}Self-transfer: change stations in ${esc(t.via.city)}</span>` : '', t.border ? `<span class="s5-flag">${ic('passport-check', 'ads-icon--sm')}Crosses the border</span>` : ''].join('');
  const disc = !canceled && ctx.disc && t.segs === 1 && t.low !== Infinity ? `<p class="ads-helper ads-helper--success s5-disc">${ic('discount', 'ads-icon--sm')}<span>${s5Disc(b) && t.segs >= 1 ? `Price includes ${esc(s5Disc(b).label)} ${s5tag('Discount pricing')}` : `${esc(ctx.disc)} applies ${s5tag('NMA-764')}`}</span></p>` : '';
  const name = `<span class="s5-trip__svc"><span><b>${esc(t.name)}</b> ${t.num}<span class="ads-sr-only">, ${svc[1]}</span></span></span>`;
  const details = `<button class="ads-link ads-link--sm linkbtn s5-details" type="button" data-a="info" data-topic="s5-trip:${t.id}" data-k="s5t-${t.id}" aria-label="Details for ${esc(t.name)} ${t.num}">Details${ic('info-circle', 'ads-icon--sm')}</button>`;
  // The lowest price on the trip leads the card: the cheapest open seat class per traveler, or a room total
  const open = S5_CLASS_ORDER.filter(k => k in t.cls && t.cls[k] != null);
  let from;
  if (canceled) from = '<span class="s5-from__na">Canceled</span>';
  else if (!open.length) from = '<span class="s5-from__na">Sold out</span>';
  else if (it === 'pr') { // NMA-1140: Business travel shows $0 on every class offered; Leisure shows the retail fare (discount info: NMA-764)
    const k0 = open.filter(k => k !== 'Rooms')[0] || open[0];
    from = b.prType === 'business' ? `<b class="s5-from__amt">$0</b><span class="s5-from__unit">Business travel</span>` : `<span class="s5-from__lab">From</span><b class="s5-from__amt">${s5Cents(t.cls[k0])}</b><span class="s5-from__unit">${k0 === 'Rooms' ? 'per room' : 'retail, per traveler'}</span>`;
  }
  else {
    const seats = open.filter(k => k !== 'Rooms'), pool = seats.length ? seats : ['Rooms'];
    const k0 = pool.reduce((a, k) => s5CardPrice(b, t, r, k) < s5CardPrice(b, t, r, a) ? k : a, pool[0]), v = s5CardPrice(b, t, r, k0);
    from = `<span class="s5-from__lab">From</span><b class="s5-from__amt">${s5Strike(b, v, k0)}</b><span class="s5-from__unit">${k0 === 'Rooms' ? `for ${s5Plural(s5RoomsFor(b, 'roomette'), 'room')}` : 'per traveler'}</span>`;
  }
  const cls = S5_CLASS_ORDER.filter(k => k in t.cls).map(k => {
    const p = t.cls[k], name = k === 'Rooms' ? 'Private rooms' : k, off = p == null || canceled;
    const price = canceled ? 'Not available' : p == null ? 'Sold out' : it === 'pr' ? (b.prType === 'business' ? '$0' : s5Cents(p)) : `${k === 'Rooms' ? 'from ' : ''}${s5Strike(b, s5CardPrice(b, t, r, k), k)}`; // NMA-1138 → NMA-1096: multi-segment priced like single-segment
    const sale = !off && ctx.sale && t.sale.includes(k), left = !off && t.left[k];
    return `<button class="ads-btn ads-btn--secondary s5-class" type="button" data-a="s5-fare" data-trip="${t.id}" data-cls="${k}" ${off ? 'disabled' : ''} aria-label="${name}, ${price.replace(/<[^>]+>/g, '')}${s5Net(b, p, k) !== p ? ` with ${s5Disc(b).label}` : ''}${sale ? ', sale fare available' : ''}${left ? `, ${s5Left(k, left).toLowerCase()}` : ''}${off ? '' : `. See ${name} fares on ${esc(t.name)} ${t.num}`}"><span class="s5-class__name">${name}</span><span class="s5-class__price">${price}</span>${sale ? '<span class="s5-class__sale">Sale fare available</span>' : ''}${left ? `<span class="s5-class__left">${s5Left(k, left)}</span>` : ''}</button>`;
  }).join('');
  const classes = `<div class="s5-classes" role="group" aria-label="Classes of service on ${esc(t.name)} ${t.num}">${cls}</div>`;
  return { canceled, tags, badge, times, meta, flags, disc, name, details, from, classes };
}
// Trip card. Hierarchy: the price leads (top right, largest), then the times, then trip facts, then the classes.
function s5Card(t, r, b, ctx) {
  const x = s5Parts(t, r, b, ctx);
  return `<li class="ads-card s5-trip${x.canceled ? ' is-canceled' : ''}" data-trip="${t.id}">
    <div class="s5-trip__main">
      ${x.tags || x.badge ? `<span class="s5-trip__badges">${x.tags}${x.badge}</span>` : ''}
      <div class="s5-hero">${x.times}<p class="s5-from">${x.from}</p></div>
      <div class="s5-trip__line"><span class="s5-trip__meta">${x.meta}</span>${x.name}${x.details}</div>
      ${x.flags ? `<span class="s5-trip__flags">${x.flags}</span>` : ''}
    </div>${x.disc}
    ${s5c() === 'c1x' ? '' : x.classes}</li>`;
}
// Concept Update 4: a departure-board row (dense, scannable), expanding in place to the classes
function s5Row(t, r, b, ctx) {
  const x = s5Parts(t, r, b, ctx), open = !!(s5().rows || {})[t.id];
  return `<li class="ads-card s5-row${x.canceled ? ' is-canceled' : ''}${open ? ' is-open' : ''}" data-trip="${t.id}">
    <button class="s5-row__head" type="button" data-a="s5-row" data-trip="${t.id}" id="s5row-${t.id}" aria-expanded="${open}" aria-controls="s5rowb-${t.id}">
      <span class="s5-row__l">${x.times}<span class="s5-row__meta">${x.meta} · ${esc(t.name)} ${t.num}</span>${x.tags || x.badge ? `<span class="s5-trip__badges">${x.tags}${x.badge}</span>` : ''}</span>
      <span class="s5-row__r"><span class="s5-from">${x.from}</span>${ic('chevron-down', 'ads-icon--sm s5-row__chev')}</span>
    </button>
    ${open ? `<div class="s5-row__body" id="s5rowb-${t.id}">${x.flags ? `<span class="s5-trip__flags">${x.flags}</span>` : ''}${x.disc}${x.classes}<div class="s5-row__more">${x.details}</div></div>` : ''}</li>`;
}
A['s5-row'] = t => { const o = s5().rows = s5().rows || {}; o[t.dataset.trip] = !o[t.dataset.trip]; pendingFocus = `#s5row-${t.dataset.trip}`; render(); };
A['s5-jump'] = t => { const o = s5().rows = s5().rows || {}; o[t.dataset.trip] = true; pendingFocus = `#s5row-${t.dataset.trip}`; render(); };
// Concept Update 3: rails by type of trip (direct, multiple trains, with a bus). Each rail keeps the default order.
const S5_RAILS = [['Direct trains', t => t.segs === 1 && t.svc !== 'bus'], ['Multiple trains', t => t.svc === 'trains'], ['Trips with a bus', t => t.svc === 'mixed' || t.svc === 'bus']];

// NMA-760: alerts the back end (AEM) returns for this search. Order: service alerts, then station alerts, then
// passenger service notices, each most recent first. All alerts are listed (no swiping between them), stay while
// they're valid, never block choosing a trip, and open their full text in the app.
function s5Alerts(res) {
  const o = ST[res.from], d = ST[res.to];
  return [
    ['service', 'warning', 'Service alert', 'Weather may delay trains', `Trains between ${o.city} and ${d.city} may run up to 60 minutes late through Thursday evening.`, 'A winter storm is expected along the route. Check your train’s status before you go. If your train is canceled, you can change your trip at no cost.'],
    ['station', 'info', `Station alert · ${o.city}`, 'Some escalators are out of service', `At ${o.name}, use the elevators to reach Tracks 5 to 8.`, 'Elevators are at the west end of the concourse. Station staff can help you reach your train. Ask at the information desk.'],
    ['station', 'info', `Station alert · ${d.city}`, 'Shorter ticket office hours', `The ticket office at ${d.name} is open 6:00 AM to 9:00 PM until Dec 31.`, 'Ticket machines and the app are available at all times.'],
    ['notice', 'info', 'Passenger service notice', 'Schedule changes from Dec 14', 'Some trains on this route will leave up to 10 minutes earlier.', 'Check the departure time on your ticket after Dec 14. We’ll let you know if your train changes.']
  ];
}
A['s5-alert'] = t => openInfo(`s5-alert:${t.dataset.i}`, `[data-a="s5-alert"][data-i="${t.dataset.i}"]`);
{ const base = infoTopic; infoTopic = function (topic) { if (!topic.startsWith('s5-alert:')) return base(topic); const a = s5Alerts(s5Trips(D().booking, s5Leg()))[+topic.split(':')[1]]; return { title: a[3], body: () => `<p class="ads-overline">${a[2]}</p><p>${a[4]}</p><p>${a[5]}</p><p class="info-draft">Sample alert. Alerts and their expiry come from the back end (AEM).</p>` }; }; }

// ---------- Results screen ----------
SCR.handoff = (r, ri) => {
  const b = D().booking, leg = r.p.leg === 'ret' ? 'ret' : 'dep', res = s5Trips(b, leg), all = s5Sorted(res.list), list = s5Filtered(all, s5().filt), nf = s5FiltCount(s5().filt), it = intentOf(b), rt = b.trip === 'rt';
  ref('748', '1094', '1096', '759', '1098', '1095', '755', '761', '758', '762', '760', '1093', '1140');
  const open = all.filter(t => t.status !== 'canceled' && t.low !== Infinity);
  const tagsOn = all.length > 1 && open.length > 1; // NMA-755 AC5: one result shows no Lowest fare or Fastest trip
  const prBiz = it === 'pr' && b.prType === 'business', pts = b.pay === 'points' && ['standard', 'personal'].includes(it);
  const ctx = { tags: tagsOn, low: tagsOn && !prBiz ? Math.min(...open.map(t => t.low)) : null, fast: tagsOn ? Math.min(...open.map(t => t.dur)) : null, sale: it !== 'pr', // NMA-755: no Lowest fare on Pass Rider business; no Sale for Pass Rider
    // NMA-761 AC#3 / NMA-764: promo codes and coupons don't apply to points; passenger discounts do
    disc: ['standard', 'personal'].includes(it) ? (b.code && b.codeState !== 'ineligible' && !pts ? `Code ${b.code.code}` : paxList(b).some(t => tdiscOf(b, t) !== 'none') ? 'Your traveler discount' : '') : '' };
  const cart = D().cart || [], inCart = cart.some(x => x.label === `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`);
  snote('Sprint 5 search results, updated to the Jira stories as of 2026-11-19. Ready for Design: NMA-748, 1094, 1096 (now also TripLink/corporate), 759, 1098 (not Pass Rider), 1095, 755 (with New train), 761, 758 (sort and filter), 762 (low inventory), 760 (alerts), 1093 (route details) and 1140 (Pass Rider). Moved to Sprint 6 and tagged “Sprint 6”: NMA-1097 fare comparison table, 1109 round-trip, 1092 services, 757 fare hold, 705 Buy Points. Still in grooming, tagged “Proposed”: NMA-764 discounts and coupons. Cancelled: NMA-1105, 1138, 1141 and 1169.');
  snote('Open points: NMA-755 Sale badge placement (trip and class here) and who flags badges (the back end, per the story). NMA-1093 label for the time between segments (“Connection” here). NMA-759 “assistance not available” moved to NMA-620 (Sprint 7). Buy Points (NMA-705, Sprint 6): 100-point Points + Cash and 400-point full-redemption minimums; nothing designed yet.');
  snote('NMA-748 AC#4: canceled trains come back today only for the agent channel, so showing them needs a back-end change request. The prototype shows one. Choosing a fare is the exit of this sprint: “Add to cart” stays simulated.');
  if (s5dm() === 'strike') snote('Discount pricing concept (design exploration): with one traveler, seat prices show the full price struck through and the price with the applied promo code or coupon, or the traveler’s discount type. Codes don’t apply in points, so points show only a traveler discount. More than one traveler keeps the current pattern (“applies” on the card, prices before discounts). Rooms already include discounts (NMA-1098). Conflict to resolve: NMA-1098 says seat prices are shown before discounts. Discount amounts are sample values from the back end.');
  if (s5c() === 'c1') snote('Concept Update 1 (design exploration, from feedback): the test of showing experience. “Compare classes” replaces “Compare fare types” on results; it compares seat, legroom, food and drink, lounge and points for each class on these trains. Fare types are compared on Choose a fare instead. Selected direction (2026-11-20), with Concept Updates 3 and 4. Flags: NMA-1169 Class of Services Comparison was cancelled on 2026-11-19, so class comparison has no story yet; NMA-1097 (fare comparison table, Sprint 6) puts fare types on results, and here they move to Choose a fare.');
  if (it === 'pr') snote('NMA-1140 (Ready for Design): Business travel shows $0 for every class offered; Leisure shows retail fares, with the Pass Rider policy behind the info button. Within 1 hour of departure the back end returns the discounted fare. Classes offered (for example no Acela First on business travel) come from the back end.');
  if (it === 'corporate') snote('NMA-1096 now covers TripLink (NMA-1141 cancelled): the back end returns the corporate fare for each class; the card is the same as for regular travelers.');
  // The route, date, travelers and number of trains sit in the header (NMA-748 AC1); the body starts with the trips
  const navTitle = `${ST[res.from].code} ${ST[res.from].city} → ${ST[res.to].code} ${ST[res.to].city}`;
  const navSub = `${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)} · ${esc(s5Travelers(b))} · <span id="s5-count">${all.length} train${all.length === 1 ? '' : 's'}</span>`;
  const head = rt ? `<div class="s5-head"><p class="s5-head__step">Step ${leg === 'ret' ? 2 : 1} of 2: choose your ${leg === 'ret' ? 'return' : 'departure'} ${s5s6('NMA-1109')}</p></div>` : '';
  const tools = `<div class="s5-tools"><p class="s5-tools__note">${pts ? `Prices in points, per traveler, one way${s5Disc(b) ? `, with ${esc(s5Disc(b).label)}` : ''}` : s5Disc(b) ? `Seat prices include ${esc(s5Disc(b).label)}, one way` : it === 'pr' ? (b.prType === 'business' ? 'Pass Rider business travel' : 'Retail fares, before your Pass Rider discount') : 'Seat prices are per traveler, one way'} ${it === 'pr' ? `<button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="info" data-topic="s5-prpolicy" aria-label="Pass Rider pricing">${ic('info-circle', 'ads-icon--sm')}</button>` : `<button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="info" data-topic="s5-pricing" aria-label="How prices are shown">${ic('info-circle', 'ads-icon--sm')}</button>`}</p>
    <div class="s5-tools__links">${s5c() === 'c1' ? infoLink('s5-classes', 'Compare classes') : infoLink('s5-fares', 'Fare types')}${all.length > 1 ? `<button class="ads-link ads-link--sm linkbtn" type="button" data-a="s5-sf-open" aria-label="Sort and filter. Sorted by ${S5_SORTS[s5().sort][0]}${nf ? `, ${nf} filter${nf === 1 ? '' : 's'} on` : ''}">Sort and filter${nf ? ` <span class="ads-badge ads-badge--info s5-sf__n">${nf}</span>` : ''}</button>` : ''}</div>
    ${nf && list.length ? `<p class="s5-sf__shown" role="status">Showing ${list.length} of ${all.length} trains · sorted by ${S5_SORTS[s5().sort][0].toLowerCase()}</p>` : ''}
    <p class="s5-proposed">${[s5Disc(b) ? ['Discount pricing', 'strikethrough'] : null, s5c() === 'c1' ? ['Concept Update 1', 'compare classes'] : s5c() === 'c3' ? ['Concept Update 3', 'rails'] : s5c() === 'c4' ? ['Concept Update 4', 'departure board'] : null].filter(Boolean).map(([id, l]) => `<span class="ads-lock s5-tag">Proposed · ${id} ${l}</span>`).join('')}</p></div>`;
  const border = res.border ? alertBox('info', 'This trip crosses the U.S.–Canada border', 'Every traveler needs a valid travel document.', infoLink('s5-border', 'What to expect')) : '';
  const ptsCode = pts && b.code && b.codeState !== 'ineligible' ? alertBox('info', 'Promo codes and coupons don’t apply to points', `Your code ${esc(b.code.code || b.codeText)} isn’t used while prices are in points. It comes back if you switch to cash. Passenger discounts still apply.`) : '';
  const noAssist = b.s5NoAssist ? alertBox('warning', 'Searching without your assistance request', `The assistance you asked for isn’t available at ${esc(ST[b.from].name)}. You chose to continue without it.`) : '';
  const allSold = all.length && !all.some(t => t.low !== Infinity && t.status !== 'canceled') ? alertBox('info', 'Every train is sold out', 'You can still see the full schedule. Go back to try another date.') : '';
  const alerts = s5().outcome === 'alerts' ? (() => { const al = s5Alerts(res); return `<section class="s5-alerts" aria-labelledby="s5-alerts-h"><h3 class="s5-alerts__h" id="s5-alerts-h">${al.length} alerts for this trip</h3><ul class="s5-alerts__list">${al.map(([, tone, type, title], i) => `<li class="s5-alert s5-alert--${tone}">${ic(tone === 'warning' ? 'alert-triangle' : 'info-circle', 'ads-icon--sm')}<span class="s5-alert__body"><span class="s5-alert__type">${esc(type)}</span><b>${esc(title)}</b><button class="ads-link ads-link--sm linkbtn" type="button" data-a="s5-alert" data-i="${i}" aria-label="More about ${esc(title)}">More</button></span></li>`).join('')}</ul></section>`; })() : '';
  const added = inCart ? `<p class="ads-helper ads-helper--success cartdemo" role="status">${ic('check-circle', 'ads-icon--sm')}<span>In your cart</span></p>` : '';
  const details = `<details class="ads-accordion ads-accordion--sm s5-search" open><summary>Search details${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="handoff__list"><dt>Route</dt><dd>${stLabel(b.from)} → ${stLabel(b.to)}</dd><dt>Trip</dt><dd>${rt ? 'Round-trip' : 'One-way'}</dd><dt>Depart</dt><dd>${fmtWeekday(b.dep)}, ${fmtDate(b.dep)}</dd>${rt ? `<dt>Return</dt><dd>${fmtWeekday(b.ret)}, ${fmtDate(b.ret)}</dd>` : ''}${handoffExtra(b)}<dt>Assistance</dt><dd>${b.s5NoAssist ? 'Not included in this search' : b.assistOn && travelerList(b).some(t => assistCat(b, t.key)) ? travelerList(b).filter(t => assistCat(b, t.key)).map(t => `${esc(t.label)}: ${esc(assistSummaryItems(assistRec(b, t.key).m).join(' · '))}`).join('<br>') : 'None requested'}</dd></dl></div></details>`;
  const foot = s5Drawer(b, leg, null);
  let trips;
  if (s5c() === 'c3') {
    snote('Concept Update 3 (selected direction, 2026-11-20): the trips are grouped into rails by type of trip: direct trains, then multiple trains, then trips with a bus. Each rail scrolls sideways and keeps the default order (NMA-748 AC#6), so the most direct trips still come first. Every trip is still shown, with the same card, badges and classes.');
    trips = S5_RAILS.map(([h, f], i) => { const ts = list.filter(f); return ts.length ? `<section class="s5-rail" aria-labelledby="s5rail-${i}"><h3 class="s5-rail__h" id="s5rail-${i}">${h} <span class="s5-rail__n">${ts.length}</span></h3><ul class="s5-rail__list" tabindex="0" aria-label="${h}, ${ts.length} trip${ts.length === 1 ? '' : 's'}. Scroll sideways for more.">${ts.map(t => s5Card(t, res, b, ctx)).join('')}</ul></section>` : ''; }).join('');
  } else if (s5c() === 'c4') {
    snote('Concept Update 4 (selected direction, 2026-11-20): a departure board. Each trip is one dense row (times, duration, train and its lowest price, with its badges) that opens in place to the classes. “Jump to” chips open the lowest-fare, fastest and earliest trip without reordering the list, so the default order (NMA-748 AC#6) holds.');
    const shown = open.filter(t => list.includes(t)), earliest = shown.length ? [...shown].sort((a, c) => (a.dep + a.delay) - (c.dep + c.delay))[0] : null, lowT = ctx.low != null ? shown.find(t => t.low === ctx.low) : null, fastT = ctx.fast != null ? shown.find(t => t.dur === ctx.fast) : null;
    const chip = (t, l) => t ? `<button class="ads-btn ads-btn--secondary ads-btn--sm s5-jump" type="button" data-a="s5-jump" data-trip="${t.id}">${l} · ${s5time(t.dep + t.delay)}</button>` : '';
    const chips = [chip(lowT, 'Lowest fare'), chip(fastT, 'Fastest trip'), chip(earliest, 'Earliest')].join('');
    trips = `${chips ? `<div class="s5-jumps" role="group" aria-label="Jump to a trip"><span class="s5-jumps__l">Jump to</span>${chips}</div>` : ''}<ul class="s5-list s5-board" aria-labelledby="s5-count">${list.map(t => s5Row(t, res, b, ctx)).join('')}</ul>`;
  } else trips = `<ul class="s5-list" aria-labelledby="s5-count">${list.map(t => s5Card(t, res, b, ctx)).join('')}</ul>`;
  // NMA-758: filters that match nothing say so, with a way back
  if (!list.length && all.length) trips = `<div class="s5-nofilt" role="status"><p class="ads-body"><b>No trains match your filters</b></p><p class="ads-body-small">Try fewer filters to see more trains.</p><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="s5-sf-reset">Clear filters</button></div>`;
  return { title: navTitle, titleSub: navSub, kind: 'push', backIcon: true, cls: 'pane--s5', offlineText: 'You can view these trains. Choosing a fare needs a connection.', foot, footCls: foot ? 'ads-actionfooter' : '',
    body: `<h3 class="ads-sr-only">Search results</h3>${head}${added}${alerts}${ptsCode}${noAssist}${border}${allSold}${tools}${trips}${details}` };
};
// Trip details open in the info sheet: route the "s5-trip:<id>" topic
{ const base = infoTopic; infoTopic = function (topic) { return topic.startsWith('s5-trip:') ? s5Details(topic.split(':')[1]) : base(topic); }; }

// Choosing a class: offline can't continue (NMA-748); round-trip goes on to the return (proposed); otherwise the simulated cart
{ const add = A['cart-add'];
  A['cart-add'] = (t, ri) => {
    if (!t.dataset.trip) return add(t, ri);
    if (V().net === 'offline') { toast('You’re offline. Connect to choose a fare.', 'info'); return; }
    // NMA-757 (proposed): fares are held for 30 minutes with no visible timer; the hold resets when the booking changes.
    // When it has run out, Continue refreshes prices and seats before anything goes in the cart.
    if (s5().outcome === 'hold' && !s5().holdDone) { s5().holdDone = true; dialog({ title: 'Prices have been refreshed', body: `We hold a fare for 30 minutes. It’s been longer than that, so we checked this trip again. Review the price before you continue. ${s5s6('NMA-757')}`, returnFocus: '.pane:last-child [data-a="cart-add"]', actions: [['Review price', 'primary', () => render()]] }); return; }
    const b = D().booking, sh = sheet(), top = sh.stack[sh.stack.length - 1];
    const leg = top.p.leg === 'ret' ? 'ret' : 'dep', sel = D().s5sel = D().s5sel || {};
    sel[leg] = { trip: t.dataset.trip, cls: t.dataset.cls, fare: t.dataset.fare, combo: t.dataset.combo != null ? +t.dataset.combo : null, rtype: t.dataset.rtype || null };
    if (b.trip === 'rt' && leg !== 'ret') { push('handoff', { leg: 'ret', out: t.dataset.trip }, sh.stack.length - 1); return; }
    add(t, ri); push('s5sum', {}, sh.stack.length - 1);
  }; }

// ---------- Find trains: unsuccessful outcomes (NMA-759) ----------
function s5Go(ri) {
  const b = D().booking, o = s5().outcome, back = '[data-a="find-trains"]', rt = b.trip === 'rt';
  b.s5NoAssist = false; s5().sort = 'direct'; s5().filt = s5NoFilt(); s5().draft = null; s5().holdDone = false;
  const go = () => { D().s5sel = {}; push('handoff', {}, +ri); };
  const caOnly = ST[b.from] && ST[b.to] && ST[b.from].country === 'CA' && ST[b.to].country === 'CA';
  if (o === 'noroute' || caOnly) { ref('759'); dialog({ title: 'No trains between these stations', body: `We don’t have service from ${esc(ST[b.from].city)} to ${esc(ST[b.to].city)}.${caOnly ? ' Amtrak trains to Canada start or end in the U.S.' : ''} Try a different station nearby.`, returnFocus: back, actions: [['Change stations', 'primary', null]] }); return; }
  if (o === 'nodate' || (o === 'nodate-ret' && rt)) {
    ref('759'); const ret = o === 'nodate-ret', cur = ret ? b.ret : b.dep, next = addDays(cur, 2);
    dialog({ title: `No trains on ${fmtShort(cur)}`, body: `This route doesn’t run on your ${ret ? 'return' : 'departure'} date. The next trains are on ${fmtShort(next)}.${!ret && rt && next > b.ret ? ' Your return date will move to match.' : ''}`, returnFocus: back,
      actions: [[`See trains on ${fmtShort(next)}`, 'primary', () => { if (ret) b.ret = next; else { b.dep = next; if (rt && b.ret < next) b.ret = next; } go(); }], ['Change my search', 'secondary', null]] });
    return;
  }
  // NMA-759 AC (assistance not available at the station) moved to NMA-620, Sprint 7: no Sprint 5 dialog
  go();
}

// =====================================================================
// Choose a fare (proposed pattern, follows the current app: class, fare options with their rules, price, Continue)
// Fare types and their rules are sample content; they come from the back end (see NMA-1097).
// =====================================================================
const S5_CLASS_INFO = { Coach: ['No middle seat and plenty of legroom', 'At-seat power', 'Earn 2 Guest Rewards points per $1'], Business: ['Extra legroom and a reserved seat', 'Complimentary non-alcoholic drinks', 'Earn 3 Guest Rewards points per $1'], First: ['Wide leather seats in a 1-2 layout', 'At-seat meal service', 'Lounge access before you board'], Rooms: ['A private room for up to 2 travelers', 'Meals in the dining car included', 'Lounge access and a dedicated attendant'] };
// Fare types (fare-type definitions, Coach Reserved / Cascades / Business / Coach Unreserved). Every fare earns 100%
// Guest Rewards points and includes 1 personal item. Bag prices are the published sample ($20 per extra bag).
const S5_FT = {
  Sale: { changes: 'No changes permitted', cancel: '50% cancellation fee if canceled before departure', carry: 1, checked: 0 },
  Value: { changes: 'No changes permitted', cancel: '30% cancellation fee if canceled before departure', carry: 1, checked: 0 },
  Flex: { changes: 'Changes permitted with no change fee', cancel: 'Full refund if canceled before departure', carry: 1, checked: 1 },
  'Flex+': { changes: 'Changes permitted with no change fee', cancel: 'Full refund if canceled before departure', carry: 2, checked: 2 }
};
// Seat choice: none on most Coach routes and unreserved Coach; on Cascades Coach and in Business it depends on the fare
const S5_SEAT = { cascades: { Sale: 'Seat auto-assigned', Value: 'Choose a seat for a fee', Flex: 'Choose a seat for a lower fee', 'Flex+': 'Seat choice included' }, business: { Value: 'Choose a seat for a fee', Flex: 'Choose a seat for a lower fee', 'Flex+': 'Seat choice included' } };
const s5Kind = tr => tr && tr.unreserved ? 'unreserved' : tr && /Cascades/.test(tr.name) ? 'cascades' : 'reserved';
const s5Bags = f => `${f.carry} carry-on free · ${f.checked ? `${f.checked} checked bag${f.checked > 1 ? 's' : ''} free` : 'no free checked bags'} · $20 per extra bag`;
function s5FareRules(n, cls, kind) {
  const f = S5_FT[n]; if (!f) return ['Pass Rider travel rules apply'];
  const seat = cls === 'Business' ? S5_SEAT.business[n] : cls === 'Coach' && kind === 'cascades' ? S5_SEAT.cascades[n] : '';
  return [f.changes, f.cancel, seat, s5Bags(f)].filter(Boolean);
}
const S5_RULES = Object.fromEntries(Object.keys(S5_FT).map(n => [n, s5FareRules(n, 'Coach', 'reserved')]));
// NMA-755: Sale is a fare type, not a label on Value. When a class has a sale, the back end returns a Sale fare: the
// class's lowest price (so it's the price on the card), with its own rules, offered alongside Value and Flex.
// The Sale badge on a trip or class means a Sale fare is one of the choices there.
// Which fare types a class offers: reserved Coach (all routes, Cascades included) and Business offer Value, Flex and
// Flex+, plus Sale when there's a sale. Unreserved Coach offers Flex only, plus Sale when there's a sale. The first
// fare is the class's lowest price (the price on the card); the others sit above it. First and private rooms aren't in
// the fare-type definitions, so they keep Flex (First) and Value and Flex (rooms) for now.
function s5Fares(cls, base, sale, kind) {
  const step = cls === 'Rooms' ? 60 : cls === 'Business' ? 18 : 10, up = Math.round(base * 0.15) + 5;
  let names;
  if (cls === 'First') names = sale ? ['Sale', 'Flex'] : ['Flex'];
  else if (cls === 'Rooms') names = ['Value', 'Flex'];
  else if (cls === 'Coach' && kind === 'unreserved') names = sale ? ['Sale', 'Flex'] : ['Flex'];
  else names = sale ? ['Sale', 'Value', 'Flex', 'Flex+'] : ['Value', 'Flex', 'Flex+'];
  return names.map((n, i) => [n, i === 0 ? base : base + (names[0] === 'Sale' ? up : 0) + (i - (names[0] === 'Sale' ? 1 : 0)) * step + (n === 'Flex+' ? step : 0)]);
}
const s5Fid = n => n.replace(/\+/g, 'Plus').replace(/\s/g, '');
const s5SaleOn = (b, tr, cls) => intentOf(b) !== 'pr' && tr.sale.includes(cls) && tr.cls[cls] != null;
const s5ClsName = k => k === 'Rooms' ? 'Private rooms' : k;
// NMA-762: the urgency message and count come from the back end, for one class at its displayed fare (seats or rooms)
const s5Left = (k, n) => `Only ${n} ${k === 'Rooms' ? 'room' : 'seat'}${n === 1 ? '' : 's'} left at this price`;
A['s5-fare'] = (t, ri) => {
  if (V().net === 'offline') { toast('You’re offline. Connect to choose a fare.', 'info'); return; }
  const sh = sheet(), top = sh.stack[sh.stack.length - 1];
  const leg = top.p.leg === 'ret' ? 'ret' : 'dep', tr = top.s === 'handoff' && s5Trips(D().booking, leg).list.find(x => x.id === t.dataset.trip);
  // Multi-segment trips: see the segments and pick a class combination first, then the fare type
  push(tr && tr.segs > 1 ? 's5combo' : 's5fare', { leg, trip: t.dataset.trip, cls: t.dataset.cls }, sh.stack.length - 1);
};
// =====================================================================
// Multi-segment trips (NMA-1096; NMA-1138 is consolidated into it): the card and its prices stay the same as a
// single-segment trip. Choosing a class opens the trip's segments (route information) and the class combinations
// for that class; a combination then goes on to the fare types. Combinations come from the back end; these are mock.
// =====================================================================
function s5Segs(t, res) {
  const n = t.segs, names = t.segNames || (t.name.includes(' and ') ? t.name.replace(/, \d trains$/, '').split(' and ') : Array(n).fill(t.name.replace(/, \d trains$/, '')));
  const nums = String(t.num).split(' + '), share = n === 2 ? [0.55, 0.45] : [0.45, 0.4, 0.15];
  const via2 = n === 3 ? ST[['CHI', 'PGH', 'WAS', 'PHL', 'NYP'].find(c => ![res.from, res.to, t.via && t.via.code].includes(c))] : null;
  const stops = [ST[res.from], t.via, via2, ST[res.to]].filter(Boolean), lay = [t.layover, 60];
  const ride = t.dur - lay.slice(0, n - 1).reduce((a, x) => a + x, 0); let clock = t.dep + t.delay;
  return Array.from({ length: n }, (_, i) => { const d = Math.round(ride * share[i]), s = { i, name: names[Math.min(i, names.length - 1)], num: nums[i] || nums[0], svc: (t.segSvc || [])[i] || 'train', from: stops[i], to: stops[i + 1], dep: clock, arr: clock + d, layover: i < n - 1 ? lay[i] : 0, offers: (t.segOffers || [])[i] || Object.keys(t.cls) }; clock += d + s.layover; return s; });
}
// Party size rules (NMA-611, NMA-1096, NMA-1098): seats are priced per traveler; a private room holds up to 2
// travelers, so a party needs one room for every 2 travelers who take a seat (lap infants share). A room's price is
// for the room, so a party's room total is the room price times the rooms it needs.
// Private room types (current site): choose the room first, then the fare type. Prices are per room; a Bedroom and a
// Family Room cost more than a Roomette (sample multipliers; the back end prices each type).
const S5_ROOM_TYPES = {
  roomette: { name: 'Roomette', mult: 1, cap: 'Up to 2 adults', feats: ['Access to shared restroom and shower facilities'] },
  bedroom: { name: 'Bedroom', mult: 2.6, cap: 'Up to 2 adults', feats: ['2× the space of a Roomette', 'Private in-room sink, restroom and shower'] },
  family: { name: 'Family Room', mult: 1.9, cap: 'Up to 2 adults and 2 children', feats: ['Spans the width of the car', 'Access to shared restroom and shower facilities'] }
};
const S5_ROOMS_ALL = ['Seating by day; upper and lower berths by night', 'Complimentary meals and an attendant', 'Lounge access and priority boarding at select stations', 'Bedding, pillows, towels and linens'];
// Rooms a party needs: Roomettes and Bedrooms hold up to 2 travelers who take a seat (lap infants share); a Family Room
// holds up to 2 adults and 2 children.
function s5RoomsFor(b, type) {
  const n = travelerCount(b), std = ['standard', 'personal'].includes(intentOf(b)) && b.pax, occ = std ? paxOccupied(b.pax) : n;
  if (type !== 'family') return Math.max(1, Math.ceil(occ / 2));
  const p = b.pax || {}, adults = std ? p.adult + p.senior + p.ya : n, kids = std ? p.youth + p.child + Math.max(0, p.infant - lapCap(p)) : 0;
  return Math.max(1, Math.ceil(adults / 2), Math.ceil(kids / 2));
}
const s5Party = (b, type) => ({ n: travelerCount(b), rooms: s5RoomsFor(b, type || 'roomette') });
const s5RoomUnit = (tr, type) => Math.round(tr.cls.Rooms * S5_ROOM_TYPES[type || 'roomette'].mult);
const s5RoomTypesOf = tr => Object.keys(S5_ROOM_TYPES).map(k => ({ k, sold: (tr.roomSold || []).includes(k) }));
const s5RoomName = (type, x) => { const nm = S5_ROOM_TYPES[type || 'roomette'].name; return `${x} ${nm}${x === 1 ? '' : 's'}`; };
// Combinations for the class tapped on the card, priced for the whole party: each segment costs its share of the
// trip at that segment's class (seats × travelers, rooms × rooms needed). The cheapest one is the card's price.
function s5Combos(t, res, k, b, rtype) {
  b = b || D().booking; rtype = rtype || 'roomette';
  const segs = s5Segs(t, res), on = segs.filter(s => s.offers.includes(k));
  if (t.cls[k] == null || !on.length) return [];
  const { n, rooms } = s5Party(b, rtype), ride = segs.reduce((a, s) => a + s.arr - s.dep, 0);
  const segCost = (s, c) => { const share = (s.arr - s.dep) / ride, u = c === 'Rooms' ? s5RoomUnit(t, rtype) : t.cls[c] != null ? t.cls[c] : t.cls.Coach; return share * u * (c === 'Rooms' ? rooms : n); };
  const longest = on.reduce((a, s) => (s.arr - s.dep > a.arr - a.dep ? s : a), on[0]);
  const mk = pick => { const ss = segs.map(s => ({ ...s, cls: pick(s) })); return { segs: ss, total: Math.round(ss.reduce((a, s) => a + segCost(s, s.cls), 0)), rooms: ss.some(s => s.cls === 'Rooms') ? rooms : 0 }; };
  const cheap = mk(s => s === longest ? k : 'Coach'), full = mk(s => s.offers.includes(k) ? k : 'Coach');
  const same = cheap.segs.every((s, i) => s.cls === full.segs[i].cls);
  return (k === 'Coach' ? [full] : same ? [cheap] : [cheap, full]).map((c, i) => ({ ...c, id: i, perTraveler: c.rooms ? null : Math.round(c.total / n), title: c.segs.map(s => s.cls === 'Rooms' ? 'Private room' : s5ClsName(s.cls)).join(' + ') }));
}
// What the results card shows for a class: a seat price per traveler, or a room total for the rooms the party needs.
// On a multi-segment trip it's the cheapest combination, so the card and the next step agree.
function s5CardPrice(b, t, res, k) {
  if (t.cls[k] == null) return null;
  if (t.segs > 1 && res) { const c = s5Combos(t, res, k, b)[0]; if (c) return c.rooms ? c.total : c.perTraveler; }
  if (k === 'Rooms') { const open = s5RoomTypesOf(t).filter(x => !x.sold).map(x => s5RoomUnit(t, x.k) * s5RoomsFor(b, x.k)); return open.length ? Math.min(...open) : null; }
  return t.cls[k];
}
// Fare options for a choice, and what they cost the party: unit is 'traveler', 'room' or 'party' (a combination)
function s5FareSet(b, tr, res, cls, combo, rtype) {
  const { n, rooms } = s5Party(b, rtype);
  if (combo) { const d = s5Fares(cls, 0, s5SaleOn(b, tr, cls) && combo.segs.some(s => s.cls === cls), 'reserved'); return { unit: 'party', rooms: combo.rooms, fares: d.map(([nm, x]) => [nm, combo.total + (cls === 'First' ? 0 : x * (combo.rooms ? combo.rooms : n))]), total: v => v }; }
  const room = cls === 'Rooms';
  return { unit: room ? 'room' : 'traveler', rooms: room ? rooms : 0, fares: s5Fares(cls, room ? s5RoomUnit(tr, rtype) : tr.cls[cls], s5SaleOn(b, tr, cls), s5Kind(tr)), total: v => v * (room ? rooms : n) };
}
A['s5-combo'] = (t, ri) => {
  if (V().net === 'offline') { toast('You’re offline. Connect to choose a fare.', 'info'); return; }
  const r = sheet().stack[+ri]; push('s5fare', { leg: r.p.leg, trip: r.p.trip, cls: r.p.cls, combo: +t.dataset.v }, +ri);
};
const s5Plural = (x, w) => `${x} ${w}${x === 1 ? '' : 's'}`;
const s5SegQty = (b, cls, rtype) => { const { n, rooms } = s5Party(b, rtype); return cls === 'Rooms' ? `${rtype ? s5RoomName(rtype, rooms) : s5Plural(rooms, 'room')} for ${s5Plural(n, 'traveler')}` : s5Plural(n, `${s5ClsName(cls)} seat`); };
const s5PartyLine = (b, rooms) => { const { n } = s5Party(b); return `for ${s5Plural(n, 'traveler')}${rooms ? `, ${s5Plural(rooms, 'room')}` : ''}`; };
SCR.s5combo = (r, ri) => {
  const b = D().booking, leg = r.p.leg, res = s5Trips(b, leg), tr = res.list.find(x => x.id === r.p.trip), it = intentOf(b), pr = it === 'pr';
  const segs = s5Segs(tr, res), combos = s5Combos(tr, res, r.p.cls), room = r.p.cls === 'Rooms';
  snote('Multi-segment trips (NMA-1096, with NMA-1138 consolidated into it): the results card and its prices are the same as for a direct trip. Choosing a class shows the trip’s segments and layovers, then the class combinations for that class, each priced “from” its lowest fare for the whole party: seats per traveler, and a private room (up to 2 travelers each) for every 2 travelers who take a seat, so 3 travelers need 2 rooms. A combination with rooms shows its total for the party. “Select a fare type” goes on to Choose a fare. Proposed: the combination step itself isn’t in a story. Combinations, prices and amenities are sample content from the back end.');
  const code = s => `<span class="s5-seg__codes"><b>${s.from.code}</b> <span aria-hidden="true">→</span><span class="ads-sr-only">to</span> <b>${s.to.code}</b></span>`;
  const segCard = s => `<li class="ads-card s5-seg"><div class="s5-seg__top"><span class="s5-seg__n">Segment ${s.i + 1} of ${segs.length}</span>${code(s)}</div>
      <div class="s5-seg__train">${ic(s.svc === 'bus' ? 'bus' : 'train', 'ads-icon--sm')}<b>${s.num} ${esc(s.name)}</b></div>
      <p class="s5-seg__route"><span><b>${s5time(s.dep)}</b><br>${esc(s.from.city)}, ${s.from.st}</span><span aria-hidden="true">→</span><span class="ads-sr-only">to</span><span><b>${s5time(s.arr)}</b><br>${esc(s.to.city)}, ${s.to.st}</span></p></li>
    ${s.layover ? `<li class="s5-lay">${ic('clock', 'ads-icon--sm')}<span>Layover in ${esc(s.to.city)}, ${s.to.st} · ${s5dur(s.layover)}${tr.self && s.i === 0 ? ' · Self-transfer: change stations' : ''}</span></li>` : ''}`;
  const comboCard = c => `<li class="ads-card s5-combo">
      <p class="s5-combo__price">${pr ? 'Pass Rider fare' : c.rooms ? `From <b>${s5Price(b, c.total)}</b> total ${s5PartyLine(b, c.rooms)}` : `From <b>${s5Price(b, s5Net(b, c.perTraveler, r.p.cls))}</b> per traveler`}</p>
      <h4 class="s5-combo__title">${c.title}</h4>
      <ul class="s5-combo__segs">${c.segs.map(s => `<li>${s.from.code} <span aria-hidden="true">→</span><span class="ads-sr-only">to</span> ${s.to.code}: ${s5SegQty(b, s.cls)}</li>`).join('')}</ul>
      <details class="ads-accordion ads-accordion--sm s5-combo__amen"><summary>Amenities by segment${ic('chevron-down')}</summary><div class="ads-accordion__panel">${c.segs.map(s => `<p><b>${s.from.code} → ${s.to.code}, ${s5ClsName(s.cls)}:</b> ${S5_EXP[s.cls].short}</p>`).join('')}</div></details>
      ${group('', [grow({ a: 's5-combo', data: `data-v="${c.id}" aria-label="Select a fare type for ${c.title}"`, label: 'Select a fare type' })])}</li>`;
  return { title: 'Choose your classes', kind: 'push', backIcon: true, cls: 'pane--s5', offlineText: 'You can view these combinations. Choosing a fare needs a connection.',
    body: `${s5S6()}<p class="s5-head__meta">${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)} · ${esc(s5Travelers(b))} ${s5tag('Class combinations')}</p>
      <h3 class="ads-group__title s5-dsec">Your trip segments</h3><ol class="s5-segs">${segs.map(segCard).join('')}</ol>
      <h3 class="ads-group__title s5-dsec">Choose a ${room ? 'room' : s5ClsName(r.p.cls)} combination</h3>
      ${combos.length ? `<ul class="s5-combos">${combos.map(comboCard).join('')}</ul>` : alertBox('info', 'No combinations available', 'Go back to choose another class.')}` };
};
A['s5-cls'] = (t, ri) => { const r = sheet().stack[+ri]; r.p.cls = t.dataset.v; r.u.fare = null; pendingFocus = `#s5c-${t.dataset.v}`; render(); };
A['s5-pick'] = (t, ri) => { const r = sheet().stack[+ri]; r.u.fare = t.dataset.v; render(); };
A['s5-rtype'] = (t, ri) => { const r = sheet().stack[+ri]; r.u.rtype = t.dataset.v; r.u.fare = null; pendingFocus = `#s5r-${t.dataset.v}`; render(); };
SCR.s5fare = (r, ri) => {
  const b = D().booking, leg = r.p.leg, res = s5Trips(b, leg), tr = res.list.find(x => x.id === r.p.trip), it = intentOf(b), pr = it === 'pr';
  const classes = S5_CLASS_ORDER.filter(k => k in tr.cls), cls = r.p.cls;
  // Rooms: the room type comes first (Roomette, Bedroom, Family Room); it sets the price and how many rooms are needed
  const comboBase = r.p.combo != null ? s5Combos(tr, res, cls, b)[r.p.combo] : null, hasRooms = cls === 'Rooms' || (comboBase && comboBase.rooms);
  const rtypes = hasRooms ? s5RoomTypesOf(tr) : [], rtype = hasRooms ? (rtypes.find(x => x.k === r.u.rtype && !x.sold) || rtypes.find(x => !x.sold) || rtypes[0]).k : null;
  const combo = r.p.combo != null ? s5Combos(tr, res, cls, b, rtype)[r.p.combo] : null, fs = s5FareSet(b, tr, res, cls, combo, rtype);
  const noDisc = fs.rooms > 0; // room prices already include discounts (NMA-1098)
  const fares = pr ? [['Pass Rider', null]] : fs.fares.map(([n, p]) => [n, p, noDisc ? p : s5Net(b, p, cls)]), pick = r.u.fare && fares.some(f => f[0] === r.u.fare) ? r.u.fare : fares[0][0], pf = fares.find(f => f[0] === pick) || fares[0], price = pf[2] != null ? pf[2] : pf[1], disc = s5Disc(b);
  const seats = travelerCount(b), room = fs.rooms > 0, total = price == null ? null : fs.total(price);
  const unitLabel = fs.unit === 'party' ? `total ${s5PartyLine(b, fs.rooms)}` : fs.unit === 'room' ? 'a room' : 'per traveler';
  const label = `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`;
  snote('Choose a fare follows the current app’s pattern (class, fare options with their rules, price and Continue). Proposed design: fare selection isn’t a Sprint 5 story yet. Fare names, rules and prices are sample content from the back end.');
  if (pr) snote('NMA-1140 (grooming): Pass Rider fares aren’t approved, so only “Pass Rider fare” is shown, with no price.');
  const tabs = `<div class="ads-tabs ads-tabs--fill s5-ctabs" role="tablist" aria-label="Class of service">${classes.map(k => { const p = tr.cls[k], off = p == null; return `<button class="ads-tab s5-ctab" type="button" role="tab" id="s5c-${k}" aria-selected="${k === cls}" aria-controls="s5c-panel" tabindex="${k === cls ? 0 : -1}" data-a="s5-cls" data-v="${k}" ${off ? 'disabled aria-disabled="true"' : ''}><span class="s5-ctab__name">${s5ClsName(k)}</span><span class="s5-ctab__price">${off ? 'Sold out' : pr ? 'Pass Rider' : `${s5Price(b, k === 'Rooms' ? p : s5Net(b, p, k))}${k === 'Rooms' ? ' a room' : ''}`}</span></button>`; }).join('')}</div>`;
  const opts = fares.map(([n, p, np]) => `<label class="ads-choice ads-radio s5-fopt${n === pick ? ' is-selected' : ''}" for="s5f-${s5Fid(n)}"><input type="radio" name="s5fare" id="s5f-${s5Fid(n)}" data-a="s5-pick" data-v="${n}" ${n === pick ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span class="s5-fopt__head"><span>${n}</span>${p == null ? '' : `<span class="s5-fopt__price">${noDisc ? s5Price(b, p) : s5Strike(b, p, cls)} <span class="s5-fopt__unit">${unitLabel}</span></span>`}</span>${n === fares[0][0] && tr.left[cls] ? `<span class="ads-choice__supporting s5-fopt__left">${s5Left(cls, tr.left[cls])}</span>` : ''}${s5FareRules(n, cls, s5Kind(tr)).map(x => `<span class="ads-choice__supporting">${x}</span>`).join('')}</span></label>`).join('');
  const sum = `<div class="ads-summary s5-fsum"><div class="ads-summary__head"><div><p class="ads-summary__title">${ic(S5_SVC[tr.svc][0], 'ads-icon--sm')} ${esc(tr.name)} ${tr.num}</p><p class="s5-fsum__route">${esc(ST[res.from].city)} → ${esc(ST[res.to].city)}</p></div>${infoLink(`s5-trip:${tr.id}`, 'Details')}</div><p class="s5-fsum__times"><b>${s5time(tr.dep + tr.delay)}</b> <span aria-hidden="true">→</span><span class="ads-sr-only">to</span> <b>${s5time(tr.arr + tr.delay)}</b> · ${s5dur(tr.dur)}${tr.days ? ` · +${tr.days} day` : ''}</p></div>`;
  const amount = total == null ? 'Pass Rider fare' : b.pay === 'points' && ['standard', 'personal'].includes(it) ? s5Price(b, total) : s5Cents(total);
  const tot = b.trip === 'rt' && leg === 'ret' ? s5Drawer(b, 'ret', { cost: total }) : '';
  const foot = `${tot}<div class="calfoot s5-ffoot"><span><span class="s5-ffoot__label">${b.trip === 'rt' ? (leg === 'ret' ? 'Return' : 'Departure') : 'Price'}</span><b class="s5-ffoot__amt">${amount}</b><span class="s5-ffoot__sub">${s5PartyLine(b, fs.rooms)}${total != null && !room ? (disc && np0(fares, cls) ? `, with ${esc(disc.label)}` : ', before discounts') : ''}</span></span><button class="ads-btn" type="button" data-a="cart-add" data-label="${esc(label)}" data-trip="${tr.id}" data-cls="${cls}" data-fare="${pick}"${combo ? ` data-combo="${combo.id}"` : ''}${rtype ? ` data-rtype="${rtype}"` : ''}>Continue</button></div>`;
  return { title: 'Choose a fare', kind: 'push', backIcon: true, cls: 'pane--s5', offlineText: 'You can view these fares. Choosing one needs a connection.', foot, footCls: 'ads-actionfooter',
    body: `${s5S6()}<p class="s5-head__meta">${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)} · ${esc(s5Travelers(b))} ${s5tag('Fare selection')}</p>${sum}${combo ? `<h3 class="ads-group__title s5-dsec">Classes</h3><div class="ads-summary s5-fsum"><p class="ads-summary__title">${combo.title}</p>${combo.segs.map(s => `<p class="s5-fsum__route">${s.from.code} → ${s.to.code}: ${s5SegQty(b, s.cls, rtype)}</p>`).join('')}</div>` : `<h3 class="ads-group__title s5-dsec">Class</h3>${tabs}`}<div id="s5c-panel" role="tabpanel" aria-labelledby="s5c-${cls}" class="s5-cpanel">${hasRooms ? s5RoomPicker(b, tr, res, cls, r.p.combo, rtypes, rtype, pr) : `<ul class="s5-cinfo">${(cls === 'Coach' && tr.unreserved ? ['Unreserved: sit in any open Coach seat', ...S5_CLASS_INFO.Coach.slice(1)] : S5_CLASS_INFO[cls]).map(x => `<li>${ic('check', 'ads-icon--sm')}${x}</li>`).join('')}</ul>`}
      <fieldset class="ads-fieldset s5-fset"><legend class="ads-group__title s5-dsec">Fare</legend>${opts}</fieldset>${pr ? '' : infoLink('s5-fares', 'Compare fare types')}</div>` };
};

// Room type choice: each type's total for the party (rooms needed × room price, or the combination total), its
// capacity and features; sold-out types can't be chosen. What's included in every room follows.
function s5RoomPicker(b, tr, res, cls, comboId, rtypes, rtype, pr) {
  const { n } = s5Party(b);
  const card = ({ k, sold }) => { const t = S5_ROOM_TYPES[k], rooms = s5RoomsFor(b, k), tot = comboId != null ? (s5Combos(tr, res, cls, b, k)[comboId] || {}).total : s5RoomUnit(tr, k) * rooms;
    return `<label class="ads-choice ads-radio s5-fopt s5-room${k === rtype ? ' is-selected' : ''}${sold ? ' is-sold' : ''}" for="s5r-${k}"><input type="radio" name="s5rtype" id="s5r-${k}" data-a="s5-rtype" data-v="${k}" ${k === rtype ? 'checked' : ''} ${sold ? 'disabled' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span class="s5-fopt__head"><span>${t.name}</span><span class="s5-fopt__price">${sold ? 'Sold out' : pr ? 'Pass Rider fare' : `${s5Price(b, tot)} <span class="s5-fopt__unit">${comboId != null ? 'trip total, ' : ''}for ${s5Plural(rooms, 'room')}</span>`}</span></span><span class="ads-choice__supporting">${t.cap}</span>${t.feats.map(f => `<span class="ads-choice__supporting">${f}</span>`).join('')}${rooms > 1 && !sold ? `<span class="ads-choice__supporting s5-room__need">${s5Plural(n, 'traveler')} need ${rooms} ${t.name}s</span>` : ''}</span></label>`; };
  return `<fieldset class="ads-fieldset s5-fset"><legend class="ads-group__title s5-dsec">Room type</legend>${rtypes.map(card).join('')}</fieldset>
    <h4 class="s5-dsec s5-roomall">Included in all rooms</h4><ul class="s5-cinfo">${S5_ROOMS_ALL.map(x => `<li>${ic('check', 'ads-icon--sm')}${x}</li>`).join('')}</ul>`;
}
// Sprint 6: choosing classes, room types and fare types, and the trip summary, are out of scope for Sprint 5
const s5S6 = () => `<div class="s5-s6">${alertBox('warning', 'Sprint 6 · Out of scope for Sprint 5', 'Choosing classes, room types and fare types, and the trip summary, are planned for Sprint 6. They’re shown here to complete the flow.')}</div>`;
const np0 = (fares, cls) => cls !== 'Rooms' && fares.some(f => f[2] != null && f[2] !== f[1]);
// Trip summary after Continue (the cart and add-ons are outside Sprint 5)
SCR.s5sum = (r, ri) => {
  const b = D().booking, sel = D().s5sel || {}, it = intentOf(b);
  const legCard = leg => { const s = sel[leg]; if (!s) return ''; const res = s5Trips(b, leg), tr = res.list.find(x => x.id === s.trip); if (!tr) return ''; const room = s.cls === 'Rooms', total = it === 'pr' ? null : s5SelTotal(b, tr, res, s), n = travelerCount(b), combo = s.combo != null ? s5Combos(tr, res, s.cls)[s.combo] : null;
    return `<div class="ads-summary s5-fsum"><div class="ads-summary__head"><div><p class="ads-summary__title">${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)}</p><p class="s5-fsum__route">${esc(ST[res.from].city)} → ${esc(ST[res.to].city)}</p></div>${infoLink(`s5-trip:${tr.id}`, 'Details')}</div><p class="s5-fsum__times">${ic(S5_SVC[tr.svc][0], 'ads-icon--sm')} ${esc(tr.name)} ${tr.num} · <b>${s5time(tr.dep + tr.delay)}</b> → <b>${s5time(tr.arr + tr.delay)}</b></p><p class="s5-fsum__route">${combo ? `${combo.title}${s.rtype && combo.rooms ? ` (${S5_ROOM_TYPES[s.rtype].name})` : ''}` : room ? `${s5RoomName(s.rtype, s5RoomsFor(b, s.rtype || 'roomette'))} for ${s5Plural(n, 'traveler')}` : `${n} ${s5ClsName(s.cls)} seat${n === 1 ? '' : 's'}`} · ${esc(s.fare)}${total == null ? '' : ` · ${s5Price(b, total)}`}</p></div>`; };
  snote('Trip summary after Continue: the trip is in the (simulated) cart. Add-ons, seats, traveler details and checkout aren’t part of Sprint 5.');
  return { title: 'Trip summary', kind: 'push', backIcon: true, cls: 'pane--s5',
    body: `${s5S6()}${alertBox('success', 'In your cart', 'Your trip is held in your cart while you finish booking.')}${legCard('dep')}${legCard('ret')}<div class="handoff"><span class="handoff__tag">Prototype handoff</span><p class="ads-body-small">Add-ons (bags, bikes, pets), seats, traveler details and checkout come next. They aren’t part of Sprint 5.</p></div>` };
};

// =====================================================================
// Results drawer (proposed, NMA-761 and NMA-1109): Pay with points on Departure and Return, and on a round trip the
// cost of each leg and the trip total as it builds. Built from the existing Pay with points row and Summary list.
// =====================================================================
const s5PtsOk = b => ['standard', 'personal'].includes(intentOf(b));
function s5LegCost(b, leg, s) {
  s = s || (D().s5sel || {})[leg]; if (!s) return null;
  const res = s5Trips(b, leg), tr = res.list.find(x => x.id === s.trip); if (!tr || tr.cls[s.cls] == null) return null;
  return s5SelTotal(b, tr, res, s);
}
// The chosen class's base price: a multi-segment combination's own price, or the class price
function s5SelTotal(b, tr, res, s) {
  const combo = s.combo != null ? s5Combos(tr, res, s.cls, b, s.rtype)[s.combo] : null, fs = s5FareSet(b, tr, res, s.cls, combo, s.rtype);
  const f = fs.fares.find(x => x[0] === s.fare) || fs.fares[0], v = fs.rooms ? f[1] : s5Net(b, f[1], s.cls);
  return fs.total(v);
}
const s5Money = (b, v) => intentOf(b) === 'pr' ? 'Pass Rider fare' : v == null ? '—' : b.pay === 'points' && s5PtsOk(b) ? s5Price(b, v) : s5Cents(v);
// pending: the fare being chosen on the Choose a fare screen (its leg and cost), so the total shows before Continue
function s5Drawer(b, leg, pending) {
  const rt = b.trip === 'rt', pts = s5PtsOk(b), member = D().signedIn;
  const toggle = pts && !pending ? pointsRow({ id: 's5-points', title: 'Pay with points', sub: b.code && b.pay !== 'points' ? 'Promo codes and coupons don’t apply to points.' : member ? '12,450 points available' : 'You’ll sign in to use your points after you choose a fare.', checked: b.pay === 'points', attrs: 'data-a="s5-points"' }) : '';
  let totals = '';
  if (rt && leg === 'ret') {
    const dep = s5LegCost(b, 'dep'), ret = pending ? pending.cost : null, pr = intentOf(b) === 'pr';
    const row = (l, v, cls = '') => `<div class="s5-tot__row${cls}"><dt>${l}</dt><dd>${v}</dd></div>`;
    const sum = pr ? 'Pass Rider fare' : s5Money(b, (dep || 0) + (ret || 0));
    // Collapsed by default: the summary shows the total; opening it shows each leg. Open or closed is kept while you browse.
    totals = `<details class="ads-accordion ads-accordion--sm s5-totacc"${s5().totOpen ? ' open' : ''}><summary><span class="s5-totacc__sum"><span>${pending ? 'Trip total' : 'Trip total so far'}</span><b>${sum}</b></span>${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="s5-tot" aria-label="Cost of each leg">${row('Departure', s5Money(b, dep))}${row('Return', pending ? s5Money(b, ret) : 'Choose a fare')}</dl></div></details>`;
  }
  return toggle || totals ? `<div class="s5-drawer">${totals}${toggle}</div>` : '';
}
A['s5-points'] = t => {
  const b = D().booking, on = t.checked;
  const done = () => { b.pay = on ? 'points' : 'cash'; pendingFocus = '#s5-points'; render(); };
  // NMA-761 AC#3: switching to points keeps the code but doesn't use it; the results say so (no dialog, no data lost)
  if (on && b.code) { toast('Prices are in points. Your promo code isn’t used with points.', 'info'); done(); return; }
  done();
};
document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('s5-totacc')) s5().totOpen = e.target.open; }, true);
