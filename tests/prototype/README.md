# Prototype review suites

Browser checks for the Sprint 4 prototype (`prototypes/sprint4/index.html`). They drive the built standalone page in Chromium and print `PASS/FAIL` counts.

| Suite | Covers |
|---|---|
| `final.cjs` | Refinements 1–15, Profile stories (19–23, 992), saved preferences (43, 566, 26–28), email artifacts, eligibility and booking-type rules, in both concepts |
| `cov.cjs` | Trip setup, station memory, points, coupon code, assistance indication and prefill, employee and corporate modes |
| `land2.cjs` | Book landing (Sprint 4 review presentation), sizes, orientations, themes, text sizes |
| `clearrec.cjs` | Clear recents text link in Fare Finder station search (NMA-1004): ADS link, confirm, cancel, focus return, both concepts and devices |
| `tabs.cjs` | ADS tabs for trip type, calendar dates and Trips: selection, arrow keys, axe in light and dark |
| `exit.cjs` | "Exit booking?" appears only when something is filled out (close, scrim, Escape), across scenarios in both concepts |
| `newbooking.cjs` | ADS Next: New booking radius, borders and rest, focus, selected, error and disabled states |
| `savedcodes.cjs` | Saved codes as an ADS Next List row |
| `adsnext-rollout.cjs` | ADS Next across the concept: component geometry, borders, icon roles, pressed/focus/selected/disabled/error states |
| `sweep-next.cjs` | ADS Next: axe and overflow sweep (24 screens, devices, orientations, themes, text sizes) |
| `assist-ask.cjs` | Checking "Traveler with disability or need help?" opens that traveler's questions; abandoning shows Add; kept answers return; offline, slow and iPad |
| `stationsearch.cjs` | NMA-1084 / NMA-1085: shared selector from New booking, Train status and Multi-Ride; map, markers, groups, Details; My Location, permissions (iOS, Android), nearby rule, recovery states, offline |
| `stationsearch-a11y.cjs` | NMA-1084 / NMA-1085: axe and overflow across the new screens and states |
| `kids.cjs` | Traveler selection: Youth, Child and Infant under a collapsible "Children and infants" row; summary, counts kept, starts collapsed |
| `promocode.cjs` | Typed promotion code: this booking only, cleared on abandoning; account coupons untouched; lounge passes removed |
| `mapversion.cjs` | Current / Updated Map toggle: Updated hides route fields and (on Map) search; prominent map, floating controls and card; shared state; axe |
| `sweep.cjs` | axe accessibility and horizontal-overflow sweep across devices, orientations, themes and text sizes |

Run from the repository root after `npm run build:standalone`:

```sh
npm install --no-save playwright axe-core   # not in package.json, so Figma Make's install stays light
npx playwright install chromium
node tests/prototype/final.cjs
```

These suites aren't wired into CI yet.
