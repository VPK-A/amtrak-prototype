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
| `coupon-explorations.cjs` | Coupon or promotional code explorations 1 and 2: entry first with the info icon, saved codes inline, used/expired disclosure, selecting and clearing, details as a secondary view, deals for this trip (match, pending, doesn't match), saved deals, replace confirmation, browse and return, Done, check at Find trains, loading/error/empty/guest states, axe light and dark |
| `design-review.cjs` | Design-review revisions: Dates (two months visible, vertical scrolling, one-way, round trip across months, editing either date, invalid return, end of the 335-day window, Done vs Back, axe); "Replace your discount?" (Military → Passenger with disability, Keep editing keeps answers, no-confirmation cases, card wording); navigation (no X under Fare Finder, Back one level, results → Fare Finder with every selection, no warning before a cart, Abandon booking with a cart) |
| `newbooking.cjs` | New booking modal against Figma Sprint 4 node 3295:51258: header, tabs, station and date groups, swap, selector rows, points row and footer (geometry and DS tokens); states; both trip types; booking interactions; landscape scrolling, iPad, 44px targets, safe area; no concept toggle; axe light and dark |
| `savedcodes.cjs` | Saved codes as an ADS Next List row |
| `adsnext-rollout.cjs` | ADS Next across the concept: component geometry, borders, icon roles, pressed/focus/selected/disabled/error states |
| `sweep-next.cjs` | ADS Next: axe and overflow sweep (24 screens, devices, orientations, themes, text sizes) |
| `stationsearch.cjs` | NMA-1084 / NMA-1085: shared selector from New booking, Train status and Multi-Ride; map, markers, groups, Details; My Location, permissions (iOS, Android), nearby rule, recovery states, offline |
| `stationsearch-a11y.cjs` | NMA-1084 / NMA-1085: axe and overflow across the new screens and states |
| `kids.cjs` | Traveler selection: Youth, Child and Infant under a collapsible "Children and infants" row; summary, counts kept, starts collapsed |
| `promocode.cjs` | Typed promotion code: this booking only, cleared on abandoning; account coupons untouched; lounge passes removed |
| `stationselector.cjs` | Station selector: heading with Back above List / Map tabs, search below the tabs (List view only), no route fields, 12 px rhythm; prominent map, floating controls and card; axe |
| `assistance.cjs` | Assistance questionnaire: four types, disability/wheelchair/station/companion rules, conflict choice, removals, draft and discard, summaries, search hand-off, invalid companion, multiple and Pass Rider travelers, offline, cancel, timeout, axe |
| `googlemap.cjs` | Google Maps surface for the station map: fallback (no key, blocked script, live invalid key), Google path via `fixtures/google-maps-stub.js` (markers, highlight vs Select, pan/zoom never select, sync, back and reopen), invalid coordinates via `fixtures/stations.mock.json` |
| `googlemap-live.cjs` | Live Google Maps check (needs `VITE_GOOGLE_MAPS_API_KEY`): starts the dev server; map loads, tiles, markers from station data, zoom, pan, wheel, highlight vs Select; fallback without a key. Skips the live part when no key is set |
| `passrider-names.cjs` | Pass Rider travelers by name in every Pass Rider scenario: signed-in checkbox, 0/1 per person, Companions above 1, no relationship labels, saved details prefill, answers kept across changes, Business and Leisure |
| `compare.cjs` | Design comparison settings: traveler assistance layout and Pass Rider Business Pass controls, all four combinations, equivalence with the original controls, other pass scenarios unchanged |
| `sweep.cjs` | axe accessibility and horizontal-overflow sweep across devices, orientations, themes and text sizes |

Run from the repository root after `npm run build:standalone`:

```sh
npm install --no-save playwright axe-core   # not in package.json, so Figma Make's install stays light
npx playwright install chromium
node tests/prototype/final.cjs
```

These suites aren't wired into CI yet.
