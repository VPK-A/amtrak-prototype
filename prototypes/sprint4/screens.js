/* Sprint 4 prototype: screens. Shared pieces, arranged differently by each version. */
const v1 = () => TB.v === 1, v2 = () => TB.v === 2, v3 = () => TB.v === 3, v4 = () => TB.v === 4;
// Versions 3 and 4 share the booking sheets and the Fare Finder variants (codes, points, TripLink, Pass Rider)
const rich = () => TB.v >= 3;

// ---------- Small renderers ----------
function fieldHtml(o) {
  const id = o.id, err = o.err;
  const marker = o.req ? '<span class="ads-field__marker ads-field__marker--required">Required</span>' : o.opt ? '<span class="ads-field__marker ads-field__marker--optional">Optional</span>' : '';
  const attrs = [o.type === 'tel' || o.inputmode ? `inputmode="${o.inputmode || 'numeric'}"` : '', o.autocomplete ? `autocomplete="${o.autocomplete}"` : '', o.max ? `maxlength="${o.max}"` : '', o.placeholder ? `placeholder="${esc(o.placeholder)}"` : '', o.digits != null ? `data-digits="${o.digits}"` : '', o.alpha ? 'data-alpha' : '', o.live ? 'data-live' : '', o.readonly ? 'readonly' : '', err ? 'aria-invalid="true"' : '', o.req ? 'aria-required="true"' : ''].filter(Boolean).join(' ');
  const control = o.select
    ? `<div class="ads-control ads-control--select${err ? ' ads-control--error' : ''}"><select id="${id}" data-f="${o.f}" ${o.hook ? `data-hook="${o.hook}"` : ''} ${err || o.help ? `aria-describedby="${id}-h"` : ''} ${err ? 'aria-invalid="true"' : ''} ${o.req ? 'aria-required="true"' : ''}>${o.select.map(([v, l]) => `<option value="${esc(v)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${ic('chevron-down')}</div>`
    : `<div class="ads-control${err ? ' ads-control--error' : ''}${o.prefix ? ' has-prefix' : ''}">${o.prefix ? `<span class="ctl-prefix" aria-hidden="true">${esc(o.prefix)}</span>` : ''}<input id="${id}" type="${o.type || 'text'}" data-f="${o.f}" value="${esc(o.value)}" ${err || o.help ? `aria-describedby="${id}-h"` : ''} ${attrs}></div>`;
  return `<div class="ads-field${o.cls ? ' ' + o.cls : ''}"><label class="ads-field__label" for="${id}">${esc(o.label)}${marker}</label>${control}${err || o.help ? `<p class="ads-helper${err ? ' ads-helper--error' : ''}" id="${id}-h">${err ? ic('alert-diamond') + '<span>' + esc(err) + '</span>' : esc(o.help)}</p>` : ''}</div>`;
}
const choice = (type, name, f, val, checked, label, sup = '', extra = '') => `<label class="ads-choice ads-${type}"><input type="${type}" name="${name}" data-f="${f}" value="${esc(val)}" ${checked ? 'checked' : ''} ${type === 'checkbox' ? 'data-multi' : ''} ${extra}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${label}</span>${sup ? `<span class="ads-choice__supporting">${sup}</span>` : ''}</span></label>`;
const group = (title, rows, foot = '', id = '') => `<div class="ads-group"${id ? ` id="${id}"` : ''}>${title ? `<h3 class="ads-group__title">${title}</h3>` : ''}<div class="ads-group__body">${rows.join('')}</div>${foot ? `<p class="ads-group__foot">${foot}</p>` : ''}</div>`;
function grow(o) {
  const tag = o.a ? 'button' : 'div';
  const attrs = o.a ? `type="button" data-a="${o.a}" ${o.data || ''} ${o.current ? 'aria-current="true"' : ''}` : '';
  const val = o.value != null ? `<span class="ads-group__value${o.empty ? ' ads-group__value--empty' : ''}">${o.value}</span>` : '';
  return `<${tag} class="ads-group__row${o.cls ? ' ' + o.cls : ''}" ${attrs} ${o.k ? `data-k="${o.k}"` : ''}>${o.icon ? ic(o.icon, 'ads-group__lead') : ''}<span class="ads-group__text"><span class="ads-group__label">${o.label}</span>${val}</span>${o.meta ? `<span class="ads-group__meta">${o.meta}</span>` : ''}${o.a && o.chev !== false ? ic('chevron-right') : ''}</${tag}>`;
}
const lockChip = '<span class="ads-lock">Can’t be changed</span>';
const sectionTitle = (t, extra = '') => `<h3 class="ptitle">${t}${extra}</h3>`;
const fmtPhone = p => p.region === 'us' ? (p.mobile ? `Mobile (${p.mobile.slice(0, 3)}) ${p.mobile.slice(3, 6)}-${p.mobile.slice(6)}` : 'Not added') : `${(DIAL.find(x => x[0] === p.cc) || DIAL[0])[2]} ${p.intl}`;
const fmtAddress = a => a.street ? `${esc(a.street)}${a.apt ? ', ' + esc(a.apt) : ''}<br>${esc(a.city)}${a.state ? ', ' + esc(a.state) : ''} ${esc(a.zip)}<br>${esc((COUNTRIES.find(c => c[0] === a.country) || ['', a.country])[1])}` : 'Not added';
const maskEmail = e => e.replace(/^(.)[^@]*/, '$1•••');
const stLabel = c => c ? `${ST[c].city}, ${ST[c].st} (${c})` : '';

// ---------- Tabs (App Shell destinations; only Book has Sprint 4 content) ----------
const TABS = {
  book: () => `<div class="tabpage"><h1 class="ads-h3">Book</h1>
    <button class="newbooking" type="button" data-a="open-booking">${ic('search')}<b>New Booking</b><span class="ads-text-tertiary">Where to?</span></button>
    <p class="sec">Explore destinations</p><div class="tiles"><div class="tile"><b>Recommended trips</b><small>Pacific Surfliner, Adirondack</small></div><div class="tile"><b>Routes near me</b><small>Favorite stations</small></div></div>
    <p class="sec">Plan your trip</p><div class="tiles"><div class="tile"><b>Passes</b><small>Not part of Sprint 4</small></div><div class="tile"><b>Gift cards</b><small>Not part of Sprint 4</small></div></div></div>`,
  trips: () => `<div class="tabpage"><h1 class="ads-h3">Trips</h1><div class="ads-segmented" role="group" aria-label="Trips"><button type="button" aria-pressed="false">Active</button><button type="button" aria-pressed="true">Upcoming</button><button type="button" aria-pressed="false">Past</button></div><div class="ads-summary ads-summary--empty"><p class="ads-summary__title">No upcoming trips</p><p class="ads-body-small">Trips you book show up here. Trip management is outside Sprint 4.</p></div></div>`,
  'train-status': () => `<div class="tabpage"><h1 class="ads-h3">Train Status</h1><div class="ads-summary"><div class="ads-field"><label class="ads-field__label" for="tsn">Train number</label><div class="ads-control"><input id="tsn" inputmode="numeric" placeholder="e.g. 171"></div></div><p class="ads-body-small ads-text-secondary">Train Status isn’t part of Sprint 4. Its station search will reuse the Book station search (NMA-600).</p></div></div>`,
  support: () => `<div class="tabpage"><h1 class="ads-h3">Support</h1>${group('', [grow({ label: 'Issue with your trip?', value: 'Disruptions and cancellations' }), grow({ label: 'Know before booking', value: 'Accessible travel and station help' }), grow({ label: 'Contact Amtrak', value: 'Text · Call · Email · Live Chat' })])}<p class="ads-body-small ads-text-secondary">Support content isn’t part of Sprint 4.</p></div>`
};

// ---------- Split rules (iPad) ----------
const SPLIT_PARENT = (parent, child) => {
  if (v3()) return false;
  if (v2() && (child.s === 'assist' || child.s === 'assist-profile')) return false;
  const pairs = { ff: ['stations', 'calendar', 'travelers', 'assist'], travelers: ['assist'], account: ['profile', 'assist-profile', 'stub'], profile: ['edit', 'discounts'], discounts: ['rules'] };
  return (pairs[parent.s] || []).includes(child.s);
};
const SPLIT_SELF = r => (v3() && ['profile', 'assist-profile'].includes(r.s)) || (v2() && ['assist', 'assist-profile'].includes(r.s));

