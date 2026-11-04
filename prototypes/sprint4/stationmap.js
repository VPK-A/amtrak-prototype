/* Sprint 4 prototype: Enhanced station search
   - NMA-1084 Search by Map: List and Map views in the shared station selector; an interactive map whose markers
     follow the visible area (no fixed radius); marker → station information → Details or Select.
   - NMA-1085 Nearby stations: "My Location" in the selector; native permission flows (iOS and Android); nearby
     results by distance with the 20-mile, +20-mile, 150-mile rule; separate recovery states.
   - One selector for New booking, Train status and Multi-Ride. It remembers the experience and field that opened
     it, and only Select (or choosing a row) writes that one field.
   Location, map tiles and the nearby-stations service are simulated (reviewer controls › Location). Station
   coordinates, types, addresses and parking are realistic sample data, not a station feed. */

// ---------- Station geography (sample data) ----------
const STATION_TYPES = {
  building: { label: 'Station building', icon: 'station-train' },
  shelter: { label: 'Platform with shelter', icon: 'platform-shelter' },
  platform: { label: 'Platform only', icon: 'platform-no-shelter' },
  bus: { label: 'Curbside bus stop', icon: 'platform-bus' }
};
// code: [lat, lon, type, street address, parking (when available)]
const STATION_GEO = {
  ABQ: [35.0821, -106.6475, 'building', '320 1st St SW, Albuquerque, NM 87102'],
  ALB: [42.6413, -73.7413, 'building', '525 East St, Rensselaer, NY 12144', 'Garage and surface lots at the station. Fees apply.'],
  ALX: [38.8063, -77.0618, 'building', '110 Callahan Dr, Alexandria, VA 22301', 'Metered street parking nearby.'],
  ATL: [33.7999, -84.3917, 'building', '1688 Peachtree St NW, Atlanta, GA 30309', 'Short-term parking at the station.'],
  BAL: [39.3077, -76.6157, 'building', '1515 N Charles St, Baltimore, MD 21201', 'Garage and surface lot next to the station. Fees apply.'],
  BBY: [42.3473, -71.0752, 'building', '145 Dartmouth St, Boston, MA 02116', 'Garage parking nearby. Fees apply.'],
  BOS: [42.3523, -71.0552, 'building', '700 Atlantic Ave, Boston, MA 02110', 'Garage above the bus terminal. Fees apply.'],
  BWI: [39.1925, -76.6942, 'building', '7 Amtrak Way, Linthicum, MD 21240', 'Daily and long-term garage at the station.'],
  CHI: [41.8789, -87.6403, 'building', '225 S Canal St, Chicago, IL 60606', 'Garages nearby. Fees apply.'],
  CLT: [35.2413, -80.8233, 'building', '1914 N Tryon St, Charlotte, NC 28206', 'Free surface lot.'],
  DAL: [32.7760, -96.8076, 'building', '400 S Houston St, Dallas, TX 75202'],
  DEN: [39.7530, -105.0000, 'building', '1701 Wynkoop St, Denver, CO 80202'],
  EMY: [37.8406, -122.2914, 'building', '5885 Horton St, Emeryville, CA 94608', 'Short-term lot at the station.'],
  EWR: [40.7046, -74.1906, 'shelter', 'Newark Liberty International Airport, Newark, NJ 07114'],
  HAR: [40.2620, -76.8780, 'building', '411 Market St, Harrisburg, PA 17101', 'Garage next to the station. Fees apply.'],
  HYA: [41.6559, -70.2809, 'bus', '215 Iyannough Rd, Hyannis, MA 02601', 'Public lot at the transportation center.'],
  KCY: [39.0846, -94.5857, 'building', '30 W Pershing Rd, Kansas City, MO 64108'],
  LAX: [34.0562, -118.2365, 'building', '800 N Alameda St, Los Angeles, CA 90012', 'Patsaouras Plaza garage. Fees apply.'],
  LOR: [38.7086, -77.2260, 'building', '8006 Lorton Rd, Lorton, VA 22079'],
  MIA: [25.8497, -80.2581, 'building', '8303 NW 37th Ave, Miami, FL 33147'],
  MKE: [43.0346, -87.9178, 'building', '433 W St Paul Ave, Milwaukee, WI 53203'],
  NFK: [36.8508, -76.2795, 'building', '280 Park Ave, Norfolk, VA 23510'],
  NHV: [41.2977, -72.9266, 'building', '50 Union Ave, New Haven, CT 06519', 'Garage across Union Avenue. Fees apply.'],
  NOL: [29.9462, -90.0784, 'building', '1001 Loyola Ave, New Orleans, LA 70113'],
  NRO: [40.9115, -73.7839, 'shelter', '1 Railroad Pl, New Rochelle, NY 10801'],
  NWK: [40.7346, -74.1642, 'building', '1 Raymond Plaza W, Newark, NJ 07102'],
  NYP: [40.7506, -73.9971, 'building', '351 W 31st St, New York, NY 10001', 'No station parking. Garages nearby; fees apply.'],
  OKJ: [37.7943, -122.2717, 'building', '245 2nd St, Oakland, CA 94607'],
  ORL: [28.5258, -81.3814, 'building', '1400 Sligh Blvd, Orlando, FL 32806'],
  PDX: [45.5290, -122.6768, 'building', '800 NW 6th Ave, Portland, OR 97209'],
  PGH: [40.4450, -79.9922, 'building', '1100 Liberty Ave, Pittsburgh, PA 15222'],
  PHL: [39.9557, -75.1820, 'building', '2955 Market St, Philadelphia, PA 19104', 'Garage and surface lots at the station. Fees apply.'],
  PJC: [40.3166, -74.6235, 'shelter', '2 Wallace Rd, Princeton Junction, NJ 08550', 'Permit and daily lots at the station.'],
  PVD: [41.8296, -71.4134, 'building', '100 Gaspee St, Providence, RI 02903'],
  RVR: [37.6178, -77.4970, 'building', '7519 Staples Mill Rd, Richmond, VA 23228', 'Free surface lot.'],
  SAC: [38.5844, -121.5006, 'building', '401 I St, Sacramento, CA 95814'],
  SAN: [32.7166, -117.1695, 'building', '1050 Kettner Blvd, San Diego, CA 92101'],
  SAS: [29.4198, -98.4785, 'building', '350 Hoefgen Ave, San Antonio, TX 78205'],
  SEA: [47.5985, -122.3302, 'building', '303 S Jackson St, Seattle, WA 98104'],
  SFA: [28.8138, -81.3065, 'building', '600 S Persimmon Ave, Sanford, FL 32771'],
  SLC: [40.7616, -111.9100, 'building', '340 S 600 W, Salt Lake City, UT 84101'],
  STL: [38.6251, -90.2066, 'building', '430 S 15th St, St. Louis, MO 63103'],
  STM: [41.0465, -73.5421, 'building', '30 Station Pl, Stamford, CT 06902', 'Garage at the station. Fees apply.'],
  TPA: [27.9548, -82.4497, 'building', '601 N Nebraska Ave, Tampa, FL 33602'],
  TRE: [40.2178, -74.7553, 'building', '72 S Clinton Ave, Trenton, NJ 08609', 'Garage next to the station. Fees apply.'],
  WAS: [38.8973, -77.0063, 'building', '50 Massachusetts Ave NE, Washington, DC 20002', 'Garage at the station. Fees apply.'],
  WIL: [39.7368, -75.5513, 'building', '100 S French St, Wilmington, DE 19801', 'Garage across from the station. Fees apply.']
};
const geoOf = c => { const g = STATION_GEO[c]; return g && { lat: g[0], lon: g[1], type: g[2], address: g[3], parking: g[4] || '' }; };
// Rail corridors drawn on the placeholder map so the geography reads (not a route-eligibility filter)
const RAIL_LINES = [['HYA'], ['BOS', 'BBY', 'PVD', 'NHV', 'STM', 'NRO', 'NYP', 'NWK', 'EWR', 'PJC', 'TRE', 'PHL', 'WIL', 'BAL', 'BWI', 'WAS', 'ALX', 'LOR', 'RVR'], ['RVR', 'NFK'], ['NYP', 'ALB'], ['PHL', 'HAR', 'PGH', 'CHI'], ['WAS', 'CLT', 'ATL', 'NOL'], ['LOR', 'SFA'], ['SFA', 'ORL', 'TPA'], ['ORL', 'MIA'], ['CHI', 'MKE'], ['CHI', 'STL', 'KCY', 'DEN', 'SLC', 'SAC', 'EMY', 'OKJ'], ['CHI', 'DAL', 'SAS'], ['SAS', 'LAX', 'SAN'], ['LAX', 'OKJ', 'SAC', 'PDX', 'SEA'], ['KCY', 'ABQ', 'LAX']];

