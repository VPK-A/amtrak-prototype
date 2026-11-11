/* Sprint 4 prototype: Version 3 Fare Finder, CLEAR-inspired.
   A navy header (heading + booking-mode controls) over a rounded light surface (route, trip type, dates,
   travelers), a labeled list for discounts, codes and assistance, and a pinned Find trains button.
   Stations, dates, travelers, codes and assistance open as rounded sheets over the Fare Finder.
   It also carries the Sprint 4 Fare Finder variants: traveler types (NMA-611), per-traveler discounts (612),
   discount codes (613), Use points (624), TripLink (622) and Pass Rider (623, 1016–1019). */

// ---------- Rules ----------
// Booking modes (TripLink, Pass Rider) apply in every version; each presents them its own way
const intentOf = b => b.intent || 'standard';
const autoTrainBlocked = () => intentOf(D().booking) === 'pr' && D().booking.prType === 'business'; // NMA-1016 AC4: Leisure only
const PAX_PLURAL = { adult: 'Adults', senior: 'Seniors', ya: 'Young adults', youth: 'Youths', child: 'Children', infant: 'Infants' };
const paxSeated = p => p.adult + p.senior + p.ya + p.youth + p.child; // always occupy a seat (NMA-611 BR3 AC2)
const paxAll = p => paxSeated(p) + p.infant;
// Lap infants ride 1:1 with an Adult, Senior or Young adult; each infant above that takes a seat at the child fare
const lapCap = p => p.adult + p.senior + p.ya;
const paxOccupied = p => paxSeated(p) + Math.max(0, p.infant - lapCap(p)); // occupied seats can't exceed 8 (NMA-611 BR3)
const MAX_PAX = 8;
const canAdd = (p, k) => paxOccupied(Object.assign({}, p, { [k]: p[k] + 1 })) <= MAX_PAX;
function paxList(b) {
  const out = []; for (const [k] of PAX) for (let i = 1; i <= b.pax[k]; i++) out.push({ key: `${k}-${i}`, type: k, i });
  return out.map((t, n) => Object.assign(t, { n: n + 1 }));
}
function paxSummary(b) { const parts = PAX.filter(([k]) => b.pax[k]).map(([k, l]) => `${b.pax[k]} ${(b.pax[k] > 1 ? PAX_PLURAL[k] : l).toLowerCase()}`); return parts.join(', ') || 'No travelers'; }
// Problems that stop the traveler selection being used (NMA-611 BR4–BR9). Youth and child need an adult or
// senior (BR5, BR6). A young adult may travel alone (BR8) but not with a youth, child or infant unless an adult
// or senior is on the booking (BR9). BR7 would let a young adult accompany an infant: that conflict is open
// (Q10), so the stricter BR9 rule applies and the young adult with infant case isn't counted as verified.
function paxProblems(p) {
  const out = [], grown = p.adult + p.senior;
  if (!paxAll(p)) out.push('Add at least one traveler to make a reservation.');
  if (p.youth && !grown) out.push('Youths 13 to 15 need to travel with an adult or senior. See the rules for traveling alone.');
  if (p.child && !grown) out.push('Children and infants must travel with at least one adult who is 18 or older.');
  else if (p.infant && !grown) out.push(p.ya ? 'Infants must travel with an adult or senior on this booking.' : 'Children and infants must travel with at least one adult who is 18 or older.');
  return out;
}
// What blocks Find trains on the travelers entry, for every booking mode
function travelerProblems(b) {
  const it = intentOf(b);
  if (it === 'corporate') return [];
  if (it === 'pr') return prProblems(b);
  return paxProblems(b.pax);
}
// Discount shown for a traveler (NMA-612 BR5): fixed for seniors and infants, PWD for Traveler 1 when Assistance says so
function tdiscOf(b, t) {
  const fromAssist = assistDiscount(b, t.key); if (fromAssist) return fromAssist; // PWD or Companion (NMA-43 BR8)
  if (t.type === 'senior') return 'senior';
  if (t.type === 'infant') return t.i > lapCap(b.pax) ? (b.tdisc[t.key] === 'military' ? 'military' : 'infantchild') : 'infant';
  if (t.key === 'adult-1' && profilePwd() && ['standard', 'personal'].includes(intentOf(b)) && !(asks(b, t.key) && assistRec(b, t.key).done)) return 'pwd'; // profile disability (NMA-612 BR6)
  if (t.key === 'adult-1') return b.disc;
  return b.tdisc[t.key] || TDISC[t.type][0];
}
function setTdisc(b, key, val) { if (key === 'adult-1') b.disc = val; else b.tdisc[key] = val; }
// Choices for one traveler (NMA-612 BR5): a seat infant can be changed (child fare or Military); a lap infant can't
const discOpts = (b, t) => t.type === 'infant' ? (t.i > lapCap(b.pax) ? ['infantchild', 'military'] : null) : TDISC[t.type];
function discSummary(b) {
  const list = paxList(b).map(t => [t, tdiscOf(b, t)]).filter(([t, x]) => !['none', 'childfare', 'infant', 'senior'].includes(x));
  if (!list.length) return 'None chosen';
  return list.map(([t, x]) => `${TDISC_LABEL[x]}${paxList(b).length > 1 ? ` (Traveler ${t.n})` : ''}`).join(', ');
}
// Travelers are listed by name. The relationship on the pass record stays behind the scenes (eligibility only).
const prMeName = d => `${d.profile.first} ${d.profile.last}`;
const prPeople = d => (d.passrider && d.passrider.people) || [];
const prPerson = (d, key) => prPeople(d).find(p => `pr-${p.id}` === key);
const prPicked = b => b.prPax.people || {};
const prMe = b => b.prType === 'business' || b.prPax.me !== false;
const prCanComp = d => ['employee'].includes(d.passrider.role); // employees only (NMA-1018 AC1, AC2)
// NMA-1018: how a round trip uses companion passes (per companion or per booking), and the picker limit that
// follows, are unresolved (Q13). The picker only stops at the remaining balance; searching never uses passes.
const prCompMax = (b, d) => d.passrider.compLeft;
function prSummary(b, d) {
  if (b.prType === 'business') return 'You only · Business travel';
  const f = b.prPax, parts = prMe(b) ? [prMeName(d)] : [];
  prPeople(d).filter(p => prPicked(b)[p.id]).forEach(p => parts.push(p.name));
  if (f.comp) parts.push(`${f.comp} companion${f.comp > 1 ? 's' : ''}`);
  return parts.join(', ') || 'No travelers';
}
const prCount = b => b.prType === 'business' ? 1 : (prMe(b) ? 1 : 0) + prPeople(D()).filter(p => prPicked(b)[p.id]).length + b.prPax.comp;
// Adult or Child for each traveler added to a Pass Rider booking (NMA-1017 AC6, NMA-1018 AC7)
const prKind = (b, key) => key === 'pr-you' ? 'adult' : ((b.prKinds || {})[key] || 'adult'); // Adult when added; a choice made for this trip is kept
// Combinations Pass Rider policy doesn't allow (NMA-1017 AC1–AC5, NMA-1018 AC6)
function prProblems(b) {
  if (b.prType === 'business') return [];
  const d = D(), f = b.prPax, list = travelerList(b), out = [];
  if (!list.length) return ['Add at least one traveler to search.'];
  const family = list.filter(t => !t.key.startsWith('pr-comp'));
  if (f.comp && !family.length) out.push('Companions must travel with you or someone else on your pass.');
  else if (!list.some(t => prKind(b, t.key) === 'adult')) out.push('Pass Rider travel can’t be booked for children only. Add an adult traveler.');
  if (f.comp > prCompMax(b, d)) out.push(`You have ${d.passrider.compLeft} companion pass${d.passrider.compLeft === 1 ? '' : 'es'} left.`);
  return out;
}
const travelerCount = b => intentOf(b) === 'corporate' ? 1 : intentOf(b) === 'pr' ? prCount(b) : paxAll(b.pax);
const codeApplies = b => !!(b.code || b.codeText) && ['standard', 'personal'].includes(intentOf(b)) && b.pay !== 'points';
const fmtExp = s => parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ---------- Fare Finder ----------
// Shared Fare Finder rules
// Reviewer flags for unresolved rules that affect the Fare Finder (shown in Screen notes, never in the app)
function ffFlags(b) { const d = D(); if (b.trip === 'rt') q(25); if (intentOf(b) === 'pr') q(13); }
const prTypeHelp = b => b.prType === 'business' ? 'Business travel is for you alone. Auto Train isn’t available for Business travel.' : b.prType === 'leisure' ? 'You can bring family and, if you have passes, companions.' : 'Business travel is for you alone. Leisure lets you bring family and companions.';
const prLeisureWhy = d => d.passrider.role === 'employee' ? 'Business travel needs an active Business Pass.' : 'Business travel is for employees with a Business Pass.';
function travErr(r, b) {
  const tp = travelerProblems(b), ap = assistProblems(b), am = assistMissing(b);
  const msg = tp[0] || ap[0] || (am.length ? `Answer the assistance questions for ${am.length > 1 ? `${am.length} travelers` : am[0].label}, or remove their assistance in Travelers.` : '');
  if (!r.u.showErr || !msg) return '';
  return `<p class="ads-helper ads-helper--error" id="trav-err" tabindex="-1">${ic('alert-diamond')}<span>${esc(msg)} Open travelers to fix it.</span></p>`;
}
function codeTips() {
  tip('Apply code: type HALF (promo) or any 14 letters and numbers (coupon). EXP1 isn’t eligible, DATE is outside its date range, the companion coupon needs 2 travelers, and Scenario › Network › Server error shows “couldn’t check”. A wrong length or a symbol shows the format error.');
}
// Switching booking mode (TripLink NMA-622, Pass Rider NMA-623). Codes and travelers set aside are restored on the way back.
function setIntent(b, val) {
  const was = b.intent; if (was === val) return; b.intent = val;
  if (val === 'corporate') { // NMA-622 AC4, AC6, AC7: 1 adult, no points, discounts or codes
    if (paxAll(b.pax) > 1 || b.pax.adult !== 1) { b.paxSaved = clone(b.pax); b.modeNote = 'Corporate bookings are for you only, so the other travelers were set aside. Turn off TripLink corporate booking to bring them back.'; }
    b.paySaved = b.pay; b.pax = { adult: 1, senior: 0, ya: 0, youth: 0, child: 0, infant: 0 }; b.pay = 'cash';
  }
  if (val === 'pr') { b.paySaved = b.pay; b.pay = 'cash'; clearAutoTrainIfBlocked(b); }
  if ((was === 'corporate' || was === 'pr') && !['corporate', 'pr'].includes(val)) {
    if (b.paxSaved) { b.pax = b.paxSaved; b.paxSaved = null; b.modeNote = 'Your other travelers are back.'; }
    if (b.paySaved) { b.pay = b.paySaved; b.paySaved = null; }
  }
}
function clearAutoTrainIfBlocked(b) {
  if (!autoTrainBlocked() || !(AUTO_TRAIN[b.from] || AUTO_TRAIN[b.to])) return;
  b.from = AUTO_TRAIN[b.from] ? null : b.from; b.to = AUTO_TRAIN[b.to] ? null : b.to;
  b.notice = 'Auto Train isn’t available for Pass Rider Business travel, so Lorton and Sanford were cleared. Choose your stations, or choose Leisure.';
}
// Mode controls: TripLink Corporate/Personal, Pass Rider/Regular, Cash/Points
A['ffc-set'] = t => {
  const d = D(), b = d.booking, k = t.dataset.key, val = t.dataset.v; b.modeNote = null;
  if (k === 'pay') { if (val === 'points' && b.pay !== 'points' && (b.codeText || b.code)) toast('Coupon and promotion codes can’t be used with points. Your code is kept for a cash search.', 'info'); b.pay = val; }
  if (k === 'intent' && val === 'pr' && !prCanStart(d).ok) { b.modeNote = prCanStart(d).text; pendingFocus = `[data-a="ffc-set"][data-key="intent"][data-v="pr"], #fl-intent`; render(); return; }
  if (k === 'intent') setIntent(b, val);
  pendingFocus = `[data-a="ffc-set"][data-key="${k}"][data-v="${val}"]`; render();
};
A['pr-type'] = t => { const b = D().booking; b.prType = t.dataset.v; b.notice = null; clearAutoTrainIfBlocked(b); pendingFocus = `#prt-${t.dataset.v}, [data-a="pr-type"][data-v="${t.dataset.v}"]`; render(); };

