# Sprint 4 refinement pass: implementation checklist

- **Scope:** the 15 refinements requested on 2026-11-02, applied to `figma-make/sprint-4` in both concepts (Familiar and Brand forward) unless noted.
- **Out of scope** (left for a separate pass): the arrow motif and the member/loyalty card redesign.
- **Status column:** set from the browser review (see *Review results* at the end).

| # | Affected screen / component | Current behavior | Planned change | Verification scenario | Status |
|---|---|---|---|---|---|
| 1 | App header avatar (`.ads-avatar`, Book and every tab; iPad top bar) | The fill is `surface-inverse`. It resolves to the same navy as `content-text-primary` and reads as a typography color in Figma. | Fill with `background-surface-selected`; initials use `content-text-primary`. Guest avatar unchanged (sunken surface). | Signed-in member: avatar in light and dark; contrast checked by axe | Done, verified |
| 2 | Book landing (`bookLanding`) | Recommended trips and Favorite stations cards, Book again list, Explore row | Hidden for the Sprint 4 review (`BK_REVIEW_FOCUS`); the code is kept for later. New booking and the Passes row stay; spacing rebalanced. Station favorites remain in the station selector. | Book tab, member and guest: no cards, rebooking or Explore. Station search still shows Favorites. | Done, verified |
| 3 | Fare Finder coupon field (`codeField`) | Label "Discount code" | Label "Coupon or promotion code" (Optional); matching accessibility labels, info title and error text | Fare Finder, cash search, both concepts | Done, verified |
| 4 | Same field | Ticket icon inside the input | Icon removed; plain DS text field | Same | Done, verified |
| 5 | Saved-code pop-up (`INFO['saved-codes']`) | Title "Your saved codes" with a long explanation | Title "Saved codes"; supporting copy "Choose a coupon or promotion code for this trip." Expiry and eligibility notes kept; selecting doesn't imply it's applied. | Member with saved codes → Saved codes | Done, verified |
| 6 | Saved-code entry | Underlined text link "Use a saved code (3)" | DS grouped row "Saved codes" with a count and chevron (`grow`) | Same, keyboard and touch | Done, verified |
| 7 | Pay with (`payControl`) | Full-width segmented control styled like a primary choice | Compact inline DS radio group (`ads-choice ads-radio`), small legend, cash default; guest note kept | Guest and member, cash and points; hidden in Pass Rider and TripLink | Done, verified |
| 8 | Station search route summary (`stationRoute`) and calendar | "Choosing now", "Choosing" and "Changing" badges; calendar group "Choosing" | Direct "From" and "To" labels only; calendar uses "Dates" and "Departure date" / "Return date" | Station search From and To; round-trip calendar | Done, verified |
| 9 | Station row favorite (`stationRow`) | Bookmark icon, later a star | DS bookmark / filled bookmark (star reverted by request); label "Favorite: …" with the pressed state | Add and remove a favorite; order and persistence unchanged | Done, verified |
| 10 | Selected station row | Selected background plus a "Selected" badge | DS selected surface plus a check icon and screen-reader "selected" text; pressed and disabled states styled; focus ring kept | Station search with a chosen station; Auto Train row disabled in Business | Done, verified |
| 11 | Travelers screen | Standalone "Bringing a service animal?" link | Removed. Service-animal guidance stays only in the disability branch of the questionnaire, next to *Large service animal* (NMA-995). Detailed animal questions (NMA-628) stay out of Fare Finder. | Travelers screen: no link; questionnaire › I have a disability: guidance link present | Done, verified |
| 12 | Assistance questionnaire title (`SCR.assist`) | "Assistance · Traveler 1 · Adult" (Familiar); sheet heading plus a long subtitle (Brand forward) | Title "Assistance"; compact secondary label "For Traveler 1 · Adult" in both | Two travelers: each questionnaire shows its own traveler | Done, verified |
| 13 | Traveler counts (`counter()`) | DS counter restyled into round custom pills | Unmodified DS stepper (`.ads-counter`) with its own disabled states and 44px steps; accessible "Add one / Remove one" labels kept | Min 0, adult default 1, 8-seat limit, Pass Rider counters | Done, verified |
| 14 | Booking modal exit (close button, scrim, Escape at the root) | Closes immediately | DS dialog "Exit booking?" with "Keep booking" and "Exit booking". Back between booking levels unchanged. Keep booking preserves values and the step. Copy states the retention policy (trip details stay for New booking; unconfirmed changes on the current step aren't kept). | X on Fare Finder, on Travelers and on a nested sheet; scrim; Escape; both actions | Done, verified |
| 15 | Booking modes (`modesV1`, Brand forward hero `ffcSeg`) | Stacked full-width segmented switches for TripLink / Pass Rider plus explanatory text | One compact "Booking type" row showing the current mode, opening a sheet that lists only the modes available to the customer. Business/Leisure appears only for eligible Pass Rider travel. Defaults, restrictions and no-precedence rule unchanged. | TripLink, Pass Rider (employee, no Business Pass, retiree, spouse, dependent, minor), dual eligibility | Done, verified |

## Constraints carried over

- Eligibility: employee-only companion passes; spouse, dependent and retiree differences; TripLink kept separate from Business Pass Rider; no precedence for dual eligibility (Q26).
- Points, coupons and passenger discounts stay excluded in Pass Rider and corporate modes.
- Unresolved rules stay flagged in Screen notes, not decided here.

## Review results (2026-11-02)

All 15 items are implemented and were exercised in the browser in Familiar and Brand forward (`tests/prototype/final.cjs`, 167 checks, all passing).

| # | Implemented solution | Observed in the review |
|---|---|---|
| 1 | `.ads-avatar` fill uses `--ads-background-surface-selected`; initials `--ads-content-text-primary` | The computed fill equals the token in both concepts; axe passes in light and dark |
| 2 | `BK_REVIEW_FOCUS` hides cards, Book again and Explore; Passes kept | Book shows header, New booking and Passes only; Favorites still in station search |
| 3, 4 | Field labeled "Coupon or promotion code" (Optional), plain DS input | No ticket icon; labels, info title and error text updated |
| 5, 6 | Saved codes sheet ("Saved codes" / "Choose a coupon or promotion code for this trip.") opened from a DS row "Saved codes · 3 available ›" | Picking fills the field with "selected", not "applied", until Find trains |
| 7 | Inline DS radio group "Pay with: Cash / Points" | Shorter than Find trains; cash default; guest note; hidden in Pass Rider and TripLink |
| 8 | Route summary shows only From / To; calendar labels "Dates" and "Departure date" / "Return date" | No "Choosing", "Choosing now" or "Changing" in text or labels |
| 9 | Bookmark / filled bookmark (reverted from star by request) | Add and remove keep alphabetical order |
| 10 | Selected row: DS selected surface, left accent, check icon, screen-reader "selected"; pressed and disabled styles | Disabled Auto Train row in Business; focus ring unchanged |
| 11 | Standalone link removed; guidance stays in the disability branch | Present next to *Large service animal* |
| 12 | Title "Assistance"; "For Traveler N · Type" label; question reads "Type of help" | Each traveler's questionnaire names that traveler |
| 13 | Unmodified DS `.ads-counter` | Square DS stepper, 42px steps (DS size token), labeled; min, default and 8-seat limits |
| 14 | "Exit booking?" with Keep booking (primary) and Exit booking; asked only when something is filled out (changed from a new booking's starting values, Profile prefills excluded) | Close, scrim and Escape at the root ask when something is filled out and close directly otherwise; Back doesn't; Keep keeps the step and values; Exit keeps trip details per the retention policy |
| 15 | One "Booking type" entry and a sheet listing only eligible modes; Business/Leisure only for eligible Pass Rider travel | Every eligibility group shows only its modes; dual eligibility preselects nothing special; minors see the reason |

**Left for the separate pass:** the arrow motif and the member/loyalty card redesign weren't touched.

**Notes:**
- The DS stepper's step size is 42px (`--ads-size-interactive-md`), slightly under the 44pt iOS guideline. It's left as the design-system component.
- Removing the standalone service-animal link also applies to the archived concepts, which share the Travelers screen.