// ---------- Simulated location (reviewer controls › Location) ----------
// permission: ask (not requested yet) · precise · approx (while using) · once (this session only) · denied (asked before)
// device: on · off (Location Services off) · fail (location can't be found)
// place: where the device is; data: the nearby-stations service; map: map tiles
const PLACES = {
  midtown: { label: 'New York, NY (Midtown)', lat: 40.7549, lon: -73.9840 },
  centercity: { label: 'Philadelphia, PA (Center City)', lat: 39.9526, lon: -75.1652 },
  statecollege: { label: 'State College, PA (nearest station over 60 miles)', lat: 40.7934, lon: -77.8600 },
  yellowstone: { label: 'Yellowstone, WY (no station within 150 miles)', lat: 44.6000, lon: -110.5000 }
};
const LOC_DEFAULT = () => ({ platform: 'ios', perm: 'ask', device: 'on', place: 'midtown', data: 'ok', map: 'ok' });
const loc = () => (V().loc ||= LOC_DEFAULT());
const locGranted = () => ['precise', 'approx', 'once'].includes(loc().perm);
const locKnown = () => locGranted() && loc().device === 'on';
// Approximate location is a few miles off and reported with a wider accuracy circle (the OS decides how coarse)
function devicePos() {
  const p = PLACES[loc().place] || PLACES.midtown, approx = loc().perm === 'approx';
  return approx ? { lat: p.lat + 0.031, lon: p.lon - 0.042, acc: 3, approx: true } : { lat: p.lat, lon: p.lon, acc: 0.05, approx: false };
}
// Messages for every nearby and map state. Configurable: product and content can change any of them here.
const NEAR_MSG = {
  locating: 'Finding your location',
  loading: 'Finding nearby stations',
  deniedFirst: { title: 'Location isn’t allowed', body: 'You can still search by name or browse the map.' },
  denied: { title: 'Location is off for Amtrak', body: 'To see stations near you, allow location in Settings. You can still search by name or browse the map.' },
  servicesOff: { title: 'Location Services are off', ios: 'Turn on Location Services in Settings › Privacy & Security › Location Services. You can still search by name or browse the map.', android: 'Turn on Location in Settings › Location. You can still search by name or browse the map.' },
  unavailable: { title: 'We couldn’t find your location', body: 'Check your connection or move to an open area, then try again. You can still search by name or browse the map.' },
  data: { title: 'We couldn’t load nearby stations', body: 'Try again in a moment. You can still search by name or browse the map.' },
  offline: { title: 'You’re offline', body: 'Nearby stations need a connection. You can still choose a station shown on this screen or search by name.' },
  none: { title: 'No stations within 150 miles', body: 'Search by city, station or ZIP code, or explore the map.' },
  mapFail: { title: 'The map couldn’t load', body: 'Try again, or search by name or use the list.' },
  mapOffline: 'You’re offline. The map can’t load new areas, but you can choose a station shown on it.'
};

// ---------- Selector context: which experience and field opened it ----------
// ff · New booking (D().booking) · ts · Train status (D().ts) · mr · Multi-Ride (D().mr)
const SEL_NAMES = { ff: 'New booking', ts: 'Train status', mr: 'Multi-Ride' };
const selTarget = ctx => ctx === 'ts' ? (D().ts ||= { from: null, to: null }) : ctx === 'mr' ? (D().mr ||= { from: null, to: null }) : D().booking;
const selIndex = () => { const sh = sheet(); if (!sh) return -1; for (let i = sh.stack.length - 1; i >= 0; i--) if (sh.stack[i].s === 'stations') return i; return -1; };
const selRoute = () => { const i = selIndex(); return i >= 0 ? sheet().stack[i] : null; };
const curCtx = () => { const r = selRoute(); return (r && r.p.ctx) || 'ff'; };

// ---------- Analytics (reviewer-only annotations; nothing is sent) ----------
function track(ev, props = {}) {
  const v = V(); v.analytics = [{ ev, props, at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) }, ...(v.analytics || [])].slice(0, 60);
  renderAnalytics();
}
function renderAnalytics() {
  const box = document.getElementById('analytics'); if (!box) return;
  const list = V().analytics || [];
  box.innerHTML = `<p class="nsmall">Events the app would send for NMA-1084 and NMA-1085 metrics. Nothing is sent.</p>${list.length ? `<ol class="nlist ana-list">${list.map(e => `<li><b>${esc(e.ev)}</b> <span class="nsmall">${esc(e.at)}</span>${Object.keys(e.props).length ? `<br><code>${esc(Object.entries(e.props).map(([k, v]) => `${k}: ${v}`).join(' · '))}</code>` : ''}</li>`).join('')}</ol>` : '<p class="nsmall">No events yet. Open station search and try List, Map or My Location.</p>'}<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" id="anaClear">Clear events</button>`;
}
document.addEventListener('click', e => { if (e.target.id === 'anaClear') { V().analytics = []; renderAnalytics(); } });

