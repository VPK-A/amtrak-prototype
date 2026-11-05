/* Sprint 4 prototype: screens. Shared pieces, arranged differently by each version. */
const v1 = () => TB.v === 1, v2 = () => TB.v === 2, v3 = () => false /* Concept 3 retired */, v4 = () => TB.v === 4;
// Archived Concept 4 uses its own booking sheets (Concept 3 was retired: one New booking design)
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
  book: () => bookLanding(),
  trips: () => `<div class="tabpage"><h1 class="ads-h3">Trips</h1><div class="ads-tabs ads-tabs--fill" role="tablist" aria-label="Trips"><button class="ads-tab" type="button" role="tab" aria-selected="false" tabindex="-1">Active</button><button class="ads-tab" type="button" role="tab" aria-selected="true" tabindex="0">Upcoming</button><button class="ads-tab" type="button" role="tab" aria-selected="false" tabindex="-1">Past</button></div><div class="ads-summary ads-summary--empty"><p class="ads-summary__title">No upcoming trips</p><p class="ads-body-small">Trips you book show up here.${snote('Trip management is outside Sprint 4.')}</p></div></div>`,
  'train-status': () => `<div class="tabpage"><h1 class="ads-h3">Train status</h1><div class="ads-summary"><div class="ads-field"><label class="ads-field__label" for="tsn">Train number</label><div class="ads-control"><input id="tsn" inputmode="numeric" placeholder="e.g. 171"></div></div><p class="ads-body-small ads-text-secondary">Train status isn’t part of Sprint 4. Its station search will reuse the Book station search.</p></div></div>`,
  support: () => `<div class="tabpage"><h1 class="ads-h3">Support</h1>${group('', [grow({ label: 'Issue with your trip?', value: 'Disruptions and cancellations' }), grow({ label: 'Know before booking', value: 'Accessible travel and station help' }), grow({ label: 'Contact Amtrak', value: 'Text · Call · Email · Live chat' })])}<p class="ads-body-small ads-text-secondary">Support content isn’t part of Sprint 4.</p></div>`
};

// ---------- Book landing ----------
// New booking entry, two explore cards, recent trips to rebook (only when there's history) and supporting
// links. The member header (avatar, greeting, tier and points, inbox) is the App Shell header above it.
const BK_ART = {
  trips: '<img src="__IMG_TRIPS__" alt="" decoding="async">',
  near: '<img src="__IMG_NEAR__" alt="" decoding="async">'
};
// Sprint 4 review focus: discovery cards, Book again and Explore are hidden (kept below for later restoration)
const BK_REVIEW_FOCUS = true;
function bookLanding() {
  const d = D(), hist = d.signedIn ? (d.history || []) : [];
  const card = (a, art, title, sub) => `<li class="bk-card"><div class="bk-card__media">${BK_ART[art]}</div><div class="bk-card__body"><h2 class="bk-card__title">${title}</h2><p class="bk-card__sub">${sub}</p><button class="ads-link ads-link--sm linkbtn bk-card__cta" type="button" data-a="${a}" aria-label="Explore ${title.toLowerCase()}">Explore ${ic('chevron-right', 'ads-icon--sm')}</button></div></li>`;
  const near = d.signedIn && d.fav.length ? ['Favorite stations', `Trains from ${ST[d.fav[0]].city} and nearby stations`] : ['Routes near me', 'Trains from stations near you'];
  const rebook = hist.length ? `<section class="bk-sec" aria-labelledby="bk-rebook-h"><h2 class="ads-sr-only" id="bk-rebook-h">Book again</h2><ul class="bk-list bk-rebook">${hist.map((h, i) => `<li class="bk-trip"><div class="bk-trip__text"><span class="bk-trip__route">${esc(ST[h.from].city)} to ${esc(ST[h.to].city)}</span><span class="bk-trip__meta">${h.from} → ${h.to} · ${fmtShort(h.date)} · ${esc(h.train)}</span></div><button class="ads-btn ads-btn--sm bk-trip__btn" type="button" data-a="rebook" data-i="${i}" aria-label="Rebook ${esc(ST[h.from].city)} to ${esc(ST[h.to].city)}">Rebook</button></li>`).join('')}</ul></section>` : '';
  const link = (a, t, sub, icon) => `<li><button class="bk-link" type="button" data-a="${a}">${ic(icon, 'bk-link__icon')}<span class="bk-link__text"><span class="bk-link__title">${t}</span><span class="bk-link__sub">${sub}</span></span>${ic('chevron-right', 'bk-link__chev')}</button></li>`;
  return `<div class="tabpage bk"><h1 class="ads-sr-only">Book</h1>
    <div class="bk-headx"><button class="bk-new" type="button" data-a="open-booking">${ic('search', 'bk-new__icon')}<span class="bk-new__text"><span class="bk-new__title">New booking</span><span class="bk-new__sub">Where to?</span></span></button></div>
    ${BK_REVIEW_FOCUS ? '' : `<ul class="bk-cards" aria-label="Explore trips">${card('bk-recommended', 'trips', 'Recommended trips', 'Scenic routes like the Pacific Surfliner and Adirondack')}${card('bk-near', 'near', near[0], near[1])}</ul>
    ${rebook}`}
    <section class="bk-sec" aria-labelledby="bk-more-h"><h2 class="ads-sr-only" id="bk-more-h">More ways to travel</h2><ul class="bk-list">${BK_REVIEW_FOCUS ? '' : link('bk-explore', 'Explore', 'Destinations, deals and travel ideas', 'map')}${link('bk-passes', 'Passes', 'Rail passes and multi-ride tickets', 'trip-multiple-train')}</ul></section></div>`;
}
// The search bar is pinned to the Book header; content scrolls behind it, and a divider appears under the
// header once content is beneath it
function syncBookHeader() {
  const m = document.querySelector('#device .app-main'), h = document.querySelector('#device .bk-headx');
  if (m && h) h.classList.toggle('is-scrolled', m.scrollTop > 0);
}
document.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('app-main')) syncBookHeader(); }, true);
const bkStub = (t, opener) => openSheet('explore', [R('stub', { t })], opener);
A['bk-recommended'] = () => bkStub('Recommended trips', '[data-a="bk-recommended"]');
A['bk-explore'] = () => bkStub('Explore', '[data-a="bk-explore"]');
A['bk-passes'] = () => bkStub('Passes', '[data-a="bk-passes"]');
// Favorite stations / routes near me: the existing station search, with favorites and recents first
A['bk-near'] = () => { openSheet('booking', ['ff'], '[data-a="bk-near"]'); push('stations', { field: 'from' }, 0); };
// Rebook: a new booking with the past trip's route; dates and travelers start fresh (no trip-history service yet)
A.rebook = t => {
  const i = +t.dataset.i, h = D().history[i], b = D().booking;
  Object.assign(b, { from: h.from, to: h.to, trip: 'ow', dep: TODAY_S, ret: null, notice: null });
  openSheet('booking', ['ff'], `[data-a="rebook"][data-i="${i}"]`);
};

// ---------- Split rules (iPad) ----------
const SPLIT_PARENT = (parent, child) => {
  if (v3()) return parent.s === 'ff' && child.s === 'traveler'; // Overview on iPad: the booking overview stays beside the traveler being edited
  if (v2() && (child.s === 'assist' || child.s === 'assist-profile')) return false;
  const pairs = { ff: ['stations', 'calendar', 'travelers', 'assist', 'code', 'traveler'], travelers: ['assist'], traveler: ['assist'], account: ['profile', 'assist-profile', 'stub'], profile: ['edit', 'discounts'], discounts: ['rules'] };
  return (pairs[parent.s] || []).includes(child.s);
};
const SPLIT_SELF = r => (v3() && ['profile', 'assist-profile'].includes(r.s)) || (v2() && ['assist', 'assist-profile'].includes(r.s));

// =====================================================================
// A. Fare Finder
// =====================================================================
function ffErrors(b) { return { from: !b.from ? 'Choose a departure station' : '', to: !b.to ? 'Choose an arrival station' : '', ret: b.trip === 'rt' && !b.ret ? 'Choose a return date' : '' }; }
// ---------- New booking fields, normalized against ADS Next and Mobile ADS ----------
// From, To, Depart, Return and Travelers are ADS Text Input fields (field/station, field/large) used as picker
// triggers: the label sits outside the field; the accessible name stays on the button.
const fieldWrap = (cls, label, btn) => `<div class="ads-field ${cls}"><span class="ads-field__label" aria-hidden="true">${label}</span>${btn}</div>`;
// The picker a field opened (iPad keeps the Fare Finder beside it): that field shows as selected
const openPicker = s => { const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1]; return top && top.s === s ? (top.p.field || true) : null; };
// Booking components (stationGroup, dateGroup, selectRow, pointsRow, sheetHeader) live in js/ads-booking.js,
// shared with the DS catalog (docs) so the screen and its examples use the same markup.
// Dates in the Fare Finder read as in the design: 01/01/2027, then the weekday
const fmtNumDate = s => parse(s).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

