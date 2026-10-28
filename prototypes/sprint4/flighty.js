/* Sprint 4 prototype: Version 4 Fare Finder, Flighty-inspired.
   A white rounded sheet, a large "Find a train" heading with the booking modes in context, compact
   station and date controls, and aligned rows for travelers, assistance, discounts and codes, each with
   its own Edit action. Stations, dates and traveler details open in focused sheets (shared with Version 3).
   Every action is an existing Fare Finder action; see HANDOFF.md › Version 4 for the mapping. */

// Inline mode control: a labeled native select styled as a pill (TripLink, Pass Rider)
function flPill(key, label, opts, cur) {
  const id = `fl-${key}`;
  return `<span class="fl-pill"><label class="fl-pill__label" for="${id}">${label}</label><span class="fl-pill__ctl"><select id="${id}" data-f="flmode" data-nodirty data-hook="flmode" data-key="${key}">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${ic('chevron-down', 'ads-icon--sm')}</span></span>`;
}
HOOKS.flmode = (r, t) => { A['ffc-set']({ dataset: { key: t.dataset.key, v: t.value } }); pendingFocus = '#' + t.id; };
// Station control: label, code, city and station name, so the code is never the only identification
function flStation(b, f, err) {
  const c = b[f], s = c && ST[c], label = f === 'from' ? 'From' : 'To';
  return `<button class="fl-chip fl-chip--station${err ? ' is-error' : ''}" type="button" data-a="pick-station" data-field="${f}" id="ff-${f}" ${err ? `aria-invalid="true" aria-describedby="ff-${f}-err"` : ''} aria-label="${label}: ${s ? `${s.city}, ${s.st}, ${s.name}, ${c}` : 'not chosen'}">
    <span class="fl-chip__label">${label}</span>${s ? `<span class="fl-chip__code">${c}</span><span class="fl-chip__name">${s.city}, ${s.st}</span><span class="fl-chip__sub">${s.name}</span>` : `<span class="fl-chip__empty">Choose station</span>`}</button>`;
}
function flDate(b, f, err) {
  if (f === 'ret' && b.trip === 'ow') return `<button class="fl-chip fl-chip--date fl-chip--add" type="button" data-a="add-return"><span class="fl-chip__label">Return</span><span class="fl-chip__val">${ic('plus-circle', 'ads-icon--sm')}Add Return</span></button>`;
  const val = b[f], label = f === 'dep' ? 'Depart' : 'Return';
  return `<button class="fl-chip fl-chip--date${err ? ' is-error' : ''}" type="button" data-a="pick-date" data-field="${f}" id="ff-${f}" ${err ? 'aria-invalid="true" aria-describedby="ff-ret-err"' : ''} aria-label="${label}: ${val ? fmtWeekday(val) + ', ' + fmtDate(val) : 'not chosen'}"><span class="fl-chip__label">${label}</span><span class="fl-chip__val">${val ? fmtShort(val) : 'Choose date'}</span><span class="fl-chip__sub">${val ? (val === TODAY_S ? 'Today' : parse(val).getFullYear()) : '&nbsp;'}</span></button>`;
}
// Aligned information row: icon column, label, summary, optional detail, actions
function flRow(o) {
  return `<div class="fl-row${o.muted ? ' fl-row--muted' : ''}" ${o.id ? `id="${o.id}"` : ''}><span class="fl-row__icon">${ic(o.icon)}</span><div class="fl-row__text"><span class="fl-row__label">${o.label}</span><span class="fl-row__val">${o.value}</span>${o.sub ? `<span class="fl-row__sub">${o.sub}</span>` : ''}${o.err ? `<span class="ads-helper ads-helper--error" id="${o.errId || ''}" role="alert">${ic('alert-diamond')}<span>${o.err}</span></span>` : ''}${o.extra || ''}</div>${o.actions ? `<div class="fl-row__acts">${o.actions}</div>` : ''}</div>`;
}
const flAct = (a, label, aria, data = '') => `<button class="fl-act" type="button" data-a="${a}" ${data} aria-label="${aria}">${label}</button>`;