// =====================================================================
// A. Fare Finder
// =====================================================================
function ffErrors(b) { return { from: !b.from ? 'Choose a departure station' : '', to: !b.to ? 'Choose an arrival station' : '', ret: b.trip === 'rt' && !b.ret ? 'Choose a return date' : '' }; }
function routeField(r, ri, opts = {}) {
  const b = D().booking, e = r.u.showErr ? ffErrors(b) : {};
  const half = (f, label) => {
    const c = b[f], s = c && ST[c];
    return `<button class="ads-routefield__half" type="button" data-a="pick-station" data-field="${f}" id="ff-${f}" ${e[f] ? `aria-invalid="true" aria-describedby="ff-${f}-err"` : ''} aria-label="${label}: ${s ? `${s.city}, ${s.name}` : 'not chosen'}">${s ? `<span class="ads-routefield__code">${c}</span>` : ''}<span class="ads-routefield__body"><span class="ads-routefield__label">${label}</span>${s ? `<span class="ads-routefield__city">${s.city}, ${s.st}</span><span class="ads-routefield__station">${s.name}</span>` : `<span class="ads-routefield__hint">${f === 'from' ? 'Where from?' : 'Where to?'}</span>`}</span></button>`;
  };
  const errs = ['from', 'to'].filter(f => e[f]).map(f => `<p class="ads-helper ads-helper--error" id="ff-${f}-err">${ic('alert-diamond')}<span>${e[f]}</span></p>`).join('');
  return `<div class="ads-routefield">${half('from', 'From')}${half('to', 'To')}<button class="ads-icon-btn ads-routefield__swap" type="button" data-a="swap" aria-label="Swap From and To" ${!b.from && !b.to ? 'disabled' : ''}>${ic('trip-swap-vertical')}</button></div>${errs}`;
}
function dateFields(r, opts = {}) {
  const b = D().booking, e = r.u.showErr ? ffErrors(b) : {};
  const df = (f, label) => {
    const val = b[f];
    if (f === 'ret' && b.trip === 'ow') return `<button class="ads-datefield" type="button" data-a="add-return"><span class="ads-datefield__label">Return</span><span class="ads-datefield__add">${ic('plus-circle', 'ads-icon--sm')}Add Return</span></button>`;
    return `<button class="ads-datefield" type="button" data-a="pick-date" data-field="${f}" id="ff-${f}" ${e[f] ? `aria-invalid="true" aria-describedby="ff-ret-err"` : ''} aria-label="${label}: ${val ? fmtWeekday(val) + ', ' + fmtDate(val) : 'not chosen'}"><span class="ads-datefield__label">${label}</span>${val ? `<span class="ads-datefield__value">${fmtDate(val)}</span><span class="ads-datefield__day">${fmtWeekday(val)}${val === TODAY_S ? ' · Today' : ''}</span>` : `<span class="ads-datefield__add">${ic('calendar', 'ads-icon--sm')}Choose date</span>`}</button>`;
  };
  return `<div class="ads-datefields">${df('dep', 'Depart')}${df('ret', 'Return')}</div>${e.ret ? `<p class="ads-helper ads-helper--error" id="ff-ret-err">${ic('alert-diamond')}<span>${e.ret}</span></p>` : ''}`;
}
const tripSeg = () => { const b = D().booking; return `<div class="ads-segmented" role="group" aria-label="Trip type"><button type="button" data-a="trip" data-v="ow" aria-pressed="${b.trip === 'ow'}">One-way</button><button type="button" data-a="trip" data-v="rt" aria-pressed="${b.trip === 'rt'}">Round-trip</button></div>`; };
// PWD applies to standard bookings; TripLink Corporate and Pass Rider don't take passenger discounts (Q12)
const pwdApplies = b => b.assistOn && b.assistDone && b.assist.cat === 'disability' && ['standard', 'personal'].includes(intentOf(b));
function travelersRow(r, opts = {}) {
  const b = D().booking;
  return group('', [grow({ a: 'pick-travelers', icon: 'people', label: esc(paxSummary(b)), value: `Discounts: ${esc(discSummary(b))}`, current: opts.open })]);
}
function assistBlock(r, ri, host) {
  const v = V(), b = v.data.booking; if (v.entry !== host) return '';
  ref('973', '614');
  const intro = 'Tell us your travel needs, like a mobility device, a service animal, hearing loss or station assistance. One traveler with a disability may bring one personal companion.';
  let h = `<div class="assistbox"><label class="ads-choice ads-checkbox"><input type="checkbox" id="assist-on-${host}" data-a="assist-toggle" ${b.assistOn ? 'checked' : ''} aria-describedby="assist-intro-${host}"><span class="ads-choice__control"></span><span class="ads-choice__label"><span><b>Traveler with disability or need help?</b></span><span class="ads-choice__supporting" id="assist-intro-${host}">${intro}</span></span></label>`;
  if (b.assistOn) {
    if (b.assistDone) h += assistSummaryCard(b.assist, { title: 'Traveler 1 · Adult', edit: 'assist-edit', fromProfile: b.assistFromProfile, booking: true });
    else h += `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-edit" style="align-self:flex-start">Answer for Traveler 1</button>`;
  }
  h += q(7) + '</div>';
  return h;
}
function ffNotice(b) { return b.notice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${b.notice}</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="dismiss-notice" aria-label="Dismiss">${ic('close', 'ads-icon--sm')}</button></div>` : ''; }
function findBtn(r) { return r.u.busy ? busyBtn(r, '', 'Finding trains') : `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="find-trains">Find Trains</button>`; }

SCR.ff = (r, ri) => {
  const b = D().booking, v = V();
  ref('607', '608', '1060');
  if (b.trip === 'rt') ref('608');
  if (v3()) return ffClear(r, ri);
  if (v4()) return ffFlighty(r, ri);
  if (D().signedIn && (D().triplink || D().passrider)) tip('Versions 1 and 2 show the standard Fare Finder. The TripLink and Pass Rider variants are designed in Versions 3 and 4.');
  if (v2()) return ffV2(r, ri);
  const body = `${tripSeg()}${ffNotice(b)}${routeField(r, ri)}${dateFields(r)}${travelersRow(r)}${assistBlock(r, ri, 'ff')}${netAlert(r)}`;
  return { title: 'New Booking', kind: 'root', body, foot: findBtn(r), offlineText: 'You can fill in your trip. Finding trains needs a connection.' };
};
function ffV2(r, ri) {
  const b = D().booking, e = ffErrors(b);
  const stepsDone = [!!(b.from && b.to), !!(b.dep && (b.trip === 'ow' || b.ret))];
  const step = (n, title, done, open, content, locked) => `<section class="gstep${open ? ' is-open' : ''}${locked ? ' is-locked' : ''}" aria-labelledby="gs-${n}"><div class="gstep__head"><span class="ads-steps__marker${done ? ' is-done' : ''}" aria-hidden="true">${done ? ic('check', 'ads-icon--sm') : n}</span><h3 id="gs-${n}" class="gstep__title">${title}<span class="ads-sr-only">${done ? ', done' : locked ? ', available after the step above' : ''}</span></h3></div>${locked ? `<p class="gstep__locked">${locked}</p>` : content}</section>`;
  const left = [];
  if (!b.from) left.push('a departure station'); if (!b.to) left.push('an arrival station'); if (b.trip === 'rt' && !b.ret) left.push('a return date');
  const autoNote = (b.from === 'LOR' || b.from === 'SFA') ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>Lorton and Sanford are Auto Train stations. They only connect to each other, so the other end was filled in for you.</span></p>` : '';
  const body = `${tripSeg()}<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${b.trip === 'ow' ? 'One-way trip. You can add a return at any time.' : 'Round trip. You’ll choose both dates in one calendar.'}</span></p>${ffNotice(b)}
    ${step(1, 'Where are you going?', stepsDone[0], true, routeField(r, ri) + autoNote)}
    ${step(2, 'When are you leaving?', stepsDone[1] && stepsDone[0], stepsDone[0], dateFields(r) + `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>Departure starts as today. ${b.trip === 'rt' ? 'The return can’t be before the departure.' : ''}</span></p>`, stepsDone[0] ? '' : 'Choose both stations first. Dates depend on the route.')}
    ${step(3, 'Who’s traveling?', stepsDone[0], stepsDone[0], travelersRow(r) + assistBlock(r, ri, 'ff'), stepsDone[0] ? '' : 'Available after you choose stations.')}
    ${netAlert(r)}`;
  const status = left.length ? `<p class="gleft" id="ff-left">${ic('info-circle', 'ads-icon--sm')}<span>Still needed: ${left.join(', ')}.</span></p>` : `<p class="gleft is-ready" id="ff-left">${ic('check-circle', 'ads-icon--sm')}<span>Ready to search.</span></p>`;
  return { title: 'New Booking', kind: 'root', body, foot: status + findBtn(r), offlineText: 'You can fill in your trip. Finding trains needs a connection.' };
}
// Fare Finder actions
A.trip = t => { const b = D().booking; b.trip = t.dataset.v; if (b.trip === 'rt') { if (!b.ret) b.ret = b.dep; } else b.ret = null; pendingFocus = `[data-a="trip"][data-v="${t.dataset.v}"]`; render(); };
A['add-return'] = (t, ri) => { const b = D().booking; b.trip = 'rt'; b.ret = b.dep; pendingFocus = '#ff-ret'; render(); };
A.swap = () => { const b = D().booking; [b.from, b.to] = [b.to, b.from]; pendingFocus = '[data-a="swap"]'; render(); };
A['dismiss-notice'] = () => { D().booking.notice = null; pendingFocus = 'title'; render(); };
A['pick-station'] = (t, ri) => push('stations', { field: t.dataset.field }, +ri);
A['pick-date'] = (t, ri) => push('calendar', { field: t.dataset.field }, +ri);
A['pick-travelers'] = (t, ri) => push('travelers', {}, +ri);
A['find-trains'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, e = ffErrors(b);
  if (e.from || e.to || e.ret) { r.u.showErr = true; pendingFocus = e.from ? '#ff-from' : e.to ? '#ff-to' : '#ff-ret'; render(); return; }
  r.u.showErr = false;
  runNet(r, () => {}, () => push('handoff', {}, +ri), { what: 'find trains' });
};
A['pick-travelers-done'] = (t, ri) => pop();

// =====================================================================
// Station search (NMA-600, 118, 984)
// =====================================================================
const words = s => s.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
function searchStations(qs) {
  const q = qs.trim().toLowerCase(); if (!q) return [];
  const rank = s => {
    if (s.code.toLowerCase() === q) return 0;
    if (s.code.toLowerCase().startsWith(q)) return 1;
    if (s.city.toLowerCase().startsWith(q) || words(s.city).some(w => w.startsWith(q))) return 2;
    if (s.state.toLowerCase().startsWith(q) || words(s.state).some(w => w.startsWith(q)) || s.st.toLowerCase() === q) return 3;
    if (s.name.toLowerCase().startsWith(q) || words(s.name).some(w => w.startsWith(q)) || s.aliases.some(a => a.toLowerCase().startsWith(q) || words(a).some(w => w.startsWith(q)))) return 4;
    if (s.zip.startsWith(q)) return 5;
    return 99;
  };
  return STATIONS.map(s => [rank(s), s]).filter(x => x[0] < 99).sort((a, b) => a[0] - b[0] || a[1].city.localeCompare(b[1].city) || a[1].name.localeCompare(b[1].name)).map(x => x[1]);
}
function stationRow(s, field, sec) {
  const d = D(), fav = d.fav.includes(s.code), cur = d.booking[field] === s.code;
  const rec = d.rec.find(x => x.c === s.code);
  const when = sec === 'rec' && rec ? ` · ${rec.d === 0 ? 'today' : rec.d === 1 ? 'yesterday' : rec.d + ' days ago'}` : '';
  const blocked = s.tag && autoTrainBlocked();
  return `<li class="ads-stationrow" ${cur ? 'aria-current="true"' : ''}><button class="ads-stationrow__select" type="button" data-a="choose-station" data-code="${s.code}" data-field="${field}" data-k="st-${sec}-${s.code}" ${blocked ? 'disabled' : ''}><span class="ads-stationrow__code">${s.code}</span><span class="ads-stationrow__text"><span class="ads-stationrow__name">${s.city}, ${s.st}${cur ? '<span class="ads-sr-only">, currently selected</span>' : ''}</span><span class="ads-stationrow__detail">${s.name}${when}</span>${s.tag ? `<span class="ads-badge ads-badge--info ads-stationrow__tag">${s.tag} only</span>` : ''}${blocked ? '<span class="ads-stationrow__detail">Auto Train isn’t offered for Pass Rider travel</span>' : ''}</span></button><button class="ads-stationrow__star" type="button" data-a="fav" data-code="${s.code}" aria-pressed="${fav}" aria-label="Favorite: ${s.city}, ${s.code}" data-k="fav-${sec}-${s.code}">${ic(fav ? 'star-filled' : 'star')}</button></li>`;
}
function stationSearch(r, ri, field, inline) {
  const d = D(); r.u.d = r.u.d || {};
  const qv = r.u.d.q || '';
  const favs = d.fav.map(c => ST[c]);
  const recs = d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).sort((a, b) => a.d - b.d).map(x => ST[x.c]);
  ref('600', '118', '984');
  let h = `<div class="ss-search"><label class="ads-sr-only" for="ss-q">Search ${field === 'from' ? 'departure' : 'arrival'} stations</label><div class="ads-control ads-control--pill">${ic('search')}<input id="ss-q" type="search" data-f="q" data-live data-nodirty value="${esc(qv)}" placeholder="City, station, code or ZIP" autocomplete="off" aria-describedby="ss-help">${qv ? `<button class="ads-control__clear" type="button" data-a="ss-clear" aria-label="Clear search">${ic('close', 'ads-icon--sm')}</button>` : ''}</div><p class="ads-helper" id="ss-help">Works offline. ${q(1)}${q(2)}</p></div>`;
  if (qv.trim()) {
    const res = searchStations(qv);
    if (res.length) h += `<p class="ads-sr-only" role="status">${res.length} result${res.length > 1 ? 's' : ''}</p><ul class="stlist" aria-label="Search results">${res.slice(0, 25).map(s => stationRow(s, field, 'res')).join('')}</ul>`;
    else if (qv.trim().length > 2) h += `<div class="ss-empty" role="status"><b>No results for “${esc(qv.trim())}”</b><span>Check the spelling, or search by city, station code or ZIP code.</span></div>`;
    else h += `<p class="ss-empty" role="status">Keep typing to search.</p>`;
    return h + `<p class="ss-note">${q(3)} Tap a station to choose it.</p>`;
  }
  if (favs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Favorites</span></div><ul class="stlist" aria-label="Favorite stations">${favs.map(s => stationRow(s, field, 'fav')).join('')}</ul></div>`;
  if (recs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Recents · last 10 days</span></div><ul class="stlist" aria-label="Recent stations">${recs.map(s => stationRow(s, field, 'rec')).join('')}</ul></div>`;
  if (d.rec.some(x => x.d > 10)) tip('BAL was chosen 12 days ago, so it has dropped out of Recents (10-day limit).');
  const showAll = (!favs.length && !recs.length) || r.u.full;
  if (showAll) {
    const byState = {}; STATIONS.forEach(s => (byState[s.state] ||= []).push(s));
    h += `<div class="stsection"><p class="ss-allhead">All stations, by state</p>${Object.keys(byState).sort().map(stn => `<div class="ads-stationrow__header"><span>${stn}</span></div><ul class="stlist" aria-label="${stn}">${byState[stn].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)).map(s => stationRow(s, field, 'all')).join('')}</ul>`).join('')}</div>`;
  } else h += `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="ss-full">View full list</button>`;
  h += `<p class="ss-note">${q(3)} Tap a station to choose it. Star a station to keep it in Favorites.</p>`;
  tip('Search “30th”, “Penn”, “Capitol”, “021” or “VA”. Choose Lorton to see Auto Train pairing.');
  return h;
}
SCR.stations = (r, ri) => {
  if (rich()) return stationsClear(r, ri);
  const f = r.p.field, title = v2() ? (f === 'from' ? 'Choose departure station' : 'Choose arrival station') : (f === 'from' ? 'From' : 'To');
  const lead = v2() ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${f === 'from' ? 'Step 1 of 2 for your route. Next you’ll choose where you’re going.' : 'Step 2 of 2 for your route. It can’t be the same as your departure station.'}</span></p>` : '';
  const why = v2() && D().booking.notice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${D().booking.notice}</p></div></div>` : '';
  return { title, kind: 'push', body: lead + why + stationSearch(r, ri, f, false), banner: false };
};
A['ss-clear'] = (t, ri) => { const r = routeAt(ri); r.u.d.q = ''; pendingFocus = '#ss-q'; render(); };
A['ss-full'] = (t, ri) => { routeAt(ri).u.full = true; pendingFocus = '.ss-allhead + .ads-stationrow__header + .stlist button'; render(); };
A.fav = t => {
  const d = D(), c = t.dataset.code;
  if (d.fav.includes(c)) { d.fav = d.fav.filter(x => x !== c); d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)]; toast(`${ST[c].city} removed from Favorites and returned to Recents`, 'info'); }
  else { d.fav = [...d.fav, c]; d.rec = d.rec.filter(x => x.c !== c); toast(`${ST[c].city} added to Favorites`); }
  pendingFocus = `[data-a="fav"][data-code="${c}"]`; render();
};
A['choose-station'] = (t, ri) => {
  const d = D(), b = d.booking, f = t.dataset.field, c = t.dataset.code, other = f === 'from' ? 'to' : 'from';
  if (autoTrainBlocked() && AUTO_TRAIN[c]) return;
  if (b[other] === c) { dialog({ title: 'Select a different station', body: 'Select different origin and destination stations.', actions: [['OK', 'primary', null]], returnFocus: `[data-k="${t.dataset.k}"]` }); return; }
  b[f] = c; b.notice = null;
  if (AUTO_TRAIN[c]) { b[other] = AUTO_TRAIN[c]; b.notice = `${ST[c].city} is an Auto Train station. Auto Train only runs between Lorton, VA and Sanford, FL, so ${ST[AUTO_TRAIN[c]].city} was added as your ${other === 'to' ? 'arrival' : 'departure'} station.`; }
  else if (b[other] && AUTO_TRAIN[b[other]]) { b.notice = `${ST[b[other]].city} only connects to ${ST[AUTO_TRAIN[b[other]]].city} (Auto Train), so it was cleared. Choose your ${other === 'to' ? 'arrival' : 'departure'} station.`; b[other] = null; }
  if (!d.fav.includes(c)) d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)];
  // V2 and V3 keep going: after From, they open To straight away (no needless return to the form)
  if ((v2() || rich()) && f === 'from' && !b.to) { replaceTop('stations', { field: 'to' }); pendingFocus = '#ss-q'; render(); return; }
  popTo(+ri - 1); pendingFocus = `#ff-${f}`; render();
};

