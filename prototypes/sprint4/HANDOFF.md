# Sprint 4 design exploration: handoff

Three directions for the same Sprint 4 scope, built on the ADS library and the App Shell IA. Each one runs on iPhone and iPad, in portrait and landscape.

## Opening and switching

- **Open it:** the published artifact, or `prototypes/sprint4/index.html` in any browser. It's one self-contained file with no network calls.
- **Toolbar** (the dark strip above the device; it isn't part of the app):
  - **Version** 1 / 2 / 3. Each version keeps its own data, so a change in V1 doesn't show up in V2. Switching keeps the same place in the flow; if you're on Billing address in V1, you land on Billing address in V3.
  - **Device** and **Orientation:** iPhone or iPad, portrait or landscape. The place in the flow and the data are kept.
  - **Flow / screen:** jumps to any flow through its real App Shell path. Book, Fare Finder and the station search opens the station search inside the booking sheet, just as tapping would. Every flow can also be reached by tapping, starting from the Book tab or the Account button.
  - **Scenario:** reloads the current version's data. Options: returning member, new user, saved assistance + PWD, saved RPA, middle initial already added, international member, unverified account, guest.
  - **Network:** Online, Offline, Slow connection (spinner with Cancel, timing out after 6 s) or Server error (Retry).
  - **Assistance entry:** Fare Finder (NMA-973) or Traveler Selection (Core Flow). It's an open question, so you can compare both.
  - **Session token:** set to Expired to see *Verify it's you* before Change email.
  - **Text size**, **Appearance** (light/dark) and **Open questions**, which shows or hides the purple **Q** markers.
  - **Reset demo:** puts all three versions back to the default scenario.
- **Screen notes** (right-hand panel): the stories, open questions, provisional placements and things to try for the screen you're on. Tapping a Q marker highlights its entry.
- **Verification codes:** 123456 works, 000000 has expired, anything else is wrong.

## Sources

How conflicts were decided: stories and grooming notes first, then the App Shell IA, then the ADS design system, then Core Flow.

| Source | Status | Used for |
|---|---|---|
| NMA_Sprint_4_Combined.docx (31 stories) | Read in full | Requirements, rules, copy, open questions |
| IA App Shell Overview (PDF), summarized in `ia/app-shell.json` | Read | Destinations, header, sheets, landing rules |
| ADS library (`css/`, `tokens/`, `icons/`) | In repo | Every component and token |
| Core Flow Figma (`dkrhpF1qtC3EKeynFLnj3U`, node 7:96076) | Read through the Figma connection (screenshots and layer list) | Fare Finder layout, Traveler Selection, the PWD questionnaire's structure |

Most of Core Flow is out of Sprint 4 scope: search results, fare families, ancillaries, checkout, cancel/modify, private rooms. Only these parts were used: the App PWD flow, *Book* and *Search_Trigger*.

Stories with no content: NMA-620 (in-station assistance availability), NMA-621 (about accessible travel), NMA-628 (service animal info), NMA-629 (wheeled mobility device specs). They are shown as labeled placeholders only.

Stories outside this exploration: NMA-613 (promo codes) and NMA-624 (points search) are Fare Finder features that are not in the requested scope. NMA-611 (traveler type and number) is also not built: a fixed sample traveler (1 Adult) is used instead, as requested.

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
| Station search, Favorites, Recents | Book | Fare Finder › From or To | V1 and V2 push it inside the sheet. V3 shows it inline. On iPad it's the right-hand pane. | Choosing a station or tapping Back returns to Fare Finder with the field filled. |
| Calendar | Book | Fare Finder › Depart or Return | Same as station search | Done or Back goes to Fare Finder |
| Traveler Selection, booking discount | Book | Fare Finder › Travelers | Pushed inside the sheet | Done goes to Fare Finder |
| Booking assistance | Book | The Fare Finder checkbox (default), or Traveler Selection (scenario toggle) | Pushed inside the sheet | Confirm shows the summary on the Fare Finder |
| Clear Recents | Account (global header) | Account › Quick settings › Clear recent stations | Confirmation dialog | Back to Account, with a cleared state |
| Profile details | Account | Account › Profile | Pushed inside the Account sheet | Save goes to Profile with a toast |
| Change email and verification | Account | Account › Profile › Email › Change | Full-screen cover over the sheet | On success: Profile plus "Your email has been updated". On Cancel: Profile, unchanged. |
| Passenger discounts | Account | Account › Profile › Passenger discounts | Pushed | Save goes to Profile |
| Discount rules | Account | Passenger discounts › *Passenger types and discount rules* | Pushed | Back |
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
- [x] Add or remove a favorite with the star, in every list; favorites come before recents; a favorite leaves Recents [118 S1–S11]
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
- [x] Booking category per traveler; Companion is shown but disabled, because it needs a second traveler and its rules aren't finalized [615, 997]
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

Not finalized, and not invented: age bands, accompanying-adult rules, infant ratios, companion eligibility, employee/family/corporate variants, mobility-device and service-animal forms, live station-assistance availability.

## Assumptions

- Today's date is fixed at **Wed, Oct 28, 2026**, so the calendar is deterministic.
- The sample traveler is Alex Rivera, AGR 7012 3456 78, Select Plus, 1 Adult.
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
| `ads-stationrow` | Station result with code, name, facility and a star toggle. The star needs its own 44px target. | Default, selected, favorite on/off (icon plus label), focus |
| `ads-routefield` | From/To pair with a swap button, as in Core Flow. | Empty (hint), filled, error, swap disabled |
| `ads-datefield` | A tappable date value showing day name and full date | Default, empty (Return not set), active |
| `ads-calendar` | Vertical, scrollable month list for choosing a date range on a phone. `ads-datepicker` is sized for a desktop popover. | Today, disabled (past or beyond the window), start, end, in-range, focus |
| `ads-steps` | Step rail and "Step 2 of 4" header for V2. | Done, current, upcoming, skipped |
| `ads-summary` | Saved-answer summary with an Edit action (assistance, booking review, V3 cards) | Default, editing, empty |
| `ads-codeinput` | 6-digit verification code entry with one-time-code autofill | Empty, filled, verifying, invalid, expired, success |
| `ads-toast` | Short confirmation after a save. The docs prototype had a page-only toast. | Success, info |
| `ads-banner` | Full-width offline banner inside a screen | Offline, info |
| `ads-icon--star`, `ads-icon--star-filled` | Favorites (NMA-118). The icon set had no star. | Outline, filled |

## How the three versions differ

| | V1 Familiar & direct | V2 Guided & focused | V3 Overview & quick editing |
|---|---|---|---|
| Fare Finder | Core Flow layout: route card, dates, travelers, Find Trains | The same fields revealed in order, with inline explanations of dependencies (Auto Train, return date, what's missing) | A compact summary with inline station search and an inline calendar, so there are no pushed screens |
| Station search | Pushed full screen | Pushed, with the goal in the title ("Choose departure station") | Inline under the field |
| Calendar | Pushed full screen, Depart and Return tabs | Pushed, prompts for Depart then Return | Inline panel |
| Profile | List of rows, each opening a focused editor (Cancel / Save) | One editor per page, with constraints explained before input and progressive fields (region first) | Overview cards that edit in place |
| Assistance | One long page with sections, as in Core Flow | Wizard: only the steps that apply, explanations for options that aren't available, review at the end | Summary with inline section editing |
| iPad | Master/detail: the parent on the left, the editor on the right | Step rail on the left, question on the right | Overview on the left, persistent editor pane on the right |

## Comparison

All three cover the same requirements and states (see the checklist). The differences below come from the screens as built and the scripted walkthroughs, not from user testing. Fewer taps isn't treated as a win on its own.

| | V1 Familiar & direct | V2 Guided & focused | V3 Overview & quick editing |
|---|---|---|---|
| **Benefits** | Closest to Core Flow and to iOS habits: list, focused editor, Cancel/Save. Each screen does one thing, so states (saving, error, offline) have room. The easiest to build from standard navigation. | Dependencies are explained before they cause errors: Auto Train pairing, return-date rules, PWD replacement, accessible seat vs service animal. Booking assistance only asks the questions that apply (2 steps for station help, up to 5 for a disability). After choosing From, V2 goes straight to To. | The whole trip or profile stays in view while you edit one part. The fewest screen changes: station search, calendar and editors open in place. On iPad, overview and editor side by side make the best use of the space. |
| **Drawbacks** | More back-and-forth: every edit is a round trip to another screen. Dependencies (for example, why Return was cleared) are only explained after they happen. The one-page assistance form gets long once Reduced mobility and wheelchair questions appear. | More reading, and more screens for a quick change. Locked steps ("available after you choose stations") add visual weight. The step count changes as answers change, which can surprise. | Screens are busier, and the open editor can sit below the fold on iPhone (the prototype moves focus to it). Unsaved inline edits are easier to lose when switching cards (the prototype asks before discarding). Inline panels need more careful focus handling for VoiceOver. |
| **Best use** | Frequent, confident travelers making small edits, and as a low-risk baseline for engineering. | First-time or occasional travelers, and rule-heavy flows: assistance, discounts, first booking. | Returning members reviewing or changing several things at once, and iPad. |
| **Risk to validate** | Whether the long assistance form causes drop-off | Whether guidance feels slow to experienced users | Whether people notice and finish inline edits, especially with VoiceOver |

A possible combination: V1's structure for Profile, V2's wizard for assistance, and V3's side-by-side layout on iPad. This is a hypothesis to test, not a recommendation.

## Patterns used and why

- **V1:** pushed screens inside sheets (iOS navigation); a focused editor with Cancel/Save in the nav bar, because editing is a mode; a confirmation dialog for the one-time middle initial, because it can't be undone; iPad master/detail with the parent list kept on the left.
- **V2:** progressive disclosure on Fare Finder (numbered steps, later steps explain why they're locked); a wizard with a "Step n of N" header and an iPad step rail; inline "why" hints before inputs; a review step with Edit per section; the middle initial shows a name preview instead of a confirmation dialog, because the one-time rule was explained up front.
- **V3:** summary cards that expand into editors; inline station search and calendar under the field; on iPad a persistent editor pane, so the overview never moves.
- **Shared by all three:** the same validation, copy, network states, verification view, favorites/recents rules, PWD logic and open-question markers, so the comparison is about structure, not content.

## How each version fits the IA

All three use the same four tabs, the same global header (Account and Notification Inbox open as sheets), and the same entry points: Book › New Booking for booking; Account for Profile, discounts, assistance and Clear recents. None adds a destination or renames one.

- **Global navigation** (tab bar on iPhone, top glass bar on iPad) is never hidden by a flow; sheets cover it, and Close returns to it.
- **Within a destination**, V1 and V2 push screens inside the sheet (Back on the left, Close on the right). V3 edits in place in the same sheet. Navigation depth is the same; only how the editor appears changes.
- **Sheets vs covers:** Account and Booking are sheets, as in the IA. Verification is a full-screen cover over the sheet, because it interrupts any flow and returns to it afterward.
- **Provisional placements** (C3, C4) are the same in all three versions and are flagged in Screen notes.

## Checks run

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
