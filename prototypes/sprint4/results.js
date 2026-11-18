// =====================================================================
// Sprint 5 · Fare search results (replaces the Sprint 4 "handoff" placeholder; the route name stays 'handoff')
// Approved stories (assigned VK): NMA-748 one-way results, NMA-1094 trip card info, NMA-1096 classes of service
//   (direct trips, regular travelers), NMA-759 unsuccessful searches, NMA-1098 pricing explanation,
//   NMA-1097 fare types, NMA-1095 border crossing.
// Proposed designs for stories still in grooming are marked on screen with a "Proposed" badge (s5tag) and in the
//   reviewer notes: NMA-1109 round-trip, NMA-755 badges, NMA-758 sort, NMA-761 points, NMA-764 discounts,
//   NMA-1092/1093 trip details, NMA-1138 multi-segment fares.
// Flagged only (open questions, nothing designed): NMA-760 alerts, NMA-762 urgency, NMA-1140 Pass Rider fares,
//   NMA-1141 TripLink fares, filters in NMA-758.
// Built from existing components only: Card, Badge, Alert, Button, Link, Accordion, Radio, Info sheet, Dialog.
// All trips, fares and content are mock data standing in for the back end (S3P) and AEM.
// =====================================================================
const S5_OUTCOMES = [['results', 'Trains found'], ['border', 'Trip crosses the U.S.–Canada border'], ['soldout', 'Every train sold out'], ['single', 'Only one train'],
  ['nodate', 'No trains on the departure date'], ['nodate-ret', 'No trains on the return date (round-trip)'], ['noroute', 'Route not served'], ['assist', 'Assistance not available at the station']];
