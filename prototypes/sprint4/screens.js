/* Sprint 4 prototype: screens. Shared pieces, arranged differently by each version. */
const v1 = () => TB.v === 1, v2 = () => TB.v === 2, v3 = () => false /* Concept 3 retired */, v4 = () => TB.v === 4;
// Archived Concept 4 uses its own booking sheets (Concept 3 was retired: one New booking design)
const rich = () => TB.v >= 3;

// ---------- Small renderers ----------
function fieldHtml(o) {
  const id = o.id, err = o.err;
  const marker = o.req ? '<span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span>' : o.opt ? '<span class="ads-field__marker ads-field__marker--optional">Optional</span>' : '';
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
  if (TB.v === 1) return false; // Master Screens (iOS Tablet): one centred modal; pushed screens replace the parent, never sit beside it
  if (v3()) return parent.s === 'ff' && child.s === 'traveler'; // Overview on iPad: the booking overview stays beside the traveler being edited
  if (v2() && (child.s === 'assist' || child.s === 'assist-profile')) return false;
  const pairs = { ff: ['stations', 'calendar', 'travelers', 'assist', 'code', 'traveler'], travelers: ['assist'], traveler: ['assist'], account: ['profile', 'assist-profile', 'stub'], discounts: ['rules'] }; // Profile edits are third-level screens of their own, never beside the list
  return (pairs[parent.s] || []).includes(child.s);
};
const SPLIT_SELF = r => TB.v !== 1 && ((v3() && ['profile', 'assist-profile'].includes(r.s)) || (v2() && ['assist', 'assist-profile'].includes(r.s)));

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
  const side = (f, label) => { const c = b[f], s = c && ST[c]; return { label, code: c || '', city: s ? `${s.city}, ${s.st}` : '', facility: s ? s.name : '', placeholder: f === 'from' ? 'Select departure station' : 'Select arrival station', errId: `ff-${f}-err`, expanded: open === f, attrs: `data-a="pick-station" data-field="${f}" id="ff-${f}"` }; };
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
  const val = it === 'corporate' ? '1 adult · You' : it === 'pr' ? (b.prType ? prSummary(b, d) : 'Choose Business or Leisure') : paxSummary(b);
  const sub = [it === 'corporate' ? 'Corporate bookings are for you only' : it === 'pr' ? (b.prType ? `Pass Rider · ${b.prType === 'business' ? 'Business' : 'Leisure'}` : 'Pass Rider') : '', travelerChoices(b)].filter(Boolean).join(' · ');
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
// Booking type: one switch, styled like Pay with points (pointsRow). TripLink members get "TripLink corporate booking",
// Pass Rider members "Pass Rider booking"; it's on by default (NMA-622 AC2, NMA-623 AC2) and turning it off books
// regular fares. A member is never both. Business or Leisure is chosen in Traveler selection. Both switches have a
// description line in the same style; a Pass Rider who can't start Pass Rider travel (a dependent 15 or younger) sees no switch.
function modesV1(r, b) {
  const d = D(); if (!d.signedIn || (!d.triplink && !d.passrider)) return '';
  const tl = !!d.triplink, sp = tl ? 'corporate' : 'pr', can = tl ? { ok: true } : prCanStart(d);
  if (tl) ref('622'); else ref('623', '1016');
  if (!can.ok) { snote('A dependent 15 or younger can’t book Pass Rider travel on their own (NMA-1017), so New booking shows no Pass Rider switch and books regular fares.'); return ''; }
  const on = b.intent === sp;
  if (on && tl) q(12);
  const row = pointsRow({ id: `ff-mode-${sp}`, title: tl ? 'TripLink corporate booking' : 'Pass Rider booking', sub: on ? (tl ? 'Corporate fares for you only. Points, passenger discounts and codes aren’t used.' : 'Employee pass travel for you and eligible family. Points, passenger discounts and codes aren’t used.') : 'Off: regular fares, with points, passenger discounts and codes.', checked: on, attrs: `data-a="mode-toggle" data-v="${sp}"` });
  return `<div class="v1modes v1modes--switch">${row}${b.modeNote ? `<p class="ads-helper" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.modeNote}</span></p>` : ''}</div>`;
}
A['mode-toggle'] = t => {
  const d = D(), b = d.booking, v = t.dataset.v; b.modeNote = null;
  if (t.checked && v === 'pr' && !prCanStart(d).ok) { b.modeNote = prCanStart(d).text; pendingFocus = '#' + t.id; render(); return; }
  setIntent(b, t.checked ? v : 'personal'); pendingFocus = '#' + t.id; render();
};
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
  return `${needType ? `<p class="ads-helper findwhy" id="ff-find-why">Choose Business or Leisure in ${prTypeInDropdown() ? 'Booking type' : 'Travelers'} to find trains.</p>` : ''}<button class="ads-btn ads-btn--block" type="button" data-a="find-trains" ${off ? `disabled${needType ? ' aria-describedby="ff-find-why"' : ''}` : ''}>Find trains</button>`;
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
  const body = `<div class="ads-bookingsheet__form">${tripSeg()}${modesV1(r, b)}${ffNotice(b)}${routeField(r, ri)}${dateFields(r)}${travelersRow(r)}${std ? codeRow(r, b) : `<p class="ss-note v1modes__none">Points, passenger discounts and coupon or promotion codes aren’t used for ${intentOf(b) === 'corporate' ? 'corporate bookings' : 'Pass Rider travel'}.</p>`}${netAlert(r)}</div>`;
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
// Amtrak.com search logic (NMA-600): up to 3 characters lists stations as before; 4 or more lists matching stations, then
// Locations (cities, states and provinces, landmarks, ZIP codes, shown by name only); choosing one lists stations closest first.
const SS_PLACE_MIN = 4;
const avgGeo = list => { const g = list.map(s => geoOf(s.code)).filter(Boolean); return g.length ? { lat: g.reduce((t, x) => t + x.lat, 0) / g.length, lon: g.reduce((t, x) => t + x.lon, 0) / g.length } : null; };
let PLACES_CACHE = null;
function allPlaces() {
  if (PLACES_CACHE) return PLACES_CACHE;
  const out = [], byCity = {}, byState = {};
  STATIONS.forEach(s => { (byCity[s.city + '|' + s.st] ||= []).push(s); (byState[s.state] ||= []).push(s); });
  Object.entries(byCity).forEach(([k, list]) => { const [city, st] = k.split('|'), cc = typeof CITY_CENTER !== 'undefined' && CITY_CENTER[k], g = cc ? { lat: cc[0], lon: cc[1] } : avgGeo(list); if (g) out.push({ kind: 'city', label: `${city}, ${st}`, sub: `City · ${list[0].state}`, match: [city], lat: g.lat, lon: g.lon }); });
  EXTRA_CITIES.forEach(([city, st, state, lat, lon]) => out.push({ kind: 'city', label: `${city}, ${st}`, sub: `City · ${state}`, match: [city], lat, lon }));
  Object.entries(byState).forEach(([state, list]) => { const g = avgGeo(list), prov = ['ON', 'QC', 'BC'].includes(list[0].st); if (g) out.push({ kind: 'state', label: state, sub: prov ? 'Province' : 'State', match: [state], lat: g.lat, lon: g.lon, st: list[0].st }); });
  if (typeof LANDMARKS !== 'undefined') LANDMARKS.forEach(l => out.push({ kind: 'landmark', label: l.name, sub: 'Landmark', match: [l.name, ...l.aka], lat: l.lat, lon: l.lon, online: true }));
  STATIONS.forEach(s => { const g = geoOf(s.code); if (g && s.zip && !EXTRA_ZIPS.some(z => z[0] === s.zip)) out.push({ kind: 'zip', label: s.zip, sub: `ZIP code · ${s.city}, ${s.st}`, match: [s.zip], lat: g.lat, lon: g.lon, online: true }); });
  EXTRA_ZIPS.forEach(([zip, where, lat, lon]) => out.push({ kind: 'zip', label: zip, sub: `ZIP code · ${where}`, match: [zip], lat, lon, online: true }));
  return (PLACES_CACHE = out.filter((p, i) => out.findIndex(o => o.kind === p.kind && o.label === p.label) === i));
}
const PLACE_ORDER = { city: 0, state: 1, landmark: 2, zip: 3 }, PLACE_ICON = { city: 'map-pin', state: 'map', landmark: 'map-pin', zip: 'map-pin' };
function searchPlaces(qs, offline) {
  const q = qs.trim().toLowerCase(), hit = t => t.toLowerCase().startsWith(q) || words(t).some(w => w.startsWith(q)) || t.toLowerCase().includes(' ' + q);
  return allPlaces().filter(p => !(offline && p.online) && p.match.some(hit)).sort((a, b) => PLACE_ORDER[a.kind] - PLACE_ORDER[b.kind] || a.label.localeCompare(b.label)).slice(0, 12);
}
// Stations closest to a chosen place: in that state or province for a state; otherwise within 100 miles (or the 5 nearest)
function stationsNear(p) {
  let list = STATIONS.map(s => ({ s, mi: geoOf(s.code) ? miles(p, geoOf(s.code)) : Infinity })).filter(x => x.mi < Infinity);
  if (p.kind === 'state') list = list.filter(x => x.s.st === p.st);
  list.sort((a, b) => a.mi - b.mi);
  const close = p.kind === 'state' ? list : list.filter(x => x.mi <= 100);
  return { list: (close.length ? close : list.slice(0, 5)).slice(0, 12), far: !close.length };
}
function stationRow(s, field, sec, near) {
  const d = D(), ctx = curCtx(), tg = selTarget(ctx), fav = d.fav.includes(s.code), cur = tg[field] === s.code;
  const rec = d.rec.find(x => x.c === s.code);
  const when = ''; // recents show the station only, as in the designs (Figma 3295:51259); NMA-984 doesn't ask for when it was used
  const blocked = ctx === 'ff' && s.tag && autoTrainBlocked();
  const b = tg, role = b.from === s.code ? 'Departure' : b.to === s.code ? 'Arrival' : '';
  const roleTag = role && !cur ? `<span class="ads-badge ss-roletag">${role === 'Departure' ? 'Departure station' : 'Arrival station'}</span>` : ''; // the other end of the trip
  return `<li class="ads-stationrow${role && !cur ? ' is-other' : ''}" ${cur ? 'aria-current="true"' : ''}><button class="ads-stationrow__select" type="button" data-a="choose-station" data-code="${s.code}" data-field="${field}" data-k="st-${sec}-${s.code}"${near ? ` data-mi="${near.mi.toFixed(1)}" data-rank="${near.rank}"` : ''} ${blocked ? 'disabled' : ''}><span class="ads-stationrow__code">${s.code}</span><span class="ads-stationrow__text"><span class="ads-stationrow__name">${s.city}, ${s.st}${roleTag}</span><span class="ads-stationrow__detail">${s.name}${when}</span>${near ? `<span class="ads-stationrow__detail ss-dist"><span aria-hidden="true">${fmtMi(near.mi, near.approx)}</span><span class="ads-sr-only">, ${spokenMi(near.mi, near.approx)}</span></span>` : ''}${s.tag ? `<span class="ads-badge ads-badge--info ads-stationrow__tag">${s.tag} only</span>` : ''}${blocked ? '<span class="ads-stationrow__detail">Auto Train isn’t available for Pass Rider Business travel</span>' : ''}</span>${cur ? `${ic('check', 'ss-check')}<span class="ads-sr-only">, selected</span>` : ''}</button><button class="ads-stationrow__star ss-details" type="button" data-a="info" data-topic="station:${s.code}" data-k="det-${sec}-${s.code}" aria-label="Station details: ${s.city}, ${s.code}">${ic('info-circle')}</button><button class="ads-stationrow__star" type="button" data-a="fav" data-code="${s.code}" aria-pressed="${fav}" aria-label="Save ${s.city}, ${s.code}" data-k="fav-${sec}-${s.code}">${ic(fav ? 'bookmark-filled' : 'bookmark')}</button></li>`;
}
function stationSearch(r, ri, field, inline) {
  const d = D(); r.u.d = r.u.d || {};
  const qv = r.u.d.q || '';
  const favs = favList(d).map(c => ST[c]);
  const recs = recentList(d).map(x => ST[x.c]);
  ref('600', '118', '984');
  const focus = stationFocus() && !inline;
  const root = +ri === 0, lead = focus ? (root ? `<button class="ss-back" type="button" data-a="close" aria-label="Close station search">${ic('arrow-left')}</button>` : `<button class="ss-back" type="button" data-a="back" aria-label="Back to ${esc(titleOf(sheet().stack[+ri - 1], +ri - 1))}">${ic('arrow-left')}</button>`) : ic('search');
  const search = `<div class="ss-search${focus ? ' ss-search--focus' : ''}"><label class="ads-sr-only" for="ss-q">Search ${r.p.ctx === 'ts' || !selPair() ? '' : field === 'from' ? 'departure ' : 'arrival '}stations</label><div class="ads-control ads-control--pill">${lead}<input id="ss-q" type="search" data-f="q" data-live data-nodirty value="${esc(qv)}" placeholder="${focus ? (r.p.ctx === 'ts' ? 'Search stations' : field === 'from' ? 'Search departure stations' : 'Search arrival stations') : 'City, station, code or ZIP'}" autocomplete="off">${qv ? `<button class="ads-control__clear" type="button" data-a="ss-clear" aria-label="Clear search">${ic('close', 'ads-icon--sm')}</button>` : ''}</div>${q(1)}${q(2)}</div>`;
  // Heading with Back above the List / Map tabs (iPhone; iPad uses the navigation bar), then the search field in
  // List view only, then Nearby stations, Saved and recents. Map view: heading, tabs and the map.
  const upSearch = search.replace(' ss-search--focus', '').replace('class="ss-search', 'class="ss-search ss-search--upd').replace(lead, ic('search')).replace('placeholder="City, station, code or ZIP"', `placeholder="${r.p.ctx === 'ts' ? 'Search stations' : field === 'from' ? 'Search departure stations' : 'Search arrival stations'}"`);
  // Figma Sprint 4 node 3295:51259: chevron Back, centered "Select station" (the field being edited is named for
  // screen readers and shown in the From / To group below)
  const backBtn = root ? `<button class="ads-icon-btn ss-head__back" type="button" data-a="close" aria-label="Close station search">${ic('chevron-left')}</button>` : `<button class="ads-icon-btn ss-head__back" type="button" data-a="back" aria-label="Back to ${esc(titleOf(sheet().stack[+ri - 1], +ri - 1))}">${ic('chevron-left')}</button>`;
  const head = focus ? `<div class="ss-head ss-head--c">${backBtn}<h2 class="ss-head__title" id="t-${ri}" tabindex="-1" data-title>${selHeading(field, r.p.ctx)}<span class="ads-sr-only">${r.p.ctx === 'ts' || !selPair() ? '' : field === 'from' ? ', departure' : ', arrival'}</span></h2><span aria-hidden="true"></span></div>` : '';
  const tabs = selViewTabs(qv.trim() && r.u.view !== 'map' ? Object.assign({}, r, { u: Object.assign({}, r.u, { view: 'list' }) }) : r);
  if (r.u.view === 'map') return head + tabs + '<!--why-->' + `<p class="ads-sr-only" role="status">${esc(r.u.selLive || '')}</p>` + mapView(r, ri, field);
  let sq = upSearch.replace('ads-control ads-control--pill', 'ads-control').replace(/placeholder="[^"]*"/, `placeholder="${r.p.ctx === 'ts' || !selPair() ? 'Search stations' : field === 'from' ? 'Search departure stations' : 'Search arrival stations'}"`).replace('class="ss-search ss-search--upd', 'class="ss-search ss-search--upd ss-search--sq');
  // iPhone: the From / To card collapses while search is active (iOS keyboard up). Layout A: card above the field;
  // layout B: field above the card (Prototype controls › Station search layout).
  const grp = r.p.ctx === 'ts' || !selPair() ? '' : focus ? `<div class="ss-collapse"${r.u.kb ? ' inert' : ''}><div>${selGroup(r, field)}</div></div>` : selGroup(r, field);
  if (focus && r.u.kb) { const at = sq.lastIndexOf('</div>'); sq = sq.slice(0, at) + '<button class="ads-btn ads-btn--tertiary ss-cancel" type="button" data-a="ss-cancel">Cancel</button>' + sq.slice(at); }
  if (focus) snote('iOS build: VoiceOver’s escape gesture (two-finger scrub) and Esc on a hardware keyboard end search, like Cancel. The card folds when the field has focus, so it also works with a hardware keyboard and no on-screen keyboard.');
  let h = head + tabs + '<!--why-->' + `<div class="ss-top"><p class="ads-sr-only" role="status">${esc(r.u.selLive || '')}</p>${grp + sq}`;
  const PANEL = '<div id="ss-panel" role="tabpanel" aria-labelledby="ss-tab-list" class="ss-listpanel">';
  if (qv.trim()) h += '</div>' + PANEL; // the top block ends with the search field while results show
  r.u.fullFoot = false;
  if (qv.trim()) {
    const offline = V().net === 'offline', qt = qv.trim(), place = r.u.place && r.u.placeQ === qt ? r.u.place : null;
    const offNote = offline && qt.length >= SS_PLACE_MIN ? `<p class="ads-helper ss-lm-off" role="status">${ic('alert-triangle', 'ads-icon--sm')}<span>Searching by landmark or ZIP code needs a connection. You can still search by station, city, state or province.</span></p>` : '';
    if (place) { // a place was chosen: stations closest to it
      const { list, far } = stationsNear(place);
      h += `<div class="ss-place" role="status"><p class="ss-place__t" tabindex="-1">${ic(PLACE_ICON[place.kind], 'ads-icon--sm')}<span>Stations ${place.kind === 'state' ? 'in' : 'near'} <b>${esc(place.label)}</b>${place.kind === 'zip' ? ` <span class="ads-text-secondary">(${esc(place.sub.replace('ZIP code · ', ''))})</span>` : ''}, closest first</span></p><button class="ads-link ads-link--sm" type="button" data-a="ss-place-clear">Change</button></div>${far ? `<p class="ads-helper">${ic('info-circle', 'ads-icon--sm')}<span>No stations within 100 miles. These are the closest.</span></p>` : ''}<ul class="stlist" aria-label="Stations ${place.kind === 'state' ? 'in' : 'near'} ${esc(place.label)}, closest first">${list.map((x, k) => stationRow(x.s, field, 'pl' + k, { mi: x.mi, rank: k + 1 })).join('')}</ul>`;
    } else if (qt.length < SS_PLACE_MIN) { // up to 3 characters: stations, as before
      const res = searchStations(qv);
      if (res.length) h += `<p class="ads-sr-only" role="status">${res.length} result${res.length > 1 ? 's' : ''}</p><ul class="stlist" aria-label="Search results">${res.slice(0, 25).map(s => stationRow(s, field, 'res')).join('')}</ul>`;
      else if (qt.length > 2) h += `<div class="ss-empty" role="status"><b>No results for “${esc(qt)}”</b><span>Check the spelling, or search by city, station code, ZIP code${offline ? '' : ' or landmark'}.</span></div>`;
      else h += `<p class="ss-empty" role="status">Keep typing to search.</p>`;
    } else { // 4 or more: places to choose from, then stations whose own name matches
      const places = searchPlaces(qv, offline); r.u.sugg = places;
      const ql = qt.toLowerCase(), nm = t => t.toLowerCase().startsWith(ql) || words(t).some(w => w.startsWith(ql));
      const named = STATIONS.filter(st => nm(st.name) || st.aliases.some(nm)).sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)); // stations whose own name matches (Moynihan, 30th Street, Penn)
      const n = places.length + named.length;
      const placeH = places.length ? `<div class="stsection ss-places"><div class="ads-stationrow__header"><span>Locations</span></div><ul class="ss-placelist" aria-label="Locations. Choose one to see the closest stations">${places.map((p, k) => `<li><button class="ss-placerow" type="button" data-a="ss-place" data-i="${k}">${ic(PLACE_ICON[p.kind])}<span class="ss-placerow__text"><span class="ss-placerow__name">${esc(p.label)}</span></span>${ic('chevron-right', 'ads-icon--sm')}</button></li>`).join('')}</ul></div>` : '';
      const namedH = named.length ? `<div class="stsection"><div class="ads-stationrow__header"><span>Stations</span></div><ul class="stlist" aria-label="Stations">${named.slice(0, 10).map(s => stationRow(s, field, 'res')).join('')}</ul></div>` : '';
      if (n) h += `<p class="ads-sr-only" role="status">${named.length ? `${named.length} station${named.length > 1 ? 's' : ''}` : ''}${places.length && named.length ? ' and ' : ''}${places.length ? `${places.length} location${places.length > 1 ? 's' : ''}` : ''}</p>${namedH}${placeH}${offNote}`;
      else h += `<div class="ss-empty" role="status"><b>No results for “${esc(qt)}”</b><span>Check the spelling, or search by city, state, station, ZIP code${offline ? '' : ' or landmark'}.</span></div>${offNote}`;
    }
    return h + q(3) + '</div>';
  }
  selNotes(r.p.ctx || 'ff');
  const [nearTop, nearList] = nearSection(r, ri).split('<!--near-split-->');
  h += nearTop + '</div>' + PANEL + nearList; // top block: group, search, Nearby stations; then the lists
  if (favs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Saved</span></div><ul class="stlist" aria-label="Saved stations">${favs.map(s => stationRow(s, field, 'fav')).join('')}</ul></div>`;
  if (recs.length) h += `<div class="stsection"><div class="ads-stationrow__header"><span>Recents</span><button class="ads-link ads-link--sm ss-clearrec" type="button" data-a="clear-recents" data-ret="#ss-q" aria-label="Clear recent stations">Clear recents</button></div><ul class="stlist" aria-label="Recent stations">${recs.map(s => stationRow(s, field, 'rec')).join('')}</ul></div>`;
  if (d.rec.some(x => x.d > RECENT_DAYS)) tip(`BAL was chosen 12 days ago, so it has dropped out of recents (${RECENT_DAYS}-day retention, set by RECENT_DAYS).`);
  const showAll = (!favs.length && !recs.length) || r.u.full;
  if (showAll) {
    const byState = {}; STATIONS.forEach(s => (byState[s.state] ||= []).push(s));
    h += `<div class="stsection"><p class="ss-allhead">All stations, by state</p>${Object.keys(byState).sort().map(stn => `<div class="ads-stationrow__header"><span>${stn}</span></div><ul class="stlist" aria-label="${stn}">${byState[stn].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)).map(s => stationRow(s, field, 'all')).join('')}</ul>`).join('')}</div>`;
  }
  r.u.fullFoot = !showAll; // View full list is pinned in the footer (Figma 3295:51259)
  q(3); h += `</div>`;
  tip('Search “30th”, “Penn”, “Capitol”, “021” or “VA”, or a landmark: “Empire”, “Fenway”, “Space Needle”. Choose Lorton to see Auto Train pairing.');
  return h;
}
// Station search is a focused input state on iPhone; iPad keeps it beside the Fare Finder
const stationFocus = () => !IPAD();
// Prototype controls › Station selector: "pair" (From / To in the selector, stays open for the other station) or
// "single" (no From / To; choosing fills the field being edited and returns, as before)
const SELMODE = { v: 'pair' }; // design decision: From / To in the selector, stays open (the single-field option was retired)
const selPair = () => SELMODE.v === 'pair';
const selHeading = (f, ctx) => selPair() || ctx === 'ts' ? 'Select station' : f === 'from' ? 'Select departure station' : 'Select arrival station'; // single field: the heading names it
SCR.stations = (r, ri) => {
  if (rich()) return stationsClear(r, ri);
  const f = r.p.field;
  const lead = v2() ? `<p class="ghint">${ic('info-circle', 'ads-icon--sm')}<span>${f === 'from' ? 'Step 1 of 2 for your route. Next you’ll choose where you’re going.' : 'Step 2 of 2 for your route. It can’t be the same as your departure station.'}</span></p>` : '';
  const why = (v1() || v2()) && D().booking.notice ? /* shown while station search continues to the other station */ `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${D().booking.notice}</p></div></div>` : '';
  const kbOk = stationFocus() && r.u.view !== 'map'; if (!kbOk) r.u.kb = false;
  const anim = kbOk && r.u.kbAnim ? ' kb-anim-' + r.u.kbAnim : ''; r.u.kbAnim = null; // one-shot: typing redraws don't replay it
  const cls = 'ss-upd' + (r.u.view === 'map' ? ' ss-upd--map' : '') + (kbOk ? ` ss-kbwrap ss-lay-a${r.u.kb ? ' is-kb' : ''}${anim}` : ''), heading = selHeading(f, r.p.ctx), body = stationSearch(r, ri, f, false).replace('<!--why-->', lead + why) + (kbOk ? iosKeyboard(!!r.u.kbShift) : '');
  const foot = (typeof mapFoot === 'function' ? mapFoot(r) : null) || (r.u.view !== 'map' && r.u.fullFoot ? `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="ss-full">View full list</button>` : null), fo = foot ? { foot, footCls: 'ads-actionfooter' } : {};
  return stationFocus() ? Object.assign({ title: heading, kind: 'focus', headInBody: true, cls: 'pane--focus ' + cls, body, banner: false }, fo) : Object.assign({ title: heading, kind: 'push', cls, body, banner: false }, fo);
};
// From / To inside the selector: the field being edited is outlined; tapping the other one edits it instead; the swap
// button swaps the two stations of the experience that opened the selector
function selGroup(r, field) {
  const tg = selTarget(r.p.ctx || 'ff'), side = (f, label) => { const c = tg[f], s = c && ST[c]; return { label, code: c || '', city: s ? `${s.city}, ${s.st}` : '', facility: s ? s.name : '', placeholder: f === 'from' ? 'Select departure station' : 'Select arrival station', attrs: `data-a="ss-field" data-v="${f}" id="ss-f-${f}"${f === field ? ' aria-current="true"' : ''}` }; };
  return stationGroup({ from: side('from', 'From'), to: side('to', 'To'), swapAttrs: 'data-a="ss-swap"', swapDisabled: !tg.from && !tg.to }).replace('ads-stationgroup', 'ads-stationgroup ss-group');
}
A['ss-field'] = (t, ri) => { const r = routeAt(ri), f = t.dataset.v; if (r.p.field === f) { pendingFocus = `#ss-f-${f}`; render(); return; } /* search isn't made active */ r.p.field = f; track('station_search_field_switched', { field: f === 'from' ? 'departure' : 'arrival' }); pendingFocus = `#ss-f-${f}`; render(); };
A['ss-swap'] = (t, ri) => { const r = routeAt(ri), tg = selTarget(r.p.ctx || 'ff'); [tg.from, tg.to] = [tg.to, tg.from]; pendingFocus = '[data-a="ss-swap"]'; render(); };
A['ss-clear'] = (t, ri) => { const r = routeAt(ri); r.u.d.q = ''; r.u.kbShift = true; pendingFocus = '#ss-q'; render(); }; // clears only: search (and the keyboard) stay active
A['ss-cancel'] = (t, ri) => { const r = routeAt(ri); r.u.d.q = ''; r.u.kbShift = true; kbSet(r, false, true, '#ss-q'); }; // iOS Cancel: clears and ends search
A['ss-place'] = (t, ri) => { const r = routeAt(ri), p = (r.u.sugg || [])[+t.dataset.i]; if (!p) return; r.u.place = p; r.u.placeQ = (r.u.d.q || '').trim(); track('station_search_place_chosen', { kind: p.kind }); if (r.u.kb && typeof kbSet === 'function') kbSet(r, false, false); pendingFocus = '.ss-place__t'; render(); };
A['ss-place-clear'] = (t, ri) => { const r = routeAt(ri); r.u.place = null; pendingFocus = '#ss-q'; render(); };
A['ss-full'] = (t, ri) => { routeAt(ri).u.full = true; pendingFocus = '.ss-allhead + .ads-stationrow__header + .stlist button'; render(); };
A.fav = t => {
  const d = D(), c = t.dataset.code;
  if (d.fav.includes(c)) { d.fav = d.fav.filter(x => x !== c); d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)]; toast(`${ST[c].city} removed from Saved and returned to recents`, 'info'); }
  else { d.fav = [...d.fav, c]; d.rec = d.rec.filter(x => x.c !== c); toast(`${ST[c].city} saved`); }
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
  // Stay open for the other station: after choosing one, the selector moves to the other field, until both have been
  // chosen in this visit. Train status looks up one station, so it returns at once. Back leaves with what's chosen.
  // The other field is still empty: stay for it (from the map, back to the station list). Otherwise both stations
  // are set (first pass, or editing just one of them): return to the screen that opened the selector.
  if (sr) sr.u.picked = [...new Set([...(sr.u.picked || []), f])];
  const next = ctx === 'ts' || !sr || !selPair() ? null : !b[other] ? other : null;
  if (sr && next) {
    sr.p.field = next; sr.u.d = Object.assign({}, sr.u.d, { q: '' });
    // From the map, go back to the station list for the next station (needs alignment with the user story and Product)
    if (sr.u.view === 'map') { sr.u.view = 'list'; track('station_search_view_selected', { view: 'list', after: 'map_selection', ...selProps(sr) }); }
    sr.u.mapSel = null; sr.u.mapJust = null;
    sr.u.selLive = `${ST[c].city} set as your ${f === 'from' ? 'departure' : 'arrival'} station. Now choose your ${next === 'from' ? 'departure' : 'arrival'} station.`;
    if (si < sheet().stack.length - 1) popTo(si); // from Details, back to the selector
    pendingFocus = `#ss-f-${next}`; render(); return; // the next field, outlined; search isn't made active
  }
  // Both stations chosen (or Train status): back to the experience that opened station search
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
// without saving and without asking. The Departure / Return card from New booking sits above the calendar; the field
// being filled is outlined (as in station search). Round trip: each tap fills the active field and activates the other.
// A new departure after the return moves the return to that day and keeps Return active.
function calDraft(r) { const b = D().booking; if (!r.u.cal) r.u.cal = { dep: b.dep, ret: b.trip === 'rt' ? b.ret : null, trip: b.trip, edit: b.trip === 'rt' && r.p.field === 'ret' ? 'ret' : 'dep', jump: true }; return r.u.cal; }
// The New booking date card (dateGroup), showing the draft dates; the active field carries aria-current
function calCard(c) {
  const f = (k, label) => { const v = c[k], on = c.edit === k; return { label, value: v ? fmtNumDate(v) : k === 'ret' ? 'Add return' : 'Choose date', icon: !v && k === 'ret' ? 'plus-circle' : 'calendar', sub: v ? fmtWeekday(v) + (v === TODAY_S ? ' · Today' : '') : '', aria: `${label}: ${v ? fmtWeekday(v) + ', ' + fmtDate(v) : 'not chosen'}`, attrs: `data-a="calx-edit" data-v="${k}" id="calx-f-${k}"${on ? ' aria-current="true"' : ''}` }; };
  const ret = c.trip === 'rt' ? f('ret', 'Return date') : { label: 'Return date', value: 'Add return', icon: 'plus-circle', aria: 'Return date: Add return', attrs: 'data-a="calx-addret" id="calx-f-addret"' };
  return dateGroup({ start: f('dep', 'Departure date'), end: ret }).replace('ads-dategroup', 'ads-dategroup calx-group');
}
function calScroll(r, ri) {
  const c = calDraft(r), rt = c.trip === 'rt', edit = rt ? c.edit : 'dep';
  ref('1060'); q(4); // the 335-day window isn't confirmed (Q4): dates beyond it are disabled, no policy text
  const maxDep = addDays(TODAY_S, WINDOW_DAYS), maxRet = c.dep ? addDays(c.dep, WINDOW_DAYS) : maxDep;
  const isOff = s => s < TODAY_S || (edit === 'ret' && c.dep ? s < c.dep || s > maxRet : s > maxDep); // choosing a return: nothing before the departure; same day allowed
  const retOk = rt && c.dep && c.ret;
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
  // Figma 3554:123276: weekday letters pinned above the months, with a rule. The date card is pinned above them.
  const live = `<p class="ads-sr-only" role="status">${edit === 'dep' ? 'Choose a departure date' : 'Choose a return date'}</p>`;
  return `<div class="calx-head">${calCard(c)}${live}<div class="ads-calendar__weekdays" aria-hidden="true">${'SMTWTFS'.split('').map(x => `<span>${x}</span>`).join('')}</div></div><div class="ads-calendar calx">${months.map(monthHtml).join('')}</div>`;
}
SCR.calendar = (r, ri) => {
  const b = D().booking;
  if (v1()) {
    const c = calDraft(r), rt = c.trip === 'rt', needDep = !c.dep, needRet = rt && !needDep && !c.ret, need = needDep || needRet;
    const msg = needDep ? (rt ? 'Choose your departure and return dates.' : 'Choose a departure date.') : 'Choose a return date.';
    const foot = `${need ? `<p class="ads-helper" id="calx-done-why">${msg}</p>` : ''}<button class="ads-btn ads-btn--block" type="button" data-a="calx-done"${need ? ' disabled aria-describedby="calx-done-why"' : ''}>Save selection</button><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="calx-clear">Clear</button>`;
    return { title: rt ? 'Select dates' : 'Select date', kind: 'push', backIcon: true, noClose: true, cls: 'pane--calx', body: calScroll(r, ri), foot, footCls: 'ads-actionfooter', banner: false };
  }
  const foot = `<div class="calfoot"><span class="ads-body-small"><b>Depart</b> ${fmtShortY(b.dep)}${b.trip === 'rt' ? ` · <b>Return</b> ${b.ret ? fmtShortY(b.ret) : 'not set'}` : ''}</span><button class="ads-btn" type="button" data-a="cal-done">Done</button></div>`;
  return { title: v2() ? (b.trip === 'rt' ? 'Choose your dates' : 'Choose departure date') : 'Dates', kind: 'push', body: calendarBody(r, ri, r.p.field), foot, banner: false };
};
// Tapping a field in the date card makes it active (and brings its month into view)
A['calx-edit'] = (t, ri) => { const r = routeAt(ri), c = calDraft(r), v = t.dataset.v; if (c.edit !== v) { c.edit = v; c.jump = true; } pendingFocus = `#calx-f-${v}`; render(); };
// One-way: "Add return" in the card adds a return to the draft (same day, as on New booking) and activates it
A['calx-addret'] = (t, ri) => { const r = routeAt(ri), c = calDraft(r); c.trip = 'rt'; c.ret = c.dep; c.edit = 'ret'; pendingFocus = '#calx-f-ret'; render(); };
A['calx-day'] = (t, ri) => {
  const r = routeAt(ri), c = calDraft(r), s = t.dataset.d;
  if (c.trip !== 'rt') c.dep = s; // one-way: only the departure changes
  else if (c.edit === 'dep') { c.dep = s; if (c.ret && c.ret < s) c.ret = s; c.edit = 'ret'; } // a later departure moves the return with it; Return stays next
  else { c.ret = s; c.edit = 'dep'; }
  pendingFocus = `[data-k="day-${s}"]`; render();
};
// Clear: no dates chosen; Save selection waits for them
// Clear returns the dates to their defaults (NMA-1060 AC#2): departure today, and on a round trip return today
A['calx-clear'] = (t, ri) => { const r = routeAt(ri), c = calDraft(r); c.dep = TODAY_S; c.ret = c.trip === 'rt' ? TODAY_S : null; c.edit = 'dep'; pendingFocus = '[data-a="calx-clear"]'; render(); };
A['calx-done'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = calDraft(r);
  if (!c.dep || (c.trip === 'rt' && (!c.ret || c.ret < c.dep))) return;
  b.dep = c.dep; if (c.trip === 'rt') { b.trip = 'rt'; b.ret = c.ret; }
  popTo(+ri - 1); pendingFocus = '#ff-dep';
};
// After a render, bring the month being edited to the top of the list (on opening, and when switching dates)
const renderBeforeCal = render;
render = function () {
  const out = renderBeforeCal.apply(this, arguments);
  const sh = sheet(), r = sh && sh.stack[sh.stack.length - 1];
  if (r && r.s === 'calendar' && r.u.cal && r.u.cal.jump) {
    const c = r.u.cal; c.jump = false;
    const target = TODAY_S.slice(0, 7) /* Figma DT: the current month first */, sc = document.querySelector('#device .pane--calx .pane__scroll'), m = document.querySelector(`#device .calx-month[data-month="${target}"]`);
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
// A legacy "none" answer reads as nothing selected. In booking mode a small or medium service animal answered
// earlier is kept aside (animalLater) for the second questionnaire in Traveler information.
const toDraft = (m, mode) => {
  const x = { cat: m.cat === 'none' ? '' : m.cat || '', dis: [...m.dis], wc: m.wc === true ? 'yes' : m.wc === false ? 'no' : '', needs: [...m.needs], animal: m.animal || '', animalLater: m.animalLater || '', mob: m.mob || '', mobHelp: m.mobHelp || '', mobType: m.mobType || '', dev: m.dev || '', sa: m.sa || '', saTask: m.saTask || '', saSize: m.saSize || '' };
  if (mode !== 'booking' && x.needs.includes('animal') && x.animal && x.animal !== 'large') { x.sa = 'yes'; x.saSize = x.animal; x.animal = ''; x.needs = x.needs.filter(n => n !== 'animal'); }
  if (mode === 'booking' && x.needs.includes('animal') && x.animal && x.animal !== 'large') { x.animalLater = x.animal; x.animal = ''; x.needs = x.needs.filter(n => n !== 'animal'); }
  return x;
};
const fromDraft = x => withAnimal(x, { cat: x.cat || null, dis: x.cat === 'disability' ? [...x.dis] : [], wc: x.cat === 'disability' && x.dis.includes('mobility') ? x.wc === 'yes' : null, needs: x.cat === 'disability' ? [...x.needs] : x.cat === 'station' ? x.needs.filter(n => n === 'seat') : x.cat === 'companion' ? x.needs.filter(n => n === 'station' || (n === 'seat' && x.needs.includes('station'))) : [] });
// The service animal's size is kept only while Service animal is chosen
const withAnimal = (x, m) => Object.assign(m, { animal: m.needs.includes('animal') ? x.animal || 'large' : null, animalLater: x.animalLater || null }, detailsOf(x));
// NMA-29: which mobility questions apply. Wheelchair space → device type (sit in it unless an accessible seat is also
// needed); an accessible seat, or reduced mobility without wheelchair space → mobility needs. Station assistance alone: none.
const mobQ = x => { const d = x.cat === 'disability', mob = d && (x.dis || []).includes('mobility'), seat = (d || x.cat === 'station') && (x.needs || []).includes('seat');
  if (mob && x.wc === 'yes') return seat ? 'bring' : 'sit'; if (seat || (mob && x.wc === 'no')) return 'needs'; return null; };
// NMA-628: a disability without a large service animal, or station assistance with an accessible seat → service animal
// question (training and size); a large service animal → training only; station assistance without a seat → none.
const saQ = x => x.cat === 'disability' ? ((x.needs || []).includes('animal') ? 'large' : 'ask') : x.cat === 'station' && (x.needs || []).includes('seat') ? 'ask' : null;
const mobAnswered = (x, q) => q === 'needs' ? !!x.mob && (x.mob !== 'amtrak' || !!x.mobHelp) && (x.mob !== 'own' || !!x.mobType) : q ? !!x.dev : true;
const mobSummary = (x, q) => q === 'needs' ? [AC.mobShort[x.mob], x.mob === 'amtrak' ? (x.mobHelp === 'yes' ? 'help moving in it' : 'no help needed') : '', x.mob === 'own' ? (x.mobType === 'power' ? 'power' : 'manual') : ''].filter(Boolean).join(', ') : `${AC.devShort[x.dev]}${q === 'sit' ? ', you’ll sit in it during travel' : ''}`;
function detailsOf(x) {
  const o = { mob: null, mobHelp: null, mobType: null, dev: null, sa: null, saTask: null, saSize: null }, mq = mobQ(x), sq = saQ(x);
  if (mq === 'needs' && x.mob) { o.mob = x.mob; if (x.mob === 'amtrak') o.mobHelp = x.mobHelp || null; if (x.mob === 'own') o.mobType = x.mobType || null; }
  if ((mq === 'sit' || mq === 'bring') && x.dev) o.dev = x.dev;
  if (sq === 'ask' && x.sa) { o.sa = x.sa; if (x.sa === 'yes') { o.saTask = (x.saTask || '').trim() || null; o.saSize = x.saSize || null; } }
  if (sq === 'large') o.saTask = (x.saTask || '').trim() || null;
  return o;
}
const AC = ASSIST_COPY;
// Wheelchair space allows an accessible seat or a large service animal, not both (NMA-995). A conflict is only
// possible after changing the wheelchair answer to Yes; it is never resolved silently.
const bigAnimal = x => x.needs.includes('animal') && x.animal === 'large';
const assistConflict = x => x.cat === 'disability' && x.wc === 'yes' && x.needs.includes('seat') && bigAnimal(x);
const needLabel = k => NEEDS.find(n => n[0] === k)[1];
const listWords = a => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
// A blocked save takes people to the first missing answer (its first control), scrolled into view
function focusFirstError() {
  setTimeout(() => {
    const pane = [...document.querySelectorAll('#device section.pane')].pop(), err = pane && pane.querySelector('.assistform .ads-helper--error'); if (!err) return;
    const box = err.closest('fieldset, .assist-mobrow, .ads-field') || err, ctl = box.querySelector('input:not([disabled]), select, textarea, button:not([disabled])');
    const sc = pane.querySelector('.pane__scroll'), t = ((ctl && ctl.closest('label')) || ctl || err).getBoundingClientRect(), v = sc && sc.getBoundingClientRect(); // scroll only the form, never the sheet
    if (sc) sc.scrollTop += (t.top - v.top) - (v.height - t.height) / 2; if (ctl) ctl.focus({ preventScroll: true });
  }, 0);
}
function assistErrors(x, mode, who = 'Traveler 1') {
  const e = {};
  if (x.cat === 'disability' && !x.dis.length) e.dis = AC.err.dis;
  if (x.cat === 'disability' && x.dis.includes('mobility') && !x.wc) e.wc = AC.err.wc;
  if (assistConflict(x)) e.needs = AC.err.conflict;
  // NMA-29 (Profile and booking): the mobility questions must be answered once they apply. NMA-628 (Profile only).
  if (!v2() && mobQ(x) && !mobAnswered(x, mobQ(x))) e.mob = AC.err.mob;
  if (!v2() && x.cat === 'disability' && x.needs.includes('animal') && !(x.saTask || '').trim()) e.saLarge = AC.err.saLarge;
  if (mode === 'profile' && !v2()) {
    const sq = saQ(x);
    if (sq === 'ask' && !x.sa) e.sa = AC.err.sa;
    if (sq === 'ask' && x.sa === 'yes') { if (!(x.saTask || '').trim()) e.saTask = AC.err.saTask; if (!x.saSize) e.saSize = AC.err.saSize; }
  }
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
  }
  if (!x.needs.includes('animal')) x.animal = '';
  else x.animal = 'large'; // the checkbox is Large service animal; small and medium animals are asked about separately (NMA-628, NMA-616)
  r.u.assistNote = notes.join(' ') || null;
  const before = r.u.snap ? JSON.parse(r.u.snap) : null, q = mobQ(x), fill = (t.type === 'checkbox' && t.checked) || t.type === 'radio';
  if (!v2() && before && t.dataset.f === 'needs' && t.value === 'animal' && t.checked && x.needs.includes('animal')) {
    const pri = +riOf(t), focus = '[data-f="needs"][value="animal"]';
    r.u.mobPending = { after: JSON.parse(JSON.stringify(x)), q: 'large', label: AC.largeAnimal };
    r.u.d = before; r.u.assistNote = null;
    setTimeout(() => { push('assist-mob', { pri, q: 'large' }, pri); sheet().stack[sheet().stack.length - 1].opener = focus; }, 0);
  } else if (!v2() && before && fill && ['needs', 'wc'].includes(t.dataset.f) && q && q !== mobQ(before)) {
    const pri = +riOf(t), focus = `[data-f="${t.dataset.f}"][value="${t.value}"]`;
    r.u.mobPending = { after: JSON.parse(JSON.stringify(x)), q, label: t.dataset.f === 'needs' ? needLabel(t.value) : `${AC.wcQuestion} ${t.value === 'yes' ? 'Yes' : 'No'}` };
    r.u.d = before; r.u.assistNote = null; // nothing changes until the questions are finished
    setTimeout(() => { push('assist-mob', { pri, q }, pri); sheet().stack[sheet().stack.length - 1].opener = focus; }, 0);
  }
  if (r.u.err) r.u.err = assistErrors(r.u.d, r.u.mode, assistWho(r).label);
};
// Inline choice when wheelchair space makes an accessible seat and a large service animal conflict
A['assist-keep'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, keep = t.dataset.v; r.u.dirty = true;
  if (keep === 'seat' && r.u.mode === 'booking') { x.needs = x.needs.filter(n => n !== 'animal'); x.animal = ''; r.u.assistNote = AC.removed.needs(AC.largeAnimal, AC.why.wcChoice); }
  else if (keep === 'seat') { x.animal = ''; r.u.assistNote = AC.sizeCleared; } // the animal can stay at a smaller size
  else { x.needs = x.needs.filter(n => n !== 'seat'); r.u.assistNote = AC.removed.needs(needLabel('seat'), AC.why.wcChoice); }
  if (r.u.err) r.u.err = assistErrors(x, r.u.mode, assistWho(r).label);
  pendingFocus = keep === 'seat' ? (r.u.mode === 'booking' ? '[data-f="needs"][value="seat"]' : '[data-f="animal"][value="small"]') : '[data-f="needs"][value="animal"]'; render();
};
function needsBlock(r, x, idp, explain, e = {}) {
  const bookingMode = r.u.mode === 'booking';
  const wcYes = x.wc === 'yes', comp = x.cat === 'companion', st = x.cat === 'station';
  const locked = false, conflict = assistConflict(x); // Figma 4734:249198: other needs stay selectable; a disability is still required to save
  const items = st ? NEEDS.filter(n => n[0] === 'seat') : comp ? NEEDS.filter(n => n[0] === 'station' || n[0] === 'seat').sort((a, c) => (a[0] === 'station' ? -1 : 1)) : NEEDS;
  if (bookingMode && x.needs.includes('animal')) snote('Proposal, needs team confirmation: before search only large service animals are asked about. Small and medium service animal details move to the second questionnaire in Traveler information, after you choose a fare.');
  const opts = items.map(([k, l, s]) => {
    let dis = locked, why = '';
    if (!conflict && wcYes && k === 'seat' && bigAnimal(x)) { dis = true; why = bookingMode ? AC.seatBlockedLarge : AC.seatBlocked; }
    if (comp && k === 'seat' && !x.needs.includes('station')) { dis = true; why = AC.compSeatAfter; }
    // Booking (before search): only a large service animal is asked about; small and medium come later
    if (k === 'animal') { l = AC.largeAnimal; s = bookingMode ? AC.largeAnimalHelp : 'A trained service animal that needs more space. Small and medium service animals are asked about below.'; if (!conflict && wcYes && x.needs.includes('seat')) { dis = true; why = AC.largeBlocked; } }
    return choice('checkbox', `${idp}-needs`, 'needs', k, x.needs.includes(k), l, why || s, `data-hook="assist" ${dis ? `disabled aria-describedby="${idp}-needs-why"` : ''}`) + `<p class="assist-about">${infoLink(ABOUT[k][0], ABOUT[k][1])}</p>`;
  }).join('');
  const help = locked ? AC.needsLocked : st ? AC.stationIncluded : x.cat === 'disability' && wcYes ? AC.wcRule : '';
  const fix = conflict ? `<div class="ads-alert ads-alert--warning assist-conflict" role="alert" id="${idp}-needs-err">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${AC.conflictTitle}</p><p class="ads-alert__description ads-body-small">${AC.conflictBody}</p><div class="ads-row" style="--ads-row-gap:8px"><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-keep" data-v="seat">${AC.keepSeat}</button><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="assist-keep" data-v="animal">${AC.keepAnimal}</button></div></div></div>` : '';
  return `<fieldset class="ads-fieldset${locked ? ' is-locked' : ''}" ${help ? `aria-describedby="${idp}-needs-why"` : ''}><legend class="ads-field-label">${st ? AC.stationSeatLegend : comp ? AC.compLegend : AC.needsLegend} <span class="ads-field__marker ads-field__marker--optional assist-opt-mark">(optional)</span></legend>${help ? `<p class="${locked ? 'ads-sr-only' : 'ads-helper'}" id="${idp}-needs-why">${locked ? '' : ic('info-circle', 'ads-icon--sm')}<span>${help}</span></p>` : ''}${fix}<div class="ads-fieldset__options">${opts}</div>${e.needs ? `<p class="ads-helper ads-helper--error" id="${idp}-needs-e">${ic('alert-diamond')}<span>${e.needs}</span></p>` : ''}${!st && !comp && bookingMode && x.animalLater ? `<p class="ads-helper">${ic('info-circle', 'ads-icon--sm')}<span>${AC.animalLaterKept(x.animalLater)}</span></p>` : ''}</fieldset>`;
}
// Figma 4734:249198: an About link under each other need (content: NMA-621)
const ABOUT = { seat: ['accessible-seats', 'About accessible seats'], station: ['station-assistance', 'About station assistance'], animal: ['service-animals', 'About service animals'] };
// NMA-29 and NMA-628 (Profile): follow-up questions, each required once it appears
function radioSet(idp, f, legend, opts, val, err, inline) {
  return `<fieldset class="ads-fieldset${inline ? ' ads-fieldset--inline' : ''} assist-q" ${err ? `aria-describedby="${idp}-${f}-err"` : ''}><legend class="ads-field-label">${legend} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span><span class="ads-sr-only"> (required)</span></legend><div class="ads-fieldset__options">${opts.map(([v, l, s]) => choice('radio', `${idp}-${f}`, f, v, val === v, l, s || '', 'data-hook="assist"')).join('')}</div>${err ? `<p class="ads-helper ads-helper--error" id="${idp}-${f}-err">${ic('alert-diamond')}<span>${err}</span></p>` : ''}</fieldset>`;
}
function saRow(x, idp, e) {
  const done = !!(x.saTask || '').trim();
  return `<div class="assist-mobrow${e.saLarge ? ' is-error' : ''}" id="${idp}-salarge">${ic('service-dog')}<div class="assist-mobrow__text"><p class="ads-field-label">${AC.largeAnimal} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span></p><p class="ads-body-small ${done ? '' : 'ads-text-secondary'}">${done ? esc(x.saTask.trim()) : 'Not answered yet'}</p>${e.saLarge ? `<p class="ads-helper ads-helper--error" id="${idp}-salarge-err">${ic('alert-diamond')}<span>${e.saLarge}</span></p>` : ''}</div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-mob-open" data-q="large" aria-label="${done ? 'Change' : 'Answer'} large service animal skill or task" ${e.saLarge ? `aria-describedby="${idp}-salarge-err"` : ''}>${done ? 'Change' : 'Answer'}</button></div>`;
}
function mobRow(x, q, idp, e) {
  const done = mobAnswered(x, q);
  return `<div class="assist-mobrow${e.mob ? ' is-error' : ''}" id="${idp}-mob">${ic('wheelchair-space')}<div class="assist-mobrow__text"><p class="ads-field-label">${AC.mobTitle} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span></p><p class="ads-body-small ${done ? '' : 'ads-text-secondary'}">${done ? esc(mobSummary(x, q)) : 'Not answered yet'}</p>${e.mob ? `<p class="ads-helper ads-helper--error" id="${idp}-mob-err">${ic('alert-diamond')}<span>${e.mob}</span></p>` : ''}</div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-mob-open" aria-label="${done ? 'Change' : 'Answer'} mobility needs" ${e.mob ? `aria-describedby="${idp}-mob-err"` : ''}>${done ? 'Change' : 'Answer'}</button></div>`;
}
function detailsBlock(r, x, idp, e) {
  if (v2()) return '';
  const mq = mobQ(x), big = x.cat === 'disability' && x.needs.includes('animal'), sq = r.u.mode === 'profile' && !big ? saQ(x) : null; if (!mq && !sq && !big) return '';
  ref(...[mq ? '29' : null, sq ? '628' : null].filter(Boolean));
  let h = '', top = (mq ? mobRow(x, mq, idp, e) : '') + (big ? saRow(x, idp, e) : '');
  const task = lab => fieldHtml({ id: `${idp}-satask`, f: 'saTask', label: lab, value: x.saTask || '', req: true, max: 200, help: AC.saTaskHelp, err: e.saTask, cls: 'assist-q' });
  if (sq === 'ask') {
    h += radioSet(idp, 'sa', AC.saLegend, AC.saOpts, x.sa, e.sa);
    if (x.sa === 'yes') h += task(AC.saTask) + radioSet(idp, 'saSize', AC.saSizeLegend, AC.saSizes, x.saSize, e.saSize, true);
  }
  q(18);
  return top + (h ? `<section class="assist-details" aria-labelledby="${idp}-det-h"><h3 class="ads-field-label assist-details__h" id="${idp}-det-h">${AC.detailsTitle}</h3>${h}</section>` : '');
}
// Service animal size: small and medium are always accepted; large follows the wheelchair-space rule
function animalSize(x, idp, e, largeOff) {
  const opts = AC.animalSizes.map(([v, l]) => choice('radio', `${idp}-asize`, 'animal', v, x.animal === v, l, v === 'large' && largeOff ? AC.largeBlocked : '', `data-hook="assist" ${v === 'large' && largeOff ? 'disabled' : ''}`)).join('');
  return `<fieldset class="ads-fieldset ads-fieldset--inline assist-size" ${e.animal ? `aria-describedby="${idp}-asize-err"` : ''}><legend class="ads-field-label">${AC.animalSizeLegend} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span><span class="ads-sr-only"> (required)</span></legend><div class="ads-fieldset__options">${opts}</div>${e.animal ? `<p class="ads-helper ads-helper--error" id="${idp}-asize-err">${ic('alert-diamond')}<span>${e.animal}</span></p>` : ''}</fieldset>`;
}
// Why Personal companion can't be chosen for this traveler right now
function companionWhy(b, key) {
  const others = travelerList(b).filter(t => t.key !== key && assistCat(b, t.key) === 'disability');
  return others.length ? AC.companionFull : AC.companionNoDisability;
}
// Type of help. branch (one-page form) is the follow-up for the chosen type, shown directly beneath it.
function catBlock(r, x, idp, mode, e, branch) {
  const cats = mode === 'booking' ? ['disability', 'station', 'companion'] : ['disability', 'station'];
  const b = D().booking, who = assistWho(r), open = mode === 'booking' && companionOpen(b, who.key);
  const opts = cats.map(k => {
    const sel = x.cat === k, off = k === 'companion' && !open && !sel;
    const sup = off ? companionWhy(b, who.key) : (AC.catHelp[k] || '');
    const opt = choice('radio', `${idp}-cat`, 'cat', k, sel, CATS[k], sup, off ? 'disabled' : 'data-hook="assist"');
    // Figma 3486:197156: the chosen type sits in a card, with its follow-up questions indented inside it
    return sel ? `<div class="assist-opt is-selected">${opt}${branch ? `<div class="assist-branch">${branch}</div>` : ''}</div>` : `<div class="assist-opt">${opt}</div>`;
  }).join('');
  const legend = mode === 'booking' ? (v1() ? `${AC.typeLegend}<span class="ads-sr-only"> for ${esc(who.label)}</span>` : `${esc(who.label)} needs`) : AC.profileTypeLegend;
  return `<fieldset class="ads-fieldset" ${e.cat ? `aria-describedby="${idp}-cat-err"` : ''}><legend class="ads-field-label">${legend}</legend><div class="ads-fieldset__options">${opts}</div>${e.cat ? `<p class="ads-helper ads-helper--error" id="${idp}-cat-err">${ic('alert-diamond')}<span>${e.cat}</span></p>` : ''}</fieldset>${mode === 'booking' ? q(9) : ''}`;
}
function disBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset" ${e.dis ? `aria-describedby="${idp}-dis-err"` : ''}><legend class="ads-field-label">${AC.disLegend} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span><span class="ads-sr-only"> (required, choose at least one)</span></legend><div class="ads-fieldset__options">${DISABILITIES.map(([k, l, s]) => choice('checkbox', `${idp}-dis`, 'dis', k, x.dis.includes(k), l, s, 'data-hook="assist"')).join('')}</div>${e.dis ? `<p class="ads-helper ads-helper--error" id="${idp}-dis-err">${ic('alert-diamond')}<span>${e.dis}</span></p>` : ''}</fieldset>`;
}
function wcBlock(r, x, idp, e) {
  return `<fieldset class="ads-fieldset ads-fieldset--inline wcq" ${e.wc ? `aria-describedby="${idp}-wc-err"` : ''}><legend class="ads-field-label">${ic('wheelchair-space', 'ads-icon--sm')} ${AC.wcQuestion} <span class="ads-field__marker ads-field__marker--required" aria-hidden="true">*</span><span class="ads-sr-only"> (required)</span></legend><div class="ads-fieldset__options">${choice('radio', `${idp}-wc`, 'wc', 'yes', x.wc === 'yes', 'Yes', '', 'data-hook="assist"')}${choice('radio', `${idp}-wc`, 'wc', 'no', x.wc === 'no', 'No', '', 'data-hook="assist"')}</div><p class="assist-about">${infoLink('wheelchair-space', 'About wheelchair space')}</p>${e.wc ? `<p class="ads-helper ads-helper--error" id="${idp}-wc-err">${ic('alert-diamond')}<span>${e.wc}</span></p>` : ''}</fieldset>`;
}
// One-page form (V1 and V3)
function assistForm(r, ri, o) {
  const src = o.mode === 'booking' ? assistRec(D().booking, assistWho(r).key).m : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src, o.mode); r.u.mode = o.mode; }
  const x = r.u.d, e = r.u.err || {}, idp = o.idp; r.u.snap = JSON.stringify(x);
  ref(o.mode === 'booking' ? '615' : '26', '27', '28', o.mode === 'booking' ? '995' : '995', '996');
  let branch = '';
  if (x.cat === 'disability') branch = disBlock(r, x, idp, e) + (x.dis.includes('mobility') ? wcBlock(r, x, idp, e) : '') + needsBlock(r, x, idp, false, e) + detailsBlock(r, x, idp, e);
  if (x.cat === 'station') branch = needsBlock(r, x, idp, false, e) + detailsBlock(r, x, idp, e);
  if (x.cat === 'companion') branch = needsBlock(r, x, idp, false, e);
  if (o.mode === 'booking') snote('Proposal, needs team confirmation: there’s no “I do not need assistance” option. Confirm with nothing selected to request no assistance. A personal companion isn’t paired with a traveler here; who they accompany is collected in Traveler information. Each traveler with a disability may still bring one.');
  if (o.mode === 'booking' && x.cat === 'companion') ref('997');
  if (x.cat === 'disability' || x.cat === 'station') snote(o.mode === 'booking' ? 'NMA-29: checking Accessible seat or answering the wheelchair-space question opens the mobility questions on their own page; the answer fills only when they’re finished. Service animal details are asked in Profile (NMA-628) and later in Traveler information (NMA-616, not built). Live station-assistance availability is NMA-620 (Sprint 7).' : 'NMA-29: checking Accessible seat or answering the wheelchair-space question opens the mobility questions on their own page; the answer fills only when they’re finished. NMA-628: the service animal questions appear under the other needs. Question wording is a draft.');
  // Conditional changes are announced from one live region at the top of the form
  const nErr = Object.keys(r.u.err || {}).length;
  const errTop = nErr ? `<div class="ads-alert ads-alert--error assist-errsum" role="alert">${ic('alert-diamond', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${nErr === 1 ? '1 answer is missing' : `${nErr} answers are missing`}</p><p class="ads-alert__description ads-body-small">Answer the ${nErr === 1 ? 'question' : 'questions'} marked below to save.</p></div></div>` : '';
  const note = r.u.assistNote ? `<div class="ads-alert ads-alert--info">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${esc(r.u.assistNote)}</p></div></div>` : '';
  return `<div class="assistform"><div class="assist-live" role="status" aria-live="polite">${note}</div>${catBlock(r, x, idp, o.mode, e, branch)}</div>`;
}
function assistSummaryItems(m) {
  if (!m.cat || m.cat === 'none') return [AC.noneSummary];
  const out = [CATS[m.cat]];
  if (m.cat === 'station') out.push(AC.stationSummary);
  if (m.cat === 'disability') out.push(m.dis.map(k => DISABILITIES.find(x => x[0] === k)[1]).join(', '));
  if (m.wc === true) out.push('Bringing a wheelchair (wheelchair space)');
  if (m.wc === false) out.push('Not bringing a wheelchair');
  if (m.needs.length) out.push(m.needs.map(k => k === 'animal' && m.animal ? (m.animal === 'large' ? AC.largeAnimal : `Service animal (${m.animal})`) : NEEDS.find(x => x[0] === k)[1]).join(', '));
  else if (m.cat !== 'station') out.push('No other needs');
  if (m.animalLater) out.push(AC.animalLaterSummary(m.animalLater));
  const lab = (opts, v) => (opts.find(o => o[0] === v) || [])[1];
  if (m.mob) out.push('Mobility: ' + mobSummary(m, 'needs'));
  if (m.dev) out.push('Mobility device: ' + mobSummary(m, m.needs.includes('seat') ? 'bring' : 'sit'));
  if (m.sa === 'no') out.push('No service animal');
  if (m.sa === 'yes') out.push(`Service animal (${m.saSize || 'size not given'})${m.saTask ? `: ${m.saTask}` : ''}`);
  if (!m.sa && m.saTask) out.push(`Large service animal trained to: ${m.saTask}`);
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
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src, mode); r.u.mode = mode; r.u.step = r.u.step || (src.cat ? 'review' : 'cat'); }
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
A['assist-clear-draft'] = (t, ri) => { const r = routeAt(ri), later = r.u.d && r.u.d.animalLater; r.u.d = { cat: '', dis: [], wc: '', needs: [], animal: '', animalLater: later || '' }; r.u.err = null; r.u.dirty = true; pendingFocus = '[data-f="cat"]'; render(); };

