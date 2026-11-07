/* Sprint 4 prototype: shared traveler model and per-traveler assistance (all four concepts).
   - travelerList(b) lists everyone on the booking, for every booking mode: standard (passenger types,
     NMA-611), TripLink Corporate (1 traveler, NMA-622) and Pass Rider (you, spouse or employee, dependents,
     Companion Pass travelers; NMA-1017, 1018).
   - Assistance is traveler-specific (NMA-615 AC1, NMA-1019). Traveler 1 keeps b.assist, the record the
     Profile prefills (NMA-614 BR5.1); everyone else has a record in b.ta[key].
   - A personal companion needs another traveler with a disability, one companion each (NMA-615 BR2.1, 2.2).
     Their passenger discount becomes Companion; the earlier choice returns if they change type (NMA-43 BR8).
   - Three different "companions" are kept apart: the personal companion (assistance type, Companion
     discount), the Companion Pass (Pass Rider employees, 8 a year, NMA-1018) and the companion coupon (a code
     that needs two travelers, NMA-613 scenario 13). */

function travelerList(b) {
  const d = D(), it = intentOf(b), out = [];
  if (it === 'corporate') out.push({ key: 'adult-1', type: 'adult', short: 'You' });
  else if (it === 'pr' && d.passrider) {
    if (prMe(b)) out.push({ key: 'pr-you', type: 'pr', short: prMeName(d) });
    if (b.prType !== 'business') {
      const f = b.prPax;
      prPeople(d).filter(p => prPicked(b)[p.id]).forEach(p => out.push({ key: `pr-${p.id}`, type: 'pr', short: p.name }));
      for (let i = 1; i <= f.comp; i++) out.push({ key: `pr-comp-${i}`, type: 'pr', short: `Companion Pass ${i}` });
    }
  } else paxList(b).forEach(t => out.push({ key: t.key, type: t.type, i: t.i, short: PAX_LABEL[t.type] }));
  return out.map((t, n) => Object.assign(t, { n: n + 1, label: `Traveler ${n + 1} · ${t.short}` }));
}
const firstKey = b => (travelerList(b)[0] || {}).key;
// Whose record b.assist is. Concepts 1 and 3 tie it to the account holder ('adult-1', or 'pr-you' for Pass
// Rider), so it can't move to someone else when travelers are removed or the booker leaves themselves off.
// The archived concepts keep their original rule (whoever is first).
const holderKey = b => v1() ? (intentOf(b) === 'pr' ? 'pr-you' : 'adult-1') : firstKey(b);
const travelerLabel = (b, key) => (travelerList(b).find(t => t.key === key) || { label: 'a traveler no longer on this booking' }).label;
// The assistance record for one traveler: { m, done, fromProfile }
function assistRec(b, key) {
  b.ta = b.ta || {};
  if (!key || key === holderKey(b)) return { m: b.assist, done: b.assistDone, fromProfile: b.assistFromProfile };
  return b.ta[key] || { m: blankAssist(), done: false };
}
function clearAssistRec(b, key) {
  b.ta = b.ta || {};
  if (!key || key === holderKey(b)) { b.assist = blankAssist(); b.assistDone = false; b.assistFromProfile = false; }
  else delete b.ta[key];
}
function setAssistRec(b, key, m) {
  b.ta = b.ta || {};
  if (!key || key === holderKey(b)) { b.assist = m; b.assistDone = true; b.assistFromProfile = false; }
  else b.ta[key] = { m, done: true };
  if (perTraveler()) setAsk(b, key || holderKey(b), true);
}
// Concepts 1 and 3: each traveler has their own "Traveler with disability or need help?" checkbox in Traveler
// details (b.ask). b.assistOn is derived from it (any traveler checked), so shared summaries keep working.
// The archived concepts keep one booking-level indication (b.assistOn).
const perTraveler = () => v1();
const asks = (b, key) => perTraveler() ? !!(b.ask && b.ask[key]) : !!b.assistOn;
function setAsk(b, key, on) { b.ask = b.ask || {}; if (on) b.ask[key] = true; else delete b.ask[key]; syncAsk(b); }
function syncAsk(b) { if (perTraveler()) b.assistOn = travelerList(b).some(t => asks(b, t.key)); }
// The assistance type that counts for a traveler: only once answered, and only while that traveler asks for help
function assistCat(b, key) { const a = assistRec(b, key); return asks(b, key) && a.done && a.m.cat !== 'none' ? a.m.cat || null : null; }
const catCount = (b, cat, except) => travelerList(b).filter(t => t.key !== except && assistCat(b, t.key) === cat).length;
// NMA-615 BR2.1–2.2: a personal companion accompanies one traveler with a disability, and each of them may
// bring one companion. The companion names who they accompany ("Personal companion to"), so the pairing is
// explicit. Travelers are named by number only (Traveler 1, Traveler 2), never by type.
const travNo = (b, key) => { const t = travelerList(b).find(x => x.key === key); return t ? `Traveler ${t.n}` : 'another traveler'; };
const companionOf = (b, forKey, except) => travelerList(b).find(t => t.key !== except && assistCat(b, t.key) === 'companion' && assistRec(b, t.key).m.for === forKey);
const companionTargets = (b, key) => travelerList(b).filter(t => t.key !== key && assistCat(b, t.key) === 'disability' && !companionOf(b, t.key, key));
const companionOpen = (b, key) => companionTargets(b, key).length > 0;
// Problems that stop the search: companions whose traveler with a disability is missing, changed or shared
function assistProblems(b) {
  if (!b.assistOn) return [];
  const out = [], seen = {};
  for (const t of travelerList(b)) {
    if (assistCat(b, t.key) !== 'companion') continue;
    const f = assistRec(b, t.key).m.for, me = travNo(b, t.key);
    if (!f || assistCat(b, f) !== 'disability') out.push(`${me} is a personal companion, but ${f ? travNo(b, f) + ' no longer has a disability in assistance' : 'no traveler with a disability is chosen'}. Edit ${me}’s assistance.`);
    else if (seen[f]) out.push(`${travNo(b, f)} has two personal companions. Each traveler with a disability may bring one. Edit ${me}’s assistance.`);
    seen[f] = true;
  }
  return out;
}
// Errors that belong to one traveler (from the shared rules)
function travelerError(b, t) {
  if (assistCat(b, t.key) !== 'companion') return '';
  const f = assistRec(b, t.key).m.for;
  if (!f || assistCat(b, f) !== 'disability') return `${f ? travNo(b, f) + ' no longer has a disability in assistance' : 'No traveler with a disability is chosen'}, so this traveler can’t be a personal companion. Edit their assistance, or remove it.`;
  const first = travelerList(b).find(x => assistCat(b, x.key) === 'companion' && assistRec(b, x.key).m.for === f);
  if (first && first.key !== t.key) return `${travNo(b, f)} already has a personal companion. Each traveler with a disability may bring one.`;
  return '';
}
// The companion's "Personal companion to" choice: travelers with a disability, listed as Traveler 1, Traveler 2…
function companionFor(r, x, idp, e) {
  const b = D().booking, key = assistWho(r).key, opts = companionTargets(b, key);
  if (!opts.length) return `<p class="ads-helper ads-helper--error cmp-for" id="${idp}-for-h">${ic('alert-diamond')}<span>${x.for ? ASSIST_COPY.companionInvalid(travNo(b, x.for)) : ASSIST_COPY.companionNone}</span></p>`;
  // A saved pairing that no longer works must be reassigned; it is never switched to someone else silently
  if (!x.for && opts.length === 1) x.for = opts[0].key;
  const valid = opts.some(t => t.key === x.for);
  const err = e.for || (x.for && !valid ? ASSIST_COPY.companionInvalid(travNo(b, x.for)) : '');
  return `<div class="cmp-for">${fieldHtml({ id: `${idp}-for`, f: 'for', label: ASSIST_COPY.companionFor, value: valid ? x.for : '', select: [['', ASSIST_COPY.companionChoose], ...opts.map(t => [t.key, `Traveler ${t.n}`])], req: true, help: ASSIST_COPY.companionForHelp, err })}</div>`;
}
// Passenger discount from assistance (standard and TripLink Personal bookings only): PWD or Companion
function assistDiscount(b, key) {
  if (!['standard', 'personal'].includes(intentOf(b))) return null;
  const c = assistCat(b, key);
  return c === 'disability' ? 'pwd' : c === 'companion' && !travelerError(b, travelerList(b).find(t => t.key === key) || { key }) ? 'companion' : null; // only a valid pairing gets the Companion discount
}
function assistLine(b, key) {
  const a = assistRec(b, key);
  if (!asks(b, key)) return 'Not requested';
  if (!a.done) return 'Not answered';
  return !a.m.cat || a.m.cat === 'none' ? ASSIST_COPY.noneSummary : CATS[a.m.cat];
}
// One line for compact hosts (Compact rows, Guided summaries)
function assistSummaryLine(b) {
  if (!b.assistOn) return 'Not requested';
  const list = travelerList(b), asked = list.filter(t => assistRec(b, t.key).done && assistRec(b, t.key).m.cat && assistRec(b, t.key).m.cat !== 'none');
  if (!asked.length) return list.some(t => assistRec(b, t.key).done) ? ASSIST_COPY.noneSummary : 'Questions not answered yet';
  if (list.length === 1) return CATS[asked[0] && assistRec(b, asked[0].key).m.cat] || 'Not answered';
  return `${asked.length} of ${list.length} travelers`;
}

