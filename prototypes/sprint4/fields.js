/* Sprint 4 prototype: Fare Finder fields shared by Concepts 1 and 3.
   - Discount code (NMA-613): an always-visible optional field for monetary searches, after the traveler
     summary and before Find trains (placement proposed, Q21). Guests and members type a code; members with
     saved codes can also pick one from a pop-up, soonest expiry first. States: entered, checking, applied,
     invalid format, not eligible, couldn't check (service error), and trip changed (checked again). It is
     hidden for points searches and not used for TripLink Corporate or Pass Rider travel.
   - No assistance check on the Fare Finder (stakeholder feedback): assistance is added per traveler in
     Traveler selection (Q7).
   Validation responses are simulated (Scenario › Network, and the test codes in the notes). */

// ---------- Discount code ----------
// What the code depends on: changing any of these means the code is checked again (NMA-613 scenario 16)
const codeSig = b => JSON.stringify([b.from, b.to, b.trip, b.dep, b.ret, b.pax, intentOf(b)]);
const codeStateOf = b => b.codeState === 'applied' && b.codeSig !== codeSig(b) ? 'changed' : (b.codeState || '');
const savedCodes = () => D().signedIn ? [...D().coupons].sort((x, y) => x.exp.localeCompare(y.exp)) : [];
function setCodeText(b, v) {
  v = (v || '').trim().toUpperCase();
  if (v === (b.codeText || '')) return;
  const known = savedCodes().find(c => c.code === v);
  Object.assign(b, { codeText: v, code: known ? clone(known) : null, codeState: '', codeErr: '', codeSrc: v ? 'manual' : '' }); // typed: this booking only, never saved to the account
}
// A typed code lasts for the booking it was entered in. Abandoning that booking (closing New booking) clears
// it, so a new booking starts with an empty field. Account coupons are never touched.
const manualCode = b => !!(b.codeText && b.codeSrc === 'manual');
function clearManualCode(b) { if (manualCode(b)) Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '', codeTries: 0, codeDraft: '', codeSrc: '', codeSig: '' }); }
// The code page is "Apply code" (applycoupon.js).
// New booking: the code is a selector row (Figma Sprint 4 node 3295:51258). It opens the code screen, which
// holds the field above (same rules); results of the check at Find trains show under the row.
function codeRow(r, b) {
  if (!['standard', 'personal'].includes(intentOf(b)) || b.pay === 'points') return ''; // not shown for points (NMA-613 scenario 1)
  ref('613'); q(21); q(23);
  const st = codeStateOf(b), text = b.codeText || '', busy = r.u.busy && text;
  const bad = !busy && ['invalid', 'ineligible', 'error'].includes(st);
  const btn = (a, label, kind = 'secondary') => `<button class="ads-btn ads-btn--${kind} ads-btn--sm" type="button" data-a="${a}">${label}</button>`;
  let sub = '', msg = '';
  if (busy) sub = 'Checking your code';
  else if (bad) msg = `<p class="ads-helper ads-helper--error dcode__msg" id="ff-code-h" tabindex="-1">${ic('alert-diamond')}<span>${esc(b.codeErr)}</span></p>${st === 'error' ? `<div class="dcode__acts">${btn('code-retry', 'Try again')}</div>` : st === 'ineligible' ? `<div class="dcode__acts">${btn('code-skip', 'Find trains without this code')}</div>` : ''}`;
  else if (st === 'applied') sub = `Code applied${b.code && b.code.benefit ? `: ${b.code.benefit}` : ''}`;
  else if (st === 'changed') sub = 'Your trip changed, so this code will be checked again when you find trains.';
  else if (b.code && b.code.benefit) sub = `${b.code.kind}: ${b.code.benefit}`;
  else if (text) sub = 'Checked when you find trains';
  return selectRow({ id: 'ff-coderow', cls: 'dcode', label: 'Coupon or promotional code', value: text || 'Apply code', sub, invalid: bad, describedby: bad ? 'ff-code-h' : '', attrs: 'data-a="code-open"', after: msg });
}
A['code-open'] = (t, ri) => push('dcode', {}, +ri);

