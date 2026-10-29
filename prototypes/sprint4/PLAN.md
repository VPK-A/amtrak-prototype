# Sprint 4 prototype alignment plan

Concepts: **1 Familiar** (V1), **2 Guided** (V2), **3 Overview** (V3), **4 Compact** (V4). This is an incremental change: each concept keeps its IA, interaction model, layout and look, and the switcher, scenarios, reset and per-version state keep working.

## 0. Source reconciliation

The handoff said "31 stories". The export (`NMA_Sprint_4_Combined.docx`, exported October 26, 2026) has **66 issues**:

| Category | Count | Issues | Treatment |
|---|---|---|---|
| User stories, active | 42 | See §3–§5 | Designed, or flagged where undefined |
| User stories, cancelled | 2 | NMA-44 (duplicate of NMA-43), NMA-609 (Auto Train search) | Not built as features. Auto Train pairing stays, through NMA-607 and 608 |
| Feature | 1 | NMA-73 (passenger types and discount rules) | Parent of NMA-566; covered by it |
| Task | 1 | NMA-310 (Milestone 4) | Delivery work, not UI |
| Sub-tasks, delivery | 14 | NMA-391–404 (planning, development, QA and release under NMA-310) | Not UI |
| Sub-tasks, PO review | 6 | NMA-949, 950, 951, 954, 966, 968 | Review gates for NMA-19, 20, 919, 22, 23, 21. Not UI |

Statuses: 24 Analyzing, 21 Backlog, 19 FUNNEL, 2 Cancelled.

Stories with no defined content: NMA-620, NMA-621, NMA-628, NMA-629. They stay labeled placeholders, with no invented behavior or copy.

## 1. Shared components and business logic to update

| Area | Today | Change (shared, used by all four) |
|---|---|---|
| Traveler model | `paxList(b)` for standard; Pass Rider counts in `prPax`; Corporate is fixed | One `travelerList(b)` for every intent, with stable keys and labels (*Traveler 2 · Adult*, *Dependent 1*, *Companion Pass 1*) |
| Per-traveler assistance | One record (`b.assist`), always Traveler 1 | `b.assist` stays Traveler 1's record (from the Profile, NMA-614 BR5.1). Other travelers get their own record in `b.ta[key]`. The questionnaire screen takes the traveler as a parameter |
| Assistance type rules | Personal Companion shown, always disabled | Enabled when another traveler has *I have a disability* and has no companion yet: one companion per traveler with a disability (NMA-615 BR2.1, 2.2). Companion needs are Station Assistance, and an accessible seat once Station Assistance is chosen (NMA-997) |
| Discounts | PWD for Traveler 1 only | PWD for any traveler with *I have a disability* (NMA-43 BR8). A Personal Companion's discount is overridden to *Companion*, and the earlier choice returns if the type changes (NMA-43 BR8 AC3). Not available for Corporate or Pass Rider (unchanged) |
| Assistance list | One summary card for Traveler 1 | A shared list of every traveler, each with *Add* or *Edit* and their summary. Each concept hosts it in its own way |
| Offline assistance | The questionnaire opens offline | Opening the questionnaire needs a connection (NMA-973). Once it's open, it can be completed offline. Find Trains still needs a connection (NMA-995, 996, 997) |
| Profile: Employee details | Not present. Pass Rider comes only from a scenario | New Profile row and editor (NMA-20): Amtrak employee yes or no; relationship (employee or retiree, spouse, dependent); 9-digit Pass Number; 3-digit Personal Index Number; required-together and format errors; a "not yours" save failure; offline save blocked. A valid save turns on the Pass Rider Fare Finder (NMA-623), and removing it turns it off |
| Profile: My Coupons | Saved codes appear only inside the booking code screen | New Profile row and screen (NMA-697): Available (soonest expiry first) and Used or expired (with PNR and usage date, newest first); empty state; details; manually add a 14-character code; *Apply* starts a booking with the code. Lounge passes are listed too. The booking code screen reads the same list |
| Station details | Tapping a row chooses the station | Tapping still chooses (NMA-600 Scenario 2). A separate details control on each row opens a supporting-information sheet with the station's code, name, city and state, labeled pending NMA-604 (Scenario 4) |
| Dates | Most concepts show weekday, month, day and year | One date formatter, so every Fare Finder shows the day name, month, day and year (NMA-1060 AC8) |
| Undefined content | Draft service-animal and accessible-travel text (added in the last change) | Replaced with labeled placeholders (NMA-628, 621). The links stay as entry points |
| Requirements notes | Story count 31; open questions Q1–Q14 | 66-issue inventory; new questions for the conflicts in §5 |

