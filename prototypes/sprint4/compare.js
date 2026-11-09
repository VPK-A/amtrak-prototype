/* Sprint 4 prototype: settled design decisions. The design-team comparison settings (Traveler assistance layout,
   Pass Rider Business Pass controls, Pass Rider traveler selection, Station selector) were retired; the
   recommended design of each is the one the prototype uses:
   - Traveler assistance: the "Traveler with disability or need help?" copy stays in each traveler's card.
   - Booking type: a compact dropdown on the Fare Finder (TripLink corporate or Regular, Pass Rider or Regular), and
     Business / Leisure as tabs in Traveler selection, with neither preselected (NMA-1016 AC2).
   - Pass Rider travelers: one checkbox per named rider; Companions keep the counter.
   - Station selector: From / To in the selector, and it stays open until both stations are chosen. */
const assistAbove = () => false;
const assistIntro = () => '';
const bpCompact = () => false;

// Pass Rider travel type: settled on Business / Leisure tabs in Traveler selection (the dropdown option was retired).
const prTypeInDropdown = () => false;
// Prototype controls › Pass Rider default travel type: switching it applies to the booking on screen too
(function wirePrDefault() {
  const s = document.getElementById('tbCmpPrDef'); if (!s) return;
  s.value = PRDEF.v;
  s.addEventListener('change', () => {
    PRDEF.v = s.value; store.set('s4-cmp-prdef', s.value);
    for (const k of Object.keys(VS)) { const d = VS[k].data, b = d.booking; if (d.passrider && d.passrider.business && b) { b.prType = PRDEF.v === 'leisure' ? 'leisure' : null; clearAutoTrainIfBlocked(b); } }
    pendingFocus = null; render();
  });
})();
