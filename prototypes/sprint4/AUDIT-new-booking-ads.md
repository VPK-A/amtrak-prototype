# New booking: normalized against ADS Next and Mobile ADS

> **Where to see it:** branch `figma-make/ads-next-toggle`, where ADS Next is now the only design system (the switch and the Current design were removed).
>
> **How it's built:** the exploration is scoped to `.ds-next` on the device. Styles are in `prototypes/sprint4/ads-next.css` and markup is behind `dsNext()`. `css/components.css` is not modified on this branch, so the sections below that describe edits to it describe the reverted version; their rules now live in `ads-next.css`.

- **Screen:** New booking (the Fare Finder) in Familiar and Brand forward, on iPhone and iPad, light and dark.
- **Sources read in Figma** (read only; nothing was changed in either file):
  - **Global** — ADS Next, `wxV0EWwfiHe49OAm11sLvd`: the Text Input pages (Sizes, States, Patterns), Counter, Modal, Radius, and the Cross-Component Guidance › Keyboard focus page; the component descriptions; the radius and border variable descriptions.
  - **Mobile** — `rIsQBbLvduGe5pcSsHhDaS`: the Button and Card pages, and the Screens page (device templates only).
- **Precedence:**
  - Mobile ADS is preferred where it defines the pattern; Mobile only defines Button and Card.
  - Everything else comes from Global.
  - Conflicts are listed at the end.
- **How it's implemented:**
  - The prototype is code, so "library instance" means the ADS code components in `css/components.css`, bound to the semantic tokens in `css/tokens.css`.
  - Where the code component had drifted from the Figma library, the component itself was corrected rather than overridden locally.
  - The prototype-level overrides that fought it were removed.

## Component and token mapping

