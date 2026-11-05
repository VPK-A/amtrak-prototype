/* Sprint 4 prototype: "Coupon or promotional code" explorations (design team; chosen in Prototype controls).
   Starting point: the current code screen (field, Saved codes sheet, About codes). Two directions, one primary view each:
   1. Deals in the coupon view: Code field, then tabs "Your codes" / "Deals". Used and expired codes sit in a
      disclosure. Deals for this trip, saved deals and Browse all deals live in the Deals tab.
   2. Focused coupon view: Code field, saved codes inline, used and expired in a disclosure, and one Deals entry
      beside them that opens a Deals view (secondary, Back returns).
   Rules kept from the current design: one coupon or promotion code per booking; codes aren't used with points; the
   code is checked when you find trains (format first, then the back end), never before; Done returns to New booking;
   Back goes up one level. Choosing a deal or a saved code fills the Code field, so it replaces any code already there
   (with a confirmation when a different code would be replaced). Offer and code details open in a secondary view.
   Deal eligibility is shown only where trip details can decide it; anything that depends on fares or seats says it's
   checked when you find trains. Sample deals are placeholders for the deals service (not in Sprint 4). */

const CX = {
  mode: ['integrated', 'focused'].includes(store.get('s4-cmp-coupon')) ? store.get('s4-cmp-coupon') : 'current',
  data: ['loading', 'error', 'empty'].includes(store.get('s4-cmp-cxdata')) ? store.get('s4-cmp-cxdata') : 'ok'
};
const cxOn = () => CX.mode !== 'current' && v1();

