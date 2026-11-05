# Assistance questionnaire: reviewer checklist

**Stories:** NMA-973, NMA-615, NMA-995, NMA-996, NMA-997, NMA-1019
**Branch:** `figma-make/ads-next-toggle` (ADS Next)
**Audience:** reviewers only. None of this appears in the app.

> **Source of the mapping.** The Jira text for these stories isn't in this repository. The rows below map the prototype to the update request and to the story summaries in `AUDIT-sprint4-synthesis.md`. Match each row to the Jira acceptance criteria before sign-off.

**Status key**
- **Demonstrated:** works in the prototype end to end.
- **Simulated:** works against a simulated network or service.
- **Decision needed:** built as a proposal; product or UX must confirm.

## How to review

1. Open the controls with the round button at the right edge.
2. Use **Scenario** to load a starting point:
   - Returning member (default)
   - Assistance: 4 travelers, different needs
   - Assistance: companion needs reassignment
   - Assistance: Pass Rider Leisure family
   - Pass Rider employee, Business Pass
3. Open **Book › New booking › Travelers**.
4. In a traveler's details, under **Traveler with disability or need help?**, choose **Add assistance** to open that traveler's questionnaire. After you confirm, the card shows the saved summary, and the button becomes **Edit assistance**, with **Remove**.
5. Use **Network** to test connectivity:
   - **Offline**
   - **Slow connection (120-second timeout)**
   - **Slow connection (6-second timeout, demo)**
   - **Server error**

The entry point keeps its place, question and explanatory text in each traveler's details. The checkbox is replaced by one call to action: **Add assistance**, which becomes **Edit assistance** once answers are confirmed. Leaving the questionnaire without confirming saves nothing. **Remove** clears that traveler's answers.

## Scenarios

| # | What to see | How |
|---|---|---|
| 1 | Each of the four types | Returning member › Travelers › Add assistance › choose each type › Confirm. The card shows the summary, Edit assistance and Remove. |
| 2 | Each disability, several at once | I have a disability › check Blind/vision loss, Deaf/hearing loss, Reduced mobility and Other disability in any combination. |
| 3 | No disability selected | I have a disability with nothing checked. Other needs stay disabled with "Select at least one disability above…", and Confirm shows "Choose at least one disability." |
| 4 | Reduced mobility: unanswered, Yes, No | Check Reduced mobility. Yes and No are both unselected, and Confirm asks for an answer. No allows any needs. Yes makes Accessible seat and a large service animal exclusive, with the reason shown beside them. |
| 4a | Service animal size | Check Service animal: Small, Medium or Large is required. Small and medium are always accepted, with or without an accessible seat or wheelchair space. Large follows the wheelchair rule: with Yes, Large is disabled while Accessible seat is checked, and Accessible seat is disabled while Large is chosen. Station assistance stays independent. The rules also apply with several disabilities. |
| 5 | Seat versus large animal | Choose No, check Accessible seat and Service animal › Large, then change to Yes. An inline "Choose an accessible seat or a large service animal" appears. Keep accessible seat clears the Large size (choose Small or Medium, or clear Service animal). Keep large service animal removes the seat. Confirm is blocked until one is chosen. |
| 6 | Station help without a disability | Choose "I do not have a disability, but need assistance at the station". It reads "Station assistance is included with this answer." Accessible seat is optional; confirm with or without it. No Passenger with disability discount applies. |
| 7 | Personal companion | Add 3 adults. Traveler 1: I have a disability. Traveler 2: personal companion, preselected to Traveler 1. Accessible seat stays disabled until Station assistance is checked; unchecking Station assistance clears it. Traveler 3 can't be a companion, because Traveler 1 already has one. |
| 8 | Multiple travelers | Scenario › Assistance: 4 travelers, different needs. Each card shows its own summary. Find trains (online) lists every traveler's answers on the search hand-off. |
| 9 | Editing and invalidated answers | Edit a saved traveler and change the type: inapplicable answers are removed, with an announced explanation. Removing Reduced mobility removes the wheelchair answer. Removing the last disability clears other needs. Scenario › companion needs reassignment shows an invalid pairing: Find trains is blocked, and the questionnaire asks for another traveler or type. |
| 10 | Draft and discard | Change answers, then Back. "Discard changes?" appears, and Discard keeps the confirmed answers. |
| 10a | Replace your discount? | Traveler selection › Traveler 1 › Discount › Military. Add assistance › I have a disability › a disability › Confirm. "Replace your discount?" names Military. Keep editing returns with every answer kept and Military unchanged; Replace discount saves, applies Passenger with disability and returns to Traveler selection, where the card says it was applied based on assistance information. No confirmation with no discount, with Passenger with disability already applied, or for station help without a disability. |
| 11 | Offline completion | Network › Offline. Add assistance on a questionnaire not opened before shows "Connect to the internet to open the assistance questions". A questionnaire already opened can be completed, confirmed and reopened offline. |
| 12 | Blocked offline search | Offline › Find trains shows "You're offline · Connect to the internet to find trains". Answers are kept and results don't open. |
| 13 | Cancel and timeout | Slow connection (6-second timeout, demo) › Find trains shows "Finding trains" and Cancel. Cancel stops it and restores the screen. Waiting shows "This is taking longer than usual" with Try again. Slow connection uses the real 120 seconds. |
| 14 | Pass Rider | Scenario › Assistance: Pass Rider Leisure family: you, spouse (personal companion to you), dependent and a Companion Pass traveler, each with their own answers. Scenario › Pass Rider employee, Business Pass › Business: you can still ask for assistance. |