| Element | Library component (role · variant) | Rest | Focus | Selected | Error | Disabled |
|---|---|---|---|---|---|---|
| From, To | Text Input · `field/station` (60px, `size/interactive-lg`); label outside the field | `border/default` 1px, `radius/4`, `background/surface-default`; code + city + station name when filled; placeholder `content/text-tertiary` | Field's own border to 2px `border/focus`; no size or corner change | `border/brand` 1px while its picker is open (iPad split) | `border/status-error`; message on that field's helper with the error icon | n/a |
| Swap | Button · Tertiary · Default · Icon only (44px) | `border/default`, `radius/4` | Button ring: 2px `border/focus`, 4px outside, concentric | n/a | n/a | `border/disabled` with no stations chosen |
| Depart, Return | Text Input · `field/large` with trailing calendar icon (Date pattern) | As From/To; stacks to one column below 420px, so the full date and day name fit without truncating | As From/To | `border/brand` while the calendar is open beside it (iPad) | `border/status-error` on missing return | n/a |
| Travelers (passenger selection) | Text Input · `field/large` as a picker trigger, leading people icon, trailing chevron *(recommendation; see gaps)* | As From/To | As From/To | `border/brand` while Traveler selection is open beside it | `border/status-error`; message on the helper below | n/a |
| Coupon or promotion code | Text Input · `field/default` (44px) with Optional marker | `border/default` 1px, `radius/4` | Border to 2px `border/focus` (inset, no shift) | n/a | `border/status-error` + helper (existing) | Read only while checking (existing) |
| Remove (code) | Button · Tertiary · Default (44px, matches the field beside it) | `border/default`, `radius/4` | Button ring | n/a | n/a | n/a |
| Saved codes | List with one `.list/row` (ADS Next List anatomy) | Surface `background/surface-raised`, 1px `border/subtle`, `radius/4`; row 44px (`size/interactive-md`), `space/12` sides; first line Body 16px `content/text-primary`, second line Caption 12px `content/text-tertiary`, both truncate; 24px trailing chevron | 2px `border/focus` ring inset on the row's own bounds | n/a | n/a | n/a |
| Trip type | Tabs | Unchanged (normalized earlier) | Inset ring | `border/brand` underline | n/a | n/a |
| Pay with | Radio Group | 44px choice boxes (local 4px padding override removed) | Inset ring | Checked glyph | n/a | n/a |
| Close | Icon Button · Default (44px), borderless, no rest fill | Transparent; icon `content/icon-primary` (white on Brand forward's navy) | Default focus ring | n/a | n/a | n/a |
| Find trains | Button · Primary · Default (44px), full width below 640px | `background/interactive-primary`, `radius/4` (was Large 60px) | 2px `border/focus`, 4px outside; no reflow | n/a | n/a | `background/interactive-primary-disabled` (Pass Rider until a travel type is chosen; see exceptions) |
| Booking sheet (iPhone) | Sheet surface · `radius/12` top corners | Was 14px | n/a | n/a | n/a | n/a |
| Booking modal (iPad) | Modal · `radius/12` | Was 16px | Container draws no ring (Modal guidance) | n/a | n/a | n/a |
| Brand forward form card | Card · `radius/8`, 1px `border/subtle` | Was 24px; the inner field overrides (16px radius, subtle borders, 26px light codes) were removed so the library fields render | n/a | n/a | n/a | n/a |
| Brand forward light panel under the navy hero | Sheet-level surface · `radius/12` top corners | Was 28px | n/a | n/a | n/a | n/a |

## What changed in code

- **`css/components.css`** (the shared ADS code library):
  - **New `.ads-fieldbtn`:** the code counterpart of Text Input `field/large` and `field/station` used as a picker trigger. It carries rest, focus, selected, error and disabled states.
  - **Route field:** two labelled fields plus a Tertiary icon-only swap Button. It no longer draws one rounded box with an internal divider and a round bordered swap.
  - **Date fields:** two labelled fields with trailing calendar icons. Same change: no one rounded box with an internal divider.
  - **Button focus ring:** offset 2px → 4px (`space/4`).
  - **`.ads-group__body`:** radius 12 → `radius/8`.
- **`screens.js`, `clear.js`, `fields.js`, `core.js`:**
  - New field markup with labels outside.
  - Each error helper sits under its own field.
  - One shared Travelers field for both concepts.
  - Picker-open fields marked selected.
  - The Remove button is the Default size.
  - The close button loses its round fill.
  - Find trains is the Default size.
- **`proto.css`:**
  - Removed Brand forward's field, travelers-row and 52px Pay-with overrides.
  - Sheet, modal and card radii set to `radius/12` and `radius/8`.
  - The form column is a size container, so date fields can adapt to the iPad split pane.

## Unresolved exceptions and gaps

1. **Button focus corner (conflict).**
   - Global's Keyboard focus page labels the button ring `radius/4`.
   - Mobile's Button page says `radius/8` "so it stays concentric" with the 4px offset.
   - Mobile was followed: the outline follows the button's corner plus the offset.
2. **Find trains disabled (conflict with guidance).**
   - Global and Mobile both say to prefer not disabling, and to explain what's missing when pressed.
   - Pass Rider disables Find trains until Business or Leisure is chosen, with the reason shown above it.
   - That behavior is part of the approved flow, so it was kept and flagged.
3. **Saved codes (gap, now mapped to List).** There's no library pattern for "a count that opens a chooser" under a field. It's mapped as a List row in a `radius/8` card with `border/subtle` (recommendation).
4. **Travelers entry (gap).**
   - The library has no picker-trigger field that opens a full screen.
   - It's mapped to Text Input `field/large` with a leading icon and trailing chevron (recommendation).
   - A List row is the alternative if the team prefers it.
5. **Mobile sheet (gap).**
   - Mobile ADS defines no sheet component.
   - The sheet uses `radius/12` from Global's radius variable ("Modals, sheets and popovers").
   - The sheet header (grabber, close) keeps its existing structure.
6. **Swap placement (recommendation).**
   - Icon Button is reserved for close, mobile top navigation, tooltips and in-field controls.
   - Swap acts on two fields, so it's a Tertiary icon-only Button beside them.
7. **Stepper focus on Traveler selection (exception).**
   - The library Counter is one tab stop, and focus thickens its single border.
   - The prototype's steppers are two buttons with their own focus, and keep that because changing it alters keyboard behavior. Not changed.
8. **Info button beside the coupon label.** The library says Icon Button Extra small (24px). It stays Small (36px) for the touch target. Not changed.
9. **Brand forward hero.** The navy band and large light title aren't field, card or sheet elements in this brief, so they're unchanged.
10. **Figma files.**
    - Nothing was written to Figma.
    - Normalizing a Figma version of this screen with library instances and bound variables would be a separate step.
    - It needs the target Figma file.

## Verification

- **`tests/prototype/newbooking.cjs`:** 66/66 checks across both concepts in light and dark, plus iPad. They measure each element's computed height, border width and color against the live token values, and the corner radius:
  - **Rest:** every field at 1px `border/default`, `radius/4`, 60px or 44px.
  - **Focus:** 2px `border/focus` with no change to width, height or corner; button ring 2px at 4px offset.
  - **Selected:** `border/brand`.
  - **Error:** `border/status-error`, with the message on that field's helper.
  - **Disabled:** swap with no stations; Pass Rider Find trains.
  - **Containers:** sheet and modal at `radius/12`, card at `radius/8`.
- **Existing suites:**

  | Suite | Result |
  |---|---|
  | Final review | 167/167 |
  | Coverage | 128/128 |
  | Requirements | 190/190 |
  | Journey | 119/119 |
  | s4flows | 49/49 |

  All other suites pass. The final-review check for refinement 7 now reads "no taller than Find trains", since both are 44px under the library.