// Concise traveler summary for the Fare Finder: only selections that were made (no "None chosen" labels)
function travelerChoices(b) {
  const it = intentOf(b), parts = [];
  if (['standard', 'personal'].includes(it)) { const d = discSummary(b); if (d !== 'None chosen') parts.push(d); }
  if (it === 'pr' && b.prType !== 'business') { const kids = travelerList(b).filter(t => prKind(b, t.key) === 'child').length; if (kids) parts.push(`${kids} child${kids > 1 ? 'ren' : ''}`); }
  const n = travelerList(b).filter(t => { const a = assistRec(b, t.key); return asks(b, t.key) && a.done && a.m.cat && a.m.cat !== 'none'; }).length;
  const asked = travelerList(b).filter(t => asks(b, t.key)).length, miss = assistMissing(b).length;
  if (miss) parts.push(`Assistance answered for ${asked - miss} of ${asked}`);
  else if (n) parts.push(`Assistance for ${n} traveler${n > 1 ? 's' : ''}`);
  if (assistProblems(b).length) parts.push('Assistance needs a change');
  return parts.join(' · ');
}
// Short form for summaries: "Assistance for 2 travelers"
function assistShort(b) {
  if (!b.assistOn) return '';
  const n = travelerList(b).filter(t => { const a = assistRec(b, t.key); return asks(b, t.key) && a.done && a.m.cat && a.m.cat !== 'none'; }).length;
  return n ? `Assistance for ${n} traveler${n > 1 ? 's' : ''}` : 'Assistance not answered yet';
}
// ---------- Shared component: every traveler's assistance, with Add or Edit ----------
function assistTravelerList(b) {
  const list = travelerList(b), prob = assistProblems(b);
  const rows = list.map(t => {
    const a = assistRec(b, t.key), items = a.done ? assistSummaryItems(a.m) : [], disc = assistDiscount(b, t.key);
    const tag = a.done && t.n === 1 && a.fromProfile ? '<span class="ads-lock">From your profile</span>' : '';
    const c = a.done ? a.m.cat : null;
    const sub = (a.done ? items.slice(1).filter(x => x !== 'No other needs') : []).join(' · ');
    const pair = c === 'disability' ? '<span class="atl__sub">May bring one personal companion</span>' : '';
    const discNote = disc ? `<span class="atl__disc">${TDISC_LABEL[disc]} discount applies</span>` : '';
    const state = !a.done || !c || c === 'none' ? 'No assistance requested' : items[0];
    const acts = `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-edit" data-t="${t.key}" aria-label="${a.done ? 'Edit' : 'Add'} assistance for ${esc(t.label)}">${a.done ? 'Edit' : 'Add'}</button>${a.done ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-remove" data-t="${t.key}" aria-label="Remove assistance for ${esc(t.label)}">Remove</button>` : ''}`;
    const terr = travelerError(b, t);
    return `<li class="atl__row${a.done && c && c !== 'none' ? ' is-requested' : ''}${terr ? ' has-error' : ''}"><div class="atl__text"><span class="atl__who">${esc(t.label)} ${tag}${a.done && c && c !== 'none' ? '<span class="atl__badge">Requested</span>' : ''}</span><span class="atl__val">${esc(state)}</span>${sub ? `<span class="atl__sub">${esc(sub)}</span>` : ''}${pair}${discNote}${terr ? `<span class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${esc(terr)}</span></span>` : ''}</div><div class="atl__acts">${acts}</div></li>`;
  }).join('');
  const err = prob.length ? `<p class="ads-helper ads-helper--error" id="atl-err" role="alert" tabindex="-1">${ic('alert-diamond')}<span>${prob.length > 1 ? `${prob.length} travelers need changes to their assistance.` : 'A traveler needs a change to their assistance.'} See below.</span></p>` : '';
  return `<div class="atl"><p class="atl__head">${list.length > 1 ? 'Answer for each traveler who needs help. Others can stay without answers.' : 'Answer the questions for this traveler.'}</p>${err}<ul class="atl__list" aria-label="Assistance by traveler">${rows}</ul></div>`;
}

// ---------- Pass Rider eligibility (NMA-623, 1016, 1017) ----------
// Employees, retirees, spouses and dependents 16 or older can book on their own (NMA-1017 table). The pass
// file has no dependent age or date of birth, so the prototype takes it from the reviewer fixture
// (Scenario › Pass Rider dependent 15 or younger). How the app learns relationship and age is open (Q16).
function prCanStart(d) {
  const p = d.passrider;
  if (!p) return { ok: false, text: 'Add your Amtrak employee pass details in profile to book Pass Rider travel.' };
  if (p.role === 'dependent' && p.minor) return { ok: false, text: 'Dependents 15 or younger can’t book Pass Rider travel on their own. The employee, their spouse or a dependent 18 or older can book it and add you.' };
  return { ok: true };
}

// Demo state (Flow › J): two adults, Traveler 1 with a disability, Traveler 2 as their personal companion
V3_PLACES.companion = () => {
  const b = D().booking; b.from = b.from || 'NYP'; b.to = b.to || 'WAS'; b.pax.adult = 2; b.assistOn = true;
  setAssistRec(b, 'adult-1', { cat: 'disability', dis: ['mobility'], wc: false, needs: ['station'] });
  b.ta['adult-2'] = { m: { cat: 'companion', for: 'adult-1', dis: [], wc: null, needs: ['station', 'seat'] }, done: true }; setAsk(b, 'adult-2', true);
  if (v2()) sheet().stack[0].u.open = 'who';
  render();
};

// ---------- Actions ----------
// Remove one traveler's assistance; the others keep theirs
A['assist-remove'] = t => {
  const b = D().booking, key = t.dataset.t, label = travelerLabel(b, key), comp = assistCat(b, key) === 'disability' ? companionOf(b, key) : null;
  clearAssistRec(b, key); if (perTraveler()) setAsk(b, key, false);
  pendingFocus = `[data-a="assist-answer"][data-t="${key}"], [data-a="assist-edit"][data-t="${key}"]`;
  toast(comp ? `Assistance removed for ${label}. ${travNo(b, comp.key)} is no longer a valid personal companion.` : `Assistance removed for ${label}`, 'info');
};
// Opening the questionnaire needs a connection (NMA-973); once open it can be finished offline (NMA-995–997)
// Three cases (NMA-973, 995–997): turning assistance on or off works offline; opening a traveler's questions
// for the first time needs a connection; questions already opened in this booking can be finished or
// reviewed offline. b.taSeen remembers which travelers' questions were opened.
const assistSeen = (b, key) => !!(b.taSeen && b.taSeen[key]);
function assistOffline(returnFocus, key) {
  const b = D().booking; key = key || firstKey(b);
  if (V().net !== 'offline') { b.taSeen = b.taSeen || {}; b.taSeen[key] = true; b.formLoaded = true; b.assistOffline = null; return false; }
  if (assistSeen(b, key)) return false; // once this traveler's questions have been opened, they work offline (NMA-996, 997)
  if (v4()) { b.assistOffline = key; pendingFocus = '#fl-offline-note'; render(); return true; } // Compact: said in the assistance row
  dialog({ title: 'You’re offline', body: 'Answering assistance questions for the first time needs a connection. Assistance stays on and your trip details are kept. Try again when you’re back online.', actions: [['Close', 'primary', null]], returnFocus });
  return true;
}
A['assist-edit'] = (t, ri) => {
  const key = (t && t.dataset && t.dataset.t) || firstKey(D().booking);
  if (assistOffline(`[data-a="assist-edit"][data-t="${key}"], [data-a="assist-edit"]`, key)) return;
  push('assist', { t: key }, +ri);
};
A['assist-offline-ok'] = () => { D().booking.assistOffline = null; pendingFocus = '[data-a="fl-assist-off"], [data-a="fl-assist-on"]'; render(); };
A['assist-toggle'] = (t, ri) => {
  const b = D().booking; b.assistOn = t.checked;
  if (b.assistOn && !b.assistDone) { /* as before: checking it starts with Traveler 1's questions */ if (assistOffline(`#${t.id}`, firstKey(b))) { render(); return; } push('assist', { t: firstKey(b) }, +ri); return; }
  pendingFocus = `#${t.id}`; render();
};
A['fl-assist-on'] = (t, ri) => {
  const b = D().booking; b.assistOn = true;
  if (!b.assistDone) { if (assistOffline('[data-a="fl-assist-on"]', firstKey(b))) { render(); return; } push('assist', { t: firstKey(b) }, +ri); return; }
  pendingFocus = '[data-a="assist-edit"]'; render();
};
A['assist-confirm'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, b = D().booking, key = r.p.t || firstKey(b), who = (travelerList(b).find(z => z.key === key) || { label: 'Traveler 1' }).label;
  const e = assistErrors(x, 'booking', who);
  if (x.cat === 'companion' && !companionOpen(b, key)) e.cat = 'A personal companion needs another traveler with a disability who doesn’t have a companion yet.';
  else if (x.cat === 'companion' && !companionTargets(b, key).some(t => t.key === x.for)) e.for = x.for ? ASSIST_COPY.companionInvalid(travNo(b, x.for)) : ASSIST_COPY.err.forMissing;
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.cat || e.for ? 'cat' : e.dis ? 'dis' : 'wc'; pendingFocus = '[aria-invalid="true"], .ads-helper--error'; render(); return; }
  // Replacing a different discount with Passenger with disability asks first (design review). Only when a discount is
  // actually replaced: not when none was selected, when PWD already applies, or for station help without a disability.
  // Existing eligibility and precedence rules are unchanged (assistDiscount decides what applies).
  const trav = travelerList(b).find(z => z.key === key) || { key, type: 'adult', n: 1 };
  const before = tdiscOf(b, trav), saved = fromDraft(x), willPwd = x.cat === 'disability' && ['standard', 'personal'].includes(intentOf(b));
  const replacing = willPwd && before && !['none', 'pwd'].includes(before);
  if (replacing && !r.u.replaceOk) {
    return dialog({ title: 'Replace your discount?', returnFocus: '[data-a="assist-confirm"]',
      body: `The Passenger with disability discount will replace your ${esc(TDISC_LABEL[before] || before)} discount. Only one discount can be applied per traveler.`,
      actions: [['Replace discount', 'primary', () => { r.u.replaceOk = true; A['assist-confirm'](t, ri); }], ['Keep editing', 'secondary', null]] });
  }
  r.u.replaceOk = false;
  // Proposal awaiting team confirmation: nothing selected means no assistance is requested (no "I do not need
  // assistance" option). Clearing everything removes this traveler's request and updates the summary.
  if (!x.cat) {
    clearAssistRec(b, key); if (perTraveler()) setAsk(b, key, false);
    if (b.discReplaced && b.discReplaced[key]) { const o = Object.assign({}, b.discReplaced); delete o[key]; b.discReplaced = o; }
    r.u.dirty = false; popTo(+ri - 1); pendingFocus = `[data-a="assist-answer"][data-t="${key}"], [data-a="assist-edit"]`; render(); return;
  }
  if (replacing) { b.discReplaced = Object.assign({}, b.discReplaced, { [key]: before }); }
  else if (b.discReplaced && b.discReplaced[key] && !willPwd) { const o = Object.assign({}, b.discReplaced); delete o[key]; b.discReplaced = o; }
  setAssistRec(b, key, saved); b.assistOn = true;
  r.u.dirty = false; popTo(+ri - 1); pendingFocus = `[data-a="assist-edit"][data-t="${key}"], [data-a="assist-edit"]`;
  const back = routeAt(+ri - 1); // opened from the Travelers screen: go on to the next unanswered traveler
  const next = perTraveler() && back && back.s === 'travelers' && assistMissing(b)[0]; if (next) pendingFocus = `[data-a="assist-answer"][data-t="${next.key}"]`; // the next traveler still to answer
  render();
};