## Acceptance criteria mapping

| Story | Requirement | Implementation | Status |
|---|---|---|---|
| NMA-973 | Indication per traveler, with explanation, opening that traveler's questions | `assistAsk()` in each traveler's details: Add assistance, then Edit assistance and Remove | Demonstrated · placement and button pattern Decision needed (Q7) |
| NMA-973 | Removing a traveler's assistance works offline | `A['assist-remove']` needs no network | Demonstrated |
| NMA-973 | Opening questions not yet accessed needs a connection; offline message | `A['assist-answer']` and `assistOffline`, per traveler (`taSeen`) | Simulated |
| NMA-973 | Slow request: loading, Cancel, 120-second timeout with Try again | `runNet` (`NET_TIMEOUT_MS = 120000`), "Opening questions" and "Finding trains" with Cancel | Simulated |
| NMA-615 | Four mutually exclusive types, one required | `catBlock` radios; `assistErrors` `cat` | Demonstrated |
| NMA-615 | Current traveler identified throughout | "For Traveler N · Type" heading; legend and Confirm name the traveler for screen readers | Demonstrated |
| NMA-615 | Answers stored per traveler, stable identity | `assistRec` / `setAssistRec` keyed by traveler (`adult-2`, `pr-dep-1`…); `forgetTraveler` on removal | Demonstrated |
| NMA-615 | Personal companion only with another traveler who has a disability; reason shown | `companionOpen`, `companionWhy` | Demonstrated |
| NMA-615 | One companion per traveler with a disability; association clear; no duplicates | `companionTargets`, "Personal companion to" select, card row "Companion to …" | Demonstrated |
| NMA-615 | Invalid companion must be fixed before completion | `travelerError`, `assistProblems`, `companionFor` (no silent reassignment), Find trains check | Demonstrated |
| NMA-615 | "I do not need assistance" saves "No assistance requested" | `assistSummaryItems` | Demonstrated |
| NMA-615 | Draft, confirm, discard; reopen restores; summary with Edit | Route draft `r.u.d`, `A['assist-confirm']`, `confirmDiscard`, `assistanceRow` | Demonstrated |
| NMA-615 | Confirmed answers carried into search; unresolved answers block | Search hand-off lists each traveler; `A['find-trains']` checks `assistMissing`, `assistProblems` | Demonstrated (results and booking aren't in Sprint 4) |
| NMA-995 | Disabilities with descriptions, several, at least one | `disBlock`, `assistErrors` `dis` | Demonstrated |
| NMA-995 | Other needs disabled until a disability is chosen, with reason | `needsBlock` `locked` | Demonstrated |
| NMA-995 | Wheelchair Yes/No, unselected, required | `wcBlock`, `assistErrors` `wc` | Demonstrated |
| NMA-995 | Service animal with a required size; small and medium always accepted | `animalSize`, `assistErrors` `animal` | Demonstrated · sizes Decision needed |
| NMA-995 | Yes: seat or a large animal, not both; station independent; reason shown; any number of disabilities | `needsBlock`, `bigAnimal` | Demonstrated |
| NMA-995 | Changing to Yes with both selected: inline choice, not silent | `assistConflict`, `A['assist-keep']`, `assistErrors` `needs` | Demonstrated |
| NMA-995 | Removing Reduced mobility removes the wheelchair answer and recalculates | `HOOKS.assist` | Demonstrated |
| NMA-996 | Station branch: included, optional seat, no disability, wheelchair or animal questions | Follow-up nested under the answer; `needsBlock` `st` | Demonstrated |
| NMA-996 | No disability discount implied | "The Passenger with disability discount doesn't apply"; `assistDiscount` is null | Demonstrated |
| NMA-997 | Optional Station assistance; Accessible seat only after it, explained; cleared when it's removed | `needsBlock` `comp`, `HOOKS.assist` | Demonstrated |
| NMA-1019 | Assistance for Business and Leisure Pass Rider and every traveler category | `travelerList` Pass Rider keys (`pr-you`, `pr-fam-*`, `pr-dep-*`, `pr-comp-*`) | Demonstrated · story Awaiting approval (Q24) |
| NMA-1019 | Companion Pass isn't a personal companion | Separate concepts; nothing is assigned automatically | Demonstrated |
| — | Content held in one configuration (AEM stand-in) | `ASSIST_COPY`, `CATS`, `DISABILITIES`, `NEEDS` in `data.js` | Demonstrated · copy is placeholder |
| — | Accessible controls; conditional changes announced; inline validation | Native radios and checkboxes, Required/Optional markers, `role="status"` region, `aria-describedby` on disabled options and errors | Demonstrated (axe 0 issues; not tested with VoiceOver or TalkBack) |

## Unimplemented or needs a product decision

1. **Entry point (Q7).** The per-traveler Add assistance / Edit assistance button departs from NMA-973's Fare Finder check (a checkbox) and NMA-615 BR1.2. The "assistance indication" is now the presence of confirmed answers, not a checked box. Agreement is needed.
2. **Service animal sizes.** Small, Medium and Large aren't defined in Jira or AEM content: no weights or examples, and nothing says whether small and medium need other information. Only Large is restricted, per the reviewer's rule. The old copy pointed small and medium animals to traveler information; confirm where they belong.
3. **When a questionnaire counts as "accessed".** The prototype treats it per traveler: Traveler 2's questions need a connection the first time even if Traveler 1's were opened. If content loads once for everyone, it should be per booking.
4. **Removing the last disability clears the other needs** (with an explanation) rather than keeping them hidden. Confirm that this is wanted.
5. **Who can be a personal companion (Q19).** Any traveler type may be one, including a child or infant. This isn't defined.
6. **Passenger with disability discount for Pass Rider and Corporate travel (Q12)** is open. Neither mode applies it.
7. **Booking beyond search.** Search results, seat selection and checkout aren't in Sprint 4, so "carried into booking" stops at the search hand-off.
8. **Not built:** mobility device details (NMA-29), service animal forms (NMA-628), live station-assistance availability (NMA-620), Save to profile (NMA-1051).
9. **Copy** in `ASSIST_COPY` is placeholder text standing in for AEM.
10. **Shared rules.** Account › Assistance (profile) uses the same disability and station rules.
