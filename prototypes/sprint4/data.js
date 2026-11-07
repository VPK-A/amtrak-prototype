/* Sprint 4 prototype: deterministic mock data. Nothing here is live. */
const TODAY = new Date(2026, 9, 28); // Wed, Oct 28, 2026 (fixed so the calendar is repeatable)
const WINDOW_DAYS = 335;             // NMA-1060 BR4.1 "verify # of days": unresolved (Q4), configurable here
const PASS_RENEWS = '2027-01-01';    // NMA-20 BR3: mock renewal date of new passes (the pass file supplies the real one)
const RECENT_DAYS = 10;              // NMA-984: recent stations are kept this many days (configurable)
// Recent stations to show: within the retention period, not already a favorite, most recent first
const recentList = d => d.rec.filter(x => x.d <= RECENT_DAYS && !d.fav.includes(x.c)).sort((a, b) => a.d - b.d);
// Favorites, alphabetically by city, then station name (NMA-118)
const favList = d => [...new Set(d.fav)].sort((a, b) => ST[a].city.localeCompare(ST[b].city) || ST[a].name.localeCompare(ST[b].name));

// code, city, state, st, station name, aliases, zip, tag
const STATIONS = [
  ['ABQ', 'Albuquerque', 'New Mexico', 'NM', 'Alvarado Transportation Center', '', '87102'],
  ['ALB', 'Albany', 'New York', 'NY', 'Albany-Rensselaer Station', 'Rensselaer', '12144'],
  ['ALX', 'Alexandria', 'Virginia', 'VA', 'Alexandria Union Station', '', '22314'],
  ['ATL', 'Atlanta', 'Georgia', 'GA', 'Peachtree Station', '', '30309'],
  ['BAL', 'Baltimore', 'Maryland', 'MD', 'Baltimore Penn Station', '', '21201'],
  ['BBY', 'Boston', 'Massachusetts', 'MA', 'Back Bay Station', '', '02116'],
  ['BOS', 'Boston', 'Massachusetts', 'MA', 'South Station', '', '02110'],
  ['BWI', 'Linthicum', 'Maryland', 'MD', 'BWI Marshall Airport Station', 'Baltimore Airport, Thurgood Marshall', '21240'],
  ['CHI', 'Chicago', 'Illinois', 'IL', 'Chicago Union Station', '', '60661'],
  ['CLT', 'Charlotte', 'North Carolina', 'NC', 'Charlotte Station', '', '28206'],
  ['DAL', 'Dallas', 'Texas', 'TX', 'Dallas Union Station', '', '75202'],
  ['DEN', 'Denver', 'Colorado', 'CO', 'Denver Union Station', '', '80202'],
  ['EMY', 'Emeryville', 'California', 'CA', 'Emeryville Station', 'San Francisco, Oakland', '94608'],
  ['EWR', 'Newark', 'New Jersey', 'NJ', 'Newark Liberty Intl. Airport Station', 'Newark Airport', '07114'],
  ['HAR', 'Harrisburg', 'Pennsylvania', 'PA', 'Harrisburg Transportation Center', '', '17104'],
  ['KCY', 'Kansas City', 'Missouri', 'MO', 'Kansas City Union Station', '', '64108'],
  ['LAX', 'Los Angeles', 'California', 'CA', 'Los Angeles Union Station', 'Hollywood', '90012'],
  ['LOR', 'Lorton', 'Virginia', 'VA', 'Lorton Auto Train Station', '', '22079', 'Auto Train'],
  ['MIA', 'Miami', 'Florida', 'FL', 'Miami Station', '', '33142'],
  ['MKE', 'Milwaukee', 'Wisconsin', 'WI', 'Milwaukee Intermodal Station', '', '53203'],
  ['NFK', 'Norfolk', 'Virginia', 'VA', 'Norfolk Station', '', '23510'],
  ['NHV', 'New Haven', 'Connecticut', 'CT', 'New Haven Union Station', 'Yale', '06511'],
  ['NOL', 'New Orleans', 'Louisiana', 'LA', 'Union Passenger Terminal', '', '70113'],
  ['NRO', 'New Rochelle', 'New York', 'NY', 'New Rochelle Station', '', '10801'],
  ['NWK', 'Newark', 'New Jersey', 'NJ', 'Newark Penn Station', '', '07105'],
  ['NYP', 'New York', 'New York', 'NY', 'Moynihan Train Hall at Penn Station', 'Penn Station, Manhattan, Madison Square Garden', '10001'],
  ['OKJ', 'Oakland', 'California', 'CA', 'Jack London Square', '', '94607'],
  ['ORL', 'Orlando', 'Florida', 'FL', 'Orlando Station', 'Disney', '32805'],
  ['PDX', 'Portland', 'Oregon', 'OR', 'Portland Union Station', '', '97209'],
  ['PGH', 'Pittsburgh', 'Pennsylvania', 'PA', 'Pittsburgh Union Station', '', '15222'],
  ['PHL', 'Philadelphia', 'Pennsylvania', 'PA', 'William H. Gray III 30th Street Station', '30th Street', '19104'],
  ['PVD', 'Providence', 'Rhode Island', 'RI', 'Providence Station', '', '02903'],
  ['RVR', 'Richmond', 'Virginia', 'VA', 'Staples Mill Road Station', '', '23228'],
  ['SAC', 'Sacramento', 'California', 'CA', 'Sacramento Valley Station', '', '95814'],
  ['SAN', 'San Diego', 'California', 'CA', 'Santa Fe Depot', 'Petco Park', '92101'],
  ['SAS', 'San Antonio', 'Texas', 'TX', 'San Antonio Station', 'Alamo', '78205'],
  ['SEA', 'Seattle', 'Washington', 'WA', 'King Street Station', 'Space Needle', '98104'],
  ['SFA', 'Sanford', 'Florida', 'FL', 'Sanford Auto Train Station', '', '32771', 'Auto Train'],
  ['SLC', 'Salt Lake City', 'Utah', 'UT', 'Salt Lake City Station', '', '84101'],
  ['STL', 'St. Louis', 'Missouri', 'MO', 'Gateway Station', 'Gateway Arch', '63103'],
  ['STM', 'Stamford', 'Connecticut', 'CT', 'Stamford Transportation Center', '', '06902'],
  ['TPA', 'Tampa', 'Florida', 'FL', 'Tampa Union Station', '', '33602'],
  ['TRE', 'Trenton', 'New Jersey', 'NJ', 'Trenton Transit Center', '', '08609'],
  ['WAS', 'Washington', 'District of Columbia', 'DC', 'Washington Union Station', 'Capitol', '20002'],
  ['WIL', 'Wilmington', 'Delaware', 'DE', 'Joseph R. Biden, Jr. Railroad Station', '', '19801']
].map(([code, city, state, st, name, aliases, zip, tag]) => ({ code, city, state, st, name, aliases: aliases ? aliases.split(', ') : [], zip, tag: tag || '' }));
const ST = Object.fromEntries(STATIONS.map(s => [s.code, s]));
const AUTO_TRAIN = { LOR: 'SFA', SFA: 'LOR' };