// Find trains: every check in source order, then the discount code (format first, then the simulated back end)
A['find-trains'] = (t, ri) => {
  if (TB.v === 2) return findGuided(t, ri);
  const r = routeAt(ri), b = D().booking, e = ffErrors(b);
  if (TB.v === 1) {
    r.u.alert = null;
    const inp = document.querySelector('#ff-code'); if (inp) setCodeText(b, inp.value);
    const fail = sel => { r.u.showErr = true; pendingFocus = sel; render(); };
    if (e.from || e.to || e.ret) return fail(e.from ? '#ff-from' : e.to ? '#ff-to' : '#ff-ret');
    if (intentOf(b) === 'pr' && !b.prType) return fail('#ff-trav'); // the button is disabled too (NMA-1016 AC2)
    if (travelerProblems(b).length || assistProblems(b).length || assistMissing(b).length) return fail('#trav-err'); // NMA-615 BR1.2: everyone answers while assistance is on
    if (intentOf(b) === 'corporate' && (AUTO_TRAIN[b.from] || AUTO_TRAIN[b.to])) { // NMA-622 AC8: an error after Find trains
      r.u.showErr = false;
      return dialog({ title: 'Auto Train isn’t available for corporate travel', body: 'This trip isn’t eligible for corporate travel. To book Auto Train, turn off TripLink corporate booking.', returnFocus: '[data-a="find-trains"]',
        actions: [['Turn off corporate booking', 'primary', () => { setIntent(b, 'personal'); pendingFocus = '[data-a="find-trains"]'; render(); }], ['Close', 'secondary', null]] });
    }
    r.u.showErr = false;
    if (codeFormatError(b)) { pendingFocus = '#ff-code-h, #ff-code'; render(); return; }
    return searchWithCode(r, ri);
  }
  const prMissing = intentOf(b) === 'pr' && !b.prType, paxBad = intentOf(b) !== 'corporate' && intentOf(b) !== 'pr' && paxProblems(b.pax).length;
  if (paxBad) { r.u.showErr = true; pendingFocus = '#ff-trav, [data-a="pick-travelers"]'; render(); return; }
  if (e.from || e.to || e.ret || prMissing) { r.u.showErr = true; pendingFocus = e.from ? '#ff-from' : e.to ? '#ff-to' : e.ret ? '#ff-ret' : '[data-a="pr-type"], #fl-prtype'; render(); return; }
  r.u.showErr = false; searchWithCode(r, ri);
};
// Shared by Versions 2–4: check the discount code (mock back end), then hand off to search results
function searchWithCode(r, ri) {
  const b = D().booking, inline = v1(); b.codeErr = '';
  if (intentOf(b) === 'pr' && !prCanStart(D()).ok) { dialog({ title: 'Pass Rider isn’t available', body: esc(prCanStart(D()).text), actions: [['Close', 'primary', null]], returnFocus: '[data-a="find-trains"]' }); return; }
  const ap = assistProblems(b); // a personal companion without a traveler with a disability (NMA-615 BR2.1)
  if (ap.length) { dialog({ title: 'Check assistance', body: esc(ap[0]), actions: [['Close', 'primary', null]], returnFocus: '[data-a="find-trains"]' }); return; }
  const useCode = codeApplies(b), recheck = inline && codeStateOf(b) === 'changed';
  if (inline && useCode) { if (!b.code) b.code = { code: b.codeText, kind: b.codeText.length === 4 ? 'Promo code' : 'Coupon code' }; b.codeState = ''; }
  runNet(r, () => useCode ? checkCode(b) : null, res => {
    // A failed check never leaves the code applied (NMA-613 scenarios 15, 17)
    if (res && res.err) { b.codeErr = recheck ? `The previously selected discount is not eligible for this trip. ${res.err}` : res.err; b.codeState = 'ineligible'; pendingFocus = '#ff-code-h, #ffc-code-err'; render(); return; }
    if (res && res.range) {
      b.codeState = 'ineligible'; b.codeErr = 'This code can’t be used for the dates you chose.';
      dialog({ title: 'Invalid coupon date range', body: 'This code can’t be used for the dates you chose.', returnFocus: '[data-a="find-trains"]',
        actions: [['Enter new code', 'secondary', () => { Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '' }); if (inline) push('dcode', {}, +ri); else push('code', {}, +ri); }], ['Continue without discount', 'primary', () => { Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '' }); push('handoff', {}, +ri); }], ['Close', 'tertiary', null]] });
      return;
    }
    if (inline && useCode) { b.codeState = 'applied'; b.codeSig = codeSig(b); }
    push('handoff', {}, +ri);
  }, { what: 'find trains', onError: () => {
    if (!(inline && useCode)) return false;
    b.codeState = 'error'; b.codeErr = 'We couldn’t check your code right now. Try again, or remove the code to search without it.'; pendingFocus = '#ff-code-h'; return true;
  } });
}
// Mock back end (NMA-613): EXP1 counts as expired or used, DATE is outside its date range, a companion coupon needs two travelers
function checkCode(b) {
  const c = b.code.code;
  if (b.code.companion && travelerCount(b) < 2) return { err: 'This code needs at least two travelers. Add a traveler to use it.' };
  if (c === 'EXP1') { b.codeTries++; return { err: b.codeTries >= 2 ? 'This code still can’t be used. Call 1-800-USA-RAIL (1-800-872-7245) for help.' : 'This code can’t be used. Check it and try again.' }; }
  if (c === 'DATE') return { range: true };
  return null;
}

