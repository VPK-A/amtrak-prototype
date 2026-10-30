# Sprint 4 prototype app

The Amtrak app Sprint 4 Fare Finder prototype (Concepts 1 · Familiar and 3 · Overview, with 2 and 4 archived), built on the ADS Next design system in this repository. It's a standard Vite + React project, set up for importing into Figma Make from GitHub or for running locally.

**Requirements:** Node.js 18 or newer and npm. No environment variables, API keys or external services: all data is mocked in the browser, and nothing is saved or sent.

```sh
npm install          # install dependencies (uses package-lock.json)
npm run dev          # start the dev server at http://localhost:5173
npm run build        # production build into build/
npm run preview      # serve the production build locally
npm run build:standalone   # optional: rebuild the single-file prototypes/sprint4/index.html
```

How it fits together: `index.html` and `src/` are a thin React host. `vite.config.js` reads the prototype's source files from `prototypes/sprint4/` and the design system CSS from `css/` (through `scripts/sprint4-assemble.mjs`), and `src/App.jsx` mounts them unchanged. Edit the source files in `prototypes/sprint4/`; the dev server reloads on save. The app builds to `build/` because `dist/` holds the design system's generated tokens.

Prototype controls (concept, device, scenario, network, text size) are behind the round button at the right edge of the page.

---

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
| `icons/svg/*.svg`, `icons/sprite.svg` | 140 icons (139 from ADS + a `sidebar` toggle glyph), 24px, `currentColor` |
| `logos/` | Travelmark horizontal + vertical, `currentColor` |
| `ia/app-shell.json` | App structure from the IA App Shell Overview: global header, 4 tabs, landing rules, journey stages |
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
| Tab Bar - iPhone (Apple iOS 27 kit) | `.ads-tabbar`, `.ads-tabbar__tabs`, `.ads-tabbar__tab`, `.ads-tabbar__action` | 2–5 tabs, Search Role, `--prominent` action, `--minimized`, `__accessory` |
| Tab Bar - iPad (Apple iPadOS 27 kit) | `.ads-tabbar-ipad`, `__tab`, `__button`, `.ads-ipad-nav` | sidebar toggle, text tabs, search |
| Liquid Glass material | `.ads-glass` | light / dark |
| Global Header (IA) | `.ads-appheader`, `.ads-avatar`, `.ads-icon-btn__dot` | Account + Notification Inbox |
| Segmented control (IA) | `.ads-segmented` | One-way/Round-trip, Active/Upcoming/Past, Train number/Route |
| Sheet (IA) | `.ads-sheet` | Account, Inbox, New Booking |
| eTicket card (IA) | `.ads-ticket` | QR, seat, Add to Wallet, live status |

## App shell (IA)

From *IA App Shell Overview* (12 slides). Stored as data in `ia/app-shell.json` and shown in the docs' App shell section with a working prototype.

- **Tab bar:** Book · Trips · Train Status · Support. Same four on iPhone (bottom glass bar, Type=Default) and iPad (top glass bar).
- **Global header:** Account (avatar, greeting, tier · points) and Notification Inbox (unread dot). Both open as sheets.
- **Where the app opens:** no current trip → Book; upcoming trip → Trips · Upcoming; active trip → Trips · Active.
- **Trips · Active** adapts across Pre-departure, Station, Onboard and Arrival. The eTicket stays on top; the stage card below it changes.
- Search lives inside Book ("New Booking · Where to?" opens the booking sheet), so the tab bar has no separate search button.
- Segmented control, sheet and eTicket card appear in the IA screens but not in the ADS Figma library; they were built here from ADS tokens and should be added to Figma.

## Notes and gaps

- **Font.** Early Sans Variable is a licensed brand face and is not bundled. Add your `@font-face` for "Early Sans Variable"; until then the stack falls back to Arial, as the Figma file specifies.
- **Weights.** Figma labels the heading and emphasis styles "Medium" but binds them to `weight/semibold` (600). The CSS uses 600.
- **iOS emphasis/button styles** are set to Regular in the mobile Figma file, which looks unfinished; the CSS uses semibold to match the semantic weight variables. Check with the design team.
- **Icons not exported (17):** trip-multiple-acela, ticket-sales, comfort-kit, route-acela, bicycle, motorcycle, golf-bag, attendant, clock-boarding, clock-deboarding, train-clock, wheelchair-off, ear, cafe-menu, shower, smoking-off, social-threads, plus the 16px "Small" drawings (the 24px glyphs scale down). Payment-brand marks (Visa, Mastercard…) and the Guest Rewards logo were also left in Figma.
- **Not in Figma, so filled in here:** tertiary-button hover, progress error/success fill colors, and motion durations.
- **Tab bars** follow Apple's *iOS and iPadOS 27 (Community)* Figma kit (`S1lxeJUtOI858vSJm5UwQe`, Tab Bars page): sizes, type, selection capsule and glass layering. Two deliberate changes: the selected tint is ADS brand blue instead of system blue, and the GLASS refraction effect is approximated with `backdrop-filter` blur + saturation, since CSS can't refract. The kit's icon-only "Duo" variants weren't brought over. They replace the earlier `.ads-bottomnav`, which has been removed. In a native app, use the system `TabView` with the ADS tint; these classes are for web views and prototypes.
- **Mobile file** pages marked 🚧 (Top/Bottom Navigation) were still in progress; the viewport variants there are named "Viewport3/4/5".


## Sprint 4 additions

New components in `css/components.css`, added for the Sprint 4 exploration. The full rationale and states are in `prototypes/sprint4/HANDOFF.md`.

| Class | Use |
|---|---|
| `ads-navbar` | Sheet and pushed-screen header: root (Close), pushed (Back + Close), editor (Cancel + Save) |
| `ads-group`, `ads-group__row`, `ads-lock` | Inset grouped rows with value, read-only and locked ("Can't be changed") states |
| `ads-stationrow` | Station result with a 44px favorite bookmark (`aria-pressed`) and sticky state headers |
| `ads-routefield` | From/To pair with a swap button |
| `ads-datefields`, `ads-datefield` | Tappable date values with day name, or an empty "Add" state |
| `ads-calendar` | Vertical month list for phones; reuses `.ads-day` |
| `ads-steps` | Step rail and "Step n of N" progress bar |
| `ads-summary` | Saved-answer summary with Edit, editing and empty states |
| `ads-codeinput` | 6-digit one-time-code entry (a single input drawn as cells) |
| `ads-toast`, `ads-banner` | Save confirmation; offline banner |
| `ads-icon--bookmark-filled` (with `ads-icon--bookmark`) | Favorites: outline = not saved, filled = favorite. `ads-icon--star` and `ads-icon--star-filled` remain but aren't used |

Fixes found while building the exploration:

- `.ads-helper` had no margin reset.
- The inner field of `.ads-control` drew a second focus ring.
- The dark tab-bar tint (`--ads-glass-tint`) was raised to blue-200 for 4.5:1 contrast.

On phones and tablets, keep `.ads-btn--sm` and `.ads-icon-btn--sm` at a 44pt touch target. The prototype does this inside its device frame.

### Prototype

`prototypes/sprint4/` holds the prototype's source (`src.html` shell, `proto.css` and the `*.js` files), the handoff document (`HANDOFF.md`, also shown in the prototype's Handoff tab) and a self-contained build (`index.html`, from `npm run build:standalone`). See *Sprint 4 prototype app* at the top of this file to run it.