const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
const CA_PROVINCES = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'];
const COUNTRIES = [['US', 'United States'], ['CA', 'Canada'], ['GB', 'United Kingdom'], ['MX', 'Mexico'], ['DE', 'Germany'], ['FR', 'France'], ['IN', 'India'], ['JP', 'Japan'], ['AU', 'Australia'], ['BR', 'Brazil']];
// Phone country codes for International numbers (NMA-22: name + flag, shown as +44 not +0044)
const DIAL = [['GB', 'United Kingdom', '+44', '🇬🇧'], ['MX', 'Mexico', '+52', '🇲🇽'], ['DE', 'Germany', '+49', '🇩🇪'], ['FR', 'France', '+33', '🇫🇷'], ['IN', 'India', '+91', '🇮🇳'], ['JP', 'Japan', '+81', '🇯🇵'], ['AU', 'Australia', '+61', '🇦🇺'], ['BR', 'Brazil', '+55', '🇧🇷'], ['IE', 'Ireland', '+353', '🇮🇪'], ['IT', 'Italy', '+39', '🇮🇹']];

// Discount content stands in for AEM copy (NMA-43 BR6, NMA-566 BR2). It is placeholder text, not approved content.
const DISCOUNTS = {
  none: { label: 'No discount preference', info: 'You can still choose a discount when you book.' },
  military: { label: 'Military', info: 'Proof of status may be required. Eligibility details: content pending.' },
  rpa: { label: 'Rail Passenger Association', info: 'Your 6 to 10 digit membership ID is required. Eligibility details: content pending.' },
  pwd: { label: 'Passenger with disability', info: 'Saved automatically when your assistance says you have a disability.' }
};
const RULE_GROUPS = [
  ['Passenger types', ['Adult', 'Senior', 'Young adult', 'Youth', 'Child', 'Infant']],
  ['Traveler discounts', ['Military', 'Military child', 'Military veteran', 'Rail Passenger Association']],
  ['Accessibility', ['Adult with a disability', 'Child passenger with a disability', 'Companion']]
];

