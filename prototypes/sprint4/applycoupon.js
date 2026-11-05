/* Sprint 4 prototype: "Apply coupon" (New booking › Coupon or promotional code). One page, styled like My coupons:
   - "Add a coupon or promotion code" directly under the header, with the codes information beside it, one labeled
     field and Add. Adding puts a code in the list; Apply puts it on this booking (the existing distinction).
   - Available coupons and promotion codes as stacked cards: name, benefit, type, code, expiry, Apply and Details.
     Only active, unused codes allowed in a booking are listed; upgrade coupons are left out (they're used from
     Profile and Modify, not from Fare Finder). The applied code is marked.
   - Rules reused, not new: the format check (4-character promotion code or 14-character coupon code, CODE_FORMAT);
     coupons added to the account through the existing My coupons lookup; typed promotion codes stay with this
     booking only and aren't saved to the account; every code is checked against the trip when you find trains.
   - Back returns to Fare Finder with the booking unchanged. Details opens a secondary view; Back restores this page's
     scroll position and the code being typed. Loading and error follow the toolbar Network setting (as My coupons). */

const isUpgradeCoupon = c => /upgrade/i.test(`${c.kind} ${c.name || ''}`);
// Codes this booking can use: the account's active, unused codes (no upgrade coupons), then promotion codes typed
// for this booking. Trip eligibility is still checked when you find trains.
function bookingCodes(b) {
  const acct = savedCodes().filter(c => couponState(c) === 'available' && !isUpgradeCoupon(c));
  const local = (b.addedCodes || []).filter(c => !acct.some(a => a.code === c.code));
  return [...acct, ...local];
}
const codeLabel = c => c.name || c.kind;
function applyCard(c, b) {
  const applied = b.codeText === c.code, local = !!c.local, bad = applied && ['invalid', 'ineligible', 'error'].includes(codeStateOf(b));
  const state = applied ? `<span class="ads-badge ads-badge--info apc-applied">${ic('check-circle', 'ads-icon--sm')}Applied</span>` : '';
  const note = applied ? (bad ? `<p class="ads-helper ads-helper--error apc-note">${ic('alert-diamond')}<span>${esc(b.codeErr)}</span></p>`
      : codeStateOf(b) === 'applied' ? `<p class="ads-helper ads-helper--success apc-note">${ic('check-circle', 'ads-icon--sm')}<span>Checked for this trip${b.code && b.code.benefit ? `: ${esc(b.code.benefit)}` : ''}</span></p>`
      : '<p class="ads-helper apc-note">We’ll check it against your trip when you find trains.</p>') : '';
  const meta = local ? `${esc(c.kind)} · ${c.code} · Added for this booking` : `${esc(c.kind)} · ${c.code} · Expires ${fmtWeekday(c.exp).slice(0, 3)}, ${fmtExp(c.exp)}`;
  const act = applied ? `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="apc-remove" data-code="${c.code}">Remove<span class="ads-sr-only"> ${esc(codeLabel(c))} from this booking</span></button>`
    : `<button class="ads-btn ads-btn--secondary ads-btn--sm apc-apply" type="button" data-a="apc-apply" data-code="${c.code}">Apply<span class="ads-sr-only"> ${esc(codeLabel(c))}</span></button>`;
  return `<li class="cpn apc-card${applied ? ' is-applied' : ''}" data-code="${c.code}"><div class="cpn__main"><span class="cpn__name">${esc(codeLabel(c))} ${state}</span><span class="cpn__benefit">${esc(c.benefit || 'Benefit shown after it’s checked when you find trains')}</span><span class="cpn__meta">${meta}</span>${note}</div>
    <div class="cpn__acts">${act}<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="apc-details" data-code="${c.code}">Details<span class="ads-sr-only"> for ${esc(codeLabel(c))}</span></button></div></li>`;
}
SCR.dcode = (r, ri) => {
  const d = D(), b = d.booking; r.u.d = r.u.d || { add: '' };
  ref('613'); if (d.coupons.length) ref('697');
  const e = r.u.err || '', busy = r.u.busy && r.u.busyWhat === 'add';
  const add = `<section class="apc-add" aria-labelledby="apc-add-h"><div class="apc-head"><h3 class="ads-h5 apc-h" id="apc-add-h">Add a coupon or promotion code</h3><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="code-info" aria-label="About coupon and promotion codes">${ic('info-circle', 'ads-icon--sm')}</button></div>
    <div class="ads-field"><label class="ads-field__label" for="apc-in">Code</label><div class="apc-row"><div class="ads-control${e ? ' ads-control--error' : ''}"><input id="apc-in" type="text" data-f="add" data-nodirty value="${esc(r.u.d.add)}" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="apc-in-h"${e ? ' aria-invalid="true"' : ''}${busy ? ' readonly' : ''}></div>
    ${busy ? `<button class="ads-btn ads-btn--secondary" type="button" aria-busy="true" disabled>${ic('spinner-static', 'ads-icon--sm')}Adding</button>` : '<button class="ads-btn ads-btn--secondary" type="button" data-a="apc-add">Add</button>'}</div>
    ${e ? `<p class="ads-helper ads-helper--error" id="apc-in-h" tabindex="-1">${ic('alert-diamond')}<span>${esc(e)}</span></p>` : '<p class="ads-helper" id="apc-in-h">A promotion code has 4 letters or numbers. A coupon code has 14.</p>'}</div></section>`;
  const load = couponLoad(r);
  let list;
  if (load === 'loading') list = `<div class="cpn-loading" role="status" aria-live="polite"><span class="ads-sr-only">Loading your coupons</span>${'<div class="cpn-skel" aria-hidden="true"><i></i><i></i><i></i></div>'.repeat(3)}</div>`;
  else if (load === 'error') list = alertBox('error', 'We couldn’t load your coupons', 'Something went wrong on our side. Try again in a moment.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="coupon-retry">Try again</button>');
  else {
    const codes = bookingCodes(b);
    list = codes.length ? `<ul class="cpn-list" aria-label="Available coupons and promotion codes">${codes.map(c => applyCard(c, b)).join('')}</ul>`
      : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">You don’t have any coupons</p><p class="ads-body-small">${d.signedIn ? 'Coupons you get, or add here, show up in this list.' : 'Add a coupon or promotion code above. Sign in to see coupons saved to your account.'}</p></div>`;
  }
  tip('Add: V123-style 4-character promotion codes stay with this booking; 60111122223333 adds a coupon to your account; EXP12345678901 is expired; 60123456789012 has been used; 3 characters is the format error.');
  const body = `${netAlert(r)}${add}<section class="apc-avail" aria-labelledby="apc-av-h"><h3 class="ads-h5 apc-h" id="apc-av-h">Available</h3><div id="apc-live" class="ads-sr-only" role="status">${r.u.live || ''}</div>${list}</section>`;
  return { title: 'Apply coupon', kind: 'push', cls: 'pane--apc', body, offlineText: 'You’re seeing your saved coupons. Adding a coupon needs a connection.' };
};

