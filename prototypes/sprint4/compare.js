/* Sprint 4 prototype: settled design decisions. The design-team comparison settings (Traveler assistance layout,
   Pass Rider Business Pass controls, Pass Rider traveler selection, Station selector) were retired; the
   recommended design of each is the one the prototype uses:
   - Traveler assistance: the "Traveler with disability or need help?" copy stays in each traveler's card.
   - Booking type: a compact dropdown on the Fare Finder (TripLink corporate or Regular, Pass Rider or Regular), and
     Business / Leisure as tabs in Traveler selection.
   - Pass Rider travelers: one checkbox per named rider; Companions keep the counter.
   - Station selector: From / To in the selector, and it stays open until both stations are chosen. */
const assistAbove = () => false;
const assistIntro = () => '';
const bpCompact = () => false;

// Prototype controls › Pass Rider travel type: where Business or Leisure is chosen.
// tabs: tabs in Traveler selection (current); dropdown: in the Booking type dropdown on New booking
// (Pass Rider — Business, Pass Rider — Leisure, Regular). Same state, rules and defaults underneath.
const PRTYPE = { v: store.get('s4-cmp-prtype') === 'dropdown' ? 'dropdown' : 'tabs' };
const prTypeInDropdown = () => PRTYPE.v === 'dropdown';
(function wirePrType() {
  const s = document.getElementById('tbCmpPrType'); if (!s) return;
  s.value = PRTYPE.v; s.addEventListener('change', () => { PRTYPE.v = s.value; store.set('s4-cmp-prtype', s.value); pendingFocus = null; render(); });
})();