// Assistance content (NMA-26, 27, 28, 995, 996, 615). Descriptions come from the Core Flow screens.
const DISABILITIES = [
  ['vision', 'Blind/vision loss', 'I am blind or have vision loss.'],
  ['hearing', 'Deaf/hearing loss', 'I am deaf or have hearing loss.'],
  ['mobility', 'Reduced mobility', 'I have reduced mobility.'],
  ['other', 'Other disability', 'I have accessibility needs not listed here.']
];
const NEEDS = [
  ['seat', 'Accessible seat', 'A seat with more room, near an accessible restroom.'],
  ['station', 'Station assistance', 'Help at the station, like boarding and luggage.'],
  ['animal', 'Service animal', 'A trained service animal traveling with you. Tell us its size.']
];
const CATS = {
  disability: 'I have a disability',
  station: 'I do not have a disability, but need assistance at the station',
  companion: 'I am a personal companion to a traveler with a disability',
  none: 'I do not need assistance'
};
// Assistance questionnaire copy (stands in for AEM-managed content: product and content can change any of it
// here). Option labels and descriptions are CATS, DISABILITIES and NEEDS above.
const ASSIST_COPY = {
  entryLabel: 'Traveler with disability or need help?', entryHelp: 'Like a wheelchair space, an accessible seat, station assistance or a personal companion.',
  addCta: 'Add assistance', editCta: 'Edit assistance', removeCta: 'Remove',
  animalSizeLegend: 'Size of your service animal',
  animalSizes: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']],
  largeBlocked: 'Not available with an accessible seat when you bring a wheelchair. Clear Accessible seat to choose this.',
  typeLegend: 'Type of help', profileTypeLegend: 'Assistance type',
  catHelp: { disability: '', station: 'Station assistance is included. The Passenger with disability discount doesn’t apply.', companion: 'Gets the Companion discount instead of other passenger discounts. Each traveler with a disability may bring one personal companion.', none: '' },
  companionNoDisability: 'Not available yet: another traveler on this booking needs to choose “I have a disability” first.',
  companionFor: 'Personal companion to', companionChoose: 'Choose a traveler',
  companionForHelp: 'Each traveler with a disability may bring one personal companion.',
  companionInvalid: who => `${who} no longer has a disability in assistance, or already has a personal companion. Choose another traveler, or another type of help.`,
  companionNone: 'No traveler on this booking can have a personal companion right now. Choose another type of help.',
  companionFull: 'Not available: each traveler with a disability may bring one personal companion, and every traveler with a disability on this booking already has one.',
  disLegend: 'Select applicable disabilities',
  wcQuestion: 'Will you bring a wheelchair (need wheelchair space)?',
  needsLegend: 'Do you have other needs?', needsLocked: 'Select at least one disability above to choose other needs.',
  wcRule: 'With wheelchair space you can choose an accessible seat or a large service animal, not both. Small and medium service animals and station assistance are always available.',
  seatBlockedLarge: 'Not available with a large service animal when you bring a wheelchair. Clear Large service animal to choose this.',
  seatBlocked: 'Not available with a large service animal when you bring a wheelchair. Choose a smaller size or clear Service animal to choose this.',
  conflictTitle: 'Choose an accessible seat or a large service animal',
  conflictBody: 'With wheelchair space you can have one of them, not both. Which do you want to keep?',
  keepSeat: 'Keep accessible seat', keepAnimal: 'Keep large service animal',
  sizeCleared: 'The large size was cleared: choose small or medium, or clear Service animal.',
  stationIncluded: 'Station assistance is included with this answer.', stationSeatLegend: 'Do you need an accessible seat?',
  compLegend: 'Do you need help as a personal companion?', compSeatAfter: 'Available after you choose Station assistance.',
  largeAnimal: 'Large service animal', largeAnimalHelp: 'A trained service animal that needs more space. You’ll add small or medium service animals in Traveler information after you choose a fare.',
  animalLaterKept: size => `Your ${size} service animal is kept. You’ll confirm it in Traveler information after you choose a fare.`,
  animalLaterSummary: size => `Service animal (${size}): add details in Traveler information`,
  noneSelected: 'With nothing selected, no assistance is requested for this traveler.',
  noneSummary: 'No assistance requested', stationSummary: 'Station assistance included',
  removed: {
    disability: 'Disabilities and the wheelchair answer were removed: they only apply to “I have a disability”.',
    wc: 'The wheelchair answer was removed because Reduced mobility isn’t selected.',
    needs: (what, why) => `${what} ${/ and /.test(what) ? 'were' : 'was'} removed ${why}.`
  },
  why: { station: 'because it isn’t offered with station-only assistance', companion: 'because it isn’t offered to a personal companion', compSeat: 'because it needs Station assistance', none: 'because no assistance is requested', noDisability: 'because no disability is selected', wcChoice: 'so this traveler has wheelchair space with one of them' },
  err: { cat: who => `Choose a type of help for ${who}.`, dis: 'Choose at least one disability.', wc: 'Tell us whether you’ll bring a wheelchair.', conflict: 'Choose an accessible seat or a large service animal to keep.', size: 'Choose the size of your service animal.', forMissing: 'Choose the traveler you’re a personal companion to.' }
};
// People on each Pass Rider's pass record (sample data). The relationship (rel) is kept for eligibility and business
// rules only and is never shown; travelers are listed by name. kind (Adult or Child) and date of birth come from the
// record and prefill Traveler details. Who appears follows the pass holder's role (NMA-1017): an employee or
// retiree brings a spouse and dependents, a spouse brings the employee and dependents, a dependent brings the
// employee, the spouse and other dependents.
// One family shares the pass record. Who is signed in depends on the scenario (Alex: employee or retiree, Jordan:
// spouse, Maya: dependent 16 or older, Sam: dependent 15 or younger); everyone else on the record is listed by name.
const PR_FAMILY = [
  { id: 'alex', first: 'Alex', name: 'Alex Rivera', rel: 'employee', kind: 'adult', dob: '05/14/1985' },
  { id: 'jordan', first: 'Jordan', name: 'Jordan Rivera', rel: 'spouse', kind: 'adult', dob: '05/14/1987' },
  { id: 'maya', first: 'Maya', name: 'Maya Rivera', rel: 'dependent', kind: 'adult', dob: '03/12/2009' },
  { id: 'sam', first: 'Sam', name: 'Sam Rivera', rel: 'dependent', kind: 'child', dob: '06/02/2012' }
];
const PR_SELF = { 'passrider-spouse': 'jordan', 'passrider-dependent': 'maya', 'passrider-minor': 'sam' };
const prSelf = sc => PR_FAMILY.find(p => p.id === (PR_SELF[sc] || 'alex'));
// The other people on the pass record for whoever is signed in (a retiree's record has the spouse and Maya)
const prRoster = (selfId, role) => PR_FAMILY.filter(p => p.id !== selfId && !(role === 'retiree' && p.id === 'sam')).map(p => Object.assign({}, p));
// Reviewer scenarios for the assistance questionnaire (Scenario menu). Each sets up a booking after the base seed.
const asst = (cat, o = {}) => ({ m: Object.assign({ cat, dis: [], wc: null, needs: [], for: null }, o), done: true });
const ASSIST_DEMO = {
  'assist-multi': (d, b) => {
    b.pax = { adult: 3, senior: 1, ya: 0, youth: 0, child: 0, infant: 0 };
    b.assist = asst('disability', { dis: ['vision', 'mobility'], wc: true, needs: ['station', 'seat'] }).m; b.assistDone = true; b.assistFromProfile = false;
    b.ta = { 'adult-2': asst('companion', { for: 'adult-1', needs: ['station', 'seat'] }), 'adult-3': asst('station', { needs: ['seat'] }), 'senior-1': asst(null) };
    b.ask = { 'adult-1': true, 'adult-2': true, 'adult-3': true, 'senior-1': true }; b.formLoaded = true; b.taSeen = { 'adult-1': true, 'adult-2': true, 'adult-3': true, 'senior-1': true };
  },
  'assist-invalid': (d, b) => {
    b.pax = { adult: 2, senior: 0, ya: 0, youth: 0, child: 0, infant: 0 };
    b.assist = asst(null).m; b.assistDone = true; b.assistFromProfile = false;
    b.ta = { 'adult-2': asst('companion', { for: 'adult-1', needs: ['station'] }) };
    b.ask = { 'adult-1': true, 'adult-2': true }; b.taSeen = { 'adult-1': true, 'adult-2': true };
  },
  'passrider-assist': (d, b) => {
    d.passrider.compLeft = 5; b.intent = 'pr'; b.prType = 'leisure'; b.prPax = { me: true, people: { jordan: 1, maya: 1 }, comp: 1 };
    b.assist = asst('disability', { dis: ['hearing'], wc: null, needs: ['station'] }).m; b.assistDone = true; b.assistFromProfile = false;
    b.ta = { 'pr-jordan': asst('companion', { for: 'pr-you', needs: ['station'] }), 'pr-maya': asst('station') };
    b.ask = { 'pr-you': true, 'pr-jordan': true, 'pr-maya': true }; b.taSeen = { 'pr-you': true, 'pr-jordan': true, 'pr-maya': true };
  }
};

