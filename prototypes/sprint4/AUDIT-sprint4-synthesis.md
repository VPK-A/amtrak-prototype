# Sprint 4 coverage audit: `figma-make/sprint-4` against the User Story Synthesis

- **Branch audited:** `figma-make/sprint-4` at `97ba999` (latest Figma Make import). Working tree clean, nothing stashed.
- **Authority:** *NMA Sprint 4 User Story Synthesis*, approval baseline of October 30, 2026. Page 03's sketches show placement only.
- **Scope:** 34 approved stories. Out of target: NMA-600, 1084, 1085, 29, 628, 621, 697, 620.
- **Concepts:** both exist in this branch: **Familiar** (Concept 1) and **Brand forward** (Concept 3, formerly Overview). Concepts 2 and 4 are archived and not audited.
- **First pass:** no prototype changes were made.

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
| **NMA-607** One-way search | Origin and destination, swap, departure date, travelers and Find trains. One-way and today by default. Identical stations prevented. Lorton/Sanford Auto Train pairing. · Fare Finder | `SCR.ff` (Familiar) and `ffClear` (Brand forward); `routeField`, `dateFields`, `A['choose-station']`, `A.swap`. Book › New booking. | None found. The offline and slow states exist in `runNet` but can't be triggered: Make removed the Network control. | Complete | Complete | — | `freshBooking`: `trip:'ow', dep:TODAY_S`. Same-station dialog and Auto Train pairing in `A['choose-station']`. The requirements suite passed 190/190 in both concepts. |
| **NMA-608** Add a return | Round-trip choice and *Add return*; both dates start today; stations and travelers keep their values. · Fare Finder | `tripSeg`, `A.trip`, `A['add-return']` | None found | Complete | Complete | — | `A.trip` sets `ret = dep`. *Add return* switches to round-trip. Tested in both concepts. |
| **NMA-1060** Travel dates | One calendar for both dates. Past dates and returns before departure disabled. An invalid return is cleared. Date and weekday shown on the Fare Finder. · Date picker from either date field | `calendarBody`, `A.day`, `A.picking`; Depart/Return field | The 335-day limit and its reference date, and how a missing return is treated (message or disabled action), aren't decided. The prototype shows "Dates up to … (335 days)" to customers and an error on Find trains. | Blocked | Blocked | Synthesis p05 and p25 | `WINDOW_DAYS = 335` (`data.js`). Return cleared with a notice in `A.day`. Disabled-day logic in `calendarBody`. |
| **NMA-118** Favorite stations | Star (add/remove), favorites list sorted alphabetically, shown before recents, no duplicates, saved locally for guests and members. · Station selector | `stationRow` star (`A.fav`), Favorites section in `stationSearch` | **Favorites aren't sorted alphabetically.** They keep the order they were added (probe: WAS, BOS, NYP). | Partial | Partial | Profile sync is future work | `stationSearch`: `favs = d.fav.map(...)` with no sort. `A.fav` appends. |
| **NMA-984** Recent stations | Recents ordered by latest choice, kept 10 days (configurable), no duplicates, empty section hidden, cleared on logout, favorites first. · Station selector | Recents section in `stationSearch`; `A['choose-station']` writes recents | **No sign-out exists**, so clearing recents on logout isn't implemented or reachable (probe: no sign-out anywhere). The 10-day limit is hard-coded in two places. | Partial | Partial | — | `d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).sort(...)`. Section hidden when empty. |
| **NMA-1004** Clear recents | *Clear recent stations* with confirmation, cancel and cleared state. Favorites kept; new recents appear afterwards; works offline. · Profile or settings | Account › Quick settings › *Clear recent stations* opens a "Clear recent stations?" dialog | None found. The IA position (Account › Quick settings) is a design recommendation, as the synthesis allows. | Complete | Complete | — | `SCR.account` `clearRow`, `clearDialog()`, `A['clear-recents']`. Probe: the dialog opens in both concepts. |