// Removing a code clears it from this search only; a profile code stays in My coupons (NMA-613 scenario 19)
A['code-remove'] = () => {
  const b = D().booking, c = b.codeText || (b.code && b.code.code) || '', mine = D().coupons.some(x => x.code === c);
  Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '', codeTries: 0, codeDraft: '', codeSrc: '' }); // the booking only: My coupons is unchanged
  pendingFocus = '#ff-code, [data-s="code"]'; toast(mine ? 'Code removed from this search. It’s still in My coupons.' : `Code ${c} removed`, 'info');
};
A['code-retry'] = () => A['find-trains'](null, '0');
A['code-skip'] = () => { const b = D().booking; Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '' }); A['find-trains'](null, '0'); };
// Front-end format check before anything is sent (NMA-613 scenario 16, format): 4 or 14 letters or numbers (Q23)
function codeFormatError(b) {
  if (!codeApplies(b) || !b.codeText || CODE_FORMAT.test(b.codeText)) return false;
  b.codeTries++; b.codeState = 'invalid';
  b.codeErr = b.codeTries >= 2 ? 'This code still isn’t valid. Call 1-800-USA-RAIL (1-800-872-7245) for help.' : 'This code isn’t valid. Check it and try again.';
  return true;
}

// Placeholder for the Pass Rider policy (built later, NMA-1081)
INFO['pr-policy'] = { title: 'Pass Rider policy', body: () => `<div class="info-pending"><b>Pass Rider policy</b><span>Content pending</span></div>` };

// ---------- Booking type (NMA-622, 623, 1016) ----------
// One compact entry showing the current mode; a sheet lists only the modes this member can use. Regular travel
// is always available to them. Business or Leisure appears only inside eligible Pass Rider travel. An account
// eligible for both TripLink and Pass Rider starts as Regular with no special mode preselected (Q26).
function modeOptions(d) {
  const o = [];
  if (d.triplink) o.push(['corporate', 'Corporate (TripLink)', 'Corporate fares for you only. Points, passenger discounts and codes aren’t used.']);
  if (d.passrider) o.push(['pr', 'Pass Rider', 'Employee pass travel for you and eligible family. Points, passenger discounts and codes aren’t used.']);
  o.push(['personal', d.triplink && !d.passrider ? 'Personal' : 'Regular', 'Regular fares. Points, passenger discounts and codes can be used.']);
  return o;
}
const modeLabel = (b, d) => { const o = modeOptions(d), cur = ['corporate', 'pr'].includes(b.intent) ? b.intent : 'personal'; const m = o.find(x => x[0] === cur); return m[1] + (b.intent === 'pr' && b.prType ? ` · ${b.prType === 'business' ? 'Business' : 'Leisure'}` : ''); };
function modeEntry(b, where) {
  const d = D(); if (!d.signedIn || (!d.triplink && !d.passrider)) return '';
  if (d.triplink) ref('622'); if (d.passrider) ref('623', '1016');
  return `<button class="mode-entry mode-entry--${where}" type="button" data-a="mode-open" aria-label="Booking type: ${esc(modeLabel(b, d))}. Change booking type"><span class="mode-entry__label">Booking type</span><span class="mode-entry__val">${esc(modeLabel(b, d))}</span>${ic('chevron-down', 'ads-icon--sm')}</button>`;
}
INFO['booking-type'] = {
  title: 'Booking type',
  body: () => { const d = D(), b = d.booking, cur = ['corporate', 'pr'].includes(b.intent) ? b.intent : (b.intent === 'personal' ? 'personal' : ''); return `<fieldset class="ads-fieldset mode-opts"><legend class="ads-sr-only">Booking type</legend><div class="ads-fieldset__options">${modeOptions(d).map(([v, l, sub]) => `<label class="ads-choice ads-radio"><input type="radio" name="mode-pick" data-a="mode-pick" data-v="${v}" ${cur === v || (!cur && v === 'personal') ? 'checked' : ''}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${esc(l)}</span><span class="ads-choice__supporting">${esc(sub)}</span></span></label>`).join('')}</div></fieldset>${b.modeNote ? `<p class="ads-helper" role="status">${esc(b.modeNote)}</p>` : ''}`; }
};
A['mode-open'] = () => openInfo('booking-type', '[data-a="mode-open"]');
A['mode-pick'] = t => {
  const d = D(), b = d.booking, val = t.dataset.v; b.modeNote = null;
  if (val === 'pr' && !prCanStart(d).ok) { b.modeNote = prCanStart(d).text; render(); return; } // stays open with the reason
  setIntent(b, val); nav().info = null; pendingFocus = '[data-a="mode-open"]'; render();
};