// Scenarios seed one version's data. Each version keeps its own copy.
const SCENARIOS = [
  ['returning', 'Returning member (default)', 'Signed in. One favorite, three recent stations, nothing saved for discounts or assistance.'],
  ['new', 'New user, no favorites or recents', 'Signed in, but no station history. Station search opens on the full list.'],
  ['assist', 'Saved assistance and PWD discount', 'Profile assistance says “I have a disability”, so a new booking starts with assistance on, Traveler 1’s answers prefilled from the profile and the PWD discount (NMA-614, NMA-612 BR6). Changes for the trip don’t change the profile.'],
  ['rpa', 'Saved RPA discount', 'Rail Passenger Association saved with a membership ID, so booking starts with that discount (NMA-612).'],
  ['mi', 'Middle initial already added', 'The one-time middle initial is saved and locked (NMA-19).'],
  ['intl', 'International member', 'International phone number and a UK billing address.'],
  ['unverified', 'Unverified account', 'Saving a Profile change asks for verification first, then finishes the save (NMA-980 scenario 6).'],
  ['triplink', 'TripLink member', 'Signed in with an account connected to Concur TripLink. Every version shows Corporate or Personal booking; Corporate is the default (NMA-622).'],
  ['triplink-passrider', 'TripLink and Pass Rider (both)', 'Linked to Concur and holds an employee pass. Both mode controls show and neither is preselected: no precedence is defined for an account eligible for both (Q26).'],
  ['passrider', 'Pass Rider employee, Business Pass', 'Employee Pass Rider with an active Business Pass and 5 of 16 companion passes left. Business or Leisure must be chosen before Find trains (NMA-623, 1016–1018).'],
  ['passrider-nopass', 'Pass Rider employee, no Business Pass', 'Employee without a Business Pass, so Leisure only, and 0 companion passes left: Companions show but are disabled (NMA-1016 AC3, NMA-1018 AC8).'],
  ['passrider-retiree', 'Pass Rider retiree', 'Retiree: Leisure only, can bring a spouse and dependents, no companion passes (NMA-1016 AC3, NMA-1017 AC2, NMA-1018 AC2).'],
  ['passrider-spouse', 'Pass Rider spouse', 'Spouse Pass Rider: Leisure only, can bring the employee and dependents, no companion passes (NMA-1016 AC3, NMA-1017 AC3, NMA-1018 AC2).'],
  ['passrider-dependent', 'Pass Rider dependent, 16 or older', 'Dependent 16 or older: Leisure only, can book on their own and bring the employee, their spouse and other dependents (NMA-1017 AC4). The age comes from this fixture: the pass file has no date of birth.'],
  ['passrider-removed', 'Pass Rider employee, pass removed', 'The backend found this member is no longer eligible, so their Pass number, Personal index number and designation were removed from the app (NMA-20 BR4 AC4). Profile shows no pass details and Pass Rider booking isn’t offered.'],
  ['passrider-minor', 'Pass Rider dependent, 15 or younger', 'Dependent 15 or younger: can’t book Pass Rider travel on their own, so the Fare Finder starts as Regular (NMA-1017 table, AC5). The age comes from this fixture.'],
  ['assist-multi', 'Assistance: 4 travelers, different needs', 'Traveler 1 has vision loss and reduced mobility with wheelchair space, station assistance and an accessible seat; Traveler 2 is a personal companion with station assistance and a seat; Traveler 3 needs station assistance and a seat; Traveler 4 needs no assistance (NMA-615, 995–997).'],
  ['assist-invalid', 'Assistance: companion needs reassignment', 'Traveler 2 is a personal companion to Traveler 1, but Traveler 1 needs no assistance, so the pairing is invalid: Find trains is blocked until it’s fixed (NMA-615 BR2.1).'],
  ['passrider-assist', 'Assistance: Pass Rider Leisure family', 'Pass Rider Leisure with Jordan, Maya and a Companion Pass traveler. You: hearing loss with station assistance; Jordan: a personal companion; Maya: station assistance; the Companion Pass traveler hasn’t asked for help (a Companion Pass isn’t a personal companion) (NMA-1019).'],
  ['guest', 'Guest (signed out)', 'No Profile. Booking assistance starts unchecked. Account › Sign in shows the verification step for a device that isn’t remembered.']
];
const NETWORKS = [['online', 'Online'], ['offline', 'Offline'], ['slow', 'Slow connection (120-second timeout)'], ['slow6', 'Slow connection (6-second timeout, demo)'], ['error', 'Server error']];

