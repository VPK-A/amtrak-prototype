/* Sprint 4 prototype: Version 3 Fare Finder, CLEAR-inspired.
   A navy header (heading + booking-mode controls) over a rounded light surface (route, trip type, dates,
   travelers), a labeled list for discounts, codes and assistance, and a pinned Find Trains button.
   Stations, dates, travelers, codes and assistance open as rounded sheets over the Fare Finder.
   It also carries the Sprint 4 Fare Finder variants: traveler types (NMA-611), per-traveler discounts (612),
   discount codes (613), Use Points (624), TripLink (622) and Pass Rider (623, 1016–1019). */

// ---------- Rules ----------
// Booking modes (TripLink, Pass Rider) apply in every version; each presents them its own way
const intentOf = b => b.intent || 'standard';
const autoTrainBlocked = () => intentOf(D().booking) === 'pr'; // NMA-623: Auto Train isn't offered
const PAX_PLURAL = { adult: 'Adults', senior: 'Seniors', ya: 'Young Adults', youth: 'Youths', child: 'Children', infant: 'Infants' };
const paxSeated = p => p.adult + p.senior + p.ya + p.youth + p.child; // infants don't count toward 8 (NMA-611 BR3)
const paxAll = p => paxSeated(p) + p.infant;
const MAX_PAX = 8;
function paxList(b) {
  const out = []; for (const [k] of PAX) for (let i = 1; i <= b.pax[k]; i++) out.push({ key: `${k}-${i}`, type: k, i });
  return out.map((t, n) => Object.assign(t, { n: n + 1 }));
}
function paxSummary(b) { const parts = PAX.filter(([k]) => b.pax[k]).map(([k, l]) => `${b.pax[k]} ${b.pax[k] > 1 ? PAX_PLURAL[k] : l}`); return parts.join(', ') || 'No travelers'; }
// Problems that stop the traveler selection being used (NMA-611 BR3, BR4). Youth, child and infant need an adult or senior (Q10).
function paxProblems(p) {
  const out = [];
  if (!paxAll(p)) out.push('Add at least one traveler to search.');
  const grown = p.adult + p.senior;
  if (p.youth && !grown) out.push('Youths 13 to 15 need to travel with an adult or senior. See the rules for unaccompanied minors.');
  if ((p.child || p.infant) && !grown) out.push('Children and infants must travel with at least one adult 18 or older.');
  return out;
}
// Discount shown for a traveler (NMA-612 BR5): fixed for seniors and infants, PWD for Traveler 1 when Assistance says so
function tdiscOf(b, t) {
  const fromAssist = assistDiscount(b, t.key); if (fromAssist) return fromAssist; // PWD or Companion (NMA-43 BR8)
  if (t.type === 'senior') return 'senior';
  if (t.type === 'infant') return t.i > b.pax.adult + b.pax.senior ? 'infantchild' : 'infant';
  if (t.key === 'adult-1') return b.disc;
  return b.tdisc[t.key] || TDISC[t.type][0];
}
function setTdisc(b, key, val) { if (key === 'adult-1') b.disc = val; else b.tdisc[key] = val; }
function discSummary(b) {
  const list = paxList(b).map(t => [t, tdiscOf(b, t)]).filter(([t, x]) => !['none', 'childfare', 'infant'].includes(x));
  if (!list.length) return 'None chosen';
  return list.map(([t, x]) => `${TDISC_LABEL[x]}${paxList(b).length > 1 ? ` (Traveler ${t.n})` : ''}`).join(', ');
}
const prRoleLabel = d => ({ employee: 'Employee', spouse: 'Spouse', dependent: 'Dependent' })[d.passrider.role] || 'Employee';
function prSummary(b, d) {
  if (b.prType === 'business') return 'You only · Business travel';
  const f = b.prPax, parts = ['You'];
  if (f.fam) parts.push(d.passrider.role === 'employee' ? 'spouse' : d.passrider.role === 'dependent' ? (f.fam > 1 ? 'employee and spouse' : 'employee or spouse') : 'employee (your spouse)');
  if (f.dep) parts.push(`${f.dep} dependent${f.dep > 1 ? 's' : ''}`);
  if (f.comp) parts.push(`${f.comp} companion${f.comp > 1 ? 's' : ''}`);
  return parts.join(', ');
}
const prCount = b => 1 + b.prPax.fam + b.prPax.dep + b.prPax.comp;
const travelerCount = b => intentOf(b) === 'corporate' ? 1 : intentOf(b) === 'pr' ? (b.prType === 'business' ? 1 : prCount(b)) : paxAll(b.pax);
const codeApplies = b => b.code && ['standard', 'personal'].includes(intentOf(b)) && b.pay !== 'points';
const fmtExp = s => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ---------- Fare Finder ----------
function ffcSeg(label, key, opts, cur, id) {
  return `<div class="ffc-mode"><span class="ffc-mode__label" id="ffc-${id}">${label}</span><div class="ads-segmented ffc-seg" role="group" aria-labelledby="ffc-${id}">${opts.map(([v, l]) => `<button type="button" data-a="ffc-set" data-key="${key}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div></div>`;
}
function ffClear(r, ri) {
  const d = D(), b = d.booking, v = V(), member = d.signedIn;
  const corp = b.intent === 'corporate', pr = b.intent === 'pr', std = !corp && !pr;
  ref('607', '608', '1060', '611', '612'); if (std) ref('613'); if (member) ref('624');
  if (d.triplink && member) ref('622'); if (d.passrider && member) ref('623', '1016', '1017', '1018', '1019');
  // 1. Heading and booking-mode controls
  let modes = '';
  if (member && d.triplink) modes += ffcSeg('Booking for', 'intent', [['corporate', 'Corporate'], ['personal', 'Personal']], b.intent, 'intent');
  if (member && d.passrider) modes += ffcSeg('Book as', 'intent', [['pr', 'Pass Rider'], ['personal', 'Personal']], b.intent, 'intent');
  if (member && std) modes += ffcSeg('Pay with', 'pay', [['cash', 'Cash'], ['points', 'Points']], b.pay, 'pay');
  const sub = corp ? 'TripLink corporate booking. Corporate fares for you.' : pr ? 'Pass Rider travel with your employee benefits.' : b.pay === 'points' ? 'Searching with points · 12,450 available' : 'One way or round trip, up to 8 travelers.';
  const modeNote = b.modeNote ? `<p class="ffc-modenote" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.modeNote}</span></p>` : '';
  const hero = `<div class="ffc-hero"><h3 class="ffc-title" tabindex="-1" data-title>New Booking</h3><p class="ffc-sub">${sub}</p>${modes ? `<div class="ffc-modes">${modes}</div>` : ''}${modeNote}${corp ? q(12) : ''}</div>`;
  // 2. Rounded primary surface
  let prType = '';
  if (pr) {
    const elig = d.passrider.role === 'employee' && d.passrider.business;
    prType = elig ? `<div class="ffc-field" id="ffc-prtype"><span class="ffc-label" id="ffc-prt">Travel type <span class="ads-field__marker ads-field__marker--required">Required</span></span><div class="ads-segmented" role="group" aria-labelledby="ffc-prt" ${r.u.showErr && !b.prType ? 'aria-describedby="ffc-prt-err"' : ''}>${[['business', 'Business'], ['leisure', 'Leisure']].map(([k, l]) => `<button type="button" data-a="pr-type" data-v="${k}" aria-pressed="${b.prType === k}">${l}</button>`).join('')}</div>${r.u.showErr && !b.prType ? `<p class="ads-helper ads-helper--error" id="ffc-prt-err">${ic('alert-diamond')}<span>Choose Business or Leisure travel.</span></p>` : '<p class="ads-helper">Business travel is for you alone. Family and companions travel as Leisure.</p>'}</div>`
      : `<div class="ffc-fixed"><span class="ffc-label">Travel type</span><span>Leisure</span><span class="ads-helper">${d.passrider.role === 'employee' ? 'Business travel needs an active Business Pass.' : 'Spouses and dependents travel as Leisure.'}</span></div>`;
  }
  const travVal = corp ? '1 Adult · You' : pr ? prSummary(b, d) : paxSummary(b);
  const travSub = corp ? 'Corporate bookings are for you only.' : pr ? `${prCount(b) > 1 && b.prType !== 'business' ? 'Leisure travel' : 'Pass Rider fare'}` : `Discounts: ${discSummary(b)}`;
  const paxErr = r.u.showErr && std && paxProblems(b.pax).length ? `<p class="ads-helper ads-helper--error" role="alert">${ic('alert-diamond')}<span>${paxProblems(b.pax)[0]}</span></p>` : '';
  const trav = `<button class="ffc-trav" type="button" data-a="pick-travelers" id="ff-trav" aria-label="Travelers: ${esc(travVal)}. ${esc(travSub)}">${ic('people', 'ffc-trav__icon')}<span class="ffc-trav__text"><span class="ffc-label">Travelers</span><span class="ffc-trav__val">${esc(travVal)}</span><span class="ffc-trav__sub">${esc(travSub)}</span></span>${ic('chevron-right')}</button>${paxErr}`;
  const surface = `<div class="ffc-surface">${tripSeg()}${ffNotice(b)}${routeField(r, ri)}${dateFields(r)}${prType}${trav}</div>`;
  // 3. Discounts, codes and assistance
  const rows = [];
  if (std) {
    // Traveler discounts now show per traveler in the Travelers overview (overview.js)
    if (b.pay === 'cash') {
      const info = `<button class="ads-icon-btn ads-icon-btn--sm ffc-row__info" type="button" data-a="code-info" aria-label="About discount codes">${ic('info-circle', 'ads-icon--sm')}</button>`;
      if (b.code) rows.push(`<div class="ffc-row ffc-row--static">${ic('payment-voucher', 'ffc-row__icon')}<span class="ffc-row__text"><span class="ffc-row__label">Discount code</span><span class="ffc-row__val">${esc(b.code.code)} · ${esc(b.code.kind)}</span><span class="ffc-row__sub">${b.code.benefit ? esc(b.code.benefit) + '. ' : ''}Checked for your trip when you find trains.</span>${b.codeErr ? `<span class="ads-helper ads-helper--error" id="ffc-code-err" role="alert">${ic('alert-diamond')}<span>${b.codeErr}</span></span>` : ''}</span><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="code-remove" aria-label="Remove code ${esc(b.code.code)}">Remove</button></div>`);
      else rows.push(`<div class="ffc-row ffc-row--split"><button class="ffc-row__main" type="button" data-a="push" data-s="code">${ic('payment-voucher', 'ffc-row__icon')}<span class="ffc-row__text"><span class="ffc-row__label">Coupon or promo code</span><span class="ffc-row__val">Add a code</span></span>${ic('chevron-right')}</button>${info}</div>`);
    } else rows.push(`<div class="ffc-row ffc-row--static ffc-row--muted">${ic('payment-voucher', 'ffc-row__icon')}<span class="ffc-row__text"><span class="ffc-row__label">Coupon or promo code</span><span class="ffc-row__val">Not available when paying with points${b.code ? `. Your code ${esc(b.code.code)} is kept for a cash search.` : '.'}</span></span></div>`);
  } else rows.push(`<div class="ffc-row ffc-row--static ffc-row--muted">${ic('discount', 'ffc-row__icon')}<span class="ffc-row__text"><span class="ffc-row__label">Discounts, codes and points</span><span class="ffc-row__val">Not used for ${corp ? 'Corporate bookings' : 'Pass Rider travel'}.</span></span></div>`);
  const options = `<section class="ffc-options" aria-labelledby="ffc-opt"><h4 class="ffc-h" id="ffc-opt">${std ? 'Coupon or promo code' : 'Discounts and codes'}</h4><div class="ffc-list">${rows.join('')}</div></section>`;
  if (d.coupons.length && std) tip('Discount code: try V123, a 14-character coupon, the companion coupon with 1 traveler, “EXP1” (rejected) or “DATE” (wrong date range).');
  return { title: 'New Booking', srTitle: true, cls: 'pane--clear', kind: 'root', banner: false, body: `${V().net === 'offline' ? `<div class="ads-banner ffc-banner" role="status">${ic('alert-triangle')}<span>You’re offline. You can fill in your trip. Finding trains needs a connection.</span></div>` : ''}${hero}<div class="ffc-sheet">${overviewStatus(r, b)}${surface}${overviewPassRider(b)}${overviewTravelers(r, ri, b)}${options}${netAlert(r)}</div>`, foot: findBtn(r) };
}
// Mode controls: TripLink Corporate/Personal, Pass Rider/Personal, Cash/Points
A['ffc-set'] = t => {
  const d = D(), b = d.booking, k = t.dataset.key, val = t.dataset.v; b.modeNote = null;
  if (k === 'pay') { b.pay = val; }
  if (k === 'intent' && val === 'pr' && !prCanStart(d).ok) { b.modeNote = prCanStart(d).text; pendingFocus = `[data-a="ffc-set"][data-key="intent"][data-v="pr"], #fl-intent`; render(); return; }
  if (k === 'intent' && b.intent !== val) {
    const was = b.intent; b.intent = val;
    if (val === 'corporate') { // NMA-622 AC3: 1 adult, no points, discounts or codes
      if (paxAll(b.pax) > 1 || b.pax.adult !== 1) { b.paxSaved = clone(b.pax); b.modeNote = 'Corporate bookings are for you only, so the other travelers were set aside. Switch to Personal to bring them back.'; }
      b.pax = { adult: 1, senior: 0, ya: 0, youth: 0, child: 0, infant: 0 }; b.pay = 'cash';
    }
    if (was === 'corporate' && b.paxSaved) { b.pax = b.paxSaved; b.paxSaved = null; b.modeNote = 'Your other travelers are back.'; }
    if (val === 'pr') {
      b.pay = 'cash';
      if (AUTO_TRAIN[b.from] || AUTO_TRAIN[b.to]) { b.from = AUTO_TRAIN[b.from] ? null : b.from; b.to = AUTO_TRAIN[b.to] ? null : b.to; b.notice = 'Auto Train isn’t offered for Pass Rider travel, so Lorton and Sanford were cleared. Choose your stations.'; }
    }
  }
  pendingFocus = `[data-a="ffc-set"][data-key="${k}"][data-v="${val}"]`; render();
};
A['pr-type'] = t => { D().booking.prType = t.dataset.v; pendingFocus = `[data-a="pr-type"][data-v="${t.dataset.v}"]`; render(); };

