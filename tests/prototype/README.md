# Prototype review suites

Browser checks for the Sprint 4 prototype (`prototypes/sprint4/index.html`). They drive the built standalone page in Chromium and print `PASS/FAIL` counts.

| Suite | Covers |
|---|---|
| `final.cjs` | Refinements 1–15, Profile stories (19–23, 992), saved preferences (43, 566, 26–28), email artifacts, eligibility and booking-type rules |
| `cov.cjs` | Trip setup, station memory, points, coupon code, assistance indication and prefill, employee and corporate modes |
| `land2.cjs` | Book landing (Sprint 4 review presentation), sizes, orientations, themes, text sizes |
| `clearrec.cjs` | Clear recents text link in Fare Finder station search (NMA-1004): ADS link, confirm, cancel, focus return, both devices |
| `tabs.cjs` | ADS tabs for trip type, calendar dates and Trips: selection, arrow keys, axe in light and dark |
| `exit.cjs` | Leaving New booking: no question before a cart (close, Escape), selections kept, across scenarios; with a cart, "Abandon booking?" with Continue booking / Abandon booking |
| `apply-coupon.cjs` | Apply coupon against Figma 3346:47066: icon-only Back, title, field with info and clear, helper line, Your coupons list with info buttons, Save code; switching codes without a confirmation; wrong-length, used and expired errors keep the value; typed code stays with the booking; upgrade coupons excluded; details keep scroll and the typed code; Back keeps the booking; empty, guest, loading, error; axe |
| `design-review.cjs` | Design-review revisions: Dates (two months visible, vertical scrolling, one-way, round trip across months, editing either date, invalid return, end of the 335-day window, Done vs Back, axe); "Replace your discount?" (Military → Passenger with disability, Keep editing keeps answers, no-confirmation cases, card wording); navigation (no X under Fare Finder, Back one level, results → Fare Finder with every selection, no warning before a cart, Abandon booking with a cart) |
| `newbooking.cjs` | New booking modal against Figma Sprint 4 node 3295:51258: header, tabs, station and date groups, swap, selector rows, points row and footer (geometry and DS tokens); states; both trip types; booking interactions; landscape scrolling, iPad, 44px targets, safe area; no concept toggle; axe light and dark |
| `adsnext-rollout.cjs` | ADS Next across the concept: component geometry, borders, icon roles, pressed/focus/selected/disabled/error states |
| `sweep-next.cjs` | ADS Next: axe and overflow sweep (24 screens, devices, orientations, themes, text sizes) |
| `stationsearch.cjs` | NMA-1084 / NMA-1085: shared selector from New booking, Train status and Multi-Ride; map, markers, groups, Details; My Location, permissions (iOS, Android), nearby rule, recovery states, offline |
| `stationsearch-a11y.cjs` | NMA-1084 / NMA-1085: axe and overflow across the new screens and states |
| `kids.cjs` | Traveler selection: Youth, Child and Infant under a collapsible "Children and infants" row; summary, counts kept, starts collapsed |
| `promocode.cjs` | Typed promotion code: this booking only, cleared on abandoning; account coupons untouched; lounge passes removed |
| `flow-fixes.cjs` | Station selection (initial From → To flow, destination-only and origin-only editing return at once, map selection back to the list or to Fare Finder, annotation, "Saved"), Profile editing (whole-row targets with chevrons, third-level edit screens on iPhone and iPad incl. assistance and employee pass, no inline editing), "Apply code" labels, manual and saved codes |
| `selector-modes.cjs` | Station selector design decision: From / To in the selector, stays open after From, Map listing with Select in the footer; the retired comparison options are gone from Prototype controls |
| `stationselector.cjs` | Select station (Figma 3295:51259): chevron Back and centered title, List / Map tabs, From / To group with the edited field outlined, Search station, Nearby stations link (replaces My Location), sectioned favorites and recents; prominent map, floating controls and card; axe |
| `assistance.cjs` | (Proposal: no “I do not need assistance”, large service animal only before search, no companion pairing, Senior kept.) Assistance questionnaire: four types, disability/wheelchair/station/companion rules, conflict choice, removals, draft and discard, summaries, search hand-off, invalid companion, multiple and Pass Rider travelers, offline, cancel, timeout, axe |
| `googlemap.cjs` | Google Maps surface for the station map: fallback (no key, blocked script, live invalid key), Google path via `fixtures/google-maps-stub.js` (markers, highlight vs Select, pan/zoom never select, sync, back and reopen), invalid coordinates via `fixtures/stations.mock.json` |
| `googlemap-live.cjs` | Live Google Maps check (needs `VITE_GOOGLE_MAPS_API_KEY`): starts the dev server; map loads, tiles, markers from station data, zoom, pan, wheel, highlight vs Select; fallback without a key. Skips the live part when no key is set |
| `profile-figma.cjs` | Profile against Figma 3376:68484: icon-only Back, plain close, no grabber; six groups in order; label above value on every row; “Not added” for empty values; read-only rows plain (screen readers still hear “Can’t be changed”); helper lines; rows still open their editors; axe light and dark |
| `passrider-select.cjs` | Pass Rider traveler selection proposal: each eligible rider by name with a checkbox, no 0–1 counters, a rider can't be added twice, Companions keep the counter, the 8-traveler limit, selections and counts kept after Done and reopening, axe light and dark |
| `passrider-names.cjs` | Pass Rider travelers by name in every Pass Rider scenario: signed-in checkbox, 0/1 per person, Companions above 1, no relationship labels, saved details prefill, answers kept across changes, Business and Leisure |
| `booking-modes.cjs` | TripLink and Pass Rider switches on the Fare Finder (on by default, off = regular, one at a time), Business / Leisure tabs in Traveler selection (neither preselected for Business Pass holders, Done and Find trains wait), Leisure checkboxes, Business you alone and clears Auto Train, Back undoes the choice, no-Business-Pass and 15-or-younger rules; axe light and dark |
| `sweep.cjs` | axe accessibility and horizontal-overflow sweep across devices, orientations, themes and text sizes |

Run from the repository root after `npm run build:standalone`:

```sh
npm install --no-save playwright axe-core   # not in package.json, so Figma Make's install stays light
npx playwright install chromium
node tests/prototype/final.cjs
```

These suites aren't wired into CI yet.
