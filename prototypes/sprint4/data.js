/* Sprint 4 prototype: deterministic mock data. Nothing here is live. */
const TODAY = new Date(2026, 9, 28); // Wed, Oct 28, 2026 (fixed so the calendar is repeatable)
const WINDOW_DAYS = 335;             // NMA-1060 BR4.1 "verify # of days": unresolved (Q4)

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
  military: { label: 'Military', info: 'For active U.S. military and veterans. Proof of military status may be required.' },
  rpa: { label: 'Rail Passenger Association', info: 'For members of the Rail Passengers Association. Your membership ID is required.' },
  pwd: { label: 'Passenger with Disability', info: 'Saved automatically when your Assistance says you have a disability.' }
};
const RULE_GROUPS = [
  ['Passenger types', ['Adult', 'Senior', 'Young Adult', 'Youth', 'Child', 'Infant']],
  ['Traveler discounts', ['Military', 'Military Child', 'Military Veteran', 'Rail Passenger Association']],
  ['Accessibility', ['Adult with a Disability', 'Child Passenger with a Disability', 'Companion']]
];

// Assistance content (NMA-26, 27, 28, 995, 996, 615). Descriptions come from the Core Flow screens.
const DISABILITIES = [
  ['vision', 'Blind/Vision loss', 'I am blind or have vision loss.'],
  ['hearing', 'Deaf/Hearing loss', 'I am deaf or have hearing loss.'],
  ['mobility', 'Reduced mobility', 'I have reduced mobility.'],
  ['other', 'Other disability', 'I have accessibility needs not listed here.']
];
const NEEDS = [
  ['seat', 'Accessible seat', 'A seat with more room, near an accessible restroom.'],
  ['station', 'Station Assistance', 'Help at the station, like boarding and luggage.'],
  ['animal', 'Large service animal', 'Traveling with a small or medium service animal? You can add it in traveler information.']
];
const CATS = {
  disability: 'I have a disability',
  station: 'I do not have a disability, but need assistance at the station',
  companion: 'I am a personal companion to a traveler with a disability',
  none: 'I do not need assistance'
};

// Scenarios seed one version's data. Each version keeps its own copy.
const SCENARIOS = [
  ['returning', 'Returning member (default)', 'Signed in. One favorite, three recent stations, nothing saved for discounts or assistance.'],
  ['new', 'New user, no favorites or recents', 'Signed in, but no station history. Station search opens on the full list.'],
  ['assist', 'Saved assistance and PWD discount', 'Assistance saved as “I have a disability”, so PWD is the discount and booking assistance starts checked (NMA-614).'],
  ['rpa', 'Saved RPA discount', 'Rail Passenger Association saved with a membership ID, so booking starts with that discount (NMA-612).'],
  ['mi', 'Middle initial already added', 'The one-time middle initial is saved and locked (NMA-19).'],
  ['intl', 'International member', 'International phone number and a UK billing address.'],
  ['unverified', 'Unverified account', 'Saving a Profile change asks for verification first, then finishes the save (NMA-980 scenario 6).'],
  ['triplink', 'TripLink member (Version 3)', 'Signed in with an account connected to Concur TripLink. Version 3 shows Corporate or Personal booking; Corporate is the default (NMA-622).'],
  ['passrider', 'Pass Rider employee, Business Pass (Version 3)', 'Employee Pass Rider with an active Business Pass and 5 of 8 companion passes left (NMA-623, 1016–1019).'],
  ['passrider-nopass', 'Pass Rider employee, no Business Pass (Version 3)', 'Employee without a Business Pass, so Leisure only, and no companion passes left (NMA-1016 AC4, NMA-1018 AC7).'],
  ['passrider-spouse', 'Pass Rider spouse (Version 3)', 'Spouse Pass Rider: Leisure only, no companion passes (NMA-1016 AC5, NMA-1018 AC2).'],
  ['guest', 'Guest (signed out)', 'No Profile. Booking assistance starts unchecked. Account › Sign in shows the verification step for a device that isn’t remembered.']
];
const NETWORKS = [['online', 'Online'], ['offline', 'Offline'], ['slow', 'Slow connection'], ['error', 'Server error']];