// Find Trains: the shared checks, then Travel type and the discount code (format and rules the app can know; the rest is the back end's)
const findTrainsBase = A['find-trains'];
A['find-trains'] = (t, ri) => {
  if (TB.v === 1) {
    const b = D().booking, r = routeAt(ri);
    if (intentOf(b) === 'pr' && !b.prType) { r.u.showErr = true; pendingFocus = '[data-a="pr-type"]'; render(); return; }
    if (assistProblems(b).length) { r.u.showErr = true; pendingFocus = '#atl-err, #trav-err'; render(); return; } // shown on the traveler rows
    return findTrainsBase(t, ri);
  }
  if (TB.v === 2) return findGuided(t, ri);
  const r = routeAt(ri), b = D().booking, e = ffErrors(b), prMissing = intentOf(b) === 'pr' && !b.prType, paxBad = intentOf(b) !== 'corporate' && intentOf(b) !== 'pr' && paxProblems(b.pax).length;
  if (paxBad) { r.u.showErr = true; pendingFocus = '#ff-trav, [data-a="pick-travelers"]'; render(); return; }
  if (e.from || e.to || e.ret || prMissing) { r.u.showErr = true; pendingFocus = e.from ? '#ff-from' : e.to ? '#ff-to' : e.ret ? '#ff-ret' : '[data-a="pr-type"], #fl-prtype'; render(); return; }
  r.u.showErr = false; searchWithCode(r, ri);
};
// Shared by Versions 2–4: check the discount code (mock back end), then hand off to search results
function searchWithCode(r, ri) {
  const b = D().booking; b.codeErr = '';
  if (intentOf(b) === 'pr' && !prCanStart(D()).ok) { dialog({ title: 'Pass Rider isn’t available', body: esc(prCanStart(D()).text), actions: [['OK', 'primary', null]], returnFocus: '[data-a="find-trains"]' }); return; }
  const ap = assistProblems(b); // a personal companion without a traveler with a disability (NMA-615 BR2.1)
  if (ap.length) { dialog({ title: 'Check assistance', body: esc(ap[0]), actions: [['OK', 'primary', null]], returnFocus: '[data-a="find-trains"]' }); return; }
  runNet(r, () => codeApplies(b) ? checkCode(b) : null, res => {
    if (res && res.err) { b.codeErr = res.err; pendingFocus = '#ffc-code-err'; render(); return; }
    if (res && res.range) {
      dialog({ title: 'Invalid coupon date range', body: 'This code can’t be used for the dates you chose.', returnFocus: '[data-a="find-trains"]',
        actions: [['Enter New Code', 'secondary', () => { b.code = null; push('code', {}, +ri); }], ['Continue without Discount', 'primary', () => { b.code = null; push('handoff', {}, +ri); }], ['Close', 'tertiary', null]] });
      return;
    }
    push('handoff', {}, +ri);
  }, { what: 'find trains' });
}
// Mock back end (NMA-613): EXP1 counts as expired or used, DATE is outside its date range, a companion coupon needs two travelers
function checkCode(b) {
  const c = b.code.code;
  if (b.code.companion && travelerCount(b) < 2) return { err: 'Add a companion to use this code. A companion coupon needs at least two travelers.' };
  if (c === 'EXP1') { b.codeTries++; return { err: b.codeTries >= 2 ? 'This code still can’t be used. Call 1-800-USA-RAIL (1-800-872-7245) and we’ll help.' : 'Please enter a valid discount code' }; }
  if (c === 'DATE') return { range: true };
  return null;
}

