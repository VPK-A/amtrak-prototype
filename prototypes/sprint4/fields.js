/* Sprint 4 prototype: Fare Finder fields shared by Concepts 1 and 3.
   - Discount code (NMA-613): an always-visible optional field for monetary searches, after the traveler
     summary and before Find trains (placement proposed, Q21). Guests and members type a code; members with
     saved codes can also pick one from a pop-up, soonest expiry first. States: entered, checking, applied,
     invalid format, not eligible, couldn't check (service error), and trip changed (checked again). It is
     hidden for points searches and not used for TripLink Corporate or Pass Rider travel.
   - "Traveler with disability or need help?" (NMA-973): the Fare Finder check, its explanation and a
     Continue action. Continue opens Traveler selection, where each traveler answers their own assistance
     questions (NMA-615 AC1). This mapping is proposed (Q7). While the box is checked, every traveler needs
     an answer before Find trains (NMA-615 BR1.2).
   Validation responses are simulated (Scenario › Network, and the test codes in the notes). */

// ---------- Discount code ----------
// What the code depends on: changing any of these means the code is checked again (NMA-613 scenario 16)
const codeSig = b => JSON.stringify([b.from, b.to, b.trip, b.dep, b.ret, b.pax, intentOf(b)]);
const codeStateOf = b => b.codeState === 'applied' && b.codeSig !== codeSig(b) ? 'changed' : (b.codeState || '');
const savedCodes = () => D().signedIn ? [...D().coupons.filter(c => !c.lounge)].sort((x, y) => x.exp.localeCompare(y.exp)) : [];
function setCodeText(b, v) {
  v = (v || '').trim().toUpperCase();
  if (v === (b.codeText || '')) return;
  const known = savedCodes().find(c => c.code === v);
  Object.assign(b, { codeText: v, code: known ? clone(known) : null, codeState: '', codeErr: '' });
}
function codeField(r, b) {
  if (!['standard', 'personal'].includes(intentOf(b)) || b.pay === 'points') return ''; // not shown for points (NMA-613 scenario 1)
  ref('613'); q(21); q(23);
  const st = codeStateOf(b), saved = savedCodes(), text = b.codeText || '';
  const busy = r.u.busy && r.u.busyWhat !== 'assist' && text;
  const bad = !busy && ['invalid', 'ineligible', 'error'].includes(st);
  const btn = (a, label, kind = 'tertiary', aria = '') => `<button class="ads-btn ads-btn--${kind} ads-btn--sm" type="button" data-a="${a}"${aria ? ` aria-label="${aria}"` : ''}>${label}</button>`;
  let msg = '';
  if (busy) msg = `<p class="ads-helper dcode__msg" id="ff-code-h" role="status">${ic('spinner-static', 'ads-icon--sm')}<span>Checking your code</span></p>`;
  else if (bad) msg = `<p class="ads-helper ads-helper--error dcode__msg" id="ff-code-h" tabindex="-1">${ic('alert-diamond')}<span>${esc(b.codeErr)}</span></p>${st === 'error' ? `<div class="dcode__acts">${btn('code-retry', 'Try again', 'secondary')}</div>` : st === 'ineligible' ? `<div class="dcode__acts">${btn('code-skip', 'Find trains without this code', 'secondary')}</div>` : ''}`;
  else if (st === 'applied') msg = `<p class="ads-helper ads-helper--success dcode__msg" id="ff-code-h">${ic('check-circle', 'ads-icon--sm')}<span>Code applied${b.code && b.code.benefit ? `: ${esc(b.code.benefit)}` : ''}</span></p>`;
  else if (st === 'changed') msg = `<p class="ads-helper dcode__msg" id="ff-code-h">${ic('info-circle', 'ads-icon--sm')}<span>Your trip changed, so this code will be checked again when you find trains.</span></p>`;
  else if (b.code && b.code.benefit) msg = `<p class="ads-helper dcode__msg" id="ff-code-h">${esc(b.code.kind)}: ${esc(b.code.benefit)}. Expires ${fmtExp(b.code.exp)}.</p>`;
  const input = `<div class="ads-control${bad ? ' ads-control--error' : ''}">${ic('payment-voucher')}<input id="ff-code" type="text" data-f="code" data-nodirty data-hook="ffcode" value="${esc(text)}" placeholder="Enter discount code" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false"${bad ? ' aria-invalid="true"' : ''}${msg ? ' aria-describedby="ff-code-h"' : ''}${busy ? ' readonly' : ''}></div>`;
  const remove = text ? btn('code-remove', 'Remove', 'tertiary', `Remove discount code ${esc(text)}`) : '';
  const pick = saved.length ? `<button class="ads-link ads-link--sm linkbtn dcode__saved" type="button" data-a="code-saved">Use a saved code (${saved.length})</button>` : '';
  return `<div class="ads-field dcode" id="dcode"><div class="dcode__head"><label class="ads-field__label" for="ff-code">Discount code <span class="ads-field__marker ads-field__marker--optional">Optional</span></label><button class="ads-icon-btn ads-icon-btn--sm dcode__info" type="button" data-a="code-info" aria-label="About discount codes">${ic('info-circle', 'ads-icon--sm')}</button></div><div class="dcode__row">${input}${remove}</div>${msg}${pick}</div>`;
}
INFO['saved-codes'] = {
  title: 'Your saved codes',
  body: () => `<p>Choose a code from your profile, soonest to expire first. Expired and used codes aren’t shown.</p><ul class="ffc-codelist">${savedCodes().map(c => `<li><button class="ffc-code" type="button" data-a="dcode-pick" data-code="${c.code}"><span class="ffc-code__kind">${esc(c.kind)}</span><span class="ffc-code__benefit">${esc(c.benefit)}</span><span class="ffc-code__meta">${esc(c.code)} · Expires ${fmtExp(c.exp)}</span></button></li>`).join('')}</ul><p>Whether a code works for your train is checked when you find trains.</p><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="dcode-manual">Enter a different code</button>`
};
HOOKS.ffcode = (r, t) => setCodeText(D().booking, t.value);
A['code-saved'] = () => openInfo('saved-codes', '[data-a="code-saved"]');
A['dcode-pick'] = t => {
  const b = D().booking, c = savedCodes().find(x => x.code === t.dataset.code); if (!c) return;
  Object.assign(b, { codeText: c.code, code: clone(c), codeState: '', codeErr: '' });
  nav().info = null; pendingFocus = '#ff-code'; toast(`${c.kind} added: ${c.benefit}`);
};
A['dcode-manual'] = () => { nav().info = null; pendingFocus = '#ff-code'; render(); };
// Removing a code clears it from this search only; a profile code stays in My coupons (NMA-613 scenario 19)
A['code-remove'] = () => {
  const b = D().booking, c = b.codeText || (b.code && b.code.code) || '', mine = D().coupons.some(x => x.code === c);
  Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '', codeTries: 0, codeDraft: '' });
  pendingFocus = '#ff-code, [data-s="code"]'; toast(mine ? 'Code removed from this search. It’s still in My coupons.' : `Code ${c} removed`, 'info');
};
A['code-retry'] = () => A['find-trains'](null, '0');
A['code-skip'] = () => { const b = D().booking; Object.assign(b, { code: null, codeText: '', codeState: '', codeErr: '' }); A['find-trains'](null, '0'); };
// Front-end format check before anything is sent (NMA-613 scenario 16, format): 4 or 14 letters or numbers (Q23)
function codeFormatError(b) {
  if (!codeApplies(b) || !b.codeText || CODE_FORMAT.test(b.codeText)) return false;
  b.codeTries++; b.codeState = 'invalid';
  b.codeErr = b.codeTries >= 2 ? 'Please enter a valid discount code. Still having trouble? Call 1-800-USA-RAIL (1-800-872-7245).' : 'Please enter a valid discount code';
  return true;
}

