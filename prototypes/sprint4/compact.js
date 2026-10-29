/* Sprint 4 prototype: Version 4 (Compact). Dense, but nothing required is hidden:
   - the travelers row carries one small tag per traveler with their discount, assistance and companion
     pairing; a tag opens that traveler's short edit sheet (shared with Overview);
   - the assistance row keeps Add and Remove for the whole booking and gives every traveler one line with
     their own Add, Edit or Remove;
   - when offline, a first-time questionnaire can't open (NMA-973); the row says so in one line with Try again. */

const DISC_TAG = { pwd: 'PWD', companion: 'Companion', military: 'Military', rpa: 'RPA', senior: 'Senior', childfare: 'Child fare', infant: 'Lap infant', infantchild: 'Child fare', none: '' };
const tShort = t => `T${t.n}`;
function flTravelerTags(b) {
  const list = travelerList(b), std = ['standard', 'personal'].includes(intentOf(b));
  if (!list.length) return '';
  const tags = list.map(t => {
    const a = assistRec(b, t.key), c = assistCat(b, t.key), x = std ? tdiscOf(b, t) : null, err = travelerError(b, t);
    const parts = [], say = [];
    if (x && DISC_TAG[x]) { parts.push(`<span class="fl-tv__disc">${DISC_TAG[x]}</span>`); say.push(`${TDISC_LABEL[x]} discount`); }
    if (c && c !== 'none') { parts.push(`<span class="fl-tv__as">${ic('assistance', 'ads-icon--sm')}</span>`); say.push(`assistance: ${c === 'companion' ? 'personal companion' : CATS[c]}`); }
    else say.push('no assistance');
    if (c === 'companion') { const f = travelerList(b).find(z => z.key === a.m.for); parts.push(`<span class="fl-tv__pair">↔ ${f ? tShort(f) : '?'}</span>`); say.push(`personal companion to ${f ? f.label : 'no one'}`); }
    if (c === 'disability') { const comp = companionOf(b, t.key); if (comp) { parts.push(`<span class="fl-tv__pair">↔ ${tShort(comp)}</span>`); say.push(`personal companion: ${comp.label}`); } }
    return `<li><button class="fl-tv${err ? ' is-error' : ''}" type="button" data-a="ov-traveler" data-t="${t.key}" aria-label="${esc(t.label)}: ${esc(say.join(', '))}${err ? '. Needs a change' : ''}. Edit"><b>${tShort(t)}</b><span class="fl-tv__type">${esc(t.short.replace(/^You · /, 'You, '))}</span>${parts.join('')}${err ? ic('alert-diamond', 'ads-icon--sm fl-tv__err') : ''}</button></li>`;
  }).join('');
  return `<ul class="fl-tvs" aria-label="Travelers, tap to edit one">${tags}</ul>`;
}
// One line per traveler, with their own Add, Edit or Remove
function flAssistLines(b) {
  const lines = travelerList(b).map(t => {
    const a = assistRec(b, t.key), on = a.done, c = on ? a.m.cat : null, items = on ? assistSummaryItems(a.m) : [], err = travelerError(b, t);
    const what = !on ? 'None' : c === 'none' ? 'No help needed' : c === 'companion' ? `Personal companion to ${tShort(travelerList(b).find(z => z.key === a.m.for) || { n: '?' })}` : items[0];
    const more = on && c !== 'companion' ? items.slice(1).filter(x => x !== 'No other needs').join(' · ') : '';
    const acts = on ? flAct('assist-edit', 'Edit', `Edit assistance for ${t.label}`, `data-t="${t.key}"`) + flAct('assist-remove', 'Remove', `Remove assistance for ${t.label}`, `data-t="${t.key}"`) : flAct('assist-edit', 'Add', `Add assistance for ${t.label}`, `data-t="${t.key}"`);
    return `<li class="fl-al${err ? ' is-error' : ''}"><span class="fl-al__who">${tShort(t)} ${esc(t.short)}</span><span class="fl-al__what">${esc(what)}${more ? `<small>${esc(more)}</small>` : ''}${err ? `<small class="fl-al__err">${ic('alert-diamond', 'ads-icon--sm')}${esc(err)}</small>` : ''}</span><span class="fl-al__acts">${acts}</span></li>`;
  }).join('');
  const prob = assistProblems(b);
  return `<div class="fl-assistlist">${prob.length ? `<p class="ads-helper ads-helper--error" id="atl-err" tabindex="-1">${ic('alert-diamond')}<span>Assistance needs a change. See the marked traveler.</span></p>` : ''}<ul class="fl-als" aria-label="Assistance by traveler">${lines}</ul></div>`;
}
// One-line offline explanation with a way forward
function flOfflineNote(b) {
  if (!b.assistOffline) return '';
  const t = travelerList(b).find(z => z.key === b.assistOffline) || { label: 'this traveler', key: b.assistOffline };
  return `<p class="fl-offline" id="fl-offline-note" role="status" tabindex="-1">${ic('alert-triangle', 'ads-icon--sm')}<span>Offline. ${esc(t.label)}’s questions need a connection the first time. Assistance stays on.</span>${flAct('assist-edit', 'Try again', `Try again: assistance for ${t.label}`, `data-t="${t.key}"`)}${flAct('assist-offline-ok', 'OK', 'Dismiss')}</p>`;
}
INFO.assistance = {
  title: 'Assistance',
  body: () => `<p>Tell us your travel needs, like a mobility device, a service animal, hearing loss or station assistance. Answer for each traveler who needs help; the others can stay without answers.</p><p>One traveler with a disability may bring one personal companion, who gets the Companion discount.</p><p>Answering the questions for the first time needs a connection. After that you can finish or review them offline. Finding trains needs a connection.</p><p class="info-draft">Final explanation text comes from AEM.</p>`
};
