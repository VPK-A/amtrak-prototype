/* Sprint 4 prototype: one-traveler editing sheet (used by archived Concept 4), Cancel steps, Exit booking and
   promotion-code clearing. The Concept 3 overview was retired with the Familiar / Brand forward switch. */

// ---------- Editing one traveler (archived Concept 4 traveler rows) ----------
const TRAV_SNAP = b => clone({ prKinds: b.prKinds || {}, tdisc: b.tdisc, disc: b.disc, assist: b.assist, assistDone: b.assistDone, assistFromProfile: b.assistFromProfile, ta: b.ta || {}, assistOn: b.assistOn, ask: b.ask || {} });
A['ov-traveler'] = (t, ri) => {
  const b = D().booking; push('traveler', { t: t.dataset.t }, +ri);
  const r = sheet().stack[sheet().stack.length - 1]; r.u.snap = TRAV_SNAP(b);
};
SCR.traveler = (r, ri) => {
  const d = D(), b = d.booking, t = travelerList(b).find(x => x.key === r.p.t);
  if (!t) return { title: 'Traveler', kind: 'push', body: '<p class="ads-body-small">This traveler is no longer on the booking.</p>' };
  const fromProfile = d.signedIn && ['military', 'rpa'].includes(d.discount.type) && b.disc === d.discount.type, err = travelerError(b, t);
  const body = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>${esc(t.label)}</h3><p class="ffc-sheetsub">Changes show in the overview right away. Cancel puts them back.</p></div>${assistNetAlert(r)}<div class="fam-card ov-edit${err ? ' has-error' : ''}">${discountRow(b, t, fromProfile)}${assistanceRow(b, t, r)}${companionRow(b, t)}${err ? `<p class="ads-helper ads-helper--error" role="alert">${ic('alert-diamond')}<span>${esc(err)}</span></p>` : ''}</div>`;
  return { title: t.label, srTitle: true, cls: 'pane--sheet', kind: 'editor', cancelA: 'sheet-cancel', close: true, banner: false, body, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="sheet-done">Done</button>` };
};
// Cancel puts back what this sheet changed; Done keeps it (the booking was already updated live)
A['sheet-cancel'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking;
  if (r && r.u.snap) Object.assign(b, clone(r.u.snap));
  popTo(+ri - 1);
};
A['sheet-done'] = (t, ri) => popTo(+ri - 1);

// Steps with Cancel (Traveler selection): Escape and X don't keep their
// unconfirmed edits either. Escape cancels the step; X puts the step back, then closes the booking.
function cancelActionFor(r) { return !r ? null : r.s === 'traveler' ? 'sheet-cancel' : r.s === 'travelers' && v1() ? 'trav-cancel' : null; }
const closeBeforeCancel = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1];
  if (top && cancelActionFor(top) && top.u.snap && !(top.s === 'travelers' && paxProblems(D().booking.pax).length)) Object.assign(D().booking, clone(top.u.snap));
  return closeBeforeCancel(t, ri);
};

// ---------- Exit booking? ----------
// Something is filled out when the trip differs from a new booking's starting values (Profile prefills count as
// starting values, so they don't trigger the question on their own)
const FILL_KEYS = ['trip', 'from', 'to', 'dep', 'ret', 'disc', 'pax', 'tdisc', 'pay', 'intent', 'prType', 'prPax', 'prKinds', 'codeText', 'code', 'ask', 'ta', 'assist', 'assistDone'];
function bookingFilled(b) {
  const f = freshBooking(D());
  const norm = v => { if (v && typeof v === 'object' && !Array.isArray(v)) { const o = {}; Object.keys(v).sort().forEach(k => { if (v[k] != null && v[k] !== false && v[k] !== 'none') o[k] = norm(v[k]); }); return Object.keys(o).length ? o : null; } return v === '' || v === undefined ? null : v; };
  return FILL_KEYS.some(k => JSON.stringify(norm(b[k])) !== JSON.stringify(norm(f[k])));
}
// Anything that closes the whole booking modal (close button, scrim, Escape at the root) asks first. Back
// between booking levels doesn't. Keep booking leaves every value and the current step as they are. Trip
// details stay for New booking (the established retention); unconfirmed edits on a Cancel step aren't kept.
const closeBeforeExit = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet();
  if (!sh || sh.id !== 'booking' || !v1() || nav().dialog) return closeBeforeExit(t, ri);
  const top = sh.stack[sh.stack.length - 1], step = cancelActionFor(top) || (top.u && top.u.dirty);
  if (!bookingFilled(D().booking) && !(top.u && top.u.dirty)) return closeBeforeExit(t, ri); // nothing filled out yet: close without asking
  dialog({ title: 'Exit booking?', returnFocus: '.sheet-layer [data-a="close"]',
    body: `Your trip details are kept, so you can pick up from New booking.${manualCode(D().booking) ? ' The promotion code you entered isn’t kept.' : ''}${step ? ' Changes on this screen that you haven’t confirmed won’t be kept.' : ''}`,
    actions: [['Keep booking', 'primary', null], ['Exit booking', 'secondary', () => { sh.stack.forEach(r => { r.u.dirty = false; }); closeBeforeExit(t, ri); }]] });
};

// ---------- Abandoning a booking clears a typed promotion code ----------
// Whatever closes New booking (Exit booking, the close button or Escape with nothing else filled in), the next
// booking starts with an empty code field. Codes chosen from Saved codes or My coupons are account coupons and
// stay selected; the account's coupons themselves are never changed here.
let BOOKING_OPEN = false;
const renderBeforePromo = render;
render = function () {
  const open = !!(nav().sheet && nav().sheet.id === 'booking');
  if (BOOKING_OPEN && !open && D().booking) clearManualCode(D().booking);
  BOOKING_OPEN = open;
  return renderBeforePromo.apply(this, arguments);
};