// ---------- "Traveler with disability or need help?" ----------
// Placeholder for the AEM explanation text (NMA-973 BR1); the final copy isn't in the prototype
const ASSIST_TEXT = 'Let us know if anyone needs help, like a wheelchair space, an accessible seat, station assistance or a personal companion. You’ll answer for each traveler.';
const assistMissing = b => b.assistOn ? travelerList(b).filter(t => !assistRec(b, t.key).done) : [];
function assistCheck(r, ri, b) {
  ref('973', '615'); q(7);
  const list = travelerList(b), miss = assistMissing(b), done = list.length - miss.length, err = r.u.showErr && miss.length;
  const busy = r.u.busy && r.u.busyWhat === 'assist';
  let h = `<div class="ffassist${err ? ' has-error' : ''}" id="ffassist"><label class="ads-choice ads-checkbox"><input type="checkbox" id="ff-assist" data-a="ff-assist-toggle" ${b.assistOn ? 'checked' : ''} aria-describedby="ff-assist-h${err ? ' ffa-err' : ''}"><span class="ads-choice__control"></span><span class="ads-choice__label"><span>Traveler with disability or need help?</span><span class="ads-choice__supporting" id="ff-assist-h">${ASSIST_TEXT}</span></span></label>`;
  if (b.assistOn) {
    const status = !done ? (list.length > 1 ? 'No travelers answered yet' : 'Not answered yet') : miss.length ? `Answered for ${done} of ${list.length} travelers` : list.length > 1 ? `Answered for all ${list.length} travelers` : 'Answered';
    h += `<div class="ffassist__row"><span class="ffassist__status">${status}</span>${busy ? `<span class="ffassist__busy" role="status">${ic('spinner-static', 'ads-icon--sm')}Opening questions</span><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="cancel-busy">Cancel</button>` : `<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="ff-assist-continue" aria-label="${miss.length ? 'Continue to assistance questions' : 'Review assistance answers'}">${miss.length ? 'Continue' : 'Review'}</button>`}</div>`;
  }
  if (r.u.busyWhat === 'assist') h += netAlert(r);
  if (err) h += `<p class="ads-helper ads-helper--error" id="ffa-err" tabindex="-1">${ic('alert-diamond')}<span>Choose an assistance option for every traveler (${miss.length} not answered). Select Continue, or uncheck the box if no one needs help.</span></p>`;
  return h + '</div>';
}
// Checking or unchecking works offline (NMA-973). Answers are kept while unchecked, but don't count.
A['ff-assist-toggle'] = (t, ri) => { const b = D().booking, r = routeAt(ri); b.assistOn = t.checked; if (r) { r.u.busyWhat = null; r.u.alert = null; } pendingFocus = '#ff-assist'; render(); };
// Continue needs a connection; a slow one can be cancelled (NMA-973). Once open, the questions can be
// finished offline (NMA-996, 997): b.formLoaded remembers that.
A['ff-assist-continue'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking; r.u.busyWhat = 'assist';
  const go = () => {
    r.u.busyWhat = null; b.formLoaded = true;
    const miss = assistMissing(b); push('travelers', {}, +ri);
    pendingFocus = miss.length ? `[data-a="assist-edit"][data-t="${miss[0].key}"], [data-a="ov-traveler"][data-t="${miss[0].key}"]` : '[data-a="assist-edit"], [data-a="ov-traveler"]'; render();
  };
  if (b.formLoaded && V().net === 'offline') return go();
  runNet(r, () => null, go, { what: 'open the assistance questions' });
};

// Placeholder for the Pass Rider policy (built later, NMA-1081)
INFO['pr-policy'] = { title: 'Pass Rider policy', body: () => `<div class="info-pending"><b>Content not defined yet</b><span>The Pass Rider policy will be added later.</span></div>` };
