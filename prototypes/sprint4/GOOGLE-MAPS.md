# Google Maps in the station map

The station selector's Map view can draw its map with the Google Maps JavaScript API. Only the map surface changes. The screen, its entry points and every selection rule stay as they were. Without a key, or if Google Maps fails, the existing placeholder map is used.

## 1. Audit (before the change)

**Where the map lives**
- `mapView()` in `stationmap.js`, inside the shared station selector (`stationSearch()` in `screens.js`).
- Concepts 1 (Familiar) and 3 (Brand forward) use the same selector and map. Concept 3 wraps it in its own sheet (`stationsClear()` in `clear.js`) but renders the same map. There are no map-specific differences between concepts.
- The archived Concepts 2 and 4 also call the same selector.

**Entry points**
- New booking › From or To
- Train status › From or To
- Book › Passes (Multi-Ride) › From or To

The Map tab is next to List in each.

**Station data**
- Codes, names, cities and states: `STATIONS` in `data.js`.
- Coordinates, type, address and parking: `STATION_GEO` in `stationmap.js`.
- All 45 stations have valid coordinates. `STATION_GEO` also holds HYA and PJC, which have no station record and are never shown.

**Selection, owned by `stationmap.js` and `screens.js`**
- *Open the map:* `A['ss-view']`. The first extent comes from `initialView()`: around your location when it's known, otherwise the most recent station, otherwise a predefined Northeast Corridor view. Opening the map never asks for location.
- *Highlight:* tapping a marker (`A['map-pin']`) sets `r.u.mapSel` and shows the floating station card. The field doesn't change.
- *Group:* overlapping markers become a numbered group (`visibleMarkers()`). Tapping it (`A['map-group']`) zooms in two levels and lists the stations.
- *Details:* `A['map-details']` pushes `station-detail`. Back returns with the same centre, zoom and highlight.
- *Confirm:* only Select on the card or the Details screen, or a List row, calls `A['choose-station']`. It writes the originating field and returns to the opener.
- *Back out:* Back or Escape returns without changes.
- *Reopen:* a new selector starts from `initialView()` again.

**Smallest safe integration point**
- The map area inside `mapView()`. The prototype re-renders the device's HTML on every change, so a Google map has to live in a node that's kept between renders and put back into the Map view's slot after each render.

**Dependencies and limits**
- A browser API key and network access to `maps.googleapis.com`.
- Advanced Markers need a Map ID. Google's `DEMO_MAP_ID` is used when none is set; use a real Map ID beyond development.
- The project had no API-key pattern. Its `.gitignore` already excludes `.env*` (except `.env.example`), so the key is a Vite environment variable.

## 2. What changed

| File | Change |
|---|---|
| `prototypes/sprint4/gmap.js` (new) | Loads Google Maps on first use of the Map view. Keeps one map node between renders and syncs it with the selector state. Draws markers with the existing ADS marker markup. Panning or zooming updates the view only. Falls back on no key, script error, rejected key (`gm_authFailure`) or a 15-second timeout. |
| `prototypes/sprint4/stationmap.js` | Marker markup moved into `markerHtml()`, shared by both surfaces. Coordinates validated (`validLatLon`, `geoIssues`). The Map view renders a `.gmap-slot` when Google is ready. The prototype's own drag and wheel handlers skip the Google surface. |
| `prototypes/sprint4/stationmap.css` | The Google surface fills the map area; markers are centred on their point. |
| `scripts/sprint4-assemble.mjs` | `gmap` added to `JS_ORDER`, after `stationmap`. |
| `src/App.jsx` | `npm run dev` and `npm run build` pass `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID` to the prototype as `window.S4_CONFIG`. |
| `.env.example` (new) | The two variable names, empty. |
| `tests/prototype/googlemap.cjs` (new) | Fallback, load failures, the Google path through a test double, and invalid coordinates. |
| `tests/prototype/fixtures/` (new) | `stations.mock.json` (mock stations with valid, missing, out-of-range and 0,0 coordinates; codes start with Z) and `google-maps-stub.js` (a minimal stand-in for the Maps API). Tests only; never part of the prototype's data. |

