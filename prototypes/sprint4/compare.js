/* Sprint 4 prototype: settled design decisions. The design-team comparison settings (Traveler assistance layout,
   Pass Rider Business Pass controls, Pass Rider traveler selection, Station selector) were retired; the
   recommended design of each is the one the prototype uses:
   - Traveler assistance: the "Traveler with disability or need help?" copy stays in each traveler's card.
   - Booking type: a switch for TripLink and for Pass Rider on the Fare Finder (on by default; off is regular), and
     Business / Leisure as tabs in Traveler selection.
   - Pass Rider travelers: one checkbox per named rider; Companions keep the counter.
   - Station selector: From / To in the selector, and it stays open until both stations are chosen. */
const assistAbove = () => false;
const assistIntro = () => '';
const bpCompact = () => false;
