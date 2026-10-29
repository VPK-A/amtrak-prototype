/* Sprint 4 prototype: Version 3 (Overview). The Fare Finder is the overview of the whole booking:
   - a Travelers overview shows every traveler with their discount, assistance and companion pairing, each
     editable on its own;
   - booking as Pass Rider, an eligibility card shows role, travel type, companion passes and the
     dependent age rule.
   Editing a traveler opens one sheet level (no extra layers). It changes the booking live so the overview
   updates at once; Cancel puts back what that sheet changed, Done keeps it. Assistance opens inside the same
   sheet and returns to that traveler. */

// Travelers overview: one row per traveler, with discount, assistance and companion at a glance
function overviewTravelers(r, ri, b) {
  const it = intentOf(b), std = ['standard', 'personal'].includes(it), list = travelerList(b);
  const rows = list.map(t => {
    const a = assistRec(b, t.key), c = assistCat(b, t.key), err = travelerError(b, t);
    const chips = [];
    // Only what was chosen: no "No discount" or "No assistance" labels (the Edit sheet still offers both)
    if (std) { const x = tdiscOf(b, t); if (x !== 'none') chips.push(`<span class="ov-chip${['pwd', 'companion'].includes(x) ? ' ov-chip--set' : ''}">${ic('discount', 'ads-icon--sm')}${esc(TDISC_LABEL[x])}</span>`); }
    if (c && c !== 'none') chips.push(`<span class="ov-chip ov-chip--assist">${ic('assistance', 'ads-icon--sm')}${esc(c === 'companion' ? 'Personal companion' : CATS[c])}</span>`);
    if (c === 'companion') chips.push(`<span class="ov-chip ov-chip--pair">Companion to ${esc(travelerLabel(b, a.m.for).replace(/ · .*/, ''))}</span>`);
    if (c === 'disability') { const comp = companionOf(b, t.key); if (comp) chips.push(`<span class="ov-chip ov-chip--pair">Companion: ${esc(comp.label.replace(/ · .*/, ''))}</span>`); }
    return `<li class="ov-trav${err ? ' has-error' : ''}" id="ovt-${t.key}"><div class="ov-trav__main"><span class="ov-trav__name">${esc(t.label)}${t.n === 1 && a.done && a.fromProfile ? ' <span class="ads-lock">From your profile</span>' : ''}</span>${chips.length ? `<span class="ov-chips">${chips.join('')}</span>` : ''}${err ? `<span class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${esc(err)}</span></span>` : ''}</div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="ov-traveler" data-t="${t.key}" aria-label="Edit ${esc(t.label)}: discount, assistance and personal companion">Edit</button></li>`;
  }).join('');
  q(7); // notes only: assistance moved here from the Fare Finder (stakeholder feedback vs NMA-973)
  // Inside the Travelers sheet: each traveler, with discount, assistance and companion edited on their own
  return `<section class="ov-travs" aria-labelledby="ov-tr-h"><h4 class="ffc-h" id="ov-tr-h">Traveler details</h4><ul class="ov-list">${rows}</ul></section>`;
}
// Pass Rider eligibility at a glance (NMA-623, 1016–1018; dependent age NMA-1017 AC4)
function overviewPassRider(b) {
  const d = D(), p = d.passrider; if (intentOf(b) !== 'pr' || !p) return '';
  const can = prCanStart(d), rows = [['Booking as', `${prRoleLabel(d)} on pass ${d.employee ? d.employee.pass.slice(0, 3) + '••••' + d.employee.pass.slice(-2) : ''}`], ['Travel type', b.prType === 'business' ? 'Business' : b.prType === 'leisure' ? 'Leisure' : 'Not chosen yet']];
  if (p.role === 'employee') rows.push(['Companion passes', `${p.compLeft} of 8 left this year`]);
  if (p.role === 'dependent') rows.push(['Age rule', can.ok ? `Eligible (${can.age})` : 'Not eligible']);
  return `<section class="ov-pr" aria-label="Pass Rider eligibility"><p class="ov-pr__title">${ic(can.ok ? 'check-circle' : 'alert-diamond', 'ads-icon--sm')}Pass Rider ${can.ok ? 'eligible' : 'not available'}</p><dl class="cpn-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${can.ok ? '' : `<p class="ads-helper">${esc(can.text)}</p>`}</section>`;
}

// ---------- Editing one traveler from the overview ----------
const TRAV_SNAP = b => clone({ tdisc: b.tdisc, disc: b.disc, assist: b.assist, assistDone: b.assistDone, assistFromProfile: b.assistFromProfile, ta: b.ta || {}, assistOn: b.assistOn });
A['ov-traveler'] = (t, ri) => {
  const b = D().booking; push('traveler', { t: t.dataset.t }, +ri);
  const r = sheet().stack[sheet().stack.length - 1]; r.u.snap = TRAV_SNAP(b);
};
SCR.traveler = (r, ri) => {
  const d = D(), b = d.booking, t = travelerList(b).find(x => x.key === r.p.t);
  if (!t) return { title: 'Traveler', kind: 'push', body: '<p class="ads-body-small">This traveler is no longer on the booking.</p>' };
  const fromProfile = d.signedIn && ['military', 'rpa'].includes(d.discount.type) && b.disc === d.discount.type, err = travelerError(b, t);
  const body = `<div class="ffc-sheethead"><h3 class="ffc-sheettitle" tabindex="-1" data-title>${esc(t.label)}</h3><p class="ffc-sheetsub">Changes show in the overview right away. Cancel puts them back.</p></div><div class="fam-card ov-edit${err ? ' has-error' : ''}">${discountRow(b, t, fromProfile)}${assistanceRow(b, t)}${companionRow(b, t)}${err ? `<p class="ads-helper ads-helper--error" role="alert">${ic('alert-diamond')}<span>${esc(err)}</span></p>` : ''}</div>`;
  return { title: t.label, srTitle: true, cls: 'pane--sheet', kind: 'editor', cancelA: 'sheet-cancel', close: true, banner: false, body, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="sheet-done">Done</button>` };
};
// Cancel puts back what this sheet changed; Done keeps it (the booking was already updated live)
A['sheet-cancel'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking;
  if (r && r.u.snap) Object.assign(b, clone(r.u.snap));
  popTo(+ri - 1);
};
A['sheet-done'] = (t, ri) => popTo(+ri - 1);

// Steps with Cancel (Overview traveler sheet, Familiar Traveler selection): Escape and X don't keep their
// unconfirmed edits either. Escape cancels the step; X puts the step back, then closes the booking.
function cancelActionFor(r) { return !r ? null : r.s === 'traveler' ? 'sheet-cancel' : r.s === 'travelers' && v1() ? 'trav-cancel' : null; }
const closeBeforeCancel = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1];
  if (top && cancelActionFor(top) && top.u.snap && !(top.s === 'travelers' && paxProblems(D().booking.pax).length)) Object.assign(D().booking, clone(top.u.snap));
  return closeBeforeCancel(t, ri);
};
