/* Sprint 4 prototype: design-team comparison settings (Prototype controls, never in the app). Both concepts.
   Each changes presentation only: the same state, handlers, rules and booking behaviour sit underneath, and
   switching keeps the current screen and every selection.
   - Traveler assistance layout: Current design / Content above traveler details. The "Traveler with disability or
     need help?" copy moves out of each traveler's card to one block above Traveler details.
   - Pass Rider Business Pass controls: Current design / Compact dropdown. In the Business Pass scenario only, the
     Booking type entry and the Business / Leisure switcher become one dropdown (Pass Rider — Business, Pass Rider —
     Leisure, Regular) that runs the same mode-pick and pr-type handlers. */
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
// Booking type and travel type in one dropdown. Options follow the existing rules: Business and Leisure apply to
// Pass Rider only (NMA-1016), so Regular is a single option. An option the rules don't allow stays visible but
// disabled, with the reason beneath. Neither travel type is preselected (NMA-1016 AC2): the dropdown starts on its
// prompt and Find trains stays disabled until a choice is made.
function bpComboOpts(d) {
  const can = prCanStart(d), biz = d.passrider.role === 'employee' && d.passrider.business;
  return [
    { v: 'pr:business', l: 'Pass Rider — Business', off: !can.ok ? can.text : !biz ? prLeisureWhy(d) : '' },
    { v: 'pr:leisure', l: 'Pass Rider — Leisure', off: !can.ok ? can.text : '' },
    { v: 'personal', l: 'Regular', off: '' }
  ];
}
function bpCombo(b, where) {
  const d = D(), opts = bpComboOpts(d), id = `bpc-${where}`;
  const cur = b.intent === 'pr' ? (b.prType ? `pr:${b.prType}` : '') : 'personal';
  const help = b.intent === 'pr' ? prTypeHelp(b) : 'Regular fares. Points, passenger discounts and codes can be used.';
  const why = opts.filter(o => o.off).map(o => `${o.l} isn’t available: ${o.off}`);
  return `<div class="bp-mode bp-mode--${where}"><label class="bp-mode__label" for="${id}">Booking type <span class="ads-field__marker ads-field__marker--required">Required</span></label>
    <div class="ads-control ads-control--select bp-combo"><select id="${id}" data-f="bpcombo" data-nodirty data-hook="bpcombo" aria-required="true" aria-describedby="${id}-h${why.length ? ` ${id}-why` : ''}">${cur ? '' : '<option value="" selected hidden>Choose booking and travel type</option>'}${opts.map(o => `<option value="${o.v}" ${o.v === cur ? 'selected' : ''} ${o.off ? 'disabled' : ''}>${o.l}${o.off ? ' (unavailable)' : ''}</option>`).join('')}</select>${ic('chevron-down')}</div>
    <p class="ads-helper bp-mode__help" id="${id}-h">${help}</p>${why.length ? `<p class="ads-helper bp-mode__help" id="${id}-why">${why.map(esc).join(' ')}</p>` : ''}</div>`;
}
// Selecting an option runs the existing handlers in order: booking type (mode-pick), then travel type (pr-type)
HOOKS.bpcombo = (r, t) => {
  const [mode, type] = t.value.split(':'); if (!mode) return;
  A['mode-pick']({ dataset: { v: mode } });
  if (mode === 'pr' && type && D().booking.intent === 'pr') A['pr-type']({ dataset: { v: type } });
  pendingFocus = '#' + t.id;
};
// Controls in the Prototype controls panel, next to Concept
(function wireCompare() {
  const a = document.getElementById('tbCmpAssist'), p = document.getElementById('tbCmpBp');
  if (a) { a.value = CMP.assist; a.addEventListener('change', () => { CMP.assist = a.value; store.set('s4-cmp-assist', a.value); pendingFocus = null; render(); }); }
  if (p) { p.value = CMP.bp; p.addEventListener('change', () => { CMP.bp = p.value; store.set('s4-cmp-bp', p.value); pendingFocus = null; render(); }); }
})();