// Open questions shown as Q markers in the prototype and in the notes panel
const QUESTIONS = {
  1: ['Station ranking', 'NMA-600 lists two different priority orders. The prototype uses the first: code, city, state, station name, ZIP, landmark.'],
  2: ['Pseudo-stations', 'Results should hide pseudo-stations, but the story doesn’t define them. None are in the mock data.'],
  3: ['Select or view details', 'NMA-600 S4 says a tapped result opens station details (NMA-604). In Fare Finder a tap has to select, so the prototype selects. A separate details control is proposed.'],
  4: ['Booking window (NMA-1060)', 'Unresolved: the 335-day limit and its reference date need confirmation. The prototype keeps 335 days as a setting (WINDOW_DAYS), disables dates beyond it and doesn’t state a limit to customers.'],
  5: ['Country change and the address', 'The criteria say changing country clears the fields; a note says UX decides. The prototype clears them and offers Undo.'],
  6: ['Phone types and DOB bounds', 'Are Home/Business/Extension the final phone types? Does changing the country code clear the number (the prototype keeps each region’s number)? DOB only rejects future dates.'],
  7: ['Assistance entry: proposed mapping (NMA-973)', 'Proposed, not approved: each traveler has their own “Traveler with disability or need help?” checkbox inside Traveler details on the Travelers screen (direction: per traveler, not one checkbox for the whole Travelers section). Checking it opens that traveler’s questions straight away (a connection is needed the first time; once loaded they can be finished offline). If the questions are abandoned, the box stays checked and the traveler shows Add. Only checked travelers answer (NMA-615 BR1.2 said every traveler answers once assistance is on: confirm this per-traveler reading). Unchecking keeps that traveler’s answers for the trip but stops them counting. The Fare Finder’s Travelers summary shows how many have answered. Signed-in members start with the account holder checked and prefilled from Profile when saved requests or a disability discount exist (NMA-614); trip changes never write back. The explanation text is an AEM placeholder. Save to Profile (NMA-1051) and later Traveler Info aren’t part of Sprint 4.'],
  21: ['Discount code placement', 'Proposed placement, not a confirmed requirement: the always-visible Discount code field sits after the traveler summary and assistance check, before Pay with and Find trains. NMA-613 doesn’t set a position. Saved codes open from “Use a saved code” rather than when the field is tapped, so typing isn’t interrupted (scenario 5 says the pop-up opens “when selecting to add discount”). The label follows sentence case (“Discount code”).'],
  23: ['Discount code format and offline', 'Two conflicts in NMA-613. Format: the front-end rule says “4 or 14 digits” while the Rules say 4- and 14-character alphanumeric codes; the prototype accepts letters and numbers. Offline: the story says “All functionality works offline”, but scenario 15 says a code that can’t be checked must not be applied. The prototype lets you enter and remove a code offline; checking it needs a connection (and so does Find trains).'],
  24: ['Pending approvals: Pass Rider assistance and employee profile', 'NMA-1019 (assistance on Pass Rider bookings) and NMA-20 (employee pass details in profile) are awaiting approval. The prototype keeps assistance available for every Pass Rider traveler (NMA-623 AC4) and keeps the existing employee pass editor; neither is counted as verified coverage.'],
  22: ['Navigation while booking', 'Booking opens as a modal flow and hides the bottom navigation, as asked. Account and Notification inbox still open as sheets over the app with the navigation visible behind them, which is inconsistent. The App Shell IA doesn’t say which flows hide it.'],
  8: ['Verification channel', 'Email only or email and text depends on the trigger, and is still open (NMA-980). The flows here are demonstrations, not approved policy.'],
  15: ['Reauthentication to change email', 'Conflict: NMA-21 BR3 and BR4 ask for Verify it’s you only when the access token (40 minutes) has expired, and go straight to the new email otherwise. NMA-980 scenario 12 always requires signing in again. The prototype follows NMA-21: Scenario › Session token chooses which path you see.'],
  16: ['Pass Rider identifiers', 'NMA-623 says the Pass Rider experience needs a SAP ID and Index number in the profile; NMA-20 stores a 9-digit Pass number and a 3-digit Personal index number. The prototype uses NMA-20’s fields. How the relationship (employee, spouse, dependent) is known, and whether the dependent experience differs (NMA-623 AC3–AC6), are open.'],
  17: ['Coupon retention and notices', 'NMA-697 BR5 keeps used and expired coupons for “X” days, and BR8’s notification channels (new coupon, expiring soon) aren’t defined. The prototype shows them without a time limit and marks coupons that expire within 30 days.'],
  20: ['Fares on the calendar', 'Removed after stakeholder feedback: the calendar shows no prices or fare shading. A fare calendar has no Sprint 4 story or fare source; if it returns it needs a fares service and a decision on which fare to show.'],
  19: ['Who can be a personal companion', 'NMA-615 says a personal companion needs a traveler with a disability, and each of them may bring one. It doesn’t say which passenger types can be a companion (for example a Child or Infant), or how the pairing is recorded. The companion chooses who they accompany (Personal companion to, listed as Traveler 1, Traveler 2…) so the one-each rule can be checked. Summaries don’t repeat the pairing.'],
  18: ['Wheelchair and mobility device details (NMA-29)', 'Partly defined, awaiting clarification: the story asks for device details under “I have a disability and reduced mobility”, its prerequisite names “I do not have a disability, but need assistance”, and most of its table is still Open. Not built beyond the existing wheelchair question.'],
  10: ['Young adult with an infant', 'Conflict in NMA-611. BR7 lets an infant travel with an Adult, Senior or Young adult, and BR3 seats lap infants 1:1 with those three types. BR9 says a Young adult can’t bring a Youth, Child or Infant without an Adult or Senior. The prototype follows BR9 (blocked) and counts Young adults toward lap seats. This case isn’t counted as verified until it’s decided. Age bands follow the CORE rules listed in the story (Adult 18–64, Senior 65+, Young adult 16–17, Youth 13–15, Child 2–12, Infant under 2).'],
  11: ['Discount codes before a train is chosen', 'Code eligibility depends on the train (NMA-613 scenarios 7–9). Fare Finder only checks the format and the rules it can know (companion coupons need two travelers); the rest is checked by the back end when you find trains.'],
  12: ['Corporate Auto Train and PWD in restricted modes', 'NMA-622 AC8 asks for an error after Find trains when a Corporate search includes Auto Train; the current app switches to Personal instead. The prototype shows the error with a Switch to Personal action. Pass Rider blocks Auto Train for Business travel only (NMA-1016 AC4). Whether the Passenger with disability discount applies to Corporate or Pass Rider travel is open; neither applies it.'],
  13: ['Pass Rider travelers and companion passes', 'NMA-1017 doesn’t give counts per group; the prototype allows one spouse (two parents for a dependent), up to 6 dependents and companions, 8 travelers in all. Unresolved (NMA-1018): whether a round trip uses companion passes per companion or per booking, and the picker limit that follows. The picker only stops at the remaining balance and searching never uses passes. Pass Rider policy is a placeholder (NMA-1081).'],
  14: ['Cash or points (NMA-624)', 'Approved: guests and members can choose Points before results, cash by default. Members see their balance; a guest signs in after choosing a fare, so choosing Points doesn’t ask them to sign in. Hidden for Pass Rider and TripLink Corporate. Whether traveler discounts apply to points searches isn’t defined; the prototype keeps them and hides the discount code (NMA-613).'],
  25: ['Missing return date (NMA-1060)', 'Unresolved: whether a round trip without a return shows a message or disables Find trains. The prototype shows an error on the return field when Find trains is tapped.'],
  26: ['Accounts eligible for TripLink and Pass Rider', 'No precedence is defined for a member who is both a TripLink traveler and a Pass Rider. The prototype shows both mode controls and preselects neither (Scenario › TripLink and Pass Rider).'],
  9: ['Replacing or removing PWD', 'Saving “I have a disability” replaces the current discount with PWD. What happens to PWD when assistance changes to station help, or is cleared, follows the NMA-43 table where it gives an answer and is open otherwise.']
};

