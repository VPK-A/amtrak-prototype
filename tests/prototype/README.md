# Prototype review suites

Browser checks for the Sprint 4 prototype (`prototypes/sprint4/index.html`). They drive the built standalone page in Chromium and print `PASS/FAIL` counts.

| Suite | Covers |
|---|---|
| `final.cjs` | Refinements 1–15, Profile stories (19–23, 992), saved preferences (43, 566, 26–28), email artifacts, eligibility and booking-type rules, in both concepts |
| `cov.cjs` | Trip setup, station memory, points, coupon code, assistance indication and prefill, employee and corporate modes |
| `land2.cjs` | Book landing (Sprint 4 review presentation), sizes, orientations, themes, text sizes |
| `sweep.cjs` | axe accessibility and horizontal-overflow sweep across devices, orientations, themes and text sizes |

Run from the repository root after `npm run build:standalone`:

```sh
npm install --no-save playwright axe-core   # not in package.json, so Figma Make's install stays light
npx playwright install chromium
node tests/prototype/final.cjs
```

These suites aren't wired into CI yet.