// ---------- Sample content ----------
// Restrictions for the saved codes in the sample account (placeholder for each code's terms from the coupon service)
const CODE_TERMS = {
  V123: 'Northeast Regional, Coach. Can’t be combined with other codes.',
  '60412233445566': 'Needs at least 2 travelers. The companion travels in the same class.',
  '60998877665544': 'One trip, up to $25. Can’t be used with points.',
  '60123456789012': 'One trip.', '60555544443333': 'One trip, Coach.'
};
const NEC = ['BOS', 'PVD', 'NHV', 'STM', 'NYP', 'NWK', 'EWR', 'TRE', 'PHL', 'WIL', 'BAL', 'BWI', 'WAS'];
const dow = s => parse(s).getDay(); // 0 Sunday … 6 Saturday
const DEALS = [
  { id: 'midweek', title: 'Northeast midweek saver', benefit: '20% off Coach', code: 'MIDW', bookBy: '2026-12-15', travelBy: '2027-02-28',
    terms: ['Northeast Corridor stations, Boston to Washington', 'Depart Tuesday, Wednesday or Thursday', 'Coach only, while seats last'],
    fit: b => !b.from || !b.to ? ['pending', 'Choose your stations to see if your route qualifies.'] : !(NEC.includes(b.from) && NEC.includes(b.to)) ? ['no', 'For trips between Northeast Corridor stations.'] : ![2, 3, 4].includes(dow(b.dep)) ? ['no', 'Depart on a Tuesday, Wednesday or Thursday.'] : ['match', 'Your route and departure day qualify.'] },
  { id: 'weekend', title: 'Weekend getaway', benefit: '15% off Coach and Business', code: 'WKND', bookBy: '2027-01-15', travelBy: '2027-03-31',
    terms: ['Depart Friday, Saturday or Sunday', 'Round trips return by the following Monday', 'Coach and Business'],
    fit: b => ![5, 6, 0].includes(dow(b.dep)) ? ['no', 'Depart on a Friday, Saturday or Sunday.'] : b.trip === 'rt' && b.ret && (parse(b.ret) - parse(b.dep)) / 864e5 > 3 ? ['no', 'Return by the Monday after you leave.'] : ['match', 'Your departure day qualifies.'] },
  { id: 'kids', title: 'Kids ride for half', benefit: '50% off for children 2 to 12', code: 'KIDS', bookBy: '2026-12-31', travelBy: '2027-06-30',
    terms: ['Children 2 to 12 traveling with an adult', 'Up to 2 children per adult', 'All routes, Coach'],
    fit: b => !(b.pax.child > 0) ? ['no', 'Add a child aged 2 to 12 to use this deal.'] : !(b.pax.adult + b.pax.senior > 0) ? ['no', 'Children need an adult on the booking.'] : ['match', 'Your travelers qualify.'] },
  { id: 'group', title: 'Travel together', benefit: '10% off for 3 or more travelers', code: 'GRP3', bookBy: '2027-03-31', travelBy: '2027-06-30',
    terms: ['3 to 8 travelers on one booking', 'All routes'],
    fit: b => paxAll(b.pax) < 3 ? ['no', `Add ${3 - paxAll(b.pax)} more traveler${3 - paxAll(b.pax) > 1 ? 's' : ''} to use this deal.`] : ['match', 'Your number of travelers qualifies.'] },
  { id: 'autotrain', title: 'Auto Train fall offer', benefit: '$50 off your vehicle', code: 'AUTO', bookBy: '2026-11-30', travelBy: '2026-12-20',
    terms: ['Lorton, VA and Sanford, FL only', 'One vehicle per booking'],
    fit: b => !b.from || !b.to ? ['pending', 'Choose your stations to see if your route qualifies.'] : [b.from, b.to].sort().join() !== 'LOR,SFA' ? ['no', 'For Auto Train between Lorton and Sanford.'] : ['match', 'Your route qualifies.'] },
  { id: 'saver', title: 'Saver fares', benefit: 'Our lowest Coach fares', code: '', bookBy: '', travelBy: '',
    terms: ['No code needed', 'Shown in search results when seats are available', 'Changes and refunds are limited'],
    fit: () => ['pending', 'Shown in your search results when seats are available. No code needed.'] }
];
const dealById = id => DEALS.find(x => x.id === id);
const cxData = () => CX.data === 'empty' ? 'empty' : CX.data;
const dealsCatalog = () => cxData() === 'empty' ? [] : DEALS;
const savedDealIds = () => { const d = D(); if (!d.signedIn) return []; if (!d.savedDeals) d.savedDeals = ['kids', 'weekend']; return cxData() === 'empty' ? [] : d.savedDeals; };
const cxSaved = () => cxData() === 'empty' ? [] : savedCodes();
const cxPast = () => !D().signedIn || cxData() === 'empty' ? [] : [...(D().couponsPast || [])].sort((x, y) => y.exp.localeCompare(x.exp));
const dealFit = (x, b) => { const [state, why] = x.fit(b); return { state, why }; };
const tripDeals = b => dealsCatalog().filter(x => dealFit(x, b).state !== 'no').sort((p, q) => (dealFit(p, b).state === 'match' ? 0 : 1) - (dealFit(q, b).state === 'match' ? 0 : 1));

// Loading the saved codes and deals (toolbar setting): loads, slow (1.5 s), fails (Try again), or none saved
function cxLoad(r) {
  if (r.u.cxLoad) return r.u.cxLoad;
  r.u.cxLoad = cxData() === 'loading' ? 'loading' : cxData() === 'error' ? 'error' : 'ok';
  if (r.u.cxLoad === 'loading') setTimeout(() => { if (r.u.cxLoad === 'loading') { r.u.cxLoad = 'ok'; render(); } }, 1500);
  return r.u.cxLoad;
}
A['cx-retry'] = (t, ri) => { const r = routeAt(ri); r.u.cxLoad = 'loading'; CX.data = CX.data === 'error' ? 'ok' : CX.data; pendingFocus = '#cx-status'; render(); setTimeout(() => { r.u.cxLoad = 'ok'; render(); }, 1200); };
const cxSkeleton = label => `<div class="cpn-loading" role="status" aria-live="polite"><span class="ads-sr-only">${label}</span>${'<div class="cpn-skel" aria-hidden="true"><i></i><i></i><i></i></div>'.repeat(2)}</div>`;
const cxError = what => alertBox('error', `We couldn’t load your ${what}`, 'You can still enter a code above. Try again in a moment.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="cx-retry">Try again</button>');

