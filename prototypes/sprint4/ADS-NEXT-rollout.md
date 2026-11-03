# ADS Next rollout: shared mapping and coverage

- **Branch:** `figma-make/ads-next-toggle`.
- **Where to see it:** ADS Next is this branch's only design system. The Design system switch and the Current design were removed, so the prototype always opens in ADS Next.
- **Scope:** every ADS Next screen in Familiar and Brand forward, except Top Navigation (app header, sheet top bar, iPad top navigation) and Bottom Navigation (tab bars).
- **Unchanged:** **Current** and both navigation components.
- **References:**
  - ADS Next (Global): `wxV0EWwfiHe49OAm11sLvd` — the Text Input, List, Counter, Modal, Radius and Keyboard focus pages, plus the component and variable descriptions.
  - Mobile ADS: `rIsQBbLvduGe5pcSsHhDaS` — the Button and Card pages.
- **Precedence:** Mobile ADS wins where it defines the pattern (Button, Card). Global covers foundations and everything else. The New booking normalization is the consistency reference.

## How it's isolated

- **One switch:** `TB.ds` adds `.ds-next` to the device.
- **Styles:** every ADS Next rule lives in `prototypes/sprint4/ads-next.css`, scoped to `.ds-next`.
- **Markup:** markup differences sit behind `dsNext()`. Only the New booking fields and the Find trains size change.
- **Shared code library untouched:** `css/components.css` and `proto.css` aren't changed by the rollout.
- **Navigation guard:** rules that could reach navigation exclude it with `:not(:is(.ads-navbar, .ads-appheader, .app-ipadnav, .app-tabbar) *)`.
- **Close button:** the sheet close button keeps its Current treatment, because it's part of Top Navigation. This reverses the close-button change from the first New booking pass.

## Shared component and token mapping

**V** = verified against ADS · **P** = proposed extension

