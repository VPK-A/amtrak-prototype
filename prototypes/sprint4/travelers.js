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
    out.push({ key: 'pr-you', type: 'pr', short: `You · ${prRoleLabel(d)}` });
    if (b.prType !== 'business') {
      const f = b.prPax;
      for (let i = 1; i <= f.fam; i++) out.push({ key: `pr-fam-${i}`, type: 'pr', short: d.passrider.role === 'employee' ? 'Spouse' : d.passrider.role === 'spouse' ? 'Employee' : 'Employee or spouse' });
      for (let i = 1; i <= f.dep; i++) out.push({ key: `pr-dep-${i}`, type: 'pr', short: `Dependent ${i}` });
      for (let i = 1; i <= f.comp; i++) out.push({ key: `pr-comp-${i}`, type: 'pr', short: `Companion Pass ${i}` });
    }
  } else paxList(b).forEach(t => out.push({ key: t.key, type: t.type, i: t.i, short: PAX_LABEL[t.type] }));
  return out.map((t, n) => Object.assign(t, { n: n + 1, label: `Traveler ${n + 1} · ${t.short}` }));
}
const firstKey = b => (travelerList(b)[0] || {}).key;
const travelerLabel = (b, key) => (travelerList(b).find(t => t.key === key) || { label: 'a traveler no longer on this booking' }).label;
// The assistance record for one traveler: { m, done, fromProfile }
function assistRec(b, key) {
  b.ta = b.ta || {};
  if (!key || key === firstKey(b)) return { m: b.assist, done: b.assistDone, fromProfile: b.assistFromProfile };
  return b.ta[key] || { m: blankAssist(), done: false };
}
function clearAssistRec(b, key) {
  b.ta = b.ta || {};
  if (!key || key === firstKey(b)) { b.assist = blankAssist(); b.assistDone = false; b.assistFromProfile = false; }
  else delete b.ta[key];
}
function setAssistRec(b, key, m) {
  b.ta = b.ta || {};
  if (!key || key === firstKey(b)) { b.assist = m; b.assistDone = true; b.assistFromProfile = false; }
  else b.ta[key] = { m, done: true };
}
// The assistance type that counts for a traveler: only once answered, and only while the booking asks for help
function assistCat(b, key) { const a = assistRec(b, key); return b.assistOn && a.done ? a.m.cat : null; }
const catCount = (b, cat, except) => travelerList(b).filter(t => t.key !== except && assistCat(b, t.key) === cat).length;
// NMA-615 BR2.1–2.2: a personal companion accompanies one traveler with a disability, and each of them may
// bring one companion. The companion names who they accompany, so the pairing is explicit.
const companionOf = (b, forKey, except) => travelerList(b).find(t => t.key !== except && assistCat(b, t.key) === 'companion' && assistRec(b, t.key).m.for === forKey);
const companionTargets = (b, key) => travelerList(b).filter(t => t.key !== key && assistCat(b, t.key) === 'disability' && !companionOf(b, t.key, key));
const companionOpen = (b, key) => companionTargets(b, key).length > 0;
// Problems that stop the search: companions whose traveler with a disability is missing, changed or shared
function assistProblems(b) {
  if (!b.assistOn) return [];
  const out = [], seen = {};
  for (const t of travelerList(b)) {
    if (assistCat(b, t.key) !== 'companion') continue;
    const f = assistRec(b, t.key).m.for;
    if (!f || assistCat(b, f) !== 'disability') out.push(`${t.label} is a personal companion, but ${f ? travelerLabel(b, f) + ' no longer has a disability in assistance' : 'no traveler with a disability is chosen'}. Edit ${t.label}’s assistance.`);
    else if (seen[f]) out.push(`${travelerLabel(b, f)} has two personal companions. Each traveler with a disability may bring one. Edit ${t.label}’s assistance.`);
    seen[f] = true;
  }
  return out;
}
// Errors that belong to one traveler (from the shared rules)
function travelerError(b, t) {
  if (assistCat(b, t.key) !== 'companion') return '';
  const f = assistRec(b, t.key).m.for;
  if (!f || assistCat(b, f) !== 'disability') return `${f ? travelerLabel(b, f) + ' no longer has a disability in assistance' : 'No traveler with a disability is chosen'}, so this traveler can’t be a personal companion. Edit their assistance, or remove it.`;
  const first = travelerList(b).find(x => assistCat(b, x.key) === 'companion' && assistRec(b, x.key).m.for === f);
  if (first && first.key !== t.key) return `${travelerLabel(b, f)} already has a personal companion (${first.label}). Each traveler with a disability may bring one.`;
  return '';
}
// The type step's "Personal companion to" choice
function companionFor(r, x, idp, e) {
  const b = D().booking, key = assistWho(r).key, opts = companionTargets(b, key);
  if (!x.for || !opts.some(t => t.key === x.for)) x.for = opts[0] ? opts[0].key : '';
  if (!opts.length) return '';
  return `<div class="cmp-for">${fieldHtml({ id: `${idp}-for`, f: 'for', label: 'Personal companion to', value: x.for, select: opts.map(t => [t.key, t.label]), req: true, help: opts.length > 1 ? 'Each traveler with a disability may bring one personal companion.' : `${opts[0].label} has a disability in assistance.`, err: e.for })}${q(19)}</div>`;
}
// Passenger discount from assistance (standard and TripLink Personal bookings only): PWD or Companion
function assistDiscount(b, key) {
  if (!['standard', 'personal'].includes(intentOf(b))) return null;
  const c = assistCat(b, key);
  return c === 'disability' ? 'pwd' : c === 'companion' && !travelerError(b, travelerList(b).find(t => t.key === key) || { key }) ? 'companion' : null; // only a valid pairing gets Companion
}
function assistLine(b, key) {
  const a = assistRec(b, key);
  if (!b.assistOn) return 'Not requested';
  if (!a.done) return 'Not answered';
  return a.m.cat === 'none' ? 'No assistance needed' : CATS[a.m.cat];
}
// One line for compact hosts (Compact rows, Guided summaries)
function assistSummaryLine(b) {
  if (!b.assistOn) return 'Not requested';
  const list = travelerList(b), asked = list.filter(t => assistRec(b, t.key).done && assistRec(b, t.key).m.cat && assistRec(b, t.key).m.cat !== 'none');
  if (!asked.length) return list.some(t => assistRec(b, t.key).done) ? 'No assistance needed' : 'Questions not answered yet';
  if (list.length === 1) return CATS[asked[0] && assistRec(b, asked[0].key).m.cat] || 'Not answered';
  return `${asked.length} of ${list.length} travelers`;
}