// ---------- The Code field (shared by both explorations) ----------
// Label with the info icon beside it, the field and Clear. The status line never says a code is valid before it's checked.
function cxEntry(r, b) {
  const st = codeStateOf(b), text = b.codeText || '', busy = r.u.busy && text, bad = !busy && ['invalid', 'ineligible', 'error'].includes(st);
  const src = text ? [...cxSaved(), ...DEALS.filter(x => x.code)].find(x => x.code === text) : null;
  let msg = '';
  if (bad) msg = `<p class="ads-helper ads-helper--error" id="ff-code-h" tabindex="-1">${ic('alert-diamond')}<span>${esc(b.codeErr)}</span></p>`;
  else if (st === 'applied') msg = `<p class="ads-helper ads-helper--success" id="ff-code-h">${ic('check-circle', 'ads-icon--sm')}<span>Code applied${b.code && b.code.benefit ? `: ${esc(b.code.benefit)}` : ''}</span></p>`;
  else if (st === 'changed') msg = `<p class="ads-helper" id="ff-code-h">${ic('info-circle', 'ads-icon--sm')}<span>Your trip changed, so this code will be checked again when you find trains.</span></p>`;
  else if (text) msg = `<p class="ads-helper" id="ff-code-h">${src ? `${esc(src.name || src.title)} selected. ` : ''}We’ll check this code when you find trains.</p>`;
  else msg = '<p class="ads-helper" id="ff-code-h">Enter a code, or choose one you’ve saved.</p>';
  return `<div class="ads-field cx-entry" id="dcode"><div class="dcode__head"><label class="ads-field__label" for="ff-code">Code <span class="ads-field__marker ads-field__marker--optional">Optional</span></label><button class="ads-icon-btn ads-icon-btn--sm dcode__info" type="button" data-a="code-info" aria-label="About coupon and promotion codes">${ic('info-circle', 'ads-icon--sm')}</button></div>
    <div class="dcode__row"><div class="ads-control${bad ? ' ads-control--error' : ''}"><input id="ff-code" type="text" data-f="code" data-nodirty data-hook="ffcode" value="${esc(text)}" placeholder="Enter code" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="ff-code-h"${bad ? ' aria-invalid="true"' : ''}${busy ? ' readonly' : ''}></div>${text ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="code-remove" aria-label="Clear code ${esc(text)}">Clear</button>` : ''}</div>
    <div id="cx-status" role="status">${msg}</div></div>`;
}

// ---------- Saved codes: choose one inline (radio list); used and expired in a disclosure ----------
function cxCodeItem(c, b) {
  const sel = b.codeText === c.code, soonX = soon(c);
  return `<li class="cx-item${sel ? ' is-selected' : ''}"><label class="ads-choice ads-radio cx-pick"><input type="radio" name="cx-code" value="${c.code}" data-a="cx-pick" data-code="${c.code}" ${sel ? 'checked' : ''} aria-describedby="cx-t-${c.code}"><span class="ads-choice__control"></span>
    <span class="cx-text"><span class="cx-title">${esc(c.name || c.kind)}${soonX ? ' <span class="ads-badge ads-badge--warning">Expires soon</span>' : ''}</span><span class="cx-benefit">${esc(c.benefit)}</span><span class="cx-meta">${esc(c.kind)} · <span class="cx-code">${c.code}</span> · Expires ${fmtExp(c.exp)}</span><span class="cx-terms" id="cx-t-${c.code}">${esc(CODE_TERMS[c.code] || '')}</span></span></label>
    <button class="ads-link ads-link--sm linkbtn cx-more" type="button" data-a="cx-codeinfo" data-code="${c.code}">Details<span class="ads-sr-only"> for ${esc(c.name || c.kind)}</span></button></li>`;
}
function cxPastItem(c) {
  const st = couponState(c), use = c.uses && c.uses[0];
  return `<li class="cx-item cx-item--done"><span class="cx-text"><span class="cx-title">${esc(c.name || c.kind)} <span class="ads-badge">${st === 'used' ? 'Used' : 'Expired'}</span></span><span class="cx-benefit">${esc(c.benefit)}</span><span class="cx-meta"><span class="cx-code">${c.code}</span> · ${st === 'used' ? `Used ${fmtExp(use.date)} · Booking ${use.pnr}` : `Expired ${fmtExp(c.exp)}`}</span><span class="cx-terms">Can’t be applied</span></span>
    <button class="ads-link ads-link--sm linkbtn cx-more" type="button" data-a="cx-codeinfo" data-code="${c.code}">Details<span class="ads-sr-only"> for ${esc(c.name || c.kind)}</span></button></li>`;
}
function cxCodes(r, b) {
  const d = D(), load = cxLoad(r);
  if (!d.signedIn) return `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">Sign in to see your saved codes</p><p class="ads-body-small">Codes in your account show up here. You can still enter a code above.</p></div>`;
  if (load === 'loading') return cxSkeleton('Loading your saved codes');
  if (load === 'error') return cxError('saved codes');
  const avail = cxSaved(), past = cxPast();
  const list = avail.length ? `<fieldset class="cx-set"><legend class="ads-sr-only">Saved codes</legend><ul class="cx-list">${avail.map(c => cxCodeItem(c, b)).join('')}</ul></fieldset>`
    : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">No saved codes</p><p class="ads-body-small">Codes you add in My coupons show up here.</p></div>`;
  const open = r.u.cxOpen && r.u.cxOpen.past;
  const pastH = past.length ? `<details class="ads-accordion ads-accordion--sm cx-past" data-cxk="past"${open ? ' open' : ''}><summary>Used and expired (${past.length})${ic('chevron-down')}</summary><div class="ads-accordion__panel"><ul class="cx-list" aria-label="Used and expired codes">${past.map(cxPastItem).join('')}</ul><p class="ss-note">Used and expired codes can’t be applied. They stay here for a limited time.</p></div></details>` : '';
  return list + pastH;
}
A['cx-pick'] = t => {
  const b = D().booking, c = savedCodes().find(x => x.code === t.dataset.code); if (!c) return;
  Object.assign(b, { codeText: c.code, code: clone(c), codeState: '', codeErr: '', codeSrc: 'saved' });
  pendingFocus = `[data-a="cx-pick"][data-code="${c.code}"]`; render();
};

