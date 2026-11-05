/* Sprint 4 prototype: Profile additions shared by all four concepts.
   - Amtrak employee pass details (NMA-20). Saving valid details turns on the Pass Rider Fare Finder (NMA-623);
     removing them turns it off. NMA-623 names the identifiers "SAP ID and Index number" while NMA-20 uses
     a 9-digit Pass number and a 3-digit Personal index number: the prototype follows NMA-20 (Q16).
   - My coupons (NMA-697): available coupons (soonest expiry first), used and expired coupons, details,
     adding a coupon, and Apply, which starts a booking with the code. Lounge passes are a separate user story and aren't part of this wallet. */

// ---------- Amtrak employee pass details (NMA-20) ----------
PFIELDS.employee = 'Amtrak employee pass';
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
  body += fieldHtml({ id: `${idp}-pass`, f: 'pass', label: primary ? 'Employee’s Pass number' : 'Pass number', value: x.pass, req: true, inputmode: 'numeric', digits: 9, max: 9, help: primary ? 'The primary pass holder’s 9-digit number.' : '9 digits.', err: e.pass, cls: 'field--mid' });
  body += fieldHtml({ id: `${idp}-index`, f: 'index', label: 'Personal index number', value: x.index, req: true, inputmode: 'numeric', digits: 3, max: 3, help: '3 digits.', err: e.index, cls: 'field--short' });
  if (x.rel === 'dependent') body += `<p class="ads-helper">Dependents 16 or older can book Pass Rider travel on their own.</p>`;
  if (e.match) body += alertBox('error', 'We couldn’t match these pass details', e.match);
  const unchanged = cur ? (x.rel === cur.rel && x.pass === cur.pass && x.index === cur.index) : !x.pass && !x.index;
  tip('Employee pass: any 9-digit Pass number and 3-digit Index save. 999999999 shows the “doesn’t belong to you” error (NMA-20 BR4 AC3). Scenario › Pass Rider employee, pass removed shows details the backend removed (BR4 AC4).');
  return { body, saveDisabled: unchanged, noSaveWhy: cur ? 'Make a change to save.' : 'Enter your pass details to save.', saveLabel: cur ? 'Save' : 'Add' };
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
    d.passrider = { role: x.rel, business: !!(was && was.business && x.rel === 'employee'), compLeft: was && x.rel === 'employee' ? was.compLeft : 0, renews: was ? was.renews : PASS_RENEWS, minor: !!(was && was.minor && x.rel === 'dependent') };
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
SCR.coupons = (r, ri) => {
  const d = D(); r.u.d = r.u.d || { add: '' }; const e = r.u.err || '';
  ref('697');
  const load = couponLoad(r);
  if (load === 'loading') return { title: 'My coupons', kind: 'push', banner: false, body: `<div class="cpn-loading" role="status" aria-live="polite"><span class="ads-sr-only">Loading your coupons</span>${'<div class="cpn-skel" aria-hidden="true"><i></i><i></i><i></i></div>'.repeat(3)}</div>` };
  if (load === 'error') return { title: 'My coupons', kind: 'push', banner: false, body: alertBox('error', 'We couldn’t load your coupons', 'Something went wrong on our side. Try again in a moment.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="coupon-retry">Try again</button>') };
  const avail = [...d.coupons].sort((x, y) => x.exp.localeCompare(y.exp));
  const past = [...(d.couponsPast || [])].sort((x, y) => y.exp.localeCompare(x.exp));
  const add = `<section class="cpn-add" aria-labelledby="cpn-add-h"><h3 class="ads-h5" id="cpn-add-h">Add a coupon</h3><div class="ffc-codeentry"><div class="ads-control ads-control--pill${e ? ' ads-control--error' : ''}"><label class="ads-sr-only" for="cpn-in">Coupon code</label><input id="cpn-in" data-f="add" data-nodirty value="${esc(r.u.d.add)}" maxlength="14" autocomplete="off" placeholder="14-character coupon code" ${e ? 'aria-invalid="true" aria-describedby="cpn-err"' : ''}></div>${r.u.busy ? `<button class="ads-btn ads-btn--secondary" type="button" aria-busy="true" disabled>${ic('spinner-static')}Adding</button>` : '<button class="ads-btn ads-btn--secondary" type="button" data-a="coupon-add">Add</button>'}</div>${e ? `<p class="ads-helper ads-helper--error" id="cpn-err" role="alert">${ic('alert-diamond')}<span>${esc(e)}</span></p>` : '<p class="ads-helper">Coupons sent to you by email can be added here and used by anyone you share them with.</p>'}</section>`;
  const availH = avail.length ? `<ul class="cpn-list" aria-label="Available coupons">${avail.map(couponCard).join('')}</ul>` : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">You don’t have any coupons</p><p class="ads-body-small">Coupons you get, or add here, show up in this list.</p></div>`;
  const pastH = past.length ? `<ul class="cpn-list" aria-label="Used and expired coupons">${past.map(couponCard).join('')}</ul><p class="ss-note">Used and expired coupons stay here for a limited time. ${q(17)}</p>` : '<p class="ss-note">No used or expired coupons.</p>';
  tip('My coupons: add 60111122223333 (valid), EXP12345678901 (expired) or any other 14 characters (not found).');
  const body = `${netAlert(r)}<section aria-labelledby="cpn-av"><h3 class="ads-h5" id="cpn-av">Available</h3>${availH}<p class="ss-note">Reminders before a coupon expires, and notices when one is added, depend on a notification channel that isn’t decided. ${q(17)}</p></section>${add}<section aria-labelledby="cpn-past"><h3 class="ads-h5" id="cpn-past">Used and expired</h3>${pastH}</section>`;
  return { title: 'My coupons', kind: 'push', body, offlineText: 'You’re seeing your saved coupons. Adding a coupon needs a connection.' };
};
A['coupon-add'] = (t, ri) => {
  const r = routeAt(ri), d = D(), c = (r.u.d.add || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{14}$/.test(c)) { r.u.err = 'Enter the 14-character coupon code.'; pendingFocus = '#cpn-in'; render(); return; }
  if (d.coupons.some(x => x.code === c)) { r.u.err = 'This coupon is already in your account.'; pendingFocus = '#cpn-in'; render(); return; }
  r.u.err = '';
  runNet(r, () => c === '60111122223333' ? { ok: true } : c.startsWith('EXP') ? { err: 'This coupon has expired, so it wasn’t added.' } : { err: 'We couldn’t find this coupon. Check the code and try again.' }, res => {
    if (res.err) { r.u.err = res.err; pendingFocus = '#cpn-in'; render(); return; } // NMA-697 BR8 AC3
    d.coupons.push({ code: c, kind: 'Dollar-off coupon', name: 'Added coupon', benefit: '$15 off one trip', issued: TODAY_S, exp: addDays(TODAY_S, 120) });
    r.u.d.add = ''; pendingFocus = `[data-a="coupon-apply"][data-code="${c}"]`; toast('Coupon added to your account'); // BR8 AC4
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