function routeField(r, ri, opts = {}) {
  const b = D().booking, e = r.u.showErr ? ffErrors(b) : {}, open = openPicker('stations');
  const side = (f, label) => { const c = b[f], s = c && ST[c]; return { label, code: c || '', city: s ? `${s.city}, ${s.st}` : '', facility: s ? s.name : '', placeholder: f === 'from' ? 'Where from?' : 'Where to?', errId: `ff-${f}-err`, expanded: open === f, attrs: `data-a="pick-station" data-field="${f}" id="ff-${f}"` }; };
  return stationGroup({ from: side('from', 'From'), to: side('to', 'To'), errors: { from: e.from, to: e.to }, swapAttrs: 'data-a="swap"', swapDisabled: !b.from && !b.to });
}
function dateFields(r, opts = {}) {
  const b = D().booking, e = r.u.showErr ? ffErrors(b) : {}, open = openPicker('calendar');
  const dep = { label: 'Departure date', value: b.dep ? fmtNumDate(b.dep) : '', placeholder: 'Choose date', icon: 'calendar', sub: b.dep ? fmtWeekday(b.dep) + (b.dep === TODAY_S ? ' · Today' : '') : '', aria: `Departure date: ${b.dep ? fmtWeekday(b.dep) + ', ' + fmtDate(b.dep) : 'not chosen'}`, expanded: open === 'dep', attrs: 'data-a="pick-date" data-field="dep" id="ff-dep"' };
  const ret = b.trip === 'ow'
    ? { label: 'Return date', value: 'Add return', icon: 'plus-circle', aria: 'Return date: Add return', attrs: 'data-a="add-return" id="ff-addret"' }
    : { label: 'Return date', value: b.ret ? fmtNumDate(b.ret) : '', placeholder: 'Choose date', icon: 'calendar', sub: b.ret ? fmtWeekday(b.ret) + (b.ret === TODAY_S ? ' · Today' : '') : '', aria: `Return date: ${b.ret ? fmtWeekday(b.ret) + ', ' + fmtDate(b.ret) : 'not chosen'}`, err: !!e.ret, expanded: open === 'ret', attrs: 'data-a="pick-date" data-field="ret" id="ff-ret"' };
  return dateGroup({ start: dep, end: ret, error: e.ret, errId: 'ff-ret-err' });
}
// Travelers: a field/large picker trigger with a leading icon and a trailing chevron (opens Traveler selection)
function travField(r, b, opts = {}) {
  const d = D(), it = intentOf(b);
  const val = it === 'corporate' ? '1 adult · You' : it === 'pr' ? prSummary(b, d) : paxSummary(b);
  const sub = [it === 'corporate' ? 'Corporate bookings are for you only' : it === 'pr' ? 'Pass Rider fare' : '', travelerChoices(b)].filter(Boolean).join(' · ');
  const err = travErr(r, b);
  return selectRow({ id: 'ff-trav', cls: 'ffc-travfield', label: 'Travelers', icon: 'person', value: val, sub, invalid: !!err, describedby: err ? 'trav-err' : '', attrs: `data-a="pick-travelers"${opts.open || openPicker('travelers') ? ' aria-current="true"' : ''}`, after: err });
}
// ADS tabs used as a single-choice switch: roving tabindex, arrow keys handled in core.js
const tabBtn = (sel, attrs, inner) => `<button class="ads-tab" type="button" role="tab" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" ${attrs}>${inner}</button>`;
const tripSeg = () => { const b = D().booking; return `<div class="ads-tabs ads-tabs--fill trip-tabs" role="tablist" aria-label="Trip type">${tabBtn(b.trip === 'ow', 'data-a="trip" data-v="ow"', 'One-way')}${tabBtn(b.trip === 'rt', 'data-a="trip" data-v="rt"', 'Round-trip')}</div>`; };
// PWD applies to standard bookings; TripLink Corporate and Pass Rider don't take passenger discounts (Q12)
const pwdApplies = b => asks(b, holderKey(b)) && b.assistDone && b.assist.cat === 'disability' && ['standard', 'personal'].includes(intentOf(b));
// Pay with points (NMA-624): a switch in the action footer, off (cash) by default. Members see their balance;
// a guest signs in later, after choosing a fare. Points searches don't take codes.
function payV1(b) {
  ref('624');
  const member = D().signedIn;
  return pointsRow({ id: 'ff-points', title: 'Pay with points', sub: member ? '12,450 points available' : 'You’ll sign in to use your points after you choose a fare.', checked: b.pay === 'points', attrs: 'data-a="pay-points"' });
}
A['pay-points'] = t => { const b = D().booking; b.pay = t.checked ? 'points' : 'cash'; pendingFocus = '#ff-points'; render(); };
// NMA-624: Cash or Points for guests and members, cash by default. Members see their balance. Choosing points
// only changes what the search shops for; a guest signs in later, after choosing a fare.
function payControl(b, id) {
  const member = D().signedIn;
  // Compact DS radio group, subordinate to Find trains
  const opt = (v, label) => `<label class="ads-choice ads-radio paychoice"><input type="radio" name="${id}" data-a="ffc-set" data-key="pay" data-v="${v}" value="${v}" ${b.pay === v ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label">${label}</span></label>`;
  const seg = `<div class="payset" role="radiogroup" aria-labelledby="${id}-l"><span class="payset__legend" id="${id}-l">Pay with</span>${opt('cash', 'Cash')}${opt('points', member ? 'Points · 12,450' : 'Points')}</div>`;
  return seg + (b.pay === 'points' && !member ? `<p class="ads-helper paynote">You’ll sign in to use your points after you choose a fare.</p>` : '');
}
function travelersRow(r, opts = {}) { return travField(r, D().booking, opts); }
// Version 1: booking modes as plain labeled controls above the form (TripLink NMA-622, Pass Rider NMA-623, 1016)
function modesV1(r, b) {
  const d = D(), entry = modeEntry(b, 'v1'); if (!entry) return '';
  let extra = '';
  if (b.intent === 'pr') {
    const elig = d.passrider.role === 'employee' && d.passrider.business;
    extra = elig && !bpCompact() ? `<div class="gs-mode modes-type"><span class="gs-mode__label" id="v1-prt">Travel type <span class="ads-field__marker ads-field__marker--required">Required</span></span><div class="ads-segmented" role="group" aria-labelledby="v1-prt" aria-describedby="v1-prt-h">${[['business', 'Business'], ['leisure', 'Leisure']].map(([k, l]) => `<button type="button" data-a="pr-type" data-v="${k}" aria-pressed="${b.prType === k}">${l}</button>`).join('')}</div><p class="ads-helper" id="v1-prt-h">${prTypeHelp(b)}</p></div>` : '';
  }
  if (b.intent === 'corporate') q(12);
  return `<div class="v1modes">${entry}${extra}${b.modeNote ? `<p class="ads-helper" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.modeNote}</span></p>` : ''}</div>`;
}
function assistBlock(r, ri, host, o = {}) {
  const v = V(), b = v.data.booking; if (v.entry !== host) return '';
  ref('973', '614');
  const intro = 'Tell us your travel needs, like a mobility device, a service animal, hearing loss or station assistance. One traveler with a disability may bring one personal companion.';
  let h = `<div class="assistbox"><label class="ads-choice ads-checkbox"><input type="checkbox" id="assist-on-${host}" data-a="assist-toggle" ${b.assistOn ? 'checked' : ''} aria-describedby="assist-intro-${host}"><span class="ads-choice__control"></span><span class="ads-choice__label"><span><b>Traveler with disability or need help?</b></span><span class="ads-choice__supporting" id="assist-intro-${host}">${intro}</span></span></label>`;
  if (b.assistOn) {
    const list = travelerList(b), t1 = list[0] || { key: firstKey(b), label: 'Traveler 1' };
    if (o.noList) {} // Version 1 Traveler selection shows assistance on each traveler's card
    else if (list.length > 1) h += assistTravelerList(b);
    else if (b.assistDone) h += assistSummaryCard(b.assist, { title: esc(t1.label), edit: 'assist-edit', fromProfile: b.assistFromProfile, booking: true }).replace('data-a="assist-edit"', `data-a="assist-edit" data-t="${t1.key}"`);
    else h += `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-edit" data-t="${t1.key}" style="align-self:flex-start">Answer for ${esc(t1.label)}</button>`;
  }
  h += q(7) + '</div>';
  return h;
}
function ffNotice(b) { return b.notice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${b.notice}</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="dismiss-notice" aria-label="Dismiss">${ic('close', 'ads-icon--sm')}</button></div>` : ''; }
// Find trains: disabled while Business or Leisure isn't chosen (NMA-1016 AC2)
function findBtn(r) {
  const b = D().booking, needType = intentOf(b) === 'pr' && !b.prType;
  if (r.u.busy) return busyBtn(r, '', 'Finding trains');
  const off = needType;
  return `${needType ? '<p class="ads-helper findwhy" id="ff-find-why">Choose Business or Leisure travel to find trains.</p>' : ''}<button class="ads-btn ads-btn--block" type="button" data-a="find-trains" ${off ? `disabled${needType ? ' aria-describedby="ff-find-why"' : ''}` : ''}>Find trains</button>`;
}

SCR.ff = (r, ri) => {
  const b = D().booking, v = V();
  ref('607', '608', '1060');
  if (b.trip === 'rt') ref('608');
  if (v4()) return ffFlighty(r, ri);
  if (v2()) return ffGuided(r, ri);
  const std = ['standard', 'personal'].includes(intentOf(b));
  q(22); if (std) codeTips(); ffFlags(b);
  // Figma Sprint 4 node 3295:51258: trip tabs, stations, dates, Travelers, then the code; Pay with points and
  // Find trains in the action footer. Booking modes (TripLink, Pass Rider) sit above the tabs for eligible members.
  q(7);
  const body = `<div class="ads-bookingsheet__form">${modesV1(r, b)}${tripSeg()}${ffNotice(b)}${routeField(r, ri)}${dateFields(r)}${travelersRow(r)}${std ? codeRow(r, b) : `<p class="ss-note v1modes__none">Points, passenger discounts and coupon or promotion codes aren’t used for ${intentOf(b) === 'corporate' ? 'corporate bookings' : 'Pass Rider travel'}.</p>`}${netAlert(r)}</div>`;
  return { title: 'New booking', header: 'brand', cls: 'pane--nb', kind: 'root', body, foot: (std ? payV1(b) : '') + findBtn(r), footCls: 'ads-actionfooter', offlineText: 'You can fill in your trip. Finding trains needs a connection.' };
};
// Fare Finder actions
A.trip = t => { const b = D().booking; b.trip = t.dataset.v; if (b.trip === 'rt') { if (!b.ret) b.ret = b.dep; } else b.ret = null; pendingFocus = `[data-a="trip"][data-v="${t.dataset.v}"]`; render(); };
A['add-return'] = (t, ri) => { const b = D().booking; b.trip = 'rt'; b.ret = b.dep; pendingFocus = '#ff-ret'; render(); };
A.swap = () => { const b = D().booking; [b.from, b.to] = [b.to, b.from]; pendingFocus = '[data-a="swap"]'; render(); };
A['dismiss-notice'] = () => { D().booking.notice = null; pendingFocus = 'title'; render(); };
A['pick-station'] = (t, ri) => push('stations', { field: t.dataset.field }, +ri);
A['pick-date'] = (t, ri) => push('calendar', { field: t.dataset.field }, +ri);
A['pick-travelers'] = (t, ri) => push('travelers', {}, +ri);
// Find trains: the checks live in clear.js (one place for every concept)
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
function stationRow(s, field, sec, near) {
  const d = D(), ctx = curCtx(), tg = selTarget(ctx), fav = d.fav.includes(s.code), cur = tg[field] === s.code;
  const rec = d.rec.find(x => x.c === s.code);
  const when = sec === 'rec' && rec ? ` · ${rec.d === 0 ? 'today' : rec.d === 1 ? 'yesterday' : rec.d + ' days ago'}` : '';
  const blocked = ctx === 'ff' && s.tag && autoTrainBlocked();
  const b = tg, role = b.from === s.code ? 'Departure' : b.to === s.code ? 'Arrival' : '';
  const roleTag = role && !cur ? `<span class="ads-badge ss-roletag">${role === 'Departure' ? 'From' : 'To'}</span>` : ''; // the other end of the trip
  return `<li class="ads-stationrow${role && !cur ? ' is-other' : ''}" ${cur ? 'aria-current="true"' : ''}><button class="ads-stationrow__select" type="button" data-a="choose-station" data-code="${s.code}" data-field="${field}" data-k="st-${sec}-${s.code}"${near ? ` data-mi="${near.mi.toFixed(1)}" data-rank="${near.rank}"` : ''} ${blocked ? 'disabled' : ''}><span class="ads-stationrow__code">${s.code}</span><span class="ads-stationrow__text"><span class="ads-stationrow__name">${s.city}, ${s.st}${roleTag}</span><span class="ads-stationrow__detail">${s.name}${when}</span>${near ? `<span class="ads-stationrow__detail ss-dist"><span aria-hidden="true">${fmtMi(near.mi, near.approx)}</span><span class="ads-sr-only">, ${spokenMi(near.mi, near.approx)}</span></span>` : ''}${s.tag ? `<span class="ads-badge ads-badge--info ads-stationrow__tag">${s.tag} only</span>` : ''}${blocked ? '<span class="ads-stationrow__detail">Auto Train isn’t available for Pass Rider Business travel</span>' : ''}</span>${cur ? `${ic('check', 'ss-check')}<span class="ads-sr-only">, selected</span>` : ''}</button><button class="ads-stationrow__star ss-details" type="button" data-a="info" data-topic="station:${s.code}" data-k="det-${sec}-${s.code}" aria-label="Station details: ${s.city}, ${s.code}">${ic('info-circle')}</button><button class="ads-stationrow__star" type="button" data-a="fav" data-code="${s.code}" aria-pressed="${fav}" aria-label="Favorite: ${s.city}, ${s.code}" data-k="fav-${sec}-${s.code}">${ic(fav ? 'bookmark-filled' : 'bookmark')}</button></li>`;
}
function stationSearch(r, ri, field, inline) {
  const d = D(); r.u.d = r.u.d || {};
  const qv = r.u.d.q || '';
  const favs = favList(d).map(c => ST[c]);
  const recs = recentList(d).map(x => ST[x.c]);
  ref('600', '118', '984');
  const focus = stationFocus() && !inline;
  const root = +ri === 0, lead = focus ? (root ? `<button class="ss-back" type="button" data-a="close" aria-label="Close station search">${ic('arrow-left')}</button>` : `<button class="ss-back" type="button" data-a="back" aria-label="Back to ${esc(titleOf(sheet().stack[+ri - 1], +ri - 1))}">${ic('arrow-left')}</button>`) : ic('search');
  const search = `<div class="ss-search${focus ? ' ss-search--focus' : ''}"><label class="ads-sr-only" for="ss-q">Search ${field === 'from' ? 'departure' : 'arrival'} stations</label><div class="ads-control ads-control--pill">${lead}<input id="ss-q" type="search" data-f="q" data-live data-nodirty value="${esc(qv)}" placeholder="${focus ? (field === 'from' ? 'Search departure stations' : 'Search arrival stations') : 'City, station, code or ZIP'}" autocomplete="off">${qv ? `<button class="ads-control__clear" type="button" data-a="ss-clear" aria-label="Clear search">${ic('close', 'ads-icon--sm')}</button>` : ''}</div>${q(1)}${q(2)}</div>`;
  // Heading with Back above the List / Map tabs (iPhone; iPad uses the navigation bar), then the search field in
  // List view only, then My Location, favorites and recents. Map view: heading, tabs and the map.
  const upSearch = search.replace(' ss-search--focus', '').replace('class="ss-search', 'class="ss-search ss-search--upd').replace(lead, ic('search')).replace('placeholder="City, station, code or ZIP"', `placeholder="${field === 'from' ? 'Search departure stations' : 'Search arrival stations'}"`);
  const head = focus ? `<div class="ss-head">${lead.replace('class="ss-back"', 'class="ads-icon-btn ads-icon-btn--round ss-head__back"')}<h2 class="ads-body-emphasis ss-head__title" id="t-${ri}" tabindex="-1">${selHeading(field)}</h2></div>` : '';
  const tabs = selViewTabs(qv.trim() && r.u.view !== 'map' ? Object.assign({}, r, { u: Object.assign({}, r.u, { view: 'list' }) }) : r);
  if (r.u.view === 'map') return head + tabs + '<!--why-->' + mapView(r, ri, field);
  let h = head + tabs + '<!--why-->' + upSearch;
  h += '<div id="ss-panel" role="tabpanel" aria-labelledby="ss-tab-list" class="ss-listpanel">';
  if (qv.trim()) {
    const res = searchStations(qv);
    if (res.length) h += `<p class="ads-sr-only" role="status">${res.length} result${res.length > 1 ? 's' : ''}</p><ul class="stlist" aria-label="Search results">${res.slice(0, 25).map(s => stationRow(s, field, 'res')).join('')}</ul>`;
    else if (qv.trim().length > 2) h += `<div class="ss-empty" role="status"><b>No results for “${esc(qv.trim())}”</b><span>Check the spelling, or search by city, station code or ZIP code.</span></div>`;
    else h += `<p class="ss-empty" role="status">Keep typing to search.</p>`;
    return h + q(3) + '</div>';
  }
  selNotes(r.p.ctx || 'ff');
  h += nearSection(r, ri);
  if (favs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Favorites</span></div><ul class="stlist" aria-label="Favorite stations">${favs.map(s => stationRow(s, field, 'fav')).join('')}</ul></div>`;
  if (recs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Recents</span><button class="ads-link ads-link--sm ss-clearrec" type="button" data-a="clear-recents" data-ret="#ss-q" aria-label="Clear recent stations">Clear recents</button></div><ul class="stlist" aria-label="Recent stations">${recs.map(s => stationRow(s, field, 'rec')).join('')}</ul></div>`;
  if (d.rec.some(x => x.d > RECENT_DAYS)) tip(`BAL was chosen 12 days ago, so it has dropped out of recents (${RECENT_DAYS}-day retention, set by RECENT_DAYS).`);
  const showAll = (!favs.length && !recs.length) || r.u.full;
  if (showAll) {
    const byState = {}; STATIONS.forEach(s => (byState[s.state] ||= []).push(s));
    h += `<div class="stsection"><p class="ss-allhead">All stations, by state</p>${Object.keys(byState).sort().map(stn => `<div class="ads-stationrow__header"><span>${stn}</span></div><ul class="stlist" aria-label="${stn}">${byState[stn].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)).map(s => stationRow(s, field, 'all')).join('')}</ul>`).join('')}</div>`;
  } else h += `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="ss-full">View full list</button>`;
  h += `<p class="ss-note">${q(3)} Bookmark a station to add it to favorites.</p></div>`;
  tip('Search “30th”, “Penn”, “Capitol”, “021” or “VA”. Choose Lorton to see Auto Train pairing.');
  return h;
}
// Station search is a focused input state on iPhone; iPad keeps it beside the Fare Finder
const stationFocus = () => !IPAD();
const selHeading = f => f === 'from' ? 'Select departure station' : 'Select arrival station';
SCR.stations = (r, ri) => {
  if (rich()) return stationsClear(r, ri);
  const f = r.p.field;
  const lead = v2() ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${f === 'from' ? 'Step 1 of 2 for your route. Next you’ll choose where you’re going.' : 'Step 2 of 2 for your route. It can’t be the same as your departure station.'}</span></p>` : '';
  const why = (v1() || v2()) && D().booking.notice ? /* shown while station search continues to the other station */ `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${D().booking.notice}</p></div></div>` : '';
  const cls = 'ss-upd' + (r.u.view === 'map' ? ' ss-upd--map' : ''), heading = selHeading(f), body = stationSearch(r, ri, f, false).replace('<!--why-->', lead + why);
  return stationFocus() ? { title: heading, kind: 'focus', headInBody: true, cls: 'pane--focus ' + cls, body, banner: false } : { title: heading, kind: 'push', cls, body, banner: false };
};
A['ss-clear'] = (t, ri) => { const r = routeAt(ri); r.u.d.q = ''; pendingFocus = '#ss-q'; render(); };
A['ss-full'] = (t, ri) => { routeAt(ri).u.full = true; pendingFocus = '.ss-allhead + .ads-stationrow__header + .stlist button'; render(); };
A.fav = t => {
  const d = D(), c = t.dataset.code;
  if (d.fav.includes(c)) { d.fav = d.fav.filter(x => x !== c); d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)]; toast(`${ST[c].city} removed from favorites and returned to recents`, 'info'); }
  else { d.fav = [...d.fav, c]; d.rec = d.rec.filter(x => x.c !== c); toast(`${ST[c].city} added to favorites`); }
  pendingFocus = `[data-a="fav"][data-code="${c}"]`; render();
};
A['choose-station'] = (t, ri) => {
  const d = D(), si = selIndex(), sr = si >= 0 ? sheet().stack[si] : null, ctx = (sr && sr.p.ctx) || 'ff', b = selTarget(ctx);
  const f = t.dataset.field, c = t.dataset.code, other = f === 'from' ? 'to' : 'from';
  if (ctx === 'ff' && autoTrainBlocked() && AUTO_TRAIN[c]) return;
  if (b[other] === c) { dialog({ title: 'Select a different station', body: 'From and To need to be different stations.', actions: [['Choose another station', 'primary', null]], returnFocus: `[data-k="${t.dataset.k}"]` }); return; }
  b[f] = c;
  if (ctx === 'ff') {
    b.notice = null;
    // Existing Auto Train validation (NMA-607): pairing Lorton and Sanford still sets or clears the other end (flagged: conflicts with "only the originating field")
    if (AUTO_TRAIN[c]) { b[other] = AUTO_TRAIN[c]; b.notice = `${ST[c].city} is an Auto Train station. Auto Train only runs between Lorton, VA and Sanford, FL, so ${ST[AUTO_TRAIN[c]].city} was added as your ${other === 'to' ? 'arrival' : 'departure'} station.`; }
    else if (b[other] && AUTO_TRAIN[b[other]]) { b.notice = `${ST[b[other]].city} only connects to ${ST[AUTO_TRAIN[b[other]]].city} (Auto Train), so it was cleared. Choose your ${other === 'to' ? 'arrival' : 'departure'} station.`; b[other] = null; }
  }
  if (!d.fav.includes(c)) d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)];
  if (sr) {
    sr.u.committed = true;
    const how = t.dataset.mi ? 'nearby' : sr.u.view === 'map' || /^(map|detail)-/.test(t.dataset.k || '') ? 'map' : 'list';
    const pos = locKnown() ? devicePos() : null, mi = t.dataset.mi || (pos && geoOf(c) ? miles(pos, geoOf(c)).toFixed(1) : '');
    track(how === 'map' ? 'map_station_selected' : how === 'nearby' ? 'nearby_station_selected' : 'station_selected', { code: c, ...selProps(sr), ...(mi ? { distance_mi: mi } : {}), ...(t.dataset.rank ? { rank: t.dataset.rank } : {}) });
  }
  // Back to the experience that opened station search, with only this field changed
  if (si <= 0) { closeSheet(true); pendingFocus = `#${ctx}-${f}`; render(); return; }
  popTo(si - 1); pendingFocus = ctx === 'ff' ? `#ff-${f}` : `#${ctx}-${f}`; render();
};