// ---- Booking assistance screen ----
// Figma AS.10 heads the screen "Traveler 1": the passenger type is dropped, but a named traveler (Pass Rider,
// corporate "You") keeps the name so the screen still says who it is for.
const assistHeading = w => w.type && w.type !== 'pr' && w.short === PAX_LABEL[w.type] ? `Traveler ${w.n}` : w.label;
SCR.assist = (r, ri) => {
  const who = assistWho(r).label;
  if (v2()) return wizard(r, ri, 'booking', `Assistance · ${who}`);
  // Figma 3486:197156: chevron Back and title (no close); the traveler, Type of assistance, Save and Clear
  return { title: 'Assistance', kind: 'push', backIcon: true, noClose: true, cls: 'pane--ed pane--assist', body: `<h3 class="assist-who">${esc(assistHeading(assistWho(r)))}</h3>${assistForm(r, ri, { mode: 'booking', idp: 'ba' })}`, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="assist-confirm" aria-label="Save assistance for ${esc(who)}">Save</button><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="assist-clear-draft" aria-label="Clear assistance answers for ${esc(who)}">Clear</button>`, footCls: 'ads-actionfooter', banner: false };
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
A['sign-in'] = () => { if (V().net === 'offline') { toast('You’re offline. Connect to sign in.', 'info'); return; } startVerify('sign-in'); }; // NMA-975: no sign-in without a connection
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
    : grow({ a: 'edit', data: 'data-field="mi"', label: 'Middle initial', value: v2() ? 'Not added · can be added once' : 'Not added', empty: true, current: cur === 'mi', k: 'row-mi' });
  return `${group('Name', [
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Name</span><span class="ads-group__value">${esc(p.first)} ${esc(p.last)}</span></span>${lockChip}</div>`,
    `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Guest Rewards number</span><span class="ads-group__value">7012 3456 78</span></span>${lockChip}</div>`, miRow],
    'Need to change your name? Call us at <a class="ads-link ads-link--sm" href="tel:18003075000">1-800-307-5000</a>')}
    ${group('Contact', [grow({ a: 'change-email', label: 'Email', value: esc(p.email), k: 'row-email' }), grow({ a: 'edit', data: 'data-field="phone"', label: 'Phone', value: esc(fmtPhone(p.phone).replace(/^Mobile /, '')), empty: fmtPhone(p.phone) === 'Not added', current: cur === 'phone', k: 'row-phone' }), grow({ a: 'edit', data: 'data-field="address"', label: 'Billing address', value: p.address.street ? fmtAddress(p.address) : 'Not added', empty: !p.address.street, current: cur === 'address', k: 'row-address' }), grow({ a: 'edit', data: 'data-field="dob"', label: 'Date of birth', value: p.dob || (v2() ? 'Optional · not added' : 'Not added'), empty: !p.dob, current: cur === 'dob', k: 'row-dob' })])}
    ${group('Discounts', [grow({ a: 'push', data: 'data-s="discounts"', label: 'Passenger discounts', value: d.discount.type === 'none' ? 'Not added' : DISCOUNTS[d.discount.type].label, empty: d.discount.type === 'none', k: 'row-disc' })])}
    ${group('Assistance', [grow({ a: 'push', data: 'data-s="assist-profile"', label: 'Assistance requests', value: assistProfileValue(d), empty: assistProfileValue(d) === 'Not added', k: 'row-assist' })], 'Used for you as Traveler 1 when you book. Changes for one trip don’t change it.')}
    ${group('Amtrak employee', [grow({ a: 'edit', data: 'data-field="employee"', label: 'Employee pass', value: esc(empSummary(d.employee)), empty: !d.employee, current: cur === 'employee', k: 'row-employee' })], 'For employees, retirees, spouses and dependents. Used for Pass Rider booking.')}
    ${group('Coupons', [grow({ a: 'push', data: 'data-s="coupons"', label: 'My coupons', value: `${d.coupons.length} available${d.coupons.some(soon) ? ' · one expires soon' : ''}`, k: 'row-coupons' })])}`;
}
SCR.profile = (r, ri) => {
  ref('19', '22', '23', '919', '21');
  prov('Account › Profile holds personal details and Passenger discounts. The IA lists Profile but not discounts (NMA-43 says My Profile › Discounts).');
  if (v3()) return profileV3(r, ri);
  return { title: 'Profile', kind: 'push', backIcon: true, cls: 'pane--profile', body: profileRows(r, ri, { current: IPAD() && sheet().stack[+ri + 1] && sheet().stack[+ri + 1].s === 'edit' ? sheet().stack[+ri + 1].p.field : null }), offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
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
// Profile editors (Figma Sprint 4 nodes 3418:113979, 3427:120590, 3427:124991, 3430:129513, 3430:140680): chevron
// Back, the title, a plain close, and Save in the action footer. Save is always available: with nothing changed it
// simply returns to Profile; otherwise the editor's checks run. Back with unsaved changes asks Discard changes?.
const edShell = (r, title, body, saveA = 'edit-save') => ({ title, kind: 'push', backIcon: true, cls: 'pane--ed', body, foot: busyBtn(r, 'Save', 'Saving', `data-a="${saveA}"`), footCls: 'ads-actionfooter', offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' });
SCR.edit = (r, ri) => {
  const o = EDITORS[r.p.field](r, ri, false);
  const sh = edShell(r, PFIELDS[r.p.field], o.body); if (o.footExtra) sh.foot += o.footExtra; return sh;
};
// Which route an editor action targets: a pushed editor, or V3's inline editor inside Profile
function edRoute(ri) { const r = routeAt(ri); return r && r.s === 'profile' ? r.u.edit : r; }
A['edit-inline-cancel'] = (t, ri) => { const r = routeAt(ri), f = r.u.inline; r.u.inline = null; r.u.edit = null; pendingFocus = `[data-k="row-${f}"]`; render(); };
A['cancel-busy-inline'] = (t, ri) => { const er = edRoute(ri); er.u.busy = null; er.u.alert = { kind: 'custom', tone: 'info', title: 'Cancelled', text: 'Nothing was saved. Your entries are kept.' }; render(); };
A['edit-save'] = (t, ri) => {
  const er = edRoute(ri), o = EDITORS[er.p.field](er, ri, er !== routeAt(ri));
  if (o.unchanged) { er.u.dirty = false; if (er === routeAt(ri)) { popTo(+ri - 1); pendingFocus = `[data-k="row-${er.p.field}"]`; render(); } else A['edit-inline-cancel'](t, ri); return; } // nothing to save
  SAVE[er.p.field](er, ri);
};
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
  if (p.mi) return { unchanged: true, body: `<div class="ads-summary"><div class="ads-summary__head"><div><p class="ads-summary__title">Middle initial: ${esc(p.mi)}</p><p class="ads-body-small ads-text-secondary">It was added once and is now locked. Call 1-800-307-5000 to change your name.</p></div>${lockChip}</div></div>`, saveDisabled: true, noSaveWhy: 'Your middle initial can’t be changed in the app.' };
  const preview = v2() && r.u.d.mi ? `<p class="ads-body-small">Your name will show as <b>${esc(p.first)} ${esc(r.u.d.mi)}. ${esc(p.last)}</b></p>` : '';
  const body = `${intro('You can add your middle initial once. After you save it, it can’t be changed in the app.')}${netAlert(r)}${fieldHtml({ id: 'ed-mi', f: 'mi', label: 'Middle initial', value: r.u.d.mi, max: 1, alpha: true, autocomplete: 'additional-name', help: v2() ? 'One letter, A to Z.' : 'One letter. You can add this once; it can’t be changed later.', err: e.mi, live: v2() })}${preview}`;
  return { body, unchanged: !r.u.d.mi, saveDisabled: !r.u.d.mi, noSaveWhy: 'Enter a letter to save.', saveLabel: 'Save' }; // nothing typed: Save just returns
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
  // Figma ED.5: a card with Number type (stacked radios) and its helper first, then the number
  const regionQ = `<fieldset class="ads-fieldset"><legend class="ads-field-label">${v2() ? 'Where is this number registered?' : 'Number type'}</legend><div class="ads-fieldset__options">${choice('radio', 'ph-region', 'region', 'us', x.region === 'us', 'US/Canada')}${choice('radio', 'ph-region', 'region', 'intl', x.region === 'intl', 'International')}</div><p class="ads-helper">Switching the type keeps the number you entered for each type.</p></fieldset>`;
  const num = x.region === 'us'
    ? fieldHtml({ id: 'ph-mobile', f: 'mobile', label: 'Phone number', type: 'tel', value: x.mobile, digits: 10, placeholder: '215-444-5358', autocomplete: 'tel-national', help: 'Must be 10 digits; numbers only.', err: e.mobile })
    : `${fieldHtml({ id: 'ph-cc', f: 'cc', label: 'Country code', select: DIAL.map(([k, n, c, fl]) => [k, `${fl} ${n} (${c})`]), value: x.cc })}${fieldHtml({ id: 'ph-intl', f: 'intl', label: 'Phone number', type: 'tel', value: x.intl, digits: 15, prefix: (DIAL.find(z => z[0] === x.cc) || DIAL[0])[2], autocomplete: 'tel-national', help: 'Must be 5 to 15 digits; numbers only.', err: e.intl })}`;
  const card = `<section class="ed-card" aria-labelledby="ph-card-h"><h3 class="ed-card__title" id="ph-card-h">Mobile phone number</h3>${regionQ}${num}</section>`;
  // Add phone number: a second card for home and business numbers (US/Canada)
  const more = x.region === 'us' && (r.u.more || x.home || x.business);
  const other = more ? `<section class="ed-card" aria-labelledby="ph-more-h"><h3 class="ed-card__title" id="ph-more-h">Other phone numbers</h3>${fieldHtml({ id: 'ph-home', f: 'home', label: 'Home', type: 'tel', value: x.home, digits: 10, opt: true, help: 'Must be 10 digits; numbers only.', err: e.home })}${fieldHtml({ id: 'ph-bus', f: 'business', label: 'Business', type: 'tel', value: x.business, digits: 10, opt: true, help: 'Must be 10 digits; numbers only.', err: e.business })}${fieldHtml({ id: 'ph-ext', f: 'ext', label: 'Extension', type: 'tel', value: x.ext, digits: 3, opt: true, help: 'Up to 3 digits.', err: e.ext })}</section>`
    : x.region === 'us' ? `<button class="ads-btn ads-btn--secondary ads-btn--block ed-add" type="button" data-a="ph-more">${ic('plus')}Add phone number</button>` : '';
  const body = `${intro('US/Canada numbers need a mobile number. International numbers need a country code. You can use a number that’s also on another account.')}${netAlert(r)}${card}${other}`;
  return { body, unchanged: !changed, saveDisabled: !changed, noSaveWhy: 'Make a change to save.' };
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
    ${stateSel}${fieldHtml({ id: 'ad-zip', f: 'zip', label: zipLabel, value: x.zip, req: true, autocomplete: 'postal-code', inputmode: cty === 'US' ? 'numeric' : 'text', help: cty === 'CA' ? 'For example, K1A 0B1.' : '', err: e.zip })}
`;
  return { body, unchanged: JSON.stringify(x) === JSON.stringify(a), saveDisabled: JSON.stringify(x) === JSON.stringify(a), noSaveWhy: a.street ? 'Make a change to save.' : 'Enter an address to add it.', saveLabel: a.street ? 'Save' : 'Add', footExtra: a.street ? `<button class="ads-btn ads-btn--secondary ads-btn--block addr-remove" type="button" data-a="addr-remove">Clear</button>` : '' };
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
  const body = `${intro('Optional. Use month, day and year, for example 04/15/1988.')}${netAlert(r)}${fieldHtml({ id: 'ed-dob', f: 'dob', label: 'Date of birth', value: r.u.d.dob, opt: true, placeholder: 'MM/DD/YYYY', inputmode: 'numeric', autocomplete: 'bday', max: 10, err: e.dob })}${p.dob ? `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="dob-remove">Remove date of birth</button>` : ''}`;
  snote('Earliest and latest allowed dates of birth aren’t defined (Q6). The prototype rejects future dates.');
  return { body, unchanged: (r.u.d.dob || '') === (p.dob || ''), saveDisabled: (r.u.d.dob || '') === (p.dob || ''), noSaveWhy: 'Make a change to save.' };
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
    return choice('radio', 'disc', 'type', k, x.type === k, DISCOUNTS[k].label, k === 'pwd' && hasDis ? 'Saved because your assistance says you have a disability.' : DISCOUNTS[k].info.replace(/ Eligibility details: content pending\.?/, ''), extra);
  };
  let cond = '';
  if (x.type === 'rpa') cond = fieldHtml({ id: 'rpa-id', f: 'rpa', label: 'Membership ID', type: 'tel', value: x.rpa, digits: 10, req: true, help: '6 to 10 digits, no spaces.', err: e.rpa });
  if (x.type === 'pwd' && !hasDis) cond = `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">Complete assistance first</p><p class="ads-alert__description ads-body-small">This discount is saved when your assistance says “I have a disability”. ${v2() ? 'We’ll bring you back here when you’re done.' : ''}</p><div><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="go-assist">Go to assistance</button></div></div></div>`;
  const body = `${intro('Choose one discount. It will be pre-selected when you book. Senior and Youth discounts are chosen when you book.')}${netAlert(r)}
    <fieldset class="ads-fieldset"><legend class="ads-field-label">Discount preference</legend><div class="ads-fieldset__options">${['none', 'military', 'rpa', 'pwd'].map(k => opt(k) + (x.type === k && cond ? `<div class="condfield">${cond}</div>` : '')).join('')}</div></fieldset>
    ${q(9)}<button class="ads-link ads-link--sm linkbtn" type="button" data-a="push" data-s="rules" data-topic="rules">Passenger types and discount rules</button>`;
  const changed = x.type !== d.discount.type || (x.type === 'rpa' && x.rpa !== d.discount.rpa);
  if (v3()) return { title: 'Passenger discounts', kind: 'push', body, foot: busyBtn(r, 'Save', 'Saving', `data-a="disc-save" ${changed ? '' : 'disabled'}`), offlineText: 'You’re seeing your saved preference. Saving needs a connection.' };
  return Object.assign(edShell(r, 'Passenger discounts', body, 'disc-save'), { offlineText: 'You’re seeing your saved preference. Saving needs a connection.' });
};
A['go-assist'] = (t, ri) => { const sh = sheet(); const dr = sh.stack[+ri]; dr.u.dirty = false; sh.stack = [sh.stack[0], R('profile'), R('assist-profile', { returnTo: 'discounts' })]; pendingFocus = 'title'; render(); };
A['disc-save'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, d = D();
  if (x.type === d.discount.type && (x.type !== 'rpa' || x.rpa === d.discount.rpa)) { r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-k="row-disc"]'; render(); return; } // nothing to save
  if (x.type === 'rpa' && !/^\d{6,10}$/.test(x.rpa || '')) { r.u.err = { rpa: 'Check your membership number. Maximum 10 digits without spaces' }; pendingFocus = '#rpa-id'; render(); return; }
  if (x.type === 'pwd' && d.assist.cat !== 'disability') { r.u.alert = { kind: 'custom', tone: 'error', title: 'Passenger with disability can’t be saved yet', text: 'Save assistance with “I have a disability” first.' }; pendingFocus = '[data-a="go-assist"]'; render(); return; }
  r.u.err = {};
  runSave(r, () => { d.discount = { type: x.type, rpa: x.type === 'rpa' ? x.rpa : '' }; d.booking.disc = ['military', 'rpa'].includes(x.type) ? x.type : 'none'; }, () => { r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-k="row-disc"]'; toast('Discount preference saved'); });
};
SCR['pr-policy'] = () => ({ title: 'Pass Rider policy', kind: 'push', backIcon: true, noClose: true, banner: false, body: `<p class="prpolicy">Content pending.</p>`, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="back">Done</button>`, footCls: 'ads-actionfooter' }); // placeholder until NMA-1081
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
  const editing = r.u.editing || !saved.cat || v1(); // Profile › Assistance requests opens its edit screen directly (no summary with its own Edit)
  const doneMsg = r.u.savedMsg ? alertBox('success', 'Assistance saved', r.u.savedMsg) : '';
  if (v2() && editing) return wizard(r, ri, 'profile', 'Assistance');
  const summary = `${doneMsg}${assistSummaryCard(saved, { title: 'Your assistance', edit: 'assist-p-edit' })}${saved.cat ? `<p class="ads-body-small ads-text-secondary">Used for Traveler 1 when you book. You can change it there for one trip.</p>` : ''}${r.u.returnTo || r.p.returnTo ? `<button class="ads-btn ads-btn--secondary" type="button" data-a="assist-return">Back to Passenger discounts</button>` : ''}`;
  if (!editing) return { title: 'Assistance', kind: 'push', body: summary, banner: false };
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(saved); r.u.mode = 'profile'; }
  const form = `${netAlert(r)}${assistForm(r, ri, { mode: 'profile', idp: 'pa' })}${r.u.d.cat ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-clear-draft">Clear selection</button>` : ''}${pwdPreview(fromDraft(r.u.d))}`;
  if (v3() && IPAD()) return { title: 'Assistance', kind: 'push', wide: true, body: `<div class="split2"><div class="split2__main">${assistSummaryCard(saved, { title: 'Saved now' })}</div><div class="split2__side"><div class="edpane">${form}</div></div></div>`, foot: `<div class="wizfoot"><button class="ads-btn ads-btn--secondary" type="button" data-a="assist-p-cancel">Cancel</button>${busyBtn(r, 'Save', 'Saving', 'data-a="assist-save"')}</div>` };
  if (v1()) { const sh = edShell(r, 'Assistance requests', `${netAlert(r)}${assistForm(r, ri, { mode: 'profile', idp: 'pa' })}${pwdPreview(fromDraft(r.u.d))}`, 'assist-save'); sh.foot += `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="assist-clear-draft">Clear</button>`; return sh; } // Figma PA.1: Save, then a secondary Clear
  return { title: 'Assistance', kind: saved.cat ? 'editor' : 'push', cancelA: 'assist-p-cancel', save: saved.cat ? { a: 'assist-save', busy: !!r.u.busy } : null, body: form, foot: busyBtn(r, 'Save', 'Saving', 'data-a="assist-save"') };
};
A['assist-p-edit'] = (t, ri) => { const r = routeAt(ri); r.u.editing = true; r.u.d = undefined; r.u.step = null; r.u.savedMsg = null; pendingFocus = 'title'; render(); };
// Cancel: unsaved changes ask Discard changes?, as on every Profile edit
A['assist-p-cancel'] = (t, ri) => { const r = routeAt(ri); if (!D().assist.cat || v1()) return A.back(t, ri); r.u.editing = false; r.u.d = undefined; r.u.dirty = false; r.u.err = null; pendingFocus = 'title'; render(); };
A['assist-return'] = (t, ri) => { const sh = sheet(); sh.stack = [sh.stack[0], R('profile'), R('discounts')]; pendingFocus = 'title'; render(); };
A['assist-save'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, e = assistErrors(x, 'profile');
  if (v1() && JSON.stringify(fromDraft(x)) === JSON.stringify(fromDraft(toDraft(D().assist)))) { r.u.dirty = false; popTo(+ri - 1); pendingFocus = '[data-k="row-assist"]'; render(); return; } // nothing to save
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.dis ? 'dis' : 'wc'; render(); focusFirstError(); return; }
  const m = fromDraft(x), d = D();
  runSave(r, () => {
    const before = d.discount.type; let msg = m.cat ? 'Your assistance is saved to your profile.' : 'Assistance cleared. Nothing is saved.';
    if (m.cat === 'disability' && before !== 'pwd') { d.discount = { type: 'pwd', rpa: '' }; msg += ` Your discount is now Passenger with disability${before !== 'none' ? `, which replaced ${DISCOUNTS[before].label}` : ''}.`; }
    if (m.cat !== 'disability' && before === 'pwd') { d.discount = { type: 'none', rpa: '' }; msg += ' The Passenger with disability discount was removed.'; }
    d.assist = m; if (!d.booking.assistDone || d.booking.assistFromProfile) { d.booking.assist = clone(m); d.booking.assistDone = !!m.cat; d.booking.assistOn = !!m.cat; d.booking.assistFromProfile = !!m.cat; d.booking.ask = m.cat ? { 'adult-1': true, 'pr-you': true } : {}; }
    return msg;
  }, msg => { r.u.dirty = false; if (v1()) { r.u.d = undefined; popTo(+ri - 1); pendingFocus = '[data-k="row-assist"]'; toast(msg); return; } r.u.editing = false; r.u.d = undefined; r.u.step = null; r.u.savedMsg = msg; r.u.returnTo = r.p.returnTo; pendingFocus = 'title'; render(); });
};


// Change email (NMA-21), Figma VF.1–VF.7: the Amtrak sign-in web pages, not an app sheet. Amtrak logo, a 32px
// heading, an intro, a status Alert, read-only fields with the mail icon, and the button in the page.
const B2C_LOGO = `<svg width="151" height="16" viewBox="0 0 151 16" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Amtrak" focusable="false"><path d="M47.4 0.2C36.9 4.8 31.2 9.7 28.1 16C25.8 15.3 23.2 14.4 20.5 13.3L19.4 12.9C25.5 6.3 34 3.7 47.4 0V0.2ZM56 14H51.8L51 12.6H45.1L44.3 14H40.5L46.1 5.7H50.4L56 14ZM68.5 11.4L71.8 5.7H76L78.5 14H74.7L73.4 8.7L70.4 14H66.7L63.6 8.7L62.4 14H58.5L61.1 5.7H65.3L68.5 11.4ZM93.8 7.6H89.2V14H85.3V7.6H80.2L80.7 5.7H94.2L93.8 7.6ZM103.6 5.7C105.3 5.7 107.1 5.7 108.4 6.1C109.7 6.5 110.6 7.2 110.6 8.4C110.6 9.5 109.9 10.5 108.3 10.9L111.2 14H106.8L104.8 11.5H101.5V14H97.7V5.7H103.6ZM129.4 14H125.3L124.4 12.6H118.5L117.7 14H113.9L119.5 5.7H123.8L129.4 14ZM136.6 9.4L141.1 5.7H145.8L140.6 9.7L146.2 14H141.1L136.6 10.1V14H132.7V5.7H136.6V9.4ZM40.1 1.7C31.3 3.5 22.7 5.9 16.2 11.5C13.8 10.4 11.5 9.3 9.2 8.2C15.4 4.3 26.3 2.6 32.4 1.9C34.5 2 37.9 1.8 40.1 1.5V1.7ZM46.1 11H50L48.1 7.6L46.1 11ZM119.5 11H123.5L121.5 7.6L119.5 11ZM101.5 10H103.8C104.6 10 105 9.9 105.5 9.8C106.2 9.7 106.7 9.3 106.7 8.6C106.7 7.8 105.9 7.4 104 7.4H101.5V10ZM148.9 5.7C149.4 5.7 149.9 5.9 150.3 6.3C150.7 6.7 150.9 7.2 150.9 7.8C150.9 8.4 150.7 8.8 150.3 9.2C149.9 9.6 149.4 9.8 148.9 9.8C148.3 9.8 147.8 9.6 147.4 9.2C147 8.8 146.8 8.4 146.8 7.8C146.8 7.2 147 6.7 147.4 6.3C147.8 5.9 148.3 5.7 148.9 5.7ZM148.8 6C148.3 6 147.9 6.2 147.6 6.5C147.2 6.9 147.1 7.3 147.1 7.8C147.1 8.3 147.2 8.7 147.6 9.1C147.9 9.4 148.3 9.6 148.8 9.6C149.3 9.6 149.8 9.4 150.1 9.1C150.5 8.7 150.6 8.3 150.6 7.8C150.6 7.3 150.5 6.9 150.1 6.5C149.8 6.2 149.3 6 148.8 6ZM148 6.7H148.8C149.1 6.7 149.3 6.7 149.4 6.7C149.7 6.8 149.8 7 149.8 7.3C149.8 7.5 149.7 7.7 149.6 7.8C149.5 7.8 149.4 7.8 149.2 7.9C149.4 7.9 149.5 8 149.6 8.1C149.7 8.2 149.8 8.3 149.8 8.4V8.8C149.8 8.8 149.8 8.9 149.8 8.9V8.9H149.4V8.9C149.4 8.9 149.4 8.9 149.4 8.9V8.6C149.4 8.4 149.3 8.2 149.2 8.1C149.1 8 148.9 8 148.7 8H148.4V8.9H148V6.7ZM148.4 6.9V7.7H148.8C148.9 7.7 149.1 7.7 149.2 7.7C149.3 7.6 149.4 7.5 149.4 7.4L149.4 7.3C149.4 7.2 149.3 7.1 149.2 7C149.1 7 149 6.9 148.7 6.9H148.4ZM0 3.1C6.9 0.2 22.5 0.5 25.4 0.7C26.8 1.1 28.6 1.4 30.2 1.6V1.8C22 2.3 13.1 3.4 6.2 6.6C3.9 5.4 1.9 4.3 0 3.1Z" fill="currentColor"/></svg>`;
const starEmail = e => { const [u, dom] = String(e || '').split('@'); return '*'.repeat(Math.max(u.length, 11)) + '@' + (dom || ''); };
function b2cPage(c, step) {
  const d = D(), x = c.u.d, e = c.u.err || {};
  const ro = (id, label, value) => `<div class="ads-field"><label class="ads-field__label" for="${id}">${label}</label><div class="ads-control b2c__ro">${ic('email')}<input id="${id}" type="text" value="${esc(value)}" readonly></div></div>`;
  const head = (h, intro) => `<div class="b2c__logo">${B2C_LOGO}</div><h1 class="b2c__h" tabindex="-1" data-title>${h}</h1><p class="b2c__intro">${intro}</p>`;
  const err = (t) => alertBox('error', '', t), fail = c.u.alert ? err('Something went wrong. Please try again.') : '';
  if (step === 'newemail') {
    const bad = !!e.newEmail;
    return `<div class="b2c">${head('Change your email', 'We’ll send a code to your new email address. Your email won’t change until you submit it.')}${fail || (bad ? err('Some details need correcting. Check the highlighted fields below.') : '')}
      ${ro('vf-cur', 'Current email', starEmail(d.profile.email))}
      ${fieldHtml({ id: 'vf-new', f: 'newEmail', label: 'New email', type: 'email', value: x.newEmail, autocomplete: 'email', inputmode: 'email', err: e.newEmail })}
      ${busyBtn(c, 'Send code', 'Sending', 'data-a="vf-newemail"')}</div>`;
  }
  const st = c.status, wrong = st === 'invalid' || st === 'expired';
  const sent = !fail && !wrong && c.sends > 1 ? alertBox('success', 'New code requested', `A new code is on its way to ${esc(maskEmail(x.newEmail))}. Earlier codes no longer work.`) : '';
  const verify = st === 'verifying' ? `<button class="ads-btn ads-btn--block" type="button" aria-busy="true" disabled>${ic('spinner-static')}Verifying</button>` : `<button class="ads-btn ads-btn--block" type="button" data-a="vf-verify">Verify</button>`;
  const resend = c.cooldown && c.sends > 1 ? `<p class="b2c__wait" role="status">Send new code in ${c.cooldown} seconds</p>` : `<button class="ads-link b2c__resend" type="button" data-a="vf-resend">Send new code</button>`;
  const acts = st === 'expired' || fail ? `<button class="ads-btn ads-btn--block" type="button" data-a="vf-resend" ${c.cooldown ? 'disabled' : ''}>Send new code</button>${c.cooldown ? `<p class="b2c__wait" role="status">Send new code in ${c.cooldown} seconds</p>` : ''}` : `${verify}${resend}`;
  return `<div class="b2c">${head('Check your email', 'Enter the 6-digit code. Codes expire after 10 minutes.')}${fail || (wrong ? err('That verification code is incorrect. Check the code and try again.') : sent)}
    ${ro('vf-sent', 'New email', x.newEmail)}
    ${fieldHtml({ id: 'vf-code', f: 'code', label: 'Verification code', type: 'tel', value: x.code, digits: 6, max: 6, placeholder: 'XXXXXX', autocomplete: 'one-time-code', err: wrong ? 'Enter a valid verification code. If needed, request a new code.' : '' })}
    <div class="b2c__acts">${acts}</div></div>`;
}
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
    body = `${prog}<p class="ads-body-small">Demo sign-in for ${esc(d.profile.first)} ${esc(d.profile.last)}. The details are filled in.</p>${fieldHtml({ id: 'vf-email', f: 'email', label: 'Email or Guest Rewards number', value: x.email, autocomplete: 'username', req: true, err: e.email })}${fieldHtml({ id: 'vf-pw', f: 'password', label: 'Password', type: 'password', value: x.password || 'demo-pass', autocomplete: 'current-password', req: true, err: e.password })}<p class="ads-body-small ads-text-secondary">This device isn’t remembered, so we’ll ask for a code.</p>`;
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
  if (c.trigger === 'change-email' && (step === 'newemail' || (step === 'code' && c.status !== 'success'))) return { title: step === 'code' ? 'Check your email' : 'Change your email', kind: 'push', srTitle: true, cls: 'pane--b2c', body: b2cPage(c, step), foot: '', banner: false };
  return { title, kind: 'push', body: demo + (c.u.alert ? netAlert(c) : '') + body, foot, banner: false };
};
const coverNext = () => { const c = nav().cover; c.i++; c.status = 'idle'; c.u.err = {}; c.u.alert = null; pendingFocus = 'title'; render(); };
function sendCode() { const c = nav().cover; c.sends++; c.u.d.code = ''; c.status = 'idle'; startCooldown(); }
A['vf-reauth'] = () => { const c = nav().cover, x = c.u.d, e = {}; if (!x.email) e.email = 'Enter your email or Guest Rewards number.'; if (!x.password) e.password = 'Enter your password.'; else if (x.password === 'wrong') e.password = 'The email or password is incorrect.'; c.u.err = e; if (Object.keys(e).length) { pendingFocus = '[aria-invalid="true"]'; render(); return; } runNet(c, () => {}, () => coverNext(), { what: 'continue' }); };
A['vf-signin'] = () => { const c = nav().cover, x = c.u.d, e = {}; if (!x.email) e.email = 'Enter your email or Guest Rewards number.'; else if (!/^\S+@\S+\.\S+$/.test(x.email) && !/^\d{6,12}$/.test(x.email.replace(/\s/g, ''))) e.email = 'Enter a valid email or Guest Rewards number.'; if (x.password === 'wrong') e.password = 'The email or password is incorrect.'; c.u.err = e; if (Object.keys(e).length) { pendingFocus = '[aria-invalid="true"]'; render(); return; } runNet(c, () => {}, () => coverNext(), { what: 'sign in' }); };
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
  if (c.trigger === 'change-email' && String(code || '').length !== 6) { c.status = 'invalid'; pendingFocus = '#vf-code'; render(); return; }
  if (V().net === 'offline') { c.u.alert = { kind: 'offline', what: 'verify your code' }; render(); return; }
  c.status = 'verifying'; c.u.alert = null; render();
  setTimeout(() => { if (nav().cover !== c) return; c.status = code === '123456' ? 'success' : code === '000000' ? 'expired' : 'invalid'; if (c.status === 'success') clearInterval(cooldownT); if (c.status === 'success' && c.trigger === 'change-email') { endVerify(true); return; } pendingFocus = c.status === 'success' ? '.vf-success + *, [data-a="vf-finish"]' : '#vf-code'; render(); }, 900);
};
A['vf-finish'] = () => endVerify(true);