// ---------- Deals ----------
function cxDeal(x, b, o = {}) {
  const f = dealFit(x, b), inUse = x.code && b.codeText === x.code, saved = savedDealIds().includes(x.id);
  const badge = f.state === 'match' ? '<span class="ads-badge ads-badge--info">Matches your trip</span>' : f.state === 'pending' ? '<span class="ads-badge">Needs checking</span>' : '<span class="ads-badge">Doesn’t match this trip</span>';
  const use = !x.code ? '' : inUse ? `<span class="cx-inuse">${ic('check-circle', 'ads-icon--sm')}In your Code field</span>` : `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="cx-usedeal" data-id="${x.id}" ${f.state === 'no' ? `disabled aria-describedby="cx-d-${o.k || ''}${x.id}"` : ''}>Use deal<span class="ads-sr-only">: ${esc(x.title)}</span></button>`;
  const save = D().signedIn ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="cx-savedeal" data-id="${x.id}" aria-pressed="${saved}">${ic(saved ? 'bookmark-filled' : 'bookmark', 'ads-icon--sm')}${saved ? 'Saved' : 'Save'}<span class="ads-sr-only"> ${esc(x.title)}</span></button>` : '';
  return `<li class="cx-deal${inUse ? ' is-selected' : ''}"><div class="cx-text"><span class="cx-kicker">Deal${x.code ? '' : ' · no code'}</span><span class="cx-title">${esc(x.title)}</span><span class="cx-benefit">${esc(x.benefit)}</span>${x.travelBy ? `<span class="cx-meta">Book by ${fmtExp(x.bookBy)} · Travel by ${fmtExp(x.travelBy)}</span>` : ''}
    <span class="cx-fit">${badge}<span class="cx-why" id="cx-d-${o.k || ''}${x.id}">${esc(f.why)}${f.state === 'match' && x.code ? ' Final check when you find trains.' : ''}</span></span></div>
    <div class="cx-acts">${use}<button class="ads-link ads-link--sm linkbtn" type="button" data-a="cx-dealinfo" data-id="${x.id}">Terms<span class="ads-sr-only"> for ${esc(x.title)}</span></button>${save}</div></li>`;
}
function cxDealsBody(r, b, o = {}) {
  const load = cxLoad(r);
  if (load === 'loading') return cxSkeleton('Loading deals');
  if (load === 'error') return cxError('deals');
  const trip = tripDeals(b), savedIds = savedDealIds(), saved = savedIds.map(dealById).filter(Boolean);
  const tripH = trip.length ? `<ul class="cx-list">${trip.map(x => cxDeal(x, b, { k: 't-' })).join('')}</ul>` : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">No deals for this trip right now</p><p class="ads-body-small">Browse all deals to see offers for other dates and routes.</p></div>`;
  const savedH = !D().signedIn ? `<p class="ads-body-small cx-note">Sign in to see deals you’ve saved.</p>` : saved.length ? `<ul class="cx-list">${saved.map(x => cxDeal(x, b, { k: 's-' })).join('')}</ul>` : `<p class="ads-body-small cx-note">No saved deals. Save a deal to find it here.</p>`;
  return `<section class="cx-sec" aria-labelledby="cx-trip-h"><h3 class="cx-h" id="cx-trip-h">Deals for this trip</h3><p class="cx-sub">Based on your route, dates and travelers. Prices and seats are checked when you find trains.</p>${tripH}</section>
    <section class="cx-sec" aria-labelledby="cx-sd-h"><h3 class="cx-h" id="cx-sd-h">Saved deals</h3><p class="cx-sub">Offers you’ve saved from Deals. They’re different from codes saved to your account.</p>${savedH}</section>
    <div class="ads-group"><div class="ads-group__body">${grow({ a: 'cx-alldeals', label: 'Browse all deals', value: 'Other routes and dates. Your booking and code stay as they are.', icon: 'payment-gift-card', k: 'cx-all' })}</div></div>`;
}
const cxNotes = () => { snote('Exploration: deals are sample content standing in for the deals service (not in Sprint 4). “Matches your trip” uses only trip details; fares and seats are checked when you find trains.'); snote('One coupon or promotion code per booking: choosing a deal or a saved code fills the Code field and replaces any code already there.'); tip('Try: Prototype controls › Saved codes and deals › Loading, Fails to load or None saved. Choose a deal while V123 is selected to see the replace confirmation.'); };