// ---------- "Traveler with disability or need help?" for each traveler, in Traveler details (NMA-973) ----------
// Direction: the indication sits inside each traveler's details, not as one checkbox for the whole Travelers
// section. Checking it asks for that traveler's answers (Answer opens their questions: the first time needs a
// connection, NMA-973; once loaded they work offline, NMA-996, 997). Unchecking keeps the answers for this
// trip but stops them counting. The Fare Finder's Travelers summary shows the state.
const ASSIST_TEXT = ASSIST_COPY.entryHelp; // placeholder for AEM text (NMA-973 BR1)
const assistMissing = b => travelerList(b).filter(t => asks(b, t.key) && !assistRec(b, t.key).done);
function assistAsk(b, t, r, summary = '') {
  ref('973', '615', '614'); q(7);
  const C = ASSIST_COPY, a = assistRec(b, t.key), saved = asks(b, t.key) && a.done, id = `ask-${t.key}`;
  const busy = r && r.u.busyWhat === 'assist' && r.u.busyKey === t.key && r.u.busy;
  // One call to action: Add assistance opens this traveler's questionnaire; once answers are confirmed it becomes
  // Edit assistance, with Remove beside it
  const btn = (act, label, kind, icon) => `<button class="ads-btn ads-btn--${kind} ads-btn--sm" type="button" data-a="${act}" data-t="${t.key}"${act === 'assist-answer' ? ` id="${id}"` : ''} aria-describedby="${id}-h">${icon ? ic(icon, 'ads-icon--sm') : ''}${label}<span class="ads-sr-only"> for ${esc(t.label)}</span></button>`;
  const acts = busy ? `<span class="ffassist__busy" role="status">${ic('spinner-static', 'ads-icon--sm')}Opening questions</span><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="cancel-busy">Cancel</button>`
    : saved ? btn('assist-edit', C.editCta, 'secondary', 'edit') + btn('assist-remove', C.removeCta, 'tertiary') : btn('assist-answer', C.addCta, 'secondary', 'plus');
  // Content above traveler details (comparison setting): the copy is shown once above the section, not in each card
  if (assistAbove()) return `<div class="tassist tassist--bare">${saved ? summary : ''}<div class="tassist__acts">${acts.replace(/aria-describedby="[^"]*"/g, 'aria-describedby="tassist-intro"')}</div></div>`;
  return `<div class="tassist"><p class="tassist__label">${C.entryLabel}</p><p class="tassist__help" id="${id}-h">${C.entryHelp}</p>${saved ? summary : ''}<div class="tassist__acts">${acts}</div></div>`;
}
// Network problems opening a traveler's questions show once, above the travelers
const assistNetAlert = r => r && r.u.busyWhat === 'assist' ? netAlert(r) : '';
// Checking the box goes straight to that traveler's questions (same connection handling as Add). If they're
// abandoned, the box stays checked and the traveler shows Add. Answers already kept for this trip come back
// without reopening the questions.
A['assist-ask'] = (t, ri) => {
  const b = D().booking, r = routeAt(ri), key = t.dataset.t; setAsk(b, key, t.checked); if (r) { r.u.busyWhat = null; r.u.alert = null; }
  pendingFocus = `#ask-${key}`;
  if (t.checked && !assistRec(b, key).done) return A['assist-answer']({ dataset: { t: key } }, ri);
  render();
};
// Answer: opens one traveler's questions (needs a connection the first time)
A['assist-answer'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, key = t.dataset.t;
  r.u.busyWhat = 'assist'; r.u.busyKey = key;
  const go = () => { r.u.busyWhat = null; b.formLoaded = true; b.taSeen = b.taSeen || {}; b.taSeen[key] = true; push('assist', { t: key }, +ri); };
  if (assistSeen(b, key)) return go(); // already opened for this traveler: no request, works offline (NMA-996, 997)
  runNet(r, () => null, go, { what: 'open the assistance questions' });
};
