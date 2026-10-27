# ADS Next Design System

A code library built from two Figma files:

- **ADS _ Next** (`wxV0EWwfiHe49OAm11sLvd`): variables, text/effect/grid styles, 18 components, iconography, logos.
- **ADS_NextGen Mobile App** (`rIsQBbLvduGe5pcSsHhDaS`): iOS and Android type scales, native layout, Top and Bottom Navigation.

Web and mobile share one set of tokens. The mobile layer swaps the type scale and layout margins when `data-platform="ios"` or `"android"` is set.

## Use it

```html
<link rel="stylesheet" href="css/ads.css">   <!-- tokens + icons + components -->
<body class="ads-root">
  <button class="ads-btn">Book now</button>
  <span class="ads-icon ads-icon--train"></span>
</body>
```

| Attribute on `<html>` | Effect |
|---|---|
| none | Follows the OS light/dark setting, web type scale |
| `data-theme="dark"` / `"light"` | Forces a theme |
| `data-platform="ios"` / `"android"` | SF Pro / Roboto type scale, 20px native margin, no column grid |

Open `docs/index.html` for the live reference of every token and component.

## What's here

| Path | Contents |
|---|---|
| `tokens/tokens.json` | Source of truth. Primitive ramps, 94 semantic colors (light + dark), shadows, space, radius, size, 4 type tiers, layout |
| `css/tokens.css` | Generated CSS variables (`--ads-*`) |
| `css/components.css` | 20 components, `ads-` class prefix |
| `css/icons.css` | Every icon as a CSS mask class (`ads-icon--name`) |
| `css/ads.css` | Single entry point |
| `dist/tokens.js`, `dist/tokens.resolved.json` | Tokens with colors resolved to hex, for JS/native use |
| `icons/svg/*.svg`, `icons/sprite.svg` | 139 icons, 24px, `currentColor` |
| `logos/` | Travelmark horizontal + vertical, `currentColor` |
| `docs/` | Documentation page (`src.html` → built `index.html`) |
| `scripts/` | Build scripts |

Rebuild after editing tokens or icons:

```sh
python3 scripts/build-tokens.py
python3 scripts/build-icons.py icons/source icons
python3 scripts/build-docs.py
```

## Token naming

Figma variable `background/interactive-primary` → CSS `--ads-background-interactive-primary`.
Text styles → `--ads-type-{style}-{size|line-height|letter-spacing|weight}` and classes `.ads-h1`, `.ads-body`, `.ads-caption`, etc.

## Components

| Figma component | Class | Variants in CSS |
|---|---|---|
| Button | `.ads-btn` | `--secondary --tertiary --destructive`, `--sm --lg`, `--icon-only`, `aria-busy`, `:disabled` |
| Icon Button | `.ads-icon-btn` | `--sm --xs` |
| Link | `.ads-link` | `--sm`, trailing icon, visited |
| Badge | `.ads-badge` | `--info --success --warning --error` |
| Alert | `.ads-alert` | `--success --warning --error` |
| Accordion | `details.ads-accordion` | `--sm` |
| Card_Vertical / Card_Horizontal | `.ads-card` | `--square --portrait`, `--horizontal` + `--half --two-thirds`, `--link` |
| Checkbox / Checkbox Group | `.ads-choice.ads-checkbox`, `.ads-fieldset` | checked, indeterminate, disabled, `--inline` |
| Radio Group | `.ads-choice.ads-radio` | |
| Switch | `.ads-switch` | |
| Counter | `.ads-counter` | `--sm`, per-step disabled for at-min / at-max |
| Text Input (.field/default, small, large, station, textarea) | `.ads-field` + `.ads-control` | `--sm --lg --textarea`, `--error --warning --success`, `.ads-control__station` |
| Select | `.ads-control--select` | |
| Search | `.ads-control` + `.ads-control__clear` | `--pill` (mobile) |
| .helper / .marker | `.ads-helper`, `.ads-field__marker` | |
| List / .list/row | `.ads-list`, `.ads-list__row` | `--header --message --action`, selected, disabled, two lines |
| Modal | `.ads-modal` (+ `.ads-scrim` or `<dialog>`) | footer stacks under 640px |
| Progress (determinate, indeterminate, segmented) | `.ads-progress` | `--error --success --indeterminate`, segments |
| Tabs / .tabs/tab | `.ads-tabs`, `.ads-tab` | `--sm`, `--icon-only` |
| Tooltip | `.ads-tooltip` | `--top --bottom --left --right --none`, `--center --end` |
| Date Picker | `.ads-datepicker`, `.ads-day` | range start/in/end, today, disabled; one pane under 640px |
| Top Navigation (mobile) | `.ads-topnav` | |
| Bottom Navigation (mobile) | `.ads-bottomnav`, `.ads-navtab` | floating dock (default), `--bar` |

## Notes and gaps

- **Font.** Early Sans Variable is a licensed brand face and is not bundled. Add your `@font-face` for "Early Sans Variable"; until then the stack falls back to Arial, as the Figma file specifies.
- **Weights.** Figma labels the heading and emphasis styles "Medium" but binds them to `weight/semibold` (600). The CSS uses 600.
- **iOS emphasis/button styles** are set to Regular in the mobile Figma file, which looks unfinished; the CSS uses semibold to match the semantic weight variables. Check with the design team.
- **Icons not exported (17):** trip-multiple-acela, ticket-sales, comfort-kit, route-acela, bicycle, motorcycle, golf-bag, attendant, clock-boarding, clock-deboarding, train-clock, wheelchair-off, ear, cafe-menu, shower, smoking-off, social-threads, plus the 16px "Small" drawings (the 24px glyphs scale down). Payment-brand marks (Visa, Mastercard…) and the Guest Rewards logo were also left in Figma.
- **Not in Figma, so filled in here:** tertiary-button hover, progress error/success fill colors, and motion durations.
- **Mobile file** pages marked 🚧 (Top/Bottom Navigation) were still in progress; the viewport variants there are named "Viewport3/4/5".