// ---------- Discount code sheet (NMA-613, 697) ----------
const CODE_FORMAT = /^(?:[A-Za-z0-9]{4}|[A-Za-z0-9]{14})$/;
SCR.code = (r, ri) => {
  const d = D(), b = d.booking; r.u.d = r.u.d || { code: b.codeDraft || '' };
  ref('613'); if (d.coupons.length) ref('697');
  const locked = b.codeTries >= 2, err = r.u.err || '';
  const fare = d.coupons.filter(c => !c.lounge); // lounge passes aren't fare codes
  const saved = d.signedIn && fare.length ? `<section class="ffc-codes" aria-labelledby="ffc-saved"><h4 class="ffc-h" id="ffc-saved">Your saved codes</h4><ul class="ffc-codelist">${[...fare].sort((x, y) => x.exp.localeCompare(y.exp)).map(c => `<li><button class="ffc-code" type="button" data-a="code-pick" data-code="${c.code}"><span class="ffc-code__kind">${esc(c.kind)}</span><span class="ffc-code__benefit">${esc(c.benefit)}</span><span class="ffc-code__meta">${esc(c.code)} · Expires ${fmtExp(c.exp)}</span></button></li>`).join('')}</ul><p class="ss-note">Expired and used codes aren’t shown. Whether a code works for your train is checked when you find trains. ${q(11)}</p></section>` : '';
  const body = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>Add a code</h3><p class="ffc-sheetsub">Use one coupon or promo code. Promo codes have 4 letters or numbers, coupon codes have 14.</p></div>
    <div class="ads-field"><label class="ads-field__label" for="code-in">Discount code <span class="ads-field__marker ads-field__marker--optional">Optional</span></label><div class="ffc-codeentry"><div class="ads-control ads-control--pill${err ? ' ads-control--error' : ''}">${ic('payment-voucher')}<input id="code-in" data-f="code" data-nodirty data-hook="codedraft" value="${esc(r.u.d.code)}" placeholder="Enter discount code" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" ${err ? 'aria-invalid="true"' : ''} aria-describedby="code-h" ${locked ? 'disabled' : ''}></div><button class="ads-btn ads-btn--secondary" type="button" data-a="code-add" ${locked ? 'disabled' : ''}>Add</button></div><p class="ads-helper${err ? ' ads-helper--error' : ''}" id="code-h" ${err ? 'role="alert"' : ''}>${err ? ic('alert-diamond') + `<span>${err}</span>` : 'Letters and numbers only.'}</p></div>
    ${locked ? alertBox('warning', 'Need help with a code?', 'You’ve tried twice. Call 1-800-USA-RAIL (1-800-872-7245) and we’ll help you use it.') : ''}
    ${saved}<button class="ads-link ads-link--sm linkbtn" type="button" data-a="code-info">About discount codes</button>`;
  return { title: 'Discount code', srTitle: true, cls: 'pane--sheet', kind: 'push', banner: false, body };
};
HOOKS.codedraft = (r, t) => { D().booking.codeDraft = t.value; };
A['code-add'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = (r.u.d.code || '').trim().toUpperCase();
  if (!CODE_FORMAT.test(c)) { b.codeTries++; r.u.err = b.codeTries >= 2 ? 'Please enter a valid discount code. You’ve tried twice; call us for help.' : 'Please enter a valid discount code'; pendingFocus = '#code-in'; render(); return; }
  const known = D().coupons.find(x => x.code === c);
  b.code = known ? clone(known) : { code: c, kind: c.length === 4 ? 'Promo code' : 'Coupon code' }; b.codeErr = ''; b.codeDraft = '';
  popTo(+ri - 1); pendingFocus = '[data-a="code-remove"]'; toast(`Code ${c} added`);
};
A['code-pick'] = (t, ri) => { const b = D().booking; b.code = clone(D().coupons.find(x => x.code === t.dataset.code)); b.codeErr = ''; popTo(+ri - 1); pendingFocus = '[data-a="code-remove"]'; toast(`${b.code.kind} added`); };
A['code-remove'] = () => { const b = D().booking, c = b.code.code; b.code = null; b.codeErr = ''; pendingFocus = '[data-s="code"]'; toast(`Code ${c} removed`, 'info'); };
A['code-info'] = t => dialog({ title: 'About discount codes', returnFocus: '[data-a="code-info"]',
  body: 'Promo codes have 4 letters or numbers. Coupon codes have 14 and can give a percentage or dollar amount off, or a free companion. Each code has a type, benefit, expiry date and its own restrictions, and most can’t be combined with other discounts. We check the code against your train, dates and travelers when you find trains. Codes can’t be used when you pay with points.', actions: [['Close', 'primary', null]] });

// ---------- Stations sheet ----------
function stationsClear(r, ri) {
  const f = r.p.field, b = D().booking;
  const why = b.notice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description ads-body-small">${b.notice}</p></div></div>` : '';
  const head = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>${f === 'from' ? 'Departure station' : 'Arrival station'}</h3><p class="ffc-sheetsub">Search by city, station name, code or ZIP code.</p></div>`;
  if (stationFocus()) return { title: f === 'from' ? 'Departure station' : 'Arrival station', cls: 'pane--sheet pane--focus', kind: 'focus', banner: false, body: why + stationSearch(r, ri, f, false) };
  return { title: f === 'from' ? 'From' : 'To', srTitle: true, cls: 'pane--sheet', kind: 'push', banner: false, body: head + why + stationSearch(r, ri, f, false) };
}

// ---------- Travelers sheet ----------
function counter(k, label, sub, val, minusOk, plusOk, group, why, extra = '') {
  const lab = esc(label);
  return `<div class="ffc-count${!plusOk && !minusOk ? ' is-disabled' : ''}"><div class="ffc-count__text"><span class="ffc-count__label" id="cl-${group}-${k}">${lab}</span>${sub ? `<span class="ffc-count__sub">${sub}${extra}</span>` : ''}${why ? `<span class="ffc-count__why">${why}</span>` : ''}</div><div class="ads-counter" role="group" aria-labelledby="cl-${group}-${k}"><button class="ads-counter__step" type="button" data-a="pax" data-g="${group}" data-k="${k}" data-d="-1" aria-label="Remove one: ${lab}" ${minusOk ? '' : 'disabled'}>${ic('minus')}</button><span class="ads-counter__value" aria-live="polite">${val}</span><button class="ads-counter__step" type="button" data-a="pax" data-g="${group}" data-k="${k}" data-d="1" aria-label="Add one: ${lab}" ${plusOk ? '' : 'disabled'}>${ic('plus')}</button></div></div>`;
}
// std: true = Versions 1 pushed screen, 'parts' = content only (Version 2's Who section); aHost = where the assistance block lives
function travelersClear(r, ri, std, aHost = 'travelers') {
  const d = D(), b = d.booking, corp = intentOf(b) === 'corporate', pr = intentOf(b) === 'pr';
  ref('611', '612');
  const fam = v1() && std === true; // Version 1: traveler-by-traveler cards, Cancel and Done (familiar.js)
  if (!r.u.snap) r.u.snap = clone(Object.assign({ pax: b.pax, tdisc: b.tdisc, disc: b.disc, prPax: b.prPax }, fam ? { assist: b.assist, assistDone: b.assistDone, assistFromProfile: b.assistFromProfile, ta: b.ta || {}, assistOn: b.assistOn } : {}));
  let body = '', ok = true, why = '';
  if (corp) body = `<div class="ffc-fixedcard"><p class="ffc-count__label">1 Adult · You</p><p class="ads-body-small ads-text-secondary">Corporate bookings are for the TripLink traveler only. Traveler discounts, codes and points aren’t used. You can still request assistance.</p></div>`;
  else if (pr) {
    ref('1017', '1018');
    const f = b.prPax, room = prCount(b) < MAX_PAX, emp = d.passrider.role === 'employee', dep = d.passrider.role === 'dependent', left = d.passrider.compLeft;
    if (b.prType === 'business') body = `<div class="ffc-fixedcard"><p class="ffc-count__label">You · ${prRoleLabel(d)}</p><p class="ads-body-small ads-text-secondary">Business travel is for you alone. Choose Leisure on the Fare Finder to bring family or companions.</p></div>`;
    else {
      body = `<div class="ffc-fixedcard"><p class="ffc-count__label">You · ${prRoleLabel(d)}</p><p class="ads-body-small ads-text-secondary">You’re always on the trip. ${q(13)}</p></div>
        <div class="ffc-counts">${counter('fam', emp ? 'Spouse' : dep ? 'Employee or spouse' : 'Employee (your spouse)', dep ? 'The employee and their spouse' : 'On your pass', f.fam, f.fam > 0, f.fam < (dep ? 2 : 1) && room, 'pr')}${counter('dep', dep ? 'Other dependents' : 'Dependents', 'On your pass', f.dep, f.dep > 0, f.dep < 6 && room, 'pr')}
        ${emp ? counter('comp', 'Companions', `${left} of 8 companion passes left this year`, f.comp, f.comp > 0, f.comp < left && room, 'pr', left ? '' : 'No companion passes left this year.') : ''}</div>
        ${!room ? `<p class="ffc-limit" role="status">${ic('info-circle', 'ads-icon--sm')}<span>You can book up to 8 travelers in the app, including you.</span></p>` : ''}
        ${emp && f.comp ? '<p class="ss-note">Companions must book and travel with you.</p>' : ''}${b.prType ? '' : '<p class="ss-note">Family and companions are for Leisure travel.</p>'}`;
    }
    body += `<p class="ss-note">Pass Rider fares apply. Traveler discounts and codes aren’t used.</p>`;
  } else {
    const p = b.pax, seated = paxSeated(p), probs = paxProblems(p);
    ok = !probs.length;
    const counts = PAX.map(([k, l, ages]) => counter(k, l, `${ages}`, p[k], p[k] > 0, k === 'infant' ? p.infant < MAX_PAX : seated < MAX_PAX, 'std', fam && paxErrorFor(p, k) ? `<span class="ads-helper ads-helper--error fam-counterr">${ic('alert-diamond')}<span>${paxErrorFor(p, k)}</span></span>` : '', k === 'youth' ? ` · <button class="ads-link ads-link--sm ffc-inlinelink" type="button" data-a="youth-alone">Traveling alone?</button>` : '')).join('');
    const limit = seated >= MAX_PAX ? `<p class="ffc-limit" role="status">${ic('info-circle', 'ads-icon--sm')}<span>You can book up to 8 travelers in the app; infants don’t count. For larger groups, call 1-800-USA-RAIL (1-800-872-7245).</span></p>` : '';
    const ratio = p.infant > p.adult + p.senior && !probs.length ? '<p class="ss-note">There are more infants than adults and seniors, so each extra infant needs a seat and pays the child fare.</p>' : '';
    why = probs.join(' ');
    const fromProfile = d.signedIn && ['military', 'rpa'].includes(d.discount.type) && b.disc === d.discount.type;
    const discs = paxList(b).map(t => {
      const x = tdiscOf(b, t), opts = TDISC[t.type], label = `Traveler ${t.n} · ${PAX_LABEL[t.type]}`;
      const info = x === 'pwd' ? `Applied because ${esc(t.label || `Traveler ${t.n}`)} has a disability in Assistance. ${q(9)}` : x === 'companion' ? `Applied because Traveler ${t.n} is a personal companion in Assistance. It replaces other passenger discounts. ${q(9)}` : x === 'senior' ? 'Seniors get the senior discount automatically when eligible.' : x === 'infant' ? 'Infants travel on an adult’s lap.' : x === 'infantchild' ? 'More infants than adults: this infant pays the child fare.' : x === 'childfare' ? 'Children pay the child fare.' : x === 'none' ? (t.type === 'adult' || t.type === 'ya' ? 'Adults and young adults don’t get a passenger-type discount.' : 'No discount.') : DISCOUNTS[x] ? DISCOUNTS[x].info : '';
      const ctl = opts && !['pwd', 'companion'].includes(x) ? `<div class="ads-control ads-control--select"><select id="td-${t.key}" data-f="td" data-nodirty data-hook="tdisc" data-key="${t.key}" aria-describedby="td-${t.key}-h">${opts.map(o => `<option value="${o}" ${x === o ? 'selected' : ''}>${TDISC_LABEL[o]}</option>`).join('')}</select>${ic('chevron-down')}</div>` : `<p class="ffc-fixedval">${TDISC_LABEL[x]}</p>`;
      return `<div class="ffc-disc"><label class="ffc-disc__label" ${opts && !['pwd', 'companion'].includes(x) ? `for="td-${t.key}"` : ''}>${label}${t.n === 1 && fromProfile && x === b.disc ? ' <span class="ads-lock">From your Profile</span>' : ''}</label>${ctl}<p class="ads-helper" id="td-${t.key}-h">${info}</p></div>`;
    }).join('');
    // Core Flow order: travelers, then assistance, then each traveler's discount
    body = `<section aria-labelledby="ffc-who"><h3 class="ffc-h" id="ffc-who">Who’s traveling ${q(10)}</h3><div class="ffc-counts">${counts}</div><p class="info-entry">${infoLink('service-animals', 'Bringing a service animal?')}</p>${limit}${ratio}${probs.length ? `<div class="ffc-problems" role="alert">${probs.map(x => `<p class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${x}</span></p>`).join('')}</div>` : ''}</section>
      ${fam ? assistBlock(r, ri, aHost, { noList: true }) + travelerCards(b) : assistBlock(r, ri, aHost)}
      ${fam ? '' : paxAll(p) ? `<section aria-labelledby="ffc-disc"><h4 class="ffc-h" id="ffc-disc">Traveler discounts</h4><div class="ffc-discs">${discs}</div><p class="ss-note">One discount per traveler. Eligibility information doesn’t block your choice. Changes here don’t change your Profile.</p></section>` : ''}`;
  }
  if (corp || pr) body += fam ? assistBlock(r, ri, aHost, { noList: true }) + travelerCards(b) : assistBlock(r, ri, aHost);
  const foot = `${ok ? '' : `<p class="ads-helper" id="trav-why">${esc(why)}</p>`}<button class="ads-btn ads-btn--block" type="button" data-a="pick-travelers-done" ${ok ? '' : 'disabled aria-describedby="trav-why"'}>Done</button>`;
  if (std === 'parts') return { body, ok, why };
  // Version 1 (and a pushed Version 2 screen): Traveler Selection with the same content
  if (fam) return { title: 'Traveler Selection', kind: 'editor', cancelA: 'trav-cancel', close: true, banner: false, body: `<div class="travsel">${body}</div>`, foot };
  if (std) return { title: 'Traveler Selection', kind: 'push', banner: false, body: `<div class="travsel">${body}</div>`, foot };
  body = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>Travelers</h3><p class="ffc-sheetsub">${corp ? 'Corporate booking' : pr ? `Pass Rider · ${b.prType === 'business' ? 'Business' : 'Leisure'} travel` : 'Choose who’s traveling and any discounts.'}</p></div>` + body;
  return { title: 'Travelers', srTitle: true, cls: 'pane--sheet', kind: 'push', banner: false, body, foot };
}
A.pax = t => {
  const b = D().booking, k = t.dataset.k, dlt = +t.dataset.d, g = t.dataset.g;
  if (g === 'pr') b.prPax[k] = Math.max(0, b.prPax[k] + dlt);
  else b.pax[k] = Math.max(0, b.pax[k] + dlt);
  pendingFocus = `[data-a="pax"][data-g="${g}"][data-k="${k}"][data-d="${dlt}"]:not(:disabled), [data-a="pax"][data-g="${g}"][data-k="${k}"]:not(:disabled)`; render();
};
// Leaving Traveler details with a selection that can't be searched: keep editing, or go back to the last valid one
const backBase = A.back;
A.back = (t, ri) => {
  const sh = sheet(), r = sh && sh.stack[+ri], b = D().booking;
  if (r && r.s === 'travelers' && ['standard', 'personal'].includes(intentOf(b)) && paxProblems(b.pax).length) {
    return dialog({ title: 'Travelers can’t be used yet', body: esc(paxProblems(b.pax).join(' ')), returnFocus: '[data-a="pick-travelers-done"]',
      actions: [['Keep editing', 'secondary', null], ['Undo traveler changes', 'primary', () => { Object.assign(b, clone(r.u.snap)); popTo(+ri - 1); }]] });
  }
  return backBase(t, ri);
};
// The sheet's X closes the whole booking; if Traveler details is open with a selection that can't be searched, ask first
const closeBase = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet(), r = sh && sh.stack[sh.stack.length - 1], b = D().booking;
  if (r && r.s === 'travelers' && ['standard', 'personal'].includes(intentOf(b)) && paxProblems(b.pax).length) {
    return dialog({ title: 'Travelers can’t be used yet', body: esc(paxProblems(b.pax).join(' ')), returnFocus: '[data-a="pick-travelers-done"]',
      actions: [['Keep editing', 'secondary', null], ['Undo traveler changes and close', 'primary', () => { Object.assign(b, clone(r.u.snap)); closeSheet(); }]] });
  }
  return closeBase(t, ri);
};
// Core Flow links Youth to the unaccompanied-minor rules; the content comes from AEM (NMA-611 BR3)
A['youth-alone'] = () => dialog({ title: 'Traveling alone?', returnFocus: '[data-a="youth-alone"]', actions: [['Close', 'primary', null]],
  body: 'The rules for youths traveling without an adult (unaccompanied minors) will come from AEM; they aren’t in this prototype. In the app, a youth needs an adult or senior on the same booking.' });