// Concise traveler summary for the Fare Finder: only selections that were made (no "None chosen" labels)
function travelerChoices(b) {
  const it = intentOf(b), parts = [];
  if (['standard', 'personal'].includes(it)) { const d = discSummary(b); if (d !== 'None chosen') parts.push(d); }
  const n = travelerList(b).filter(t => { const a = assistRec(b, t.key); return b.assistOn && a.done && a.m.cat && a.m.cat !== 'none'; }).length;
  if (n) parts.push(`Assistance for ${n} traveler${n > 1 ? 's' : ''}`);
  if (assistProblems(b).length) parts.push('Assistance needs a change');
  return parts.join(' · ');
}
// Short form for summaries: "Assistance for 2 travelers"
function assistShort(b) {
  if (!b.assistOn) return '';
  const n = travelerList(b).filter(t => { const a = assistRec(b, t.key); return a.done && a.m.cat && a.m.cat !== 'none'; }).length;
  return n ? `Assistance for ${n} traveler${n > 1 ? 's' : ''}` : 'Assistance not answered yet';
}
// ---------- Shared component: every traveler's assistance, with Add or Edit ----------
function assistTravelerList(b) {
  const list = travelerList(b), prob = assistProblems(b);
  const rows = list.map(t => {
    const a = assistRec(b, t.key), items = a.done ? assistSummaryItems(a.m) : [], disc = assistDiscount(b, t.key);
    const tag = a.done && t.n === 1 && a.fromProfile ? '<span class="ads-lock">From your profile</span>' : '';
    const c = a.done ? a.m.cat : null;
    const sub = [c === 'companion' ? `Companion to ${travelerLabel(b, a.m.for)}` : '', ...(a.done ? items.slice(1).filter(x => x !== 'No other needs') : [])].filter(Boolean).join(' · ');
    const comp = c === 'disability' ? companionOf(b, t.key) : null;
    const pair = c === 'disability' ? `<span class="atl__sub">${comp ? `Personal companion: ${esc(comp.label)}` : 'May bring one personal companion'}</span>` : '';
    const discNote = disc ? `<span class="atl__disc">${TDISC_LABEL[disc]} discount applies</span>` : '';
    const state = !a.done ? 'No assistance requested' : c === 'none' ? 'No assistance needed' : items[0];
    const acts = `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-edit" data-t="${t.key}" aria-label="${a.done ? 'Edit' : 'Add'} assistance for ${esc(t.label)}">${a.done ? 'Edit' : 'Add'}</button>${a.done ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-remove" data-t="${t.key}" aria-label="Remove assistance for ${esc(t.label)}">Remove</button>` : ''}`;
    const terr = travelerError(b, t);
    return `<li class="atl__row${a.done && c !== 'none' ? ' is-requested' : ''}${terr ? ' has-error' : ''}"><div class="atl__text"><span class="atl__who">${esc(t.label)} ${tag}${a.done && c !== 'none' ? '<span class="atl__badge">Requested</span>' : ''}</span><span class="atl__val">${esc(state)}</span>${sub ? `<span class="atl__sub">${esc(sub)}</span>` : ''}${pair}${discNote}${terr ? `<span class="ads-helper ads-helper--error">${ic('alert-diamond')}<span>${esc(terr)}</span></span>` : ''}</div><div class="atl__acts">${acts}</div></li>`;
  }).join('');
  const err = prob.length ? `<p class="ads-helper ads-helper--error" id="atl-err" role="alert" tabindex="-1">${ic('alert-diamond')}<span>${prob.length > 1 ? `${prob.length} travelers need changes to their assistance.` : 'A traveler needs a change to their assistance.'} See below.</span></p>` : '';
  return `<div class="atl"><p class="atl__head">${list.length > 1 ? 'Answer for each traveler who needs help. Others can stay without answers.' : 'Answer the questions for this traveler.'}</p>${err}<ul class="atl__list" aria-label="Assistance by traveler">${rows}</ul></div>`;
}

// ---------- Pass Rider eligibility (NMA-623, 1016, 1017) ----------
// Employees and spouses can start Pass Rider travel. A dependent can at 16 or older (NMA-1017 AC4); their age
// comes from the profile's date of birth (NMA-919). How the app learns the relationship is open (Q16).
function ageFromDob(dob) {
  if (!dob || !validDob(dob)) return null;
  const [m, dd, y] = dob.split('/').map(Number);
  let a = TODAY.getFullYear() - y; if (TODAY.getMonth() + 1 < m || (TODAY.getMonth() + 1 === m && TODAY.getDate() < dd)) a--;
  return a;
}
function prCanStart(d) {
  const p = d.passrider;
  if (!p) return { ok: false, text: 'Add your Amtrak employee pass details in profile to book Pass Rider travel.' };
  if (p.role !== 'dependent') return { ok: true };
  const age = ageFromDob(d.profile.dob);
  if (age == null) return { ok: false, text: 'Dependents 16 or older can start Pass Rider travel. Add your date of birth in profile.' };
  if (age < 16) return { ok: false, text: 'Dependents under 16 can’t start Pass Rider travel. The employee or their spouse can book it and add you.' };
  return { ok: true, age };
}

// Demo state (Flow › J): two adults, Traveler 1 with a disability, Traveler 2 as their personal companion
V3_PLACES.companion = () => {
  const b = D().booking; b.from = b.from || 'NYP'; b.to = b.to || 'WAS'; b.pax.adult = 2; b.assistOn = true;
  setAssistRec(b, 'adult-1', { cat: 'disability', dis: ['mobility'], wc: false, needs: ['station'] });
  b.ta['adult-2'] = { m: { cat: 'companion', for: 'adult-1', dis: [], wc: null, needs: ['station', 'seat'] }, done: true };
  if (v2()) sheet().stack[0].u.open = 'who';
  render();
};

// ---------- Actions ----------
// Remove one traveler's assistance; the others keep theirs
A['assist-remove'] = t => {
  const b = D().booking, key = t.dataset.t, label = travelerLabel(b, key), comp = assistCat(b, key) === 'disability' ? companionOf(b, key) : null;
  clearAssistRec(b, key);
  pendingFocus = `[data-a="assist-edit"][data-t="${key}"]`;
  toast(comp ? `Assistance removed for ${label}. ${comp.label} is no longer a valid personal companion.` : `Assistance removed for ${label}`, 'info');
};
// Opening the questionnaire needs a connection (NMA-973); once open it can be finished offline (NMA-995–997)
// Three cases (NMA-973, 995–997): turning assistance on or off works offline; opening a traveler's questions
// for the first time needs a connection; questions already opened in this booking can be finished or
// reviewed offline. b.taSeen remembers which travelers' questions were opened.
const assistSeen = (b, key) => !!(b.taSeen && b.taSeen[key]);
function assistOffline(returnFocus, key) {
  const b = D().booking; key = key || firstKey(b);
  if (V().net !== 'offline') { b.taSeen = b.taSeen || {}; b.taSeen[key] = true; b.assistOffline = null; return false; }
  if (assistSeen(b, key)) return false;
  if (v4()) { b.assistOffline = key; pendingFocus = '#fl-offline-note'; render(); return true; } // Compact: said in the assistance row
  dialog({ title: 'You’re offline', body: 'Answering assistance questions for the first time needs a connection. Assistance stays on and your trip details are kept. Try again when you’re back online.', actions: [['OK', 'primary', null]], returnFocus });
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
  else if (x.cat === 'companion' && !companionTargets(b, key).some(t => t.key === x.for)) e.for = 'Choose the traveler you’re a personal companion to.';
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.cat || e.for ? 'cat' : e.dis ? 'dis' : 'wc'; pendingFocus = '[aria-invalid="true"], .ads-helper--error'; render(); return; }
  setAssistRec(b, key, fromDraft(x)); b.assistOn = true;
  r.u.dirty = false; popTo(+ri - 1); pendingFocus = `[data-a="assist-edit"][data-t="${key}"], [data-a="assist-edit"]`; render();
};