## 2. Concept-specific changes (presentation only, on the shared logic)

- **Familiar (V1):** the Fare Finder's assistance block lists every traveler. Profile gets *Employee details* and *My Coupons* rows with a pushed editor and screen. It stays the standard booking: TripLink and Pass Rider remain in V2–V4, as documented. Cash / Points stays.
- **Guided (V2):** the Who section's assistance and discount parts use the shared list, and the When summary shows the full date. Profile rows as in V1.
- **Overview (V3):** the *Discounts, codes and assistance* list summarizes all travelers' assistance. Profile cards for Employee details (edited in place, like other cards) and My Coupons (opens the screen).
- **Compact (V4):** the Assistance row summarizes every traveler and opens the travelers' assistance list. Profile rows as in V1.

## 3. Already satisfied (keep intact)

- **Profile:** NMA-19, 21, 22, 23, 919; verification NMA-980 (sign-in, change email, codes).
- **No app screen:** NMA-992 is a password-reset confirmation email sent by the back end. It's listed in the inventory, not designed in the app.
- **Profile assistance:** NMA-26, 27, 28. Profile discounts and rules: NMA-43, 566.
- **Stations:** NMA-118, 984, 1004 (favorites, recents, clearing them), 600 (search by typing, aliases, no results, full list).
- **Trip search:** NMA-607 and 608, including Auto Train pairing (Lorton and Sanford); NMA-1060 (calendar, 335-day window, return cleared after a later departure, both dates in one calendar).
- **Travelers:** NMA-611 (types, 8 maximum, accompaniment) and 612 (one discount per traveler).
- **Codes and modes:** NMA-613 (codes, including the companion coupon's two-traveler rule); NMA-624 (Cash / Points, restored in all four); NMA-622 (TripLink); NMA-623 and 1016–1019 (Pass Rider) in V2–V4.
- **Booking assistance:** NMA-614, 615, 973, 995, 996 for Traveler 1.
- **Interaction system:** motion, sheets, focused search; state persistence and reset.

## 4. Missing, to implement

1. Assistance for every traveler, including Pass Rider spouses, dependents and Companion Pass travelers (NMA-615 AC1, NMA-1019 AC2–3).
2. Personal Companion type and needs (NMA-615 BR2, NMA-997), and the companion discount override (NMA-43 BR8 AC3).
3. Online and offline entry to assistance (NMA-973).
4. Employee details in Profile, including dependents (NMA-20 BR1–BR8), linked to the Pass Rider Fare Finder (NMA-623).
5. My Coupons in Profile (NMA-697 BR1–BR4, BR6–BR8).
6. A distinct station-details control (NMA-600 Scenario 4, labeled pending NMA-604).
7. The full date (with year) on every Fare Finder (NMA-1060 AC8).
8. Placeholders only for NMA-620, 621, 628, 629.

## 5. Blocked: conflicting or incomplete definitions (shown in the prototype as open questions, not as finished)

| Issue | Conflict or gap | Prototype behavior until decided |
|---|---|---|
| NMA-611 accompaniment (Q10) | BR3 and BR4 count Adult, Senior and Young Adult (16–17) as accompanying travelers, but the Child copy says "at least one adult who is 18 years old". BR4 (Infant) reuses the Youth message | Keeps the current behavior (Adult or Senior needed) and flags both readings |
| NMA-21 vs NMA-980 (new question) | NMA-21 BR3 and BR4 ask for *Verify it's you* only when the 40-minute access token has expired; NMA-980 Scenario 12 always requires signing in again to change email | Follows NMA-21, with the toolbar's token setting; the conflict is flagged on the screen |
| NMA-29 | Partly defined. The story asks for wheelchair or mobility-device details under *I have a disability and reduced mobility*, while the prerequisite names *I do not have a disability…*; most table cells are "Open" | Not built as a feature: marked "awaiting clarification" in Profile assistance |
| NMA-623 vs NMA-20 (new question) | NMA-623 identifies Pass Riders by SAP ID and Index Number; NMA-20 by a 9-digit Pass Number and a 3-digit Personal Index Number | Uses NMA-20's fields and validation and flags the naming |
| NMA-600 Scenario 2 vs 4 | Tapping a station both chooses it and opens station details | Tap chooses; a separate control opens details (§1) |
| NMA-697 BR5 | The retention period for used and expired coupons is "X days"; notification channels are open | Shows used and expired coupons with "retention period to be confirmed" |
| NMA-1017 (Q13) | Family combinations listed without counts; dependents' own experience undefined (NMA-623 AC3–AC6 "are all experiences same?") | Current limits stay; dependents get Leisure only and no Companion Pass (NMA-1016 AC6, NMA-1018 AC2) |
| NMA-620, 621, 628, 629 | No content | Labeled placeholders |
| NMA-44, NMA-609 | Cancelled | Not built |

Distinctions kept explicit everywhere:
- A **personal companion** is an assistance type for a traveler accompanying someone with a disability, and gets the *Companion* passenger discount.
- A **Companion Pass** is an employee Pass Rider benefit, 8 per year.
- A **companion coupon** is a code type that needs at least two travelers.

## 6. Regression risks and what must stay intact

- **Traveler 1 assistance from the Profile** (prefill, *From your Profile*, the PWD default) must work exactly as now; `b.assist` stays its record.
- **Concept switching** keeps the location (`locOf` and `goLoc`), and the per-version state and reset (`VS`, `makeVS`, Reset).
- **Fare Finder behavior:**
  - V2 opens Where first and moves to When after the route.
  - V3 and V2 chain From to To.
  - Auto Train pairing; Cash / Points (codes unavailable with points); TripLink Corporate locking 1 adult.
  - Pass Rider Business and Leisure, companion passes left, no Auto Train.
- **Interaction system:**
  - Back and Close, the focused station search, the supporting-information sheets, the iPad split views.
  - Motion and reduced motion.
- **Profile:**
  - The V3 in-place editing with drafts; the discard guard; offline save messages.
  - Verification flows.
- **Scripted checks to rerun:** journey (119), s4flows, v1c, v2a–c, v3a–b, v4a–b, bm, pts, lvl2b, and axe in light and dark at 100% and 140%.

## 7. Status after the foundational pass

Done, shared by all four concepts:
- **§4 items 1–8:** per-traveler assistance; personal companion with the discount override; online and offline assistance entry; Employee details linked to Pass Rider; My Coupons; station details control; full dates; placeholders only for undefined content.
- **Booking modes:** TripLink and Pass Rider in Version 1, which removes its last coverage gap.
- **Open questions:** Q10 corrected to match the prototype's behavior; Q15–Q18 added.

Verified with the scripted suites in all four versions on iPhone and iPad:
- multi-traveler, 41 checks;
- Profile, coupons and station details, 59;
- journey, 119;
- every earlier suite;
- accessibility in light and dark mode at 100% and 140% text.

Second pass done: per-traveler remove, companion pairing, employee status, dependent Pass Rider, coupon states, Flow › J (see HANDOFF). Next, concept-specific polish (not started):
- the Guided Who summary wording for several travelers;
- an iPad layout pass on My Coupons;
- the Overview My Coupons card shown in place on iPad.