// =====================================================================
// Calendar (NMA-1060)
// =====================================================================
function calendarBody(r, ri, field) {
  const b = D().booking; r.u.picking = r.u.picking || field;
  const picking = b.trip === 'ow' ? 'dep' : r.u.picking;
  ref('1060');
  const maxDep = addDays(TODAY_S, WINDOW_DAYS), maxRet = addDays(b.dep, WINDOW_DAYS);
  const last = parse(picking === 'ret' ? maxRet : maxDep);
  const months = [];
  for (let d = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); d <= last; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(new Date(d));
  const day = (y, m, dd) => {
    const s = iso(new Date(y, m, dd));
    const disabled = s < TODAY_S || (picking === 'dep' && s > maxDep) || (picking === 'ret' && (s < b.dep || s > maxRet));
    const isDep = s === b.dep, isRet = b.trip === 'rt' && s === b.ret, inRange = b.trip === 'rt' && b.ret && s > b.dep && s < b.ret;
    const cls = ['ads-day', s === TODAY_S ? 'ads-day--today' : '', isDep && b.trip === 'rt' && b.ret && b.ret !== b.dep ? 'ads-day--range-start' : '', isRet && b.ret !== b.dep ? 'ads-day--range-end' : '', inRange ? 'ads-day--in-range' : ''].filter(Boolean).join(' ');
    const label = `${fmtWeekday(s)}, ${fmtDate(s)}${s === TODAY_S ? ', today' : ''}${isDep ? ', departure date' : ''}${isRet ? ', return date' : ''}${disabled ? ', not available' : ''}`;
    return `<button class="${cls}" type="button" data-a="day" data-d="${s}" data-k="day-${s}" ${disabled ? 'disabled' : ''} ${isDep || isRet ? 'aria-pressed="true"' : ''} aria-label="${label}">${dd}</button>`;
  };
  const monthHtml = m => { const y = m.getFullYear(), mo = m.getMonth(), first = m.getDay(), n = new Date(y, mo + 1, 0).getDate(); let g = ''; for (let i = 0; i < first; i++) g += '<span></span>'; for (let dd = 1; dd <= n; dd++) g += day(y, mo, dd); return `<div class="ads-calendar__month"><h3>${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3><div class="ads-calendar__grid" role="group" aria-label="${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}">${g}</div></div>`; };
  const pickSeg = b.trip === 'rt' ? `<div class="ads-segmented" role="group" aria-label="Choosing"><button type="button" data-a="picking" data-v="dep" aria-pressed="${picking === 'dep'}">Depart · ${fmtShort(b.dep)}</button><button type="button" data-a="picking" data-v="ret" aria-pressed="${picking === 'ret'}">Return · ${b.ret ? fmtShort(b.ret) : 'not set'}</button></div>` : '';
  const prompt = v2() ? `<p class="ghint" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${picking === 'dep' ? (b.trip === 'rt' ? 'First, choose your departure date. Then choose your return date in the same calendar.' : 'Choose your departure date. Past dates aren’t available.') : `Now choose your return date. Dates before ${fmtShort(b.dep)} aren’t available.`}</span></p>` : `<p class="ads-sr-only" role="status">Choosing ${picking === 'dep' ? 'departure' : 'return'} date</p>`;
  const notice = r.u.calNotice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${r.u.calNotice}</p></div></div>` : '';
  const limit = `<p class="ss-note">Dates up to ${fmtShort(picking === 'ret' ? maxRet : maxDep)} (${WINDOW_DAYS} days). ${q(4)}</p>`;
  return `${pickSeg}${prompt}${notice}<div class="ads-calendar"><div class="ads-calendar__weekdays" aria-hidden="true">${'SMTWTFS'.split('').map(x => `<span>${x}</span>`).join('')}</div>${months.map(monthHtml).join('')}</div>${limit}`;
}
SCR.calendar = (r, ri) => {
  const b = D().booking;
  const foot = `<div class="calfoot"><span class="ads-body-small"><b>Depart</b> ${fmtShort(b.dep)}${b.trip === 'rt' ? ` · <b>Return</b> ${b.ret ? fmtShort(b.ret) : 'not set'}` : ''}</span><button class="ads-btn" type="button" data-a="cal-done">Done</button></div>`;
  return { title: v2() ? (b.trip === 'rt' ? 'Choose your dates' : 'Choose departure date') : 'Dates', kind: 'push', body: calendarBody(r, ri, r.p.field), foot, banner: false };
};
A.picking = (t, ri) => { routeAt(ri).u.picking = t.dataset.v; pendingFocus = `[data-a="picking"][data-v="${t.dataset.v}"]`; render(); };
A['cal-done'] = (t, ri) => { popTo(+ri - 1); pendingFocus = '#ff-dep'; render(); };
A.day = (t, ri) => {
  const r = routeAt(ri), b = D().booking, s = t.dataset.d;
  const picking = b.trip === 'ow' ? 'dep' : (r.u.picking || 'dep');
  r.u.calNotice = null;
  if (picking === 'dep') {
    b.dep = s;
    if (b.ret && b.ret < s) { b.ret = null; r.u.calNotice = 'Your return date was cleared because it was before the new departure date. Choose a return date.'; }
    if (b.trip === 'rt') r.u.picking = 'ret';
  } else b.ret = s;
  pendingFocus = `[data-k="day-${s}"]`; render();
};

// =====================================================================
// Traveler Selection (fixed sample traveler; discount NMA-612)
// =====================================================================
SCR.travelers = (r, ri) => travelersClear(r, ri, !rich());
A['bk-disc'] = t => { D().booking.disc = t.value; pendingFocus = `[data-a="bk-disc"][value="${t.value}"]`; render(); };

// =====================================================================
// Assistance (shared model: cat, dis[], wc 'yes'|'no'|'', needs[])
// =====================================================================
const toDraft = m => ({ cat: m.cat || '', dis: [...m.dis], wc: m.wc === true ? 'yes' : m.wc === false ? 'no' : '', needs: [...m.needs] });
const fromDraft = x => ({ cat: x.cat || null, dis: x.cat === 'disability' ? [...x.dis] : [], wc: x.cat === 'disability' && x.dis.includes('mobility') ? x.wc === 'yes' : null, needs: x.cat === 'disability' ? [...x.needs] : x.cat === 'station' ? x.needs.filter(n => n === 'seat') : [] });
function assistErrors(x, mode) {
  const e = {};
  if (mode === 'booking' && !x.cat) e.cat = 'Choose an option for Traveler 1.';
  if (x.cat === 'disability' && !x.dis.length) e.dis = 'Choose at least one disability.';
  if (x.cat === 'disability' && x.dis.includes('mobility') && !x.wc) e.wc = 'Tell us whether you’ll bring a wheelchair.';
  return e;
}
HOOKS.assist = (r, t) => {
  const x = r.u.d;
  if (x.cat !== 'disability') { x.dis = []; x.wc = ''; x.needs = x.cat === 'station' ? x.needs.filter(n => n === 'seat') : []; }
  if (!x.dis.includes('mobility')) x.wc = '';
  if (x.wc === 'yes' && x.needs.includes('seat') && x.needs.includes('animal')) { x.needs = x.needs.filter(n => n !== 'animal'); r.u.assistNote = 'Large service animal was removed. With wheelchair space you can choose an accessible seat or a large service animal, not both.'; }
  else if (t.dataset.f !== 'needs') r.u.assistNote = null;
  if (r.u.err) r.u.err = assistErrors(x, r.u.mode);
};
function needsBlock(r, x, idp, explain) {
  const wcYes = x.wc === 'yes';
  const items = x.cat === 'station' ? NEEDS.filter(n => n[0] === 'seat') : NEEDS;
  const opts = items.map(([k, l, s]) => {
    let dis = false, why = '';
    if (wcYes && k === 'animal' && x.needs.includes('seat')) { dis = true; why = 'Not available with an accessible seat when you bring a wheelchair. Remove Accessible seat to choose this.'; }
    if (wcYes && k === 'seat' && x.needs.includes('animal')) { dis = true; why = 'Not available with a large service animal when you bring a wheelchair. Remove Large service animal to choose this.'; }
    return choice('checkbox', `${idp}-needs`, 'needs', k, x.needs.includes(k), l, why || s, `data-hook="assist" ${dis ? 'disabled' : ''}`);
  }).join('');
  const lead = explain && wcYes ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>With wheelchair space, Station Assistance is always available. You can add an accessible seat or a large service animal, but not both.</span></p>` : '';
  const note = r.u.assistNote ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${r.u.assistNote}</p></div></div>` : '';
  return `<fieldset class="ads-fieldset"><legend class="ads-field-label">${x.cat === 'station' ? 'Do you need an accessible seat?' : 'Do you have other needs?'} <span class="ads-field__marker ads-field__marker--optional">Optional</span></legend>${lead}${note}<div class="ads-fieldset__options">${opts}</div></fieldset>`;
}
function catBlock(r, x, idp, mode, e) {
  const cats = mode === 'booking' ? ['disability', 'station', 'companion', 'none'] : ['disability', 'station'];
  const opts = cats.map(k => k === 'companion'
    ? choice('radio', `${idp}-cat`, 'cat', k, false, CATS[k], 'Needs another traveler who has a disability. Companion rules aren’t final, so this is unavailable here.', 'disabled')
    : choice('radio', `${idp}-cat`, 'cat', k, x.cat === k, CATS[k], k === 'station' ? 'Station assistance only. The Passenger with Disability discount doesn’t apply.' : '', 'data-hook="assist"')).join('');
  return `<fieldset class="ads-fieldset" ${e.cat ? `aria-describedby="${idp}-cat-err"` : ''}><legend class="ads-field-label">${mode === 'booking' ? 'Traveler 1 needs' : 'Assistance type'}</legend><div class="ads-fieldset__options">${opts}</div>${e.cat ? `<p class="ads-helper ads-helper--error" id="${idp}-cat-err">${ic('alert-diamond')}<span>${e.cat}</span></p>` : ''}</fieldset>${mode === 'booking' ? q(9) : ''}`;
}
function disBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset" ${e.dis ? `aria-describedby="${idp}-dis-err"` : ''}><legend class="ads-field-label">Select applicable disabilities <span class="ads-field__marker ads-field__marker--required">At least one</span></legend><div class="ads-fieldset__options">${DISABILITIES.map(([k, l, s]) => choice('checkbox', `${idp}-dis`, 'dis', k, x.dis.includes(k), l, s, 'data-hook="assist"')).join('')}</div>${e.dis ? `<p class="ads-helper ads-helper--error" id="${idp}-dis-err">${ic('alert-diamond')}<span>${e.dis}</span></p>` : ''}</fieldset>`;
}
function wcBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset ads-fieldset--inline wcq" ${e.wc ? `aria-describedby="${idp}-wc-err"` : ''}><legend class="ads-field-label">${ic('wheelchair-space', 'ads-icon--sm')} Will you bring a wheelchair (need wheelchair space)?</legend><div class="ads-fieldset__options">${choice('radio', `${idp}-wc`, 'wc', 'yes', x.wc === 'yes', 'Yes', '', 'data-hook="assist"')}${choice('radio', `${idp}-wc`, 'wc', 'no', x.wc === 'no', 'No', '', 'data-hook="assist"')}</div>${e.wc ? `<p class="ads-helper ads-helper--error" id="${idp}-wc-err">${ic('alert-diamond')}<span>${e.wc}</span></p>` : ''}<p class="ads-helper">Mobility device details (NMA-29) aren’t part of this exploration.</p></fieldset>`;
}
// One-page form (V1 and V3)
function assistForm(r, ri, o) {
  const src = o.mode === 'booking' ? D().booking.assist : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src); r.u.mode = o.mode; }
  const x = r.u.d, e = r.u.err || {}, idp = o.idp;
  ref(o.mode === 'booking' ? '615' : '26', '27', '28', o.mode === 'booking' ? '995' : '995', '996');
  let h = catBlock(r, x, idp, o.mode, e);
  if (x.cat === 'disability') { h += disBlock(r, x, idp, e); if (x.dis.includes('mobility')) h += wcBlock(r, x, idp, e); h += needsBlock(r, x, idp, false); }
  if (x.cat === 'station') h += needsBlock(r, x, idp, false);
  if (x.cat === 'disability' || x.cat === 'station') h += `<p class="ss-note">Service animal and mobility device forms (NMA-628, 629) and live station-assistance availability (NMA-620) are placeholders, not designed here.</p>`;
  return `<div class="assistform">${h}</div>`;
}
function assistSummaryItems(m) {
  if (!m.cat) return ['No assistance saved'];
  const out = [CATS[m.cat]];
  if (m.cat === 'disability') out.push(m.dis.map(k => DISABILITIES.find(x => x[0] === k)[1]).join(', '));
  if (m.wc === true) out.push('Bringing a wheelchair (wheelchair space)');
  if (m.wc === false) out.push('Not bringing a wheelchair');
  if (m.needs.length) out.push(m.needs.map(k => NEEDS.find(x => x[0] === k)[1]).join(', '));
  else if (m.cat !== 'none') out.push('No other needs');
  return out;
}
function assistSummaryCard(m, o) {
  return `<div class="ads-summary${o.editing ? ' ads-summary--editing' : ''}"><div class="ads-summary__head"><div><p class="ads-summary__title">${o.title}</p>${o.fromProfile ? '<span class="ads-lock">From your Profile</span>' : ''}</div>${o.edit ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="${o.edit}">Edit</button>` : ''}</div><ul class="ads-summary__list">${assistSummaryItems(m).map(t => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul>${o.booking && m.cat === 'disability' ? `<p class="ads-body-small ads-text-secondary">${pwdApplies(D().booking) ? 'Passenger with Disability discount applies to this booking.' : 'Passenger discounts aren’t used for this kind of booking, so the Passenger with Disability discount doesn’t apply.'}</p>` : ''}</div>`;
}

// ---- Wizard (V2) ----
function wizSteps(x, mode) {
  const s = ['cat'];
  if (x.cat === 'disability') { s.push('dis'); if (x.dis.includes('mobility')) s.push('wc'); s.push('needs'); }
  if (x.cat === 'station') s.push('needs');
  s.push('review');
  return s;
}
const STEP_NAMES = { cat: 'Type of help', dis: 'Disabilities', wc: 'Wheelchair', needs: 'Other needs', review: 'Review' };
function wizard(r, ri, mode, title) {
  const src = mode === 'booking' ? D().booking.assist : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src); r.u.mode = mode; r.u.step = r.u.step || (src.cat ? 'review' : 'cat'); }
  const x = r.u.d, steps = wizSteps(x, mode); if (!steps.includes(r.u.step)) r.u.step = 'cat';
  const i = steps.indexOf(r.u.step), e = r.u.err || {}, idp = 'wz';
  ref(mode === 'booking' ? '615' : '26', '27', '28', '995', '996');
  let content = '';
  const why = t => `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${t}</span></p>`;
  if (r.u.step === 'cat') content = why(mode === 'booking' ? 'Your answer decides the next questions and whether the Passenger with Disability discount applies.' : 'Saved assistance is used when you book. Choosing “I have a disability” also saves the Passenger with Disability discount.') + catBlock(r, x, idp, mode, e) + (mode === 'profile' && x.cat ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-clear-draft">Clear selection</button>` : '');
  if (r.u.step === 'dis') content = why('Choose all that apply. Reduced mobility adds one question about wheelchair space.') + disBlock(r, x, idp, e);
  if (r.u.step === 'wc') content = why('Wheelchair space changes which seat options you can combine.') + wcBlock(r, x, idp, e);
  if (r.u.step === 'needs') content = needsBlock(r, x, idp, true);
  if (r.u.step === 'review') {
    const m = fromDraft(x);
    content = `${why(mode === 'booking' ? 'Check Traveler 1’s answers. You can change them before you find trains.' : 'Check your answers, then save them to your Profile.')}${steps.filter(s => s !== 'review').map(s => `<div class="revrow"><div><span class="ads-caption ads-text-secondary">${STEP_NAMES[s]}</span><p class="ads-body-small">${esc(stepValue(s, m))}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="wiz-go" data-step="${s}" aria-label="Edit ${STEP_NAMES[s]}">Edit</button></div>`).join('')}${mode === 'profile' ? pwdPreview(m) : ''}`;
  }
  const count = `<div class="ads-steps__progress"><span class="ads-steps__count">Step ${i + 1} of ${steps.length} · ${STEP_NAMES[r.u.step]}</span><div class="ads-steps__bar" aria-hidden="true">${steps.map((s, j) => `<i class="${j <= i ? 'is-done' : ''}"></i>`).join('')}</div></div>`;
  const rail = `<ol class="ads-steps" aria-label="Steps">${['cat', 'dis', 'wc', 'needs', 'review'].map((s, j) => { const inS = steps.includes(s) || !x.cat, done = steps.includes(s) && steps.indexOf(s) < i, cur = s === r.u.step; return `<li class="ads-steps__item${done ? ' ads-steps__item--done' : ''}${!inS ? ' ads-steps__item--skipped' : ''}${!steps.includes(s) && !x.cat ? ' is-maybe' : ''}" ${cur ? 'aria-current="step"' : ''}><span class="ads-steps__marker" aria-hidden="true">${done ? ic('check', 'ads-icon--sm') : j + 1}</span><span>${STEP_NAMES[s]}<span class="ads-sr-only">${done ? ', done' : cur ? ', current' : !inS ? ', skipped, doesn’t apply' : ''}</span></span></li>`; }).join('')}</ol>`;
  const body = IPAD() ? `<div class="split2 split2--rail"><div class="split2__rail">${rail}</div><div class="split2__main">${count}${netAlert(r)}${content}</div></div>` : `${count}${netAlert(r)}${content}`;
  const last = r.u.step === 'review';
  const foot = `<div class="wizfoot">${i > 0 ? `<button class="ads-btn ads-btn--secondary" type="button" data-a="wiz-back">Back</button>` : ''}${last ? (mode === 'profile' ? busyBtn(r, 'Save to Profile', 'Saving', 'data-a="assist-save"') : `<button class="ads-btn ads-btn--block" type="button" data-a="assist-confirm">Confirm</button>`) : `<button class="ads-btn ads-btn--block" type="button" data-a="wiz-next">Continue</button>`}</div>`;
  return { title, kind: 'push', body, foot, wide: IPAD() };
}
function stepValue(s, m) {
  if (s === 'cat') return m.cat ? CATS[m.cat] : 'Nothing selected';
  if (s === 'dis') return m.dis.map(k => DISABILITIES.find(x => x[0] === k)[1]).join(', ');
  if (s === 'wc') return m.wc ? 'Yes, I’ll bring a wheelchair' : 'No';
  if (s === 'needs') return m.needs.length ? m.needs.map(k => NEEDS.find(x => x[0] === k)[1]).join(', ') : 'None';
  return '';
}
A['wiz-go'] = (t, ri) => { routeAt(ri).u.step = t.dataset.step; pendingFocus = 'title'; render(); };
A['wiz-back'] = (t, ri) => { const r = routeAt(ri), s = wizSteps(r.u.d); r.u.err = null; r.u.step = s[Math.max(0, s.indexOf(r.u.step) - 1)]; pendingFocus = '.ads-steps__count'; render(); };
A['wiz-next'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, all = assistErrors(x, r.u.mode), map = { cat: 'cat', dis: 'dis', wc: 'wc' };
  const k = map[r.u.step];
  if (r.u.mode === 'profile' && r.u.step === 'cat' && !x.cat) { r.u.step = 'review'; render(); return; }
  if (k && all[k]) { r.u.err = { [k]: all[k] }; pendingFocus = `[data-f="${k}"]`; render(); return; }
  r.u.err = null; const s = wizSteps(x); r.u.step = s[s.indexOf(r.u.step) + 1]; pendingFocus = '.ads-steps__count'; render();
};
A['assist-clear-draft'] = (t, ri) => { const r = routeAt(ri); r.u.d = { cat: '', dis: [], wc: '', needs: [] }; r.u.dirty = true; render(); };

