/* Sprint 4 prototype: Version 3 (Overview). The Fare Finder is the overview of the whole booking:
   - a status strip says whether the booking is ready, or lists what needs attention, each item linked to
     the field or traveler it belongs to;
   - a Travelers overview shows every traveler with their discount, assistance and companion pairing, each
     editable on its own;
   - booking as Pass Rider, an eligibility card shows role, travel type, companion passes and the
     dependent age rule.
   Editing a traveler opens one sheet level (no extra layers). It changes the booking live so the overview
   updates at once; Cancel puts back what that sheet changed, Done keeps it. Assistance opens inside the same
   sheet and returns to that traveler. */

// What still needs attention, in reading order. tone: 'todo' (not done yet) or 'error' (needs a change)
function overviewIssues(r, b) {
  const d = D(), out = [], it = intentOf(b), e = ffErrors(b), list = travelerList(b);
  if (!b.from) out.push({ text: 'Choose a departure station', target: '#ff-from', tone: 'todo' });
  if (!b.to) out.push({ text: 'Choose an arrival station', target: '#ff-to', tone: 'todo' });
  if (e.ret) out.push({ text: e.ret, target: '#ff-ret', tone: 'error' });
  if (it === 'pr' && !b.prType) out.push({ text: 'Choose Business or Leisure travel', target: '[data-a="pr-type"]', tone: 'todo' });
  if (it === 'pr' && !prCanStart(d).ok) out.push({ text: prCanStart(d).text, target: '[data-a="ffc-set"][data-key="intent"][data-v="personal"]', tone: 'error' });
  if (['standard', 'personal'].includes(it)) paxProblems(b.pax).forEach(t => out.push({ text: t, target: '#ff-trav', tone: 'error' }));
  list.forEach(t => { const er = travelerError(b, t); if (er) out.push({ text: `${t.label}: personal companion needs a change`, target: `[data-a="ov-traveler"][data-t="${t.key}"]`, tone: 'error' }); });
  if (b.assistOn && list.length && !list.some(t => assistRec(b, t.key).done)) out.push({ text: 'Assistance is on, but no traveler has answered yet', target: `[data-a="ov-traveler"][data-t="${list[0].key}"]`, tone: 'todo' });
  if (b.codeErr) out.push({ text: b.codeErr, target: '#ffc-code-err', tone: 'error' });
  return out;
}
function overviewStatus(r, b) {
  const issues = overviewIssues(r, b);
  if (!issues.length) {
    const n = travelerList(b).length;
    return `<div class="ov-status ov-status--ready" role="status">${ic('check-circle', 'ov-status__icon')}<div><p class="ov-status__title">Ready to find trains</p><p class="ov-status__sub">${b.trip === 'rt' ? 'Round-trip' : 'One-way'} · ${b.from} → ${b.to} · ${fmtShortY(b.dep)}${b.trip === 'rt' && b.ret ? ` – ${fmtShortY(b.ret)}` : ''} · ${n} traveler${n > 1 ? 's' : ''}</p></div></div>`;
  }
  const errs = issues.filter(x => x.tone === 'error').length;
  return `<div class="ov-status${errs ? ' ov-status--error' : ''}" role="status" aria-labelledby="ov-st-h"><p class="ov-status__title" id="ov-st-h">${issues.length} ${issues.length > 1 ? 'items' : 'item'} ${errs ? (issues.length > 1 ? 'need' : 'needs') + ' attention' : 'to finish'}</p><ul class="ov-status__list">${issues.map(x => `<li><button class="ov-status__item ov-status__item--${x.tone}" type="button" data-a="ov-go" data-target="${esc(x.target)}">${ic(x.tone === 'error' ? 'alert-diamond' : 'chevron-right', 'ads-icon--sm')}<span>${esc(x.text)}</span></button></li>`).join('')}</ul></div>`;
}
// Go to an item: scroll only the booking content (not the sheet or device around it), then focus it
A['ov-go'] = t => {
  pendingFocus = null; render();
  const el = $(t.dataset.target, devEl()); if (!el) return;
  const sc = el.closest('.pane__scroll');
  if (sc) sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.clientHeight / 3, behavior: motionOff() ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
};

// Travelers overview: one row per traveler, with discount, assistance and companion at a glance
function overviewTravelers(r, ri, b) {
  const it = intentOf(b), std = ['standard', 'personal'].includes(it), list = travelerList(b);
  const rows = list.map(t => {
    const a = assistRec(b, t.key), c = assistCat(b, t.key), err = travelerError(b, t);
    const chips = [];
    if (std) { const x = tdiscOf(b, t); chips.push(`<span class="ov-chip${['pwd', 'companion'].includes(x) ? ' ov-chip--set' : ''}">${ic('discount', 'ads-icon--sm')}${esc(TDISC_LABEL[x])}</span>`); }
    else chips.push(`<span class="ov-chip">${ic('discount', 'ads-icon--sm')}${it === 'pr' ? 'Pass Rider fare' : 'Corporate fare'}</span>`);
    chips.push(c && c !== 'none' ? `<span class="ov-chip ov-chip--assist">${ic('assistance', 'ads-icon--sm')}${esc(c === 'companion' ? 'Personal companion' : CATS[c])}</span>` : `<span class="ov-chip ov-chip--muted">${ic('assistance', 'ads-icon--sm')}No assistance</span>`);
    if (c === 'companion') chips.push(`<span class="ov-chip ov-chip--pair">Companion to ${esc(travelerLabel(b, a.m.for).replace(/ · .*/, ''))}</span>`);
    if (c === 'disability') { const comp = companionOf(b, t.key); if (comp) chips.push(`<span class="ov-chip ov-chip--pair">Companion: ${esc(comp.label.replace(/ · .*/, ''))}</span>`); }
    return `<li class="ov-trav${err ? ' has-error' : ''}" id="ovt-${t.key}"><div class="ov-trav__main"><span class="ov-trav__name">${esc(t.label)}${t.n === 1 && a.done && a.fromProfile ? ' <span class="ads-lock">From your Profile</span>' : ''}</span><span class="ov-chips">${chips.join('')}</span>${err ? `<span class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${esc(err)}</span></span>` : ''}</div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="ov-traveler" data-t="${t.key}" aria-label="Edit ${esc(t.label)}">Edit</button></li>`;
  }).join('');
  const check = V().entry === 'ff' ? assistBlock(r, ri, 'ff', { noList: true }) : '';
  return `<section class="ov-travs" aria-labelledby="ov-tr-h"><div class="ov-travs__head"><h4 class="ffc-h" id="ov-tr-h">Travelers</h4><button class="ads-link ads-link--sm linkbtn" type="button" data-a="pick-travelers">${it === 'corporate' ? 'View' : 'Change travelers'}</button></div><ul class="ov-list">${rows}</ul>${check}</section>`;
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

// Steps with Cancel (Overview traveler sheet, Familiar Traveler Selection): Escape and X don't keep their
// unconfirmed edits either. Escape cancels the step; X puts the step back, then closes the booking.
function cancelActionFor(r) { return !r ? null : r.s === 'traveler' ? 'sheet-cancel' : r.s === 'travelers' && v1() ? 'trav-cancel' : null; }
const closeBeforeCancel = A.close;
A.close = A.scrim = (t, ri) => {
  const sh = sheet(), top = sh && sh.stack[sh.stack.length - 1];
  if (top && cancelActionFor(top) && top.u.snap && !(top.s === 'travelers' && paxProblems(D().booking.pax).length)) Object.assign(D().booking, clone(top.u.snap));
  return closeBeforeCancel(t, ri);
};
