# Content pass: applied guidelines

- **Scope:** customer-facing text and accessibility labels in Familiar and Brand forward on `figma-make/sprint-4`.
- **Inventory:** 485 unique strings, collected in the browser from both concepts. That covered 10 scenarios × 15 locations, plus opened sheets, dialogs and info pages. Source files were searched for the rest (errors, confirmations, dialogs).
- **Wording:** the wording below is ours, written to the guidelines. None of it is quoted from Gabby or the core design file.

## Representative before and after

| Where | Before | After | Guideline |
|---|---|---|---|
| Assistance questionnaire, wheelchair question (helper) | Mobility device details (NMA-29) aren't part of this exploration. | *(removed; now a reviewer note under Screen notes › Not in Sprint 4)* | 12: no story IDs or implementation notes |
| Assistance questionnaire, other needs | Service animal and mobility device forms (NMA-628, 629) and live station-assistance availability (NMA-620) are placeholders, not designed here. | *(removed; reviewer note)* | 12; 6: no unresolved animal or device requirements |
| Station info | **Station details page not in Sprint 4** · Hours, accessibility, parking and amenities belong to the station details page, which isn't part of Sprint 4. | **Hours, accessibility, parking and amenities** · Content pending | 12; established "Content pending" convention |
| Traveling alone? | The rules for youths traveling without an adult (unaccompanied minors) will come from AEM. They aren't in this prototype. In the app, a youth needs an adult or senior on the same booking. | A youth needs an adult or senior on the same booking in the app. · **Youths traveling without an adult** · Content pending | 12; 1: lead with what the customer needs |
| Service animals, Accessible travel, Pass Rider policy | **Content not defined yet** · … will come from AEM / will be added later. | **Service animal information** (or the topic) · Content pending | 12; one consistent pending pattern |
| Trips (empty) | No upcoming trips · Trips you book show up here. Trip management is outside Sprint 4. | No upcoming trips · Trips you book show up here. | 9: state what's absent; 12 |
| Discount rules | Passenger types and traveler discounts, grouped so benefits aren't mixed. | *(removed: the title and group headings already say this)* | 2: no repeated instruction; 1 |
| Station search | Tap a station to choose it. Bookmark a station to keep it in favorites. | Bookmark a station to add it to favorites. | 1: don't explain what the control makes clear |
| Booking type sheet | Corporate fares for you only. Points, discounts and coupons aren't used. · Regular fares, with points, discounts and coupons. | Corporate fares for you only. Points, passenger discounts and codes aren't used. · Regular fares. Points, passenger discounts and codes can be used. | 11 and 4: one set of terms; passenger discounts kept apart from codes |
| Fare Finder restriction (Pass Rider, corporate) | Points, discounts and coupon codes aren't used for Pass Rider travel. | Points, passenger discounts and coupon or promotion codes aren't used for Pass Rider travel. | 11; 4: matches the field label |
| Corporate travelers card | Corporate bookings are for the TripLink traveler only. Traveler discounts, codes and points aren't used. You can still request assistance. | Corporate bookings are for the TripLink traveler only. You can still request assistance. | 11: don't repeat the mode explanation shown on the Fare Finder |
| Coupon or promotion code error | Please enter a valid coupon or promotion code | This code isn't valid. Check it and try again. | 9: name the problem and the recovery, without filler |
| Same, second attempt | Please enter a valid coupon or promotion code. Still having trouble? Call 1-800-USA-RAIL (1-800-872-7245). | This code still isn't valid. Call 1-800-USA-RAIL (1-800-872-7245) for help. | 9 |
| Code check at Find trains | Please enter a valid discount code · Add a companion to use this code. This code requires at least two travelers on the reservation. | This code can't be used. Check it and try again. · This code needs at least two travelers. Add a traveler to use it. | 9; 4: "coupon or promotion code", not "discount code" |
| Date of birth error | Please enter a valid date | Enter a valid date as MM/DD/YYYY | 9: give the correction (format) |
| Email verification error | Verification code does not match. Please enter valid verification code | This code doesn't match. Check it and try again, or request a new code. | 9 |
| Same-station dialog | Select different origin and destination stations. · **OK** | From and To need to be different stations. · **Choose another station** | 3: specific action instead of OK; 2: From and To |
| Pass Rider unavailable; Check assistance dialogs | **OK** | **Close** | 3 |
| My coupons › Use a coupon (toast) | Fall Northeast sale applied | Fall Northeast sale added to your booking. It's checked when you find trains. | 8: selecting isn't applying |
| Saved code type | Promo code | Promotion code | 8 and 12: consistent with "Coupon or promotion code" |
| Traveler assistance actions | Answer · Edit · "Answer removed for Traveler 1 · Adult. Choose an option again, or turn assistance off." | Add · Change · "Assistance removed for Traveler 1 · Adult. Add it again, or uncheck "Traveler with disability or need help?"" | 3: Add creates, Change replaces |
| Find trains blocked by assistance | Assistance is on, so each traveler needs an answer (1 not answered yet). | Answer the assistance questions for Traveler 2 · Adult, or uncheck "Traveler with disability or need help?" in Travelers. | 9; 5: names whose answers are missing |
| Assistance checkbox explanation | Let us know if anyone needs help, like … You'll answer for each traveler. | Like a wheelchair space, an accessible seat, station assistance or a personal companion. | 5 and 6: now per traveler, so "anyone" and "for each traveler" no longer apply. Still an AEM placeholder. |
| Disability options | Blind/Vision loss · Deaf/Hearing loss | Blind/vision loss · Deaf/hearing loss | 12: sentence case |