// Using a deal fills the Code field. It replaces a different code already there, after asking.
A['cx-usedeal'] = (t, ri) => {
  const b = D().booking, x = dealById(t.dataset.id); if (!x || !x.code) return;
  const go = () => {
    Object.assign(b, { codeText: x.code, code: { code: x.code, kind: 'Promotion code', name: x.title, benefit: x.benefit, exp: x.bookBy }, codeState: '', codeErr: '', codeSrc: 'deal' });
    const sh = sheet(), at = sh.stack.findIndex(r => r.s === 'dcode');
    if (at >= 0 && at < sh.stack.length - 1) popTo(at); // back to the coupon view, which shows the code in the field
    pendingFocus = '#ff-code'; toast(`${x.title} added. We’ll check it when you find trains.`);
  };
  if (b.codeText && b.codeText !== x.code) {
    const cur = [...savedCodes(), ...DEALS].find(c => c.code === b.codeText);
    return dialog({ title: 'Replace your code?', returnFocus: `[data-a="cx-usedeal"][data-id="${x.id}"]`,
      body: `Only one coupon or promotion code can be used per booking. ${esc(x.title)} (${x.code}) will replace ${cur ? `${esc(cur.name || cur.title)} (${b.codeText})` : `the code ${esc(b.codeText)}`}.`,
      actions: [['Use deal', 'primary', go], ['Keep current code', 'secondary', null]] });
  }
  go();
};
A['cx-savedeal'] = t => { const d = D(), id = t.dataset.id; savedDealIds(); d.savedDeals = d.savedDeals.includes(id) ? d.savedDeals.filter(x => x !== id) : d.savedDeals.concat(id); pendingFocus = `[data-a="cx-savedeal"][data-id="${id}"]`; toast(d.savedDeals.includes(id) ? 'Deal saved' : 'Deal removed from saved deals', 'info'); };
A['cx-dealinfo'] = (t, ri) => push('cx-deal', { id: t.dataset.id }, +ri);
A['cx-codeinfo'] = (t, ri) => push('cx-code', { code: t.dataset.code }, +ri);
A['cx-alldeals'] = (t, ri) => push('cx-alldeals', {}, +ri);
A['cx-deals'] = (t, ri) => push('cx-deals', {}, +ri);
A['cx-tab'] = (t, ri) => { routeAt(ri).u.cxTab = t.dataset.v; pendingFocus = `[data-a="cx-tab"][data-v="${t.dataset.v}"]`; render(); };
// Keep disclosures open across renders
document.addEventListener('toggle', e => { const el = e.target; if (!el.matches || !el.matches('#device details[data-cxk]')) return; const r = routeAt(riOf(el)); if (r) { r.u.cxOpen = Object.assign({}, r.u.cxOpen, { [el.dataset.cxk]: el.open }); } }, true);

