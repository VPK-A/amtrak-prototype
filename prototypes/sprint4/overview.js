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

// Leaving New booking (Fare Finder's X, the scrim, Escape at Fare Finder)
// - Before anything is in the cart: back to Book with no warning. Every saved search selection is kept, including a
//   typed promotion code, and Fare Finder reopens with them.
// - With an item in the cart: "Abandon booking?" Continue booking keeps the cart and stays on the same screen;
//   Abandon booking clears the cart (and a typed promotion code) and returns to Book.
// Screens under Fare Finder have no X; Back goes up one level and never asks to abandon.
const cartOf = () => D().cart || (D().cart = []);
const closeBeforeExit = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet();
  if (!sh || sh.id !== 'booking' || !v1() || nav().dialog) return closeBeforeExit(t, ri);
  const cart = cartOf();
  if (!cart.length) return closeBeforeExit(t, ri);
  const top = sh.stack[sh.stack.length - 1];
  dialog({ title: 'Abandon booking?', returnFocus: top.s === 'ff' ? '.ads-sheet-header__close' : 'title',
    body: `Your cart has ${cart.length === 1 ? '1 item' : `${cart.length} items`}: ${cart.map(x => esc(x.label)).join(', ')}. If you abandon this booking, your cart is cleared.`,
    actions: [['Continue booking', 'primary', null], ['Abandon booking', 'secondary', () => { D().cart = []; clearManualCode(D().booking); sh.stack.forEach(r => { r.u.dirty = false; }); nav().tab = 'book'; closeBeforeExit(t, ri); }]] });
};
// ---------- A typed promotion code ----------
// It belongs to this booking: kept while the booking is open or closed without a cart, cleared only by Abandon
// booking (above). Codes from Saved codes or My coupons are account coupons and are never changed here.
