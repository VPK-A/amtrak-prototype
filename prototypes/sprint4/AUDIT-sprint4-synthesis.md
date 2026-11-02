# Sprint 4 coverage audit: `figma-make/sprint-4` against the User Story Synthesis

- **Branch audited:** `figma-make/sprint-4`. First pass at `97ba999` (latest Figma Make import). Updated after the round 2 implementation on 2026-11-02.
- **Authority:** *NMA Sprint 4 User Story Synthesis*, approval baseline of October 30, 2026. Page 03's sketches show placement only.
- **Scope:** 34 approved stories. Out of target: NMA-600, 1084, 1085, 29, 628, 621, 697, 620.
- **Concepts:** both exist in this branch: **Familiar** (Concept 1) and **Brand forward** (Concept 3, formerly Overview). Concepts 2 and 4 are archived and not audited.
- **First pass** made no prototype changes. **Round 2** implemented trip setup, station memory, travelers, points and code, assistance, and employee and corporate coverage. See *Round 2 changes* below.

## Status key

| Status | Meaning |
|---|---|
| **Complete** | Every behavior the synthesis names is implemented and was exercised. |
| **Partial** | Some required behavior, state or IA placement is missing or contradicts the synthesis. |
| **Missing** | The required behavior isn't implemented. |
| **Blocked** | The approved, clear parts are implemented, but the remaining scope depends on a rule the synthesis says is unresolved. That part can't be finished or claimed as verified. |

## How the evidence was gathered

- **Code:** I read `prototypes/sprint4/*.js` on this branch. Files: `data.js` (scenarios, fixtures), `core.js` (state, routing, freshBooking), `screens.js` (Fare Finder, stations, calendar, Profile, editors, verification), `clear.js` (traveler and booking-mode rules, Find trains, codes), `travelers.js` (per-traveler assistance), `fields.js` (Discount code), `familiar.js` (traveler cards), `overview.js` (Brand forward traveler sheet) and `profile.js` (employee pass, coupons).
- **Automated tests:** the scripted suites run on 2026-11-02 against this branch (dev server and production build). About 770 checks across requirements, booking, travelers, assistance, codes, Pass Rider, TripLink, profile and Book landing. All passed. Suites that drive removed toolbar controls were run with test-only stand-ins.
- **Runtime probes:** a targeted check on this branch covered favorites order, guest cash/points, Profile contents, billing-address delete, clear-recents dialog, assistance prefill, employee-pass delete option, sign-out and reviewer controls.

## IA homes on this branch

| Home | How to reach it | Notes |
|---|---|---|
| **Book › New booking › Fare Finder** | Book tab › *New booking · Where to?* opens a modal sheet with the bottom navigation hidden | Same in both concepts. Familiar uses a white grouped form; Brand forward uses a navy band over a rounded surface. |
| **Fare Finder › Travelers › Individual traveler** | Fare Finder › Travelers row | **Familiar:** *Traveler selection* with counters and one card per traveler (Discount, Disability or assistance, Personal companion), plus Cancel and Done. **Brand forward:** *Travelers* sheet with counters, an inline discount per traveler, and Edit opening a single-traveler sheet. The assistance questionnaire opens from the traveler. |
| **Account › Profile** | Account (avatar) › Profile | Name, Guest Rewards number, middle initial, Contact (email, phone, billing address, date of birth), Passenger discounts, Amtrak employee pass and My coupons. **Assistance isn't inside Profile:** it's a sibling row on Account (Account › Assistance). Page 03 puts it inside Profile. |

## Coverage matrix