// ---------- Distances and the nearby search rule (NMA-1085) ----------
function miles(a, b) {
  const R = 3958.8, toR = x => x * Math.PI / 180, dLat = toR(b.lat - a.lat), dLon = toR(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtMi = (m, approx) => `${approx ? 'About ' : ''}${m < 10 ? m.toFixed(1) : Math.round(m)} mi`;
const spokenMi = (m, approx) => `${approx ? 'about ' : ''}${m < 10 ? m.toFixed(1) : Math.round(m)} miles away`;
// Start at 20 miles; while nothing is found, widen by 20 miles; stop at 150 miles. No result-count limit.
const NEAR_RADII = [20, 40, 60, 80, 100, 120, 140, 150];
function nearbySearch(pos) {
  const all = STATIONS.filter(s => geoOf(s.code)).map(s => ({ code: s.code, mi: miles(pos, geoOf(s.code)) })).sort((a, b) => a.mi - b.mi);
  for (const r of NEAR_RADII) { const hit = all.filter(x => x.mi <= r); if (hit.length) return { radius: r, results: hit }; }
  return { radius: 150, results: [] };
}

// ---------- Map projection (Web Mercator, 256px tiles) ----------
const TILE = 256, Z_MIN = 3, Z_MAX = 14;
const wx = (lon, z) => (lon + 180) / 360 * TILE * 2 ** z;
const wy = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE * 2 ** z; };
const unx = (x, z) => x / (TILE * 2 ** z) * 360 - 180;
const uny = (y, z) => { const n = Math.PI - 2 * Math.PI * y / (TILE * 2 ** z); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
let MAP_BOX = { w: 390, h: 420 }; // measured after each render
const DEFAULT_VIEW = { lat: 40.25, lon: -74.6, z: 7, why: 'predefined' }; // Northeast Corridor (proposal)
// Initial extent: location known → around it, widened to include the nearest station (NMA-1084, UX to confirm);
// otherwise the most recent station; otherwise a predefined view (proposal). Opening the map never asks for location.
function initialView() {
  if (locKnown()) {
    const p = devicePos(), n = nearbySearch(p).results[0] || STATIONS.filter(s => geoOf(s.code)).map(s => ({ code: s.code, mi: miles(p, geoOf(s.code)) })).sort((a, b) => a.mi - b.mi)[0];
    let z = 13; const g = geoOf(n.code);
    while (z > Z_MIN && (Math.abs(wx(g.lon, z) - wx(p.lon, z)) > MAP_BOX.w / 2 - 36 || Math.abs(wy(g.lat, z) - wy(p.lat, z)) > MAP_BOX.h / 2 - 48)) z--;
    return { lat: p.lat, lon: p.lon, z, why: 'location', nearest: n.code };
  }
  const rec = (D().rec || []).find(x => geoOf(x.c));
  if (rec) { const g = geoOf(rec.c); return { lat: g.lat, lon: g.lon, z: 10, why: 'recent', recent: rec.c }; }
  return Object.assign({}, DEFAULT_VIEW);
}
// Markers for the visible area; markers that would overlap become a group (proposed interaction)
function visibleMarkers(m) {
  const cx = wx(m.lon, m.z), cy = wy(m.lat, m.z), hw = MAP_BOX.w / 2 + 24, hh = MAP_BOX.h / 2 + 24;
  const pts = STATIONS.filter(s => geoOf(s.code)).map(s => { const g = geoOf(s.code); return { s, x: wx(g.lon, m.z) - cx, y: wy(g.lat, m.z) - cy }; }).filter(p => Math.abs(p.x) <= hw && Math.abs(p.y) <= hh);
  const groups = [];
  for (const p of pts) { const g = groups.find(q => Math.hypot(q.x - p.x, q.y - p.y) < 30); if (g) g.items.push(p); else groups.push({ x: p.x, y: p.y, items: [p] }); }
  return groups;
}

// ---------- Selector views: List and Map tabs ----------
function selViewTabs(r) {
  const view = r.u.view || 'list';
  return `<div class="ads-tabs ads-tabs--fill ss-views" role="tablist" aria-label="Station search view">${tabBtn(view === 'list', 'data-a="ss-view" data-v="list" id="ss-tab-list" aria-controls="ss-panel"', `${ic('trip-multiple-train', 'ads-icon--sm')}List`)}${tabBtn(view === 'map', 'data-a="ss-view" data-v="map" id="ss-tab-map" aria-controls="ss-panel"', `${ic('map', 'ads-icon--sm')}Map`)}</div>`;
}
A['ss-view'] = (t, ri) => {
  const r = routeAt(ri), v = t.dataset.v; if (r.u.view === v) return;
  r.u.view = v; r.u.d = r.u.d || {}; r.u.d.q = '';
  if (v === 'map') { r.u.map = r.u.map || initialView(); r.u.mapUsed = true; track('station_search_view_selected', { view: 'map', ...selProps(r) }); track(loc().map === 'fail' ? 'map_load_failed' : 'map_load_succeeded', { zoom: r.u.map.z, initial: r.u.map.why }); }
  else track('station_search_view_selected', { view: 'list', ...selProps(r) });
  pendingFocus = `#ss-tab-${v}`; render();
};
const selProps = r => ({ experience: SEL_NAMES[r.p.ctx || 'ff'], field: r.p.field === 'from' ? 'departure' : 'arrival' });

// ---------- My Location and nearby results (List view) ----------
function nearSection(r, ri) {
  const n = r.u.near || { st: 'idle' }, P = loc().platform;
  ref('1085');
  const myloc = `<div class="ss-myloc">${group('', [grow({ a: 'near-start', icon: 'map-pin', label: 'My Location', value: n.st === 'results' ? 'Update stations near you' : 'Find stations near you', k: 'near-start', cls: 'ss-myloc__row' })])}</div>`;
  let body = '';
  const recovery = (k, msg, acts) => `<div class="ads-alert ads-alert--${k === 'none' ? 'info' : 'warning'} ss-near__msg" role="status" id="near-msg" data-k="${k}">${ic(k === 'none' ? 'info-circle' : 'alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${esc(msg.title)}</p><p class="ads-alert__description ads-body-small">${esc(msg.body)}</p>${acts ? `<div class="ss-near__acts">${acts}</div>` : ''}</div></div>`;
  const btn = (a, label, kind = 'secondary', extra = '') => `<button class="ads-btn ads-btn--${kind}" type="button" data-a="${a}" ${extra}>${label}</button>`;
  if (n.st === 'locating' || n.st === 'loading') body = `<p class="ss-near__busy" role="status">${ic('spinner-static', 'ads-icon--sm')}<span>${n.st === 'locating' ? NEAR_MSG.locating : NEAR_MSG.loading}</span></p>`;
  else if (n.st === 'denied-first') body = recovery('denied-first', NEAR_MSG.deniedFirst, P === 'android' && !n.askedTwice ? btn('near-start', 'Try again', 'secondary', 'data-again="1"') : btn('open-settings', 'Open Settings', 'secondary', 'data-what="app"'));
  else if (n.st === 'denied') body = recovery('denied', NEAR_MSG.denied, btn('open-settings', 'Open Settings', 'secondary', 'data-what="app"'));
  else if (n.st === 'services-off') body = recovery('services-off', { title: NEAR_MSG.servicesOff.title, body: NEAR_MSG.servicesOff[P] }, btn('open-settings', 'Open Settings', 'secondary', 'data-what="device"'));
  else if (n.st === 'unavailable') body = recovery('unavailable', NEAR_MSG.unavailable, btn('near-start', 'Retry'));
  else if (n.st === 'data') body = recovery('data', NEAR_MSG.data, btn('near-start', 'Retry'));
  else if (n.st === 'offline') body = recovery('offline', NEAR_MSG.offline, btn('near-start', 'Retry'));
  else if (n.st === 'none') body = recovery('none', NEAR_MSG.none, btn('near-explore', 'Explore map'));
  else if (n.st === 'results') {
    const approx = n.approx, rows = n.results.map((x, i) => stationRow(ST[x.code], r.p.field, 'near', { mi: x.mi, approx, rank: i + 1 })).join('');
    body = `<p class="ads-sr-only" role="status">${n.results.length} station${n.results.length > 1 ? 's' : ''} within ${n.radius} miles</p><div class="stsection"><div class="ads-stationrow__header"><span>Near you · within ${n.radius} mi</span></div>${approx ? `<p class="ss-near__approx">${ic('info-circle', 'ads-icon--sm')}<span>Your location is approximate, so distances are estimates.</span></p>` : ''}<ul class="stlist" aria-label="Stations near you, closest first">${rows}</ul></div>`;
  }
  if (n.st === 'none') snote('Conflict (NMA-1085): the no-nearby-results scenario asks to zoom out to find a station, but the nearby rule caps the search at 150 miles. The prototype stops at 150 miles and offers Explore map instead of searching further. Needs a decision.');
  if (n.st === 'denied-first' || n.st === 'denied') snote('Follows native OS behavior: iOS can’t ask again after Don’t Allow (Settings only); Android can ask once more, then only Settings. Jira’s re-prompt notes are TBD and conflict with “don’t prompt again”. Needs a product decision.');
  if (n.approx) snote('Approximate location: distances are labelled as estimates. Jira’s approximate-location handling is TBD; this is a proposal.');
  snote('Nearby results: 20 miles, widened by 20 miles only while nothing is found, to a maximum of 150 miles; no result-count limit. Station ineligibility filtering (“Hide Ineligible Stations”) is not applied: Jennifer’s Nov 3 comment moved it to a separate improvement story.');
  snote('Error and status messages for location and nearby search are configurable (NEAR_MSG in stationmap.js).');
  return `<section class="ss-near" aria-label="Stations near you">${myloc}${body}</section>`;
}
// My Location: ask the OS only if permission hasn't been requested; otherwise use what's allowed
A['near-start'] = (t, ri) => {
  const r = routeAt(selIndex()); if (!r) return;
  const n = r.u.near = r.u.near || { st: 'idle' }, L = loc();
  if (t && t.dataset && t.dataset.again) n.askedTwice = true;
  track('nearby_search_started', selProps(r));
  if (V().net === 'offline') { n.st = 'offline'; pendingFocus = '#near-msg'; render(); return; }
  if (L.device === 'off') { n.st = 'services-off'; track('location_services_disabled', {}); pendingFocus = '#near-msg'; render(); return; }
  if (L.perm === 'denied' && !(t && t.dataset && t.dataset.again)) { n.st = 'denied'; track('location_permission_denied', { when: 'previously' }); pendingFocus = '#near-msg'; render(); return; }
  if (L.perm === 'ask' || (t && t.dataset && t.dataset.again)) { nativePerm(granted => { if (granted) nearLocate(r); else { n.st = L.platform === 'android' && !n.askedTwice ? 'denied-first' : (n.askedTwice ? 'denied' : 'denied-first'); pendingFocus = '#near-msg'; render(); } }); return; }
  nearLocate(r);
};
function nearLocate(r) {
  const n = r.u.near; n.st = 'locating'; render();
  const token = n.token = Math.random();
  setTimeout(() => {
    if (n.token !== token) return;
    if (loc().device === 'fail') { n.st = 'unavailable'; track('gps_location_failed', {}); pendingFocus = '#near-msg'; render(); return; }
    n.st = 'loading'; render();
    setTimeout(() => {
      if (n.token !== token) return;
      if (V().net === 'offline') { n.st = 'offline'; pendingFocus = '#near-msg'; render(); return; }
      if (loc().data === 'fail') { n.st = 'data'; track('nearby_results_failed', {}); pendingFocus = '#near-msg'; render(); return; }
      const p = devicePos(), res = nearbySearch(p);
      if (!res.results.length) { n.st = 'none'; track('nearby_no_results', { max_radius_mi: 150 }); pendingFocus = '#near-msg'; render(); return; }
      Object.assign(n, { st: 'results', results: res.results, radius: res.radius, approx: p.approx });
      track('nearby_results_loaded', { radius_mi: res.radius, count: res.results.length, precision: p.approx ? 'approximate' : 'precise' });
      pendingFocus = '.ss-near .stlist .ads-stationrow__select'; render();
    }, 700);
  }, 800);
}
A['near-explore'] = (t, ri) => {
  const r = routeAt(selIndex()), p = locKnown() ? devicePos() : null;
  r.u.view = 'map'; r.u.mapUsed = true; r.u.map = p ? { lat: p.lat, lon: p.lon, z: 6, why: 'explore' } : initialView();
  track('station_search_view_selected', { view: 'map', from: 'no_nearby_results', ...selProps(r) });
  pendingFocus = '#ss-map'; render();
};

// ---------- Native permission and Settings (simulated OS UI, not ADS) ----------
function nativePerm(done) {
  const L = loc(); track('location_permission_prompted', { platform: L.platform });
  nav().native = { kind: 'perm', platform: L.platform, precise: true, done };
  pendingFocus = '.native [data-native]'; render();
}
A['native-precise'] = () => { const o = nav().native; o.precise = !o.precise; pendingFocus = '[data-a="native-precise"]'; render(); };
A['native-perm'] = t => {
  const o = nav().native, v = t.dataset.v, L = loc(); nav().native = null;
  if (v === 'deny') { L.perm = 'denied'; track('location_permission_denied', { when: 'first_request', platform: L.platform }); o.done(false); return; }
  L.perm = v === 'once' ? 'once' : (o.precise ? 'precise' : 'approx');
  track('location_permission_granted', { scope: v === 'once' ? 'this_session' : 'while_using', precision: o.precise ? 'precise' : 'approximate', platform: L.platform });
  o.done(true);
};
A['open-settings'] = t => { nav().native = { kind: 'settings', what: t.dataset.what, platform: loc().platform }; track('location_settings_opened', { what: t.dataset.what }); pendingFocus = '.native [data-native]'; render(); };
A['native-settings'] = t => {
  const v = t.dataset.v, L = loc(), what = nav().native.what; nav().native = null;
  if (what === 'device' && v === 'on') L.device = 'on';
  if (what === 'app' && v !== 'keep') L.perm = v;
  const r = selRoute();
  if (r && r.u.near && (what === 'device' ? L.device === 'on' : locGranted())) { track('location_enabled_in_settings', { what }); A['near-start'](null); return; } // back in the app with access: carry on
  pendingFocus = '#near-msg, [data-a="near-start"]'; render();
};
function renderNative(o) {
  const and = o.platform === 'android';
  if (o.kind === 'perm') {
    if (and) return `<div class="native native--android" role="alertdialog" aria-modal="true" aria-labelledby="nat-t"><div class="native__card">${ic('map-pin')}<p class="native__title" id="nat-t">Allow <b>Amtrak</b> to access this device’s location?</p><div class="native__acc" role="radiogroup" aria-label="Location accuracy"><button type="button" role="radio" aria-checked="${o.precise}" data-a="native-precise" class="native__acc-opt${o.precise ? ' is-on' : ''}">Precise</button><button type="button" role="radio" aria-checked="${!o.precise}" data-a="native-precise" class="native__acc-opt${!o.precise ? ' is-on' : ''}">Approximate</button></div><button type="button" data-a="native-perm" data-native data-v="while">While using the app</button><button type="button" data-a="native-perm" data-native data-v="once">Only this time</button><button type="button" data-a="native-perm" data-native data-v="deny">Don’t allow</button></div></div>`;
    return `<div class="native native--ios" role="alertdialog" aria-modal="true" aria-labelledby="nat-t" aria-describedby="nat-b"><div class="native__card"><p class="native__title" id="nat-t">Allow “Amtrak” to use your location?</p><p class="native__body" id="nat-b">Amtrak uses your location to show stations near you.</p><div class="native__map" aria-hidden="true">${ic('map-pin')}</div><button type="button" class="native__toggle" data-a="native-precise" role="switch" aria-checked="${o.precise}">Precise: ${o.precise ? 'On' : 'Off'}</button><button type="button" data-a="native-perm" data-native data-v="once">Allow Once</button><button type="button" data-a="native-perm" data-native data-v="while">Allow While Using App</button><button type="button" data-a="native-perm" data-native data-v="deny">Don’t Allow</button></div></div>`;
  }
  const rows = o.what === 'device'
    ? [['on', and ? 'Use location: On' : 'Location Services: On'], ['keep', 'Leave off']]
    : and ? [['precise', 'Allow only while using the app (precise)'], ['approx', 'Allow only while using the app (approximate)'], ['ask', 'Ask every time'], ['keep', 'Don’t allow']]
      : [['ask', 'Ask Next Time Or When I Share'], ['precise', 'While Using the App (Precise on)'], ['approx', 'While Using the App (Precise off)'], ['keep', 'Never']];
  return `<div class="native native--settings native--${and ? 'android' : 'ios'}" role="dialog" aria-modal="true" aria-labelledby="nat-t"><div class="native__card"><p class="native__eyebrow">${and ? 'Android Settings' : 'iOS Settings'} (simulated)</p><p class="native__title" id="nat-t">${o.what === 'device' ? (and ? 'Location' : 'Location Services') : (and ? 'Amtrak › Permissions › Location' : 'Amtrak › Location')}</p>${rows.map(([v, l]) => `<button type="button" data-a="native-settings" data-native data-v="${v}">${l}</button>`).join('')}</div></div>`;
}

// ---------- Map view (NMA-1084) ----------
function mapView(r, ri, field) {
  ref('1084');
  r.u.map = r.u.map || initialView();
  const m = r.u.map, sel = r.u.mapSel, groups = visibleMarkers(m), off = V().net === 'offline';
  if (m.why === 'location') snote('Initial map extent widened to include the nearest station around your location (NMA-1084: requested, flagged for UX confirmation).');
  if (m.why === 'recent') snote(`Without location: the map starts on your most recent station (${m.recent}). Proposal awaiting confirmation.`);
  if (m.why === 'predefined') snote('Without location or recents: the map starts on a predefined Northeast Corridor view. Proposal awaiting confirmation.');
  snote('Conflict (NMA-1084): older Jira notes say GPS is required to render the map; the acceptance criteria allow manual browsing without GPS. The prototype follows the acceptance criteria. Needs confirmation.');
  snote('Map tiles are a placeholder drawing; production uses the platform map SDK. Markers come from station data for the visible area, not a fixed radius.');
  snote('Closely spaced stations: markers that would overlap become a numbered group. Tapping it zooms in and lists the stations so each can be chosen (proposed interaction, awaiting review).');
  if (loc().map === 'fail') return `<div class="ss-map ss-map--fail" id="ss-panel" role="tabpanel" aria-labelledby="ss-tab-map"><div class="ads-alert ads-alert--warning" role="status" id="map-msg">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${esc(NEAR_MSG.mapFail.title)}</p><p class="ads-alert__description ads-body-small">${esc(NEAR_MSG.mapFail.body)}</p><div class="ss-near__acts"><button class="ads-btn ads-btn--secondary" type="button" data-a="map-retry">Retry</button><button class="ads-btn ads-btn--tertiary" type="button" data-a="ss-view" data-v="list">Use the list</button></div></div></div></div>`;
  const cx = wx(m.lon, m.z), cy = wy(m.lat, m.z);
  const px = (lat, lon) => [wx(lon, m.z) - cx, wy(lat, m.z) - cy];
  // Placeholder map drawing: grid and rail corridors
  const lines = RAIL_LINES.filter(l => l.length > 1).map(l => `<polyline points="${l.filter(c => geoOf(c)).map(c => { const g = geoOf(c), [x, y] = px(g.lat, g.lon); return `${(x).toFixed(1)},${(y).toFixed(1)}`; }).join(' ')}"/>`).join('');
  const step = TILE / 2, ox = ((-cx % step) + step) % step, oy = ((-cy % step) + step) % step;
  const grid = `<pattern id="mapgrid" width="${step}" height="${step}" patternUnits="userSpaceOnUse" x="${ox}" y="${oy}"><path d="M ${step} 0 L 0 0 0 ${step}"/></pattern>`;
  const me = locKnown() ? (() => { const p = devicePos(), [x, y] = px(p.lat, p.lon), rad = Math.max(8, p.acc / 69 * TILE * 2 ** m.z / 360 * 1.3); return `<div class="map-me${p.approx ? ' map-me--approx' : ''}" style="left:calc(50% + ${x.toFixed(1)}px);top:calc(50% + ${y.toFixed(1)}px);--acc:${Math.min(rad, 220).toFixed(0)}px" role="img" aria-label="Your location${p.approx ? ', approximate' : ''}"></div>`; })() : '';
  const pos = locKnown() ? devicePos() : null;
  const markers = groups.sort((a, b) => a.y - b.y || a.x - b.x).map(g => {
    if (g.items.length > 1) {
      const names = g.items.map(p => `${p.s.city}, ${p.s.st} (${p.s.code})`).join('; ');
      return `<button class="map-group" type="button" data-a="map-group" data-codes="${g.items.map(p => p.s.code).join(',')}" style="left:calc(50% + ${g.x.toFixed(1)}px);top:calc(50% + ${g.y.toFixed(1)}px)" aria-label="${g.items.length} stations close together: ${esc(names)}. Zoom in and list them">${g.items.length}</button>`;
    }
    const s = g.items[0].s, t = STATION_TYPES[geoOf(s.code).type], on = sel === s.code, dist = pos ? `, ${spokenMi(miles(pos, geoOf(s.code)), pos.approx)}` : '';
    return `<button class="map-pin${on ? ' is-selected' : ''}" type="button" data-a="map-pin" data-code="${s.code}" aria-pressed="${on}" style="left:calc(50% + ${g.x.toFixed(1)}px);top:calc(50% + ${g.y.toFixed(1)}px)" aria-label="${esc(`${s.city}, ${s.st}, ${s.name}. ${t.label}${dist}`)}">${ic(t.icon, 'map-pin__glyph')}${on ? `<span class="map-pin__tag">${ic('check', 'ads-icon--sm')}${s.code}</span>` : `<span class="map-pin__code" aria-hidden="true">${s.code}</span>`}</button>`;
  }).join('');
  const inView = groups.reduce((a, g) => a + g.items.length, 0);
  const card = sel ? stationCard(sel, r, ri, pos) : (r.u.mapGroup ? groupCard(r) : '');
  return `<div class="ss-map-wrap" id="ss-panel" role="tabpanel" aria-labelledby="ss-tab-map">${off ? `<p class="ss-map__offline" role="status">${ic('alert-triangle', 'ads-icon--sm')}<span>${esc(NEAR_MSG.mapOffline)}</span></p>` : ''}
    <div class="ss-map" id="ss-map" tabindex="0" role="application" aria-roledescription="map" aria-label="Station map, zoom ${m.z}. ${inView} station${inView === 1 ? '' : 's'} in view. Use the arrow keys to move the map and plus or minus to zoom." aria-describedby="ss-map-count">
      <div class="map-layer"><svg class="map-art" aria-hidden="true" width="100%" height="100%"><defs>${grid}</defs><rect width="100%" height="100%" fill="url(#mapgrid)"/><g class="map-rail" transform="translate(${(MAP_BOX.w / 2).toFixed(1)} ${(MAP_BOX.h / 2).toFixed(1)})">${lines}</g></svg>${me}${markers}</div>
      <div class="map-ctl"><button class="ads-btn ads-btn--secondary ads-btn--icon-only" type="button" data-a="map-zoom" data-d="1" aria-label="Zoom in" ${m.z >= Z_MAX ? 'disabled' : ''}>${ic('plus')}</button><button class="ads-btn ads-btn--secondary ads-btn--icon-only" type="button" data-a="map-zoom" data-d="-1" aria-label="Zoom out" ${m.z <= Z_MIN ? 'disabled' : ''}>${ic('minus')}</button><button class="ads-btn ads-btn--secondary ads-btn--icon-only" type="button" data-a="map-locate" aria-label="${locKnown() ? 'Center the map on your location' : 'Show my location on the map'}">${ic('map-pin')}</button></div>
    </div>
    <p class="ss-map__count" id="ss-map-count" role="status">${inView ? `${inView} station${inView === 1 ? '' : 's'} in view` : 'No stations in this area. Zoom out or move the map.'}</p>${card}</div>`;
}
function stationCard(code, r, ri, pos) {
  const s = ST[code], g = geoOf(code), t = STATION_TYPES[g.type], f = r.p.field;
  const dist = pos ? `<span class="map-card__dist">${fmtMi(miles(pos, g), pos.approx)}</span>` : '';
  return `<section class="map-card ads-card" aria-labelledby="map-card-t" id="map-card"><div class="map-card__head"><div class="map-card__type">${ic(t.icon)}</div><div class="map-card__text"><h3 class="map-card__title" id="map-card-t" tabindex="-1">${esc(s.city)}, ${s.st} <span class="map-card__code">${s.code}</span></h3><p class="map-card__name">${esc(s.name)}</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="map-unselect" aria-label="Close station information">${ic('close')}</button></div>
    <dl class="map-card__dl"><dt>Type</dt><dd>${t.label}</dd><dt>Address</dt><dd>${esc(g.address)}</dd>${dist ? `<dt>Distance</dt><dd>${dist}</dd>` : ''}</dl>
    <div class="map-card__acts"><button class="ads-btn ads-btn--secondary" type="button" data-a="map-details" data-code="${code}" aria-label="Details for ${esc(s.city)}, ${esc(s.name)}">Details</button><button class="ads-btn" type="button" data-a="choose-station" data-code="${code}" data-field="${f}" data-k="map-select" aria-label="Select ${esc(s.city)}, ${esc(s.name)} as your ${f === 'from' ? 'departure' : 'arrival'} station">Select</button></div></section>`;
}
function groupCard(r) {
  const codes = r.u.mapGroup;
  return `<section class="map-card ads-card" aria-labelledby="map-card-t" id="map-card"><div class="map-card__head"><div class="map-card__text"><h3 class="map-card__title" id="map-card-t" tabindex="-1">${codes.length} stations here</h3><p class="map-card__name">Choose one to see its information.</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="map-unselect" aria-label="Close station list">${ic('close')}</button></div>${group('', codes.map(c => grow({ a: 'map-pin', data: `data-code="${c}"`, icon: STATION_TYPES[geoOf(c).type].icon, label: `${ST[c].city}, ${ST[c].st}`, value: ST[c].name })))}</section>`;
}
// Interactions: select a marker (tentative), group, zoom, pan, locate, details
A['map-pin'] = (t, ri) => {
  const r = routeAt(selIndex()), c = t.dataset.code, prev = r.u.mapSel;
  r.u.mapSel = c; r.u.mapGroup = null;
  track('map_marker_selected', { code: c, replaced: prev && prev !== c ? prev : '' });
  pendingFocus = '#map-card-t'; render();
};
A['map-group'] = (t, ri) => {
  const r = routeAt(selIndex()), codes = t.dataset.codes.split(','), m = r.u.map;
  const g = codes.map(geoOf), lat = g.reduce((a, x) => a + x.lat, 0) / g.length, lon = g.reduce((a, x) => a + x.lon, 0) / g.length;
  Object.assign(m, { lat, lon, z: Math.min(Z_MAX, m.z + 2) }); r.u.mapSel = null; r.u.mapGroup = codes;
  track('map_zoomed', { zoom: m.z, via: 'group' }); pendingFocus = '#map-card-t'; render();
};
A['map-unselect'] = () => { const r = routeAt(selIndex()); r.u.mapSel = null; r.u.mapGroup = null; pendingFocus = '#ss-map'; render(); };
A['map-zoom'] = t => { const r = routeAt(selIndex()), m = r.u.map; m.z = Math.max(Z_MIN, Math.min(Z_MAX, m.z + (+t.dataset.d))); track('map_zoomed', { zoom: m.z, via: 'button' }); pendingFocus = `[data-a="map-zoom"][data-d="${t.dataset.d}"]:not(:disabled), #ss-map`; render(); };
A['map-retry'] = () => { loc().map = 'ok'; track('map_load_succeeded', { retry: 1 }); pendingFocus = '#ss-map'; render(); };
A['map-locate'] = t => {
  const r = routeAt(selIndex());
  const center = () => { const p = devicePos(); Object.assign(r.u.map, { lat: p.lat, lon: p.lon, z: Math.max(r.u.map.z, 11) }); track('map_centered_on_location', {}); pendingFocus = '[data-a="map-locate"]'; render(); };
  if (locKnown()) return center();
  // Asking only happens here, because the person asked to see their location; opening the map never asks
  const L = loc();
  if (L.device === 'off') { dialog({ title: NEAR_MSG.servicesOff.title, body: esc(NEAR_MSG.servicesOff[L.platform]), actions: [['Not now', 'secondary', null], ['Open Settings', 'primary', () => A['open-settings']({ dataset: { what: 'device' } })]], returnFocus: '[data-a="map-locate"]' }); return; }
  if (L.perm === 'denied') { dialog({ title: NEAR_MSG.denied.title, body: esc(NEAR_MSG.denied.body), actions: [['Not now', 'secondary', null], ['Open Settings', 'primary', () => A['open-settings']({ dataset: { what: 'app' } })]], returnFocus: '[data-a="map-locate"]' }); return; }
  nativePerm(ok => { if (ok && locKnown()) center(); else { pendingFocus = '[data-a="map-locate"]'; render(); } });
};
A['map-details'] = t => { const r = routeAt(selIndex()); track('map_station_details_opened', { code: t.dataset.code }); push('station-detail', { code: t.dataset.code, field: r.p.field }, selIndex()); };
// Pan by dragging; keyboard arrows and +/- for the map region; wheel zoom
let DRAG = null, SUPPRESS_CLICK = false;
// A drag can start anywhere on the map, markers included; it only becomes a pan once the pointer moves, so a tap
// on a marker still selects it
document.addEventListener('pointerdown', e => {
  const map = e.target.closest && e.target.closest('#device .ss-map'); if (!map || e.target.closest('.map-ctl')) return;
  DRAG = { x: e.clientX, y: e.clientY, id: e.pointerId, map, layer: map.querySelector('.map-layer'), moved: false, scale: map.getBoundingClientRect().width / map.offsetWidth };
});
document.addEventListener('pointermove', e => {
  if (!DRAG) return; const dx = (e.clientX - DRAG.x) / DRAG.scale, dy = (e.clientY - DRAG.y) / DRAG.scale;
  if (!DRAG.moved && Math.hypot(dx, dy) > 4) { DRAG.moved = true; try { DRAG.map.setPointerCapture(DRAG.id); } catch (err) {} }
  if (DRAG.moved) { DRAG.layer.style.transform = `translate(${dx}px, ${dy}px)`; DRAG.dx = dx; DRAG.dy = dy; }
});
document.addEventListener('pointerup', () => { if (!DRAG) return; const d = DRAG; DRAG = null; if (d.moved) { SUPPRESS_CLICK = true; setTimeout(() => { SUPPRESS_CLICK = false; }, 0); mapPanBy(-d.dx, -d.dy, 'drag'); } });
document.addEventListener('click', e => { if (SUPPRESS_CLICK && e.target.closest && e.target.closest('#device .ss-map')) { e.stopPropagation(); e.preventDefault(); SUPPRESS_CLICK = false; } }, true);
function mapPanBy(dx, dy, via) {
  const r = routeAt(selIndex()); if (!r || !r.u.map) return; const m = r.u.map;
  const x = wx(m.lon, m.z) + dx, y = wy(m.lat, m.z) + dy; m.lon = unx(x, m.z); m.lat = Math.max(-80, Math.min(80, uny(y, m.z))); m.why = 'moved';
  track('map_panned', { via, zoom: m.z }); pendingFocus = via === 'key' ? '#ss-map' : null; render();
}
document.addEventListener('keydown', e => {
  const map = e.target.id === 'ss-map' && e.target.closest('#device'); if (!map) return;
  const k = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] }[e.key];
  if (k) { e.preventDefault(); mapPanBy(k[0], k[1], 'key'); return; }
  if (e.key === '+' || e.key === '=' || e.key === '-') { e.preventDefault(); const r = routeAt(selIndex()), m = r.u.map; m.z = Math.max(Z_MIN, Math.min(Z_MAX, m.z + (e.key === '-' ? -1 : 1))); track('map_zoomed', { zoom: m.z, via: 'key' }); pendingFocus = '#ss-map'; render(); }
});
let WHEEL_T = 0;
document.addEventListener('wheel', e => {
  const map = e.target.closest && e.target.closest('#device .ss-map'); if (!map) return; e.preventDefault();
  const now = performance.now(); if (now - WHEEL_T < 180) return; WHEEL_T = now;
  const r = routeAt(selIndex()), m = r.u.map; m.z = Math.max(Z_MIN, Math.min(Z_MAX, m.z + (e.deltaY < 0 ? 1 : -1))); track('map_zoomed', { zoom: m.z, via: 'pinch_or_wheel' }); render();
}, { passive: false });