// =====================================================================
// Calendar (NMA-1060)
// =====================================================================
// Month navigation (one month at a time)
const monthKey = s => s.slice(0, 7);
A['cal-month'] = (t, ri) => {
  const r = routeAt(ri), [y, m] = (r.u.month).split('-').map(Number), d = new Date(y, m - 1 + (+t.dataset.d), 1);
  r.u.month = iso(d).slice(0, 7); pendingFocus = `[data-a="cal-month"][data-d="${t.dataset.d}"]:not(:disabled), .cal-nav__title`; render();
};
function calendarBody(r, ri, field) {
  const b = D().booking; r.u.picking = r.u.picking || field;
  const picking = b.trip === 'ow' ? 'dep' : r.u.picking;
  ref('1060');
  const maxDep = addDays(TODAY_S, WINDOW_DAYS), maxRet = addDays(b.dep, WINDOW_DAYS);
  const last = parse(picking === 'ret' ? maxRet : maxDep);
  // One month at a time (it opens on the month of the date being picked). No fares on the calendar (stakeholder feedback)
  const firstM = iso(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)).slice(0, 7), lastM = iso(last).slice(0, 7);
  if (!r.u.month || r.u.monthFor !== picking) { r.u.month = monthKey(picking === 'ret' ? (b.ret || b.dep) : b.dep); r.u.monthFor = picking; }
  if (r.u.month < firstM) r.u.month = firstM; if (r.u.month > lastM) r.u.month = lastM;
  const [my, mm] = r.u.month.split('-').map(Number), m = new Date(my, mm - 1, 1);
  const isOff = s => s < TODAY_S || (picking === 'dep' && s > maxDep) || (picking === 'ret' && (s < b.dep || s > maxRet));
  const nDays = new Date(my, mm, 0).getDate();
  const day = (y, mo, dd) => {
    const s = iso(new Date(y, mo, dd));
    const disabled = isOff(s);
    const isDep = s === b.dep, isRet = b.trip === 'rt' && s === b.ret, inRange = b.trip === 'rt' && b.ret && s > b.dep && s < b.ret;
    const cls = ['ads-day', s === TODAY_S ? 'ads-day--today' : '', isDep && b.trip === 'rt' && b.ret && b.ret !== b.dep ? 'ads-day--range-start' : '', isRet && b.ret !== b.dep ? 'ads-day--range-end' : '', inRange ? 'ads-day--in-range' : ''].filter(Boolean).join(' ');
    const label = `${fmtWeekday(s)}, ${fmtDate(s)}${s === TODAY_S ? ', today' : ''}${isDep ? ', departure date' : ''}${isRet ? ', return date' : ''}${disabled ? ', not available' : ''}`;
    return `<button class="${cls}" type="button" data-a="day" data-d="${s}" data-k="day-${s}" ${disabled ? 'disabled' : ''} ${isDep || isRet ? 'aria-pressed="true"' : ''} aria-label="${label}">${dd}</button>`;
  };
  const title = m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  let g = ''; for (let i = 0; i < m.getDay(); i++) g += '<span></span>'; for (let dd = 1; dd <= nDays; dd++) g += day(my, mm - 1, dd);
  const nav = `<div class="cal-nav"><button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="cal-month" data-d="-1" aria-label="Previous month" ${r.u.month <= firstM ? 'disabled' : ''}>${ic('chevron-left', 'ads-icon--sm')}</button><h3 class="cal-nav__title" id="cal-m" tabindex="-1" aria-live="polite">${title}</h3><button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="cal-month" data-d="1" aria-label="Next month" ${r.u.month >= lastM ? 'disabled' : ''}>${ic('chevron-right', 'ads-icon--sm')}</button></div>`;
  const monthHtml = `<div class="ads-calendar__month">${nav}<div class="ads-calendar__weekdays" aria-hidden="true">${'SMTWTFS'.split('').map(x => `<span>${x}</span>`).join('')}</div><div class="ads-calendar__grid" role="group" aria-labelledby="cal-m">${g}</div></div>`;
  const pickSeg = b.trip === 'rt' ? `<div class="ads-tabs ads-tabs--fill cal-pick" role="tablist" aria-label="Dates">${tabBtn(picking === 'dep', 'data-a="picking" data-v="dep"', `<span class="cal-pick__k">Depart</span><span>${fmtShortY(b.dep)}</span>`)}${tabBtn(picking === 'ret', 'data-a="picking" data-v="ret"', `<span class="cal-pick__k">Return</span><span>${b.ret ? fmtShortY(b.ret) : 'not set'}</span>`)}</div>` : '';
  const prompt = v2() ? `<p class="ghint" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${picking === 'dep' ? (b.trip === 'rt' ? 'First, choose your departure date. Then choose your return date in the same calendar.' : 'Choose your departure date. Past dates aren’t available.') : `Now choose your return date. Dates before ${fmtShort(b.dep)} aren’t available.`}</span></p>` : `<p class="ads-sr-only" role="status">${picking === 'dep' ? 'Departure date' : 'Return date'}</p>`;
  const notice = r.u.calNotice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${r.u.calNotice}</p></div></div>` : '';
  q(4); const limit = ''; // the booking window isn't confirmed (Q4), so the calendar only disables dates beyond it and doesn't state a policy
  return `${pickSeg}${prompt}${notice}<div class="ads-calendar ads-calendar--paged">${monthHtml}</div>${limit}`;
}
// ---------- Dates (New booking): two months at a time, scrolling vertically through the booking window ----------
// Design-review revision. Edits a draft (r.u.cal): Done saves to the booking and returns to Fare Finder; Back returns
// without saving and without asking. Departure and return are edited one at a time; switching keeps the other.
// A new departure after the chosen return keeps that return marked as needing a new choice (never changed silently).
function calDraft(r) { const b = D().booking; if (!r.u.cal) r.u.cal = { dep: b.dep, ret: b.trip === 'rt' ? b.ret : null, edit: b.trip === 'rt' && r.p.field === 'ret' ? 'ret' : 'dep', retBad: false, jump: true }; return r.u.cal; }
function calScroll(r, ri) {
  const b = D().booking, c = calDraft(r), rt = b.trip === 'rt', edit = rt ? c.edit : 'dep';
  ref('1060'); q(4); // the 335-day window isn't confirmed (Q4): dates beyond it are disabled, no policy text
  const maxDep = addDays(TODAY_S, WINDOW_DAYS), maxRet = c.dep ? addDays(c.dep, WINDOW_DAYS) : maxDep;
  const isOff = s => s < TODAY_S || (edit === 'dep' && s > maxDep) || (edit === 'ret' && (s < c.dep || s > maxRet));
  const retOk = rt && c.ret && !c.retBad;
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), lastS = edit === 'ret' ? maxRet : maxDep, last = parse(lastS);
  const months = []; for (let d = new Date(first); d <= last; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
  const day = (y, mo, dd) => {
    const s = iso(new Date(y, mo, dd)), off = isOff(s);
    const isDep = s === c.dep, isRet = retOk && s === c.ret, between = retOk && s > c.dep && s < c.ret, span = retOk && c.ret !== c.dep;
    const cls = ['ads-day', s === TODAY_S ? 'ads-day--today' : '', isDep && span ? 'ads-day--range-start' : '', isRet && span ? 'ads-day--range-end' : '', between ? 'ads-day--in-range' : '', isDep ? 'calx-dep' : '', isRet ? 'calx-ret' : ''].filter(Boolean).join(' ');
    const label = `${fmtWeekday(s)}, ${fmtDate(s)}${s === TODAY_S ? ', today' : ''}${isDep ? ', departure date' : ''}${isRet ? ', return date' : ''}${between ? ', between your dates' : ''}${off ? ', not available' : ''}`;
    return `<button class="${cls}" type="button" data-a="calx-day" data-d="${s}" data-k="day-${s}" ${off ? 'disabled' : ''} ${isDep || isRet ? 'aria-pressed="true"' : ''} aria-label="${label}">${dd}</button>`;
  };
  const monthHtml = m => {
    const y = m.getFullYear(), mo = m.getMonth(), n = new Date(y, mo + 1, 0).getDate(), key = iso(m).slice(0, 7), id = `calx-${key}`;
    let g = ''; for (let i = 0; i < m.getDay(); i++) g += '<span aria-hidden="true"></span>'; for (let dd = 1; dd <= n; dd++) g += day(y, mo, dd);
    return `<section class="ads-calendar__month calx-month" data-month="${key}" aria-labelledby="${id}"><h3 id="${id}">${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3><div class="ads-calendar__grid" role="group" aria-labelledby="${id}">${g}</div></section>`;
  };
  // Which date is being edited: two ADS tabs that show both choices (round trip); one-way shows the departure only
  const val = (k, v) => v ? fmtShort(v) : k === 'ret' ? 'Choose a date' : 'Not set';
  const pick = rt ? `<div class="ads-tabs ads-tabs--fill cal-pick" role="tablist" aria-label="Date to edit">${tabBtn(edit === 'dep', 'data-a="calx-edit" data-v="dep"', `<span class="cal-pick__k">Departure</span><span>${val('dep', c.dep)}</span>`)}${tabBtn(edit === 'ret', `data-a="calx-edit" data-v="ret"${c.retBad ? ' aria-describedby="calx-why"' : ''}`, `<span class="cal-pick__k">Return</span><span class="${c.retBad ? 'calx-bad' : ''}">${c.retBad ? 'Choose again' : val('ret', c.ret)}</span>`)}</div>`
    : `<p class="calx-one"><span class="cal-pick__k">Departure</span> <b>${val('dep', c.dep)}</b></p>`;
  const why = c.retBad ? `<div class="ads-alert ads-alert--warning calx-why" id="calx-why" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">Your return date, ${fmtShort(c.ret)}, is before your new departure. Choose a new return date.</p></div></div>` : '';
  const live = `<p class="ads-sr-only" role="status">${edit === 'dep' ? 'Choose a departure date' : 'Choose a return date'}</p>`;
  const legend = `<ul class="calx-legend" aria-hidden="true"><li><span class="calx-key calx-key--today">${new Date(TODAY).getDate()}</span>Today</li><li><span class="calx-key calx-key--sel"></span>${rt ? 'Your dates' : 'Departure'}</li>${rt ? '<li><span class="calx-key calx-key--range"></span>Between</li>' : ''}<li><span class="calx-key calx-key--off">1</span>Unavailable</li></ul>`;
  return `<div class="calx-head">${pick}${why}${live}${legend}<div class="ads-calendar__weekdays" aria-hidden="true">${'SMTWTFS'.split('').map(x => `<span>${x}</span>`).join('')}</div></div><div class="ads-calendar calx">${months.map(monthHtml).join('')}</div>`;
}
SCR.calendar = (r, ri) => {
  const b = D().booking;
  if (v1()) {
    const c = calDraft(r), need = b.trip === 'rt' && (!c.ret || c.retBad);
    const foot = `${need ? '<p class="ads-helper" id="calx-done-why">Choose a return date to save your dates.</p>' : ''}<button class="ads-btn ads-btn--block" type="button" data-a="calx-done"${need ? ' disabled aria-describedby="calx-done-why"' : ''}>Done</button>`;
    return { title: 'Dates', kind: 'push', noClose: true, cls: 'pane--calx', body: calScroll(r, ri), foot, banner: false };
  }
  const foot = `<div class="calfoot"><span class="ads-body-small"><b>Depart</b> ${fmtShortY(b.dep)}${b.trip === 'rt' ? ` · <b>Return</b> ${b.ret ? fmtShortY(b.ret) : 'not set'}` : ''}</span><button class="ads-btn" type="button" data-a="cal-done">Done</button></div>`;
  return { title: v2() ? (b.trip === 'rt' ? 'Choose your dates' : 'Choose departure date') : 'Dates', kind: 'push', body: calendarBody(r, ri, r.p.field), foot, banner: false };
};
A['calx-edit'] = (t, ri) => { const r = routeAt(ri); calDraft(r).edit = t.dataset.v; calDraft(r).jump = true; pendingFocus = `[data-a="calx-edit"][data-v="${t.dataset.v}"]`; render(); };
A['calx-day'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = calDraft(r), s = t.dataset.d, rt = b.trip === 'rt';
  if (!rt || c.edit === 'dep') {
    c.dep = s;
    if (rt && c.ret && c.ret < s) { c.retBad = true; c.edit = 'ret'; c.jump = true; pendingFocus = '#calx-why'; render(); return; } // guide to a new return; never change it silently
    if (rt && !c.ret) { c.edit = 'ret'; c.jump = true; }
  } else { c.ret = s; c.retBad = false; }
  pendingFocus = `[data-k="day-${s}"]`; render();
};
A['calx-done'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = calDraft(r);
  if (b.trip === 'rt' && (!c.ret || c.retBad)) return;
  b.dep = c.dep; if (b.trip === 'rt') b.ret = c.ret;
  popTo(+ri - 1); pendingFocus = '#ff-dep';
};
// After a render, bring the month being edited to the top of the list (on opening, and when switching dates)
const renderBeforeCal = render;
render = function () {
  const out = renderBeforeCal.apply(this, arguments);
  const sh = sheet(), r = sh && sh.stack[sh.stack.length - 1];
  if (r && r.s === 'calendar' && r.u.cal && r.u.cal.jump) {
    const c = r.u.cal; c.jump = false;
    const target = (c.edit === 'ret' && c.ret ? c.ret : c.dep || TODAY_S).slice(0, 7), sc = document.querySelector('#device .pane--calx .pane__scroll'), m = document.querySelector(`#device .calx-month[data-month="${target}"]`);
    if (sc && m) { const head = sc.querySelector('.calx-head'); sc.scrollTop = Math.max(0, m.offsetTop - (head ? head.offsetHeight : 0) - 4); sc.dispatchEvent(new Event('scroll')); }
  }
  return out;
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
// Traveler selection (fixed sample traveler; discount NMA-612)
// =====================================================================
SCR.travelers = (r, ri) => travelersClear(r, ri, !rich());
A['bk-disc'] = t => { D().booking.disc = t.value; pendingFocus = `[data-a="bk-disc"][value="${t.value}"]`; render(); };

// =====================================================================
// Assistance (shared model: cat, dis[], wc 'yes'|'no'|'', needs[])
// =====================================================================
// The traveler a booking questionnaire is for (route param t), and their label
const assistWho = r => { const b = D().booking, key = (r && r.p && r.p.t) || firstKey(b); return travelerList(b).find(t => t.key === key) || { key, n: 1, label: 'Traveler 1' }; };
const toDraft = m => ({ cat: m.cat || '', dis: [...m.dis], wc: m.wc === true ? 'yes' : m.wc === false ? 'no' : '', needs: [...m.needs], for: m.for || '', animal: m.animal || '' });
const fromDraft = x => withAnimal(x, { for: x.cat === 'companion' ? x.for || null : null, cat: x.cat || null, dis: x.cat === 'disability' ? [...x.dis] : [], wc: x.cat === 'disability' && x.dis.includes('mobility') ? x.wc === 'yes' : null, needs: x.cat === 'disability' ? [...x.needs] : x.cat === 'station' ? x.needs.filter(n => n === 'seat') : x.cat === 'companion' ? x.needs.filter(n => n === 'station' || (n === 'seat' && x.needs.includes('station'))) : [] });
// The service animal's size is kept only while Service animal is chosen
const withAnimal = (x, m) => Object.assign(m, { animal: m.needs.includes('animal') ? x.animal || null : null });
const AC = ASSIST_COPY;
// Wheelchair space allows an accessible seat or a large service animal, not both (NMA-995). A conflict is only
// possible after changing the wheelchair answer to Yes; it is never resolved silently.
const bigAnimal = x => x.needs.includes('animal') && x.animal === 'large';
const assistConflict = x => x.cat === 'disability' && x.wc === 'yes' && x.needs.includes('seat') && bigAnimal(x);
const needLabel = k => NEEDS.find(n => n[0] === k)[1];
const listWords = a => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
function assistErrors(x, mode, who = 'Traveler 1') {
  const e = {};
  if (mode === 'booking' && !x.cat) e.cat = AC.err.cat(who);
  if (x.cat === 'disability' && !x.dis.length) e.dis = AC.err.dis;
  if (x.cat === 'disability' && x.dis.includes('mobility') && !x.wc) e.wc = AC.err.wc;
  if (assistConflict(x)) e.needs = AC.err.conflict;
  if (x.needs.includes('animal') && !x.animal) e.animal = AC.err.size;
  return e;
}
// Editing the draft: answers that still apply are kept; the rest are removed and the removal is announced
HOOKS.assist = (r, t) => {
  const x = r.u.d, notes = [];
  const drop = (keep, why) => { const gone = x.needs.filter(n => !keep(n)); if (gone.length) { x.needs = x.needs.filter(keep); const w = gone.map(needLabel); notes.push(AC.removed.needs(w.length > 1 ? listWords(w) : w[0], why)); } };
  if (x.cat !== 'disability' && (x.dis.length || x.wc)) { x.dis = []; x.wc = ''; notes.push(AC.removed.disability); }
  if (x.cat === 'station') { x.needs = x.needs.filter(n => n !== 'station'); drop(n => n === 'seat', AC.why.station); } // station assistance is part of this type
  if (x.cat === 'companion') { drop(n => n !== 'animal', AC.why.companion); if (!x.needs.includes('station')) drop(n => n !== 'seat', AC.why.compSeat); } // NMA-997 AC2
  if (x.cat === 'none' || !x.cat) drop(() => false, AC.why.none);
  if (x.cat === 'disability') {
    if (!x.dis.includes('mobility') && x.wc) { x.wc = ''; notes.push(AC.removed.wc); }
    if (!x.dis.length) drop(() => false, AC.why.noDisability);
  }
  if (!x.needs.includes('animal')) x.animal = '';
  r.u.assistNote = notes.join(' ') || null;
  if (r.u.err) r.u.err = assistErrors(x, r.u.mode, assistWho(r).label);
};
// Inline choice when wheelchair space makes an accessible seat and a large service animal conflict
A['assist-keep'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, keep = t.dataset.v; r.u.dirty = true;
  if (keep === 'seat') { x.animal = ''; r.u.assistNote = AC.sizeCleared; } // the animal can stay at a smaller size
  else { x.needs = x.needs.filter(n => n !== 'seat'); r.u.assistNote = AC.removed.needs(needLabel('seat'), AC.why.wcChoice); }
  if (r.u.err) r.u.err = assistErrors(x, r.u.mode, assistWho(r).label);
  pendingFocus = keep === 'seat' ? '[data-f="animal"][value="small"]' : '[data-f="needs"][value="animal"]'; render();
};
function needsBlock(r, x, idp, explain, e = {}) {
  const wcYes = x.wc === 'yes', comp = x.cat === 'companion', st = x.cat === 'station';
  const locked = x.cat === 'disability' && !x.dis.length, conflict = assistConflict(x);
  const items = st ? NEEDS.filter(n => n[0] === 'seat') : comp ? NEEDS.filter(n => n[0] === 'station' || n[0] === 'seat').sort((a, c) => (a[0] === 'station' ? -1 : 1)) : NEEDS;
  const opts = items.map(([k, l, s]) => {
    let dis = locked, why = '';
    if (!conflict && wcYes && k === 'seat' && bigAnimal(x)) { dis = true; why = AC.seatBlocked; }
    if (comp && k === 'seat' && !x.needs.includes('station')) { dis = true; why = AC.compSeatAfter; }
    return choice('checkbox', `${idp}-needs`, 'needs', k, x.needs.includes(k), l, why || s, `data-hook="assist" ${dis ? `disabled aria-describedby="${idp}-needs-why"` : ''}`) + (k === 'animal' && x.needs.includes('animal') ? animalSize(x, idp, e, !locked && !conflict && wcYes && x.needs.includes('seat')) : '');
  }).join('');
  const help = locked ? AC.needsLocked : st ? AC.stationIncluded : x.cat === 'disability' && wcYes ? AC.wcRule : '';
  const fix = conflict ? `<div class="ads-alert ads-alert--warning assist-conflict" role="alert" id="${idp}-needs-err">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${AC.conflictTitle}</p><p class="ads-alert__description ads-body-small">${AC.conflictBody}</p><div class="ads-row" style="--ads-row-gap:8px"><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-keep" data-v="seat">${AC.keepSeat}</button><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-keep" data-v="animal">${AC.keepAnimal}</button></div></div></div>` : '';
  return `<fieldset class="ads-fieldset${locked ? ' is-locked' : ''}" ${help ? `aria-describedby="${idp}-needs-why"` : ''}><legend class="ads-field-label">${st ? AC.stationSeatLegend : comp ? AC.compLegend : AC.needsLegend} <span class="ads-field__marker ads-field__marker--optional">Optional</span></legend>${help ? `<p class="ads-helper" id="${idp}-needs-why">${ic('info-circle', 'ads-icon--sm')}<span>${help}</span></p>` : ''}${fix}<div class="ads-fieldset__options">${opts}</div>${e.needs ? `<p class="ads-helper ads-helper--error" id="${idp}-needs-e">${ic('alert-diamond')}<span>${e.needs}</span></p>` : ''}${st || comp ? '' : `<p class="info-entry">${infoLink('service-animals', 'About service animals')}</p>`}</fieldset>`;
}
// Service animal size: small and medium are always accepted; large follows the wheelchair-space rule
function animalSize(x, idp, e, largeOff) {
  const opts = AC.animalSizes.map(([v, l]) => choice('radio', `${idp}-asize`, 'animal', v, x.animal === v, l, v === 'large' && largeOff ? AC.largeBlocked : '', `data-hook="assist" ${v === 'large' && largeOff ? 'disabled' : ''}`)).join('');
  return `<fieldset class="ads-fieldset ads-fieldset--inline assist-size" ${e.animal ? `aria-describedby="${idp}-asize-err"` : ''}><legend class="ads-field-label">${AC.animalSizeLegend} <span class="ads-field__marker ads-field__marker--required">Required</span></legend><div class="ads-fieldset__options">${opts}</div>${e.animal ? `<p class="ads-helper ads-helper--error" id="${idp}-asize-err">${ic('alert-diamond')}<span>${e.animal}</span></p>` : ''}</fieldset>`;
}
// Why Personal companion can't be chosen for this traveler right now
function companionWhy(b, key) {
  const others = travelerList(b).filter(t => t.key !== key && assistCat(b, t.key) === 'disability');
  return others.length ? AC.companionFull : AC.companionNoDisability;
}
// Type of help. branch (one-page form) is the follow-up for the chosen type, shown directly beneath it.
function catBlock(r, x, idp, mode, e, branch) {
  const cats = mode === 'booking' ? ['disability', 'station', 'companion', 'none'] : ['disability', 'station'];
  const b = D().booking, who = assistWho(r), open = mode === 'booking' && companionOpen(b, who.key);
  const opts = cats.map(k => {
    const sel = x.cat === k, off = k === 'companion' && !open && !sel;
    const sup = off ? companionWhy(b, who.key) : (AC.catHelp[k] || '');
    return choice('radio', `${idp}-cat`, 'cat', k, sel, CATS[k], sup, off ? 'disabled' : 'data-hook="assist"') + (sel && branch ? `<div class="assist-branch">${branch}</div>` : '');
  }).join('');
  const legend = mode === 'booking' ? (v1() ? `${AC.typeLegend}<span class="ads-sr-only"> for ${esc(who.label)}</span>` : `${esc(who.label)} needs`) : AC.profileTypeLegend;
  return `<fieldset class="ads-fieldset" ${e.cat ? `aria-describedby="${idp}-cat-err"` : ''}><legend class="ads-field-label">${legend}${mode === 'booking' ? ' <span class="ads-field__marker ads-field__marker--required">Required</span>' : ''}</legend><div class="ads-fieldset__options">${opts}</div>${e.cat ? `<p class="ads-helper ads-helper--error" id="${idp}-cat-err">${ic('alert-diamond')}<span>${e.cat}</span></p>` : ''}</fieldset>${branch === undefined && mode === 'booking' && x.cat === 'companion' ? companionFor(r, x, idp, e) : ''}${mode === 'booking' ? q(9) : ''}`;
}
function disBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset" ${e.dis ? `aria-describedby="${idp}-dis-err"` : ''}><legend class="ads-field-label">${AC.disLegend} <span class="ads-field__marker ads-field__marker--required">At least one</span></legend><div class="ads-fieldset__options">${DISABILITIES.map(([k, l, s]) => choice('checkbox', `${idp}-dis`, 'dis', k, x.dis.includes(k), l, s, 'data-hook="assist"')).join('')}</div>${e.dis ? `<p class="ads-helper ads-helper--error" id="${idp}-dis-err">${ic('alert-diamond')}<span>${e.dis}</span></p>` : ''}</fieldset>`;
}
function wcBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset ads-fieldset--inline wcq" ${e.wc ? `aria-describedby="${idp}-wc-err"` : ''}><legend class="ads-field-label">${ic('wheelchair-space', 'ads-icon--sm')} ${AC.wcQuestion} <span class="ads-field__marker ads-field__marker--required">Required</span>${r.u.mode === 'profile' ? ` ${q(18)}` : ''}</legend><div class="ads-fieldset__options">${choice('radio', `${idp}-wc`, 'wc', 'yes', x.wc === 'yes', 'Yes', '', 'data-hook="assist"')}${choice('radio', `${idp}-wc`, 'wc', 'no', x.wc === 'no', 'No', '', 'data-hook="assist"')}</div>${e.wc ? `<p class="ads-helper ads-helper--error" id="${idp}-wc-err">${ic('alert-diamond')}<span>${e.wc}</span></p>` : ''}${snote('Mobility device details (NMA-29) aren’t part of Sprint 4.')}</fieldset>`;
}
// One-page form (V1 and V3)
function assistForm(r, ri, o) {
  const src = o.mode === 'booking' ? assistRec(D().booking, assistWho(r).key).m : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src); r.u.mode = o.mode; }
  const x = r.u.d, e = r.u.err || {}, idp = o.idp;
  ref(o.mode === 'booking' ? '615' : '26', '27', '28', o.mode === 'booking' ? '995' : '995', '996');
  let branch = '';
  if (x.cat === 'disability') branch = disBlock(r, x, idp, e) + (x.dis.includes('mobility') ? wcBlock(r, x, idp, e) : '') + needsBlock(r, x, idp, false, e);
  if (x.cat === 'station') branch = needsBlock(r, x, idp, false, e);
  if (x.cat === 'companion') branch = (o.mode === 'booking' ? companionFor(r, x, idp, e) : '') + needsBlock(r, x, idp, false, e);
  if (o.mode === 'booking' && x.cat === 'companion') ref('997');
  if (x.cat === 'disability' || x.cat === 'station') snote('Service animal and mobility device forms (NMA-628, 629) and live station-assistance availability (NMA-620) aren’t designed in Sprint 4.');
  // Conditional changes are announced from one live region at the top of the form
  const note = r.u.assistNote ? `<div class="ads-alert ads-alert--info">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${esc(r.u.assistNote)}</p></div></div>` : '';
  return `<div class="assistform"><div class="assist-live" role="status" aria-live="polite">${note}</div>${catBlock(r, x, idp, o.mode, e, branch)}</div>`;
}
function assistSummaryItems(m) {
  if (!m.cat) return ['No assistance saved'];
  if (m.cat === 'none') return [AC.noneSummary];
  const out = [CATS[m.cat]];
  if (m.cat === 'station') out.push(AC.stationSummary);
  if (m.cat === 'companion' && m.for) out.push(`${AC.companionFor} ${travelerLabel(D().booking, m.for)}`);
  if (m.cat === 'disability') out.push(m.dis.map(k => DISABILITIES.find(x => x[0] === k)[1]).join(', '));
  if (m.wc === true) out.push('Bringing a wheelchair (wheelchair space)');
  if (m.wc === false) out.push('Not bringing a wheelchair');
  if (m.needs.length) out.push(m.needs.map(k => k === 'animal' && m.animal ? `Service animal (${m.animal})` : NEEDS.find(x => x[0] === k)[1]).join(', '));
  else if (m.cat !== 'station') out.push('No other needs');
  return out;
}
function assistSummaryCard(m, o) {
  return `<div class="ads-summary${o.editing ? ' ads-summary--editing' : ''}"><div class="ads-summary__head"><div><p class="ads-summary__title">${o.title}</p>${o.fromProfile ? '<span class="ads-lock">From your profile</span>' : ''}</div>${o.edit ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="${o.edit}">Edit</button>` : ''}</div><ul class="ads-summary__list">${assistSummaryItems(m).map(t => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul>${o.booking && m.cat === 'disability' ? `<p class="ads-body-small ads-text-secondary">${pwdApplies(D().booking) ? 'Passenger with disability discount applies to this booking.' : 'Passenger discounts aren’t used for this kind of booking, so the Passenger with disability discount doesn’t apply.'}</p>` : ''}</div>`;
}

// ---- Wizard (V2) ----
function wizSteps(x, mode) {
  const s = ['cat'];
  if (x.cat === 'disability') { s.push('dis'); if (x.dis.includes('mobility')) s.push('wc'); s.push('needs'); }
  if (x.cat === 'station' || x.cat === 'companion') s.push('needs');
  s.push('review');
  return s;
}
const STEP_NAMES = { cat: 'Type of help', dis: 'Disabilities', wc: 'Wheelchair', needs: 'Other needs', review: 'Review' };
function wizard(r, ri, mode, title) {
  const src = mode === 'booking' ? assistRec(D().booking, assistWho(r).key).m : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src); r.u.mode = mode; r.u.step = r.u.step || (src.cat ? 'review' : 'cat'); }
  const x = r.u.d, steps = wizSteps(x, mode); if (!steps.includes(r.u.step)) r.u.step = 'cat';
  const i = steps.indexOf(r.u.step), e = r.u.err || {}, idp = 'wz';
  ref(mode === 'booking' ? '615' : '26', '27', '28', '995', '996');
  let content = '';
  const why = t => `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${t}</span></p>`;
  if (r.u.step === 'cat') content = why(mode === 'booking' ? 'Your answer decides the next questions and whether the Passenger with disability discount applies.' : 'Saved assistance is used when you book. Choosing “I have a disability” also saves the Passenger with disability discount.') + catBlock(r, x, idp, mode, e) + (mode === 'profile' && x.cat ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-clear-draft">Clear selection</button>` : '');
  if (r.u.step === 'dis') content = why('Choose all that apply. Reduced mobility adds one question about wheelchair space.') + disBlock(r, x, idp, e);
  if (r.u.step === 'wc') content = why('Wheelchair space changes which seat options you can combine.') + wcBlock(r, x, idp, e);
  if (r.u.step === 'needs') content = needsBlock(r, x, idp, true);
  if (r.u.step === 'review') {
    const m = fromDraft(x);
    content = `${why(mode === 'booking' ? `Check ${esc(assistWho(r).label)}’s answers. You can change them before you find trains.` : 'Check your answers, then save them to your profile.')}${steps.filter(s => s !== 'review').map(s => `<div class="revrow"><div><span class="ads-caption ads-text-secondary">${STEP_NAMES[s]}</span><p class="ads-body-small">${esc(stepValue(s, m))}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="wiz-go" data-step="${s}" aria-label="Edit ${STEP_NAMES[s]}">Edit</button></div>`).join('')}${mode === 'profile' ? pwdPreview(m) : ''}`;
  }
  const count = `<div class="ads-steps__progress"><span class="ads-steps__count">Step ${i + 1} of ${steps.length} · ${STEP_NAMES[r.u.step]}</span><div class="ads-steps__bar" aria-hidden="true">${steps.map((s, j) => `<i class="${j <= i ? 'is-done' : ''}"></i>`).join('')}</div></div>`;
  const rail = `<ol class="ads-steps" aria-label="Steps">${['cat', 'dis', 'wc', 'needs', 'review'].map((s, j) => { const inS = steps.includes(s) || !x.cat, done = steps.includes(s) && steps.indexOf(s) < i, cur = s === r.u.step; return `<li class="ads-steps__item${done ? ' ads-steps__item--done' : ''}${!inS ? ' ads-steps__item--skipped' : ''}${!steps.includes(s) && !x.cat ? ' is-maybe' : ''}" ${cur ? 'aria-current="step"' : ''}><span class="ads-steps__marker" aria-hidden="true">${done ? ic('check', 'ads-icon--sm') : j + 1}</span><span>${STEP_NAMES[s]}<span class="ads-sr-only">${done ? ', done' : cur ? ', current' : !inS ? ', skipped, doesn’t apply' : ''}</span></span></li>`; }).join('')}</ol>`;
  const body = IPAD() ? `<div class="split2 split2--rail"><div class="split2__rail">${rail}</div><div class="split2__main">${count}${netAlert(r)}${content}</div></div>` : `${count}${netAlert(r)}${content}`;
  const last = r.u.step === 'review';
  const foot = `<div class="wizfoot">${i > 0 ? `<button class="ads-btn ads-btn--secondary" type="button" data-a="wiz-back">Back</button>` : ''}${last ? (mode === 'profile' ? busyBtn(r, 'Save to profile', 'Saving', 'data-a="assist-save"') : `<button class="ads-btn ads-btn--block" type="button" data-a="assist-confirm">Confirm</button>`) : `<button class="ads-btn ads-btn--block" type="button" data-a="wiz-next">Continue</button>`}</div>`;
  return { title, kind: 'push', body, foot, wide: IPAD() };
}
function stepValue(s, m) {
  if (s === 'cat') return m.cat ? CATS[m.cat] + (m.cat === 'companion' && m.for ? ` · ${travelerLabel(D().booking, m.for)}` : '') : 'Nothing selected';
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
  const who = assistWho(r).label;
  if (v2()) return wizard(r, ri, 'booking', `Assistance · ${who}`);
  return { title: 'Assistance', kind: 'push', body: `<p class="assist-who">For ${esc(who)}</p>${assistForm(r, ri, { mode: 'booking', idp: 'ba' })}`, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="assist-confirm" aria-label="Confirm assistance for ${esc(who)}">Confirm</button>`, banner: false };
};

// =====================================================================
// Find trains handoff (search results are out of scope)
// =====================================================================
SCR.handoff = () => {
  const b = D().booking;
  return { title: 'Search results', kind: 'push', banner: false, body: `<div class="handoff"><span class="handoff__tag">Prototype handoff</span><h3 class="ads-h4">Search results aren’t part of Sprint 4</h3><p class="ads-body-small">Fare Finder would pass this search to the results screen:</p>
    <dl class="handoff__list"><dt>Route</dt><dd>${stLabel(b.from)} → ${stLabel(b.to)}</dd><dt>Trip</dt><dd>${b.trip === 'rt' ? 'Round-trip' : 'One-way'}</dd><dt>Depart</dt><dd>${fmtWeekday(b.dep)}, ${fmtDate(b.dep)}</dd>${b.trip === 'rt' ? `<dt>Return</dt><dd>${fmtWeekday(b.ret)}, ${fmtDate(b.ret)}</dd>` : ''}${handoffExtra(b)}<dt>Assistance</dt><dd>${b.assistOn && travelerList(b).some(t => assistCat(b, t.key)) ? travelerList(b).filter(t => assistCat(b, t.key)).map(t => `${esc(t.label)}: ${esc(assistSummaryItems(assistRec(b, t.key).m).join(' · '))}`).join('<br>') : 'None requested'}</dd></dl>
    ${cartDemo(b)}
    <button class="ads-btn ads-btn--secondary" type="button" data-a="back">Back to Fare Finder</button></div>` };
};
// Simulated cart (prototype only, so the abandon-booking rule can be reviewed): one sample train for this search.
// Adding it doesn't change fares, availability or cart eligibility; it only marks that something is in the cart.
function cartDemo(b) {
  const cart = D().cart || [], label = `${stLabel(b.from)} → ${stLabel(b.to)}, ${fmtShort(b.dep)}`, inCart = cart.some(x => x.label === label);
  snote('Search results aren’t in Sprint 4. “Add to cart” is simulated so the abandon-booking confirmation can be reviewed: it appears only once something is in the cart.');
  return `<div class="cartdemo"><p class="ads-body-small-emphasis">Sample train · ${esc(label)}</p>${inCart ? `<p class="ads-helper ads-helper--success" role="status">${ic('check-circle', 'ads-icon--sm')}<span>In your cart</span></p>` : `<button class="ads-btn ads-btn--sm" type="button" data-a="cart-add" data-label="${esc(label)}">Add to cart</button>`}</div>`;
}
A['cart-add'] = t => { const d = D(); d.cart = (d.cart || []).concat({ label: t.dataset.label }); pendingFocus = '.cartdemo [role="status"], title'; toast('Added to your cart'); };

// =====================================================================
// Account sheet (IA: Profile + Guest Rewards card, Inbox, Travelers, Payment, Assistance, Quick settings)
// =====================================================================
SCR.account = (r, ri) => {
  const d = D();
  prov('Account › Quick settings › Clear recent stations: NMA-1004 says “Settings”, and the IA only has Quick settings here.');
  const recCount = recentList(d).length;
  ref('1004');
  const clearRow = recCount ? grow({ a: 'clear-recents', label: 'Clear recent stations', value: `${recCount} recent station${recCount > 1 ? 's' : ''}`, cls: 'ads-group__row--action', chev: false })
    : `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Clear recent stations</span><span class="ads-group__value">No recent stations</span></span></div>`;
  const quick = group('Quick settings', [
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Trip updates</span><span class="ads-group__value">Delays and track changes</span></span><span class="ads-switch"><input type="checkbox" role="switch" checked><span class="ads-switch__track"></span></span></label>`,
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Sign in with Face ID</span></span><span class="ads-switch"><input type="checkbox" role="switch" ${d.signedIn ? 'checked' : 'disabled'}><span class="ads-switch__track"></span></span></label>`,
    `<label class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Dark mode</span></span><span class="ads-switch"><input type="checkbox" role="switch" data-a="dark" ${TB.theme === 'dark' ? 'checked' : ''}><span class="ads-switch__track"></span></span></label>`,
    clearRow], `Recent stations are kept on this device for ${RECENT_DAYS} days and cleared when you sign out. Favorites stay.`);
  if (!d.signedIn) {
    return { title: 'Account', kind: 'root', body: `<div class="ads-summary"><p class="ads-summary__title">Sign in or join Guest Rewards</p><p class="ads-body-small">Sign in to see your profile, saved discounts and assistance.</p><button class="ads-btn ads-btn--block" type="button" data-a="sign-in">Sign in</button></div>${quick}`, banner: false };
  }
  const body = `<button class="loyalty" type="button" data-a="push" data-s="profile" aria-label="Profile: ${esc(d.profile.first)} ${esc(d.profile.last)}, Guest Rewards 7012 3456 78, Select Plus, 12,450 points">
      <span class="loyalty__top"><span><b>${esc(d.profile.first)} ${esc(d.profile.last)}</b><span class="loyalty__num">Guest Rewards · 7012 3456 78</span></span><span class="ads-badge">Select Plus</span></span><span><strong>12,450</strong> points · ≈ $360</span><span class="loyalty__link">Profile ${ic('chevron-right', 'ads-icon--sm')}</span></button>
    ${group('', [grow({ a: 'push', data: 'data-s="profile"', icon: 'person-circle', label: 'Profile', value: 'Personal details, discounts, assistance' })])}
    ${group('', [grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Points activity"}\'', icon: 'AGR_points-evergreen', label: 'Points activity' }), grow({ a: 'open-inbox-from-account', icon: 'email', label: 'Inbox', value: '2 new' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Travelers"}\'', icon: 'people', label: 'Travelers', value: '3 saved' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Payment"}\'', icon: 'payment-cash', label: 'Payment', value: 'Visa •••• 4821' })])}
    ${quick}
    <button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="sign-out">Sign out</button>`;
  return { title: 'Account', kind: 'root', body, banner: false };
};
// Sign out clears recent stations from this device (NMA-984); favorites are kept locally (NMA-118)
A['sign-out'] = () => dialog({ title: 'Sign out?', body: 'Recent stations will be cleared from this device. Your favorites stay.', returnFocus: '[data-a="sign-out"]',
  actions: [['Cancel', 'secondary', null], ['Sign out', 'primary', () => {
    const d = D(); d.signedIn = false; d.rec = []; d.booking = freshBooking(d); nav().sheet = null; pendingFocus = '[data-a="open-account"]';
    toast('Signed out. Recent stations were cleared.');
  }]] });
A.dark = t => { TB.theme = t.checked ? 'dark' : 'light'; pendingFocus = '[data-a="dark"]'; render(); };
A['sign-in'] = () => startVerify('sign-in');
A['open-inbox-from-account'] = (t, ri) => push('inbox', {}, +ri);
SCR.stub = r => ({ title: r.p.t, kind: 'push', banner: false, body: `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">${esc(r.p.t)} isn’t part of Sprint 4</p><p class="ads-body-small">This row keeps its place from the App Shell IA.</p></div>` });
SCR.inbox = () => ({ title: 'Notification inbox', kind: 'root', banner: false, body: group('', [grow({ label: 'Fall fares are here', value: 'Save up to 25% on Northeast Regional trips booked by Oct 31.' }), grow({ label: 'You’re close to Select Executive', value: 'Earn 2,550 more tier qualifying points this year.' })], 'The inbox isn’t part of Sprint 4.') });

// =====================================================================
// B. Profile
// =====================================================================
const PFIELDS = { mi: 'Middle initial', phone: 'Phone', address: 'Billing address', dob: 'Date of birth' };
const assistProfileValue = d => d.assist.cat === 'disability' ? 'I have a disability' : d.assist.cat === 'station' ? 'Station assistance' : 'Not added';
function profileRows(r, ri, opts = {}) {
  const d = D(), p = d.profile, cur = opts.current;
  const helper = t => v2() ? `<span class="rowhint">${t}</span>` : '';
  const miRow = p.mi ? `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Middle initial</span><span class="ads-group__value">${esc(p.mi)}</span></span>${lockChip}</div>`
    : grow({ a: 'edit', data: 'data-field="mi"', label: 'Middle initial', value: v2() ? 'Not added · can be added once' : 'Add', empty: !v2(), current: cur === 'mi', k: 'row-mi' });
  return `${group('Name', [
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Name</span><span class="ads-group__value">${esc(p.first)} ${p.mi ? esc(p.mi) + '. ' : ''}${esc(p.last)}</span></span>${lockChip}</div>`,
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Guest Rewards number</span><span class="ads-group__value">7012 3456 78</span></span>${lockChip}</div>`, miRow],
    'Need to change your name? Call us at <a class="ads-link ads-link--sm" href="tel:18003075000">1-800-307-5000</a>')}
    ${group('Contact', [grow({ a: 'change-email', label: 'Email', value: esc(p.email), meta: 'Change', k: 'row-email' }), grow({ a: 'edit', data: 'data-field="phone"', label: 'Phone', value: esc(fmtPhone(p.phone)), current: cur === 'phone', k: 'row-phone' }), grow({ a: 'edit', data: 'data-field="address"', label: 'Billing address', value: p.address.street ? fmtAddress(p.address) : 'Add', empty: !p.address.street, current: cur === 'address', k: 'row-address' }), grow({ a: 'edit', data: 'data-field="dob"', label: 'Date of birth', value: p.dob || (v2() ? 'Optional · not added' : 'Add'), empty: !p.dob, current: cur === 'dob', k: 'row-dob' })])}
    ${group('Discounts', [grow({ a: 'push', data: 'data-s="discounts"', label: 'Passenger discounts', value: d.discount.type === 'none' ? 'No discount preference' : DISCOUNTS[d.discount.type].label, k: 'row-disc' })])}
    ${group('Assistance', [grow({ a: 'push', data: 'data-s="assist-profile"', label: 'Assistance requests', value: assistProfileValue(d), k: 'row-assist' })], 'Used for you as Traveler 1 when you book. Changes for one trip don’t change it.')}
    ${group('Amtrak employee', [grow({ a: 'edit', data: 'data-field="employee"', label: 'Employee pass', value: esc(empSummary(d.employee)), current: cur === 'employee', k: 'row-employee' })], 'For employees, retirees, spouses and dependents. Used for Pass Rider booking.')}
    ${group('Coupons', [grow({ a: 'push', data: 'data-s="coupons"', label: 'My coupons', value: `${d.coupons.length} available${d.coupons.some(soon) ? ' · one expires soon' : ''}`, k: 'row-coupons' })])}`;
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
    return `<div class="ads-summary${editing ? ' ads-summary--editing' : ''}" id="card-${key}"><div class="ads-summary__head"><div><p class="ads-summary__title">${title}</p>${!editing || IPAD() ? `<p class="ads-body-small ads-text-secondary">${value}</p>` : ''}</div>${locked ? lockChip : `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="edit" data-field="${key}" data-k="row-${key}" aria-expanded="${editing}">${editing ? 'Close' : ((key === 'mi' || key === 'dob') && !p[key]) || (key === 'address' && !p.address.street) || (key === 'employee' && !D().employee) ? 'Add' : 'Edit'}</button>`}</div>${ed}</div>`;
  };
  const main = `<div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">${esc(p.first)} ${p.mi ? esc(p.mi) + '. ' : ''}${esc(p.last)}</p><p class="ads-body-small ads-text-secondary">Guest Rewards 7012 3456 78</p></div>${lockChip}</div><p class="ads-body-small">Need to change your name? Call us at <a class="ads-link ads-link--sm" href="tel:18003075000">1-800-307-5000</a></p></div>
    ${card('mi', 'Middle initial', p.mi ? esc(p.mi) : 'Not added. You can add it once.', !!p.mi)}
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Email</p><p class="ads-body-small ads-text-secondary">${esc(p.email)}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="change-email">Change</button></div></div>
    ${card('phone', 'Phone', esc(fmtPhone(p.phone)))}${card('address', 'Billing address', fmtAddress(p.address))}${card('dob', 'Date of birth', p.dob || 'Optional. Not added.')}
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Passenger discounts</p><p class="ads-body-small ads-text-secondary">${d.discount.type === 'none' ? 'No discount preference' : DISCOUNTS[d.discount.type].label}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="push" data-s="discounts">Edit</button></div></div>
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Assistance requests</p><p class="ads-body-small ads-text-secondary">${esc(assistProfileValue(d))}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="push" data-s="assist-profile" data-k="row-assist">${d.assist.cat ? 'Edit' : 'Add'}</button></div></div>
    ${card('employee', 'Amtrak employee pass', esc(empSummary(d.employee)))}
    <div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">My coupons</p><p class="ads-body-small ads-text-secondary">${d.coupons.length} available${d.coupons.some(soon) ? ' · one expires soon' : ''}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="push" data-s="coupons" data-k="row-coupons">View</button></div></div>`;
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
    <div class="tworow">${stateSel}${fieldHtml({ id: 'ad-zip', f: 'zip', label: zipLabel, value: x.zip, req: true, autocomplete: 'postal-code', inputmode: cty === 'US' ? 'numeric' : 'text', help: cty === 'US' ? '5 digits, or ZIP+4.' : cty === 'CA' ? 'For example, K1A 0B1.' : '', err: e.zip, cls: 'field--narrow' })}</div>
    ${a.street ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm addr-remove" type="button" data-a="addr-remove">Remove billing address</button>` : ''}`;
  return { body, saveDisabled: JSON.stringify(x) === JSON.stringify(a), noSaveWhy: a.street ? 'Make a change to save.' : 'Enter an address to add it.', saveLabel: a.street ? 'Save' : 'Add' };
};
// NMA-23: delete, with confirmation; the row then offers Add
A['addr-remove'] = (t, ri) => dialog({ title: 'Remove billing address?', body: 'It will be removed from your profile. You can add one again at any time.', returnFocus: '[data-a="addr-remove"]',
  actions: [['Cancel', 'secondary', null], ['Remove', 'destructive', () => { const r = edRoute(ri); runSave(r, () => { D().profile.address = { country: 'US', street: '', apt: '', city: '', state: '', zip: '' }; }, () => afterSave(ri, 'Billing address removed', 'address')); }]] });
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
  if (x && !validDob(x)) { r.u.err = { dob: 'Enter a valid date as MM/DD/YYYY' }; pendingFocus = '#ed-dob'; render(); return; }
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
    return choice('radio', 'disc', 'type', k, x.type === k, DISCOUNTS[k].label, k === 'pwd' && hasDis ? 'Saved because your assistance says you have a disability.' : DISCOUNTS[k].info, extra);
  };
  let cond = '';
  if (x.type === 'rpa') cond = fieldHtml({ id: 'rpa-id', f: 'rpa', label: 'Membership ID', type: 'tel', value: x.rpa, digits: 10, req: true, help: '6 to 10 digits, no spaces.', err: e.rpa });
  if (x.type === 'pwd' && !hasDis) cond = `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">Complete assistance first</p><p class="ads-alert__description ads-body-small">This discount is saved when your assistance says “I have a disability”. ${v2() ? 'We’ll bring you back here when you’re done.' : ''}</p><div><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="go-assist">Go to assistance</button></div></div></div>`;
  const body = `${intro('Choose one discount. It will be pre-selected when you book. Senior and Youth discounts are chosen when you book.')}${netAlert(r)}
    <fieldset class="ads-fieldset"><legend class="ads-field-label">Discount preference</legend><div class="ads-fieldset__options">${['none', 'military', 'rpa', 'pwd'].map(k => opt(k) + (x.type === k && cond ? `<div class="condfield">${cond}</div>` : '')).join('')}</div></fieldset>
    ${q(9)}<button class="ads-link ads-link--sm linkbtn" type="button" data-a="info" data-topic="rules">Passenger types and discount rules</button>`;
  const changed = x.type !== d.discount.type || (x.type === 'rpa' && x.rpa !== d.discount.rpa);
  if (v3()) return { title: 'Passenger discounts', kind: 'push', body, foot: busyBtn(r, 'Save', 'Saving', `data-a="disc-save" ${changed ? '' : 'disabled'}`), offlineText: 'You’re seeing your saved preference. Saving needs a connection.' };
  return { title: 'Passenger discounts', kind: 'editor', save: { a: 'disc-save', disabled: !changed, busy: !!r.u.busy }, body: body + (!changed ? `<p class="ads-helper" id="nosave-${ri}">Make a change to save.</p>` : ''), offlineText: 'You’re seeing your saved preference. Saving needs a connection.' };
};
A['go-assist'] = (t, ri) => { const sh = sheet(); const dr = sh.stack[+ri]; dr.u.dirty = false; sh.stack = [sh.stack[0], R('profile'), R('assist-profile', { returnTo: 'discounts' })]; pendingFocus = 'title'; render(); };
A['disc-save'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, d = D();
  if (x.type === 'rpa' && !/^\d{6,10}$/.test(x.rpa || '')) { r.u.err = { rpa: 'Check your membership number. Maximum 10 digits without spaces' }; pendingFocus = '#rpa-id'; render(); return; }
  if (x.type === 'pwd' && d.assist.cat !== 'disability') { r.u.alert = { kind: 'custom', tone: 'error', title: 'Passenger with disability can’t be saved yet', text: 'Save assistance with “I have a disability” first.' }; pendingFocus = '[data-a="go-assist"]'; render(); return; }
  r.u.err = {};
  runSave(r, () => { d.discount = { type: x.type, rpa: x.type === 'rpa' ? x.rpa : '' }; d.booking.disc = ['military', 'rpa'].includes(x.type) ? x.type : 'none'; }, () => { r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-k="row-disc"]'; toast('Discount preference saved'); });
};
SCR.rules = () => {
  ref('566');
  const item = n => `<details class="ads-accordion ads-accordion--sm"><summary>${n}${ic('chevron-down')}</summary><div class="ads-accordion__panel"><dl class="rules"><dt>Age criteria</dt><dd class="pending">Content pending</dd><dt>Applicable discount</dt><dd class="pending">Content pending</dd><dt>Restrictions</dt><dd class="pending">Content pending</dd></dl></div></details>`;
  return { title: 'Discount rules', kind: 'push', offlineText: 'Rules saved on this device are shown. Links need a connection.', body: `${RULE_GROUPS.map(([g, items]) => `<div class="ads-group"><h3 class="ads-group__title">${g}</h3><div class="ads-group__body rulesbody">${items.map(item).join('')}</div></div>`).join('')}` };
};

// =====================================================================
// D. Profile assistance (NMA-26, 27, 28)
// =====================================================================
function pwdPreview(m) {
  const d = D(), cur = d.discount.type;
  if (m.cat === 'disability' && cur !== 'pwd') return `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">Saving also sets your discount to <b>Passenger with disability</b>${cur !== 'none' ? `, replacing ${DISCOUNTS[cur].label}` : ''}. ${q(9)}</p></div></div>`;
  if (m.cat !== 'disability' && cur === 'pwd') return `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">Saving removes your <b>Passenger with disability</b> discount. ${q(9)}</p></div></div>`;
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
    const before = d.discount.type; let msg = m.cat ? 'Your assistance is saved to your profile.' : 'Assistance cleared. Nothing is saved.';
    if (m.cat === 'disability' && before !== 'pwd') { d.discount = { type: 'pwd', rpa: '' }; msg += ` Your discount is now Passenger with disability${before !== 'none' ? `, which replaced ${DISCOUNTS[before].label}` : ''}.`; }
    if (m.cat !== 'disability' && before === 'pwd') { d.discount = { type: 'none', rpa: '' }; msg += ' The Passenger with disability discount was removed.'; }
    d.assist = m; if (!d.booking.assistDone || d.booking.assistFromProfile) { d.booking.assist = clone(m); d.booking.assistDone = !!m.cat; d.booking.assistOn = !!m.cat; d.booking.assistFromProfile = !!m.cat; d.booking.ask = m.cat ? { 'adult-1': true, 'pr-you': true } : {}; }
    return msg;
  }, msg => { r.u.editing = false; r.u.d = undefined; r.u.dirty = false; r.u.step = null; r.u.savedMsg = msg; r.u.returnTo = r.p.returnTo; pendingFocus = 'title'; render(); });
};

// =====================================================================
// E. Verification (one reusable view, NMA-980 / NMA-21)
// =====================================================================
SCR.verify = (r) => {
  const c = nav().cover, d = D(), x = c.u.d, e = c.u.err || {}, step = c.steps[c.i];
  ref('980'); if (c.trigger === 'change-email') ref('21');
  const demo = `<p class="pdemo">${ic('info-circle', 'ads-icon--sm')}<span>Demonstration. ${c.trigger === 'change-email' ? 'Change-email verification' : c.trigger === 'sign-in' ? 'Sign-in on a device that isn’t remembered' : 'Verifying an unverified account before an account change'}. The channel and reauthentication policy aren’t approved. ${q(8)}${c.trigger === 'change-email' ? q(15) : ''}</span></p>`;
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
    body = `${prog}<p class="ads-body-small">Demo sign-in for ${esc(d.profile.first)} ${esc(d.profile.last)}. The details are filled in.</p>${fieldHtml({ id: 'vf-email', f: 'email', label: 'Email or Guest Rewards number', value: x.email, autocomplete: 'username', req: true })}${fieldHtml({ id: 'vf-pw', f: 'password', label: 'Password', type: 'password', value: x.password || 'demo-pass', autocomplete: 'current-password', req: true })}<p class="ads-body-small ads-text-secondary">This device isn’t remembered, so we’ll ask for a code.</p>`;
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
    const err = st === 'invalid' ? 'This code doesn’t match. Check it and try again, or request a new code.' : st === 'expired' ? 'This code has expired. Request a new code.' : '';
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