### Trip setup (Fare Finder)

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-607** One-way search | Origin and destination, swap, departure date, travelers, Find trains; one-way and today by default; identical stations prevented; Lorton/Sanford pairing. · Fare Finder | `SCR.ff` / `ffClear`, `routeField`, `dateFields`, `A['choose-station']`, `A.swap`. Book › New booking (focused modal) | None. Offline, slow and error states can be shown again with the restored reviewer *Network* control. | Complete | Complete | — | `freshBooking`. Coverage suite: one-way/today, return blocked, offline. Requirements suite 190/190. |
| **NMA-608** Add a return | Round-trip and *Add return*; both dates start today; stations and travelers kept. · Fare Finder | `tripSeg`, `A.trip`, `A['add-return']` | None | Complete | Complete | — | Coverage suite: *Add return* gives round-trip today/today. |
| **NMA-1060** Travel dates | One calendar for both dates; past dates and returns before departure disabled; invalid return cleared; date and weekday on the Fare Finder. · Date picker | `calendarBody`, `A.day`, `A.picking` | The window length/reference date and the missing-return treatment remain undecided. The window is now a setting (`WINDOW_DAYS`); dates beyond it are disabled and **no limit is stated to customers**. Missing return currently shows an error on Find trains, flagged as Q25. | Blocked | Blocked | Q4, Q25 (synthesis p05, p25) | Coverage suite: no “335 days” text, past and beyond-window dates disabled, both flags in Screen notes. |
| **NMA-118** Favorite stations | Star (add/remove), list sorted alphabetically, above recents, no duplicates, saved locally for guests and members. · Station selector | `stationRow` star (`A.fav`), `favList()` (`data.js`) | None | Complete | Complete | Profile sync is future work | `favList` sorts by city, then station name, without duplicates. Coverage suite: BOS, NYP, WAS order; guest can save a favorite. |
| **NMA-984** Recent stations | Latest first, 10-day retention (configurable), no duplicates, empty section hidden, cleared on logout, favorites first. · Station selector | `recentList()`, `RECENT_DAYS` (`data.js`); **Sign out** on Account (`A['sign-out']`) | None | Complete | Complete | — | Coverage suite: retention and ordering, empty section hidden, sign out clears recents and keeps favorites. |
| **NMA-1004** Clear recents | Clear recent stations with confirmation, cancel and cleared state; favorites kept; new recents afterwards; works offline. · Profile or settings | Account › Quick settings › *Clear recent stations* (dialog) | None. Position is a design recommendation, as the synthesis allows. | Complete | Complete | — | Coverage suite (offline): cancel keeps recents; confirm clears them, keeps favorites, shows “No recent stations”. |

### Travelers and discounts

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-611** Who's traveling | Counts for Adult 18–64, Senior 65+, Young adult 16–17, Youth 13–15, Child 2–12 and Infant 0–1. One adult by default. At most 8 occupied seats, using the source infant-seating rules. · Travelers, with a summary on the Fare Finder | `travelersClear` counters; `paxProblems`, `paxOccupied`, `lapCap`, `canAdd` (`clear.js`); summary in `travelersRow` / `ffc-trav` | The Young adult with infant case is blocked under BR9 but not decided. | Blocked | Blocked | Young adult accompaniment conflict (synthesis p08, p25) | Seat limit and lap ratio in `clear.js`. The fix suite passed 32/32 and the requirements suite covers the limits. |
| **NMA-612** Discount per traveler | One eligible discount per traveler, including several travelers of the same type. Saved defaults and assistance-related overrides from the source matrix. · Each traveler under Travelers | Familiar: `discountRow` on each card. Brand forward: inline select in `overviewTravelers` and `discountRow` in the traveler sheet. Rules: `tdiscOf`, `discOpts`. | The source matrix needs reconciling: approved under the VK rule, but the latest review comment still asks for fixes. | Blocked | Blocked | Synthesis p08, p25 | Per-traveler keys in `b.tdisc`. A removed traveler's selections are cleared by `forgetTraveler`. Tested. |
| **NMA-43** Saved passenger discount | Saved Military, Rail Passenger Association (6–10 digit ID) or Passenger with disability, connected to profile assistance. · Profile › Passenger discounts | `SCR.discounts`, `A['disc-save']` | None found | Complete | Complete | — | RPA check `/^\d{6,10}$/`. PWD requires assistance "I have a disability" (`go-assist`). The Fare Finder uses it as the Traveler 1 default (`freshBooking.disc`, `profilePwd`). |
| **NMA-566** Benefit and eligibility guidance | Readable groups of passenger and discount guidance from the content system. · Profile › Passenger discounts | `SCR.rules` (info sheet *Passenger types and discount rules*), `RULE_GROUPS` | Content is placeholder text, by design. | Complete | Complete | AEM content | Grouped accordions in `SCR.rules`, linked from `SCR.discounts`. |
| **NMA-624** Cash or points | *Use points* for guests and members, cash by default, member balance shown; guests sign in after choosing a fare; hidden for TripLink and Pass Rider. · Fare Finder | `payControl()` used by `payV1` (Familiar) and `.ffc-pay` (Brand forward) | None | Complete | Complete | Discounts on points searches undefined (Q14) | Coverage suite: guest sees Cash/Points, chooses Points without a sign-in prompt, carried into the search; member sees “Points · 12,450”; hidden in Pass Rider and TripLink. |
| **NMA-613** Coupon or promotion | Visible optional field, manual entry, saved-code choice, validation, applied and error states, information, removal; recheck after edits; hidden for points and restricted modes; removing it doesn't delete the profile coupon. · Fare Finder, after Travelers | `codeField` (`fields.js`), `INFO['saved-codes']`, `searchWithCode` / `checkCode` | None. The mocked responses are listed under *Try* in Screen notes, and the service error is reachable with *Network › Server error*. | Complete | Complete | Code format and offline checking undecided (Q23) | Requirements suite (selected vs applied, invalid, ineligible, recheck, error, remove, points hidden). |