// ---------- Discount code sheet (NMA-613, 697) ----------
const CODE_FORMAT = /^(?:[A-Za-z0-9]{4}|[A-Za-z0-9]{14})$/;
SCR.code = (r, ri) => {
  const d = D(), b = d.booking; r.u.d = r.u.d || { code: b.codeDraft || '' };
  ref('613'); if (d.coupons.length) ref('697');
  const locked = b.codeTries >= 2, err = r.u.err || '';
  const fare = d.coupons;
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
  const head = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>${selHeading(f, r.p.ctx)}</h3><p class="ffc-sheetsub">Search by city, station name, code or ZIP code.</p></div>`;
  const sel = ' ss-upd' + (r.u.view === 'map' ? ' ss-upd--map' : ''); // shared selector layout: heading with Back, tabs, search
  const foot = mapFoot(r), fo = foot ? { foot, footCls: 'ads-actionfooter' } : {};
  if (stationFocus()) return Object.assign({ title: selHeading(f, r.p.ctx), cls: 'pane--sheet pane--focus' + sel, kind: 'focus', headInBody: true, banner: false, body: stationSearch(r, ri, f, false).replace('<!--why-->', why) }, fo);
  return Object.assign({ title: f === 'from' ? 'From' : 'To', srTitle: true, cls: 'pane--sheet' + sel, kind: 'push', banner: false, body: head + stationSearch(r, ri, f, false).replace('<!--why-->', why) }, fo);
}

// ---------- Travelers sheet ----------
A['kids-toggle'] = (t, ri) => { const r = routeAt(ri); r.u.kidsOpen = !r.u.kidsOpen; pendingFocus = '#ffc-kids-h'; render(); };
function counter(k, label, sub, val, minusOk, plusOk, group, why, extra = '') {
  const lab = esc(label);
  return `<div class="ffc-count${!plusOk && !minusOk ? ' is-disabled' : ''}"><div class="ffc-count__text"><span class="ffc-count__label" id="cl-${group}-${k}">${lab}</span>${sub ? `<span class="ffc-count__sub">${sub}${extra}</span>` : ''}${why ? `<span class="ffc-count__why">${why}</span>` : ''}</div><div class="ads-counter" role="group" aria-labelledby="cl-${group}-${k}"><button class="ads-counter__step" type="button" data-a="pax" data-g="${group}" data-k="${k}" data-d="-1" aria-label="Remove one: ${lab}" ${minusOk ? '' : 'disabled'}>${ic('minus')}</button><span class="ads-counter__value" aria-live="polite">${val}</span><button class="ads-counter__step" type="button" data-a="pax" data-g="${group}" data-k="${k}" data-d="1" aria-label="Add one: ${lab}" ${plusOk ? '' : 'disabled'}>${ic('plus')}</button></div></div>`;
}
// std: true = Versions 1 pushed screen, 'parts' = content only (Version 2's Who section); aHost = where the assistance block lives
function travelersClear(r, ri, std, aHost = 'travelers') {
  const d = D(), b = d.booking, corp = intentOf(b) === 'corporate', pr = intentOf(b) === 'pr';
  ref('611', '612');
  const fam = v1() && std === true; // Version 1: traveler-by-traveler cards, Cancel and Done (familiar.js)
  if (!r.u.snap) r.u.snap = clone(Object.assign({ pax: b.pax, tdisc: b.tdisc, disc: b.disc, discReplaced: b.discReplaced || {}, prPax: b.prPax, prType: b.prType, prKinds: b.prKinds || {} }, fam ? { assist: b.assist, assistDone: b.assistDone, assistFromProfile: b.assistFromProfile, ta: b.ta || {}, assistOn: b.assistOn, ask: b.ask || {} } : {}));
  let body = '', ok = true, why = '';
  if (corp) body = ''; // TripLink: no fixed "1 adult · You" card; the traveler's details and assistance follow
  else if (pr) {
    ref('1017', '1018', '1081', '1016');
    const f = b.prPax, room = prCount(b) < MAX_PAX, left = d.passrider.compLeft, picked = prPicked(b);
    const policy = `<p class="info-entry">${infoLink('pr-policy', 'Pass Rider policy')}</p>`;
    // Business or Leisure (NMA-1016): tabs at the top of Traveler selection for employees with a Business Pass.
    // Leisure starts selected (decision; NMA-1016 AC2 says neither is preselected). Leisure is the left tab, Business the right.
    const elig = d.passrider.role === 'employee' && d.passrider.business, t0 = b.prType, inDd = prTypeInDropdown();
    if (elig && PRDEF.v === 'leisure') snote('Leisure starts selected for Business Pass holders. Conflict: NMA-1016 AC2 says neither Business nor Leisure is preselected.');
    const tab = (k, l) => `<button class="ads-tab" type="button" role="tab" id="prt-${k}" aria-selected="${t0 === k}" aria-controls="pr-panel" tabindex="${t0 === k || (!t0 && k === 'leisure') ? 0 : -1}" data-a="pr-type" data-v="${k}">${l}</button>`;
    const tabs = elig && !inDd ? `<div class="ads-tabs ads-tabs--fill pr-tabs" role="tablist" aria-label="Pass Rider travel type">${tab('leisure', 'Leisure')}${tab('business', 'Business')}</div>` : '';
    const help = elig && inDd ? `<p class="ads-helper pr-tabs__help" id="prt-h">${t0 ? `${t0 === 'business' ? 'Business' : 'Leisure'} travel. ` : ''}${prTypeHelp(b)} To change it, use Booking type on New booking.</p>`
      : elig ? `<p class="ads-helper pr-tabs__help" id="prt-h">${prTypeHelp(b)}</p>` : `<p class="ads-helper pr-tabs__help" id="prt-h">Leisure travel. ${prLeisureWhy(d)}</p>`;
    let panel;
    if (!t0) { ok = false; why = 'Choose Business or Leisure travel.'; panel = `<p class="pr-choose">${inDd ? 'Choose Business or Leisure in Booking type on New booking to see who can travel.' : 'Choose Business or Leisure travel to see who can travel.'}</p>`; }
    else if (t0 === 'business') panel = `<fieldset class="ffc-riders"><legend class="ffc-riders__legend">People on your pass</legend>${riderCheck('me', prMeName(d), 'You', true, false, 'prt-h')}</fieldset>`; // Business: you alone
    else {
      const probs = prProblems(b); ok = !probs.length; why = probs.join(' ');
      const compMax = prCompMax(b, d);
      const comp = prCanComp(d) ? counter('comp', 'Companions', `${left} of 16 companion passes left this year`, f.comp, f.comp > 0, f.comp < compMax && room, 'pr', left ? '' : 'No companion passes left this year.') : '';
      panel = `<div class="ffc-counts ffc-counts--riders"><fieldset class="ffc-riders"><legend class="ffc-riders__legend">People on your pass</legend>${riderCheck('me', prMeName(d), 'You', prMe(b), prMe(b) || room)}${prPeople(d).map(p => riderCheck(p.id, p.name, '', !!picked[p.id], !!picked[p.id] || room)).join('')}</fieldset>${comp}</div>
        ${!room ? `<p class="ffc-limit" id="prr-limit" role="status">${ic('info-circle', 'ads-icon--sm')}<span>You can book up to 8 travelers in the app.</span></p>` : ''}
        ${f.comp ? '<p class="ss-note">Companions travel with you or someone else on your pass.</p>' : ''}
        ${probs.length ? `<div class="ffc-problems" role="alert">${probs.map(x => `<p class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${esc(x)}</span></p>`).join('')}</div>` : ''}`;
    }
    body = `<section aria-labelledby="pr-who"><h3 class="ffc-h" id="pr-who">Travelers ${q(13)}</h3>${tabs}${help}<div id="pr-panel"${elig && !inDd ? ' role="tabpanel" aria-labelledby="' + (t0 ? `prt-${t0}` : 'pr-who') + '"' : ''}>${panel}</div>${policy}</section>`;
    } else {
    const p = b.pax, seated = paxSeated(p), probs = paxProblems(p);
    ok = !probs.length;
    const row = ([k, l, ages]) => counter(k, l, `${ages}`, p[k], p[k] > 0, canAdd(p, k), 'std', fam && paxErrorFor(p, k) ? `<span class="ads-helper ads-helper--error fam-counterr">${ic('alert-diamond')}<span>${paxErrorFor(p, k)}</span></span>` : '', k === 'youth' ? ` · <button class="ads-link ads-link--sm ffc-inlinelink" type="button" data-a="youth-alone">Traveling alone?</button>` : '');
    // Youth, Child and Infant sit under one "Children and infants" row, collapsed each time Traveler selection opens.
    // Expanding or collapsing only shows or hides the counters; counts are kept and summarised in the header.
    const KIDS = ['youth', 'child', 'infant'], kidsOpen = !!r.u.kidsOpen;
    const kidsSum = KIDS.filter(k => p[k]).map(k => `${p[k]} ${(p[k] > 1 ? PAX_PLURAL[k] : PAX_LABEL[k]).toLowerCase()}`).join(', ');
    const kidsHead = `<button class="ffc-count ffc-kids" type="button" data-a="kids-toggle" id="ffc-kids-h" aria-expanded="${kidsOpen}" aria-controls="ffc-kids-rows"><span class="ffc-count__text"><span class="ffc-count__label">Children and infants</span><span class="ffc-count__sub">${kidsSum ? esc(kidsSum) : 'Ages 15 and under'}</span></span>${ic('chevron-down', 'ffc-kids__chev')}</button>`;
    const counts = PAX.filter(([k]) => !KIDS.includes(k)).map(row).join('') + kidsHead + `<div class="ffc-kids__rows" id="ffc-kids-rows" role="group" aria-label="Children and infants"${kidsOpen ? '' : ' hidden'}>${PAX.filter(([k]) => KIDS.includes(k)).map(row).join('')}</div>`;
    const limit = paxOccupied(p) >= MAX_PAX ? `<p class="ffc-limit" role="status">${ic('info-circle', 'ads-icon--sm')}<span>You can book up to 8 seats in the app. Call 1-800-USA-RAIL to make reservations for 9 to 14 travelers. For 15 or more, complete a Group Travel Request on Amtrak.com.</span></p>` : '';
    const ratio = p.infant > lapCap(p) && !probs.length ? '<p class="ss-note">Each infant beyond the number of adults, seniors and young adults takes a seat and pays the child fare.</p>' : '';
    why = probs.join(' ');
    const fromProfile = d.signedIn && ['military', 'rpa'].includes(d.discount.type) && b.disc === d.discount.type;
    const discs = paxList(b).map(t => {
      const x = tdiscOf(b, t), opts = discOpts(b, t), label = `Traveler ${t.n} · ${PAX_LABEL[t.type]}`;
      const info = x === 'pwd' ? `Applied because ${esc(t.label || `Traveler ${t.n}`)} has a disability in assistance. ${q(9)}` : x === 'companion' ? `Applied because Traveler ${t.n} is a personal companion in assistance. It replaces other passenger discounts. ${q(9)}` : x === 'senior' ? 'Seniors get the senior discount automatically when eligible.' : x === 'infant' ? 'Infants travel on an adult’s lap.' : x === 'infantchild' ? 'More infants than adults: this infant pays the child fare.' : x === 'childfare' ? 'Children pay the child fare.' : x === 'none' ? (t.type === 'adult' || t.type === 'ya' ? 'Adults and young adults don’t get a passenger-type discount.' : 'No discount.') : DISCOUNTS[x] ? DISCOUNTS[x].info : '';
      const ctl = opts && !['pwd', 'companion'].includes(x) ? `<div class="ads-control ads-control--select"><select id="td-${t.key}" data-f="td" data-nodirty data-hook="tdisc" data-key="${t.key}" aria-describedby="td-${t.key}-h">${opts.map(o => `<option value="${o}" ${x === o ? 'selected' : ''}>${o === 'none' ? 'Select a discount' : TDISC_LABEL[o]}</option>`).join('')}</select>${ic('chevron-down')}</div>` : `<p class="ffc-fixedval">${TDISC_LABEL[x]}</p>`;
      return `<div class="ffc-disc"><label class="ffc-disc__label" ${opts && !['pwd', 'companion'].includes(x) ? `for="td-${t.key}"` : ''}>${label}${t.n === 1 && fromProfile && x === b.disc ? ' <span class="ads-lock">From your profile</span>' : ''}</label>${ctl}<p class="ads-helper" id="td-${t.key}-h">${info}</p></div>`;
    }).join('');
    // Core Flow order: travelers, then assistance, then each traveler's discount
    body = `<section aria-labelledby="ffc-who"><h3 class="ffc-h" id="ffc-who">Travelers ${q(10)}</h3><div class="ffc-counts">${counts}</div>${limit}${ratio}${probs.length ? `<div class="ffc-problems" role="alert">${probs.map(x => `<p class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${x}</span></p>`).join('')}</div>` : ''}</section>
      ${fam ? travelerCards(b, r) : assistBlock(r, ri, aHost)}
      ${fam ? '' : paxAll(p) ? `<section aria-labelledby="ffc-disc"><h4 class="ffc-h" id="ffc-disc">Traveler discounts</h4><div class="ffc-discs">${discs}</div><p class="ss-note">One discount per traveler. Eligibility information doesn’t block your choice. Changes here don’t change your profile.</p></section>` : ''}`;
  }
  if (corp || (pr && b.prType)) body += fam ? travelerCards(b, r) : assistBlock(r, ri, aHost); // Pass Rider: traveler details once Business or Leisure is chosen
  const foot = `${ok ? '' : `<p class="ads-helper" id="trav-why">${esc(why)}</p>`}<button class="ads-btn ads-btn--block" type="button" data-a="pick-travelers-done" ${ok ? '' : 'disabled aria-describedby="trav-why"'}>Done</button>`;
  if (std === 'parts') return { body, ok, why };
  // Version 1 (and a pushed Version 2 screen): Traveler selection with the same content
  if (fam) return { title: 'Traveler selection', kind: 'push', banner: false, body: `<div class="travsel">${body}</div>`, foot }; // Back undoes unsaved changes; Done saves
  if (std) return { title: 'Traveler selection', kind: 'push', banner: false, body: `<div class="travsel">${body}</div>`, foot };
  body = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>Travelers</h3><p class="ffc-sheetsub">${corp ? 'Corporate booking' : pr ? `Pass Rider · ${b.prType === 'business' ? 'Business' : 'Leisure'} travel` : 'Choose who’s traveling, then each traveler’s discount and assistance.'}</p></div>` + body;
  return { title: 'Travelers', srTitle: true, cls: 'pane--sheet', kind: 'push', banner: false, body, foot };
}
// Pass Rider traveler selection: one checkbox per named rider (a rider is selected or not, never added twice)
function riderCheck(k, name, sub, on, enabled, why = 'prr-limit') {
  const id = `prr-${k}`;
  return `<label class="ads-choice ads-checkbox ffc-rider${enabled ? '' : ' is-disabled'}" for="${id}"><input type="checkbox" id="${id}" data-a="pr-pick" data-k="${k}" ${on ? 'checked' : ''} ${enabled ? '' : `disabled aria-describedby="${why}"`}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${esc(name)}</span>${sub ? `<span class="ads-choice__supporting">${esc(sub)}</span>` : ''}</span></label>`;
}
// Selecting or clearing a named rider: one at most each; their answers stay with them if they're added again
A['pr-pick'] = t => {
  const b = D().booking, k = t.dataset.k;
  if (k === 'me') b.prPax.me = t.checked;
  else { b.prPax.people = Object.assign({}, b.prPax.people); if (t.checked) b.prPax.people[k] = 1; else delete b.prPax.people[k]; }
  pendingFocus = `#prr-${k}`; render();
};
A.pax = t => {
  const b = D().booking, k = t.dataset.k, dlt = +t.dataset.d, g = t.dataset.g;
  if (g === 'prme') { b.prPax.me = dlt > 0; pendingFocus = `[data-a="pax"][data-g="prme"][data-d="${-dlt}"]:not(:disabled), [data-a="pax"][data-g="prme"]:not(:disabled)`; render(); return; } // the signed-in traveler: 0 or 1
  if (g === 'prp') { // a named person on the pass: 0 or 1; their answers stay with them if they're added again
    b.prPax.people = Object.assign({}, b.prPax.people); if (dlt > 0) b.prPax.people[k] = 1; else delete b.prPax.people[k];
    pendingFocus = `[data-a="pax"][data-g="prp"][data-k="${k}"]:not(:disabled), [data-a="pax"][data-g="prp"][data-k="${k}"]`; render(); return;
  }
  const was = g === 'pr' ? b.prPax[k] : b.pax[k];
  if (g === 'pr') b.prPax[k] = Math.max(0, b.prPax[k] + dlt);
  else b.pax[k] = Math.max(0, b.pax[k] + dlt);
  // A removed traveler takes their own selections with them (NMA-612 BR2, NMA-615 AC1): a traveler added
  // later starts fresh instead of inheriting someone else's discount or assistance
  if (dlt < 0 && was > 0 && v1()) forgetTraveler(b, g === 'pr' ? `pr-${k}-${was}` : `${k}-${was}`);
  pendingFocus = `[data-a="pax"][data-g="${g}"][data-k="${k}"][data-d="${dlt}"]:not(:disabled), [data-a="pax"][data-g="${g}"][data-k="${k}"]:not(:disabled)`; render();
};
function forgetTraveler(b, key) {
  b.ta = b.ta || {};
  if (key === holderKey(b)) { b.assist = blankAssist(); b.assistDone = false; b.assistFromProfile = false; if (key === 'adult-1') b.disc = freshBooking(D()).disc; }
  delete b.ta[key]; if (b.tdisc) delete b.tdisc[key]; if (b.prKinds) delete b.prKinds[key];
  if (b.taSeen) delete b.taSeen[key];
  if (b.ask) delete b.ask[key];
}
A['pr-me'] = t => { D().booking.prPax.me = t.checked; pendingFocus = '[data-a="pr-me"]'; render(); };
HOOKS.prkind = (r, t) => { const b = D().booking; b.prKinds = b.prKinds || {}; b.prKinds[t.dataset.key] = t.value; pendingFocus = '#' + CSS.escape(t.id); };
// Leaving Traveler details with a selection that can't be searched: keep editing, or go back to the last valid one
const backBase = A.back;
A.back = (t, ri) => {
  const sh = sheet(), r = sh && sh.stack[+ri], b = D().booking;
  if (r && r.s === 'travelers' && v1()) return A['trav-cancel'](t, ri); // Back: one level up, keeping what was saved before (no dialog)
  if (r && r.s === 'travelers' && travelerProblems(b).length) {
    return dialog({ title: 'Travelers can’t be used yet', body: esc(travelerProblems(b).join(' ')), returnFocus: '[data-a="pick-travelers-done"]',
      actions: [['Keep editing', 'secondary', null], ['Undo traveler changes', 'primary', () => { Object.assign(b, clone(r.u.snap)); popTo(+ri - 1); }]] });
  }
  return backBase(t, ri);
};
// The sheet's X closes the whole booking; if Traveler details is open with a selection that can't be searched, ask first
const closeBase = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet(), r = sh && sh.stack[sh.stack.length - 1], b = D().booking;
  if (r && r.s === 'travelers' && travelerProblems(b).length) {
    return dialog({ title: 'Travelers can’t be used yet', body: esc(travelerProblems(b).join(' ')), returnFocus: '[data-a="pick-travelers-done"]',
      actions: [['Keep editing', 'secondary', null], ['Undo traveler changes and close', 'primary', () => { Object.assign(b, clone(r.u.snap)); closeSheet(); }]] });
  }
  return closeBase(t, ri);
};
// Core Flow links Youth to the unaccompanied-minor rules; the content comes from AEM (NMA-611 BR3)
A['youth-alone'] = () => dialog({ title: 'Traveling alone?', returnFocus: '[data-a="youth-alone"]', actions: [['Close', 'primary', null]],
  body: 'The rules for youths traveling without an adult (unaccompanied minors) will come from AEM. In the app, a youth needs an adult or senior on the same booking.' });