### Travelers and discounts

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-611** Who's traveling | Counts for Adult 18–64, Senior 65+, Young adult 16–17, Youth 13–15, Child 2–12 and Infant 0–1. One adult by default. At most 8 occupied seats, using the source infant-seating rules. · Travelers, with a summary on the Fare Finder | `travelersClear` counters; `paxProblems`, `paxOccupied`, `lapCap`, `canAdd` (`clear.js`); summary in `travelersRow` / `ffc-trav` | The Young adult with infant case is blocked under BR9 but not decided. | Blocked | Blocked | Young adult accompaniment conflict (synthesis p08, p25) | Seat limit and lap ratio in `clear.js`. The fix suite passed 32/32 and the requirements suite covers the limits. |
| **NMA-612** Discount per traveler | One eligible discount per traveler, including several travelers of the same type. Saved defaults and assistance-related overrides from the source matrix. · Each traveler under Travelers | Familiar: `discountRow` on each card. Brand forward: inline select in `overviewTravelers` and `discountRow` in the traveler sheet. Rules: `tdiscOf`, `discOpts`. | The source matrix needs reconciling: approved under the VK rule, but the latest review comment still asks for fixes. | Blocked | Blocked | Synthesis p08, p25 | Per-traveler keys in `b.tdisc`. A removed traveler's selections are cleared by `forgetTraveler`. Tested. |
| **NMA-43** Saved passenger discount | Saved Military, Rail Passenger Association (6–10 digit ID) or Passenger with disability, connected to profile assistance. · Profile › Passenger discounts | `SCR.discounts`, `A['disc-save']` | None found | Complete | Complete | — | RPA check `/^\d{6,10}$/`. PWD requires assistance "I have a disability" (`go-assist`). The Fare Finder uses it as the Traveler 1 default (`freshBooking.disc`, `profilePwd`). |
| **NMA-566** Benefit and eligibility guidance | Readable groups of passenger and discount guidance from the content system. · Profile › Passenger discounts | `SCR.rules` (info sheet *Passenger types and discount rules*), `RULE_GROUPS` | Content is placeholder text, by design. | Complete | Complete | AEM content | Grouped accordions in `SCR.rules`, linked from `SCR.discounts`. |
| **NMA-624** Cash or points | *Use points* for **guests and members**, cash by default, available points shown to members. Choosing points changes shopping intent only; guests sign in later, after choosing a fare. Hidden for TripLink and Pass Rider. · Fare Finder | `payV1` (Familiar), `.ffc-pay` (Brand forward) | **Guests get no points choice** (probe: guest has no Pay with control in either concept). The reviewer notes still call this story provisional. | Partial | Partial | Was provisional; now approved | `payV1`: `if (!D().signedIn) return ''`. `ffClear`: `member && std`. |
| **NMA-613** Coupon or promotion | Visible optional Discount code field, manual entry, saved-code choice, validation, applied and error states, information and removal. Eligibility rechecked after relevant edits. Hidden for points and restricted modes. Removing it doesn't delete the profile coupon. · Fare Finder, booking level | `codeField` (`fields.js`), `INFO['saved-codes']`, `searchWithCode` / `checkCode` (`clear.js`) | The service-error state exists but can't be triggered from the controls Make kept. The position after Travelers is proposed. | Complete | Complete | Code format (digits or alphanumeric) and offline checking aren't decided (old Q23) | `codeStateOf` handles recheck. The requirements suite exercised invalid, ineligible, applied, changed, error, remove and points-hidden states. |

### Passenger assistance

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-973** Someone needs assistance | Assistance indication, explanation, Continue into the questionnaire. Selected, cleared and no-connection states. A Travelers entry reconciled with the required Fare Finder indication. · Fare Finder journey | **No indication on the Fare Finder.** It was removed per verbal guidance on 2026-10-30. Assistance starts per traveler in Travelers. | Indication, explanation, Continue, its no-connection state, and the reconciled mapping | Blocked | Blocked | Synthesis p12, p25: "exact interaction mapping still needs agreement". Verbal guidance said Travelers only. | `fields.js`: the check was removed in commit `984c1b3`. Story conflict recorded in Q7 (`data.js`). |
| **NMA-615** Assistance type per person | Four choices per traveler, selection, confirmation, editing, companion eligibility. Show whose answers are being edited and summarize by traveler. · Traveler questionnaire from the assistance entry | `assistanceRow` (Familiar) and the traveler sheet (Brand forward), questionnaire `SCR.assist`, rules `companionTargets`, `assistProblems` | None found | Complete | Complete | Depends on the 973 entry decision | Type required (`assistErrors`). One personal companion per traveler with a disability. Tested in both concepts. |
| **NMA-614** Saved assistance in booking | **Prefill Traveler 1** when signed in. Indication on by default when saved requests or a disability discount exist, otherwise off. Edits and deselection don't write back to Profile. · Fare Finder prefill and the traveler questionnaire | Prefill was removed (`freshBooking`: `assistOn:false`, blank assist). The profile disability still sets PWD. **Inconsistent:** saving Profile assistance mid-session copies it into the booking (`A['assist-save']`). | Traveler 1 prefill. The default-on indication, which depends on 973. Saving in Profile shouldn't write into an open booking unless prefill is the approved behavior. | Missing | Missing | Default indication depends on the 973 mapping. Save to profile is later (NMA-1051). | Probe: `assist` scenario gives `assistDone=false`, PWD set. `A['assist-save']` writes `d.booking.assist` when the booking has no answer or one from the profile. |
| **NMA-995** Disability needs | Required disability choice, conditional needs, the wheelchair-space decision, and the accessible seat / large service animal rules. Confirm and edit. · Disability branch | `disBlock`, `wcBlock`, `needsBlock`, `assistErrors` | None found | Complete | Complete | — | Seat and animal exclusive when a wheelchair space is needed (`needsBlock`). At least one disability, and the wheelchair decision, enforced. Tested. |
| **NMA-996** Station assistance needs | No-disability branch with accessible seat; edit before and after confirming. · Station branch | `needsBlock` for station: seat only | None found | Complete | Complete | — | `fromDraft` station keeps only `seat`. Tested. |
| **NMA-997** Companion needs | Station assistance for a personal companion; accessible seat depends on it; review and edit; follows CORE. · Companion branch | `needsBlock` for companion | None found | Complete | Complete | CORE caveat kept | Seat disabled until Station assistance is chosen. Tested. |