### Passenger assistance

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-973** Someone needs assistance | Indication, explanation, Continue into the questionnaire; selected, cleared and no-connection states; Travelers entry reconciled with the Fare Finder indication. · Fare Finder journey | **Proposed mapping (Q7):** `assistIndication()` on the **Travelers screen** (both concepts): *Traveler with disability or need help?* with explanation and Continue. The Fare Finder's Travelers summary shows the state. | The entry and CTA mapping still needs agreement. The indication isn't on the main Fare Finder form, per verbal guidance. | Blocked | Blocked | Synthesis p12, p25 | Coverage suite: off by default; checking works offline; Continue offline is blocked with a message; slow connection can be cancelled; Continue opens Traveler 1 and then the next unanswered traveler; unchecking keeps answers without applying them; re-checking restores them. |
| **NMA-615** Assistance type per person | Four choices per traveler with selection, confirmation, editing and companion rules; shows whose answers are being edited; summary per traveler. · Traveler questionnaire | `assistanceRow` (Familiar cards), traveler sheet (Brand forward), `SCR.assist`, `assistMissing` | None | Complete | Complete | Entry follows the proposed 973 mapping | Coverage suite: questionnaire names the traveler; search is blocked until every traveler answers while assistance is on. |
| **NMA-614** Saved assistance in booking | Prefill Traveler 1 when signed in; indication on by default when saved requests or a disability discount exist, otherwise off; editing and deselection allowed; never written back to Profile. · Fare Finder prefill and traveler questionnaire | `freshBooking` (Traveler 1 is the account holder via `holderKey`), *From your profile* tag | None. Save to Profile (NMA-1051) and Traveler Info aren't included. | Complete | Complete | The indication's placement follows the proposed 973 mapping | Coverage suite: `assist` scenario starts with the indication on and Traveler 1 prefilled; editing or removing for the trip leaves Profile unchanged; guests and members without saved assistance start off. |
| **NMA-995** Disability needs | Required disability choice, conditional needs, the wheelchair-space decision, and the accessible seat / large service animal rules. Confirm and edit. · Disability branch | `disBlock`, `wcBlock`, `needsBlock`, `assistErrors` | None found | Complete | Complete | — | Seat and animal exclusive when a wheelchair space is needed (`needsBlock`). At least one disability, and the wheelchair decision, enforced. Tested. |
| **NMA-996** Station assistance needs | No-disability branch with accessible seat; edit before and after confirming. · Station branch | `needsBlock` for station: seat only | None found | Complete | Complete | — | `fromDraft` station keeps only `seat`. Tested. |
| **NMA-997** Companion needs | Station assistance for a personal companion; accessible seat depends on it; review and edit; follows CORE. · Companion branch | `needsBlock` for companion | None found | Complete | Complete | CORE caveat kept | Seat disabled until Station assistance is chosen. Tested. |

