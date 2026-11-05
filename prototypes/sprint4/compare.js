/* Sprint 4 prototype: design-team comparison settings (Prototype controls, never in the app). Both concepts.
   Each changes presentation only: the same state, handlers, rules and booking behaviour sit underneath, and
   switching keeps the current screen and every selection.
   - Traveler assistance layout: Current design / Content above traveler details. The "Traveler with disability or
     need help?" copy moves out of each traveler's card to one block above Traveler details.
   - Pass Rider Business Pass controls: Current design / Compact switcher and tabs. In the Business Pass scenario
     only, Booking type becomes a two-option segmented control (Pass Rider / Regular, same mode-pick handler) and
     Travel type becomes Business / Leisure tabs (same pr-type handler). */
const CMP = {
  assist: store.get('s4-cmp-assist') === 'above' ? 'above' : 'current',
  bp: store.get('s4-cmp-bp') === 'compact' ? 'compact' : 'current'
};
const assistAbove = () => CMP.assist === 'above';
// The Business Pass scenario: an employee with an active Business Pass whose booking types are Pass Rider and Regular
const bpScenario = d => !!(d.signedIn && d.passrider && d.passrider.business && d.passrider.role === 'employee' && !d.triplink);
const bpCompact = () => CMP.bp === 'compact' && bpScenario(D());
// The assistance copy, once, above Traveler details (content above traveler details)
const assistIntro = () => assistAbove() ? `<div class="tassist-intro" id="tassist-intro"><p class="tassist__label">${ASSIST_COPY.entryLabel}</p><p class="tassist__help">${ASSIST_COPY.entryHelp}</p></div>` : '';
// Booking type as a segmented control (replaces the Booking type entry and its sheet)
function bpModeSeg(b, where) {
  const cur = b.intent === 'pr' ? 'pr' : 'personal', id = `bpm-${where}`;
  return `<div class="bp-mode bp-mode--${where}"><span class="bp-mode__label" id="${id}">Booking type</span><div class="ads-segmented bp-seg" role="group" aria-labelledby="${id}">${[['pr', 'Pass Rider'], ['personal', 'Regular']].map(([v, l]) => `<button type="button" data-a="mode-pick" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div></div>`;
}
// Travel type as tabs (replaces the Business / Leisure switcher); none selected until chosen, like the switcher
function bpTypeTabs(b, labelId) {
  const opts = [['business', 'Business'], ['leisure', 'Leisure']], none = !b.prType;
  return `<div class="ads-tabs ads-tabs--fill bp-tabs" role="tablist" aria-labelledby="${labelId}">${opts.map(([k, l], i) => `<button class="ads-tab" type="button" role="tab" data-a="pr-type" data-v="${k}" aria-selected="${b.prType === k}" tabindex="${b.prType === k || (none && i === 0) ? 0 : -1}">${l}</button>`).join('')}</div>`;
}
// Controls in the Prototype controls panel, next to Concept
(function wireCompare() {
  const a = document.getElementById('tbCmpAssist'), p = document.getElementById('tbCmpBp');
  if (a) { a.value = CMP.assist; a.addEventListener('change', () => { CMP.assist = a.value; store.set('s4-cmp-assist', a.value); pendingFocus = null; render(); }); }
  if (p) { p.value = CMP.bp; p.addEventListener('change', () => { CMP.bp = p.value; store.set('s4-cmp-bp', p.value); pendingFocus = null; render(); }); }
})();