function ffFlighty(r, ri) {
  const d = D(), b = d.booking, v = V(), member = d.signedIn, intent = intentOf(b);
  const corp = intent === 'corporate', pr = intent === 'pr', std = !corp && !pr;
  const e = r.u.showErr ? ffErrors(b) : {};
  ref('607', '608', '1060', '611', '612'); if (std) ref('613'); if (member) ref('624');
  if (d.triplink && member) ref('622'); if (d.passrider && member) ref('623', '1016', '1017', '1018', '1019');
  // Heading with the booking modes in context
  const ctx = [];
  if (member && d.triplink) ctx.push(flPill('intent', 'Booking for', [['corporate', 'Corporate'], ['personal', 'Personal']], b.intent));
  if (member && d.passrider) ctx.push(flPill('intent', 'Book as', [['pr', 'Pass Rider'], ['personal', 'Personal']], b.intent));
  const sub = corp ? 'TripLink corporate fares for you.' : pr ? 'Pass Rider travel with your employee benefits.' : 'One way or round trip, up to 8 travelers.';
  const head = `<div class="fl-head"><h3 class="fl-title" tabindex="-1" data-title>Find a train</h3>${ctx.length ? `<div class="fl-ctx">${ctx.join('')}</div>` : ''}<p class="fl-sub">${sub}${corp ? ' ' + q(12) : ''}</p>${b.modeNote ? `<p class="fl-note" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.modeNote}</span></p>` : ''}</div>`;
  // Route, then trip type and dates
  const errs = ['from', 'to'].filter(f => e[f]).map(f => `<p class="ads-helper ads-helper--error" id="ff-${f}-err">${ic('alert-diamond')}<span>${e[f]}</span></p>`).join('');
  const notice = b.notice ? `<div class="fl-notice" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.notice}</span><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="dismiss-notice" aria-label="Dismiss">${ic('close', 'ads-icon--sm')}</button></div>` : '';
  const route = `<div class="fl-route">${flStation(b, 'from', e.from)}<button class="fl-swap" type="button" data-a="swap" aria-label="Swap From and To" ${!b.from && !b.to ? 'disabled' : ''}>${ic('trip-swap-horizontal')}</button>${flStation(b, 'to', e.to)}</div>${errs}${notice}`;
  const when = `<div class="fl-when">${tripSeg()}<div class="fl-dates">${flDate(b, 'dep')}${flDate(b, 'ret', e.ret)}</div>${e.ret ? `<p class="ads-helper ads-helper--error" id="ff-ret-err">${ic('alert-diamond')}<span>${e.ret}</span></p>` : ''}</div>`;
  // Aligned rows
  const rows = [];
  if (pr) {
    const elig = d.passrider.role === 'employee' && d.passrider.business, miss = r.u.showErr && !b.prType;
    rows.push(flRow({ icon: 'payment-passrider', label: 'Travel type', value: elig ? `<span class="fl-pill fl-pill--row"><span class="fl-pill__ctl${miss ? ' is-error' : ''}"><select id="fl-prtype" data-f="flpr" data-nodirty data-hook="flprtype" aria-label="Travel type, required" ${miss ? 'aria-invalid="true" aria-describedby="fl-prt-err"' : ''}><option value="" ${b.prType ? '' : 'selected'}>Choose travel type</option><option value="business" ${b.prType === 'business' ? 'selected' : ''}>Business</option><option value="leisure" ${b.prType === 'leisure' ? 'selected' : ''}>Leisure</option></select>${ic('chevron-down', 'ads-icon--sm')}</span></span>` : 'Leisure',
      sub: elig ? 'Required. Business travel is for you alone.' : d.passrider.role === 'employee' ? 'Business travel needs an active Business Pass.' : 'Spouses and dependents travel as Leisure.', err: miss ? 'Choose Business or Leisure travel.' : '', errId: 'fl-prt-err' }));
  }
  const paxErr = r.u.showErr && std && paxProblems(b.pax).length ? paxProblems(b.pax)[0] : '';
  rows.push(flRow({ id: 'ff-trav', icon: 'people', label: 'Travelers', value: esc(corp ? '1 Adult · You' : pr ? prSummary(b, d) : paxSummary(b)), sub: corp ? 'Corporate bookings are for you only.' : '', err: paxErr, actions: flAct('pick-travelers', 'Edit', 'Edit travelers') }));
  // Assistance (NMA-973): Add sets the same "Traveler with disability or need help?" answer the checkbox sets elsewhere
  if (v.entry === 'ff') {
    ref('973', '614');
    const on = b.assistOn, done = b.assistDone, items = done ? assistSummaryItems(b.assist) : [];
    rows.push(flRow({ icon: 'assistance', label: `Assistance ${q(7)}`,
      value: on && done ? esc(items[0]) : on ? 'Questions not answered yet' : 'Not requested',
      sub: on && done ? `${esc(items.slice(1).join(' · '))}${items.length > 1 ? '<br>' : ''}<span class="fl-tag">${b.assistFromProfile ? 'From your Profile' : 'This trip only'}</span>${b.assist.cat === 'disability' ? (pwdApplies(b) ? ' Passenger with Disability discount applies.' : ' Passenger discounts aren’t used for this booking.') : ''}` : on ? '' : 'Traveler with disability or need help? For example a mobility device, a service animal, hearing loss or station help. One traveler with a disability may bring one personal companion.',
      actions: on ? `${flAct('assist-edit', done ? 'Edit' : 'Answer', done ? 'Edit assistance' : 'Answer assistance questions')}${flAct('fl-assist-off', 'Remove', 'Remove assistance from this booking')}` : flAct('fl-assist-on', 'Add', 'Add assistance for Traveler 1') }));
  } else rows.push(flRow({ icon: 'assistance', label: `Assistance ${q(7)}`, value: b.assistOn && b.assistDone ? esc(assistSummaryItems(b.assist)[0]) : 'Not requested', sub: 'Set in Travelers.', actions: flAct('pick-travelers', 'Edit', 'Edit assistance in Travelers') }));
  if (std) {
    rows.push(flRow({ icon: 'discount', label: 'Discounts', value: esc(discSummary(b)), sub: 'One per traveler.', actions: flAct('pick-travelers', 'Edit', 'Edit traveler discounts') }));
    { // Coupon or promo code (NMA-613), kept apart from traveler discounts
      const info = `<button class="ads-icon-btn ads-icon-btn--sm fl-info" type="button" data-a="code-info" aria-label="About discount codes">${ic('info-circle', 'ads-icon--sm')}</button>`;
      rows.push(b.code ? flRow({ icon: 'payment-voucher', label: 'Coupon or promo code', value: `${esc(b.code.code)} · ${esc(b.code.kind)}`, sub: `${b.code.benefit ? esc(b.code.benefit) + '. ' : ''}Checked for your trip when you find trains.`, err: b.codeErr, errId: 'ffc-code-err', actions: info + flAct('code-remove', 'Remove', `Remove code ${esc(b.code.code)}`) })
        : flRow({ icon: 'payment-voucher', label: 'Coupon or promo code', value: 'None', actions: info + flAct('push', 'Add', 'Add a coupon or promo code', 'data-s="code"') }));
    }
  } else rows.push(flRow({ icon: 'discount', label: 'Discounts and codes', value: `Not used for ${corp ? 'Corporate bookings' : 'Pass Rider travel'}`, muted: true }));
  if (d.coupons.length && std) tip('Discount code: try V123, a 14-character coupon, the companion coupon with 1 traveler, “EXP1” (rejected) or “DATE” (wrong date range).');
  const offline = v.net === 'offline' ? `<div class="ads-banner fl-banner" role="status">${ic('alert-triangle')}<span>You’re offline. You can fill in your trip. Finding trains needs a connection.</span></div>` : '';
  const body = `${offline}${head}<section class="fl-search" aria-label="Route and dates">${route}${when}</section><section class="fl-rows" aria-label="Travelers, assistance, discounts and codes">${rows.join('')}</section>${netAlert(r)}`;
  return { title: 'New Booking', srTitle: true, cls: 'pane--fl', kind: 'root', banner: false, body, foot: r.u.busy ? busyBtn(r, '', 'Finding trains') : `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="find-trains">Find Trains</button>` };
}
A['fl-assist-on'] = (t, ri) => { const b = D().booking; b.assistOn = true; if (!b.assistDone) { push('assist', {}, +ri); return; } pendingFocus = '[data-a="assist-edit"]'; render(); };
A['fl-assist-off'] = () => { D().booking.assistOn = false; pendingFocus = '[data-a="fl-assist-on"]'; toast('Assistance removed from this booking', 'info'); };
HOOKS.flprtype = (r, t) => { D().booking.prType = t.value || null; pendingFocus = '#fl-prtype'; };

// Version 4 demo states (Flow menu › H), on top of the Version 3 ones
Object.assign(V3_PLACES, {
  populated: () => {
    const b = D().booking;
    Object.assign(b, { from: 'NYP', to: 'WAS', trip: 'rt', dep: addDays(TODAY_S, 7), ret: addDays(TODAY_S, 10), assistOn: true, assistDone: true, assistFromProfile: false, assist: { cat: 'disability', dis: ['mobility'], wc: true, needs: ['station'] } });
    b.pax = { adult: 2, senior: 0, ya: 0, youth: 0, child: 1, infant: 0 }; b.tdisc = { 'adult-2': 'military' }; b.code = clone(PROFILE_CODES[0]);
    render();
  },
  loading: () => { V3_PLACES.populated(); V().net = 'slow'; A['find-trains'](null, '0'); },
  offline: () => { V3_PLACES.populated(); V().net = 'offline'; A['find-trains'](null, '0'); }
});