// Open questions shown as Q markers in the prototype and in the notes panel
const QUESTIONS = {
  1: ['Station ranking', 'NMA-600 lists two different priority orders. The prototype uses the first: code, city, state, station name, ZIP, landmark.'],
  2: ['Pseudo-stations', 'Results should hide pseudo-stations, but the story doesn’t define them. None are in the mock data.'],
  3: ['Select or view details', 'NMA-600 S4 says a tapped result opens station details (NMA-604). In Fare Finder a tap has to select, so the prototype selects. A separate details control is proposed.'],
  4: ['Maximum booking window', 'Shown as 335 days, from the story’s note “verify # of days”. It applies to the return date and, as an assumption, to departure.'],
  5: ['Country change and the address', 'The criteria say changing country clears the fields; a note says UX decides. The prototype clears them and offers Undo.'],
  6: ['Phone types and DOB bounds', 'Are Home/Business/Extension the final phone types? Does changing the country code clear the number (the prototype keeps each region’s number)? DOB only rejects future dates.'],
  7: ['Where booking assistance starts', 'NMA-973 puts the checkbox on Fare Finder; Core Flow puts it in Traveler Selection. Switch between them in Scenario › Assistance entry.'],
  8: ['Verification channel and reauthentication', 'Email only or email and text depends on the trigger, and is still open (NMA-980). The flows here are demonstrations, not approved policy.'],
  10: ['Traveler age bands and who can accompany minors', 'Age ranges aren’t final (Young Adult changed to 16–17). NMA-611 lets Adult, Senior or Young Adult accompany youths, children and infants, but a note says only adults 18+ can. The prototype follows the business rule and flags the note.'],
  11: ['Discount codes before a train is chosen', 'Code eligibility depends on the train (NMA-613 scenarios 7–9). Fare Finder only checks the format and the rules it can know (companion coupons need two travelers); the rest is checked by the back end when you find trains.'],
  12: ['Corporate and Pass Rider restrictions not yet confirmed', 'Whether TripLink Corporate allows Auto Train, and whether the Passenger with Disability discount applies to Corporate or Pass Rider travel, are still open. The prototype allows Auto Train for Corporate, blocks it for Pass Rider, and applies no PWD discount in either.'],
  13: ['Pass Rider travelers', 'NMA-1017 lists family combinations but not the counts. The prototype allows one spouse (or employee), up to 6 dependents and, for employees, companions, up to 8 travelers in all. Business travel is the employee alone.'],
  9: ['Replacing or removing PWD', 'Saving “I have a disability” replaces the current discount with PWD. What happens to PWD when assistance changes to station help, or is cleared, follows the NMA-43 table where it gives an answer and is open otherwise.']
};

