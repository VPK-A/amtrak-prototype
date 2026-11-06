# Sprint 4 design exploration: handoff

## Review scope (current)

One New booking design is in review: the modal from Figma Sprint 4 (node 3295:51258). The Familiar / Brand forward switch was removed, along with Concept 3's booking screens; there's no concept toggle in the prototype controls. **2 · Guided** and **4 · Compact** stay archived (reachable only from their demo entries).

**New booking modal (Figma 3295:51258)**
- Navy sheet header with close, "New booking" and the brand arrows; One-way / Round-trip tabs; From and To stacked in one field group with the circular swap button; departure and return side by side; Travelers and Coupon or promotional code as selector rows; an action footer with Pay with points (a switch) and Find trains.
- Components live in the design system: `css/components.css` › Booking components and `js/ads-booking.js` (the markup renderers, shared with the DS catalog's *New booking (iOS)* section in `docs/`).
- Kept: every booking rule and validation (station, return date, travelers, assistance, Pass Rider travel type, TripLink, Auto Train), exit confirmation, booking modes for eligible members above the tabs.
- Changed interaction: the code is entered on its own screen (the row opens it; Done returns). Code results from Find trains show under the row. Pay with points is a switch instead of Cash / Points radios; turning it on still hides the code.
- The sheet uses the iOS type layer (`data-platform="ios"`); dates read 01/01/2027 with the weekday below, as in the design.

**Design-review revisions (dates, discount replacement, navigation)**
- **Dates:** two consecutive months show together on a portrait phone; later months scroll vertically through the whole 335-day window (`WINDOW_DAYS`). Vertical scrolling is this revision's direction; the review didn't settle the scrolling direction. Departure and Return are two tabs that show both choices; switching keeps the other date. Today, departure, return, the days between and unavailable days are distinct (with a legend). A new departure after the chosen return keeps the return but flags it ("Choose again") with guidance, and Done waits for a new return. The picker edits a draft: Done saves and returns to Fare Finder; Back returns without saving. No Close X.
- **Replace your discount?:** confirming assistance that would replace a traveler's different discount with Passenger with disability asks first. Replace discount saves the answers, applies the discount and returns to Traveler selection; Keep editing returns to the questionnaire with every answer kept and the old discount unchanged. Not shown when no discount was selected, when Passenger with disability already applies, or for station help without a disability. The traveler card says "Applied based on this traveler's assistance information. It replaced the … discount." Eligibility and precedence rules are unchanged; switching between several eligible discounts remains an open product question.
- **Navigation:** only Fare Finder has the X. Station search, Dates, Traveler selection, Assistance, the code screen and search results go Back one level (Assistance → Traveler selection; the others → Fare Finder). Done and Confirm save; Back keeps what was saved and never asks to abandon (Traveler selection's Back drops unsaved changes, as Cancel did; Assistance still asks "Discard changes?" when answers were changed). Search results → Back returns to Fare Finder with every selection. Leaving Fare Finder before anything is in the cart goes to Book with no warning, and Fare Finder reopens with the saved search (including a typed code). With an item in the cart, "Abandon booking?" offers Continue booking (keeps the cart, same screen) and Abandon booking (clears the cart and a typed code, returns to Book).
- **Simulated cart:** results aren't in Sprint 4, so the results hand-off has a sample train with "Add to cart" to make the abandon rule reviewable. It changes no fares, availability or cart eligibility rules.

**Select station** (station selector from New booking, Train status and Multi-Ride), matched to Figma Sprint 4 node 3295:51259
- Header: chevron Back and centered "Select station" (the field being edited is named for screen readers). List / Map tabs (text only). iOS type layer, no grabber.
- List view: the From / To group with the field being edited outlined (tap the other field to edit it instead; the swap button swaps both stations), "Search station", then the "Nearby stations" link, which replaces the My Location row and starts the same location and nearby search (permissions, errors and results unchanged). Nearby results, Favorites and Recents (with Clear recents) follow as full-width sections with 60px rows: code, city, station name, info and bookmark.
- Choosing a station fills the field being edited and the selector stays open on the other field (announced to screen readers, focus in Search station), until both have been chosen in this visit; then it returns to the screen that opened it. Back leaves at any point and keeps what's been chosen. Train status searches one station, so it has no From / To group and returns after one choice.

**Apply coupon** (New booking › Coupon or promotional code), matched to Figma Sprint 4 node 3346:47066
- Header: icon-only Back (chevron) and "Apply coupon"; Back returns to Fare Finder without saving and keeps the booking. No X, no grabber. iOS type layer.
- "Coupon or promotional code" field with the codes information beside the label, a clear button inside the field and "Codes should be 4 or 14 characters long." Then "Your coupons": one bordered list of the account's active, unused codes (name, benefit, "Expires MM/DD/YYYY", "Code: …") with an info button per row that opens the coupon's details. Upgrade coupons are left out (still in My coupons).
- Choosing a row puts its code in the field; choosing another simply replaces it, with no confirmation (the "Replace your code?" dialog was removed). Save code puts the field's code on the booking and returns to Fare Finder; an empty field removes the code. Inline errors keep the value: wrong length, used coupon, expired coupon. A typed code stays with this booking only and isn't saved to the account; every code is still checked against the trip when you find trains.
- Details keeps this page's scroll position and the typed code on Back. Loading and error follow the toolbar Network setting; empty and guest states say where saved coupons come from.


The sections below this one are the history of the exploration, and some still describe all four versions.

### 1. Confirmed stakeholder feedback

- (Superseded) Advance Concepts 1 (Familiar) and 3 (Overview). Replaced by one New booking design from Figma node 3295:51258.
- Remove Concepts 2 and 4 from the review switcher and keep their implementation in an archive.
- Booking is a focused modal with the bottom navigation hidden; stacked station fields; fewer repeated labels; scrolling is fine; design-system styling; selections are kept when returning from nested screens.
- Assistance is answered per traveler, from Traveler selection, with no assistance check on the Fare Finder.
- No prices or fare shading on the calendar.
- Approval notes, Jira IDs, unresolved-rule explanations and test controls stay in the reviewer interface (toolbar, notes, Handoff), not in the app.

### 2. Approved requirements (source companion, requirements document, approval tracker)

Approved items (assigned or tagged to VK count as approved): NMA-607, 608, 1060, 613, 611, 612, 973, 615, 995, 996, 1016, 623, 118, 984; 622, 1017 and 1018 through comments; 997 with its CORE caveat. In grooming: 614, 624, 600, 697, 980. Awaiting approval: 20, 1019. Approval doesn't mean a feature was already built; the requirements round below lists what was added.

**Requirements round (this update), Concepts 1 and 3:**
- **Core Fare Finder and calendar (607, 608, 1060):** one-way and today by default; round-trip starts today/today; different stations; one calendar for both dates; past dates and returns before departure disabled; a return before a new departure is cleared with a notice; day names; Auto Train pairing; no prices. The 335-day window stays configurable and flagged (Q4). Favorites and recents (118, 984) are unchanged; station ranking (600) stays provisional (Q1).
- **Discount code (613):** an always-visible optional *Discount code* field after the traveler summary, before Pay with and Find trains (placement proposed, Q21). Guests and members type a code; members can pick a saved code from a pop-up, soonest expiry first, with a toast. States: entered, checking, applied (kept when you come back), invalid format (not sent), not eligible, couldn't check (Try again and Remove), and trip changed (checked again). A failed or unchecked code is never shown as applied. Removing a profile code keeps it in My coupons. Hidden for points; not used for TripLink Corporate or Pass Rider. Format and offline conflicts: Q23. Responses are simulated: see the notes panel tips.
- **Travelers (611):** 1 adult by default; CORE age bands; at most 8 occupied seats, where a lap infant rides 1:1 with an Adult, Senior or Young adult and each extra infant takes a seat at the child fare; the 9-to-14 and group guidance; zero travelers blocked; Youth and Child need an Adult or Senior; a Young adult may travel alone but not with a Youth, Child or Infant unless an Adult or Senior is on the booking. The Young adult with Infant conflict (BR7 vs BR9) is isolated in Q10 and not counted as verified.
- **Discounts (612):** one discount per traveler, choices per type (seat infants can be changed, lap infants can't); a profile discount carries to Traveler 1; a disability saved in the profile sets PWD for Traveler 1; assistance answers set PWD or Companion. Summaries list only discounts that apply (no *No discount*).
- **Assistance (973, 615, 995, 996, 997):** stakeholder feedback: there's no *Traveler with disability or need help?* check on the Fare Finder in Concepts 1 and 3. Each traveler adds assistance in Traveler selection (Familiar: the traveler's card; Overview: the traveler's Edit), and only travelers who need help answer. This departs from NMA-973 and NMA-615 BR1.2, which need updating (Q7). Opening a traveler's questions needs a connection the first time; once loaded they can be finished offline. The questionnaire keeps its required choices, the wheelchair-space question, mutually exclusive needs and one personal companion per traveler with a disability. Booking assistance isn't prefilled from the profile, and there's no Save to profile or carry-over after signing in, because NMA-614 is in grooming.
- **Employee and corporate (622, 623, 1016, 1017, 1018):**
  - TripLink is on by default for linked Concur accounts, with 1 traveler and no points, discounts or codes, and assistance is still allowed. Auto Train shows an error after Find trains, with *Switch to Personal*. Switching back restores the travelers set aside and the payment choice.
  - Pass Rider is on by default for eligible users. The switch reads *Pass Rider / Regular*.
  - Business and Leisure are offered only with an active Business Pass. Neither is preselected, and Find trains stays disabled until one is chosen. Auto Train is blocked for Business only, and choosing Business clears Lorton and Sanford.
  - The booker can leave themselves off. Each added traveler is Adult or Child, and a child-only search is blocked.
  - Companions are for employees only and must travel with a family member. There are 16 one-way passes a year, and a round trip uses 2 per companion. Companions are shown but disabled at 0 passes.
  - Retirees, spouses and dependents get Leisure only and no companions. A dependent 15 or younger can't start Pass Rider; the age comes from the reviewer fixture (Q16).
  - The Pass Rider policy is a placeholder (NMA-1081). Points stay for comparison; NMA-624 is provisional (Q14). NMA-1019 and NMA-20 are pending (Q24).
- **Reviewer fixtures** (Scenario menu, outside the app): TripLink, Pass Rider employee with and without Business Pass, retiree, spouse, dependent 16 or older, dependent 15 or younger, guest, saved PWD, saved RPA.
- **Reviewer interface:** Q markers are off by default (*Question markers on screen* in the toolbar). Story IDs and open questions are listed in the notes panel. No Jira IDs appear in the app.

**Second core-flow review (this update):**
- **Assistance belongs to the right person (NMA-615 AC1):** Traveler 1's record is tied to the account holder (Adult 1, or *You* for Pass Rider). Before, it belonged to whoever was listed first, so it could move to a senior or a spouse.
- **Removed travelers take their selections with them (NMA-612 BR2, 615 AC1):** a traveler added later starts with no discount, assistance or Pass Rider type. Undo in Traveler selection still brings them back.
- **Discount choice open by default in Overview (NMA-611 BR10, 612 BR1):** each traveler who can choose a discount has it inline in the Travelers sheet; fixed discounts stay as chips, and Edit still opens assistance and companion.
- **Fare Finder assistance check:** stays removed per verbal stakeholder guidance (assistance lives on the travelers screen). This conflicts with NMA-973 AC1–AC3 and NMA-615 BR1.2, which need updating (Q7).

**Book landing (redesign from the reference):**
- **Header:** the App Shell header with avatar, *Hi, Alex*, tier and points, and the inbox. Guests see *Sign in*.
- **New booking:** a full-width *New booking · Where to?* entry that opens the Fare Finder modal.
- **Explore cards:** *Recommended trips* and *Favorite stations* (*Routes near me* for guests), equal heights, each with *Explore ›*.
- **Book again:** recent trips with route, station codes, date and train, and *Rebook*. Route names wrap. The list is hidden with no history.
- **More ways to travel:** a grouped list with Explore and Passes.
- **Layout:** warm page background; the bottom navigation stays, with Book active.
- **Actions:**
  - New booking and Rebook open the Fare Finder; Rebook fills in the route.
  - Favorite stations opens station search.
  - Recommended trips, Explore and Passes open labeled placeholders, because they have no Sprint 4 destination.
  - Inbox and Account open their sheets. Sign-in is unchanged.
- **Gaps:** no approved photography (the cards use token-colored illustrations), no trip-history service, and no destinations for Recommended trips, Explore or Passes.

### 3. Proposed refinements and unresolved requirements

**Design proposals** (not requirements, not stakeholder-confirmed): focused station search; supporting-information sheets; one month at a time in the calendar; Pay with below the code; sentence case; no hover states; layered sheets with focus return and scroll memory; a personal companion names who they accompany (Q19); a separate station-details control (Q3); Familiar's traveler cards with Cancel and Done; Overview's travelers overview, traveler sheet and Pass Rider card; the saved-code pop-up opened from *Use a saved code* (Q21); the Book landing layout.

**Unresolved, listed in the notes panel for the screens they affect:**
- **Stations and dates:** Q1 station ranking, Q2 pseudo-stations, Q3 select or view details, Q4 maximum booking window.
- **Profile:** Q5 country change and the address, Q6 phone types and DOB bounds.
- **Assistance and discounts:** Q7 where booking assistance starts, Q9 replacing or removing PWD, Q10 Young adult with an infant, Q18 wheelchair and mobility device details, Q19 who can be a personal companion.
- **Verification:** Q8 verification channel, Q15 reauthentication to change email.
- **Codes, points and coupons:** Q11 codes before a train is chosen, Q14 points (provisional), Q17 coupon retention, Q21 discount code placement, Q23 code format and offline.
- **Booking modes:** Q12 Corporate Auto Train and PWD in restricted modes, Q13 Pass Rider travelers, Q16 Pass Rider identifiers and dependent age, Q24 pending approvals (1019, 20).
- **Other:** Q20 fares on the calendar (removed), Q22 navigation while booking.

**Undefined stories:** NMA-620, 621, 628 and 629 are labeled placeholders only. NMA-29 is partly defined. NMA-44 and 609 are cancelled.

### Known issues for the next update

- **Regression tests aren't in the repository.** The scripted suites live in the design session's scratch folder and would need to be saved into the repo to keep being run.
- **Archived concepts share code with the reviewed ones.** Changes to shared components (calendar, station search, traveler model, Profile) also change Concepts 2 and 4, and nobody checks them any more.
- **Load order matters.** Several files override the same actions in turn (clear, travelers, overview, interact, fields, motion), so the order in `scripts/sprint4-assemble.mjs` (`JS_ORDER`) is part of the behavior. `fields.js` (Discount code field) loads after `interact.js` because it adds supporting-information topics.
- **Find trains checks live in one place** (`A['find-trains']` in `clear.js`) for Concepts 1 and 3. The archived concepts keep their own paths.
- **Some styles are changed when the page loads.** `chrome.js` removes hover styles and forced capitals from the loaded CSS, without editing the ADS files. Styles added dynamically later wouldn't be processed.
- **Two ways to run it, one source.** `npm run dev` / `npm run build` serve the source files through Vite (a small React wrapper mounts the prototype unchanged). `npm run build:standalone` writes the self-contained `prototypes/sprint4/index.html`. Both use `scripts/sprint4-assemble.mjs`; this document is embedded in both. Edit the source files, never the built output.
- **Each concept keeps its own copy of the data.** Edits in one don't appear in the other, by design for comparison; Reset restores all of them.
- **File names follow the old concept names:** `clear.js` is Concept 3 (Overview), `guided.js` is Concept 2, and `flighty.js` and `compact.js` are Concept 4.
- **The page remembers only Concepts 1 and 3.** Opening an archived concept isn't remembered, so a reload returns to the review.

Four directions for the same Sprint 4 scope, built on the ADS library and the App Shell IA. Each one runs on iPhone and iPad, in portrait and landscape.

## Opening and switching

- **Open it:** the published artifact, or `prototypes/sprint4/index.html` in any browser. It's one self-contained file with no network calls.
- **Controls and notes are hidden at first:** only the device shows. The round sliders button at the right edge (top right on phones) shows the title, the Prototype and Handoff switch, the toolbar and the screen notes together. Its label says whether it will show or hide them. *Hide controls and notes*, the same button, or Escape (outside the device) hides them again. Showing or hiding never changes the demo or the settings.
- **Toolbar** (the dark strip above the device; it isn't part of the app):
  - **Version** 1 / 2 / 3. Each version keeps its own data, so a change in V1 doesn't show up in V2. Switching keeps the same place in the flow; if you're on Billing address in V1, you land on Billing address in V3.
  - **Device** and **Orientation:** iPhone or iPad, portrait or landscape. The place in the flow and the data are kept.
  - **Flow / screen:** jumps to any flow through its real App Shell path. Book, Fare Finder and the station search opens the station search inside the booking sheet, just as tapping would. Every flow can also be reached by tapping, starting from the Book tab or the Account button.
  - **Scenario:** reloads the current version's data. Options: returning member, new user, saved assistance + PWD, saved RPA, middle initial already added, international member, unverified account, guest.
  - **Network:** Online, Offline, Slow connection (spinner with Cancel, timing out after 6 s) or Server error (Retry).
  - **Assistance entry (Concepts 2, 4):** Fare Finder (NMA-973) or Traveler Selection (Core Flow), for the archived concepts only. Concepts 1 and 3 have no Fare Finder check; assistance is added per traveler in Traveler selection (Q7).
  - **Session token:** set to Expired to see *Verify it's you* before Change email.
  - **Text size**, **Appearance** (light/dark) and **Question markers on screen**, which shows the purple **Q** markers in the app (off by default; the questions are always listed in the notes panel).
  - **Reset demo:** puts all four versions back to the default scenario.
- **Screen notes** (right-hand panel): the stories, open questions, provisional placements and things to try for the screen you're on. Tapping a Q marker highlights its entry.
- **Verification codes:** 123456 works, 000000 has expired, anything else is wrong.

## Sources

How conflicts were decided: stories and grooming notes first, then the App Shell IA, then the ADS design system, then Core Flow.

| Source | Status | Used for |
|---|---|---|
| NMA_Sprint_4_Combined.docx: 66 issues (44 user stories, 2 of them cancelled; 1 feature; 1 task; 20 sub-tasks) | Read in full; inventory in `PLAN.md` §0 | Requirements, rules, copy, open questions |
| IA App Shell Overview (PDF), summarized in `ia/app-shell.json` | Read | Destinations, header, sheets, landing rules |
| ADS library (`css/`, `tokens/`, `icons/`) | In repo | Every component and token |
| Core Flow Figma (`dkrhpF1qtC3EKeynFLnj3U`, node 7:96076) | Read through the Figma connection (screenshots and layer list) | Fare Finder layout, Traveler Selection, the PWD questionnaire's structure |

Most of Core Flow is out of Sprint 4 scope: search results, fare families, ancillaries, checkout, cancel/modify, private rooms. Only these parts were used: the App PWD flow, *Book* and *Search_Trigger*.

Stories with no content: NMA-620 (in-station assistance availability), NMA-621 (about accessible travel), NMA-628 (service animal info), NMA-629 (wheeled mobility device specs). They are shown as labeled placeholders only, with no invented copy or behavior. NMA-29 is partly defined and awaiting clarification (Q18). Cancelled NMA-44 and NMA-609 aren't built; Auto Train pairing stays through NMA-607 and 608. NMA-310 and its 14 delivery sub-tasks, and the 6 PO-review sub-tasks, aren't UI. NMA-992 is a back-end email with no app screen.

Fare Finder coverage is the same in all four versions: traveler types and counts (NMA-611), a discount per traveler (612), coupon and promo codes (613), Use Points (624), TripLink (622) and Pass Rider (623, 1016–1019), and assistance for every traveler (615, 973, 995–997, 1019). Each version presents them its own way. Version 1 shows booking modes as plain labeled controls above its form.

## IA conflicts and proposed resolutions

| # | Conflict | Resolution in the prototype |
|---|---|---|
| C1 | Core Flow's tab bar is Home · My Trips · Book · More. The IA's is Book · Trips · Train Status · Support. | The IA wins. Core Flow is used only for screen content. |
| C2 | Core Flow uses "Back / Exit" headers inside booking. | IA sheet behavior is used: the root screen of a sheet has Close (✕); a pushed screen has Back plus Close; a focused editor has Cancel and Save. |
| C3 | NMA-1004 says "Profile" in its title but "Settings" in its criteria. The IA has no Settings screen, only *Quick settings* in the Account sheet. | **Provisional:** *Clear recent stations* is an action row under Account › Quick settings. Guests can use it too. |
| C4 | NMA-43, 566 and 19 point to "My Profile › Discounts". The IA's Account sheet lists Profile but not discounts. | **Provisional:** Account › Profile › *Passenger discounts*. |
| C5 | Where booking assistance starts: NMA-973 puts the checkbox on the Fare Finder; Core Flow puts it in Traveler Selection. | **Unresolved.** It's a scenario toggle. Fare Finder is the default because stories outrank Core Flow. |
| C6 | NMA-600 says tapping a search result opens station details (NMA-604). In Fare Finder, a tap has to select the station. | **Unresolved.** In this prototype a tap selects. A separate details control is proposed but not built. |
| C7 | The earlier docs prototype titled the Account sheet "Profile". | Renamed to the IA label, **Account**. Profile is now a row inside it. |
| C8 | The IA says "Assistance" is in the Account sheet. | Used as is: Account › Assistance holds the Profile assistance flow. |

## Flow map: where each flow lives, how you get there, how you get back

| Flow | Destination | Entry point | Presentation | Return |
|---|---|---|---|---|
| Fare Finder (one-way, round-trip) | Book | Book › *New Booking · Where to?* | Booking sheet | Close (✕) goes back to Book. Find Trains goes to the labeled prototype handoff. |
| Station search, Favorites, Recents | Book | Fare Finder › From or To | V1 and V2 push it inside the sheet (on iPad, the right-hand pane). V3 opens it as a rounded sheet over the Fare Finder. | Choosing a station or tapping Back returns to Fare Finder with the field filled. |
| Calendar | Book | Fare Finder › Depart or Return | Same as station search | Done or Back goes to Fare Finder |
| Traveler Selection, booking discount | Book | Fare Finder › Travelers | Pushed inside the sheet (V3: rounded sheet with traveler types and per-traveler discounts) | Done goes to Fare Finder |
| Discount code | Book | Fare Finder › Coupon or promo code (all versions) | Rounded sheet | Add or choosing a saved code goes back to Fare Finder with a toast |
| Booking assistance | Book | The Fare Finder checkbox (default), or Traveler Selection (scenario toggle) | Pushed inside the sheet | Confirm shows the summary on the Fare Finder |
| Clear Recents | Account (global header) | Account › Quick settings › Clear recent stations | Confirmation dialog | Back to Account, with a cleared state |
| Profile details | Account | Account › Profile | Pushed inside the Account sheet | Save goes to Profile with a toast |
| Change email and verification | Account | Account › Profile › Email › Change | Full-screen cover over the sheet | On success: Profile plus "Your email has been updated". On Cancel: Profile, unchanged. |
| Passenger discounts | Account | Account › Profile › Passenger discounts | Pushed | Save goes to Profile |
| Discount rules | Account | Passenger discounts › *Passenger types and discount rules* | Supporting-information sheet over Passenger discounts | Close (or Escape) returns to Passenger discounts at the same scroll position |
| Profile assistance | Account | Account › Assistance | Pushed | Save shows the summary; Close goes to the app |
| Sign-in verification (demo) | Account | Account (guest) › Sign in | Full-screen cover | Back to the screen that was open, signed in |
| Unverified-account verification (demo) | Account | Saving any Profile change while the *Unverified account* scenario is on | Full-screen cover | Back to the editor, and the save finishes |

## Requirements checklist

Key: **S** = state shown. Story IDs are in brackets.

### A. Booking and stations

- [x] One-way is the default; Round-trip can be chosen; *Add Return* switches to Round-trip [607 AC1, AC7; 608 AC1]
- [x] From and To are both required; Find Trains says what's missing [607 BR2.1, BR3.2]
- [x] From and To can't be the same station: alert "Select a different station" [607 BR2.2]
- [x] Swap [607 AC4]
- [x] Auto Train: choosing Lorton fills Sanford, and the reverse, with an explanation [607 AC8–9]
- [x] Depart and Return default to today; past dates are disabled [1060 AC2–3]
- [x] Return can't be before Depart; changing Depart to after Return clears Return [1060 AC5–6]
- [x] Both dates can be picked in one calendar visit [1060 AC7]
- [x] Selected dates show day name, month, day and year [1060 AC8]
- [x] Maximum booking window, shown as 335 days after departure **(unresolved)** [1060 BR4.1]
- [x] Station search by code, city, state, station name, facility, alias or ZIP; results start after 1 character; "No results" after more than 2 [600 S3, S7]
- [x] Ranking order and pseudo-stations are marked **unresolved** [600 S3]
- [x] Full list grouped under state headers, alphabetical by state name; shown directly when there are no favorites or recents [600 S1]
- [x] Search works offline [600]
- [x] Add or remove a favorite with the bookmark, in every list; favorites come before recents; a favorite leaves Recents [118 S1–S11]
- [x] Unfavoriting puts the station back in Recents [118 S11]
- [x] Recents cover the last 10 days and never repeat a station [984 S1, 1A]
- [x] Clear Recents: confirmation "All Recent Stations will be removed." with Cancel and Confirm; afterward the Recents section is hidden; new selections add to Recents again [1004 S1–S5]
- [x] Offline, slow-connection (spinner with Cancel, then timeout) and error states on Find Trains [607, 608 network]
- [x] Find Trains ends at a labeled prototype handoff (search results are out of scope)

### B. Profile details

- [x] Name is read-only, with "Need to change your name? Call us at 1-800-307-5000" [19]
- [x] AGR number is read-only [19]
- [x] Middle initial: optional, one letter, can be added once; confirm, save, then a locked state with no edit control [19]
- [x] Phone: US/Canada (Mobile required, 10 digits; Home and Business optional and collapsed; Extension 3 digits) or International (country-code picker shown as "+44", 5–15 digits) [22]
- [x] Save is blocked when nothing has changed; error copy "Enter a valid phone number"; toast "Profile has been updated" [22]
- [x] Does changing the country code clear the number? Phone types? **(unresolved)** [22]
- [x] Billing address: US/Canada (state or province, ZIP or postal pattern) or International (no state, postal code required) [23]
- [x] Does changing country clear the address? **(unresolved).** The prototype follows the criteria (fields clear) and offers Undo. [23]
- [x] Optional date of birth (MM/DD/YYYY), "Please enter a valid date"; date bounds **(unresolved)** [919]
- [x] States for every editor: saving, success, validation, technical failure with Retry, offline view (saving needs a connection) [19, 22, 23, 919]

### C. Discounts

- [x] Profile discount preference, one at a time: Military, Rail Passenger Association, Passenger with Disability. Youth, Military Youth and Senior aren't offered [43 BR1–4]
- [x] RPA requires a Membership ID of 6–10 digits, digits only [43 BR7–8]
- [x] Leaving without saving keeps the previous preference; saving with no discount is allowed [43 BR5]
- [x] Choosing Passenger with Disability points to Assistance; PWD can't be saved without saved assistance [43 BR9]
- [x] Saving "I have a disability" assistance switches the preference to PWD and says so; what replacing or removing PWD does elsewhere is **unresolved** [43 BR10, 612 BR6]
- [x] Passenger types and discount rules, grouped, with age criteria marked "from AEM, not finalized" [566]
- [x] Booking: the profile preference pre-fills the adult traveler's discount and can be changed there; a change at booking doesn't change Profile [612 BR5–6]
- [x] Offline: preferences are viewable; saving needs a connection [43 BR9]

### D. Assistance

- [x] Profile: choose a category, either "I have a disability" or "I do not have a disability, but need assistance at the station"; it can be cleared [26]
- [x] Disabilities: choose at least one, each with a description (Blind/Vision loss, Deaf/Hearing loss, Reduced mobility, Other disability) [27, 995]
- [x] Reduced mobility asks about wheelchair space; with a wheelchair, Station Assistance is always allowed, but Accessible seat and Large service animal exclude each other [27, 995]
- [x] Station-help branch: optional Accessible seat only, no PWD discount [28, 996]
- [x] Profile save shows a summary and confirms that PWD was saved; a failed save keeps the answers and offers Retry [27, 28]
- [x] Booking: "Traveler with disability or need help?" checkbox with an explanation; it can be unchecked [973]
- [x] Assistance type for each traveler, everyone on the booking, including Pass Rider spouses, dependents and Companion Pass travelers [615 AC1, 1019]
- [x] Personal companion: available once another traveler has a disability, one companion each; needs Station Assistance, then optionally an accessible seat; the traveler's discount becomes Companion, and the earlier choice returns if the type changes [615 BR2.1–2.2, 997, 43 BR8 AC3]
- [x] Opening the questionnaire needs a connection; once it's open it can be finished offline; Find Trains needs a connection [973, 995–997]
- [x] The checkbox is pre-checked when the member has saved assistance or PWD; Traveler 1's answers come from Profile and can be changed [614]
- [x] Review and edit the summary; Find Trains needs a connection [995, 996]
- [x] Assistance entry placement **(unresolved, toggle)** [973 vs Core Flow]
- [x] Mobility-device and service-animal forms, and live station-assistance availability: labeled placeholders only [29, 620, 628, 629]

### E. Verification

- [x] One reusable code screen: enter code, loading, invalid, expired, resend (with confirmation and a cooldown), success [980, 21]
- [x] Return routing per trigger: change email goes back to Profile with the new email; sign-in goes back to the previous screen; an unverified-account action goes back to the editor and finishes the save [980 S4, S9; 21 BR9]
- [x] A failed or cancelled verification leaves the old value in place [980 rules; 21 BR5 AC6]
- [x] "Verify it's you" (email and password) when the token has expired; it has no Forgot password or Join link [21 BR3]
- [x] Channel (email or text) and the reauthentication policy are shown as **unresolved demonstrations**, not approved policy [980]

## Unresolved items, all visible in the prototype

1. Station ranking order: the story gives two conflicting lists [600]
2. Which entries count as pseudo-stations and are hidden [600]
3. Whether tapping a station selects it or opens details [600 S4]
4. Maximum booking window: 335 days, still to be verified [1060]
5. Whether changing country clears the address [23]
6. Phone types, whether changing the country code clears the number, and date-of-birth bounds [22, 919]
7. Where booking assistance starts: Fare Finder or Traveler Selection [973, Core Flow]
8. Verification channel and reauthentication policy [980, 21]
9. What replacing or removing the PWD discount does elsewhere [43, 612]

10. Traveler age bands, and whether a young adult can accompany minors [611] (Q10)
11. Discount-code eligibility before a train is chosen [613] (Q11)
12. TripLink Auto Train, and whether PWD applies to Corporate or Pass Rider travel [622, 623, 612] (Q12)
13. Pass Rider traveler counts and family combinations [1017] (Q13)
14. Whether traveler discounts apply to points searches [624, 612] (Q14)

Not finalized, and not invented: infant seat options ("Lap infant", "Ask for a seat"), companion assistance and the Companion discount, mobility-device and service-animal forms, live station-assistance availability.

## Assumptions

- Today's date is fixed at **Wed, Oct 28, 2026**, so the calendar is deterministic.
- The account holder is Alex Rivera, AGR 7012 3456 78, Select Plus. Bookings start with 1 Adult (NMA-611 BR2) and travelers can be added in Traveler Selection.
- Verification codes have 6 digits. **123456** works, **000000** is expired, anything else is invalid. A resend has a 30-second cooldown, shortened to 10 seconds in the demo.
- The 120-second spinner timeout is shortened to 6 seconds in the *Slow connection* scenario.
- Messages use the story copy where it exists. Otherwise the copy is marked provisional.
- Search ranking: an exact code match first, then city, state, station name, ZIP and landmark (the first list in NMA-600).
- The date-of-birth check rejects future dates. Any further bounds are unresolved.

## Components

Reused from ADS: buttons, icon buttons, links, badges, alerts, fields and controls, helpers, selection controls (checkbox, radio, switch), fieldsets, lists, modal, segmented control, date-picker day cells, sheet, app header, tab bars (iPhone and iPad), avatar.

New, added to `css/components.css` under *Sprint 4 additions*:

| Component | Why it was needed | States |
|---|---|---|
| `ads-navbar` | Sheets and pushed screens need a consistent Back / Close / Cancel / Save bar. The existing `ads-sheet__bar` only had a close button. | Root (Close), pushed (Back + Close), editor (Cancel + Save, Save disabled or busy) |
| `ads-group` + `ads-group__row` | iOS-style grouped rows for Profile, Account and settings. The docs prototype had page-only `.panel` styles. | Default, value, read-only, locked, chevron, destructive, focus |
| `ads-stationrow` | Station result with code, name, facility and a bookmark toggle for Favorites. The bookmark needs its own 44px target. | Default, selected, favorite on/off (icon plus label), focus |
| `ads-routefield` | From/To pair with a swap button, as in Core Flow. | Empty (hint), filled, error, swap disabled |
| `ads-datefield` | A tappable date value showing day name and full date | Default, empty (Return not set), active |
| `ads-calendar` | Vertical, scrollable month list for choosing a date range on a phone. `ads-datepicker` is sized for a desktop popover. | Today, disabled (past or beyond the window), start, end, in-range, focus |
| `ads-steps` | Step rail and "Step 2 of 4" header for V2. | Done, current, upcoming, skipped |
| `ads-summary` | Saved-answer summary with an Edit action (assistance, booking review, V3 cards) | Default, editing, empty |
| `ads-codeinput` | 6-digit verification code entry with one-time-code autofill | Empty, filled, verifying, invalid, expired, success |
| `ads-toast` | Short confirmation after a save. The docs prototype had a page-only toast. | Success, info |
| `ads-banner` | Full-width offline banner inside a screen | Offline, info |
| `ads-icon--bookmark-filled` (with the existing `ads-icon--bookmark`) | Favorites (NMA-118): the outline bookmark means not saved, the filled one means a favorite. The icon set only had the outline. `ads-icon--star` and `ads-icon--star-filled` remain in the library but aren't used. | Outline, filled |

## How the versions differ

Version 4 changes only the Fare Finder; its other screens work as in Version 1. See *Version 4 Fare Finder* below.

| | V1 Familiar & direct | V2 Guided & focused | V3 CLEAR-inspired Fare Finder · quick editing |
|---|---|---|---|
| Fare Finder | Core Flow layout: route card, dates, travelers, Find Trains | Airbnb-style guided search: Where, When and Who as stacked rounded sections, one open at a time, with editable summaries; a separate code card; Next and Find Trains in a persistent bottom bar. Includes the code, points, TripLink and Pass Rider variants | Navy header with the booking-mode controls, a rounded surface for trip type, route, dates and travelers, a labeled list for discounts, codes and assistance, and a pinned Find Trains. Includes the traveler, code, points, TripLink and Pass Rider variants |
| Station search | Pushed full screen | Pushed from the Where section, with the goal in the title; favorite and recent stations also appear as quick picks in Where | Rounded sheet with a large search field; From goes straight to To |
| Calendar | Pushed full screen, Depart and Return tabs | Inside the When section, prompts for Depart then Return | Rounded sheet, Depart and Return tabs |
| Profile | List of rows, each opening a focused editor (Cancel / Save) | One editor per page, with constraints explained before input and progressive fields (region first) | Overview cards that edit in place |
| Assistance | One long page with sections, as in Core Flow | Wizard: only the steps that apply, explanations for options that aren't available, review at the end | Booking: the one-page form in a rounded sheet. Profile: summary with inline section editing |
| iPad | Master/detail: the parent on the left, the editor on the right | Step rail on the left, question on the right | Overview on the left, persistent editor pane on the right |

## Comparison

All three cover the same requirements and states (see the checklist). The differences below come from the screens as built and the scripted walkthroughs, not from user testing. Fewer taps isn't treated as a win on its own.

| | V1 Familiar & direct | V2 Guided & focused | V3 CLEAR-inspired Fare Finder · quick editing |
|---|---|---|---|
| **Benefits** | Closest to Core Flow and to iOS habits: list, focused editor, Cancel/Save. Each screen does one thing, so states (saving, error, offline) have room. The easiest to build from standard navigation. | Dependencies are explained before they cause errors: Auto Train pairing, return-date rules, PWD replacement, accessible seat vs service animal. Booking assistance only asks the questions that apply (2 steps for station help, up to 5 for a disability). After choosing From, V2 goes straight to To. | Booking: a calm, branded first screen with the mode controls up front; the Fare Finder stays visible behind each sheet, so context is never lost. It's the only version that shows the variants (traveler types, codes, points, TripLink, Pass Rider). Profile: everything stays in view while you edit one part. |
| **Drawbacks** | More back-and-forth: every edit is a round trip to another screen. Dependencies (for example, why Return was cleared) are only explained after they happen. The one-page assistance form gets long once Reduced mobility and wheelchair questions appear. | More reading, and more screens for a quick change. Locked steps ("available after you choose stations") add visual weight. The step count changes as answers change, which can surprise. | The navy header takes vertical space, so on iPhone the options and assistance sit below the fold (Find Trains stays pinned). Sheets over a sheet add a layer to dismiss. Profile: inline edits need careful focus handling for VoiceOver. |
| **Best use** | Frequent, confident travelers making small edits, and as a low-risk baseline for engineering. | First-time or occasional travelers, and rule-heavy flows: assistance, discounts, first booking. | Returning members reviewing or changing several things at once, and iPad. |
| **Risk to validate** | Whether the long assistance form causes drop-off | Whether guidance feels slow to experienced users | Whether the options list below the fold (discounts, codes, assistance) is found; whether people notice and finish inline Profile edits |

A possible combination: V1's structure for Profile, V2's wizard for assistance, and V3's side-by-side layout on iPad. This is a hypothesis to test, not a recommendation.

## Patterns used and why

- **V1:** pushed screens inside sheets (iOS navigation); a focused editor with Cancel/Save in the nav bar, because editing is a mode; a confirmation dialog for the one-time middle initial, because it can't be undone; iPad master/detail with the parent list kept on the left.
- **V2:** Airbnb-style guided search on Fare Finder (one expanded section, collapsed editable summaries, a persistent bottom bar); a wizard with a "Step n of N" header and an iPad step rail; inline "why" hints before inputs; a review step with Edit per section; the middle initial shows a name preview instead of a confirmation dialog, because the one-time rule was explained up front.
- **V3:** a CLEAR-style composition for booking (dark header with a large heading, light rounded surface, large pill search fields, restrained separators, rounded sheets over the Fare Finder); booking-mode controls as segmented controls in the header; a labeled list for discounts, codes and assistance; Profile summary cards that expand into editors, with a persistent editor pane on iPad.
- **Shared by all three:** the same validation, copy, network states, verification view, favorites/recents rules, PWD logic and open-question markers, so the comparison is about structure, not content.

## How each version fits the IA

All three use the same four tabs, the same global header (Account and Notification Inbox open as sheets), and the same entry points: Book › New Booking for booking; Account for Profile, discounts, assistance and Clear recents. None adds a destination or renames one.

- **Global navigation** (tab bar on iPhone, top glass bar on iPad) is never hidden by a flow; sheets cover it, and Close returns to it.
- **Within a destination**, V1 and V2 push screens inside the sheet (Back on the left, Close on the right). V3 opens booking pickers as rounded sheets over the Fare Finder and edits Profile in place. Navigation depth is the same; only how the editor appears changes.
- **Sheets vs covers:** Account and Booking are sheets, as in the IA. Verification is a full-screen cover over the sheet, because it interrupts any flow and returns to it afterward.
- **Provisional placements** (C3, C4) are the same in all three versions and are flagged in Screen notes.

## Checks run

- **Version 2 guided Fare Finder:** every Flow › I entry; 23 scripted checks, all passing (defaults, errors opening the right section, quick picks, station search moving on to When, round trip and return clearing, reopening without losing answers, Next, travelers and discounts, the assistance questionnaire, codes and points, collapsed summaries, handoff, Pass Rider travel type, offline and loading); 280 screens in all four versions with no horizontal overflow at 140% text; axe-core finds no violations on the Version 2 entries in light and dark, iPhone and iPad.

- **Version 4 Fare Finder:** every Flow › H entry; 18 scripted checks (From then To in sheets, swap, same-station dialog, Add Return, return cleared after a later departure, return-date error, traveler close guard and undo, travelers kept after Done, assistance add/answer/remove/re-add, typed code kept after closing, invalid and valid codes, points hiding codes, handoff, Pass Rider travel type required, TripLink Personal showing Pay with), all passing; 264 screens in all four versions with no horizontal overflow at 140% text; axe-core finds no violations on the Version 4 entries in light and dark, iPhone and iPad.

- **Version 3 Fare Finder:** every Flow › G entry, plus scripted interactions (station sheets, traveler rules, discounts, codes, companion coupon, TripLink switching, Pass Rider validation and Auto Train block, offline, slow, dark, iPad) with no script errors; 197 screens in all three versions with no horizontal overflow at 140% text; axe-core finds no violations on the 15 Version 3 entries in light and dark, iPhone and iPad.

- **Scripted walkthrough** (Playwright), in all three versions: 126 checks, all passing. They cover booking errors, alias search, no results, Auto Train pairing, the same-station dialog, calendar rules, Find Trains offline/error/retry/handoff, favorites and recents, Clear recents, phone validation and save, country-change clear and Undo, middle-initial lock, RPA validation, wheelchair exclusivity, PWD replacement, booking pre-fill from Profile, verification (invalid, expired, cooldown, success, return), the unverified-account save, sign-in, and version/device switches keeping the location.
- **Accessibility:** an axe-core scan of 17 screens × 3 versions × iPhone/iPad × light/dark has no violations. The only exception is the simulated device status bar, which is prototype chrome.
- **Touch targets:** every control in the device is at least 44 × 44.
- **Text scaling:** at 140% text, no screen scrolls sideways.
- **Keyboard:** opening a sheet moves focus to its title; Tab follows reading order; Escape closes and returns focus to the trigger. Dialogs and covers make the content behind them inert.
- **Layouts reviewed:** iPhone and iPad, portrait and landscape.
- **Not done:** VoiceOver on a real device, and Dynamic Type at the largest accessibility sizes.

Library fixes found during review:

- `.ads-helper` margin
- double focus ring inside `.ads-control`
- dark tab-bar tint contrast
- `.ads-summary` header wrapping
- route-field contrast when open


## Version 3 Fare Finder (CLEAR-inspired)

Replaces the earlier V3 Fare Finder (inline panels). The look follows two CLEAR screens (location browsing and the search sheet): a dark navy upper area with a prominent light heading, generous space, a light content surface with rounded upper corners, large pill search fields, restrained separators and readable location rows. Amtrak's tokens, type, icons and components are kept, and only Amtrak colors are used (navy is ADS blue 900).

**Layout**

1. **Heading and booking-mode controls** on navy: *New Booking*, one line of context, and only the controls that apply: *Booking for* Corporate / Personal (TripLink members), *Book as* Pass Rider / Personal (Pass Riders), *Pay with* Cash / Points (signed-in members on a standard or personal booking).
2. **Rounded surface:** One-way / Round-trip, From / To with swap, Depart / Return (or Add Return), Travel type for Pass Riders, and Travelers.
3. **Discounts, codes and assistance:** labeled rows for Traveler discounts and Coupon or promo code (with an information button), and the assistance checkbox and summary (NMA-973). When assistance starts in Traveler Selection, a row points there.
4. **Find Trains** is pinned at the bottom of the sheet, so it stays reachable while the content scrolls or the keyboard is open.

Stations, dates, travelers, discount codes and assistance open as **rounded sheets** over the Fare Finder. The station sheet keeps the station identification fields (code, city and state, station name), the favorite bookmark, Favorites first, then Recents (10 days), then *View full list* by state, and the same search ranking. No "Popular" section was added.

**Demo:** Flow › *G · Version 3 Fare Finder* lists the default screen, the station sheet, dates, travelers, discount code, assistance, points, validation errors, Auto Train pairing, TripLink and the Pass Rider variants. Codes to try: V123 (promo), a 14-character coupon, the saved companion coupon with one traveler, EXP1 (rejected), DATE (wrong date range).

**Rules built (Version 3)**

- [x] One-way default, Add Return, swap, today's date by default, date window, return cleared when before departure [607, 608, 1060]
- [x] Same station twice shows the dialog; Lorton and Sanford pair automatically [607 AC2, AC3, AC8, AC9]
- [x] Traveler types Adult, Senior, Young Adult, Youth, Child, Infant; Adult starts at 1, others at 0 [611 BR1, BR2]
- [x] Up to 8 travelers (infants don't count), at least one traveler, and youths, children and infants need an adult or senior; Done is disabled with the reason shown [611 BR3, BR4]
- [x] One discount per traveler, choices by traveler type; Senior and Infant fixed; extra infants pay the child fare; Traveler 1 starts from the Profile preference and changes don't touch the Profile [612 BR1–BR6]
- [x] Passenger with Disability replaces the discount of any traveler whose assistance says "I have a disability" [43 BR8 AC1]
- [x] One discount code field for cash searches, hidden for points; 4 or 14 letters and numbers; "Please enter a valid discount code"; saved profile codes sorted by expiry, with type, benefit and expiry; toast on selection; information pop-up; Remove; two failed attempts lead to the call center [613]
- [x] Code checks at Find Trains (mocked): companion coupon needs two travelers, rejected code, invalid date range with Enter New Code / Continue without Discount / Close [613]
- [x] Use Points only for signed-in members, Cash by default [624]
- [x] TripLink: Corporate by default; Corporate means 1 adult, no discounts, codes or points, assistance allowed; Personal restores the standard options and any travelers set aside [622]
- [x] Pass Rider: Pass Rider by default with a Personal option; Business or Leisure is required when the employee has a Business Pass; Leisure only for employees without one and for spouses; spouse, dependents and companions for Leisure, up to 8 in all; companions only for employees, with passes left shown and the option disabled at 0; no discounts, codes, points or Auto Train; assistance allowed [623, 1016, 1017, 1018, 1019]
- [x] Loading with Cancel, offline, timeout and server error on Find Trains; validation errors beside the fields [607 network, Mobile App Global Standards]

**Compared with the Sprint 4 baseline**

Functional differences:

- **Added in all versions:** traveler types and counts, and a discount per traveler, in Traveler Selection (the baseline used a fixed 1 Adult).
- **Added in all versions:** the coupon or promo code, with the same checks at Find Trains, and *Pay with* Cash / Points (NMA-624).
- **In all four versions:** TripLink and Pass Rider (Version 1 since the Sprint 4 alignment).
- **Core Flow difference:** Core Flow labels Adult as 16–64 and has no Young Adult row; the stories list Young Adult (16–17) separately, and the prototype follows the stories (Q10).
- **Changed interaction:** V3 no longer edits the Fare Finder in place; each picker opens in a rounded sheet. After choosing From, the To sheet opens straight away (as in V2).
- **Mode-specific rules:** the Passenger with Disability discount isn't applied for Corporate or Pass Rider bookings, because those modes take no passenger discounts (open, Q12). Auto Train stations are unavailable for Pass Rider travel and cleared when switching to it.
- **Unchanged:** station search and ranking, Favorites and Recents, the same-station dialog, Auto Train pairing, the calendar rules, the assistance questionnaire (the one-page form, as in V1), Profile pre-fill (NMA-614), network states and the booking handoff, which now also lists the mode, payment, each traveler's discount and the code.

Unresolved requirements:

- Assistance is recorded per traveler (NMA-615, 1019). The Profile's answers still attach to Traveler 1 (NMA-614 BR5.1).
- The personal-companion assistance option (NMA-997) and the Companion discount (612 BR8 AC3) stay unavailable, as in the baseline, because companion rules aren't final.
- Age bands and who can accompany minors (Q10); infant seat options.
- Code eligibility for a specific train, live revalidation after a change, and points balance rules happen after search results, which are outside Sprint 4 (Q11, Q14). The prototype checks codes again on every Find Trains.
- Senior eligibility by route or train (612 BR7) isn't known before search; the senior discount is shown as automatic.
- Pass Rider type comes from the Profile; the prototype simulates employee and spouse. A dependent (16+) initiating travel isn't shown separately (Q13).
- TripLink Auto Train and rail-pass rules are still to be confirmed (Q12).
- Analytics events for the new controls aren't part of the prototype.


## Version 4 Fare Finder (Flighty-inspired)

A compact, directly editable Fare Finder. It follows Flighty's *Add Flight* sheet: a large heading, a white rounded sheet, compact grey route and date controls, aligned information rows and little color. Flighty's flight tracking, live status, map and globe, and airline filters aren't used, and nothing appears before the existing search handoff (no train results or fare previews). Versions 1, 2 and 3 are unchanged. Version 4 shares Version 3's sheets, rules and variants; its Profile and Account work as in Version 1.

**Layout, top to bottom**

1. **"Find a train"** heading. The booking modes that apply sit right under it as labeled pill menus: *Booking for* Corporate / Personal (TripLink), *Book as* Pass Rider / Personal (Pass Rider), *Pay with* Cash / Points (signed-in members on a standard or personal booking). One line of context follows.
2. **Route:** two compact controls, *From* and *To*, each with the station code, city and state, and station name, so the code is never the only identification. A swap button sits between them. At larger text sizes they stack and the swap moves to the right edge.
3. **Trip type and dates:** One-way / Round-trip, then *Depart* and *Return* (or *Add Return*).
4. **Aligned rows**, each with an icon column, a label, a short summary and its own actions: *Travel type* (Pass Rider), *Travelers*, *Assistance*, *Discounts*, *Coupon or promo code*. Corporate and Pass Rider bookings show one muted row explaining that discounts, codes and points aren't used.
5. **Find Trains**, pinned at the bottom.

Stations, dates, traveler details, codes and the assistance questionnaire open as focused rounded sheets over the Fare Finder.

**How each existing Fare Finder action maps to Version 4**

| Existing action (story) | Version 1 baseline | Version 4 |
|---|---|---|
| Trip type, One-way default (607 AC1, 608) | Segmented control above the route | Segmented control under the route, One-way selected |
| Choose From / To (607 AC2–3, 600) | Route card halves push Station search | *From* / *To* controls open the station sheet; choosing From opens To when it's empty |
| Same station twice (607 BR2.2, BR3.1) | Dialog | Same dialog |
| Swap (607 AC4) | Button on the route card | Round button between From and To |
| Auto Train pairing (607 AC8–9) | Fills the other station, info notice | Same; the notice sits under the route |
| Departure date, today by default (607 AC5–6, 1060) | Date field pushes Calendar | *Depart* control opens the dates sheet |
| Add Return (607 AC7, 608) | *Add Return* in the Return field | *Add Return* in the Return control |
| Return before departure cleared (1060) | Notice in Calendar | Same |
| Travelers and discounts (611, 612) | Travelers row pushes Traveler Selection | *Travelers* and *Discounts* rows, each with *Edit*, open the traveler sheet |
| Traveler limits (611 BR3–4) | Done disabled with the reason | Same; closing with an invalid selection asks to keep editing or undo |
| Assistance, Fare Finder entry (973, 614) | Checkbox; checking opens the questionnaire | *Assistance* row: *Add* (= checking), *Answer* or *Edit* (questionnaire), *Remove* (= unchecking, answers kept) |
| Assistance, Traveler Selection entry (Core Flow, Q7) | Checkbox in Traveler Selection | Same, in the traveler sheet; the row's *Edit* opens it |
| Discount code (613) | *Coupon or promo code* row under Travelers | *Coupon or promo code* row: *Add* opens the code sheet, *Remove*, information button |
| Use Points (624) | *Pay with* Cash / Points pill (signed-in members) | *Pay with* pill; codes become unavailable with points |
| TripLink Corporate / Personal (622) | *Booking for* control above the form | *Booking for* pill; Corporate locks travelers to 1 adult |
| Pass Rider / Personal, travel type, family and companions (623, 1016–1018) | *Book as* and *Travel type* controls above the form; Traveler Selection counters | *Book as* pill, *Travel type* row (required when eligible for both), traveler sheet counters |
| Find Trains, validation, loading, offline, error (607) | Pinned button; errors beside fields | Same; errors beside the route, dates, travel type, travelers or code |
| Search handoff | Prototype handoff screen | Same screen |

**Values kept when editors open and close.** Choices are applied as you make them, so closing a sheet keeps them. Exceptions follow the existing rules: a later departure clears an earlier return (1060); the assistance questionnaire asks before discarding unsaved answers; signing in part-way resets the questionnaire (614 AC4). The traveler sheet can't be left with a selection that can't be searched: you keep editing or undo to the last valid selection. A typed but unadded discount code stays in its field.

**States in Flow › H:** default, populated (round trip, 3 travelers, assistance and a code), validation errors, loading (slow connection), offline, guest, station sheet, dates sheet, traveler sheet, discount code sheet, paying with points, Auto Train pairing, TripLink Corporate, Pass Rider with a Business Pass, and Pass Rider spouse.

**Compared with Versions 1–3:** Version 4 shows every booking choice on one screen without scrolling past a header, and each row says what's set and how to change it. The tradeoffs: compact controls truncate long station names (the full name is in the control's accessible label and in the station sheet); the rows rely on short text actions (*Edit*, *Add*, *Remove*), which need to stay at least 44 pt; and assistance is shown as Add/Remove instead of a checkbox, which changes the control but not the rule.


## Version 2 Fare Finder (Airbnb-inspired guided search)

Replaces the earlier V2 Fare Finder (numbered steps revealed in order). The look and behavior follow Airbnb's guided search: stacked rounded sections on a soft background, one section expanded at a time with a bold question, completed sections collapsed into one-line summaries, past dates struck through, and a persistent bottom action area. Amtrak tokens, type, icons and components are kept. Airbnb's Months, Flexible, weekend and nearby-day options, its age categories and its pet control are **not** used.

**Layout**

- **Top:** the booking modes that apply, as segmented controls (like Airbnb's top tabs): *Booking for* Corporate / Personal (TripLink), *Book as* Pass Rider / Personal (Pass Rider), *Pay with* Cash / Points (signed-in members on a standard or personal booking).
- **1. Where are you traveling?** The From / To route field with swap, the Auto Train notice, and two quick picks for the empty field: favorites first, then the most recent station (10 days). Tapping From or To opens the full station search (Favorites, Recents, View full list, every search field). Once both stations are set, When opens.
- **2. When are you traveling?** One-way / Round-trip and the calendar for exact dates (Depart, then Return). No flexible-date options.
- **3. Who’s traveling?** Travel type for Pass Riders (required when eligible for both), the traveler counters (the story's categories, not Airbnb's), the assistance checkbox and summary, and each traveler's discount.
- **Code card:** coupon or promo code, separate from passenger discounts (NMA-613). Hidden behind a note for points, Corporate and Pass Rider.
- **Bottom bar:** *Next* (opens the next section) and *Find Trains*, always available.

**Behavior**

- **Defaults count as answers:** One-way, today's date and 1 Adult are already filled in. When and Who don't have to be opened, and nothing asks you to confirm unchanged defaults.
- **Reopening:** tap a collapsed summary to reopen its section. The other sections keep their answers, and nothing restarts.
- **Dependent validation:** choosing a later departure clears an earlier return (1060), with the existing notice. Changing travelers re-applies the traveler rules (limits, accompanied minors, infant ratio), PWD for Traveler 1, and the code checks at Find Trains (for example, a companion coupon needs two travelers).
- **Nothing required stays hidden:** Find Trains checks Where, When and Who in order, opens the first section that needs attention and moves focus to the problem. A collapsed section with a problem shows a red outline and the message under its summary. Every required control is either in the open section or one tap away on its summary.

**States in Flow › I:** initial (Where open), partly completed (stations chosen, When open), fully populated (all collapsed), reopened section (Where reopened, answers kept), errors (no stations; a child without an adult), station search, Who with assistance and discounts, the assistance questionnaire, the discount code, paying with points, Auto Train pairing, guest, TripLink Corporate, Pass Rider Leisure travelers, and Pass Rider spouse.

**Mapping from the previous Version 2**

| Before | Now |
|---|---|
| Step 1 "Where are you going?" (route) | *Where* section, plus two favorite or recent quick picks |
| Step 2 "When are you leaving?", locked until stations were chosen; pushed calendar | *When* section, never locked (dates don't depend on the route), calendar inside the section |
| Step 3 "Who's traveling?", travelers row pushing Traveler Selection | *Who* section with the traveler counters, assistance and discounts inside it |
| "Still needed" line above Find Trains | Error outline and message on the section, which opens on Find Trains |
| Assistance entry: Fare Finder or Traveler Selection (Q7) | In *Who* either way; the setting no longer changes the layout in Version 2 |
| (not in the previous Version 2) | Code card, Use Points, TripLink and Pass Rider, shared with Versions 3 and 4 |

The assistance questionnaire keeps Version 2's wizard (one question per step, review at the end), opened from *Who*.


## Station search: Your route

Every station search (all versions) starts with a *Your route* summary: From and To with code, city and station name. The station being chosen is highlighted and labeled *Choosing* (empty) or *Changing* (already set); the other one is a button that switches the search to it without losing the route. In the lists, the station already used for the other end is tagged *Your departure* or *Your arrival*, and the current choice is tagged *Selected*. Choosing the same station for both ends still shows the existing dialog (607 BR2.2, BR3.1).


## Interaction and motion system (all versions)

One shared set of navigation levels, components and motion tokens, applied to every concept. Each concept keeps its own structure, content and visual identity. The reference recording (expanding search, guided cards, a service-animal info sheet) and the two motion prompts were the inputs. Items marked *observed* come from the recording; everything else is a proposed Amtrak adaptation, with timings to tune on devices.

**Navigation levels**

| Level | Used for | Controls | Motion |
|---|---|---|---|
| Top-level tabs | Book, Trips, Train Status, Support | Tab bar (iPhone) or top tabs (iPad) | No page transition; only the selection indicator moves. Each tab keeps its scroll position; reselecting the current tab scrolls it to the top |
| Modal task | New Booking, Account, Notification Inbox | **Close** at the root (*observed*) | Grows out of the Book control when opened from it; otherwise rises from the bottom. Reverses on close |
| Detail inside a task | Calendar, Travelers, code, assistance, Profile and its editors | **Back** returns one level; **Close** ends the whole task | Pushes in from the right in the same sheet, with the previous screen moving 25% behind it |
| Focused input (iPhone) | Station search in every version | **Back** inside the search field (*observed*); Escape also goes back | The tapped From or To field grows into the view; Back collapses it into the field again, now showing the choice |
| Supporting information | About discount codes, Traveling alone?, Service animals, Accessible travel, Discount rules | **Close**; **Back** inside the sheet for a deeper level | Rises from the bottom over a dimmed, inactive task (*observed*); reverses on close |

Back and Close are always separate controls with separate meanings. On iPad, station search stays beside the Fare Finder (split view), so it keeps the standard header.

**Supporting-information sheet**

- Bottom sheet with rounded top corners on iPhone; a centered card on iPad. Height follows the content, up to the top 96 px of the screen, and long content scrolls inside it.
- The task behind it stays visible under the scrim and is inert. Tapping the scrim, Close or Escape dismisses it and restores the exact step, selections, scroll position and focus (on the link that opened it).
- A deeper level (for example *Service animals › accessible travel policy*) opens inside the same sheet with Back. Sheets never stack.
- Entry points: the *Bringing a service animal?* link under the traveler counters (every version), *About service animals* in the assistance questions, the information buttons beside codes, *Traveling alone?* on Youth, and Passenger types and discount rules in Account. Service-animal and accessible-travel text is draft content, labeled as such, for NMA-628 and NMA-621.
- These replace the earlier alert dialogs for explanations. Dialogs remain only for decisions (discard changes, same station twice, clear recents).

**Focused station search (iPhone)**

The field becomes the top of the view, with Back in its leading slot and focus in the input. The *Your route* summary and the results follow it. Choosing a station returns it to the task, where the field or summary row updates; Versions 2 and 3 go straight on to To first, as before. Rapid taps can't stack a second view, because the task behind is inert during the transition.

**Expandable cards (Version 2 booking)**

Where, When and Who: the active section is a rounded card and the others are summary rows with their label and current choice (*observed*). Opening another section collapses the previous one while the cards around it move to their new places: height and position animate together over 300 ms. Values are kept when switching, and Next and Find Trains stay in the bottom action area. Versions 1, 3 and 4 keep their single-form Fare Finders, which is what distinguishes those concepts. They share the focused search, the sheets and the motion.

**Motion tokens**

| Token | Duration | Easing | Used for | Reduced motion |
|---|---|---|---|---|
| tap | 100 ms | standard | Press feedback (slight dim, 1.5% compression) | No compression |
| control | 200 ms | standard | Segmented and tab indicators, dialog entry, toasts | Direct change |
| panel | 280 ms | standard | Pushes, focused view in and out, sheet-level changes | 120 ms fade |
| section | 300 ms | standard | Expandable card height and position | Direct change |
| shared | 360 ms | settle | Modal and information sheet presentation | 120 ms fade, no blur or scale |
| close | 260 ms | exit | Dismissals (reverse of presentation) | 120 ms fade |
| stagger | 35 ms | | Content reveal after a surface settles | None |

Easing: standard `cubic-bezier(.2, 0, 0, 1)`, settle `cubic-bezier(.2, .8, .2, 1)`, exit `cubic-bezier(.4, 0, 1, 1)`. There's no bounce. Surfaces animate (position, size, clip and corner radius, backdrop opacity), and text is never scaled. Reduced motion follows the system setting or the toolbar's *Motion* control.

**Native notes**

- iOS: use `UISheetPresentationController` with detents for the information sheet (`.medium()` and custom content heights) and a navigation stack inside the booking sheet. The focused search fits a matched-geometry transition (SwiftUI `matchedGeometryEffect`) from the field. Follow the keyboard with `keyboardLayoutGuide`, so the action area stays above it.
- Android: `ModalBottomSheet` for supporting information; shared-element transitions (`SharedTransitionLayout`) for the focused search; predictive back reverses each level. Keep the action area above the IME with `imePadding()`.

**QA checklist (scripted, all passing)**

A complete journey in every version on iPhone and iPad (119 checks):
1. Open booking.
2. Enter the focused station search and choose From and To.
3. Go back from the focused view, keeping the value.
4. Add a traveler.
5. Open *Service animals* (focus moves to its title and the task behind is inert), then go deeper and back.
6. Press Escape, which restores the step, scroll position and focus.
7. Open the code information and close it.
8. Find trains and close, returning to Book with focus on New Booking.

The new states also passed accessibility checks in light and dark mode and at 100% and 140% text, with no overflow. Reduced motion uses opacity only.


## Sprint 4 alignment (all versions)

See `PLAN.md` for the issue inventory, coverage, blocked items and regression risks.

**Shared foundation added**

- **Traveler model** (`travelers.js`): one list of travelers for standard, TripLink Corporate and Pass Rider bookings. Each traveler has their own assistance record, and Traveler 1 keeps the Profile-prefilled one. Each concept hosts a shared *Assistance by traveler* list: V1 and V2 in their assistance blocks, V3 on its Fare Finder, V4 in its Assistance row. With one traveler, the existing summary card stays.
- **Personal companion and discounts:** described in the requirements checklist above. Three companions stay distinct:
  - a personal companion (an assistance type, which gets the Companion discount);
  - a Companion Pass (Pass Rider employees, 8 a year);
  - a companion coupon (a code that needs two travelers).
- **Amtrak employee pass** in Profile (`profile.js`, NMA-20):
  - Yes or No; relationship (employee or retiree, spouse, dependent); 9-digit Pass Number (the employee's own for spouses and dependents) and 3-digit Personal Index Number.
  - Errors when either is missing or has the wrong format. Pass Number 999999999 shows "don't belong to you" (BR4 AC3). Saving needs a connection.
  - A valid save turns on the Pass Rider Fare Finder (NMA-623 AC2), and removing the details turns it off. V1, V2 and V4 use the pushed editor; V3 edits on its Profile card.
- **My Coupons** in Profile (NMA-697):
  - Available coupons, soonest expiry first and flagged when they expire within 30 days; used and expired coupons, with each use's reservation number and date, newest first; an empty state.
  - Details in a supporting-information sheet; adding a 14-character coupon (valid, expired and not-found results); *Apply* starts a booking with the code.
  - Lounge passes are listed but aren't fare codes. The booking code screen reads the same list.
- **Station details:** a separate details control on every station row opens a sheet with the station data the app has. Tapping the row still chooses the station (NMA-600 S2 vs S4, Q3). The full page is NMA-604.
- **Dates:** every Fare Finder now shows the day name, month, day and year (NMA-1060 AC8); V2's When summary and V4's date chips gained the year.

**Conflicts flagged in the prototype**

- **Q10 (NMA-611):** accompaniment rule versus copy.
- **Q15:** NMA-21 versus NMA-980 reauthentication.
- **Q16:** NMA-623 SAP ID versus NMA-20 Pass Number, and whether the dependent experience differs.
- **Q17:** NMA-697 retention period and notifications.
- **Q18:** NMA-29, partly defined.

**Checks:** 41 multi-traveler checks and 59 Profile, coupon, station-details and V1-mode checks, in all four versions. All earlier scripted suites still pass, including the 119-step journey. The new screens pass accessibility checks in light and dark mode at 100% and 140% text, with no overflow.

## Sprint 4 functional coverage (second pass, all versions)

- **Assistance per traveler:**
  - Every traveler can add, edit or remove their own request; the others keep theirs.
  - The shared list marks who has a request (*Requested*), shows each one's summary, and says whether a traveler with a disability has a personal companion.
  - Station Assistance and the conditional accessible seat follow NMA-996 and 997.
  - Requests survive section changes, closing the booking and switching concepts.
- **Personal companion:**
  - The companion names the traveler they accompany (*Personal companion to*). Only travelers with a disability who don't have a companion yet are offered, which enforces one each (NMA-615 BR2.1–2.2). A second companion for the same traveler is unavailable.
  - The companion's discount becomes Companion (NMA-43 BR8 AC3) in the discount list, the summaries and the search handoff.
  - Removing or changing the paired traveler's request flags the companion, and Find Trains stays blocked until it's fixed.
  - Who can be a companion is open (Q19).
- **Amtrak employee pass:** shows the saved pass's status: Pass Rider on or off, Business Pass, companion passes left, travel type, and the dependent age rule.
- **Pass Rider dependents:**
  - New scenario *Pass Rider dependent, 17*.
  - Dependents 16 or older can start Leisure travel with the employee, their spouse and other dependents. There's no Business option and no Companion Pass.
  - Under 16, or with no date of birth in Profile, Pass Rider can't be chosen and Find Trains explains why (NMA-1017 AC4).
- **My Coupons:**
  - Loading follows the toolbar's network setting: slow shows a skeleton; a server error shows *Try again*; offline shows the saved list.
  - *Add* shows progress, then a success or a specific error.
  - Notifications and retention are dependencies (Q17).
- **Flow › J:** the same scenarios in every version: a personal companion pair, TripLink Corporate, Pass Rider employee and Pass Rider dependent.
- **Checks:**
  - Acceptance suite: 89 checks per device, on iPhone and iPad, covering the criteria above in all four versions.
  - All earlier suites, including Cash / Points.
  - Accessibility checks in light and dark mode at 100% and 140% text.

## Version 1 (Familiar) refinement

The most conventional of the four: a standard booking form, a modal Traveler Selection step and labeled fields.

- **Booking modes:** *Booking for* (TripLink) and *Book as* (Pass Rider) sit above the same form, with a required *Travel type* when the traveler is eligible for both. Pass Rider and Corporate replace the code and points rows with a one-line explanation.
- **Traveler Selection** (`familiar.js`):
  - Cancel (top left) undoes everything changed on the screen, including assistance. Done keeps it. X still closes the whole booking.
  - The counters show errors on the counter they belong to.
  - *Traveler details* has one card per traveler, with labeled rows:
    - *Discount:* a select, or the fixed value with its reason.
    - *Assistance:* the summary with Add, Edit or Remove.
    - *Personal companion:* on a traveler with a disability, a select of eligible travelers; on the companion, *Companion to Traveler n*.
  - Choosing a companion on the card makes that traveler's assistance *personal companion* and sets their Companion discount. Choosing *No personal companion* removes it.
- **Invalid pairing:** if the traveler with a disability loses that request, the error appears on the companion's card and on their Fare Finder row. The Companion discount stops applying, and the earlier discount returns (in every version). Find Trains moves focus to the inline error instead of opening a dialog.
- **Fare Finder:** the assistance list shows each traveler's request beside their name. The code row says how many coupons are saved in My Coupons.
- **Checks:** a 27-step Familiar acceptance run on iPhone and iPad:
  - form, travelers, independent assistance, companion from the card;
  - Cancel and Done, invalid pairing;
  - Pass Rider dependent with assistance, TripLink;
  - Employee pass and coupon through Profile into booking.

  Every earlier suite also passes. Accessibility passes in light and dark mode at 100% and 140% text.

## Version 3 (Overview) refinement

The Fare Finder is the overview of the whole booking. Every section is still edited from it (`overview.js`).

- **Status strip** at the top of the booking surface:
  - When complete: *Ready to find trains*, with trip type, route, dates and traveler count.
  - Otherwise: *n items to finish* (stations, travel type) or *n items need attention* (return date, accompaniment, companion pairing, Pass Rider eligibility, code error).
  - Each item is a link that scrolls to and focuses the field or traveler it belongs to.
- **Travelers overview:** one row per traveler, with chips for the discount (Companion and PWD highlighted), assistance (*No assistance* or the type) and companion pairing (*Companion: Traveler 2*, *Companion to Traveler 1*), plus an Edit button. Rows with a problem are marked and explain it. *Change travelers* opens the traveler counts. The NMA-973 checkbox sits under the list.
- **Pass Rider card:** shows eligibility, the pass the traveler books on, travel type, companion passes left (employees) and the age rule (dependents).
- **Editing one traveler:** a single sheet level with labeled Discount, Assistance and Personal companion rows (the same components as Version 1).
  - Changes update the booking at once, so the overview is current. On iPad the overview stays beside the sheet.
  - Cancel, Escape and X discard what that sheet changed. Done keeps it.
  - Assistance opens inside the same sheet. Confirming returns to that traveler; Back returns without saving.
- **Layered screens, fixed for every version:**
  - Closing a child screen returns focus to the control that opened it.
  - A parent's scroll position is kept while a child is open.
  - Only the topmost layer dims the screen: no doubled backdrops under an info sheet or dialog.
- **Checks:**
  - Overview acceptance run on iPhone (31) and iPad (32): inspect, attention items, route, travelers, nested assistance with Back and confirm, info sheet over a step, Cancel, Escape and X, no lost or duplicated assistance, broken pairing, Pass Rider dependent and employee, TripLink, Profile coupon into booking.
  - Every earlier suite.
  - Accessibility checks in light and dark mode at 100% and 140% text, on iPhone and iPad.

## Version 4 (Compact) refinement

The densest of the four, without hiding anything required (`compact.js`).

- **Dates:**
  - The chips show weekday, month, day and year on one line ("Wed, Oct 28, 2026"), with tighter type and *Today* underneath when it applies.
  - The calendar's Depart and Return toggle and its footer also show the year, in every version (NMA-1060 AC8).
- **Traveler tags:**
  - The Travelers row has one small tag per traveler: *T1 Adult PWD (assistance icon) ↔ T2*. It shows the discount (PWD, Companion, Military, RPA, Senior, Child fare, Lap infant), an assistance icon when there's a request, and the companion pairing.
  - Each tag's spoken label gives the full wording. Tapping a tag opens that traveler's short edit sheet: discount, assistance and personal companion.
  - Problems mark the tag.
- **Assistance row:**
  - Booking-level Add and Remove stay, with an *About assistance* explanation.
  - With several travelers, every traveler gets one line with their own Add, Edit or Remove, and errors appear on the line they belong to.
- **Separate Discounts row removed:** each traveler's discount is now on their tag.
- **Offline (NMA-973, 995–997), in every version:**
  - Turning assistance on or off works offline.
  - Opening a traveler's questions for the first time needs a connection.
  - Questions already opened in this booking can be finished or reviewed offline.
  - Compact explains a blocked first opening in one line in the Assistance row, with *Try again* and *OK*. The other versions use a short dialog.
  - Find Trains still needs a connection.
- **Pass Rider dependent:**
  - Uses the same compact controls: Leisure only, tags for each traveler, and assistance per traveler.
  - The traveler summary now reads "employee or spouse" ("employee and spouse" for both) for a dependent's family.
- **Fixed for every version:**
  - Focus stays on a screen's title after its slide-in finishes; it used to drop to the page.
  - The offline banner fits at 140% text.
- **Checks:**
  - Compact acceptance run on iPhone and iPad (23 each): full dates, a 4-traveler booking with three distinct requests, a companion set from a tag, removing one request, the three offline cases, the Find Trains handoff, a dependent Pass Rider with two travelers' assistance, and Profile.
  - A density check: the same booking is shortest in Compact.
  - All earlier suites, and accessibility checks in light and dark mode at 100% and 140% text.

## Date picker: one month at a time, with a fare heat map (all versions)

- **Paging:** the shared calendar shows one month at a time with Previous and Next month buttons.
  - It opens on the month of the date being picked and stays there after the departure is chosen, so the return can be picked in the same view.
  - The buttons stop at the current month and at the end of the 335-day window.
  - The Depart and Return toggle wraps onto two lines, so the full dates fit.
- **Fare heat map** (`fares.js`, Q20):
  - Each available day shows the lowest one-way Coach fare per traveler, tinted against the other days of the month on screen: lower (green), typical (no tint) or higher (amber). The colors use the status tokens, so they work in light and dark mode.
  - Prices show as text and in each day's spoken label ("from $97, lower fare"), so color isn't the only signal. A legend explains the shades.
  - The return leg is priced for the reverse direction. With *Pay with Points*, values show in points.
  - With no stations chosen, or for TripLink Corporate and Pass Rider bookings, no prices are shown and the legend says why.
  - The round-trip range shows as a thin bar under the days, so it doesn't compete with the tints.
- **Prices are illustrative, not live.** No Sprint 4 story covers a fare calendar, and there's no fare source. The page labels them and Q20 lists what's needed: a fares service, which fare to show, how to show points, and Pass Rider and Corporate.
- **Checks:**
  - Calendar suite, 43 checks on iPhone and iPad in all four versions: one month, the limits, next month, three fare levels, spoken prices, picking across months, the range, the end of the window, no route, Pass Rider, and points.
  - Accessibility in light and dark mode at 100% and 140% text.
  - The earlier suites, updated to page to later months.


## Latest adjustments

- **Version 2:** the whole booking modal is stone, including the strip behind the grabber and the bottom action bar; there's no lighter edge.
- **Calendars:** the price numbers are gone and the shading stays. Each day's spoken label still gives the illustrative price and level, and the legend explains the shades (Q20).
- **Pay with (Cash / Points)** sits lower in every version, below the booking modes:
  - V1: at the end of the form.
  - V2: a small card after the code card.
  - V3: in *Codes and payment* at the bottom.
  - V4: a compact row after the code row.

  TripLink and Pass Rider choices stay at the top, because they change the whole booking.
- **Version 1 station search** stays open until both stations are chosen, in either order, as in Version 3. A cleared Auto Train pair is explained in the search.
- **Version 3:** the status box (*items to finish*, *ready*) is removed. Problems still show on each traveler's row.
- **No hover states in the device:** the app is for phones and tablets, so the page drops every hover style when it loads, except on the prototype controls outside the device. Press, focus and selected states are unchanged. The design system CSS itself is untouched.
- **Sentence case throughout:** labels, buttons, titles and toolbar text use sentence case (for example *New booking*, *Find trains*, *Traveler selection*, *My coupons*, *Station assistance*, *2 adults, 1 child*). Proper names keep their capitals: Amtrak, Guest Rewards, Select Plus, TripLink, Pass Rider, Companion Pass, Business Pass, Auto Train, Northeast Regional, Fare Finder, stations and places. Styles that forced labels into capitals are turned off when the page loads; the ADS CSS itself is untouched.
