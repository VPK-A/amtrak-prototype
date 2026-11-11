/* Sprint 4 prototype: settled design decisions. The design-team comparison settings (Traveler assistance layout,
   Pass Rider Business Pass controls, Pass Rider traveler selection, Station selector) were retired; the
   recommended design of each is the one the prototype uses:
   - Traveler assistance: the "Traveler with disability or need help?" copy stays in each traveler's card.
   - Booking type: one switch on the Fare Finder, styled like Pay with points (on by default; off is regular), and
     Business / Leisure as tabs in Traveler selection, with neither preselected (NMA-1016 AC2).
   - Pass Rider travelers: one checkbox per named rider; Companions keep the counter.
   - Station selector: From / To in the selector, and it stays open until both stations are chosen. */
const assistAbove = () => false;
const assistIntro = () => '';
const bpCompact = () => false;

// Pass Rider travel type: settled on Business / Leisure tabs in Traveler selection (the dropdown option was retired).
const prTypeInDropdown = () => false;