| Prototype component | ADS component · variant | Geometry and boundary | States | Source |
|---|---|---|---|---|
| `.ads-btn` (primary, secondary, tertiary, destructive) | Button · role · Default 44px (Small targets kept at 44px) | radius/4; secondary `border/brand`, tertiary `border/default` | pressed `*-active`; focus 2px `border/focus` ring 4px outside, concentric; disabled `interactive-*-disabled` | V (Mobile Button) |
| Swap, coupon Remove | Button · Tertiary (icon only for swap) | radius/4, `border/default` | as Button | V |
| `.ads-icon-btn` outside navigation (info, station details, favorite, calendar month arrows, field clear, search back) | Icon Button · Default / Small | radius/4, no rest fill | pressed fills the target; focus ring; disabled `content/icon-disabled` | V (Global description) |
| `.ads-control` text, select, coupon | Text Input · `field/default` 44px | radius/4, 1px `border/default` | focus thickens the field's own border to 2px; error `border/status-error` + helper; disabled tokens | V |
| From/To, dates, Travelers (`.ads-fieldbtn`) | Text Input · `field/station`, `field/large` 60px, label outside | radius/4, 1px `border/default` | focus 2px; selected `border/brand` (picker open); error `border/status-error` | V (New booking) |
| Station search field | Search · Default 44px | radius/4, 1px `border/default` (was a 56px borderless pill) | focus 2px inset | V |
| Station search route summary `.ss-route` | Text Input · `field/station` ×2 (as New booking), labels outside | radius/4, 1px `border/default` each (was a custom two-row card with a left accent bar) | field being chosen: selected `border/brand` with `aria-current="step"`; the other switches to it; focus 2px | V (New booking) |
| Booking type entry `.mode-entry` | Select trigger (opens a sheet) | radius/4 (was a pill), 44px | focus | V radius · P classification |
| Book › New booking entry `.bk-new` | Text Input · `field/large` trigger | radius/4, 1px `border/default`, no shadow (was a pill with elevation) | focus thickens the border | V radius · P classification |
| Verification code cells | Text Input as six cells | radius/4 cells | focus is the next cell's 2px border only (the second outer ring was removed) | V |
| Fixed discount value `.ffc-fixedval` | Read-only field | radius/4 | — | P |
| `.ads-counter` | Counter | radius/4, one 1px `border/default` | at-min / at-max disabled steps; focus per step (exception 5) | V geometry |
| `.ads-choice` checkbox and radio | Checkbox, Radio Group | 44px box, glyph per ADS | checked, focus inset, disabled | V |
| Wheelchair question `.wcq` | Radio Group (no container box) | box removed | — | V |
| Travel type `.ads-segmented` | No ADS segmented control | one radius/4 boundary at `border/default`; selected = `surface-selected` + inset `border/brand` + emphasis weight | selected, focus | **P** (gap 1) |
| `.ads-tabs` | Tabs | underline `border/brand` | focus inset | V |
| `.ads-switch` | Switch | radius/full | on/off | V |
| `.ads-group` lists (Account, Profile, Book, Saved codes, Discounts) | List + `.list/row` | `surface-raised`, 1px `border/subtle`, radius/4; rows ≥44px, space/12 sides; dividers `border/subtle`; Body 16 first line, Caption 12 second line | pressed `surface-active` (P); focus 2px inset; selected `surface-selected` | V (List anatomy) · second-line colour see conflict 2 |
| `.ads-stationrow` | List · two lines (station row) | dividers `border/subtle` | selected `surface-selected` + check `content/icon-brand`; disabled | V |
| Traveler cards `.fam-card`, Brand forward list `.ov-list`, Pass Rider card `.ov-pr`, `.ffc-fixedcard`, `.ads-summary`, coupons `.cpn`, `.info-pending`, `.inlinepanel`, form card `.ffc-surface` | Card | radius/8, 1px `border/subtle`, no elevation | — | V (Mobile Card) |
| `.ads-alert`, offline banner, mode note | Alert (message panel) | radius/8 | info / success / warning / error with icon | V (radius variable "Cards and message panels") |
| `.ads-toast` | No ADS toast | radius/8 message panel | — | **P** (gap 2) |
| `.ads-badge`, `.ads-lock` ("Can't be changed", "From your profile") | Badge · neutral | radius/full, no border, status background | none (a badge never acts) | V |
| `.ads-modal` dialogs | Modal | radius/12 | focus moves inside; no container ring | V |
| Booking sheet, info sheets, verification cover | Sheet surface | radius/12 top corners on iPhone; radius/12 centered on iPad | — | V radius · gap 3 (no Mobile sheet component) |
| Calendar `.ads-day` | Date Picker day cells | circle (radius/full) selected `background/interactive-selected` | today, selected, disabled | V |

### Icon colour by role

| Role | Token |
|---|---|
| Decorative leading icon (list leads, Travelers icon) | `content/icon-secondary` (were brand) |
| Navigation chevron | `content/icon-secondary` (were a mix of tertiary and secondary) |
| Selection (chosen favorite, selected station check) | `content/icon-brand` |
| Info status | `content/icon-info` |
| Error | `content/icon-error` |
| Disabled | `content/icon-disabled` |
| Icon Button glyphs (info, station details) | `content/icon-primary` |

Identity (avatar, loyalty), action, selection, notification (dot), disabled and error keep separate treatments.

## Coverage

All of these are in ADS Next mode, in both concepts.

| Area | Screens and states covered |
|---|---|
| Book | Landing; New booking entry |
| Trips | Empty state |
| New booking | One-way, round-trip, guest, Pass Rider (with and without travel type), TripLink, both; errors; offline banner; code applied / invalid / checking; Saved codes sheet; Booking type sheet; Exit dialog |
| Station search | Favorites, recents, results, no results, selected and disabled rows; station info sheet; Clear recents dialog |
| Calendar | Depart / return; disabled past dates and previous month |
| Travelers | Counts and limits; Traveler details; Brand forward traveler sheet; Pass Rider and corporate; assistance per traveler |
| Assistance | Questionnaire, all branches; review; info sheets (service animals, accessible travel, traveling alone) |
| Account | List groups; Quick settings switches |
| Profile | Overview; editors (middle initial, phone, address, date of birth with error, employee pass); Discounts; Discount rules; Profile assistance; My coupons; Verify (change email, sign-in, unverified) |
| Feedback | Toasts, alerts (offline, timeout, server error), confirmation dialogs |