**Kept as is:** List and Map tabs, the heading and Back, the ADS zoom and locate controls (Google's default UI is turned off), the floating station card, Details, Select, groups, the offline note, the simulated "Map fails to load" state, booking logic, the bottom navigation and modals.

## 3. Setup

### Quick start: free Maps Demo Key (prototyping only)

The [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key) needs no billing. It covers map rendering, markers and click events, which is everything this map uses. It needs a personal Google Account (not Workspace), has a daily limit (usage pauses, nothing is charged), and isn't for production.

1. Open the page above, sign in, choose **Get a Demo Key** and accept the Maps Demo Key terms. The key is shown straight away and is also emailed to you.
2. Put it in the one variable the prototype reads, **`VITE_GOOGLE_MAPS_API_KEY`**:
   - **Claude Code cloud session:** session title bar › environment menu › **Edit** › environment variables › add `VITE_GOOGLE_MAPS_API_KEY` with the key as its value. Start a new session; the variable applies to new sessions.
   - **Your own clone:** create `.env.local` in the repository root containing `VITE_GOOGLE_MAPS_API_KEY=<key>` (ignored by git), then run `npm run dev`.
3. Leave `VITE_GOOGLE_MAPS_MAP_ID` empty. The prototype uses `DEMO_MAP_ID`, as Google's demo-key example does.
4. Check it: `node tests/prototype/googlemap-live.cjs`. It starts the dev server, checks the fallback, then the live map. It never prints the key; a screenshot goes to `test-results/googlemap-live.png`.

Never paste the key into chat, an issue, `index.html` or any committed file.

### Standard key (billing enabled)

1. In Google Cloud Console, create or choose a project and enable billing.
2. Under **APIs & Services › Library**, enable **Maps JavaScript API**.
3. Under **APIs & Services › Credentials**, choose **Create credentials › API key**. Then edit the key:
   - **Application restrictions:** *Websites (HTTP referrers)*. Add only the origins that serve the prototype, for example `http://localhost:5173/*` for `npm run dev`, plus your deployed preview domain, such as `https://your-preview.example.com/*`.
   - **API restrictions:** *Restrict key* › select only **Maps JavaScript API**.
4. Optional: under **Google Maps Platform › Map management**, create a Map ID (JavaScript, vector) for Advanced Markers. Without one, Google's `DEMO_MAP_ID` is used, which is for development only.
5. In the repository root, copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your-browser-key
   VITE_GOOGLE_MAPS_MAP_ID=your-map-id   # optional
   ```
   `.env.local` is ignored by git. Never commit a key.
6. Run `npm run dev` and open a station search › Map.

**Notes**
- **Builds:** `npm run build` writes the key into `build/` (ignored by git). Browser keys are visible to anyone who loads the page, which is why the referrer and API restrictions matter.
- **Standalone file:** `npm run build:standalone` (`prototypes/sprint4/index.html`) never contains a key, so it, and the published artifact made from it, show the placeholder map. Another host page can define `window.S4_CONFIG = { googleMapsApiKey: '…' }` before the prototype script.
- **Rejected keys:** Google reports a refused key or referrer through `gm_authFailure`, and the prototype then falls back.

## 4. Fallback

- **No key:** Google isn't requested. The placeholder map is used, and the reviewer notes say so.
- **Load failure:** script error, rejected key or timeout. A `map_load_failed` event is recorded with the reason, and the placeholder map takes over with the same view, markers and highlight.
- **Unchanged:** Location › Map › "Fails to load" still shows the existing "The map couldn't load" state, with Try again and the list.
- **Stations without valid coordinates** (missing, out of range, or 0,0) are left off the map, listed in the reviewer notes and logged once to the console. They stay in search and the list.

## 5. Verification

**Verified (2026-11-05):**
- `tests/prototype/googlemap.cjs`, 35/35:
  - **No key:** placeholder map, no request to Google, highlight then Select.
  - **Blocked script:** falls back.
  - **Live invalid key against Google's real script:** `gm_authFailure` fires and the map falls back; markers stay selectable.
  - **Google path through the test double:**
    - The map sits in the slot with Google's default UI off and the ADS controls kept, and its markers come from the visible station data.
    - Tapping a marker highlights it without changing the field; another marker replaces the highlight.
    - Dragging or pinching changes the view only.
    - The ADS zoom buttons drive the camera.
    - Details and Back keep the same view and highlight; a group zooms in and lists its stations, and choosing one from that list highlights its marker.
    - Select fills only the originating field; reopening reuses the same map; the List tab removes the markers; backing out keeps the field.
  - **Mock fixtures:** invalid coordinates are flagged, left off the map and still found in search.
- **`npm run dev`** with a placeholder key in the environment: the key reaches `window.S4_CONFIG`, the Google script is requested with it, Google rejects it, and the map falls back.
- **Existing suites** still pass on the placeholder path: `stationsearch`, `stationsearch-a11y`, `stationselector`, `adsnext-rollout`.

**Verified live with a Maps Demo Key (2026-11-05), `tests/prototype/googlemap-live.cjs`, 12/12:**
- **Loads:** Google Maps loads in the Map view with tiles drawn.
- **Markers:** they come from the prototype's station data and sit on the right places (Washington Union Station, Alexandria, Lorton).
- **Gestures:**
  - The ADS zoom button moves the Google camera.
  - Dragging pans the map and the scroll wheel zooms; neither selects a station nor changes the booking.
- **Selection:**
  - Tapping a Google marker highlights it, shows it as selected and opens the station card; the field doesn't change.
  - Select fills From and returns to New booking.
- **Errors:** no page errors.

**Not verified:**
- Touch gestures (pinch) on a real phone or tablet.
- The published artifact can't load Google Maps: it has no key, and the artifact host only allows scripts from approved CDNs. It shows the placeholder.