Accessibility labels follow the visible text:
- "Add assistance for Traveler N · Type" and "Change assistance for …".
- Each traveler's checkbox is named "Traveler with disability or need help? Traveler N · Type".
- Station rows keep "Favorite: City, CODE" with the pressed state.

## Already in place and kept

- *Assistance* title with "For Traveler N · Type" below.
- *Saved codes* entry, title and supporting text.
- *Coupon or promotion code* (Optional).
- No "Choosing" or "Choosing now"; *From* and *To* labels.
- *Exit booking?* with *Keep booking* and *Exit booking*. Its retention sentence describes what the prototype does.
- Service-animal guidance only inside the questionnaire.
- *Find trains*.

## Conflicts resolved

- **In Gabby's favor:**
  - The booking-level code field is *Coupon or promotion code*, not the story's "discount code" wording, and the error and check messages now match it.
  - The saved-code modal uses *Saved codes* with Gabby's supporting text.
  - The questionnaire title is *Assistance*, with traveler identity as secondary text.
- **In favor of your later direction:**
  - **Favorites icon.** Guideline 7 mentions a star; your most recent direction in this session was the bookmark. The bookmark stays, and the copy says "Bookmark a station to add it to favorites".
  - **Assistance checkbox.** Your direction that it sits inside each traveler's details takes precedence over the earlier single checkbox. Only checked travelers answer.

## Remaining content decisions

1. **Story-quoted errors replaced.** NMA-919 quotes "Please enter a valid date", and the verification and code errors came from story wording. They now follow guideline 9. Confirm the new wording, or that the story wording must stay verbatim.
2. **"My coupons" (Profile, NMA-697) versus "Saved codes" (Fare Finder).** These are different names for overlapping things. NMA-697 is out of target, so the Profile name wasn't changed. Decide on one term.
3. **Per-traveler assistance.** NMA-615 BR1.2 says every traveler answers once assistance is on. The prototype now asks only checked travelers (Q7 in Screen notes).
4. **Exit booking consequence.** The sentence "Your trip details are kept, so you can pick up from New booking" matches the prototype's retention. The production retention policy isn't defined; keep or drop the sentence once it is.
5. **AEM placeholders.** The assistance explanation and every *Content pending* block need final content.
6. **Search results stand-in.** The "Prototype handoff" page after Find trains still says search results aren't part of Sprint 4. It's a reviewer stand-in for the next screen, not customer UI.
7. **Assistance summary capitals.** Need names inside summaries keep their capitals ("Station assistance, Accessible seat") because they reuse the option labels.

## Verification

- The strings were collected again after the changes. No story IDs, "Sprint 4", "AEM", "prototype", "Please" or "Content not defined" remain in the app, apart from the search-results stand-in.
- Text fit was checked on Traveler details, the Booking type sheet and the code error, at iPhone size in light and dark.
- **Browser suites:**

  | Suite | Result |
  |---|---|
  | Final review | 167/167 |
  | Coverage | 128/128 |
  | Requirements | 190/190 |
  | s4flows | 49/49 |
  | Familiar | 30/30 |
  | Brand forward | 29/29 |
  | Journey | 119/119 |

  Tests that checked the old wording were updated to the new wording.