// ---- Booking assistance screen ----
SCR.assist = (r, ri) => {
  if (v2()) return wizard(r, ri, 'booking', 'Assistance · Traveler 1');
  return { title: 'Assistance · Traveler 1', kind: 'push', body: `${assistForm(r, ri, { mode: 'booking', idp: 'ba' })}`, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="assist-confirm">Confirm</button>`, banner: false };
};
A['assist-toggle'] = (t, ri) => {
  const b = D().booking; b.assistOn = t.checked;
  if (b.assistOn && !b.assistDone) { push('assist', {}, +ri); return; }
  pendingFocus = `#${t.id}`; render();
};
A['assist-edit'] = (t, ri) => push('assist', {}, +ri);
A['assist-confirm'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, e = assistErrors(x, 'booking');
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.cat ? 'cat' : e.dis ? 'dis' : 'wc'; pendingFocus = '[aria-invalid="true"], .ads-helper--error'; render(); return; }
  const b = D().booking; b.assist = fromDraft(x); b.assistDone = true; b.assistOn = b.assist.cat !== 'none' || true; b.assistFromProfile = false;
  r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-a="assist-edit"]'; render();
};

// =====================================================================
// Find Trains handoff (search results are out of scope)
// =====================================================================
SCR.handoff = () => {
  const b = D().booking;
  return { title: 'Search results', kind: 'push', banner: false, body: `<div class="handoff"><span class="handoff__tag">Prototype handoff</span><h3 class="ads-h4">Search results aren’t part of Sprint 4</h3><p class="ads-body-small">Fare Finder would pass this search to the results screen:</p>
    <dl class="handoff__list"><dt>Route</dt><dd>${stLabel(b.from)} → ${stLabel(b.to)}</dd><dt>Trip</dt><dd>${b.trip === 'rt' ? 'Round-trip' : 'One-way'}</dd><dt>Depart</dt><dd>${fmtWeekday(b.dep)}, ${fmtDate(b.dep)}</dd>${b.trip === 'rt' ? `<dt>Return</dt><dd>${fmtWeekday(b.ret)}, ${fmtDate(b.ret)}</dd>` : ''}${handoffExtra(b)}<dt>Assistance</dt><dd>${b.assistOn && b.assistDone ? esc(assistSummaryItems(b.assist).join(' · ')) : 'None requested'}</dd></dl>
    <button class="ads-btn ads-btn--secondary" type="button" data-a="back">Back to Fare Finder</button></div>` };
};