### Employee and corporate travel

| Story | Required behavior · IA home | Existing screen / component · how to reach it | Missing screens, interactions or states | Familiar | Brand forward | Unresolved or dependency | Evidence |
|---|---|---|---|---|---|---|---|
| **NMA-623** Employee pass travel | Pass Rider mode for eligible users, on by default, Regular available. No points, traveler discounts or coupons while on. Assistance available. · Fare Finder mode control | `modesV1` / `ffcSeg` *Book as: Pass Rider \| Regular*; `setIntent` | None found | Complete | Complete | — | `freshBooking.intent`. Restricted options hidden. Tested with the passrider fixtures. |
| **NMA-1016** Business or Leisure | Business and Leisure only with an active Business Pass. An explicit choice is needed before Find trains. Others get Leisure by default. Auto Train is Leisure only. · Employee Fare Finder | Travel type segmented control; `findBtn` disabled until chosen; `autoTrainBlocked` | None found | Complete | Complete | Pass Rider policy placeholder (NMA-1081) | Tested: no preselection, button disabled, Business blocks and clears Auto Train. |
| **NMA-622** TripLink corporate | Corporate or Personal for linked Concur accounts, corporate by default. One traveler, assistance allowed, no points, discounts or coupons. Auto Train rejected after Find trains. · Fare Finder mode | *Booking for: Corporate \| Personal*; Auto Train dialog in `A['find-trains']` | None found | Complete | Complete | — | Tested, including restoring travelers and the code on switching back. |
| **NMA-1017** Family travelers | Leisure selection for employee, retiree, spouse and dependent combinations. Dependents 16+ may travel alone; younger ones need an eligible adult. Adult/Child choices. · Travelers in the Pass Rider Fare Finder | `travelersClear` Pass Rider section, *I'm traveling* toggle, `prKind` type select, `prProblems` | Dependent age has no data source; it comes from fixtures. | Complete | Complete | Q16 identifiers and age | Probe: retiree, spouse, dependent and minor fixtures. Child-only search blocked. |
| **NMA-1018** Companion passes | Companion counts for employees in Leisure, remaining balance, Adult/Child, eight-person limit. Hidden for spouse, dependent and retiree; disabled at zero. Remaining passes also in Profile. · Employee Travelers picker | Companion counter, "x of 16" balance; `empStatus` in Profile | **The round-trip use rule is shown to customers as decided** ("A round trip uses 2 for each companion"). The synthesis says per-companion or per-booking use, and the resulting limit, are open. | Blocked | Blocked | Synthesis p16, p25 | `prPassesPer`, `prCompMax`, `prProblems` (`clear.js`). |
| **NMA-1019** Assistance for employee travelers | Assistance for any Pass Rider traveler in Business or Leisure, including companions; each person's answers carried into the search. · Standard questionnaire in the employee Fare Finder | `travelerList` Pass Rider keys, the same `assistanceRow` and questionnaire | None found | Complete | Complete | Was pending; now approved | The handoff lists assistance per Pass Rider traveler. The account holder's record is tied to *You*. Tested. |

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
| Complete | 18 | 607, 608, 1004, 43, 566, 613, 615, 995, 996, 997, 623, 1016, 622, 1017, 1019, 19, 919, 22 |
| Partial | 9 | 118, 984, 624, 20, 21, 23, 26, 27, 28 |
| Missing | 2 | 614, 992 |
| Blocked | 5 | 1060, 611, 612, 973, 1018 |

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