// Add: the format check, then the existing coupon lookup for 14-character codes (signed in), or this booking's list
// for promotion codes. The entered value stays in the field for correction.
A['apc-add'] = (t, ri) => {
  const r = routeAt(ri), d = D(), b = d.booking, inp = document.querySelector('#apc-in');
  if (inp) r.u.d.add = inp.value;
  const c = (r.u.d.add || '').trim().toUpperCase(); r.u.d.add = c;
  const fail = msg => { r.u.err = msg; pendingFocus = '#apc-in'; render(); };
  if (!c) return fail('Enter a coupon or promotion code.');
  if (!CODE_FORMAT.test(c)) return fail('This code isn’t valid. Check it and try again.');
  const past = (d.couponsPast || []).find(x => x.code === c);
  if (past) return fail(couponState(past) === 'used' ? 'This coupon has already been used.' : 'This coupon has expired, so it can’t be added.');
  if (bookingCodes(b).some(x => x.code === c) || d.coupons.some(x => x.code === c)) return fail(d.coupons.some(x => x.code === c) ? 'This coupon is already in your account.' : 'This code is already in your list.');
  r.u.err = '';
  const done = (code, msg) => { r.u.d.add = ''; r.u.live = msg; pendingFocus = `[data-a="apc-apply"][data-code="${code}"]`; toast(msg); };
  if (c.length === 14 && d.signedIn) {
    r.u.busyWhat = 'add';
    return runNet(r, () => c === '60111122223333' ? { ok: true } : c.startsWith('EXP') ? { err: 'This coupon has expired, so it wasn’t added.' } : { err: 'We couldn’t find this coupon. Check the code and try again.' }, res => {
      r.u.busyWhat = null;
      if (res.err) return fail(res.err);
      d.coupons.push({ code: c, kind: 'Dollar-off coupon', name: 'Added coupon', benefit: '$15 off one trip', issued: TODAY_S, exp: addDays(TODAY_S, 120) }); // the existing My coupons sample
      done(c, 'Coupon added to your account. Apply it to use it on this booking.');
    }, { what: 'add a coupon' });
  }
  // Promotion codes (and coupons for guests) stay with this booking; they're checked when you find trains
  b.addedCodes = (b.addedCodes || []).concat({ code: c, kind: c.length === 4 ? 'Promotion code' : 'Coupon code', local: true });
  done(c, `Code ${c} added. Apply it to use it on this booking.`);
};