// Flow navigator: every entry is reached through its real App Shell path
const FLOWS = [
  ['App shell', [['tab:book', 'Book (tab)'], ['tab:trips', 'Trips (tab)'], ['tab:train-status', 'Train Status (tab)'], ['tab:support', 'Support (tab)']]],
  ['A · Booking and stations', [['ff', 'Fare Finder · one-way'], ['ff-rt', 'Fare Finder · round-trip'], ['stations:from', 'Station search · From'], ['stations:to', 'Station search · To'], ['calendar:dep', 'Calendar · Depart'], ['travelers', 'Traveler Selection'], ['handoff', 'Find Trains · prototype handoff'], ['clear-recents', 'Clear recent stations']]],
  ['B · Profile details', [['account', 'Account sheet'], ['profile', 'Profile overview'], ['edit:mi', 'Middle initial'], ['edit:phone', 'Phone'], ['edit:address', 'Billing address'], ['edit:dob', 'Date of birth']]],
  ['C · Discounts', [['discounts', 'Passenger discounts'], ['rules', 'Passenger types and discount rules']]],
  ['D · Assistance', [['assist-profile', 'Profile assistance'], ['assist-booking', 'Booking assistance'], ['assist-review', 'Booking assistance · review']]],
  ['G · Version 3 Fare Finder (CLEAR-inspired)', [['v3:returning:ff', 'Default: returning member'], ['v3:guest:ff', 'Guest'], ['v3:returning:stations', 'Station sheet · From'], ['v3:returning:calendar', 'Dates sheet · round trip'], ['v3:returning:travelers', 'Travelers and discounts'], ['v3:returning:code', 'Discount code sheet'], ['v3:returning:assist', 'Assistance entry'], ['v3:returning:errors', 'Validation errors'], ['v3:returning:autotrain', 'Auto Train pairing'], ['v3:triplink:ff', 'TripLink · Corporate booking'], ['v3:passrider:ff', 'Pass Rider · employee with Business Pass'], ['v3:passrider:travelers', 'Pass Rider · Leisure travelers and companions'], ['v3:passrider-nopass:travelers', 'Pass Rider · no companion passes left'], ['v3:passrider-spouse:ff', 'Pass Rider · spouse']]],
  ['H · Version 4 Fare Finder (Flighty-inspired)', [['v4:returning:ff', 'Default: returning member'], ['v4:returning:populated', 'Populated: round trip, 3 travelers, assistance, code'], ['v4:returning:errors', 'Validation errors'], ['v4:returning:loading', 'Loading (slow connection)'], ['v4:returning:offline', 'Offline'], ['v4:guest:ff', 'Guest'], ['v4:returning:stations', 'Station sheet'], ['v4:returning:calendar', 'Dates sheet'], ['v4:returning:travelers', 'Traveler details sheet'], ['v4:returning:code', 'Discount code sheet'], ['v4:returning:autotrain', 'Auto Train pairing'], ['v4:triplink:ff', 'TripLink · Corporate'], ['v4:passrider:ff', 'Pass Rider · Business Pass'], ['v4:passrider-spouse:ff', 'Pass Rider · spouse']]],
  ['I · Version 2 guided Fare Finder (Airbnb-inspired)', [['v2:returning:ff', 'Initial: Where open'], ['v2:returning:partial', 'Partly completed: stations chosen, When open'], ['v2:returning:populated', 'Fully populated, all sections collapsed'], ['v2:returning:reopened', 'Reopened section (Where) with answers kept'], ['v2:returning:validate', 'Error: Find Trains with no stations'], ['v2:returning:whoerror', 'Error: child without an adult'], ['v2:returning:stations', 'Station search'], ['v2:returning:who', 'Who: travelers, assistance, discounts'], ['v2:returning:assist', 'Assistance questionnaire'], ['v2:returning:code', 'Discount code'], ['v2:returning:autotrain', 'Auto Train pairing'], ['v2:guest:ff', 'Guest'], ['v2:triplink:ff', 'TripLink · Corporate'], ['v2:passrider:who', 'Pass Rider · Leisure travelers'], ['v2:passrider-spouse:ff', 'Pass Rider · spouse']]],
  ['E · Verification', [['verify:change-email', 'Change email'], ['verify:sign-in', 'Sign-in on a device that isn’t remembered'], ['verify:unverified', 'Unverified account · save a change']]]
];

// Traveler types (NMA-611). Age bands aren't final (Q10).
const PAX = [['adult', 'Adult', 'Ages 18 to 64'], ['senior', 'Senior', 'Ages 65 and over'], ['ya', 'Young Adult', 'Ages 16 and 17'], ['youth', 'Youth', 'Ages 13 to 15'], ['child', 'Child', 'Ages 2 to 12'], ['infant', 'Infant', 'Under 2']];
const PAX_LABEL = Object.fromEntries(PAX.map(([k, l]) => [k, l]));
// Traveler discount choices per type (NMA-612 BR5, expected new app values). null = fixed, not editable.
const TDISC = { adult: ['none', 'military', 'rpa'], ya: ['none', 'military', 'rpa'], youth: ['none', 'military', 'rpa'], child: ['childfare', 'military'], senior: null, infant: null };
const TDISC_LABEL = { none: 'No discount', military: 'Military', rpa: 'Rail Passenger Association', childfare: 'Child fare', senior: 'Senior', infant: 'Infant', infantchild: 'Infant · Child fare', pwd: 'Passenger with Disability' };
// Codes saved to the signed-in member's profile (NMA-613 scenarios 5 and 6; NMA-697)
const PROFILE_CODES = [
  { code: 'V123', kind: 'Promo code', benefit: '20% off Northeast Regional Coach', exp: '2026-11-30' },
  { code: '60412233445566', kind: 'Companion coupon', benefit: 'A companion travels free', exp: '2027-01-15', companion: true },
  { code: '60998877665544', kind: 'Dollar-off coupon', benefit: '$25 off one trip', exp: '2027-03-31' }
];