const s5 = () => (V().s5 = V().s5 || { outcome: 'results', sort: 'direct' });
// Results concepts (Sprint 5 exploration, from design feedback): compare the experience of each class of service
// (seat type, amenities) on results, instead of leading with fare types.
const S5_CONCEPTS = [['current', 'Current'], ['c1', 'Concept Update 1: experience on results'], ['c2', 'Concept Update 2: experience on each class']];
const s5c = () => (typeof TB !== 'undefined' && TB.s5c) || 'current';
// Concept Update 1 "Choose your class" content: a short promise, the seat, and what's included (sample content)
const S5_EXP_CARD = {
  Coach: { tag: 'Comfortable essentials for your trip', seat: ['Standard seat', '2 × 2 seating · reclines · no middle seat'], wifi: 'Included', power: 'At every seat', food: 'Café car, for purchase', lounge: 'Not included', short: 'Reclining seat · Wi-Fi' },
  Business: { tag: 'More space and a quieter ride', seat: ['Spacious seat', 'Wider leather seat · extra legroom'], wifi: 'Included', power: 'At every seat', food: 'Free non-alcoholic drinks', lounge: 'Not included', short: 'Spacious seat · free drinks' },
  First: { tag: 'Our most premium seat, with meals served', seat: ['Premium seat', '1 × 2 leather seating · most legroom'], wifi: 'Included', power: 'At every seat', food: 'At-seat meal service', lounge: 'Club lounge before you board', short: 'Premium seat · meals · lounge' },
  Rooms: { tag: 'Your own private space, day and night', seat: ['Private room', 'Seats convert to beds · attendant'], wifi: 'Included', power: 'In your room', food: 'Meals in the dining car included', lounge: 'Lounge access before you board', short: 'Private room · meals · lounge' }
};
const S5_EXP_CARD_ROWS = [['wifi', 'Wi-Fi'], ['power', 'Power outlet'], ['food', 'Food and drink'], ['lounge', 'Lounge access']];
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
const s5hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
const s5time = m => { const d = ((m % 1440) + 1440) % 1440, h = Math.floor(d / 60), mm = d % 60; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const s5dur = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
const S5_NOW = 9 * 60 + 41; // the device clock (9:41 AM): trains that already left today aren't returned
const S5_CLASS_ORDER = ['Coach', 'Business', 'First', 'Rooms']; // NMA-1096 BR#1.5
const S5_SVC = { train: ['train', 'Train'], trains: ['trip-multiple-train', 'Multiple trains'], mixed: ['trip-multiple-mixed', 'Train and bus'], bus: ['bus', 'Bus'] };

// Mock back end: the same search always returns the same trips. Times, durations and fares come "from the back end".
function s5Trips(b, leg) {
  const from = leg === 'ret' ? b.to : b.from, to = leg === 'ret' ? b.from : b.to, date = leg === 'ret' ? b.ret : b.dep;
  const h = s5hash([from, to].sort().join('')), base = 150 + h % 180, fare = 29 + h % 60, out = s5().outcome, via = ST[['PHL', 'NYP', 'WAS', 'CHI', 'ALB'].find(c => c !== from && c !== to && ST[c])];
  const T = (o) => Object.assign({ svc: 'train', segs: 1, status: 'ok', delay: 0 }, o);
  let list = [
    T({ id: 't1', num: '171', name: 'Northeast Regional', dep: 6 * 60 + 10, dur: base, cls: { Coach: fare, Business: fare + 38 } }),
    T({ id: 't2', num: '2151', name: 'Acela', dep: 7 * 60, dur: Math.round(base * 0.82), cls: { Business: fare + 86, First: fare + 210 } }),
    T({ id: 't3', num: '93', name: 'Northeast Regional', dep: 9 * 60 + 25, dur: base + 12, status: 'delayed', delay: 25, cls: { Coach: fare + 8, Business: fare + 46 } }),
    T({ id: 't4', num: '125', name: 'Northeast Regional', dep: 10 * 60 + 35, dur: base + 6, cls: { Coach: fare + 8, Business: null } }),
    T({ id: 't5', num: '79', name: 'Carolinian', dep: 11 * 60 + 15, dur: base + 20, status: 'canceled', cls: { Coach: fare + 4, Business: fare + 40 } }),
    T({ id: 't6', num: '2165', name: 'Acela', dep: 13 * 60, dur: Math.round(base * 0.82), cls: { Business: null, First: null } }),
    T({ id: 't7', num: '19', name: 'Crescent', dep: 14 * 60 + 15, dur: base + 28, cls: { Coach: fare - 6, Rooms: fare + 312 } }),
    T({ id: 't8', num: '67', name: 'Northeast Regional', dep: 21 * 60 + 40, dur: base + 190, cls: { Coach: fare - 10, Business: fare + 30 } }),
    T({ id: 't9', svc: 'trains', segs: 2, num: '141 + 195', name: 'Northeast Regional, 2 trains', dep: 9 * 60 + 50, dur: base + 95, layover: 45, via, cls: { Coach: fare + 14, Business: fare + 61 } }),
    T({ id: 't10', svc: 'mixed', segs: 2, num: '8012 + 181', name: 'Thruway Bus and Northeast Regional', dep: 12 * 60 + 20, dur: base + 140, layover: 70, via, self: true, cls: { Coach: fare + 2 } }),
    T({ id: 't11', svc: 'trains', segs: 3, num: '449 + 49 + 29', name: 'Lake Shore Limited and Capitol Limited, 3 trains', dep: 15 * 60 + 40, dur: base + 1210, layover: 185, via, cls: { Coach: fare + 72, Rooms: fare + 540 } })
  ];
  const xb = s5Border(from, to); if (xb) list = s5BorderTrips(from, to, h, fare);
  if (date === TODAY_S) list = list.filter(t => t.status === 'canceled' || t.dep + t.delay > S5_NOW); // NMA-748 AC#4: delayed trains stay until they actually leave; canceled stay by schedule
  if (out === 'soldout') list.forEach(t => Object.keys(t.cls).forEach(k => t.cls[k] = null));
  if (out === 'single') list = list.filter(t => t.id === 't4').map(t => Object.assign(t, { cls: { Coach: fare + 8, Business: fare + 52 } }));
  list.forEach(t => { t.arr = t.dep + t.dur; t.days = Math.floor(t.arr / 1440); t.low = Math.min(...Object.values(t.cls).filter(x => x != null).concat(Infinity)); t.border = out === 'border' || xb; });
  return { from, to, date, list, border: out === 'border' || xb };
}
// Cross-border trips (Sprint 5): real Amtrak corridors into Canada. Montreal: Adirondack from New York via Albany.
// Toronto: Maple Leaf from New York via Albany and Niagara Falls. Vancouver: Cascades from Seattle and Portland, plus Thruway buses.
const s5Border = (a, b) => ST[a] && ST[b] && ST[a].country !== ST[b].country;
function s5BorderTrips(from, to, h, fare) {
  const T = o => Object.assign({ svc: 'train', segs: 1, status: 'ok', delay: 0 }, o), ca = ST[from].country === 'CA' ? from : to, us = ca === from ? to : from, out = ca === to;
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
// Points are a proposed view (NMA-761 is waiting for requirement approval): 1 point is shown as about 2.9 cents
const s5Price = (b, usd) => b.pay === 'points' && ['standard', 'personal'].includes(intentOf(b)) ? `${(Math.round(usd / 0.029 / 10) * 10).toLocaleString('en-US')} pts` : `$${usd}`;

// ---------- Supporting content (configurable: comes from AEM, never hard-coded in the app) ----------
INFO['s5-pricing'] = { title: 'How prices are shown', body: () => `<p><b>Seats</b> (Coach, Business, First): the price is for one adult, one way, before discounts. Discounts you chose are applied in your cart.</p><p><b>Rooms</b>: the price is the total for all travelers in the room, with your discounts already applied.</p><p>Each price is the lowest fare still available in that class.</p>${snote('NMA-1098: pricing explanation. Content is configurable (AEM) and available offline.')}` };
INFO['s5-fares'] = { title: 'Compare fare types', body: () => `<div class="s5-fares">${[['Value', 'Lowest price. Changes allowed for a fee. 75% refund up to 8 days before departure, then not refundable.'], ['Flex', 'Fully refundable before departure. No change fees.'], ['Business', 'Fully refundable before departure. Extra legroom and a reserved seat.'], ['First (Acela)', 'Fully refundable. At-seat meal service and lounge access.'], ['Rooms', 'Refundable up to 121 days before departure; fees apply after that. Meals and lounge access included.']].map(([n, d]) => `<div class="ads-group__row s5-fares__row"><span class="ads-group__text"><span class="ads-group__label">${n}</span><span class="ads-group__value">${d}</span></span></div>`).join('')}</div><p class="info-draft">Sample content. Fare names, benefits and restrictions come from the content source.</p>${snote('NMA-1097: fare type comparison. Content is configurable and available offline. Wording here is placeholder.')}` };
INFO['s5-border'] = { title: 'Crossing the U.S.–Canada border', body: () => `<p><b>Before you book</b></p><p>Every traveler needs a valid passport or other approved travel document. Enter each traveler’s name exactly as it appears on that document.</p><p><b>At the border</b></p><p>Customs and immigration officers board the train or meet it at the station. Inspections can add time to your trip.</p><p><b>Good to know</b></p><p>Arrive at least 60 minutes before departure. Children traveling without both parents may need a consent letter.</p><p class="info-draft">Sample content. Requirements come from the content source.</p>${snote('NMA-1095: shown only when the trip crosses the U.S.–Canada border. Content is configurable and available offline.')}` };
INFO['s5-sort'] = { title: 'Sort', body: () => `<fieldset class="ads-fieldset s5-sortset"><legend class="ads-sr-only">Sort trains by</legend>${Object.entries(S5_SORTS).map(([k, [l]]) => `<label class="ads-choice ads-radio" for="s5s-${k}"><input type="radio" name="s5sort" id="s5s-${k}" data-a="s5-sort" data-v="${k}" ${s5().sort === k ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${l}</span></span></label>`).join('')}</fieldset><p class="info-draft">${s5tag('NMA-758')} Sort only. Filters (time of day, route, class, add-ons) are still being groomed and aren’t designed yet.</p>` };
A['s5-sort'] = t => { s5().sort = t.dataset.v; nav().info = null; pendingFocus = '[data-topic="s5-sort"]'; render(); };

// Trip details (proposed: NMA-1092 and NMA-1093 are still in grooming): Services and Route tabs, as in the current app
const S5_AMENITIES = [['luggage', 'Checked baggage', 'Check up to 2 bags at staffed stations on this train. Carry-on bags are always free.'], ['cafe', 'Café car', 'Snacks, light meals and drinks for purchase.'], ['lounge', 'Lounge access', 'Station lounges for private room travelers before you board.', true], ['wifi', 'Free Wi-Fi', 'Basic Wi-Fi for browsing and email.'], ['pet', 'Pet', 'Small dogs and cats up to 20 lb in a carrier. A fee applies.']];
A['s5-dtab'] = t => { s5().dtab = t.dataset.v; pendingFocus = `#s5d-${t.dataset.v}`; render(); };
function s5Details(id) {
  const b = D().booking, sh = sheet(), top = sh && sh.stack[sh.stack.length - 1], leg = top && top.p && top.p.leg === 'ret' ? 'ret' : 'dep';
  const r = s5Trips(b, leg), t = r.list.find(x => x.id === id); if (!t) return { title: 'Trip details', body: () => '' };
  const stops = t.segs === 1 ? [[t.dep, ST[r.from]], [t.arr, ST[r.to]]] : [[t.dep, ST[r.from]], [t.dep + Math.round((t.dur - t.layover) / 2), t.via, `${s5dur(t.layover)} layover${t.self ? ' · self-transfer to another station' : ''}`], [t.arr, ST[r.to]]];
  const tab = s5().dtab || 'services', tb = (k, l) => `<button class="ads-tab" type="button" role="tab" id="s5d-${k}" aria-selected="${tab === k}" aria-controls="s5d-panel" tabindex="${tab === k ? 0 : -1}" data-a="s5-dtab" data-v="${k}">${l}</button>`;
  const am = S5_AMENITIES.filter(([, , , rooms]) => !rooms || 'Rooms' in t.cls);
  const services = `<div class="ads-summary s5-dsum"><p class="ads-summary__title s5-dsum__name">${ic(S5_SVC[t.svc][0])}${esc(t.name)} ${t.num}</p><p class="s5-dsum__icons" aria-hidden="true">${am.map(([i]) => ic(i)).join('')}</p><p class="s5-dsum__cls">${S5_CLASS_ORDER.filter(k => k in t.cls).map(k => k === 'Rooms' ? 'Private rooms' : k).join(', ')}</p></div>
    <h3 class="ads-group__title s5-dsec">Amenities and add-ons</h3><div class="s5-amen">${am.map(([i, n, d]) => `<details class="ads-accordion ads-accordion--sm"><summary><span class="s5-amen__label">${ic(i)}${n}</span>${ic('chevron-down')}</summary><div class="ads-accordion__panel"><p>${d}</p></div></details>`).join('')}</div>`;
  const route = `<dl class="cpn-dl">${stops.map(([m, s, note]) => `<dt>${s5time(m)}</dt><dd>${esc(s.city)}, ${s.st} · ${esc(s.name)}${note ? `<br><span class="ads-text-secondary">${note}</span>` : ''}</dd>`).join('')}<dt>Duration</dt><dd>${s5dur(t.dur)}</dd></dl>`;
  return { title: 'Trip details', body: () => `<p>${s5tag('NMA-1092/1093')}</p><div class="ads-tabs ads-tabs--fill" role="tablist" aria-label="Trip details">${tb('services', 'Services')}${tb('route', 'Route')}</div><div id="s5d-panel" role="tabpanel" aria-labelledby="s5d-${tab}" class="s5-dpanel">${tab === 'route' ? route : services}</div><p class="info-draft">Sample services, amenities and stops. Content comes from the back end.</p>` };
}

// ---------- Trip card (NMA-1094 trip info, NMA-1096 classes of service) ----------
function s5Card(t, r, b, ctx) {
  const c2 = s5c() === 'c2';
  const svc = S5_SVC[t.svc], canceled = t.status === 'canceled', delayed = t.status === 'delayed', it = intentOf(b);
  const badge = canceled ? `<span class="ads-badge ads-badge--error">Canceled</span>` : delayed ? `<span class="ads-badge ads-badge--warning">Delayed ${t.delay} min</span>` : '';
  const tags = !canceled && ctx.tags ? [t.id === ctx.lowId ? 'Lowest fare' : '', t.id === ctx.fastId ? 'Fastest' : ''].filter(Boolean).map(x => `<span class="ads-badge ads-badge--success">${x}</span>`).join('') : '';
  const tm = (m) => delayed ? `<span class="s5-t"><s class="s5-was"><span class="ads-sr-only">Scheduled </span>${s5time(m)}</s><b class="s5-now"><span class="ads-sr-only">Now </span>${s5time(m + t.delay)}</b></span>` : `<span class="s5-t"><b>${s5time(m)}</b></span>`;
  const day = t.days ? ` <span class="s5-day">+${t.days} day${t.days > 1 ? 's' : ''}</span>` : '';
  const meta = [s5dur(t.dur), t.segs === 1 ? 'Direct' : `${t.segs} segments`, t.segs > 1 ? `${s5dur(t.layover)} layover in ${esc(t.via.city)}` : ''].filter(Boolean).join(' · ');
  const flags = [t.days ? `<span class="s5-flag">${ic('overnight', 'ads-icon--sm')}Overnight</span>` : '', t.self ? `<span class="s5-flag">${ic('walk', 'ads-icon--sm')}Self-transfer: change stations in ${esc(t.via.city)}</span>` : '', t.border ? `<span class="s5-flag">${ic('passport-check', 'ads-icon--sm')}Crosses the border</span>` : ''].join('');
  const label = `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`; // the Sprint 4 cart label, so the abandon-booking rule still works
  const disc = !canceled && ctx.disc && t.segs === 1 && t.low !== Infinity ? `<p class="ads-helper ads-helper--success s5-disc">${ic('discount', 'ads-icon--sm')}<span>${esc(ctx.disc)} applies ${s5tag('NMA-764')}</span></p>` : '';
  const cls = S5_CLASS_ORDER.filter(k => k in t.cls).map(k => {
    const p = t.cls[k], name = k === 'Rooms' ? 'Private rooms' : k, off = p == null || canceled;
    const price = canceled ? 'Not available' : p == null ? 'Sold out' : it === 'pr' ? 'Pass Rider fare' : `${t.segs > 1 || k === 'Rooms' ? 'from ' : ''}${s5Price(b, p)}`;
    return `<button class="ads-btn ads-btn--secondary s5-class" type="button" data-a="s5-fare" data-trip="${t.id}" data-cls="${k}" ${off ? 'disabled' : ''} aria-label="${name}, ${price}${c2 ? `, ${S5_EXP[k].short}` : ''}${off ? '' : `. See ${name} fares on ${esc(t.name)} ${t.num}`}"><span class="s5-class__name">${name}</span><span class="s5-class__price">${price}</span>${c2 ? `<span class="s5-class__exp">${S5_EXP[k].short}</span><span class="s5-class__icons" aria-hidden="true">${S5_EXP[k].icons.map(x => ic(x, 'ads-icon--sm')).join('')}</span>` : ''}</button>`;
  }).join('');
  return `<li class="ads-card s5-trip${canceled ? ' is-canceled' : ''}${s5c() === 'c1' ? ' s5-trip--x' : ''}" data-trip="${t.id}">
    <div class="s5-trip__main">
      <div class="s5-trip__top"><span class="s5-trip__svc">${ic(svc[0])}<span><b>${esc(t.name)}</b> ${t.num}<span class="ads-sr-only">, ${svc[1]}</span></span></span><button class="ads-link ads-link--sm linkbtn s5-details" type="button" data-a="info" data-topic="s5-trip:${t.id}" data-k="s5t-${t.id}" aria-label="Details for ${esc(t.name)} ${t.num}">Details${ic('info-circle', 'ads-icon--sm')}</button></div>
      ${tags || badge ? `<span class="s5-trip__badges">${tags}${badge}</span>` : ''}
      <span class="s5-trip__times">${tm(t.dep)}<span class="s5-arrow" aria-hidden="true">→</span><span class="ads-sr-only">to</span>${tm(t.arr)}${day}</span>
      <span class="s5-trip__meta">${meta}</span>${flags ? `<span class="s5-trip__flags">${flags}</span>` : ''}
    </div>${disc}
    ${s5c() === 'c1' ? s5XPanel(t, b, canceled) : `<div class="s5-classes" role="group" aria-label="Classes of service on ${esc(t.name)} ${t.num}">${cls}</div>`}</li>`;
}
// Concept Update 1: the experience of each class on the trip card. Price is secondary; the class's benefits lead.
A['s5-xcls'] = t => { const x = s5().xsel = s5().xsel || {}; x[t.dataset.trip] = t.dataset.v; pendingFocus = `#s5x-${t.dataset.trip}-${t.dataset.v}`; render(); };
function s5XPanel(t, b, canceled) {
  const pr = intentOf(b) === 'pr', classes = S5_CLASS_ORDER.filter(k => k in t.cls), avail = k => !canceled && t.cls[k] != null;
  const sel = (s5().xsel || {})[t.id], cur = avail(sel) ? sel : classes.find(avail);
  const price = k => canceled ? 'Not available' : t.cls[k] == null ? 'Sold out' : pr ? 'Pass Rider fare' : `${t.segs > 1 || k === 'Rooms' ? 'from ' : ''}${s5Price(b, t.cls[k])}`;
  const seg = `<div class="ads-segmented s5-x__seg" role="tablist" aria-label="Classes of service on ${esc(t.name)} ${t.num}">${classes.map(k => `<button type="button" role="tab" id="s5x-${t.id}-${k}" aria-selected="${k === cur}" ${cur ? `aria-controls="s5x-${t.id}"` : ''} tabindex="${k === cur ? 0 : -1}" data-a="s5-xcls" data-trip="${t.id}" data-v="${k}" ${avail(k) ? '' : 'disabled aria-disabled="true"'}><span class="s5-x__segname">${s5ClsName(k)}</span><span class="s5-x__segprice">${price(k)}</span></button>`).join('')}</div>`;
  if (!cur) return `<div class="s5-x">${seg}</div>`;
  const e = S5_EXP_CARD[cur], from = pr ? 'Pass Rider fare' : `${t.segs > 1 || cur === 'Rooms' ? 'From ' : ''}${s5Price(b, t.cls[cur])} ${cur === 'Rooms' ? 'a room' : 'per traveler'}`;
  return `<div class="s5-x">${seg}<div class="s5-x__card s5-x__panel" id="s5x-${t.id}" role="tabpanel" aria-labelledby="s5x-${t.id}-${cur}">
      <p class="s5-x__tag"><b class="s5-x__name">${s5ClsName(cur)}</b> · ${e.tag}</p>
      <div class="s5-x__seat">${ic(cur === 'Rooms' ? 'bedroom' : 'seat')}<span><b class="s5-x__seattitle">${e.seat[0]}</b><span class="s5-x__seatsub">${e.seat[1]}</span></span></div>
      ${group('', [['wifi', 'Wi-Fi'], ['food', 'Food and drink'], ['lounge', 'Lounge access']].map(([f, l]) => grow({ label: l, value: e[f], empty: /^Not included/.test(e[f]) })))}
      <div class="s5-x__act"><span class="s5-x__price">${from}</span><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="s5-fare" data-trip="${t.id}" data-cls="${cur}" aria-label="Choose ${s5ClsName(cur)} on ${esc(t.name)} ${t.num}, ${from}">Choose ${s5ClsName(cur)}</button></div></div></div>`;
}

// ---------- Results screen ----------
SCR.handoff = (r, ri) => {
  const b = D().booking, leg = r.p.leg === 'ret' ? 'ret' : 'dep', res = s5Trips(b, leg), list = s5Sorted(res.list), it = intentOf(b), rt = b.trip === 'rt';
  ref('748', '1094', '1096', '759', '1098', '1097', '1095');
  const open = list.filter(t => t.status !== 'canceled' && t.low !== Infinity);
  const tagsOn = list.length > 1 && open.length > 1; // NMA-755 AC5: one result shows no badges
  const ctx = { tags: tagsOn, lowId: tagsOn ? [...open].sort((a, c) => a.low - c.low)[0].id : null, fastId: tagsOn ? [...open].sort((a, c) => a.dur - c.dur)[0].id : null,
    disc: ['standard', 'personal'].includes(it) ? (b.code && b.codeState !== 'ineligible' ? `Code ${b.code.code}` : paxList(b).some(t => tdiscOf(b, t) !== 'none') ? 'Your traveler discount' : '') : '' };
  const cart = D().cart || [], inCart = cart.some(x => x.label === `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`);
  snote('Sprint 5 search results. Approved (VK): NMA-748, 1094, 1096, 759, 1098, 1097, 1095. Items marked “Proposed” on screen are designs for stories still in grooming: round-trip return step (NMA-1109), Lowest fare and Fastest badges (NMA-755), Sort (NMA-758), points prices (NMA-761), discount indicator (NMA-764), trip details (NMA-1092/1093) and “from” prices on multi-segment trips (NMA-1138).');
  snote('Flagged, not designed: service and station alerts (NMA-760: origin only, or origin and destination?), urgency signal (NMA-762: no requirements yet), Pass Rider fares (NMA-1140: prices show as “Pass Rider fare” until the rules are approved), TripLink fares (NMA-1141: story is empty; standard prices shown), filters (NMA-758).');
  snote('NMA-748 AC#4: canceled trains come back today only for the agent channel, so showing them needs a back-end change request. The prototype shows one. Choosing a fare is the exit of this sprint: “Add to cart” stays simulated.');
  if (s5c() === 'c1') snote('Concept Update 1 (design exploration, from feedback): each trip card on results leads with the experience. A class switcher on the card shows that class’s promise, seat and inclusions, with the price secondary, and “Choose [class]” goes on to Choose a fare. Fare types stay on results (NMA-1097).');
  if (s5c() === 'c2') snote('Concept Update 2 (design exploration, from feedback): each class button on a trip card shows what you get (seat type and amenity icons) under its price, so the experience is compared where you choose. Fare types stay available as a smaller link because NMA-1097 (approved) needs them on results.');
  if (it === 'pr') snote('NMA-1140 (grooming): Pass Rider prices aren’t approved, so each class shows “Pass Rider fare”. Business travel Acela and Auto Train restrictions aren’t applied here.');
  if (it === 'corporate') snote('NMA-1141 (empty story): TripLink fares aren’t defined. Standard prices are shown.');
  const head = `<div class="s5-head"><p class="s5-head__route"><b>${ST[res.from].code}</b> ${esc(ST[res.from].city)} <span aria-hidden="true">→</span><span class="ads-sr-only">to</span> <b>${ST[res.to].code}</b> ${esc(ST[res.to].city)}</p>
    <p class="s5-head__meta">${fmtShort(res.date)} · ${esc(s5Travelers(b))} · <span id="s5-count">${list.length} train${list.length === 1 ? '' : 's'}</span></p>
    ${rt ? `<p class="s5-head__step">Step ${leg === 'ret' ? 2 : 1} of 2: choose your ${leg === 'ret' ? 'return' : 'departure'} ${s5tag('NMA-1109')}</p>` : ''}</div>`;
  const tools = `<div class="s5-tools"><p class="s5-tools__note">${b.pay === 'points' && ['standard', 'personal'].includes(it) ? `Prices in points ${s5tag('NMA-761')}` : it === 'pr' ? 'Pass Rider fares' : 'Seat prices are per traveler, one way'} <button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="info" data-topic="s5-pricing" aria-label="How prices are shown">${ic('info-circle', 'ads-icon--sm')}</button></p>
    <div class="s5-tools__links">${infoLink('s5-fares', 'Understand fare types')}${list.length > 1 ? `<button class="ads-link ads-link--sm linkbtn" type="button" data-a="info" data-topic="s5-sort">Sort: ${S5_SORTS[s5().sort][0]}</button>` : ''}</div>
    <p class="s5-proposed">${[tagsOn ? ['NMA-755', 'badges'] : null, list.length > 1 ? ['NMA-758', 'sort'] : null, ['NMA-1092/1093', 'trip details'], list.some(t => t.segs > 1) ? ['NMA-1138', '“from” prices'] : null, s5c() === 'c1' ? ['Concept Update 1', 'experience first'] : s5c() === 'c2' ? ['Concept Update 2', 'class experience'] : null].filter(Boolean).map(([id, l]) => `<span class="ads-lock s5-tag">Proposed · ${id} ${l}</span>`).join('')}</p></div>`;
  const border = res.border ? alertBox('info', 'This trip crosses the U.S.–Canada border', 'Every traveler needs a valid travel document.', infoLink('s5-border', 'What to expect')) : '';
  const noAssist = b.s5NoAssist ? alertBox('warning', 'Searching without your assistance request', `The assistance you asked for isn’t available at ${esc(ST[b.from].name)}. You chose to continue without it.`) : '';
  const allSold = list.length && !list.some(t => t.low !== Infinity && t.status !== 'canceled') ? alertBox('info', 'Every train is sold out', 'You can still see the full schedule. Go back to try another date.') : '';
  const added = inCart ? `<p class="ads-helper ads-helper--success cartdemo" role="status">${ic('check-circle', 'ads-icon--sm')}<span>In your cart</span></p>` : '';
  const details = `<details class="ads-accordion ads-accordion--sm s5-search" open><summary>Search details${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="handoff__list"><dt>Route</dt><dd>${stLabel(b.from)} → ${stLabel(b.to)}</dd><dt>Trip</dt><dd>${rt ? 'Round-trip' : 'One-way'}</dd><dt>Depart</dt><dd>${fmtWeekday(b.dep)}, ${fmtDate(b.dep)}</dd>${rt ? `<dt>Return</dt><dd>${fmtWeekday(b.ret)}, ${fmtDate(b.ret)}</dd>` : ''}${handoffExtra(b)}<dt>Assistance</dt><dd>${b.s5NoAssist ? 'Not included in this search' : b.assistOn && travelerList(b).some(t => assistCat(b, t.key)) ? travelerList(b).filter(t => assistCat(b, t.key)).map(t => `${esc(t.label)}: ${esc(assistSummaryItems(assistRec(b, t.key).m).join(' · '))}`).join('<br>') : 'None requested'}</dd></dl></div></details>`;
  const foot = s5Drawer(b, leg, null);
  return { title: leg === 'ret' ? 'Return' : 'Departure', kind: 'push', backIcon: true, cls: 'pane--s5', offlineText: 'You can view these trains. Choosing a fare needs a connection.', foot, footCls: foot ? 'ads-actionfooter' : '',
    body: `<h3 class="ads-sr-only">Search results</h3>${head}${added}${noAssist}${border}${allSold}${tools}<ul class="s5-list" aria-labelledby="s5-count">${list.map(t => s5Card(t, res, b, ctx)).join('')}</ul>${details}` };
};
// Trip details open in the info sheet: route the "s5-trip:<id>" topic
{ const base = infoTopic; infoTopic = function (topic) { return topic.startsWith('s5-trip:') ? s5Details(topic.split(':')[1]) : base(topic); }; }

// Choosing a class: offline can't continue (NMA-748); round-trip goes on to the return (proposed); otherwise the simulated cart
{ const add = A['cart-add'];
  A['cart-add'] = (t, ri) => {
    if (!t.dataset.trip) return add(t, ri);
    if (V().net === 'offline') { toast('You’re offline. Connect to choose a fare.', 'info'); return; }
    const b = D().booking, sh = sheet(), top = sh.stack[sh.stack.length - 1];
    const leg = top.p.leg === 'ret' ? 'ret' : 'dep', sel = D().s5sel = D().s5sel || {};
    sel[leg] = { trip: t.dataset.trip, cls: t.dataset.cls, fare: t.dataset.fare };
    if (b.trip === 'rt' && leg !== 'ret') { push('handoff', { leg: 'ret', out: t.dataset.trip }, sh.stack.length - 1); return; }
    add(t, ri); push('s5sum', {}, sh.stack.length - 1);
  }; }

// ---------- Find trains: unsuccessful outcomes (NMA-759) ----------
function s5Go(ri) {
  const b = D().booking, o = s5().outcome, back = '[data-a="find-trains"]', rt = b.trip === 'rt';
  b.s5NoAssist = false; s5().sort = 'direct';
  const go = () => { D().s5sel = {}; push('handoff', {}, +ri); };
  const caOnly = ST[b.from] && ST[b.to] && ST[b.from].country === 'CA' && ST[b.to].country === 'CA';
  if (o === 'noroute' || caOnly) { ref('759'); dialog({ title: 'No trains between these stations', body: `We don’t have service from ${esc(ST[b.from].city)} to ${esc(ST[b.to].city)}.${caOnly ? ' Amtrak trains to Canada start or end in the U.S.' : ''} Try a different station nearby.`, returnFocus: back, actions: [['Change stations', 'primary', null]] }); return; }
  if (o === 'nodate' || (o === 'nodate-ret' && rt)) {
    ref('759'); const ret = o === 'nodate-ret', cur = ret ? b.ret : b.dep, next = addDays(cur, 2);
    dialog({ title: `No trains on ${fmtShort(cur)}`, body: `This route doesn’t run on your ${ret ? 'return' : 'departure'} date. The next trains are on ${fmtShort(next)}.${!ret && rt && next > b.ret ? ' Your return date will move to match.' : ''}`, returnFocus: back,
      actions: [[`See trains on ${fmtShort(next)}`, 'primary', () => { if (ret) b.ret = next; else { b.dep = next; if (rt && b.ret < next) b.ret = next; } go(); }], ['Change my search', 'secondary', null]] });
    return;
  }
  if (o === 'assist' && b.assistOn && travelerList(b).some(t => assistCat(b, t.key))) {
    ref('759');
    dialog({ title: 'Assistance isn’t available at this station', body: `${esc(ST[b.from].name)} can’t provide the assistance you asked for. You can continue without the assistance request, or change your search.`, returnFocus: back,
      actions: [['Continue without assistance', 'primary', () => { b.s5NoAssist = true; b.s5AssistAck = { at: 'find-trains', station: b.from }; go(); }], ['Change my search', 'secondary', null]] });
    return;
  }
  go();
}

// =====================================================================
// Choose a fare (proposed pattern, follows the current app: class, fare options with their rules, price, Continue)
// Fare types and their rules are sample content; they come from the back end (see NMA-1097).
// =====================================================================
const S5_CLASS_INFO = { Coach: ['No middle seat and plenty of legroom', 'At-seat power', 'Earn 2 Guest Rewards points per $1'], Business: ['Extra legroom and a reserved seat', 'Complimentary non-alcoholic drinks', 'Earn 3 Guest Rewards points per $1'], First: ['Wide leather seats in a 1-2 layout', 'At-seat meal service', 'Lounge access before you board'], Rooms: ['A private room for up to 2 travelers', 'Meals in the dining car included', 'Lounge access and a dedicated attendant'] };
const S5_RULES = { Value: ['30% cancellation fee if canceled before departure', 'No changes permitted'], Flex: ['Full refund if canceled before departure', 'Changes permitted with no change fee'] };
function s5Fares(cls, base) { if (cls === 'First') return [['Flex', base]]; return [['Value', base], ['Flex', base + (cls === 'Rooms' ? 60 : cls === 'Business' ? 18 : 10)]]; }
const s5ClsName = k => k === 'Rooms' ? 'Private rooms' : k;
A['s5-fare'] = (t, ri) => {
  if (V().net === 'offline') { toast('You’re offline. Connect to choose a fare.', 'info'); return; }
  const sh = sheet(), top = sh.stack[sh.stack.length - 1];
  push('s5fare', { leg: top.p.leg === 'ret' ? 'ret' : 'dep', trip: t.dataset.trip, cls: t.dataset.cls }, sh.stack.length - 1);
};
A['s5-cls'] = (t, ri) => { const r = sheet().stack[+ri]; r.p.cls = t.dataset.v; r.u.fare = null; pendingFocus = `#s5c-${t.dataset.v}`; render(); };
A['s5-pick'] = (t, ri) => { const r = sheet().stack[+ri]; r.u.fare = t.dataset.v; render(); };
SCR.s5fare = (r, ri) => {
  const b = D().booking, leg = r.p.leg, res = s5Trips(b, leg), tr = res.list.find(x => x.id === r.p.trip), it = intentOf(b), pr = it === 'pr';
  const classes = S5_CLASS_ORDER.filter(k => k in tr.cls), cls = r.p.cls, base = tr.cls[cls];
  const fares = pr ? [['Pass Rider', null]] : s5Fares(cls, base), pick = r.u.fare && fares.some(f => f[0] === r.u.fare) ? r.u.fare : fares[0][0], price = (fares.find(f => f[0] === pick) || fares[0])[1];
  const seats = travelerCount(b), room = cls === 'Rooms', total = price == null ? null : room ? price : price * seats;
  const label = `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`;
  snote('Choose a fare follows the current app’s pattern (class, fare options with their rules, price and Continue). Proposed design: fare selection isn’t a Sprint 5 story yet. Fare names, rules and prices are sample content from the back end.');
  if (pr) snote('NMA-1140 (grooming): Pass Rider fares aren’t approved, so only “Pass Rider fare” is shown, with no price.');
  const tabs = `<div class="ads-tabs ads-tabs--fill s5-ctabs" role="tablist" aria-label="Class of service">${classes.map(k => { const p = tr.cls[k], off = p == null; return `<button class="ads-tab s5-ctab" type="button" role="tab" id="s5c-${k}" aria-selected="${k === cls}" aria-controls="s5c-panel" tabindex="${k === cls ? 0 : -1}" data-a="s5-cls" data-v="${k}" ${off ? 'disabled aria-disabled="true"' : ''}><span class="s5-ctab__name">${s5ClsName(k)}</span><span class="s5-ctab__price">${off ? 'Sold out' : pr ? 'Pass Rider' : `${s5Price(b, p)}${k === 'Rooms' ? ' a room' : ''}`}</span></button>`; }).join('')}</div>`;
  const opts = fares.map(([n, p]) => `<label class="ads-choice ads-radio s5-fopt${n === pick ? ' is-selected' : ''}" for="s5f-${n.replace(/\s/g, '')}"><input type="radio" name="s5fare" id="s5f-${n.replace(/\s/g, '')}" data-a="s5-pick" data-v="${n}" ${n === pick ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span class="s5-fopt__head"><span>${n}</span>${p == null ? '' : `<span class="s5-fopt__price">${s5Price(b, p)} <span class="s5-fopt__unit">${room ? 'a room' : 'per traveler'}</span></span>`}</span>${(S5_RULES[n] || ['Pass Rider travel rules apply']).map(x => `<span class="ads-choice__supporting">${x}</span>`).join('')}</span></label>`).join('');
  const sum = `<div class="ads-summary s5-fsum"><div class="ads-summary__head"><div><p class="ads-summary__title">${ic(S5_SVC[tr.svc][0], 'ads-icon--sm')} ${esc(tr.name)} ${tr.num}</p><p class="s5-fsum__route">${esc(ST[res.from].city)} → ${esc(ST[res.to].city)}</p></div>${infoLink(`s5-trip:${tr.id}`, 'Details')}</div><p class="s5-fsum__times"><b>${s5time(tr.dep + tr.delay)}</b> <span aria-hidden="true">→</span><span class="ads-sr-only">to</span> <b>${s5time(tr.arr + tr.delay)}</b> · ${s5dur(tr.dur)}${tr.days ? ` · +${tr.days} day` : ''}</p></div>`;
  const amount = total == null ? 'Pass Rider fare' : b.pay === 'points' && ['standard', 'personal'].includes(it) ? s5Price(b, total) : `$${total.toFixed(2)}`;
  const tot = b.trip === 'rt' && leg === 'ret' ? s5Drawer(b, 'ret', { cost: total }) : '';
  const foot = `${tot}<div class="calfoot s5-ffoot"><span><span class="s5-ffoot__label">${b.trip === 'rt' ? (leg === 'ret' ? 'Return' : 'Departure') : 'Price'}</span><b class="s5-ffoot__amt">${amount}</b><span class="s5-ffoot__sub">${room ? 'for 1 room' : `for ${seats} traveler${seats === 1 ? '' : 's'}`}${total != null && !room ? ', before discounts' : ''}</span></span><button class="ads-btn" type="button" data-a="cart-add" data-label="${esc(label)}" data-trip="${tr.id}" data-cls="${cls}" data-fare="${pick}">Continue</button></div>`;
  return { title: 'Choose a fare', kind: 'push', backIcon: true, cls: 'pane--s5', offlineText: 'You can view these fares. Choosing one needs a connection.', foot, footCls: 'ads-actionfooter',
    body: `<p class="s5-head__meta">${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)} · ${esc(s5Travelers(b))} ${s5tag('Fare selection')}</p>${sum}<h3 class="ads-group__title s5-dsec">Class</h3>${tabs}<div id="s5c-panel" role="tabpanel" aria-labelledby="s5c-${cls}" class="s5-cpanel"><ul class="s5-cinfo">${S5_CLASS_INFO[cls].map(x => `<li>${ic('check', 'ads-icon--sm')}${x}</li>`).join('')}</ul>
      <fieldset class="ads-fieldset s5-fset"><legend class="ads-group__title s5-dsec">Fare</legend>${opts}</fieldset>${pr ? '' : infoLink('s5-fares', 'Understand fare types')}</div>` };
};

// Trip summary after Continue (the cart and add-ons are outside Sprint 5)
SCR.s5sum = (r, ri) => {
  const b = D().booking, sel = D().s5sel || {}, it = intentOf(b);
  const legCard = leg => { const s = sel[leg]; if (!s) return ''; const res = s5Trips(b, leg), tr = res.list.find(x => x.id === s.trip); if (!tr) return ''; const room = s.cls === 'Rooms', p = it === 'pr' ? null : (s5Fares(s.cls, tr.cls[s.cls]).find(f => f[0] === s.fare) || [, tr.cls[s.cls]])[1], n = travelerCount(b);
    return `<div class="ads-summary s5-fsum"><div class="ads-summary__head"><div><p class="ads-summary__title">${leg === 'ret' ? 'Return' : 'Departure'} · ${fmtShort(res.date)}</p><p class="s5-fsum__route">${esc(ST[res.from].city)} → ${esc(ST[res.to].city)}</p></div>${infoLink(`s5-trip:${tr.id}`, 'Details')}</div><p class="s5-fsum__times">${ic(S5_SVC[tr.svc][0], 'ads-icon--sm')} ${esc(tr.name)} ${tr.num} · <b>${s5time(tr.dep + tr.delay)}</b> → <b>${s5time(tr.arr + tr.delay)}</b></p><p class="s5-fsum__route">${room ? '1 private room' : `${n} ${s5ClsName(s.cls)} seat${n === 1 ? '' : 's'}`} · ${esc(s.fare)}${p == null ? '' : ` · ${s5Price(b, room ? p : p * n)}`}</p></div>`; };
  snote('Trip summary after Continue: the trip is in the (simulated) cart. Add-ons, seats, traveler details and checkout aren’t part of Sprint 5.');
  return { title: 'Trip summary', kind: 'push', backIcon: true, cls: 'pane--s5',
    body: `${alertBox('success', 'In your cart', 'Your trip is held in your cart while you finish booking.')}${legCard('dep')}${legCard('ret')}<div class="handoff"><span class="handoff__tag">Prototype handoff</span><p class="ads-body-small">Add-ons (bags, bikes, pets), seats, traveler details and checkout come next. They aren’t part of Sprint 5.</p></div>` };
};

// =====================================================================
// Results drawer (proposed, NMA-761 and NMA-1109): Pay with points on Departure and Return, and on a round trip the
// cost of each leg and the trip total as it builds. Built from the existing Pay with points row and Summary list.
// =====================================================================
const s5PtsOk = b => ['standard', 'personal'].includes(intentOf(b));
function s5LegCost(b, leg, s) {
  s = s || (D().s5sel || {})[leg]; if (!s) return null;
  const tr = s5Trips(b, leg).list.find(x => x.id === s.trip); if (!tr || tr.cls[s.cls] == null) return null;
  const p = (s5Fares(s.cls, tr.cls[s.cls]).find(f => f[0] === s.fare) || [, tr.cls[s.cls]])[1];
  return s.cls === 'Rooms' ? p : p * travelerCount(b);
}
const s5Money = (b, v) => intentOf(b) === 'pr' ? 'Pass Rider fare' : v == null ? '—' : b.pay === 'points' && s5PtsOk(b) ? s5Price(b, v) : `$${v.toFixed(2)}`;
// pending: the fare being chosen on the Choose a fare screen (its leg and cost), so the total shows before Continue
function s5Drawer(b, leg, pending) {
  const rt = b.trip === 'rt', pts = s5PtsOk(b), member = D().signedIn;
  const toggle = pts && !pending ? pointsRow({ id: 's5-points', title: 'Pay with points', sub: b.code && b.pay !== 'points' ? 'Codes can’t be used with points.' : member ? '12,450 points available' : 'You’ll sign in to use your points after you choose a fare.', checked: b.pay === 'points', attrs: 'data-a="s5-points"' }) : '';
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
  // NMA-613 scenario 1: points searches don't take codes. Turning points on with a code asks before removing it.
  if (on && b.code) { t.checked = false; dialog({ title: 'Use points and remove your code?', body: `Codes can’t be used when you pay with points. Your code ${esc(b.code.code || b.codeText)} will be removed from this search.`, returnFocus: '#s5-points', actions: [['Use points', 'primary', () => { Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '', codeTries: 0, codeDraft: '', codeSrc: '', codeSig: '' }); done(); }], ['Keep my code', 'secondary', null]] }); return; }
  done();
};
document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('s5-totacc')) s5().totOpen = e.target.open; }, true);

