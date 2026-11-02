# ADS styling drift: audit and corrections

- **Scope:** Familiar (Concept 1) and Brand forward (Concept 3) on `figma-make/sprint-4`; source `prototypes/sprint4/proto.css` and the markup in the active-concept scripts.
- **Excluded, as directed:** toggles, navigation (app header, tab bars, navigation bars), reviewer controls, mock email preview, handoff page, and modal containers (dialogs, sheets, info sheets). Controls inside modals were in scope.
- **Not in this pass:** archived concepts 2 and 4 (`guided.js`, `flighty.js`, `compact.js` styles), the member/loyalty card, the arrow motif.

## How this was audited

1. **Inventory.** Every `proto.css` rule was checked for hardcoded values: colors, font sizes and weights, radii, shadows, heights and spacing. Each rule was classed as active, archived or excluded, using the classes Familiar and Brand forward actually render. That list came from a browser crawl of 16 locations × 7 scenarios × iPhone and iPad, plus the active scripts.
2. **References.** Each value was compared with `css/tokens.css` and `css/components.css`. Values were resolved inside the device frame, where body is 16px, body-small 14px, caption 12px, overline and field-label 14px, h4 20px, h3 28px, and the interactive-md height is 44px.
3. **Token references.** Every `var(--ads-…)` in the prototype was checked against the token file. Two names don't exist (below).
4. **Checks after each batch:**
   - 126 fixed screens (both concepts; iPhone light and dark, iPad light) were captured before and after and compared pixel by pixel.
   - The axe accessibility and horizontal-overflow sweep (336 combinations) and the browser suites were run.

## Audit

Order follows the brief: tokens first, then component configuration, then reuse, then replacement.

| # | Element and location | Discrepancy | ADS reference | Smallest correction | Replacement needed? | Status |
|---|---|---|---|---|---|---|
| 1 | Error edges on traveler cards, assistance rows, Brand forward traveler rows (`.fam-card.has-error`, `.atl__row.has-error`, `.ov-trav.has-error`) | Used `var(--ads-border-error, #c0262d)`. That token doesn't exist, so the hardcoded fallback always rendered. | `--ads-border-status-error` | Point to the real token; drop the fallback | No | Done |
| 2 | Saved-code "Starts soon" state (`.cpn__state--soon`) | `var(--ads-background-warning-subtle, #fff4d6)`: token doesn't exist | `--ads-background-status-warning-subtle` | Point to the real token | No | Done |
| 3 | 12 more fallbacks (`content-text-warning`, `content-icon-error`, `content-text-error`, `shadow-elevation-sm`, `radius-12`, and others) | Hardcoded or alternate fallbacks next to tokens that exist | The named tokens | Remove the fallbacks | No | Done |
| 4 | 246 declarations across shared and Familiar rows, cards, Fare Finder, station search, Travelers, Profile | Literal `4/8/12/16/20/24/32/40/48px` spacing, `4/8/12/16/999px` radii, `300–600` weights, `12/14/16/20/28px` sizes, `36/44px` heights, each exactly equal to a token | `--ads-space-*`, `--ads-radius-*`, `--ads-font-weight-*`, `--ads-type-*-size`, `--ads-size-interactive-*` | Swap in the tokens | No | Done (no visible change; pixel diff clean) |
| 5 | Section headings "Who's traveling", "Traveler details" (`.ffc-h`) | 13px with a custom letter-spacing; not an ADS text style | `.ads-overline` text style tokens | Use the overline size, line height, letter-spacing and weight tokens | No | Done (13 → 14px) |
| 6 | Field labels in traveler cards and Brand forward rows (`.fam-row__label`, `.ov-disc__label`) | 13px semibold, not the field-label style that real field labels use | `.ads-field__label` (field-label tokens) | Use the field-label tokens | No | Done (13 → 14px) |
| 7 | Supporting text: Brand forward hero subtitle, sheet subtitles, New booking subtitle (`.ffc-sub`, `.ffc-sheetsub`, `.bk-new__sub`) | 15px, between body-small and body | body-small tokens | Use body-small | No | Done (15 → 14px) |
| 8 | Values: Travelers value, route city, New booking title, section titles (`.ffc-trav__val`, `.ads-routefield__city`, `.bk-new__title`, `.ptitle`) | 15px or 17px; some with weight 700 | body / body-emphasis tokens | Use body-emphasis (16px semibold) | No | Done |
| 9 | Book headings and card titles, station route code (`.bk-h`, `.bk-card__title`, `.bk-trip__route`, `.bk-link__title`, `.ss-route__code`) | `font-weight: 700`; ADS has no 700 weight. `.bk-h` was also 18px. | `--ads-font-weight-semibold`; h4 headline style | Semibold; h4 headline tokens for `.bk-h` | No | Done |
| 10 | Station list headers inside sheets (`.pane--sheet .ads-stationrow__header span`) | Restyled the label with its own size, weight and spacing, duplicating the component's header typography at a different size | `.ads-stationrow__header` | Remove the override so the component's own header typography applies | No | Done |
| 11 | Station row code in sheets (`.pane--sheet .ads-stationrow__code`) | 17px instead of the component's body size | `.ads-stationrow__code` | Remove the size override; keep the link color (Brand forward expression) | No | Done |
| 12 | Disabled station row in sheets | A second disabled rule (opacity only) duplicated the shared disabled state | Shared `.ads-stationrow__select:disabled` state | Remove the duplicate | No | Done |
| 13 | Profile › Saved codes, "Add a code" field and button (`.ffc-codeentry`) | Control and button forced to 52px | `.ads-control` and `.ads-btn` at 44px (interactive-md) | Remove the height overrides | No | Done |
| 14 | Booking type entry (`.mode-entry`, both concepts) | `min-height: 40px`, below the 44px interactive size | `--ads-size-interactive-md` | Use the token | No | Done |
| 15 | Brand forward rows and the Pass Rider card (`.ov-list`, `.ov-pr`), Book cards and lists (`.bk-card`, `.bk-list`), saved-code skeleton | Off-scale radii: 14, 20, 6px | `--ads-radius-16`, `--ads-radius-4` | Nearest token | No | Done |
| 16 | Card and row inner padding (`.fam-row`, `.fam-card__title`, `.ov-trav`, `.ffc-surface`, `.ffc-trav`, `.atl__row`, `.cpn`, and 17 more) | 14px padding and gaps, off the 4/8/12/16 scale | `--ads-space-16` | Snap to 16px, the grid margin | No | Done |
| 17 | Chips in Brand forward traveler rows (`.ov-chip`) | 13px text, 3px × 9px padding | body-small tokens, `--ads-space-8` | Tokens only | **Possibly.** `.ads-badge` fits the purpose (non-interactive status label), but it's semibold with status colors, and the chips carry icons and pairing states. Flagged, not replaced. | Done (tokens); replacement flagged |
| 18 | 76 dead rules (`ffc-row*`, `ffc-list*`, `gstep*`, `v1code*`, `dcode__saved`, `tile(s)`, `task-list`, `bk-a-*`, `.ffc-seg`, and others) and the unused `ffcSeg()` function | Styles for markup no longer rendered; they hide real overrides when auditing | n/a | Remove | No | Done (no visible change) |