// =====================================================================
// Account sheet (IA: Profile + Guest Rewards card, Inbox, Travelers, Payment, Assistance, Quick settings)
// =====================================================================
SCR.account = (r, ri) => {
  const d = D();
  prov('Account › Quick settings › Clear recent stations: NMA-1004 says “Settings”, and the IA only has Quick settings here.');
  const recCount = d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).length;
  ref('1004');
  const clearRow = recCount ? grow({ a: 'clear-recents', label: 'Clear recent stations', value: `${recCount} recent station${recCount > 1 ? 's' : ''}`, cls: 'ads-group__row--action', chev: false })
    : `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Clear recent stations</span><span class="ads-group__value">No recent stations</span></span></div>`;
  const quick = group('Quick settings', [
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Trip updates</span><span class="ads-group__value">Delays and track changes</span></span><span class="ads-switch"><input type="checkbox" role="switch" checked><span class="ads-switch__track"></span></span></label>`,
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Sign in with Face ID</span></span><span class="ads-switch"><input type="checkbox" role="switch" ${d.signedIn ? 'checked' : 'disabled'}><span class="ads-switch__track"></span></span></label>`,
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Dark Mode</span></span><span class="ads-switch"><input type="checkbox" role="switch" data-a="dark" ${TB.theme === 'dark' ? 'checked' : ''}><span class="ads-switch__track"></span></span></label>`,
    clearRow], 'Recent stations are kept on this device for 10 days.');
  if (!d.signedIn) {
    return { title: 'Account', kind: 'root', body: `<div class="ads-summary"><p class="ads-summary__title">Sign in or join Guest Rewards</p><p class="ads-body-small">Sign in to see your Profile, saved discounts and assistance.</p><button class="ads-btn ads-btn--block" type="button" data-a="sign-in">Sign in</button></div>${quick}`, banner: false };
  }
  const assistVal = d.assist.cat ? (d.assist.cat === 'disability' ? 'I have a disability' : 'Station assistance') : 'Not set';
  const body = `<button class="loyalty" type="button" data-a="push" data-s="profile" aria-label="Profile: Alex Rivera, Guest Rewards 7012 3456 78, Select Plus, 12,450 points">
      <span class="loyalty__top"><span><b>Alex Rivera</b><span class="loyalty__num">Guest Rewards · 7012 3456 78</span></span><span class="ads-badge">Select Plus</span></span><span><strong>12,450</strong> points · ≈ $360</span><span class="loyalty__link">Profile ${ic('chevron-right', 'ads-icon--sm')}</span></button>
    ${group('', [grow({ a: 'push', data: 'data-s="profile"', icon: 'person-circle', label: 'Profile', value: 'Personal details, passenger discounts' }), grow({ a: 'push', data: 'data-s="assist-profile"', icon: 'assistance', label: 'Assistance', value: assistVal })])}
    ${group('', [grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Points activity"}\'', icon: 'AGR_points-evergreen', label: 'Points activity' }), grow({ a: 'open-inbox-from-account', icon: 'email', label: 'Inbox', value: '2 new' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Travelers"}\'', icon: 'people', label: 'Travelers', value: '3 saved' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Payment"}\'', icon: 'payment-cash', label: 'Payment', value: 'Visa •••• 4821' })])}
    ${quick}`;
  return { title: 'Account', kind: 'root', body, banner: false };
};
A.dark = t => { TB.theme = t.checked ? 'dark' : 'light'; pendingFocus = '[data-a="dark"]'; render(); };
A['sign-in'] = () => startVerify('sign-in');
A['open-inbox-from-account'] = (t, ri) => push('inbox', {}, +ri);
SCR.stub = r => ({ title: r.p.t, kind: 'push', banner: false, body: `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">${esc(r.p.t)} isn’t part of Sprint 4</p><p class="ads-body-small">This row keeps its place from the App Shell IA.</p></div>` });
SCR.inbox = () => ({ title: 'Notification Inbox', kind: 'root', banner: false, body: group('', [grow({ label: 'Fall fares are here', value: 'Save up to 25% on Northeast Regional trips booked by Oct 31.' }), grow({ label: 'You’re close to Select Executive', value: 'Earn 2,550 more tier qualifying points this year.' })], 'The inbox isn’t part of Sprint 4.') });

// =====================================================================
// B. Profile
// =====================================================================
const PFIELDS = { mi: 'Middle initial', phone: 'Phone', address: 'Billing address', dob: 'Date of birth' };
function profileRows(r, ri, opts = {}) {
  const d = D(), p = d.profile, cur = opts.current;
  const helper = t => v2() ? `<span class="rowhint">${t}</span>` : '';
  const miRow = p.mi ? `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Middle initial</span><span class="ads-group__value">${esc(p.mi)}</span></span>${lockChip}</div>`
    : grow({ a: 'edit', data: 'data-field="mi"', label: 'Middle initial', value: v2() ? 'Not added · can be added once' : 'Add', empty: !v2(), current: cur === 'mi', k: 'row-mi' });
  return `${group('Name', [
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Name</span><span class="ads-group__value">${esc(p.first)} ${p.mi ? esc(p.mi) + '. ' : ''}${esc(p.last)}</span></span>${lockChip}</div>`,
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Guest Rewards number</span><span class="ads-group__value">7012 3456 78</span></span>${lockChip}</div>`, miRow],
    'Need to change your name? Call us at <a class="ads-link ads-link--sm" href="tel:18003075000">1-800-307-5000</a>')}
    ${group('Contact', [grow({ a: 'change-email', label: 'Email', value: esc(p.email), meta: 'Change', k: 'row-email' }), grow({ a: 'edit', data: 'data-field="phone"', label: 'Phone', value: esc(fmtPhone(p.phone)), current: cur === 'phone', k: 'row-phone' }), grow({ a: 'edit', data: 'data-field="address"', label: 'Billing address', value: fmtAddress(p.address), current: cur === 'address', k: 'row-address' }), grow({ a: 'edit', data: 'data-field="dob"', label: 'Date of birth', value: p.dob || (v2() ? 'Optional · not added' : 'Add'), empty: !p.dob, current: cur === 'dob', k: 'row-dob' })])}
    ${group('Discounts', [grow({ a: 'push', data: 'data-s="discounts"', label: 'Passenger discounts', value: d.discount.type === 'none' ? 'No discount preference' : DISCOUNTS[d.discount.type].label, k: 'row-disc' })])}`;
}
SCR.profile = (r, ri) => {
  ref('19', '22', '23', '919', '21');
  prov('Account › Profile holds personal details and Passenger discounts. The IA lists Profile but not discounts (NMA-43 says My Profile › Discounts).');
  if (v3()) return profileV3(r, ri);
  return { title: 'Profile', kind: 'push', body: profileRows(r, ri, { current: IPAD() && sheet().stack[+ri + 1] && sheet().stack[+ri + 1].s === 'edit' ? sheet().stack[+ri + 1].p.field : null }), offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
};
A.edit = (t, ri) => {
  const f = t.dataset.field;
  if (v3()) { const r = routeAt(ri); if (r.u.inline && r.u.inline !== f && r.u.edit && r.u.edit.u.dirty) return confirmDiscard(() => { r.u.inline = f; r.u.edit = null; pendingFocus = '.edpane input, .edpane select'; render(); }); r.u.inline = r.u.inline === f ? null : f; r.u.edit = null; pendingFocus = r.u.inline ? '.edpane input, .edpane select, .edpane button' : `[data-k="row-${f}"]`; render(); return; }
  push('edit', { field: f }, +ri);
};
A['change-email'] = () => startVerify('change-email');

// V3 overview: cards with in-place editing (iPhone) or a persistent editor pane (iPad)
function profileV3(r, ri) {
  const d = D(), p = d.profile, f = r.u.inline;
  const card = (key, title, value, locked) => {
    const editing = f === key;
    const ed = editing && !IPAD() ? `<div class="edpane">${editorInline(r, ri, key)}</div>` : '';
    return `<div class="ads-summary${editing ? ' ads-summary--editing' : ''}" id="card-${key}"><div class="ads-summary__head"><div><p class="ads-summary__title">${title}</p>${!editing || IPAD() ? `<p class="ads-body-small ads-text-secondary">${value}</p>` : ''}</div>${locked ? lockChip : `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="edit" data-field="${key}" data-k="row-${key}" aria-expanded="${editing}">${editing ? 'Close' : (key === 'mi' || key === 'dob') && !p[key] ? 'Add' : 'Edit'}</button>`}</div>${ed}</div>`;
  };
  const main = `<div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">${esc(p.first)} ${p.mi ? esc(p.mi) + '. ' : ''}${esc(p.last)}</p><p class="ads-body-small ads-text-secondary">Guest Rewards 7012 3456 78</p></div>${lockChip}</div><p class="ads-body-small">Need to change your name? Call us at <a class="ads-link ads-link--sm" href="tel:18003075000">1-800-307-5000</a></p></div>
    ${card('mi', 'Middle initial', p.mi ? esc(p.mi) : 'Not added. You can add it once.', !!p.mi)}
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Email</p><p class="ads-body-small ads-text-secondary">${esc(p.email)}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="change-email">Change</button></div></div>
    ${card('phone', 'Phone', esc(fmtPhone(p.phone)))}${card('address', 'Billing address', fmtAddress(p.address))}${card('dob', 'Date of birth', p.dob || 'Optional. Not added.')}
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Passenger discounts</p><p class="ads-body-small ads-text-secondary">${d.discount.type === 'none' ? 'No discount preference' : DISCOUNTS[d.discount.type].label}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="push" data-s="discounts">Edit</button></div></div>`;
  if (!IPAD()) return { title: 'Profile', kind: 'push', body: main, offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
  const side = f ? `<div class="edpane"><h3 class="ads-h4">${PFIELDS[f]}</h3>${editorInline(r, ri, f)}</div>` : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">Choose Edit on any card</p><p class="ads-body-small">The editor opens here, next to your details.</p></div>`;
  return { title: 'Profile', kind: 'push', wide: true, body: `<div class="split2"><div class="split2__main">${main}</div><div class="split2__side">${side}</div></div>`, offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
}
// V3 keeps an editor "route" object inside the profile route so drafts behave the same everywhere
function editorInline(r, ri, field) {
  if (!r.u.edit || r.u.edit.p.field !== field) r.u.edit = R('edit', { field });
  const er = r.u.edit; const o = EDITORS[field](er, ri, true);
  return `<div data-ri-edit>${o.body}<div class="inlinepanel__actions">${er.u.busy ? `<button class="ads-btn" type="button" aria-busy="true" disabled>${ic('spinner-static')}Saving</button><button class="ads-btn ads-btn--tertiary" type="button" data-a="cancel-busy-inline">Cancel</button>` : `<button class="ads-btn ads-btn--tertiary" type="button" data-a="edit-inline-cancel">Cancel</button><button class="ads-btn" type="button" data-a="edit-save" ${o.saveDisabled ? 'disabled' : ''}>${o.saveLabel || 'Save'}</button>`}</div>${o.saveDisabled && o.noSaveWhy ? `<p class="ads-helper">${o.noSaveWhy}</p>` : ''}</div>`;
}

// Focused editor (V1, V2)
SCR.edit = (r, ri) => {
  const o = EDITORS[r.p.field](r, ri, false);
  return { title: PFIELDS[r.p.field], kind: 'editor', save: { a: 'edit-save', label: o.saveLabel, disabled: o.saveDisabled, busy: !!r.u.busy }, body: o.body + (o.saveDisabled && o.noSaveWhy ? `<p class="ads-helper" id="nosave-${ri}">${o.noSaveWhy}</p>` : ''), offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
};
// Which route an editor action targets: a pushed editor, or V3's inline editor inside Profile
function edRoute(ri) { const r = routeAt(ri); return r && r.s === 'profile' ? r.u.edit : r; }
A['edit-inline-cancel'] = (t, ri) => { const r = routeAt(ri), f = r.u.inline; r.u.inline = null; r.u.edit = null; pendingFocus = `[data-k="row-${f}"]`; render(); };
A['cancel-busy-inline'] = (t, ri) => { const er = edRoute(ri); er.u.busy = null; er.u.alert = { kind: 'custom', tone: 'info', title: 'Cancelled', text: 'Nothing was saved. Your entries are kept.' }; render(); };
A['edit-save'] = (t, ri) => { const er = edRoute(ri); SAVE[er.p.field](er, ri); };
function afterSave(ri, msg, field) {
  const r = routeAt(ri);
  if (r.s === 'profile') { r.u.inline = null; r.u.edit = null; pendingFocus = `[data-k="row-${field}"]`; }
  else { popTo(+ri - 1); pendingFocus = `[data-k="row-${field}"]`; }
  toast(msg);
}

// ---------- Editors: each returns { body, saveDisabled, noSaveWhy, saveLabel } ----------
const EDITORS = {}, SAVE = {};
const intro = t => v2() ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${t}</span></p>` : '';
// Middle initial (NMA-19): one letter, added once, then locked
EDITORS.mi = (r, ri, inline) => {
  const p = D().profile; r.u.d = r.u.d || { mi: '' }; const e = r.u.err || {};
  ref('19');
  if (p.mi) return { body: `<div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Middle initial: ${esc(p.mi)}</p><p class="ads-body-small ads-text-secondary">It was added once and is now locked. Call 1-800-307-5000 to change your name.</p></div>${lockChip}</div></div>`, saveDisabled: true, noSaveWhy: 'Your middle initial can’t be changed in the app.' };
  const preview = v2() && r.u.d.mi ? `<p class="ads-body-small">Your name will show as <b>${esc(p.first)} ${esc(r.u.d.mi)}. ${esc(p.last)}</b></p>` : '';
  const body = `${intro('You can add your middle initial once. After you save it, it can’t be changed in the app.')}${netAlert(r)}${fieldHtml({ id: 'ed-mi', f: 'mi', label: 'Middle initial', value: r.u.d.mi, max: 1, alpha: true, opt: true, autocomplete: 'additional-name', help: v2() ? 'One letter, A to Z.' : 'One letter. You can add this once; it can’t be changed later.', err: e.mi, live: v2(), cls: 'field--narrow' })}${preview}`;
  return { body, saveDisabled: !r.u.d.mi, noSaveWhy: 'Enter a letter to save.', saveLabel: 'Save' };
};
SAVE.mi = (r, ri) => {
  const x = r.u.d.mi || '';
  if (!/^[a-zA-Z]{1}$/.test(x)) { r.u.err = { mi: 'Enter one letter, A to Z.' }; pendingFocus = '#ed-mi'; render(); return; }
  const go = () => runSave(r, () => { D().profile.mi = x.toUpperCase(); }, () => afterSave(ri, 'Profile has been updated', 'mi'));
  if (v2()) return go(); // V2 explained the one-time rule up front, with a name preview, so it doesn't ask again
  dialog({ title: `Save “${x.toUpperCase()}” as your middle initial?`, body: 'You can only add your middle initial once. After saving, you won’t be able to change it in the app.', actions: [['Cancel', 'secondary', null], ['Save', 'primary', go]], returnFocus: '[data-a="edit-save"]' });
};
// Phone (NMA-22)
EDITORS.phone = (r, ri, inline) => {
  const p = D().profile.phone; if (!r.u.d) r.u.d = clone(p); const x = r.u.d, e = r.u.err || {};
  ref('22');
  const changed = JSON.stringify(x) !== JSON.stringify(p);
  const regionQ = `<fieldset class="ads-fieldset ads-fieldset--inline"><legend class="ads-field-label">${v2() ? 'Where is this number registered?' : 'Number type'}</legend><div class="ads-fieldset__options">${choice('radio', 'ph-region', 'region', 'us', x.region === 'us', 'US/Canada')}${choice('radio', 'ph-region', 'region', 'intl', x.region === 'intl', 'International')}</div></fieldset>`;
  let fields;
  if (x.region === 'us') {
    const more = r.u.more || x.home || x.business;
    fields = `${fieldHtml({ id: 'ph-mobile', f: 'mobile', label: 'Mobile', type: 'tel', value: x.mobile, digits: 10, req: true, autocomplete: 'tel-national', help: '10 digits, numbers only.', err: e.mobile })}
      ${more ? `${fieldHtml({ id: 'ph-home', f: 'home', label: 'Home', type: 'tel', value: x.home, digits: 10, opt: true, help: '10 digits.', err: e.home })}<div class="tworow">${fieldHtml({ id: 'ph-bus', f: 'business', label: 'Business', type: 'tel', value: x.business, digits: 10, opt: true, help: '10 digits.', err: e.business })}${fieldHtml({ id: 'ph-ext', f: 'ext', label: 'Extension', type: 'tel', value: x.ext, digits: 3, opt: true, help: 'Up to 3 digits.', err: e.ext, cls: 'field--narrow' })}</div>`
        : `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="ph-more">${ic('plus', 'ads-icon--sm')}Add home or business number</button>`}`;
  } else {
    fields = `${fieldHtml({ id: 'ph-cc', f: 'cc', label: 'Country code', select: DIAL.map(([k, n, c, fl]) => [k, `${fl} ${n} (${c})`]), value: x.cc, req: true })}${fieldHtml({ id: 'ph-intl', f: 'intl', label: 'Phone number', type: 'tel', value: x.intl, digits: 15, req: true, prefix: (DIAL.find(z => z[0] === x.cc) || DIAL[0])[2], autocomplete: 'tel-national', help: '5 to 15 digits, numbers only.', err: e.intl })}`;
  }
  const body = `${intro('US/Canada numbers need a mobile number. International numbers need a country code. You can use a number that’s also on another account.')}${netAlert(r)}${regionQ}${fields}<p class="ss-note">${q(6)} Switching type keeps the number you entered for each type.</p>`;
  return { body, saveDisabled: !changed, noSaveWhy: 'Make a change to save.' };
};
A['ph-more'] = (t, ri) => { const r = edRoute(ri); r.u.more = true; pendingFocus = '#ph-home'; render(); };
SAVE.phone = (r, ri) => {
  const x = r.u.d, e = {};
  if (x.region === 'us') { if (!/^\d{10}$/.test(x.mobile)) e.mobile = 'Enter a valid phone number'; if (x.home && !/^\d{10}$/.test(x.home)) e.home = 'Enter a valid phone number'; if (x.business && !/^\d{10}$/.test(x.business)) e.business = 'Enter a valid phone number'; if (x.ext && !/^\d{1,3}$/.test(x.ext)) e.ext = 'Enter up to 3 digits'; }
  else if (!/^\d{5,15}$/.test(x.intl)) e.intl = 'Enter a valid phone number';
  r.u.err = e; if (Object.keys(e).length) { pendingFocus = '[aria-invalid="true"]'; render(); return; }
  runSave(r, () => { D().profile.phone = clone(x); }, () => afterSave(ri, 'Profile has been updated', 'phone'));
};
// Billing address (NMA-23)
const ZIP = { US: /^\d{5}(?:[-\s]?\d{4})?$/, CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/ };
HOOKS.country = (r, t) => {
  const x = r.u.d, prev = r.u.prevCountry || D().profile.address.country;
  if (x.country === prev) return;
  r.u.undo = { country: prev, street: x.street, apt: x.apt, city: x.city, state: x.state, zip: x.zip };
  Object.assign(x, { street: '', apt: '', city: '', state: '', zip: '' }); r.u.prevCountry = x.country; r.u.err = {};
};
EDITORS.address = (r, ri, inline) => {
  const a = D().profile.address; if (!r.u.d) { r.u.d = clone(a); r.u.prevCountry = a.country; } const x = r.u.d, e = r.u.err || {};
  ref('23');
  const cty = x.country, usca = cty === 'US' || cty === 'CA';
  const undo = r.u.undo ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">The address fields were cleared because the country changed. ${q(5)}</p><div><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="addr-undo">Undo</button></div></div></div>` : '';
  const stateSel = usca ? fieldHtml({ id: 'ad-state', f: 'state', label: cty === 'US' ? 'State' : 'Province', select: [['', cty === 'US' ? 'Choose a state' : 'Choose a province'], ...(cty === 'US' ? US_STATES : CA_PROVINCES).map(s => [s, s])], value: x.state, req: true, err: e.state }) : '';
  const zipLabel = cty === 'US' ? 'ZIP code' : 'Postal code';
  const body = `${intro('Choose the country first. It decides which fields you need: US and Canadian addresses need a state or province.')}${netAlert(r)}
    ${fieldHtml({ id: 'ad-country', f: 'country', label: 'Country', select: COUNTRIES, value: cty, req: true, hook: 'country', help: 'Changing the country clears the fields below.' })}${undo}
    ${fieldHtml({ id: 'ad-street', f: 'street', label: 'Street address', value: x.street, req: true, max: 32, autocomplete: 'address-line1', help: '2 to 32 characters.', err: e.street })}
    ${fieldHtml({ id: 'ad-apt', f: 'apt', label: 'Apt, suite or unit', value: x.apt, opt: true, autocomplete: 'address-line2' })}
    ${fieldHtml({ id: 'ad-city', f: 'city', label: 'City', value: x.city, req: true, autocomplete: 'address-level2', err: e.city })}
    <div class="tworow">${stateSel}${fieldHtml({ id: 'ad-zip', f: 'zip', label: zipLabel, value: x.zip, req: true, autocomplete: 'postal-code', inputmode: cty === 'US' ? 'numeric' : 'text', help: cty === 'US' ? '5 digits, or ZIP+4.' : cty === 'CA' ? 'For example, K1A 0B1.' : '', err: e.zip, cls: 'field--narrow' })}</div>`;
  return { body, saveDisabled: JSON.stringify(x) === JSON.stringify(a), noSaveWhy: 'Make a change to save.' };
};
A['addr-undo'] = (t, ri) => { const r = edRoute(ri); Object.assign(r.u.d, r.u.undo); r.u.prevCountry = r.u.undo.country; r.u.undo = null; pendingFocus = '#ad-country'; render(); };
SAVE.address = (r, ri) => {
  const x = r.u.d, e = {}, usca = x.country === 'US' || x.country === 'CA';
  if (x.street.trim().length < 2 || x.street.length > 32) e.street = 'Enter a street address of 2 to 32 characters.';
  if (!x.city.trim()) e.city = 'Enter a city.'; else if (!/^[A-Za-zÀ-ÿ .'-]+$/.test(x.city)) e.city = 'Use letters only.';
  if (usca && !x.state) e.state = x.country === 'US' ? 'Choose a state.' : 'Choose a province.';
  if (!x.zip.trim()) e.zip = x.country === 'US' ? 'Enter a ZIP code.' : 'Enter a postal code.'; else if (ZIP[x.country] && !ZIP[x.country].test(x.zip.trim())) e.zip = x.country === 'US' ? 'Enter a valid ZIP code.' : 'Enter a valid postal code.';
  r.u.err = e; if (Object.keys(e).length) { pendingFocus = '[aria-invalid="true"]'; render(); return; }
  runSave(r, () => { D().profile.address = clone(x); }, () => afterSave(ri, 'Profile has been updated', 'address'));
};
// Date of birth (NMA-919)
function validDob(s) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return false; const d = new Date(+m[3], +m[1] - 1, +m[2]); return d.getMonth() === +m[1] - 1 && d.getDate() === +m[2] && d <= TODAY && +m[3] >= 1900; }
EDITORS.dob = (r, ri, inline) => {
  const p = D().profile; if (!r.u.d) r.u.d = { dob: p.dob }; const e = r.u.err || {};
  ref('919');
  const body = `${intro('Optional. Use month, day and year, for example 04/15/1988.')}${netAlert(r)}${fieldHtml({ id: 'ed-dob', f: 'dob', label: 'Date of birth', value: r.u.d.dob, opt: true, placeholder: 'MM/DD/YYYY', inputmode: 'numeric', autocomplete: 'bday', max: 10, help: 'MM/DD/YYYY', err: e.dob, cls: 'field--mid' })}${p.dob ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="dob-remove">Remove date of birth</button>` : ''}<p class="ss-note">${q(6)} Earliest and latest allowed dates aren’t defined. This prototype rejects future dates.</p>`;
  return { body, saveDisabled: (r.u.d.dob || '') === (p.dob || ''), noSaveWhy: 'Make a change to save.' };
};
A['dob-remove'] = (t, ri) => { const r = edRoute(ri); r.u.d.dob = ''; r.u.dirty = true; render(); };
HOOKS.dobmask = () => {};
SAVE.dob = (r, ri) => {
  const x = (r.u.d.dob || '').trim();
  if (x && !validDob(x)) { r.u.err = { dob: 'Please enter a valid date' }; pendingFocus = '#ed-dob'; render(); return; }
  r.u.err = {};
  runSave(r, () => { D().profile.dob = x; }, () => afterSave(ri, 'Profile has been updated', 'dob'));
};

// =====================================================================
// C. Passenger discounts (NMA-43) and rules (NMA-566)
// =====================================================================
SCR.discounts = (r, ri) => {
  const d = D(); if (!r.u.d) r.u.d = { type: d.discount.type, rpa: d.discount.rpa }; const x = r.u.d, e = r.u.err || {};
  ref('43', '566', '612');
  const hasDis = d.assist.cat === 'disability';
  const opt = k => {
    const extra = k === 'pwd' && !hasDis && x.type !== 'pwd' ? '' : '';
    return choice('radio', 'disc', 'type', k, x.type === k, DISCOUNTS[k].label, k === 'pwd' && hasDis ? 'Saved because your Assistance says you have a disability.' : DISCOUNTS[k].info, extra);
  };
  let cond = '';
  if (x.type === 'rpa') cond = fieldHtml({ id: 'rpa-id', f: 'rpa', label: 'Membership ID', type: 'tel', value: x.rpa, digits: 10, req: true, help: '6 to 10 digits, no spaces.', err: e.rpa });
  if (x.type === 'pwd' && !hasDis) cond = `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">Complete Assistance first</p><p class="ads-alert__description ads-body-small">This discount is saved when your Assistance says “I have a disability”. ${v2() ? 'We’ll bring you back here when you’re done.' : ''}</p><div><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="go-assist">Go to Assistance</button></div></div></div>`;
  const body = `${intro('Choose one discount. It will be pre-selected when you book. Senior and Youth discounts are chosen when you book.')}${netAlert(r)}
    <fieldset class="ads-fieldset"><legend class="ads-field-label">Discount preference</legend><div class="ads-fieldset__options">${['none', 'military', 'rpa', 'pwd'].map(k => opt(k) + (x.type === k && cond ? `<div class="condfield">${cond}</div>` : '')).join('')}</div></fieldset>
    ${q(9)}<button class="ads-link ads-link--sm linkbtn" type="button" data-a="push" data-s="rules">Passenger types and discount rules</button>`;
  const changed = x.type !== d.discount.type || (x.type === 'rpa' && x.rpa !== d.discount.rpa);
  if (v3()) return { title: 'Passenger discounts', kind: 'push', body, foot: busyBtn(r, 'Save', 'Saving', `data-a="disc-save" ${changed ? '' : 'disabled'}`), offlineText: 'You’re seeing your saved preference. Saving needs a connection.' };
  return { title: 'Passenger discounts', kind: 'editor', save: { a: 'disc-save', disabled: !changed, busy: !!r.u.busy }, body: body + (!changed ? `<p class="ads-helper" id="nosave-${ri}">Make a change to save.</p>` : ''), offlineText: 'You’re seeing your saved preference. Saving needs a connection.' };
};
A['go-assist'] = (t, ri) => { const sh = sheet(); const dr = sh.stack[+ri]; dr.u.dirty = false; sh.stack = [sh.stack[0], R('assist-profile', { returnTo: 'discounts' })]; pendingFocus = 'title'; render(); };
A['disc-save'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, d = D();
  if (x.type === 'rpa' && !/^\d{6,10}$/.test(x.rpa || '')) { r.u.err = { rpa: 'Check your membership number. Maximum 10 digits without spaces' }; pendingFocus = '#rpa-id'; render(); return; }
  if (x.type === 'pwd' && d.assist.cat !== 'disability') { r.u.alert = { kind: 'custom', tone: 'error', title: 'Passenger with Disability can’t be saved yet', text: 'Save Assistance with “I have a disability” first.' }; pendingFocus = '[data-a="go-assist"]'; render(); return; }
  r.u.err = {};
  runSave(r, () => { d.discount = { type: x.type, rpa: x.type === 'rpa' ? x.rpa : '' }; d.booking.disc = ['military', 'rpa'].includes(x.type) ? x.type : 'none'; }, () => { r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-k="row-disc"]'; toast('Discount preference saved'); });
};
SCR.rules = () => {
  ref('566');
  const item = n => `<details class="ads-accordion ads-accordion--sm"><summary>${n}${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="rules"><dt>Age criteria</dt><dd>From AEM. Not finalized in this prototype.</dd><dt>Applicable discount</dt><dd>From AEM.</dd><dt>Restrictions</dt><dd>From AEM.</dd></dl></div></details>`;
  return { title: 'Discount rules', kind: 'push', offlineText: 'Rules saved on this device are shown. Links need a connection.', body: `<p class="ads-body-small ads-text-secondary">Content comes from AEM unchanged (NMA-566 BR2). It’s grouped by type so passenger-type benefits and traveler discounts aren’t mixed.</p>${RULE_GROUPS.map(([g, items]) => `<div class="ads-group"><h3 class="ads-group__title">${g}</h3><div class="ads-group__body rulesbody">${items.map(item).join('')}</div></div>`).join('')}` };
};

// =====================================================================
// D. Profile assistance (NMA-26, 27, 28)
// =====================================================================
function pwdPreview(m) {
  const d = D(), cur = d.discount.type;
  if (m.cat === 'disability' && cur !== 'pwd') return `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">Saving also sets your discount to <b>Passenger with Disability</b>${cur !== 'none' ? `, replacing ${DISCOUNTS[cur].label}` : ''}. ${q(9)}</p></div></div>`;
  if (m.cat !== 'disability' && cur === 'pwd') return `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">Saving removes your <b>Passenger with Disability</b> discount. ${q(9)}</p></div></div>`;
  return '';
}
SCR['assist-profile'] = (r, ri) => {
  const d = D(), saved = d.assist;
  ref('26', '27', '28');
  prov('Account › Assistance is where the IA puts assistance; this is its first full design.');
  const editing = r.u.editing || !saved.cat;
  const doneMsg = r.u.savedMsg ? alertBox('success', 'Assistance saved', r.u.savedMsg) : '';
  if (v2() && editing) return wizard(r, ri, 'profile', 'Assistance');
  const summary = `${doneMsg}${assistSummaryCard(saved, { title: 'Your assistance', edit: 'assist-p-edit' })}${saved.cat ? `<p class="ads-body-small ads-text-secondary">Used for Traveler 1 when you book. You can change it there for one trip.</p>` : ''}${r.u.returnTo || r.p.returnTo ? `<button class="ads-btn ads-btn--secondary" type="button" data-a="assist-return">Back to Passenger discounts</button>` : ''}`;
  if (!editing) return { title: 'Assistance', kind: 'push', body: summary, banner: false };
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(saved); r.u.mode = 'profile'; }
  const form = `${netAlert(r)}${assistForm(r, ri, { mode: 'profile', idp: 'pa' })}${r.u.d.cat ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-clear-draft">Clear selection</button>` : '<p class="ads-body-small ads-text-secondary">With nothing selected, no assistance is saved.</p>'}${pwdPreview(fromDraft(r.u.d))}`;
  if (v3() && IPAD()) return { title: 'Assistance', kind: 'push', wide: true, body: `<div class="split2"><div class="split2__main">${assistSummaryCard(saved, { title: 'Saved now' })}</div><div class="split2__side"><div class="edpane">${form}</div></div></div>`, foot: `<div class="wizfoot"><button class="ads-btn ads-btn--secondary" type="button" data-a="assist-p-cancel">Cancel</button>${busyBtn(r, 'Save', 'Saving', 'data-a="assist-save"')}</div>` };
  return { title: 'Assistance', kind: saved.cat ? 'editor' : 'push', cancelA: 'assist-p-cancel', save: saved.cat ? { a: 'assist-save', busy: !!r.u.busy } : null, body: form, foot: busyBtn(r, 'Save', 'Saving', 'data-a="assist-save"') };
};
A['assist-p-edit'] = (t, ri) => { const r = routeAt(ri); r.u.editing = true; r.u.d = undefined; r.u.step = null; r.u.savedMsg = null; pendingFocus = 'title'; render(); };
A['assist-p-cancel'] = (t, ri) => { const r = routeAt(ri); if (!D().assist.cat) return A.back(t, ri); r.u.editing = false; r.u.d = undefined; r.u.dirty = false; r.u.err = null; pendingFocus = 'title'; render(); };
A['assist-return'] = (t, ri) => { const sh = sheet(); sh.stack = [sh.stack[0], R('profile'), R('discounts')]; pendingFocus = 'title'; render(); };
A['assist-save'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, e = assistErrors(x, 'profile');
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.dis ? 'dis' : 'wc'; pendingFocus = '[aria-invalid="true"], .ads-helper--error'; render(); return; }
  const m = fromDraft(x), d = D();
  runSave(r, () => {
    const before = d.discount.type; let msg = m.cat ? 'Your assistance is saved to your Profile.' : 'Assistance cleared. Nothing is saved.';
    if (m.cat === 'disability' && before !== 'pwd') { d.discount = { type: 'pwd', rpa: '' }; msg += ` Your discount is now Passenger with Disability${before !== 'none' ? `, which replaced ${DISCOUNTS[before].label}` : ''}.`; }
    if (m.cat !== 'disability' && before === 'pwd') { d.discount = { type: 'none', rpa: '' }; msg += ' The Passenger with Disability discount was removed.'; }
    d.assist = m; if (!d.booking.assistDone || d.booking.assistFromProfile) { d.booking.assist = clone(m); d.booking.assistDone = !!m.cat; d.booking.assistOn = !!m.cat; d.booking.assistFromProfile = !!m.cat; }
    return msg;
  }, msg => { r.u.editing = false; r.u.d = undefined; r.u.dirty = false; r.u.step = null; r.u.savedMsg = msg; r.u.returnTo = r.p.returnTo; pendingFocus = 'title'; render(); });
};

// =====================================================================
// E. Verification (one reusable view, NMA-980 / NMA-21)
// =====================================================================
SCR.verify = (r) => {
  const c = nav().cover, d = D(), x = c.u.d, e = c.u.err || {}, step = c.steps[c.i];
  ref('980'); if (c.trigger === 'change-email') ref('21');
  const demo = `<p class="pdemo">${ic('info-circle', 'ads-icon--sm')}<span>Demonstration. ${c.trigger === 'change-email' ? 'Change-email verification' : c.trigger === 'sign-in' ? 'Sign-in on a device that isn’t remembered' : 'Verifying an unverified account before an account change'}. The channel and reauthentication policy aren’t approved. ${q(8)}</span></p>`;
  tip('Codes: 123456 works, 000000 has expired, anything else is wrong.');
  const total = c.steps.length, prog = total > 1 ? `<span class="ads-steps__count">Step ${c.i + 1} of ${total}</span>` : '';
  let title = 'Verify', body = '', foot = '';
  if (step === 'reauth') {
    title = 'Verify it’s you';
    tip('Session token is “expired” in Scenario, so Verify it’s you comes first. Any password except “wrong” works.');
    body = `${prog}<p class="ads-body-small">For your security, sign in again to change your email.</p>${fieldHtml({ id: 'vf-email', f: 'email', label: 'Email or Guest Rewards number', value: x.email, autocomplete: 'username', req: true, err: e.email })}${fieldHtml({ id: 'vf-pw', f: 'password', label: 'Password', type: 'password', value: x.password, autocomplete: 'current-password', req: true, err: e.password })}<p class="ss-note">No Forgot password or Join options on this screen (NMA-21 exceptions). In production this may open as a web page.</p>`;
    foot = busyBtn(c, 'Continue', 'Checking', 'data-a="vf-reauth"');
  } else if (step === 'signin') {
    title = 'Sign in';
    body = `${prog}<p class="ads-body-small">Demo sign-in for Alex Rivera. The details are filled in.</p>${fieldHtml({ id: 'vf-email', f: 'email', label: 'Email or Guest Rewards number', value: x.email, autocomplete: 'username', req: true })}${fieldHtml({ id: 'vf-pw', f: 'password', label: 'Password', type: 'password', value: x.password || 'demo-pass', autocomplete: 'current-password', req: true })}<p class="ads-body-small ads-text-secondary">This device isn’t remembered, so we’ll ask for a code.</p>`;
    foot = busyBtn(c, 'Sign in', 'Signing in', 'data-a="vf-signin"');
  } else if (step === 'newemail') {
    title = 'Change email';
    body = `${prog}<p class="ads-body-small">Current email: <b>${esc(d.profile.email)}</b></p>${fieldHtml({ id: 'vf-new', f: 'newEmail', label: 'New email', type: 'email', value: x.newEmail, autocomplete: 'email', inputmode: 'email', req: true, help: 'We’ll send a code to this address. Your email doesn’t change until you enter it.', err: e.newEmail })}`;
    foot = busyBtn(c, 'Send code', 'Sending', 'data-a="vf-newemail"');
  } else if (step === 'channel') {
    title = 'Verify your account';
    const intl = d.profile.phone.region === 'intl';
    body = `${prog}<p class="ads-body-small">Choose where to get your verification code.</p><fieldset class="ads-fieldset"><legend class="ads-field-label">Send code by</legend><div class="ads-fieldset__options">${choice('radio', 'vf-ch', 'channel', 'email', x.channel === 'email', 'Email', maskEmail(d.profile.email))}${choice('radio', 'vf-ch', 'channel', 'text', x.channel === 'text', 'Text message', intl ? 'Not available for international numbers (open question in NMA-980).' : '•••-•••-' + d.profile.phone.mobile.slice(-4), intl ? 'disabled' : '')}</div></fieldset>`;
    foot = busyBtn(c, 'Send code', 'Sending', 'data-a="vf-send"');
  } else if (step === 'code') {
    title = 'Enter code';
    const to = c.trigger === 'change-email' ? x.newEmail : x.channel === 'text' ? '•••-•••-' + d.profile.phone.mobile.slice(-4) : maskEmail(d.profile.email);
    const st = c.status, code = x.code || '';
    const cells = Array.from({ length: 6 }, (_, i) => `<span class="ads-codeinput__cell${i === code.length ? ' is-next' : ''}" aria-hidden="true">${code[i] || ''}</span>`).join('');
    const err = st === 'invalid' ? 'Verification code does not match. Please enter valid verification code' : st === 'expired' ? 'This code has expired. Request a new code.' : '';
    if (st === 'success') {
      body = `${prog}<div class="vf-success" role="status">${ic('check-circle', 'ads-icon--lg')}<h3 class="ads-h4">Verified</h3><p class="ads-body-small">${c.trigger === 'change-email' ? 'Your new email is confirmed.' : c.trigger === 'sign-in' ? 'You’re signed in on this device.' : 'Your account is verified. We’ll finish saving your change.'}</p></div>`;
      foot = `<button class="ads-btn ads-btn--block" type="button" data-a="vf-finish">${c.trigger === 'unverified' ? 'Continue and save' : 'Continue'}</button>`;
    } else {
      body = `${prog}<p class="ads-body-small">We sent a 6-digit code to <b>${esc(to)}</b>.${c.sends > 1 ? ' <span class="ads-text-secondary">A new code was sent. Older codes no longer work.</span>' : ''}</p>
        <div class="ads-field"><label class="ads-field__label" for="vf-code">Verification code</label><div class="ads-codeinput${err ? ' ads-codeinput--error' : ''}" ${st === 'verifying' ? 'aria-busy="true"' : ''}>${cells}<input class="ads-codeinput__input" id="vf-code" data-f="code" data-digits="6" data-live data-nodirty inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="${esc(code)}" aria-describedby="vf-code-h" ${err ? 'aria-invalid="true"' : ''} ${st === 'verifying' ? 'readonly' : ''}></div><p class="ads-helper${err ? ' ads-helper--error' : ''}" id="vf-code-h" ${err ? 'role="alert"' : ''}>${err ? ic('alert-diamond') + '<span>' + err + '</span>' : 'Enter the 6 digits.'}</p></div>
        <div class="vf-links"><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" id="resendBtn" data-a="vf-resend" ${c.cooldown ? 'disabled' : ''}>${c.cooldown ? `Resend code in 0:${String(c.cooldown).padStart(2, '0')}` : 'Resend code'}</button>${c.steps.includes('channel') ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="vf-channel">Send the code another way</button>` : ''}</div>`;
      foot = st === 'verifying' ? `<button class="ads-btn ads-btn--block" type="button" aria-busy="true" disabled>${ic('spinner-static')}Verifying</button>` : `<button class="ads-btn ads-btn--block" type="button" data-a="vf-verify" ${code.length === 6 ? '' : 'disabled aria-describedby="vf-code-h"'}>Verify</button>`;
    }
  }
  return { title, kind: 'push', body: demo + (c.u.alert ? netAlert(c) : '') + body, foot, banner: false };
};
const coverNext = () => { const c = nav().cover; c.i++; c.status = 'idle'; c.u.err = {}; c.u.alert = null; pendingFocus = 'title'; render(); };
function sendCode() { const c = nav().cover; c.sends++; c.u.d.code = ''; c.status = 'idle'; startCooldown(); }
A['vf-reauth'] = () => { const c = nav().cover, x = c.u.d, e = {}; if (!x.email) e.email = 'Enter your email or Guest Rewards number.'; if (!x.password) e.password = 'Enter your password.'; else if (x.password === 'wrong') e.password = 'The email or password is incorrect.'; c.u.err = e; if (Object.keys(e).length) { pendingFocus = '[aria-invalid="true"]'; render(); return; } runNet(c, () => {}, () => coverNext(), { what: 'continue' }); };
A['vf-signin'] = () => { const c = nav().cover; runNet(c, () => {}, () => coverNext(), { what: 'sign in' }); };
A['vf-newemail'] = () => {
  const c = nav().cover, x = c.u.d, cur = D().profile.email;
  const v = (x.newEmail || '').trim();
  const err = !v ? 'Enter your new email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Enter a valid email address.' : v.toLowerCase() === cur.toLowerCase() ? 'This is already your email. Enter a different one.' : '';
  c.u.err = err ? { newEmail: err } : {}; if (err) { pendingFocus = '#vf-new'; render(); return; }
  x.newEmail = v; runNet(c, () => {}, () => { sendCode(); coverNext(); pendingFocus = '#vf-code'; render(); }, { what: 'send the code' });
};
A['vf-send'] = () => { const c = nav().cover; runNet(c, () => {}, () => { sendCode(); coverNext(); pendingFocus = '#vf-code'; render(); }, { what: 'send the code' }); };
A['vf-resend'] = () => { const c = nav().cover; runNet(c, () => {}, () => { sendCode(); pendingFocus = '#vf-code'; render(); }, { what: 'send a new code' }); };
A['vf-channel'] = () => { const c = nav().cover; c.i = c.steps.indexOf('channel'); c.status = 'idle'; pendingFocus = 'title'; render(); };
A['vf-verify'] = () => {
  const c = nav().cover, code = c.u.d.code;
  if (V().net === 'offline') { c.u.alert = { kind: 'offline', what: 'verify your code' }; render(); return; }
  c.status = 'verifying'; c.u.alert = null; render();
  setTimeout(() => { if (nav().cover !== c) return; c.status = code === '123456' ? 'success' : code === '000000' ? 'expired' : 'invalid'; if (c.status === 'success') clearInterval(cooldownT); pendingFocus = c.status === 'success' ? '.vf-success + *, [data-a="vf-finish"]' : '#vf-code'; render(); }, 900);
};
A['vf-finish'] = () => endVerify(true);