// Flow navigator: every entry is reached through its real App Shell path
const FLOWS = [
  ['App shell', [['tab:book', 'Book (tab)'], ['tab:trips', 'Trips (tab)'], ['tab:train-status', 'Train status (tab)'], ['tab:support', 'Support (tab)']]],
  ['A · Booking and stations', [['ff', 'Fare Finder · one-way'], ['ff-rt', 'Fare Finder · round-trip'], ['stations:from', 'Station search · From'], ['stations:to', 'Station search · To'], ['calendar:dep', 'Calendar · Depart'], ['travelers', 'Traveler selection'], ['code', 'Discount code sheet (archived concepts)'], ['handoff', 'Find trains · prototype handoff'], ['clear-recents', 'Clear recent stations']]],
  ['B · Profile details', [['account', 'Account sheet'], ['profile', 'Profile overview'], ['edit:mi', 'Middle initial'], ['edit:phone', 'Phone'], ['edit:address', 'Billing address'], ['edit:dob', 'Date of birth'], ['edit:employee', 'Amtrak employee pass'], ['coupons', 'My coupons']]],
  ['C · Discounts', [['discounts', 'Passenger discounts'], ['rules', 'Passenger types and discount rules']]],
  ['D · Assistance', [['assist-profile', 'Profile assistance'], ['assist-booking', 'Booking assistance'], ['assist-review', 'Booking assistance · review']]],
  ['E · Verification', [['verify:change-email', 'Change email'], ['verify:sign-in', 'Sign-in on a device that isn’t remembered'], ['verify:unverified', 'Unverified account · save a change']]],
  ['J · Sprint 4 coverage, New booking', [
    ...[1].flatMap(n => [[`v${n}:returning:companion`, `V${n} · 2 travelers: disability and personal companion`], [`v${n}:triplink:ff`, `V${n} · TripLink Corporate`], [`v${n}:passrider:ff`, `V${n} · Pass Rider employee`], [`v${n}:passrider-retiree:ff`, `V${n} · Pass Rider retiree`], [`v${n}:passrider-dependent:ff`, `V${n} · Pass Rider dependent (16+)`], [`v${n}:passrider-minor:ff`, `V${n} · Pass Rider dependent (15 or younger)`]])]],
  // Archived concepts (stakeholder feedback): kept and usable, listed last
  ['Archive · Concept 2 · Guided Fare Finder', [['v2:returning:ff', 'Initial: Where open'], ['v2:returning:partial', 'Partly completed: stations chosen, When open'], ['v2:returning:populated', 'Fully populated, all sections collapsed'], ['v2:returning:reopened', 'Reopened section (Where) with answers kept'], ['v2:returning:validate', 'Error: Find trains with no stations'], ['v2:returning:whoerror', 'Error: child without an adult'], ['v2:returning:stations', 'Station search'], ['v2:returning:who', 'Who: travelers, assistance, discounts'], ['v2:returning:assist', 'Assistance questionnaire'], ['v2:returning:code', 'Discount code'], ['v2:returning:points', 'Paying with points'], ['v2:returning:autotrain', 'Auto Train pairing'], ['v2:guest:ff', 'Guest'], ['v2:triplink:ff', 'TripLink · Corporate'], ['v2:passrider:who', 'Pass Rider · Leisure travelers'], ['v2:passrider-spouse:ff', 'Pass Rider · spouse']]],
  ['Archive · Concept 4 · Compact Fare Finder', [['v4:returning:ff', 'Default: returning member'], ['v4:returning:populated', 'Populated: round trip, 3 travelers, assistance, code'], ['v4:returning:errors', 'Validation errors'], ['v4:returning:loading', 'Loading (slow connection)'], ['v4:returning:offline', 'Offline'], ['v4:guest:ff', 'Guest'], ['v4:returning:stations', 'Station sheet'], ['v4:returning:calendar', 'Dates sheet'], ['v4:returning:travelers', 'Traveler details sheet'], ['v4:returning:code', 'Discount code sheet'], ['v4:returning:points', 'Paying with points'], ['v4:returning:autotrain', 'Auto Train pairing'], ['v4:triplink:ff', 'TripLink · Corporate'], ['v4:passrider:ff', 'Pass Rider · Business Pass'], ['v4:passrider-spouse:ff', 'Pass Rider · spouse']]],
  ['Archive · coverage, Concepts 2 and 4', [
    ...[2, 4].flatMap(n => [[`v${n}:returning:companion`, `V${n} · 2 travelers: disability and personal companion`], [`v${n}:triplink:ff`, `V${n} · TripLink Corporate`], [`v${n}:passrider:ff`, `V${n} · Pass Rider employee`], [`v${n}:passrider-dependent:ff`, `V${n} · Pass Rider dependent (16+)`]])]],
];