HOOKS.tdisc = (r, t) => { setTdisc(D().booking, t.dataset.key, t.value); pendingFocus = '#' + CSS.escape(t.id); };

// ---------- Handoff ----------
function handoffExtra(b) {
  const d = D(), rows = [], intent = intentOf(b);
  if (intent === 'corporate') rows.push(['Booking', 'Corporate (TripLink)']);
  else if (intent === 'pr') rows.push(['Booking', `Pass Rider · ${b.prType === 'business' ? 'Business' : 'Leisure'}`]);
  else if (intent === 'personal') rows.push(['Booking', 'Personal']);
  if (d.signedIn && (intent === 'standard' || intent === 'personal')) rows.push(['Pay with', b.pay === 'points' ? 'Points' : 'Cash']);
  if (intent === 'pr') rows.push(['Travelers', esc(prSummary(b, d))]);
  else if (intent === 'corporate') rows.push(['Travelers', '1 Adult · You']);
  else rows.push(['Travelers', paxList(b).map(t => `Traveler ${t.n} · ${PAX_LABEL[t.type]} · ${TDISC_LABEL[tdiscOf(b, t)]}`).join('<br>')]);
  if (codeApplies(b)) rows.push(['Discount code', `${esc(b.code.code)} (${esc(b.code.kind)})`]);
  return rows.map(([k, val]) => `<dt>${k}</dt><dd>${val}</dd>`).join('');
}

