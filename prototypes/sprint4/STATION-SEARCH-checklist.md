# Enhanced station search: reviewer checklist

**Stories:** NMA-1084 (Search by Map) and NMA-1085 (Nearby Stations / My Location)
**Branch:** `figma-make/ads-next-toggle` (ADS Next)
**For reviewers only:** none of this appears in the app. Open questions also show under Prototype controls › Screen notes.

> **Source of the mapping.** The Jira text for these stories, including the 14 acceptance scenarios in each, isn't in this repository. This checklist maps the implementation to the requirements as written in the Sprint 4 request: shared selector, NMA-1084 items 1–10, NMA-1085 items 1–10, accessibility and scope. Before sign-off, match each Jira scenario to these rows.

**Status key**
- **Demonstrated:** works in the prototype end to end.
- **Simulated:** works against simulated location, map tiles or the nearby-stations service.
- **Awaiting decision:** built as a reviewable proposal; product or UX must confirm.

## How to review

1. Open the controls panel with the round button at the right edge.
2. **Location (simulated):**
   - **Platform:** iOS or Android, for the native prompts.
   - **Location permission:** not asked yet, precise, approximate, allowed once, or denied before.
   - **Device location:** on, Location Services off, or location can't be found.
   - **Device is in:** Midtown New York, Center City Philadelphia, State College (nearest station over 60 miles), or Yellowstone (none within 150 miles).
   - **Nearby stations service:** works or fails.
   - **Map:** loads or fails.
3. **Network › Offline** checks offline behaviour.
4. **Entry points:**
   - **New booking:** Book › New booking › From or To.
   - **Train status:** Train status tab › From or To.
   - **Multi-Ride:** Book › Passes › From or To.
5. **Analytics events** (in the controls) lists every event the app would send.

## Shared station selector

| # | Requirement | Implementation | Status |
|---|---|---|---|
| S1 | Reused across Fare Finder, Train Status and Multi-Ride | One selector (`SCR.stations`), opened with the experience and field that called it (`ctx`, `field`) | Demonstrated |
| S2 | Members, logged-out users and guests; iOS and Android | Scenario › Returning member, Guest, New user. Platform › iOS / Android switches the native prompts and Settings copy | Demonstrated (platform UI simulated) |
| S3 | List and Map views; My Location as a distinct option, even without permission | ADS Tabs (List · Map). My Location is a List row above favorites in every permission state | Demonstrated |
| S4 | Typed search, favorites and recents preserved | Unchanged. Typing in Map view shows search results | Demonstrated |
| S5 | Returns to the opener; only the originating field changes | `choose-station` writes only `field` on the opener's data and returns to it. It no longer moves on to the other field | Demonstrated; exception: Auto Train validation (decision 5) |
| S6 | Closing or backing out keeps field values | Nothing is written until a station is chosen or Select is pressed | Demonstrated |
| S7 | No Profile › My Stations or More › Stations | Not added | Demonstrated |

## NMA-1084 Search by Map

| # | Requirement | Implementation | Status |
|---|---|---|---|
| M1 | Interactive map; markers for the visible area, updated on pan and zoom; no fixed radius | Drag, wheel/pinch and arrow keys pan; plus/minus and the map controls zoom. Markers are recomputed from station data for the visible area on each change. Tiles are a placeholder drawing | Simulated (tiles) · Demonstrated (markers) |
| M2 | With permission, use OS precise/approximate location; optionally center on it | When location is already allowed, the map centers on it and shows your location (a wider circle for approximate) | Simulated |
| M3 | Opening Map never requests permission; manual browsing without location | Map opens without a prompt in every state. The locate button asks only when tapped | Demonstrated |
| M4 | Selected marker: more than colour; station information | Selected marker is larger, ringed, with a check and its code, and `aria-pressed`. The card shows city and state, facility name, type with its icon, address, distance when known, Details and Select | Demonstrated (address and type are sample data) |
| M5 | Details shows station information (parking); back keeps position, zoom and selection | Details screen (type, address, distance, parking; hours/accessibility content pending). Back returns with the same center, zoom and selected marker | Demonstrated |
| M6 | Another marker replaces the tentative selection; only Select commits | Tapping a marker updates the card; the field changes only on Select | Demonstrated |
| M7 | Closely spaced stations individually discoverable | Overlapping markers become a numbered group, named with every station. Tapping zooms in two levels and lists the stations, each selectable (proposed interaction) | Awaiting decision |
| M8 | Switch back to List | List tab | Demonstrated |
| M9 | Initial extent widened to include at least one nearest station when location is known | Zoom is chosen so your location and the nearest station are both in view; pan and zoom stay available | Simulated · Awaiting decision (UX to confirm) |
| M10 | Without location: recent station, else a predefined location | Most recent station at zoom 10; with no recents, a predefined Northeast Corridor view (Scenario › New user) | Awaiting decision (proposal) |

## NMA-1085 Nearby Stations / My Location