// ---------- Station details (from the map) ----------
SCR['station-detail'] = (r, ri) => {
  const s = ST[r.p.code], g = geoOf(r.p.code), t = STATION_TYPES[g.type], f = r.p.field;
  ref('1084');
  const pos = locKnown() ? devicePos() : null;
  const body = `<div class="sd-body" tabindex="0" role="region" aria-label="Station information for ${esc(s.city)}, ${esc(s.name)}"><div class="sd-head"><div class="map-card__type">${ic(t.icon)}</div><div><p class="sd-name">${esc(s.name)}</p><p class="ads-body-small ads-text-secondary">${esc(s.city)}, ${esc(s.state)} · ${s.code}</p></div></div>
    ${group('Station', [grow({ label: 'Type', value: t.label }), grow({ label: 'Address', value: esc(g.address) }), ...(pos ? [grow({ label: 'Distance', value: fmtMi(miles(pos, g), pos.approx) })] : []), ...(s.tag ? [grow({ label: 'Service', value: `${s.tag} only` })] : [])])}
    ${g.parking ? group('Parking', [grow({ icon: 'parking', label: 'Parking', value: esc(g.parking) })]) : ''}
    <div class="info-pending"><b>Hours, accessibility and amenities</b><span>Content pending</span></div>${snote('Station details content (hours, accessibility, amenities) belongs to the station details page (NMA-604), outside Sprint 4. Parking and address are sample data.')}</div>`;
  return { title: `${s.city}, ${s.st}`, kind: 'push', banner: false, body, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="choose-station" data-code="${s.code}" data-field="${f}" data-k="detail-select" aria-label="Select ${esc(s.city)}, ${esc(s.name)} as your ${f === 'from' ? 'departure' : 'arrival'} station">Select</button>` };
};

// ---------- Shared selector: open from any experience; commit only the originating field ----------
function selNotes(ctx) {
  snote('Shared station selector: it returns to the experience and field that opened it after one station is chosen (it no longer moves on to the other field). Backing out or closing keeps the fields as they were.');
  if (ctx === 'ff') snote('Conflict: Auto Train validation (existing) still sets or clears the other end when Lorton or Sanford is chosen, which changes the other field. Kept as an existing rule; needs a decision.');
  snote('Not added: Profile › My Stations and More › Stations entry points (awaiting confirmation in Jira).');
}
A['sel-open'] = t => {
  const ctx = t.dataset.ctx, f = t.dataset.field;
  if (ctx === 'ts') openSheet('stations-ts', [R('stations', { field: f, ctx: 'ts' })], `[data-a="sel-open"][data-ctx="ts"][data-field="${f}"]`);
  else push('stations', { field: f, ctx }, sheet() ? sheet().stack.length - 1 : 0);
  track('station_search_opened', { experience: SEL_NAMES[ctx], field: f === 'from' ? 'departure' : 'arrival' });
};
// A station field for Train status and Multi-Ride: the same Text Input station field as New booking
function selField(ctx, f) {
  const v = selTarget(ctx)[f], s = v && ST[v], label = f === 'from' ? 'From' : 'To';
  return fieldWrap(`ads-routefield__${f}`, label, `<button class="ads-fieldbtn ads-routefield__half" type="button" data-a="sel-open" data-ctx="${ctx}" data-field="${f}" id="${ctx}-${f}" aria-label="${label}: ${s ? `${s.city}, ${s.name}` : 'not chosen'}">${s ? `<span class="ads-routefield__code">${v}</span><span class="ads-routefield__body"><span class="ads-routefield__city">${s.city}, ${s.st}</span><span class="ads-routefield__station">${s.name}</span></span>` : `<span class="ads-routefield__body"><span class="ads-routefield__hint">${f === 'from' ? 'Where from?' : 'Where to?'}</span></span>`}</button>`);
}
function selRouteFields(ctx) { return `<div class="ads-routefield ads-routefield--noswap">${selField(ctx, 'from')}${selField(ctx, 'to')}</div>`; }
// Train status tab: station search reuses the shared selector
TABS['train-status'] = () => {
  ref('1084', '1085');
  return `<div class="tabpage ts-page"><h1 class="ads-h3">Train status</h1><section class="ts-form" aria-label="Train status by station">${selRouteFields('ts')}<button class="ads-btn ads-btn--block" type="button" data-a="ts-check">Check status</button></section><p class="ts-or ads-body-small ads-text-secondary">Or search by train number</p><div class="ads-field"><label class="ads-field__label" for="tsn">Train number</label><div class="ads-control"><input id="tsn" inputmode="numeric" placeholder="e.g. 171"></div></div>${snote('Train status results are outside Sprint 4; only the shared station search is demonstrated here.')}</div>`;
};
A['ts-check'] = () => openSheet('explore', [R('sel-stub', { t: 'Train status', ctx: 'ts' })], '[data-a="ts-check"]');
// Multi-Ride (Book › Passes): station search reuses the shared selector
SCR.multiride = (r, ri) => {
  ref('1084', '1085');
  return { title: 'Multi-Ride', kind: 'root', banner: false, body: `<p class="ads-body-small ads-text-secondary">Choose the route for your Multi-Ride ticket.</p>${selRouteFields('mr')}${snote('Multi-Ride purchase is outside Sprint 4; this entry demonstrates the shared station search from Book › Passes.')}`, foot: `<button class="ads-btn ads-btn--block" type="button" data-a="mr-find">Find Multi-Ride tickets</button>` };
};
A['mr-find'] = (t, ri) => push('sel-stub', { t: 'Multi-Ride tickets', ctx: 'mr' }, +ri);
A['bk-passes'] = () => openSheet('mr', [R('multiride')], '[data-a="bk-passes"]');
SCR['sel-stub'] = r => { const tg = selTarget(r.p.ctx); return { title: r.p.t, kind: 'push', banner: false, body: `<div class="ads-summary"><p class="ads-summary__title">${tg.from ? `${ST[tg.from].city} → ` : ''}${tg.to ? ST[tg.to].city : 'Choose both stations'}</p><p class="ads-body-small">Content pending</p></div>${snote(`${r.p.t} results are outside Sprint 4.`)}` }; };

// ---------- Leaving the selector without choosing: abandonment (analytics) ----------
let SEL_SEEN = null;
const renderBeforeStationMap = render;
render = function () {
  renderBeforeStationMap.apply(this, arguments);
  const r = selRoute();
  if (SEL_SEEN && SEL_SEEN !== r && !SEL_SEEN.u.committed) track(SEL_SEEN.u.mapUsed ? 'map_abandoned' : 'station_search_abandoned', { view: SEL_SEEN.u.view || 'list', tentative: SEL_SEEN.u.mapSel || '', ...selProps(SEL_SEEN) });
  SEL_SEEN = r;
  const map = document.querySelector('#device .ss-map');
  if (map && (Math.abs(map.offsetWidth - MAP_BOX.w) > 2 || Math.abs(map.offsetHeight - MAP_BOX.h) > 2)) { MAP_BOX = { w: map.offsetWidth, h: map.offsetHeight }; setTimeout(render, 0); }
  syncLocCtl(); renderAnalytics();
};

// ---------- Reviewer controls › Location ----------
function syncLocCtl() {
  const L = loc(); [['tbPlatform', 'platform'], ['tbPerm', 'perm'], ['tbLocDev', 'device'], ['tbPlace', 'place'], ['tbNearData', 'data'], ['tbMapTiles', 'map']].forEach(([id, k]) => { const el = document.getElementById(id); if (el && el.value !== L[k]) el.value = L[k]; });
}
(function wireLocCtl() {
  const place = document.getElementById('tbPlace'); if (place) place.innerHTML = Object.entries(PLACES).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('');
  [['tbPlatform', 'platform'], ['tbPerm', 'perm'], ['tbLocDev', 'device'], ['tbPlace', 'place'], ['tbNearData', 'data'], ['tbMapTiles', 'map']].forEach(([id, k]) => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('change', () => { loc()[k] = el.value; render(); });
  });
})();