// ---------- Version 3 demo entries (Flow menu › G) ----------
const V3_PLACES = {
  ff: () => {},
  stations: () => goLoc('stations:from'),
  calendar: () => { const b = D().booking; b.trip = 'rt'; b.ret = addDays(b.dep, 3); goLoc('calendar:dep'); },
  travelers: () => { const b = D().booking; if (b.intent === 'pr') b.prType = 'leisure'; goLoc('travelers'); },
  code: () => goLoc('code'),
  assist: () => goLoc('assist-booking'),
  points: () => { D().booking.pay = 'points'; render(); },
  errors: () => { sheet().stack[0].u.showErr = true; pendingFocus = '#ff-from'; render(); },
  autotrain: () => { const b = D().booking; b.from = 'LOR'; b.to = 'SFA'; b.notice = 'Lorton is an Auto Train station. Auto Train only runs between Lorton, VA and Sanford, FL, so Sanford was added as your arrival station.'; render(); }
};

// Dates and Assistance keep their shared content, with the same sheet heading as the other V3 sheets
const sheetHead = (title, sub) => `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>${title}</h3>${sub ? `<p class="ffc-sheetsub">${sub}</p>` : ''}</div>`;
const calendarBase = SCR.calendar;
SCR.calendar = (r, ri) => {
  const o = calendarBase(r, ri); if (!rich()) return o;
  const b = D().booking;
  return Object.assign(o, { srTitle: true, cls: 'pane--sheet', body: sheetHead('Dates', b.trip === 'rt' ? 'Choose your departure date, then your return date.' : 'Choose your departure date. Past dates aren’t available.') + o.body });
};
const assistBase = SCR.assist;
SCR.assist = (r, ri) => {
  const o = assistBase(r, ri); if (!rich()) return o;
  return Object.assign(o, { title: 'Assistance', srTitle: true, cls: 'pane--sheet', body: sheetHead('Assistance', `${esc(assistWho(r).label)}. Tell us what help they need for this trip.`) + o.body });
};