### Employee and corporate travel

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-623** Employee pass travel | Pass Rider mode only for eligible signed-in members, on by default for valid pass riders, Regular available; no points, traveler discounts or coupons; assistance available. · Fare Finder mode control | *Book as: Pass Rider \| Regular* | None. An account eligible for TripLink and Pass Rider gets no invented precedence: both controls show and neither is preselected (Q26, *TripLink and Pass Rider* scenario). | Complete | Complete | Q26 | Coverage suite: dual-eligibility fixture, points and code hidden. |
| **NMA-1016** Business or Leisure | Business and Leisure only with an active Business Pass. An explicit choice is needed before Find trains. Others get Leisure by default. Auto Train is Leisure only. · Employee Fare Finder | Travel type segmented control; `findBtn` disabled until chosen; `autoTrainBlocked` | None found | Complete | Complete | Pass Rider policy placeholder (NMA-1081) | Tested: no preselection, button disabled, Business blocks and clears Auto Train. |
| **NMA-622** TripLink corporate | Corporate or Personal for linked Concur accounts, corporate by default. One traveler, assistance allowed, no points, discounts or coupons. Auto Train rejected after Find trains. · Fare Finder mode | *Booking for: Corporate \| Personal*; Auto Train dialog in `A['find-trains']` | None found | Complete | Complete | — | Tested, including restoring travelers and the code on switching back. |
| **NMA-1017** Family travelers | Leisure selection for employee, retiree, spouse and dependent combinations. Dependents 16+ may travel alone; younger ones need an eligible adult. Adult/Child choices. · Travelers in the Pass Rider Fare Finder | `travelersClear` Pass Rider section, *I'm traveling* toggle, `prKind` type select, `prProblems` | Dependent age has no data source; it comes from fixtures. | Complete | Complete | Q16 identifiers and age | Probe: retiree, spouse, dependent and minor fixtures. Child-only search blocked. |
| **NMA-1018** Companion passes | Companions for employees in Leisure, remaining balance, Adult/Child, eight-person limit; hidden for spouse, dependent and retiree; disabled at zero; companions travel with an employee, spouse or dependent; searching doesn't use passes. · Employee Travelers picker | Companion counter (“x of 16”), `prCompMax`, `prProblems`, *I'm traveling* toggle; `empStatus` in Profile | Round-trip pass use and the resulting picker limit remain undecided. **The customer wording about round trips is removed**, and the picker stops only at the remaining balance. | Blocked | Blocked | Q13 (synthesis p16, p25) | Coverage suite: no round-trip wording; picker stops at the balance; `compLeft` unchanged after a search. |
| **NMA-1019** Assistance for employee travelers | Assistance for any Pass Rider traveler in Business or Leisure, including companions, carried into the search. · Standard questionnaire | Same indication and questionnaire with Pass Rider traveler keys | None | Complete | Complete | — | Coverage suite: assistance required for *You* and *Companion Pass 1* when on. |

