/* Sprint 4 prototype: Version 1 (Familiar) traveler details.
   A conventional, explicit structure: one card per traveler with labeled rows for Discount, Assistance and,
   where it applies, Personal companion. Errors sit on the traveler or field they belong to. Traveler
   Selection is a standard modal step: Cancel undoes everything changed on it, Done keeps it.
   The rules are the shared ones (travelers.js): assistance per traveler, one personal companion per traveler
   with a disability, the Companion discount override, Pass Rider and TripLink travelers. */

// Travelers who can be chosen as someone's personal companion: no other assistance request, not already a
// companion to someone else (Q19: which passenger types may be companions is open)
function companionCandidates(b, forKey) {
  return travelerList(b).filter(t => {
    if (t.key === forKey) return false;
    const c = assistCat(b, t.key);
    return !c || c === 'none' || (c === 'companion' && assistRec(b, t.key).m.for === forKey);
  });
}
function discountRow(b, t, fromProfile) {
  const it = intentOf(b);
  if (it === 'pr') { // Pass Rider: traveler type instead of a discount (NMA-1017 AC6, NMA-1018 AC7)
    if (t.key === 'pr-you') return famRow('Fare', 'Pass Rider fare', '');
    const k = prKind(b, t.key);
    return `<div class="fam-row"><label class="fam-row__label" for="pk-${t.key}">Traveler type</label><div class="ads-control ads-control--select"><select id="pk-${t.key}" data-f="pk" data-nodirty data-hook="prkind" data-key="${t.key}"><option value="adult" ${k === 'adult' ? 'selected' : ''}>Adult</option><option value="child" ${k === 'child' ? 'selected' : ''}>Child</option></select></div></div>`;
  }
  if (it === 'corporate') return famRow('Discount', 'Not used for corporate bookings', '');
  const x = tdiscOf(b, t), opts = discOpts(b, t), fixed = !opts || ['pwd', 'companion'].includes(x);
  const why = x === 'pwd' ? (profilePwd() && t.key === 'adult-1' && !assistRec(b, t.key).done ? 'Your profile says you have a disability.' : 'Set by assistance: this traveler has a disability.') : x === 'companion' ? 'Set by assistance: personal companion. It replaces other passenger discounts.' : x === 'senior' ? 'Applied automatically for seniors.' : x === 'infant' ? 'Rides on an adult’s, senior’s or young adult’s lap.' : ['infantchild', 'military'].includes(x) && t.type === 'infant' ? 'More infants than adults, seniors and young adults, so this infant takes a seat.' : 'One discount per traveler. Proof may be needed when you travel.';
  const lock = t.n === 1 && ((fromProfile && x === b.disc) || (x === 'pwd' && profilePwd() && !assistRec(b, t.key).done)) ? ' <span class="ads-lock">From your profile</span>' : '';
  if (fixed) return famRow('Discount', `${TDISC_LABEL[x]}${lock}`, why, `fd-${t.key}`);
  return `<div class="fam-row"><label class="fam-row__label" for="td-${t.key}">Discount${lock}</label><div class="ads-control ads-control--select"><select id="td-${t.key}" data-f="td" data-nodirty data-hook="tdisc" data-key="${t.key}" aria-describedby="td-${t.key}-h">${opts.map(o => `<option value="${o}" ${x === o ? 'selected' : ''}>${o === 'none' ? 'Select a discount' : TDISC_LABEL[o]}</option>`).join('')}</select></div><p class="ads-helper" id="td-${t.key}-h">${why}</p></div>`;
}
// Actions sit under the summary they act on
const famRow = (label, value, help, id = '', actions = '') => `<div class="fam-row"><div class="fam-row__head"><span class="fam-row__label">${label}</span></div>${value ? `<span class="fam-row__value"${id ? ` id="${id}"` : ''}>${value}</span>` : ''}${help ? `<span class="ads-helper">${help}</span>` : ''}${actions ? `<span class="fam-row__acts fam-row__acts--below">${actions}</span>` : ''}</div>`;
// Shown while "Traveler with disability or need help?" is checked (NMA-973): every traveler answers (NMA-615 BR1.2)
function assistanceRow(b, t) {
  if (!b.assistOn) return '';
  const a = assistRec(b, t.key), done = a.done, c = done ? a.m.cat : null, items = done ? assistSummaryItems(a.m) : [];
  const value = !done ? 'Not answered yet' : c === 'none' ? 'No assistance needed' : esc(items[0]);
  const details = done ? items.slice(1).filter(x => x !== 'No other needs').map(esc).join(' · ') : 'Choose an option for this traveler.';
  const btn = (act, label) => `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="${act}" data-t="${t.key}" aria-label="${label} assistance for ${esc(t.label)}">${label}</button>`;
  const acts = done ? btn('assist-edit', 'Edit') + btn('assist-remove', 'Remove') : btn('assist-edit', 'Answer');
  const tag = done && t.key === holderKey(b) && a.fromProfile ? ' <span class="ads-lock">From your profile</span>' : '';
  ref('615', '973');
  return famRow(`Disability or assistance${tag}`, value, details, '', acts);
}
function companionRow(b, t) {
  const c = assistCat(b, t.key);
  if (c === 'companion') {
    const f = assistRec(b, t.key).m.for;
    return famRow('Personal companion', `Companion to <b>${esc(travelerLabel(b, f))}</b>`, 'To change this, edit this traveler’s assistance, or choose a different companion on their card.');
  }
  if (c !== 'disability') return '';
  const cur = companionOf(b, t.key), opts = companionCandidates(b, t.key);
  ref('615', '997');
  return `<div class="fam-row"><label class="fam-row__label" for="cmp-${t.key}">Personal companion <span class="ads-field__marker ads-field__marker--optional">Optional</span></label><div class="ads-control ads-control--select"><select id="cmp-${t.key}" data-f="cmp" data-nodirty data-hook="famcomp" data-for="${t.key}" aria-describedby="cmp-${t.key}-h"><option value="">No personal companion</option>${opts.map(o => `<option value="${o.key}" ${cur && cur.key === o.key ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div><p class="ads-helper" id="cmp-${t.key}-h">${opts.length ? 'A traveler with a disability may bring one personal companion. Their discount becomes Companion.' : 'Add another traveler without an assistance request to choose a personal companion.'} ${q(19)}</p></div>`;
}
function travelerCards(b) {
  const d = D(), list = travelerList(b), fromProfile = d.signedIn && ['military', 'rpa'].includes(d.discount.type) && b.disc === d.discount.type;
  if (!list.length) return '';
  const cards = list.map(t => {
    const err = travelerError(b, t), id = `tc-${t.key}`;
    return `<li class="fam-card${err ? ' has-error' : ''}" id="${id}" aria-labelledby="${id}-h"${err ? ` aria-describedby="${id}-err"` : ''}><h4 class="fam-card__title" id="${id}-h">${esc(t.label)}</h4>${discountRow(b, t, fromProfile)}${assistanceRow(b, t)}${companionRow(b, t)}${err ? `<p class="ads-helper ads-helper--error" id="${id}-err">${ic('alert-diamond')}<span>${esc(err)}</span></p>` : ''}</li>`;
  }).join('');
  return `<section class="fam-travelers" aria-labelledby="fam-h"><h3 class="ffc-h" id="fam-h">Traveler details</h3><ul class="fam-cards">${cards}</ul>${q(7)}</section>`;
}
// Choosing a companion on the traveler with a disability's card
HOOKS.famcomp = (r, t) => {
  const b = D().booking, forKey = t.dataset.for, pick = t.value, cur = companionOf(b, forKey);
  if (cur && cur.key !== pick) clearAssistRec(b, cur.key);
  if (pick) { setAssistRec(b, pick, { cat: 'companion', for: forKey, dis: [], wc: null, needs: [] }); b.assistOn = true; }
  pendingFocus = `#cmp-${forKey}`;
  toast(pick ? `${travelerLabel(b, pick)} is now ${travelerLabel(b, forKey)}’s personal companion. Companion discount applies.` : `${travelerLabel(b, forKey)} has no personal companion`, pick ? 'success' : 'info');
};
// Errors on the counters they belong to (NMA-611 BR3, BR4); the rule itself is the shared one (Q10)
function paxErrorFor(p, k) {
  const grown = p.adult + p.senior;
  if (k === 'youth' && p.youth && !grown) return 'Youths need an adult or senior on this booking.';
  if ((k === 'child' || k === 'infant') && p[k] && !grown) return k === 'infant' && p.ya ? 'Infants need an adult or senior on this booking.' : 'Children and infants need an adult 18 or older on this booking.';
  return '';
}
// Cancel: put back everything Traveler selection changed, including assistance
A['trav-cancel'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, s = r.u.snap;
  if (s) Object.assign(b, clone(s));
  r.u.snap = null; popTo(+ri - 1); pendingFocus = '[data-a="pick-travelers"]'; render();
};