HOOKS.tdisc = (r, t) => { setTdisc(D().booking, t.dataset.key, t.value); pendingFocus = '#' + CSS.escape(t.id); };

// ---------- Handoff ----------
function handoffExtra(b) {
  const d = D(), rows = [], intent = intentOf(b);
  if (intent === 'corporate') rows.push(['Booking', 'Corporate (TripLink)']);
  else if (intent === 'pr') rows.push(['Booking', `Pass Rider · ${b.prType === 'business' ? 'Business' : 'Leisure'}`]);
  else if (intent === 'personal') rows.push(['Booking', 'Personal']);
  if (intent === 'standard' || intent === 'personal') rows.push(['Pay with', b.pay === 'points' ? (d.signedIn ? 'Points' : 'Points (guest signs in after choosing a fare)') : 'Cash']);
  if (intent === 'pr') rows.push(['Travelers', travelerList(b).map(t => esc(t.label)).join('<br>')]);
  else if (intent === 'corporate') rows.push(['Travelers', '1 adult · You']);
  else rows.push(['Travelers', paxList(b).map(t => { const x = tdiscOf(b, t); return `Traveler ${t.n} · ${PAX_LABEL[t.type]}${x === 'none' ? '' : ` · ${TDISC_LABEL[x]}`}`; }).join('<br>')]);
  if (intent === 'pr' && b.prType) rows.push(['Travel type', b.prType === 'business' ? 'Business' : 'Leisure']);
  if (codeApplies(b) && b.code) rows.push(['Code', `${esc(b.code.code)} (${esc(b.code.kind)})${b.codeState === 'applied' ? ' · applied' : ''}`]);
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
  return Object.assign(o, { title: 'Assistance', srTitle: true, cls: 'pane--sheet', body: sheetHead('Assistance', '') + o.body });
};