## Validation

- **Inventory audit:**
  - 297 component classes collected from ADS Next across 6 scenarios × 15 locations × both concepts, plus opened sheets.
  - **Radius:** 0 off-ladder radii; 0 pills or circles outside badges, avatars, switches and day cells; 12px only on modals and sheets.
  - **Borders:** every control rests on `border/default`; every card, list and divider uses `border/subtle`.
- **States test** (`tests/prototype/adsnext-rollout.cjs`): 109/109 in both concepts, light and dark. It covers List surface, row height and icon roles; pressed and focus; badge; field error; Search rest and focus; Icon Button radius; favorite colour; cards; disabled month arrow; counter at-min; segmented selection; disabled Find trains; Primary pressed and focus ring; modal, iPhone sheet and iPad sheet radius; toast; code cells and their focus.
- **Accessibility and overflow sweep (ADS Next):** 0 issues across 576 combinations. That's 24 screens × iPhone/iPad × portrait/landscape × light/dark × 100/140% text × both concepts.
- **Isolation:**
  - **Current:** pixel comparison of 126 screens shows only sub-threshold anti-aliasing.
  - **Navigation:** 2,056 navigation elements are identical between Current and ADS Next, across both concepts, devices and themes, on 9 screens.
- **Earlier ADS Next tests:** New booking 66/66 and Saved codes 24/24.
- **Current suites:** all still pass (listed in the report).

## Unresolved DS conflicts and proposed extensions

1. **No segmented control in ADS (gap).** Travel type uses a proposed treatment: one radius/4 control boundary, with the selection shown by surface, inset brand border and weight. A Radio Group (inline pair) is the verified alternative, but it would change the control's markup and behavior, so it's left for a decision.
2. **List second line (conflict).**
   - The List anatomy says Caption 12 in `content/text-tertiary`.
   - On `surface-raised` in dark mode that measured under 4.5:1 (axe flagged it 44 times).
   - The rollout uses `content/text-secondary` in both themes.
3. **Mobile sheet (gap).** Mobile ADS defines no sheet. Sheets use radius/12 from the Global radius variable ("Modals, sheets and popovers").
4. **Toast (gap).** No ADS toast. It's a radius/8 message panel (proposed).
5. **Counter focus (exception).** ADS Counter is one tab stop with one focus border. The prototype's two step buttons keep separate focus to preserve keyboard behavior.
6. **List pressed state (extension).** The List defines hover, but the prototype is touch-only (hover styles are removed in the device). Pressed uses `surface-active`.
7. **Button focus corner (conflict, from New booking).** Global labels the ring radius/4; Mobile says radius/8, concentric. Mobile was followed.
8. **Disabled Find trains (conflict, from New booking).** ADS prefers not disabling. The approved Pass Rider flow disables it with the reason shown, so it was kept.
9. **Classifications (proposed):** the Booking type entry as a Select trigger, the Book entry as a `field/large` trigger, Saved codes as a List row and the fixed discount as a read-only field. They're consistent with the verified rules, but ADS doesn't name these patterns.

## Not done

- **Figma.** No Figma file was created or edited. Applying these mappings with library instances and variable bindings needs the target Figma file.
- **Loyalty card and arrow motif.** Left for their separate pass, per earlier direction; the loyalty card renders as in Current.
- **Brand forward navy hero.** Kept as the concept's expression: navy band, large light title, Booking type entry on navy.
- **Search results stand-in ("Prototype handoff").** A reviewer page, not normalized.
- **Train status and Support tabs.** Placeholder tabs with no components beyond navigation; not separately inventoried.
- **Coupon info button.** Stays 36px for touch; ADS says Icon Button Extra small (24px).