### Profile and saved preferences

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-19** Name and membership number | Read-only name and AGR number; optional middle initial added once; Customer Care guidance for name changes. · Profile personal details | `profileRows` (Familiar), `profileV3` cards (Brand forward), `EDITORS.mi` | Make removed the *Middle initial already added* scenario from the menu. The locked state is still reachable by adding one. | Complete | Complete | — | `lockChip` on name and number; MI locked after saving; call-us line. |
| **NMA-919** Date of birth | Optional DOB, valid date entry, saved value, save and error feedback, one display format. · Profile personal details | `EDITORS.dob`, `SAVE.dob` | None found | Complete | Complete | Date bounds not defined (old Q6) | `validDob`, MM/DD/YYYY, "Please enter a valid date". |
| **NMA-20** Employee pass details | 9-digit pass number and 3-digit personal index; existing values, validation and save feedback; remaining passes and **renewal information**; dependents don't see pass counts; **no delete control**. · Profile › Employee details | `EDITORS.employee`, `SAVE.employee`, `empStatus` (`profile.js`) | **Renewal information is missing. A delete path exists:** the *Are you an employee? No* option removes the saved details (probe confirmed), which contradicts "offer no delete control". Backend ineligibility removing the details isn't modeled. | Partial | Partial | Was pending; now approved | `PASS_RE`, `INDEX_RE`. `x.emp === 'no' && cur` adds removal text. |
| **NMA-21** Change email | Verification steps for the current account state, new-email validation, code verification, success and error, return to Profile, **notifications to the old and new addresses**. · Profile contact details › verification flow | `startVerify('change-email')`, `SCR.verify`, `endVerify` | **The old/new address notifications aren't shown or described.** The expired-session (re-authentication) and unverified paths exist, but Make removed the Session token control and the Unverified scenario, so they can't be reached. | Partial | Partial | NMA-980 (verification) outside this list | Steps by token state in `startVerify`. "Your email has been updated" toast. No notification copy anywhere. |
| **NMA-22** Change phone | Country code, US/Canada and international formats, saved values and validation; no ownership check; a number isn't rejected for being on another account. · Profile contact details | `EDITORS.phone`, `SAVE.phone`, `DIAL` | Make removed the *International member* scenario from the menu; switching to International in the editor still demonstrates it. | Complete | Complete | Phone types not final (old Q6) | 10-digit US check, 5–15 digits international, country-code select. |
| **NMA-23** Billing address | **Add, edit and delete** states, country-specific fields, required-field and format errors, saved values, confirmation, source field limits. · Profile billing details | `EDITORS.address`, `SAVE.address`, `HOOKS.country` | **No delete** (probe: no remove-address control in either concept) | Partial | Partial | Clear-on-country-change rule (old Q5) | Street limit 2–32 characters, ZIP/postal patterns, state/province selects, Undo. |
| **NMA-992** Password reset email | Confirmation email sent only after a successful reset, with security guidance, no password, and delivery-failure behavior. · Account email channel (not a booking screen) | **Nothing:** no email template, reset flow or delivery-failure handling | Email artifact (template), delivery-failure behavior | Missing | Missing | — | No "reset" code found. |
| **NMA-26** Saved assistance type | Two choices (disability, or station assistance without disability); review and change; no companion or no-assistance options. · **Profile › Assistance requests** (account holder) | `SCR['assist-profile']` (profile mode `catBlock`). Reached from **Account › Assistance**, not from inside Profile. | The IA home differs: page 03 places Assistance inside Profile. | Partial | Partial | — | `catBlock` profile mode uses `['disability','station']` only. |
| **NMA-27** Saved disability needs | Disability branch using the 995 rules, Profile save, confirmation, error and retry; completed before saving. · Profile assistance questionnaire | `assistForm` (profile), `A['assist-save']` via `runSave` | The error and retry states exist (`runNet`), but Make removed the Network control, so they can't be triggered. IA home as in NMA-26. | Partial | Partial | Device and animal subquestions belong to out-of-target NMA-29 and NMA-628 | Same `assistErrors` rules; success message; PWD side effect (`pwdPreview`). |
| **NMA-28** Saved station needs | No-disability station branch with accessible seat, Profile save, retry without losing selections. · Profile assistance questionnaire | Same as NMA-27 | Retry can't be triggered (no Network control). IA home as in NMA-26. | Partial | Partial | Device and animal detail are out of target (NMA-29, NMA-628) | Station branch keeps `seat`. |

## Status count (34 stories)

| Status | Count | Stories |
|---|---|---|
| Complete | 22 | 607, 608, 118, 984, 1004, 43, 566, 624, 613, 615, 614, 995, 996, 997, 623, 1016, 622, 1017, 1019, 19, 919, 22 |
| Partial | 6 | 20, 21, 23, 26, 27, 28 |
| Missing | 1 | 992 |
| Blocked | 5 | 1060, 611, 612, 973, 1018 |

*Round 2 (2026-11-02) moved 118, 984, 624, 614 to Complete. 973 and 1018 stay Blocked, with their clear parts implemented. The Profile stories (19–28, 992) weren't part of this round.*

Both concepts reach the same status on every story. The traveler, discount, assistance and booking-mode rules share one code path (`clear.js`, `travelers.js`, `fields.js`). The concepts differ only in presentation: cards versus overview and sheets; pushed editors versus inline editing in Profile.