// Traveler types (NMA-611). Age bands aren't final (Q10).
const PAX = [['adult', 'Adult', 'Ages 18 to 64'], ['senior', 'Senior', 'Ages 65 and over'], ['ya', 'Young adult', 'Ages 16 and 17'], ['youth', 'Youth', 'Ages 13 to 15'], ['child', 'Child', 'Ages 2 to 12'], ['infant', 'Infant', 'Under 2']];
const PAX_LABEL = Object.fromEntries(PAX.map(([k, l]) => [k, l]));
// Traveler discount choices per type (NMA-612 BR5, expected new app values). null = fixed, not editable.
const TDISC = { adult: ['none', 'military', 'rpa'], ya: ['none', 'military', 'rpa'], youth: ['none', 'military', 'rpa'], child: ['childfare', 'military'], senior: null, infant: null };
const TDISC_LABEL = { none: 'No discount', military: 'Military', rpa: 'Rail Passenger Association', childfare: 'Child fare', senior: 'Senior', infant: 'Infant', infantchild: 'Infant · Child fare', pwd: 'Passenger with disability', companion: 'Companion' };
// Codes saved to the signed-in member's profile (NMA-613 scenarios 5 and 6; NMA-697)
const PROFILE_CODES = [
  { code: 'V123', kind: 'Promotion code', name: 'Fall Northeast sale', benefit: '20% off Northeast Regional Coach', issued: '2026-10-01', exp: '2026-11-30' },
  { code: '60412233445566', kind: 'Companion coupon', name: 'Select Plus companion', benefit: 'A companion travels free', issued: '2026-07-15', exp: '2027-01-15', companion: true },
  { code: '60998877665544', kind: 'Dollar-off coupon', name: 'Service recovery credit', benefit: '$25 off one trip', issued: '2026-09-03', exp: '2027-03-31' }
];
// Used and expired coupons in My coupons (NMA-697 BR1, BR4 AC3: one line per use, newest first)
const PAST_CODES = [
  { code: '60123456789012', kind: 'Dollar-off coupon', name: 'Welcome credit', benefit: '$20 off one trip', issued: '2026-03-02', exp: '2026-12-31', uses: [{ pnr: 'A1B2C3', date: '2026-09-18' }, { pnr: 'Q9W8E7', date: '2026-06-02' }] },
  { code: '60555544443333', kind: 'Percentage coupon', name: 'Spring 15% off', benefit: '15% off one trip', issued: '2026-03-15', exp: '2026-06-30', uses: [] }
];