## Deliberate differences kept

These stay as they are, and none is presented as ADS-aligned:

- **Brand forward hero.** The navy band stays navy in both themes, and its titles are large and light: "New booking" 34px light, sheet titles 30px light, station codes 26px light. Its main card uses a 24px radius, with taller route, date and traveler fields (62–76px).
  - This is the concept's expression. ADS has no text style that combines these sizes with the light weight, no radius above 16px other than full, and no taller route-field variant.
  - **Gap:** ADS has no semantic "brand surface that stays dark in both themes". The hero uses primitives (`--ads-color-blue-900/950`) and white text through one local property (`--ffc-on-navy`).
- **Sentence case.** `chrome.js` removes CSS-forced capitals at runtime, including ADS's own uppercase styles (overline, station list header, route and date field labels), to follow the sentence-case direction.
  - The ADS files themselves are untouched.
  - **Gap:** ADS has no sentence-case variants of these label styles.
- **Small buttons and icon buttons in the device** (`.device .ads-btn--sm`, `.device .ads-icon-btn--sm`) are raised to 44px for touch targets. This deliberately departs from ADS's 36px small size.
- **Station search field in sheets** (`.pane--sheet .ss-search .ads-control`): 56px, borderless, sunken fill, Brand forward's search presentation. It now uses tokens throughout. **Gap:** ADS has no large search-field variant.
- **Travel type (Business/Leisure)** stays an `.ads-segmented` choice. Toggles were excluded from this pass.

## Remaining discrepancies and unavailable references

- **114 spacing values off the token scale** remain in active rules, mostly 6px (25), 2px (21) and 10px (17). They're icon nudges, chip padding and tight stacks. Snapping them would move alignment across many components without a clear ADS rule for those cases, so they're left and listed here.
- **17 fixed heights** remain: Brand forward field heights (above), the station search field, and info-sheet artwork (modal container).
- **48px illustrative icons** (verification success, info-sheet artwork): ADS icon sizes stop at 32px (`--ads-size-icon-lg`).
- **Light and dark checks** are covered by the sweep and the pixel captures. Error, disabled and loading states were checked through the suites. The error edge now uses the ADS error border token, so its exact color changed from the old hardcoded red.

## Verification

- **Pixel comparison:**
  - Batches 1–2 (exact token swaps, broken-token fixes, dead-rule removal): no visible change across 126 screens; only sub-threshold anti-aliasing differences.
  - Batches 3–4: the intended changes only (type steps of 1–3px, 16px padding, 44px Booking type entry, radius snaps), reviewed as before/after pairs in both concepts.
- **axe and overflow sweep:** 0 issues of 336 after batch 3 and again after batch 4.
- **Browser suites:**

  | Suite | Result |
  |---|---|
  | Final review | 167/167 |
  | Coverage | 128/128 |
  | Book landing | 38/38 |
  | Tabs | 37/37 |
  | Clear recents | 32/32 |