## Out of target: explorations kept, not claimed

| Story | What exists | Treatment |
|---|---|---|
| NMA-600 Station search | Typed search, ranking, ZIP/landmark matching, no-results message, full list | Keep as an exploration. The ranking and matching rules are disputed and must not be presented as final. |
| NMA-1084 Map, NMA-1085 Near me | Nothing | No action |
| NMA-29 Device details | Not built beyond the wheelchair question | No action |
| NMA-628 Service animal, NMA-621 Accessibility guidance | Supporting-information placeholders ("Content not defined yet") | Keep as placeholders |
| NMA-697 Coupon wallet | **Full My coupons screen in Profile** (available, used and expired, details, Apply) | Keep as an exploration, but label it as in grooming in the reviewer notes. Make removed the reviewer notes, so nothing says this now. |
| NMA-620 | Nothing | No action |

Cancelled stories (NMA-44, 609) aren't present. *Travelers · 3 saved* on Account is an App Shell placeholder row ("isn't part of Sprint 4"), not a Traveler Info deliverable.

## Findings that cut across stories

1. **Reviewer tooling removed by Figma Make.** The Network, Session token, Text size, Flow, Assistance-entry and Motion controls are gone, along with the screen notes, question markers and the Handoff tab. Approved states that exist in code can no longer be shown: offline, slow and service errors (607, 608, 613, 622, 623, 27, 28), the re-authentication and unverified paths (21), and the archived concepts. Unresolved-rule notes are no longer visible anywhere outside the repository.
2. **Assistance entry and saved-assistance prefill are tied together.** NMA-973 and NMA-614 both need the entry/CTA mapping decision. The current build removed the Fare Finder indication and prefill, which leaves both approved stories unmet.
3. **Rules that are still open are shown to customers as settled.** The 335-day horizon text and the round-trip companion-pass wording should be reviewer-flagged and kept out of the customer UI until decided.

## Sequenced implementation checklist

Order: restore the ability to demonstrate and review first, then decisions, then approved gaps, then IA, then the blocked items once decided. Each item applies to **both concepts** unless noted.

### Stage 0: before any changes
- [ ] Confirm this audit with the product owner, especially the IA placement of Assistance and how Make's controller changes should be treated.
- [ ] Turn the scratch test suites into repository tests (`tests/`) that use the new controller, so later stages can be verified without stand-ins.