// ---------- The primary view ----------
const dcodeBase = SCR.dcode;
SCR.dcode = (r, ri) => {
  if (!cxOn()) return dcodeBase(r, ri);
  const b = D().booking; ref('613'); if (D().coupons.length) ref('697'); cxNotes();
  const foot = `<button class="ads-btn ads-btn--block" type="button" data-a="dcode-done">Done</button>`;
  let body;
  if (CX.mode === 'integrated') {
    const tab = r.u.cxTab || 'codes', nDeals = cxLoad(r) === 'ok' ? tripDeals(b).length : null;
    const tabs = `<div class="ads-tabs ads-tabs--fill cx-tabs" role="tablist" aria-label="Codes and deals">${tabBtn(tab === 'codes', 'data-a="cx-tab" data-v="codes" id="cx-tab-codes" aria-controls="cx-panel"', `Your codes${D().signedIn && cxLoad(r) === 'ok' ? ` (${cxSaved().length})` : ''}`)}${tabBtn(tab === 'deals', 'data-a="cx-tab" data-v="deals" id="cx-tab-deals" aria-controls="cx-panel"', `Deals${nDeals != null ? ` (${nDeals})` : ''}`)}</div>`;
    body = `${cxEntry(r, b)}${tabs}<div class="cx-panel" id="cx-panel" role="tabpanel" aria-labelledby="cx-tab-${tab}">${tab === 'codes' ? cxCodes(r, b) : cxDealsBody(r, b)}</div>`;
  } else {
    const load = cxLoad(r), trip = load === 'ok' ? tripDeals(b) : [], match = trip.filter(x => dealFit(x, b).state === 'match').length, nSaved = savedDealIds().length;
    const val = load === 'loading' ? 'Loading deals' : load === 'error' ? 'Deals couldn’t load. Open to try again.' : trip.length ? `${match ? `${match} match${match > 1 ? '' : 'es'} your trip` : 'None match yet'}${trip.length - match ? ` · ${trip.length - match} need${trip.length - match > 1 ? '' : 's'} checking` : ''}${nSaved ? ` · ${nSaved} saved` : ''}` : `No deals for this trip${nSaved ? ` · ${nSaved} saved` : ''}`;
    body = `${cxEntry(r, b)}<section class="cx-sec" aria-labelledby="cx-sc-h"><h3 class="cx-h" id="cx-sc-h">Saved codes</h3>${cxCodes(r, b)}</section>
      <section class="cx-sec" aria-labelledby="cx-dl-h"><h3 class="cx-h" id="cx-dl-h">Deals</h3><div class="ads-group"><div class="ads-group__body">${grow({ a: 'cx-deals', label: 'Deals for this trip and saved deals', value: esc(val), icon: 'payment-gift-card', k: 'cx-dealsrow' })}</div></div></section>`;
  }
  return { title: 'Coupon or promotional code', kind: 'push', cls: 'pane--cx', body, foot, footCls: 'ads-actionfooter', offlineText: 'You can enter a code. Saved codes and deals need a connection.' };
};
// Exploration 2: Deals as a secondary view next to the coupon view
SCR['cx-deals'] = (r, ri) => { const b = D().booking; cxNotes(); return { title: 'Deals', kind: 'push', cls: 'pane--cx', body: `${b.codeText ? `<p class="cx-current">${ic('payment-voucher', 'ads-icon--sm')}<span>Code in your booking: <b>${esc(b.codeText)}</b>. A deal you use replaces it.</span></p>` : ''}${cxDealsBody(r, b)}` }; };
// Browse all deals: the wider deals experience, inside the booking so nothing is lost on the way back
SCR['cx-alldeals'] = (r, ri) => {
  const b = D().booking, load = cxLoad(r), all = dealsCatalog();
  snote('Browse all deals stands in for the Deals experience outside booking (not in Sprint 4). It opens inside the booking, so Back returns with the booking, code and selections unchanged.');
  const body = load === 'loading' ? cxSkeleton('Loading deals') : load === 'error' ? cxError('deals') : all.length ? `<p class="cx-sub">Every current offer. Whether each one fits this trip is shown with it.</p><ul class="cx-list">${all.map(x => cxDeal(x, b, { k: 'a-' })).join('')}</ul>` : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">No deals right now</p><p class="ads-body-small">Check back soon.</p></div>`;
  return { title: 'All deals', kind: 'push', cls: 'pane--cx', body };
};
// Offer details (secondary view)
SCR['cx-deal'] = (r, ri) => {
  const b = D().booking, x = dealById(r.p.id); if (!x) return { title: 'Deal', kind: 'push', body: '<p>This deal isn’t available any more.</p>' };
  const f = dealFit(x, b);
  const body = `<div class="cx-detail"><p class="cx-kicker">Deal${x.code ? '' : ' · no code'}</p><h3 class="ads-h4 cx-detail__t">${esc(x.title)}</h3><p class="ads-body">${esc(x.benefit)}</p>
    <dl class="cpn-dl">${x.code ? `<dt>Code</dt><dd>${x.code}</dd>` : ''}${x.bookBy ? `<dt>Book by</dt><dd>${fmtDate(x.bookBy)}</dd><dt>Travel by</dt><dd>${fmtDate(x.travelBy)}</dd>` : ''}<dt>For this trip</dt><dd>${esc(f.why)}</dd></dl>
    <h4 class="cx-h">Terms</h4><ul class="cx-terms-list">${x.terms.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="ads-body-small cx-note">${x.code ? 'One coupon or promotion code per booking, so this deal can’t be combined with another code. Codes can’t be used when you pay with points. Whether it combines with passenger discounts is checked when you find trains.' : 'Saver fares need no code and can be combined with a code where the code’s terms allow.'}</p></div>`;
  const inUse = x.code && b.codeText === x.code;
  const foot = x.code ? (inUse ? '<p class="ads-helper">This deal is in your Code field.</p>' : `<button class="ads-btn ads-btn--block" type="button" data-a="cx-usedeal" data-id="${x.id}" ${f.state === 'no' ? 'disabled aria-describedby="cx-detail-why"' : ''}>Use deal</button>${f.state === 'no' ? `<p class="ads-helper" id="cx-detail-why">${esc(f.why)}</p>` : ''}`) : '';
  return { title: 'Deal details', kind: 'push', cls: 'pane--cx', body, foot, footCls: foot ? 'ads-actionfooter' : '' };
};
// Saved code details (secondary view); used and expired codes show their history and can't be applied
SCR['cx-code'] = (r, ri) => {
  const d = D(), b = d.booking, c = [...d.coupons, ...(d.couponsPast || [])].find(x => x.code === r.p.code);
  if (!c) return { title: 'Code details', kind: 'push', body: '<p>This code isn’t in your account any more.</p>' };
  const st = couponState(c);
  const body = `<div class="cx-detail"><p class="cx-kicker">${esc(c.kind)}${st !== 'available' ? ` · <span class="ads-badge">${st === 'used' ? 'Used' : 'Expired'}</span>` : ''}</p><h3 class="ads-h4 cx-detail__t">${esc(c.name || c.kind)}</h3><p class="ads-body">${esc(c.benefit)}</p>
    <dl class="cpn-dl"><dt>Code</dt><dd>${c.code}</dd><dt>Issued</dt><dd>${fmtDate(c.issued)}</dd><dt>${st === 'expired' ? 'Expired' : 'Expires'}</dt><dd>${fmtDate(c.exp)}</dd>${c.uses && c.uses.length ? `<dt>Used</dt><dd>${c.uses.map(u => `${fmtDate(u.date)} · Booking ${u.pnr}`).join('<br>')}</dd>` : ''}<dt>Restrictions</dt><dd>${esc(CODE_TERMS[c.code] || 'See the coupon’s terms.')}</dd></dl>
    ${st !== 'available' ? '<p class="ads-body-small cx-note">Used and expired codes can’t be applied.</p>' : '<p class="ads-body-small cx-note">We check the code against your train, dates and travelers when you find trains.</p>'}</div>`;
  const foot = st === 'available' ? (b.codeText === c.code ? '<p class="ads-helper">This code is in your Code field.</p>' : `<button class="ads-btn ads-btn--block" type="button" data-a="cx-usecode" data-code="${c.code}">Use this code</button>`) : '';
  return { title: 'Code details', kind: 'push', cls: 'pane--cx', body, foot, footCls: foot ? 'ads-actionfooter' : '' };
};
A['cx-usecode'] = (t, ri) => { A['cx-pick'](t); const sh = sheet(), at = sh.stack.findIndex(r => r.s === 'dcode'); if (at >= 0) popTo(at); pendingFocus = '#ff-code'; };

// Prototype controls
(function wireCx() {
  const m = document.getElementById('tbCmpCoupon'), dd = document.getElementById('tbCmpCxData');
  if (m) { m.value = CX.mode; m.addEventListener('change', () => { CX.mode = m.value; store.set('s4-cmp-coupon', m.value); pendingFocus = null; render(); }); }
  if (dd) { dd.value = CX.data; dd.addEventListener('change', () => { CX.data = dd.value; store.set('s4-cmp-cxdata', dd.value); const sh = sheet(); if (sh) sh.stack.forEach(r => { r.u.cxLoad = null; }); pendingFocus = null; render(); }); }
})();
