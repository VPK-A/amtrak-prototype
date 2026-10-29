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
// The assistance record for one traveler: { m, done, fromProfile }
function assistRec(b, key) {
  b.ta = b.ta || {};
  if (!key || key === firstKey(b)) return { m: b.assist, done: b.assistDone, fromProfile: b.assistFromProfile };
  return b.ta[key] || { m: blankAssist(), done: false };
}
function setAssistRec(b, key, m) {
  b.ta = b.ta || {};
  if (!key || key === firstKey(b)) { b.assist = m; b.assistDone = true; b.assistFromProfile = false; }
  else b.ta[key] = { m, done: true };
}
// The assistance type that counts for a traveler: only once answered, and only while the booking asks for help
function assistCat(b, key) { const a = assistRec(b, key); return b.assistOn && a.done ? a.m.cat : null; }
const catCount = (b, cat, except) => travelerList(b).filter(t => t.key !== except && assistCat(b, t.key) === cat).length;
// NMA-615 BR2.1–2.2: a personal companion needs a traveler with a disability who doesn't have one yet
const companionOpen = (b, key) => catCount(b, 'disability', key) > catCount(b, 'companion', key);
// Problems that stop the search: a companion left without a traveler with a disability
function assistProblems(b) {
  if (!b.assistOn) return [];
  const comps = catCount(b, 'companion'), dis = catCount(b, 'disability');
  if (comps > dis) return [dis ? `Each traveler with a disability may bring one personal companion. ${comps} travelers are personal companions and ${dis} has a disability.` : 'A personal companion needs another traveler with a disability. Change the assistance type for the personal companion, or add assistance for the traveler with a disability.'];
  return [];
}
// Passenger discount from assistance (standard and TripLink Personal bookings only): PWD or Companion
function assistDiscount(b, key) {
  if (!['standard', 'personal'].includes(intentOf(b))) return null;
  const c = assistCat(b, key);
  return c === 'disability' ? 'pwd' : c === 'companion' ? 'companion' : null;
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

// ---------- Shared component: every traveler's assistance, with Add or Edit ----------
function assistTravelerList(b) {
  const list = travelerList(b), prob = assistProblems(b);
  const rows = list.map(t => {
    const a = assistRec(b, t.key), items = a.done ? assistSummaryItems(a.m) : [], disc = assistDiscount(b, t.key);
    const tag = a.done && t.n === 1 && a.fromProfile ? '<span class="ads-lock">From your Profile</span>' : '';
    const sub = a.done ? items.slice(1).filter(x => x !== 'No other needs').join(' · ') : '';
    const discNote = disc ? `<span class="atl__disc">${TDISC_LABEL[disc]} discount applies</span>` : '';
    return `<li class="atl__row"><div class="atl__text"><span class="atl__who">${esc(t.label)} ${tag}</span><span class="atl__val">${esc(a.done ? items[0] : 'No answers yet')}</span>${sub ? `<span class="atl__sub">${esc(sub)}</span>` : ''}${discNote}</div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="assist-edit" data-t="${t.key}" aria-label="${a.done ? 'Edit' : 'Add'} assistance for ${esc(t.label)}">${a.done ? 'Edit' : 'Add'}</button></li>`;
  }).join('');
  const err = prob.length ? `<p class="ads-helper ads-helper--error" id="atl-err" role="alert">${ic('alert-diamond')}<span>${esc(prob[0])}</span></p>` : '';
  return `<div class="atl"><p class="atl__head">${list.length > 1 ? 'Answer for each traveler who needs help. Others can stay without answers.' : 'Answer the questions for this traveler.'}</p><ul class="atl__list" aria-label="Assistance by traveler">${rows}</ul>${err}</div>`;
}

// ---------- Actions ----------
// Opening the questionnaire needs a connection (NMA-973); once open it can be finished offline (NMA-995–997)
function assistOffline(returnFocus) {
  if (V().net !== 'offline') return false;
  dialog({ title: 'You’re offline', body: 'Connect to the internet to answer the assistance questions. Your trip details are kept.', actions: [['OK', 'primary', null]], returnFocus });
  return true;
}
A['assist-edit'] = (t, ri) => {
  const key = (t && t.dataset && t.dataset.t) || firstKey(D().booking);
  if (assistOffline(`[data-a="assist-edit"][data-t="${key}"], [data-a="assist-edit"]`)) return;
  push('assist', { t: key }, +ri);
};
A['assist-toggle'] = (t, ri) => {
  const b = D().booking; b.assistOn = t.checked;
  if (b.assistOn && !b.assistDone) { /* as before: checking it starts with Traveler 1's questions */ if (assistOffline(`#${t.id}`)) { render(); return; } push('assist', { t: firstKey(b) }, +ri); return; }
  pendingFocus = `#${t.id}`; render();
};
A['fl-assist-on'] = (t, ri) => {
  const b = D().booking; b.assistOn = true;
  if (!b.assistDone) { if (assistOffline('[data-a="fl-assist-on"]')) { render(); return; } push('assist', { t: firstKey(b) }, +ri); return; }
  pendingFocus = '[data-a="assist-edit"]'; render();
};
A['assist-confirm'] = (t, ri) => {
  const r = routeAt(ri), x = r.u.d, b = D().booking, key = r.p.t || firstKey(b), who = (travelerList(b).find(z => z.key === key) || { label: 'Traveler 1' }).label;
  const e = assistErrors(x, 'booking', who);
  if (x.cat === 'companion' && !companionOpen(b, key)) e.cat = 'A personal companion needs another traveler with a disability who doesn’t have a companion yet.';
  if (Object.keys(e).length) { r.u.err = e; if (v2()) r.u.step = e.cat ? 'cat' : e.dis ? 'dis' : 'wc'; pendingFocus = '[aria-invalid="true"], .ads-helper--error'; render(); return; }
  setAssistRec(b, key, fromDraft(x)); b.assistOn = true;
  r.u.dirty = false; popTo(+ri - 1); pendingFocus = `[data-a="assist-edit"][data-t="${key}"], [data-a="assist-edit"]`; render();
};