| # | Requirement | Implementation | Status |
|---|---|---|---|
| N1 | My Location starts a nearby search | My Location row | Demonstrated |
| N2 | Native permission flow if not yet requested | Simulated iOS alert (Allow Once, Allow While Using App, Don't Allow, Precise switch) and Android dialog (Precise/Approximate, While using the app, Only this time, Don't allow) | Simulated |
| N3 | Already allowed: no prompt; precise, approximate and temporary respected | Precise, approximate and allowed-once all locate without asking. Approximate labels distances as estimates | Simulated · approximate handling awaiting decision |
| N4 | Loading while locating and loading stations | "Finding your location", then "Finding nearby stations" (announced) | Demonstrated |
| N5 | Results in List view: name, city, state, distance; closest first | Station rows with distance ("0.7 mi", spoken "0.7 miles away"), sorted ascending, under "Near you · within N mi" | Demonstrated |
| N6 | 20 miles; +20 only while none found; max 150; no count limit | 20, 40, 60, 80, 100, 120, 140, then 150 miles. All stations within the first radius that has any. State College finds Harrisburg at 80 miles | Demonstrated |
| N7 | A result returns and fills only the correct field | As S5 | Demonstrated |
| N8a | Denied on the first request | iOS: Open Settings. Android: Try again once, then Settings | Simulated |
| N8b | Previously denied, with Settings | No prompt; Open Settings opens simulated device Settings; allowing there resumes the search | Simulated |
| N8c | Location Services off, with guidance | Platform-specific path in the message; Open Settings | Simulated |
| N8d | Location unavailable, with Retry | Device location › Location can't be found | Simulated |
| N8e | Nearby data failure, with Retry | Nearby stations service › Fails | Simulated |
| N8f | No stations in the supported area | Device is in › Yellowstone. "No stations within 150 miles" with Explore map | Demonstrated · conflict 1 |
| N9 | Typed search and the list available in every state; configurable messages | Search field, favorites, recents and the full list stay on screen in every state. Messages live in `NEAR_MSG` | Demonstrated |
| N10 | An already shown station can be chosen without a new request; don't imply offline tiles or nearby results | Offline, a displayed nearby result can still be chosen. My Location says it needs a connection. The map says it can't load new areas | Demonstrated |

## Accessibility

| Requirement | Implementation | Status |
|---|---|---|
| Names for map, controls, markers, information, My Location, distances, results, selection, back and close | Map region (with key instructions and a count of stations in view), Zoom in / Zoom out / locate, markers ("City, ST, facility. Type, N miles away"), groups, the card, "Select … as your departure station", Close station information, Back / Close station search | Demonstrated |
| Selected state beyond colour | Marker: size, ring, check and code text, plus `aria-pressed`. List rows: check plus "selected". Route fields: brand border plus `aria-current` | Demonstrated |
| Reading order and assistive technology | The search, route, view tabs, My Location and results follow source order. Map markers are in north-to-south order. Status messages use `role="status"` | Demonstrated (verified with axe; not tested with VoiceOver or TalkBack hardware) |

## Analytics annotations

Events appear live under Prototype controls › Analytics events. Nothing is sent.

| Jira metric | Event(s) | Properties |
|---|---|---|
| Usage | `station_search_opened`, `station_search_view_selected` (list or map), `nearby_search_started` | experience, field, view |
| Selection | `map_marker_selected`, `map_station_details_opened` | code, replaced |
| Conversion | `map_station_selected`, `nearby_station_selected`, `station_selected` | code, experience, field, `distance_mi`, rank |
| Abandonment | `map_abandoned`, `station_search_abandoned` (selector left without choosing) | view, tentative marker |
| Pan / zoom | `map_panned`, `map_zoomed`, `map_centered_on_location` | via (drag, key, button, group, pinch/wheel), zoom |
| Load success | `map_load_succeeded`, `map_load_failed`, `nearby_results_loaded`, `nearby_results_failed`, `nearby_no_results` | zoom, initial extent, `radius_mi`, count, precision |
| Permission acceptance | `location_permission_prompted`, `location_permission_granted`, `location_permission_denied`, `location_settings_opened`, `location_enabled_in_settings` | platform, scope, precision, first or previous |
| GPS failure | `gps_location_failed`, `location_services_disabled` | — |
| Selected-station distance | `distance_mi` on `map_station_selected` and `nearby_station_selected` | miles, when location is known |

## Decisions needed

1. **No-results conflict.** The scenario says to zoom out to find a station; the rule caps the search at 150 miles. The prototype stops at 150 miles and offers Explore map.
2. **GPS required?** Older notes say the map needs GPS; the acceptance criteria allow manual browsing. The prototype follows the acceptance criteria.
3. **Approximate location and re-prompting.** Both are TBD in Jira, and the re-prompt notes conflict with "don't prompt again". The prototype follows native behaviour: iOS doesn't re-ask; Android asks once more.
4. **Map initial extent.** Widening to the nearest station (M9) and the fallbacks (M10) need UX confirmation.
5. **Auto Train.** The existing validation sets or clears the other field when Lorton or Sanford is chosen, which conflicts with "only the originating field".
6. **Closely spaced stations.** The group interaction (M7) is a proposal.
7. **Station data.** Coordinates, types, addresses and parking are sample data. Hours, accessibility and amenities belong to the station details page (NMA-604).
8. **Ineligible stations.** "Hide Ineligible Stations" isn't applied; it moved to a separate improvement story (Nov 3 comment).
9. **Multi-Ride and Train status.** Their purchase and results flows aren't designed. The prototype adds minimal entry screens only to show the shared selector.
10. **Selector no longer auto-advances.** After a station is chosen it returns to the opener (S5), which changes the earlier behaviour of moving straight on to the other field.

## Screens changed

- **Station search (all three entry points):**
  - List and Map tabs and the My Location row.
  - Nearby results, the loading state and seven recovery states.
  - Map view with markers, groups and controls; the offline and load-failure states.
  - The station information card.
- **New: Station details** (from the map).
- **New: simulated OS screens** — the iOS and Android location permission prompts and device Settings.
- **Train status tab:** From and To station fields, plus Check status (results pending).
- **Book › Passes:** now opens a Multi-Ride entry with From and To station fields, plus Find Multi-Ride tickets (results pending).
- **New booking:** unchanged layout; station selection returns after each field.
