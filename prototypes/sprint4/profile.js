/* Sprint 4 prototype: Profile additions shared by all four concepts.
   - Amtrak employee pass details (NMA-20). Saving valid details turns on the Pass Rider Fare Finder (NMA-623);
     removing them turns it off. NMA-623 names the identifiers "SAP ID and Index number" while NMA-20 uses
     a 9-digit Pass number and a 3-digit Personal index number: the prototype follows NMA-20 (Q16).
   - My coupons (NMA-697): available coupons (soonest expiry first), used and expired coupons, details,
     adding a coupon, and Apply, which starts a booking with the code. Lounge passes are a separate user story and aren't part of this wallet. */

// ---------- Amtrak employee pass details (NMA-20) ----------
PFIELDS.employee = 'Employee pass'; // Figma 3430:140680
const EMP_REL = { employee: 'Employee', retiree: 'Retiree', spouse: 'Spouse of an employee', dependent: 'Dependent of an employee' };
const PASS_RE = /^[0-9]{9}$/, INDEX_RE = /^[0-9]{3}$/; // NMA-20 BR4 field rules
const empSummary = e => e ? `${EMP_REL[e.rel]} · Pass ${e.pass.slice(0, 3)}••••${e.pass.slice(-2)} · ${prCanStart(D()).ok ? 'Pass Rider booking on' : 'Pass Rider not available yet'}` : 'Not added';
// Status of the saved pass: what the pass record allows (NMA-1016, 1018) and, for dependents, the age rule (NMA-1017 AC4)
function empStatus(d) {
  const e = d.employee, p = d.passrider; if (!e || !p) return '';
  const can = prCanStart(d), rows = [['Pass Rider booking', can.ok ? 'On' : 'Not available']];
  if (p.role === 'employee') { rows.push(['Business Pass', p.business ? 'Active: Business or Leisure travel' : 'Not on your pass: Leisure travel only']); rows.push(['Remaining passes', `${p.compLeft} of 16 one-way passes`]); rows.push(['Renewal', `New passes are issued ${fmtExp(p.renews || PASS_RENEWS)}`]); }
  else rows.push(['Travel type', 'Leisure only']);
  if (p.role === 'dependent' && !can.ok) rows.push(['Booking on your own', can.text]);
  return `<div class="ads-summary emp-status" role="status"><p class="ads-summary__title">Saved pass</p><dl class="cpn-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
}
// Add or update only: there's no user-facing way to delete pass details (NMA-20 AC6, decision closed).
// The backend can remove them when the customer is no longer eligible (BR4 AC4): see the "pass removed" scenario.
EDITORS.employee = (r, ri, inline) => {
  const d = D(), cur = d.employee; ref('20');
  if (!r.u.d) r.u.d = { rel: cur ? cur.rel : 'employee', pass: cur ? cur.pass : '', index: cur ? cur.index : '' };
  const x = r.u.d, e = r.u.err || {}, idp = inline ? 'ie' : 'ee', primary = x.rel !== 'employee' && x.rel !== 'retiree';
  prov('NMA-623 identifies Pass Riders by SAP ID and Index number; NMA-20 by Pass number and Personal index number. The prototype uses NMA-20’s fields (Q16).');
  let body = `${intro('Employees, retirees, spouses and dependents can save pass details to book with Pass Rider benefits.')}${netAlert(r)}${empStatus(d)}`;
  body += fieldHtml({ id: `${idp}-rel`, f: 'rel', label: 'Relationship', value: x.rel, select: Object.entries(EMP_REL).map(([v, l]) => [v, l]), req: true });
  body += fieldHtml({ id: `${idp}-pass`, f: 'pass', label: primary ? 'Employee’s Pass number' : 'Pass number', value: x.pass, req: true, inputmode: 'numeric', digits: 9, max: 9, placeholder: '123456789', help: primary ? 'The primary pass holder’s number. Must be 9 digits.' : 'Must be 9 digits.', err: e.pass });
  body += fieldHtml({ id: `${idp}-index`, f: 'index', label: 'Personal index number', value: x.index, req: true, inputmode: 'numeric', digits: 3, max: 3, placeholder: '123', help: 'Must be 3 digits.', err: e.index });
  if (x.rel === 'dependent') body += `<p class="ads-helper">Dependents 16 or older can book Pass Rider travel on their own.</p>`;
  if (e.match) body += alertBox('error', 'We couldn’t match these pass details', e.match);
  const unchanged = cur ? (x.rel === cur.rel && x.pass === cur.pass && x.index === cur.index) : !x.pass && !x.index;
  tip('Employee pass: any 9-digit Pass number and 3-digit Index save. 999999999 shows the “doesn’t belong to you” error (NMA-20 BR4 AC3). Scenario › Pass Rider employee, pass removed shows details the backend removed (BR4 AC4).');
  return { body, unchanged: !!cur && unchanged, saveDisabled: unchanged, noSaveWhy: cur ? 'Make a change to save.' : 'Enter your pass details to save.', saveLabel: cur ? 'Save' : 'Add' };
};
SAVE.employee = (r, ri) => {
  const x = r.u.d, d = D(), e = {};
  if (!x.pass) e.pass = 'Enter your Pass number.'; else if (!PASS_RE.test(x.pass)) e.pass = 'Pass number not recognized. It has 9 numbers.';
  if (!x.index) e.index = 'Enter your Personal index number.'; else if (!INDEX_RE.test(x.index)) e.index = 'Personal index number not recognized. It has 3 numbers.';
  if (!e.pass && !e.index && x.pass === '999999999') e.match = 'These details don’t belong to your account, so they weren’t saved. Check them, or contact Employee Services.';
  r.u.err = e;
  if (Object.keys(e).length) { pendingFocus = e.pass ? '[data-f="pass"]' : e.index ? '[data-f="index"]' : '.ads-alert--error'; render(); return; }
  const added = !d.employee;
  runSave(r, () => {
    const b = d.booking, was = d.passrider;
    d.employee = { rel: x.rel, pass: x.pass, index: x.index }; d.empRemoved = false;
    // Business Pass, companion passes and renewal come from the pass record; newly added details start without them
    d.passrider = { role: x.rel, business: !!(was && was.business && x.rel === 'employee'), compLeft: was && x.rel === 'employee' ? was.compLeft : 0, renews: was ? was.renews : PASS_RENEWS, minor: !!(was && was.minor && x.rel === 'dependent'), people: was && was.role === x.rel && was.people ? was.people : prRoster((PR_FAMILY.find(p => p.first === d.profile.first) || PR_FAMILY[0]).id, x.rel) };
    b.prType = d.passrider.business ? b.prType : 'leisure';
    if (!was && prCanStart(d).ok) b.intent = 'pr'; // NMA-623 AC2: Pass Rider mode on by default
    if (b.intent === 'pr' && !prCanStart(d).ok) b.intent = 'standard';
  }, () => afterSave(ri, added ? 'Pass details added' : 'Pass details updated', 'employee'));
};

// ---------- My coupons (NMA-697) ----------
const couponState = c => c.uses && c.uses.length ? 'used' : c.exp < TODAY_S ? 'expired' : 'available';
const soon = c => couponState(c) === 'available' && c.exp <= addDays(TODAY_S, 30);
function couponCard(c) {
  const st = couponState(c), done = st !== 'available';
  const badge = st === 'used' ? '<span class="cpn__state cpn__state--used">Used</span>' : st === 'expired' ? '<span class="cpn__state cpn__state--expired">Expired</span>' : soon(c) ? '<span class="cpn__state cpn__state--soon">Expires soon</span>' : '';
  const apply = !done ? `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="coupon-apply" data-code="${c.code}">Apply</button>` : '';
  return `<li class="cpn${done ? ' cpn--done' : ''}"><div class="cpn__main"><span class="cpn__name">${esc(c.name || c.kind)} ${badge}</span><span class="cpn__benefit">${esc(c.benefit)}</span><span class="cpn__meta">${esc(c.kind)} · ${c.code} · ${st === 'expired' ? 'Expired' : 'Expires'} ${fmtShortY(c.exp)}</span></div><div class="cpn__acts">${apply}<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="info" data-topic="coupon:${c.code}" aria-label="Details for ${esc(c.name || c.kind)}">Details</button></div></li>`;
}
// Loading the list follows the toolbar network: online loads at once, slow shows loading, a server error offers
// Try again, offline shows the coupons saved on the device
function couponLoad(r) {
  if (r.u.load) return r.u.load;
  const net = V().net;
  r.u.load = net === 'slow' || net === 'slow6' ? 'loading' : net === 'error' ? 'error' : net === 'offline' ? 'cached' : 'ok';
  if (r.u.load === 'loading') setTimeout(() => { if (r.u.load === 'loading') { r.u.load = 'ok'; render(); } }, 1500);
  return r.u.load;
}
A['coupon-retry'] = (t, ri) => { const r = routeAt(ri); r.u.load = null; pendingFocus = 'title'; render(); };
// My coupons (Figma Sprint 4 node 3430:147004): chevron Back and title; the intro; a card to add a coupon or promotional
// code (info beside the label, clear inside the field, helper, Add); Available as one bordered list (name, code,
// expiry, benefit, info button for details); Used and expired in an accordion; Save in the action footer.
const fmtNum = s => { const [y, m, d] = s.split('-'); return `${m}/${d}/${y}`; };
function couponRow(c) {
  const st = couponState(c), name = c.name || c.kind;
  const exp = st === 'used' ? `Used · Expires: ${fmtNum(c.exp)}` : st === 'expired' ? `Expired: ${fmtNum(c.exp)}` : `Expires: ${fmtNum(c.exp)}`;
  return `<li class="cpl"><div class="cpl__lines"><span class="cpl__name">${esc(name)}</span><span class="cpl__code">Code: ${c.code}</span><span class="cpl__exp">${exp}</span><span class="cpl__benefit">${esc(c.benefit)}.</span></div><button class="ads-icon-btn ads-icon-btn--sm cpl__info" type="button" data-a="info" data-topic="coupon:${c.code}" aria-label="Details for ${esc(name)}">${ic('info-circle')}</button></li>`;
}
SCR.coupons = (r, ri) => {
  const d = D(); r.u.d = r.u.d || { add: '' }; const e = r.u.err || '', val = r.u.d.add || '';
  ref('697');
  const cur = TB.cpn !== 'future'; // Reviewer control › My coupons: Current state (Figma CP.1, F22) or Future state (F23)
  const shell = body => ({ title: 'My coupons', kind: 'push', backIcon: true, noClose: !cur, cls: 'pane--ed pane--cpn', banner: false, body, foot: busyBtn(r, 'Apply', 'Applying', 'data-a="coupons-save"'), footCls: 'ads-actionfooter', offlineText: 'You’re seeing your saved coupons. Adding a coupon needs a connection.' });
  const load = couponLoad(r);
  if (load === 'loading') return shell(`<div class="cpn-loading" role="status" aria-live="polite"><span class="ads-sr-only">Loading your coupons</span>${'<div class="cpn-skel" aria-hidden="true"><i></i><i></i><i></i></div>'.repeat(3)}</div>`);
  if (load === 'error') return shell(alertBox('error', 'We couldn’t load your coupons', 'Something went wrong on our side. Try again in a moment.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="coupon-retry">Try again</button>'));
  const avail = [...d.coupons].sort((x, y) => x.exp.localeCompare(y.exp));
  const past = [...(d.couponsPast || [])].sort((x, y) => y.exp.localeCompare(x.exp));
  const help = e ? `<p class="ads-helper ads-helper--error" id="cpn-in-h" role="alert">${ic('alert-diamond')}<span>${esc(e)}</span></p>` : `<p class="ads-helper" id="cpn-in-h">Coupon codes should be 14 characters long.</p>`;
  const add = `<section class="ed-card cpn-addcard" aria-label="Add a coupon"><div class="ads-field"><div class="apc-label"><label class="ads-field__label" for="cpn-in">Coupon or promotional code</label><button class="ads-icon-btn ads-icon-btn--xs apc-labelinfo" type="button" data-a="code-info" aria-label="About coupon and promotion codes">${ic('info-circle')}</button></div>
    <div class="ads-control${e ? ' ads-control--error' : ''}"><input id="cpn-in" type="text" data-f="add" data-nodirty value="${esc(val)}" placeholder="Apply code" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="cpn-in-h"${e ? ' aria-invalid="true"' : ''}>${val ? `<button class="ads-icon-btn ads-icon-btn--sm apc-clear" type="button" data-a="cpn-clear" aria-label="Clear code">${ic('close-circle')}</button>` : ''}</div>${help}</div>
    ${r.u.busy ? `<button class="ads-btn ads-btn--secondary ads-btn--sm ads-btn--block" type="button" aria-busy="true" disabled>${ic('spinner-static')}Adding</button>` : '<button class="ads-btn ads-btn--secondary ads-btn--sm ads-btn--block" type="button" data-a="coupon-add">Add</button>'}</section>`;
  const availH = avail.length ? `<ul class="cpl-list" aria-label="Available coupons">${avail.map(couponRow).join('')}</ul>` : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">You don’t have any coupons</p><p class="ads-body-small">Coupons you add here show up in this list.</p></div>`;
  const open = !!r.u.pastOpen;
  const pastH = `<div class="cpn-acc${open ? ' is-open' : ''}"><button class="cpn-acc__head" type="button" data-a="cpn-past" aria-expanded="${open}" aria-controls="cpn-past-panel" id="cpn-past-h"><span>Used and expired</span>${ic('chevron-down', 'cpn-acc__chev')}</button><div class="cpn-acc__panel" id="cpn-past-panel" role="region" aria-labelledby="cpn-past-h"${open ? '' : ' hidden'}>${past.length ? `<ul class="cpl-list" aria-label="Used and expired coupons">${past.map(couponRow).join('')}</ul>` : '<p class="ads-body-small ads-text-secondary">No used or expired coupons.</p>'}</div></div>`;
  tip('My coupons: add 60111122223333 (valid), EXP12345678901 (expired) or any other code (not found).');
  snote('Coupon reminders and added-coupon notices depend on a notification channel that isn’t decided; used and expired coupons are kept for a time that isn’t defined (Q17). Save keeps a code you typed (it’s added) and returns to Profile.');
  return shell(`${netAlert(r)}${cur ? '' : `<p class="cpn-intro">Coupons sent to you by email can be added here and used by anyone you share them with.</p>${add}`}<section class="cpn-avail" aria-labelledby="cpn-av"><h3 class="cpn-h" id="cpn-av">Available</h3>${availH}</section>${pastH}`);
};
A['cpn-past'] = (t, ri) => { const r = routeAt(ri); r.u.pastOpen = !r.u.pastOpen; pendingFocus = '#cpn-past-h'; render(); };
A['cpn-clear'] = (t, ri) => { const r = routeAt(ri); r.u.d.add = ''; r.u.err = ''; pendingFocus = '#cpn-in'; render(); };
// Save: a typed code is added first; then back to Profile
A['coupons-save'] = (t, ri) => {
  const r = routeAt(ri), inp = document.querySelector('#cpn-in'); if (inp) r.u.d.add = inp.value;
  const back = () => { popTo(+ri - 1); pendingFocus = '[data-k="row-coupons"]'; render(); };
  if (!(r.u.d.add || '').trim()) return back();
  A['coupon-add'](t, ri, back);
};
A['coupon-add'] = (t, ri, then) => {
  const r = routeAt(ri), inp = document.querySelector('#cpn-in'); if (inp) r.u.d.add = inp.value;
  const d = D(), c = (r.u.d.add || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{14}$/.test(c)) { r.u.err = 'This code isn’t valid. Coupon codes should be 14 characters long.'; pendingFocus = '#cpn-in'; render(); return; } // My coupons takes coupons only (14 characters)
  if (d.coupons.some(x => x.code === c)) { r.u.err = 'This coupon is already in your account.'; pendingFocus = '#cpn-in'; render(); return; }
  r.u.err = '';
  runNet(r, () => c === '60111122223333' ? { ok: true } : c.startsWith('EXP') ? { err: 'This coupon has expired, so it wasn’t added.' } : { err: 'We couldn’t find this coupon. Check the code and try again.' }, res => {
    if (res.err) { r.u.err = res.err; pendingFocus = '#cpn-in'; render(); return; } // NMA-697 BR8 AC3
    d.coupons.push({ code: c, kind: 'Coupon code', name: 'Added coupon', benefit: '$15 off one trip', issued: TODAY_S, exp: addDays(TODAY_S, 120) });
    r.u.d.add = ''; pendingFocus = `[data-a="info"][data-topic="coupon:${c}"]`; toast('Coupon added to your account'); // BR8 AC4
    if (then) then();
  }, { what: 'add a coupon' });
};
// Apply: start a booking with this code (standard booking, paying cash)
A['coupon-apply'] = t => {
  const d = D(), c = d.coupons.find(x => x.code === t.dataset.code); if (!c) return;
  const b = d.booking; b.code = clone(c); b.codeText = c.code; b.codeSrc = 'saved'; b.codeErr = ''; b.pay = 'cash'; if (b.intent === 'corporate' || b.intent === 'pr') { b.intent = 'personal'; b.modeNote = 'Coupons are for Personal bookings, so this booking is Personal.'; }
  nav().sheet = null; openSheet('booking', ['ff'], '[data-a="open-booking"]'); toast(`${c.name || c.kind} added to your booking. It’s checked when you find trains.`);
};
// Coupon details as supporting information: details for available coupons, uses for used ones (BR4 AC2, AC3)
function couponInfo(code) {
  const d = D(), c = [...d.coupons, ...(d.couponsPast || [])].find(x => x.code === code); if (!c) return { title: 'Coupon', body: () => '<p>This coupon isn’t in your account any more.</p>' };
  const st = couponState(c);
  return { title: c.name || c.kind, body: () => `<dl class="cpn-dl"><dt>Benefit</dt><dd>${esc(c.benefit)}</dd><dt>Type</dt><dd>${esc(c.kind)}</dd><dt>Code</dt><dd>${c.code}</dd><dt>Issued</dt><dd>${fmtDate(c.issued)}</dd><dt>${st === 'expired' ? 'Expired' : 'Expires'}</dt><dd>${fmtDate(c.exp)}</dd><dt>Status</dt><dd>${st === 'used' ? 'Used' : st === 'expired' ? 'Expired' : 'Available'}</dd></dl>${st === 'used' ? `<h3 class="ads-h5">Uses</h3><ul class="cpn-uses">${[...c.uses].sort((x, y) => y.date.localeCompare(x.date)).map(u => `<li>Reservation ${u.pnr} · ${fmtDate(u.date)}</li>`).join('')}</ul>` : ''}<p class="info-draft">Eligibility and restrictions come with each coupon and are checked when you find trains. ${c.companion ? 'A companion coupon needs at least two travelers.' : ''}</p>` };
}