// Apply puts the code on this booking. A booking holds one code (the booking's code field), so applying another
// replaces it, after saying which replaces which.
A['apc-apply'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = bookingCodes(b).find(x => x.code === t.dataset.code); if (!c) return;
  const go = () => {
    Object.assign(b, { codeText: c.code, code: c.local ? null : clone(c), codeState: '', codeErr: '', codeSrc: c.local ? 'manual' : 'saved' });
    r.u.live = `${codeLabel(c)} applied. It’s checked against your trip when you find trains.`;
    pendingFocus = `[data-a="apc-remove"][data-code="${c.code}"]`; toast(`${codeLabel(c)} applied`);
  };
  if (b.codeText && b.codeText !== c.code) {
    const cur = bookingCodes(b).find(x => x.code === b.codeText);
    return dialog({ title: 'Replace your code?', returnFocus: `[data-a="apc-apply"][data-code="${c.code}"]`,
      body: `${esc(codeLabel(c))} (${c.code}) will replace ${cur ? `${esc(codeLabel(cur))} (${cur.code})` : `the code ${esc(b.codeText)}`} on this booking.`,
      actions: [['Replace code', 'primary', go], ['Keep current code', 'secondary', null]] });
  }
  go();
};
A['apc-remove'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, c = b.codeText;
  Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '', codeTries: 0, codeDraft: '', codeSrc: '' });
  const mine = D().coupons.some(x => x.code === c), msg = mine ? 'Code removed from this booking. It’s still in My coupons.' : `Code ${c} removed from this booking`; // as before: the account's coupons are never changed here
  r.u.live = msg; pendingFocus = `[data-a="apc-apply"][data-code="${c}"]`; toast(msg, 'info');
};
A['apc-details'] = (t, ri) => { const r = routeAt(ri), inp = document.querySelector('#apc-in'); if (inp && r) r.u.d.add = inp.value; push('apc-detail', { code: t.dataset.code }, +ri); };
// Details: the full terms (the My coupons details), or what's known about a code added for this booking
SCR['apc-detail'] = (r, ri) => {
  const b = D().booking, local = (b.addedCodes || []).find(x => x.code === r.p.code);
  if (local) return { title: 'Details', kind: 'push', body: `<div class="apc-detail"><h3 class="ads-h4">${esc(local.kind)} ${local.code}</h3><dl class="cpn-dl"><dt>Type</dt><dd>${esc(local.kind)}</dd><dt>Code</dt><dd>${local.code}</dd><dt>Saved</dt><dd>For this booking only. It isn’t saved to your account.</dd></dl><p class="ads-body-small">Its benefit, expiry and terms come from the code itself. We check it against your train, dates and travelers when you find trains.</p></div>` };
  const info = couponInfo(r.p.code);
  return { title: 'Details', kind: 'push', body: `<div class="apc-detail"><h3 class="ads-h4">${esc(info.title)}</h3>${info.body()}</div>` };
};
// The information beside "Add a coupon or promotion code": the established codes copy, plus where codes are kept
INFO.codes.body = (base => () => base() + '<p>Coupons saved to your account are in Account › My coupons, and they’re listed here.</p>')(INFO.codes.body);
// Clearing the typed promotion codes with the booking's other typed code when a booking is abandoned
const clearManualBase = clearManualCode;
clearManualCode = b => { clearManualBase(b); b.addedCodes = []; };
