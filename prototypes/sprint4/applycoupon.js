/* Sprint 4 prototype: "Apply code" (New booking › Coupon or promotional code), matched to Figma Sprint 4 node 3346:47066.
   - Header: icon-only Back (chevron) and the title; Back returns to Fare Finder with the booking unchanged. No X.
   - "Coupon or promotional code" field with the codes information beside the label, a clear button inside the field
     and "Codes should be 4 or 14 characters long."
   - "Your coupons": one bordered list of the account's active, unused codes (no upgrade coupons, which are used from
     Profile and Modify). Choosing a row puts its code in the field; the row's info button opens its details.
   - "Apply" puts the field's code on the booking and returns to Fare Finder. Choosing another code simply
     replaces the one in the field: no confirmation. Rules reused: the format check (CODE_FORMAT, 4 or 14 characters);
     used and expired codes are refused; a typed code stays with this booking only (not saved to the account); every
     code is checked against the trip when you find trains. Loading and error follow the toolbar Network setting. */

const isUpgradeCoupon = c => /upgrade/i.test(`${c.kind} ${c.name || ''}`);
// The account's codes this booking can use: active, unused, no upgrade coupons. Trip eligibility is checked at Find trains.
const bookingCodes = () => savedCodes().filter(c => couponState(c) === 'available' && !isUpgradeCoupon(c));
const codeLabel = c => c.name || c.kind;
function apcRow(c, cur) {
  const sel = cur === c.code;
  return `<li class="apc-row${sel ? ' is-selected' : ''}"><button class="apc-pick" type="button" data-a="apc-pick" data-code="${c.code}" aria-pressed="${sel}"><span class="apc-name">${esc(codeLabel(c))}</span><span class="apc-code">Code: ${c.code}</span><span class="apc-line">Expires: ${fmtNumDate(c.exp)}</span><span class="apc-benefit">${esc(c.benefit)}</span></button>
    <button class="ads-icon-btn ads-icon-btn--sm apc-info" type="button" data-a="apc-details" data-code="${c.code}" aria-label="Details for ${esc(codeLabel(c))}">${ic('info-circle')}</button></li>`;
}
SCR.dcode = (r, ri) => {
  const d = D(), b = d.booking; r.u.d = r.u.d || { add: b.codeText || '' };
  ref('613'); if (d.coupons.length) ref('697');
  const e = r.u.err || '', val = r.u.d.add || '', applied = b.codeText && val === b.codeText;
  const st = codeStateOf(b), bad = applied && ['invalid', 'ineligible', 'error'].includes(st);
  const help = e ? `<p class="ads-helper ads-helper--error" id="apc-in-h" tabindex="-1">${ic('alert-diamond')}<span>${esc(e)}</span></p>`
    : bad ? `<p class="ads-helper ads-helper--error" id="apc-in-h">${ic('alert-diamond')}<span>${esc(b.codeErr)}</span></p>`
    : `<p class="ads-helper" id="apc-in-h">Codes should be 4 or 14 characters long.</p>`;
  const field = `<div class="ads-field apc-field"><div class="apc-label"><label class="ads-field__label" for="apc-in">Coupon or promotional code</label><button class="ads-icon-btn ads-icon-btn--xs apc-labelinfo" type="button" data-a="code-info" aria-label="About coupon and promotion codes">${ic('info-circle')}</button></div>
    <div class="ads-control${e || bad ? ' ads-control--error' : ''}"><input id="apc-in" type="text" data-f="add" data-nodirty data-hook="apcin" value="${esc(val)}" placeholder="Apply code" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="apc-in-h"${e || bad ? ' aria-invalid="true"' : ''}>${val ? `<button class="ads-icon-btn ads-icon-btn--sm apc-clear" type="button" data-a="apc-clear" aria-label="Clear code">${ic('close-circle')}</button>` : ''}</div>${help}</div>`;
  const load = couponLoad(r);
  let list;
  if (load === 'loading') list = `<div class="cpn-loading" role="status" aria-live="polite"><span class="ads-sr-only">Loading your coupons</span>${'<div class="cpn-skel" aria-hidden="true"><i></i><i></i><i></i></div>'.repeat(3)}</div>`;
  else if (load === 'error') list = alertBox('error', 'We couldn’t load your coupons', 'Something went wrong on our side. Try again in a moment. You can still enter a code above.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="coupon-retry">Try again</button>');
  else {
    const codes = bookingCodes();
    list = codes.length ? `<ul class="apc-list" aria-label="Your coupons">${codes.map(c => apcRow(c, (val || '').toUpperCase())).join('')}</ul>`
      : `<div class="ads-summary ads-summary--empty"><p class="ads-summary__title">You don’t have any coupons</p><p class="ads-body-small">${d.signedIn ? 'Coupons saved to your account show up here. You can still enter a code above.' : 'Sign in to see coupons saved to your account. You can still enter a code above.'}</p></div>`;
  }
  tip('Choose a coupon or type a code, then Apply. 3 characters shows the format error; 60123456789012 has been used; 60555544443333 has expired.');
  const body = `${netAlert(r)}${field}<section class="apc-yours" aria-labelledby="apc-yours-h"><h3 class="apc-h" id="apc-yours-h">Your coupons</h3>${list}</section>`;
  return { title: 'Apply code', kind: 'push', backIcon: true, noGrabber: true, cls: 'pane--apc', body, foot: '<button class="ads-btn ads-btn--block" type="button" data-a="apc-save">Apply</button>', footCls: 'ads-actionfooter', offlineText: 'You can enter a code. Your saved coupons need a connection to refresh.' };
};
HOOKS.apcin = (r, t) => { r.u.d.add = t.value; r.u.err = ''; };
// Choosing a coupon puts its code in the field (replacing whatever was there, without asking)
A['apc-pick'] = (t, ri) => { const r = routeAt(ri); r.u.d.add = t.dataset.code; r.u.err = ''; pendingFocus = `[data-a="apc-pick"][data-code="${t.dataset.code}"]`; render(); };
A['apc-clear'] = (t, ri) => { const r = routeAt(ri); r.u.d.add = ''; r.u.err = ''; pendingFocus = '#apc-in'; render(); };
// Apply: the format check and the used/expired check, then the code goes on the booking (checked at Find trains)
A['apc-save'] = (t, ri) => {
  const r = routeAt(ri), d = D(), b = d.booking, inp = document.querySelector('#apc-in');
  if (inp) r.u.d.add = inp.value;
  const c = (r.u.d.add || '').trim().toUpperCase(); r.u.d.add = c;
  const fail = msg => { r.u.err = msg; pendingFocus = '#apc-in'; render(); };
  if (!c) { if (b.codeText) A['code-remove'](); popTo(+ri - 1); pendingFocus = '#ff-coderow'; return; }
  if (!CODE_FORMAT.test(c)) return fail('This code isn’t valid. Check it and try again.');
  const past = (d.couponsPast || []).find(x => x.code === c);
  if (past) return fail(couponState(past) === 'used' ? 'This coupon has already been used.' : 'This coupon has expired.');
  const saved = bookingCodes().find(x => x.code === c);
  if (c !== b.codeText) Object.assign(b, { codeText: c, code: saved ? clone(saved) : null, codeState: '', codeErr: '', codeSrc: saved ? 'saved' : 'manual' });
  r.u.err = ''; popTo(+ri - 1); pendingFocus = '#ff-coderow';
};
A['apc-details'] = (t, ri) => { const r = routeAt(ri), inp = document.querySelector('#apc-in'); if (inp && r) r.u.d.add = inp.value; push('apc-detail', { code: t.dataset.code }, +ri); };
// Details: the coupon's full details (as in My coupons)
SCR['apc-detail'] = (r, ri) => { const info = couponInfo(r.p.code); return { title: 'Details', kind: 'push', body: `<div class="apc-detail"><h3 class="ads-h4">${esc(info.title)}</h3>${info.body()}</div>` }; };
// The information beside "Add a coupon or promotion code": the established codes copy, plus where codes are kept
INFO.codes.body = (base => () => base() + '<p>Coupons saved to your account are in Account › My coupons, and they’re listed here.</p>')(INFO.codes.body);