### Stage 1: reviewer tooling (outside the customer UI)
- [ ] Add reviewer-only state controls to the floating controller: Network (online, offline, slow, server error), Session token (valid, expired) and Text size. *(Unblocks evidence for 607, 608, 613, 21, 27, 28 and 973's no-connection state.)*
- [ ] Restore the three scenarios Make hid (middle initial, international, unverified) under an *Edge cases* group, or document how to reach those states in the app.
- [ ] Bring back a reviewer notes view, collapsed, outside the device: stories on screen, open questions, approval status. Put the provisional and grooming labels there (NMA-697, NMA-600).

### Stage 2: decisions needed (product owner)
- [ ] **NMA-973 / 614:** the assistance entry/CTA mapping: the Fare Finder indication and Continue, versus Travelers only (current verbal guidance). This also decides 614's "indication on by default".
- [ ] **NMA-611:** Young adult with infant precedence (BR7 vs BR9).
- [ ] **NMA-612:** reconcile the source matrix with the open review comment.
- [ ] **NMA-1060:** the 335-day limit and its reference date; missing-return message or disabled action.
- [ ] **NMA-1018:** round-trip companion pass use (per companion or per booking), and the resulting picker limit.
- [ ] **NMA-613:** code format (digits only or alphanumeric) and offline checking.
- [ ] **NMA-26–28:** confirm Assistance moves inside Profile, as on page 03.

### Stage 3: approved gaps with clear rules
- [ ] **NMA-624:** show *Use points* to guests (cash default; no balance; sign in after choosing a fare). Keep it hidden for TripLink and Pass Rider. Update the summary and the submitted search.
- [ ] **NMA-118:** sort favorites alphabetically; keep them before recents.
- [ ] **NMA-984:** add Sign out to Account and clear recents on sign-out (favorites kept). Make the 10-day window one configurable constant.
- [ ] **NMA-23:** add *Remove billing address* with confirmation, a removed state, and *Add* afterwards.
- [ ] **NMA-20:** remove the delete path from the employee editor (the details can't be removed by the user). Add renewal information next to remaining passes (employee only; dependents see no allocated counts). Model backend ineligibility (fixture) removing the details.
- [ ] **NMA-21:** state the notifications to the old and new addresses (confirmation copy and a reviewer note on the email events).
- [ ] **NMA-992:** add a reviewer-viewable password-reset confirmation email: sent after a successful reset, security guidance, no password, plus the delivery-failure behavior. Keep it out of the booking flow.
- [ ] **NMA-614 (clear part):** stop writing Profile assistance into an open booking from `A['assist-save']`. Prefill Traveler 1 at booking start when signed in (blocked only for the default-on indication until 973 is decided). Make sure booking edits never write back to Profile.

### Stage 4: IA alignment
- [ ] **NMA-26–28:** move Assistance inside Account › Profile (Personal, Employee, Discounts, Assistance, Coupons, per page 03), keeping the Account shortcut only if the IA allows it. Keep the Passenger discounts ↔ Assistance link (NMA-43).

### Stage 5: after the Stage 2 decisions
- [ ] **NMA-973 / 614:** implement the agreed entry: indication, explanation, Continue, no-connection state, default-on from saved requests or the disability discount. Remove whichever competing entry loses.
- [ ] **NMA-1060:** apply the confirmed horizon and missing-return treatment; remove the customer-facing "335 days" text if it isn't confirmed.
- [ ] **NMA-1018:** apply the confirmed pass-use rule and limit; replace the current customer wording.
- [ ] **NMA-611 / 612:** apply the decided accompaniment rule and the reconciled matrix.
- [ ] **NMA-613:** apply the decided format and offline behavior.

### Stage 6: verification
- [ ] Re-run the repository tests in both concepts. Exercise each changed scenario, including edits after an initial choice, back navigation, and the submitted search.
- [ ] Run an accessibility scan (light and dark, 100% and 140% text, iPhone and iPad).
- [ ] Update this matrix, moving stories to Complete only when exercised.


## Round 2 changes (2026-11-02)

- **Reviewer controller:** Figma Make's controller gains a *Network* menu (online, offline, slow, server error) and collapsible *Screen notes* (stories, open questions, things to try), outside the device.
- **Stations:** favorites sorted alphabetically without duplicates (`favList`); recents in one place with configurable retention (`RECENT_DAYS`, `recentList`); *Sign out* on Account clears recents and keeps favorites; the clear-recents dialog says favorites stay.
- **Calendar:** the unconfirmed booking-window text is removed from the app; the window and the missing-return treatment are flagged (Q4, Q25).
- **Cash or points:** guests can choose Points without signing in; members see their balance (`payControl`).
- **Assistance:** the indication, explanation and Continue are on the Travelers screen (proposed mapping, Q7); every traveler answers while it's on; selected, cleared, return/edit and no-connection states; Traveler 1 prefilled from Profile with the indication on when saved requests or a disability discount exist (NMA-614); trip changes never write back.
- **Employee and corporate:** the round-trip companion-pass rule is removed from the customer UI and the picker stops at the remaining balance (Q13); new *TripLink and Pass Rider* scenario with no preselected mode (Q26).

### Verification (round 2)

- **New coverage suite** (`cov.js`): 118 checks across both concepts, all passing.
- **Existing suites:** see the commit message. They were updated where behavior intentionally changed (Traveler 1 prefill, the assistance indication gating per-traveler questions, the round-trip pass wording, the clear-recents text).

### Updated checklist status

- Stage 1: Network control and Screen notes **done**. Session token, Text size and hidden scenarios still to restore (NMA-21 evidence).
- Stage 3: 624, 118, 984 and 614 (clear part) **done**. 23, 20, 21 and 992 remain.
- Stage 5: 1060 and 1018 customer wording removed pending decisions; 973 proposed mapping implemented pending agreement.
