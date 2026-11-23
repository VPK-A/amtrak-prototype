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
  MTR: [45.5000, -73.5664, 'building', '895 De la Gauchetière St W, Montreal, QC H3B 4G1'],
  TWO: [43.6453, -79.3806, 'building', '65 Front St W, Toronto, ON M5J 1E6'],
  VAC: [49.2733, -123.0981, 'building', '1150 Station St, Vancouver, BC V6A 4C7', 'Paid parking at the station.'],
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
const validLatLon = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
const geoOf = c => { const g = STATION_GEO[c]; return g && validLatLon(g[0], g[1]) ? { lat: g[0], lon: g[1], type: g[2] in STATION_TYPES ? g[2] : 'building', address: g[3], parking: g[4] || '' } : null; };
// Stations that can't be placed on the map (missing or invalid coordinates). They stay in search and the list.
const geoIssues = () => STATIONS.filter(s => !geoOf(s.code)).map(s => s.code);
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
// One marker (a station or a numbered group of close stations). placed: absolutely positioned on the placeholder
// drawing; the Google surface positions markers itself.
function markerHtml(g, sel, pos, placed) {
  const at = placed ? ` style="left:calc(50% + ${g.x.toFixed(1)}px);top:calc(50% + ${g.y.toFixed(1)}px)"` : '';
  if (g.items.length > 1) {
    const names = g.items.map(p => `${p.s.city}, ${p.s.st} (${p.s.code})`).join('; ');
    return `<button class="map-group" type="button" data-a="map-group" data-codes="${g.items.map(p => p.s.code).join(',')}"${at} aria-label="${g.items.length} stations close together: ${esc(names)}. Zoom in and list them">${g.items.length}</button>`;
  }
  const s = g.items[0].s, t = STATION_TYPES[geoOf(s.code).type], on = sel === s.code, dist = pos ? `, ${spokenMi(miles(pos, geoOf(s.code)), pos.approx)}` : '';
  // Station badge (Figma 3336:40155): a 36px disc with the station icon; the chosen one is tinted with a focus-blue edge
  return `<button class="map-pin${on ? ' is-selected' : ''}" type="button" data-a="map-pin" data-code="${s.code}" aria-pressed="${on}"${at} aria-label="${esc(`${s.city}, ${s.st} ${s.code}, ${s.name}. ${t.label}${dist}`)}">${ic(t.icon, 'map-pin__glyph')}</button>`;
}
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
  return `<div class="ads-tabs ads-tabs--fill ss-views" role="tablist" aria-label="Station search view">${tabBtn(view === 'list', 'data-a="ss-view" data-v="list" id="ss-tab-list" aria-controls="ss-panel"', 'List')}${tabBtn(view === 'map', 'data-a="ss-view" data-v="map" id="ss-tab-map" aria-controls="ss-panel"', 'Map')}</div>`;
}
A['ss-view'] = (t, ri) => {
  const r = routeAt(ri), v = t.dataset.v; if (r.u.view === v) return;
  r.u.view = v; r.u.d = r.u.d || {}; r.u.d.q = '';
  if (v === 'map') { r.u.map = r.u.map || initialView(); r.u.mapUsed = true; track('station_search_view_selected', { view: 'map', ...selProps(r) }); track(loc().map === 'fail' ? 'map_load_failed' : 'map_load_succeeded', { zoom: r.u.map.z, initial: r.u.map.why }); }
  else track('station_search_view_selected', { view: 'list', ...selProps(r) });
  pendingFocus = `#ss-tab-${v}`; render();
};
const selProps = r => ({ experience: SEL_NAMES[r.p.ctx || 'ff'], field: r.p.field === 'from' ? 'departure' : 'arrival' });

// ---------- Nearby results (List view) ----------
const nearKey = () => [loc().place, loc().perm, loc().data].join('|');
function nearSection(r, ri) {
  const n = r.u.near || { st: 'idle' }, P = loc().platform;
  ref('1085');
  // Permission drives the list (Figma 3849:154376, 3849:164332): no "Nearby stations" link. Allowed: nearby stations
  // load on their own. Denied: a dismissible "Location isn't allowed" alert. Not asked yet, or the alert dismissed:
  // the default view. The OS asks for permission at app launch (not simulated here).
  const L = loc();
  if (n.st === 'idle') {
    if (V().net === 'offline' && locGranted()) n.st = 'offline';
    else if (locGranted() && L.device === 'off') n.st = 'services-off';
    else if (locGranted()) {
      const c = V().nearCache, key = nearKey();
      if (c && c.key === key) Object.assign(n, { st: 'results', results: c.results, radius: c.radius, approx: c.approx }); // already found this session
      else { n.st = 'locating'; setTimeout(() => { if (r.u.near === n && n.st === 'locating') nearLocate(r); }, 0); }
    } else if (L.perm === 'denied' && !V().locAlertOff) n.st = 'denied-alert';
  }
  r.u.near = n;
  let body = '';
  const recovery = (k, msg, acts) => `<div class="ads-alert ads-alert--${k === 'none' ? 'info' : 'warning'} ss-near__msg" role="status" id="near-msg" data-k="${k}">${ic(k === 'none' ? 'info-circle' : 'alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${esc(msg.title)}</p><p class="ads-alert__description ads-body-small">${esc(msg.body)}</p>${acts ? `<div class="ss-near__acts">${acts}</div>` : ''}</div></div>`;
  const btn = (a, label, kind = 'secondary', extra = '') => `<button class="ads-btn ads-btn--${kind}" type="button" data-a="${a}" ${extra}>${label}</button>`;
  if (n.st === 'denied-alert') body = `<div class="ads-alert ads-alert--warning ss-localert" role="status" id="near-msg" data-k="denied">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${esc(NEAR_MSG.deniedFirst.title)}</p><p class="ads-alert__description">${esc(NEAR_MSG.deniedFirst.body)}</p><button class="ads-link ads-link--sm linkbtn ss-localert__link" type="button" data-a="open-settings" data-what="app">Open settings</button></div><button class="ads-icon-btn ads-icon-btn--sm ss-localert__close" type="button" data-a="loc-alert-dismiss" aria-label="Dismiss: location isn’t allowed">${ic('close')}</button></div>`;
  else if (n.st === 'locating' || n.st === 'loading') body = `<p class="ss-near__busy" role="status">${ic('spinner-static', 'ads-icon--sm')}<span>${n.st === 'locating' ? NEAR_MSG.locating : NEAR_MSG.loading}</span></p>`;
  else if (n.st === 'denied-first') body = recovery('denied-first', NEAR_MSG.deniedFirst, P === 'android' && !n.askedTwice ? btn('near-start', 'Try again', 'secondary', 'data-again="1"') : btn('open-settings', 'Open Settings', 'secondary', 'data-what="app"'));
  else if (n.st === 'denied') body = recovery('denied', NEAR_MSG.denied, btn('open-settings', 'Open Settings', 'secondary', 'data-what="app"'));
  else if (n.st === 'services-off') body = recovery('services-off', { title: NEAR_MSG.servicesOff.title, body: NEAR_MSG.servicesOff[P] }, btn('open-settings', 'Open Settings', 'secondary', 'data-what="device"'));
  else if (n.st === 'unavailable') body = recovery('unavailable', NEAR_MSG.unavailable, btn('near-start', 'Retry'));
  else if (n.st === 'data') body = recovery('data', NEAR_MSG.data, btn('near-start', 'Retry'));
  else if (n.st === 'offline') body = recovery('offline', NEAR_MSG.offline, btn('near-start', 'Retry'));
  else if (n.st === 'none') body = recovery('none', NEAR_MSG.none, btn('near-explore', 'Explore map'));
  else if (n.st === 'results') {
    const approx = n.approx, rows = n.results.map((x, i) => stationRow(ST[x.code], r.p.field, 'near', { mi: x.mi, approx, rank: i + 1 })).join('');
    body = `<p class="ads-sr-only" role="status">${n.results.length} station${n.results.length > 1 ? 's' : ''} within ${n.radius} miles</p><div class="stsection ss-nearlist"><div class="ads-stationrow__header"><span>Near you · within ${n.radius} mi</span></div>${approx ? `<p class="ss-near__approx">${ic('info-circle', 'ads-icon--sm')}<span>Your location is approximate, so distances are estimates.</span></p>` : ''}<ul class="stlist" aria-label="Stations near you, closest first">${rows}</ul></div>`;
  }
  if (n.st === 'none') snote('Conflict (NMA-1085): the no-nearby-results scenario asks to zoom out to find a station, but the nearby rule caps the search at 150 miles. The prototype stops at 150 miles and offers Explore map instead of searching further. Needs a decision.');
  if (n.st === 'denied-alert') snote('Location denied: the alert can be dismissed (for this session) or Open settings goes to the app’s location settings. If access is still not allowed, the default view shows without the alert.');
  snote('Pattern (Gabby’s feedback): no “Nearby stations” link. If location was allowed at launch, nearby stations show by default; if denied, a dismissible alert; otherwise the default view. Try each with Prototype controls › Location permission.');
  if (n.approx) snote('Approximate location: distances are labelled as estimates. Jira’s approximate-location handling is TBD; this is a proposal.');
  snote('Nearby results: 20 miles, widened by 20 miles only while nothing is found, to a maximum of 150 miles; no result-count limit. Station ineligibility filtering (“Hide Ineligible Stations”) is not applied: Jennifer’s Nov 3 comment moved it to a separate improvement story.');
  snote('Error and status messages for location and nearby search are configurable (NEAR_MSG in stationmap.js).');
  const list = n.st === 'results' ? body : '', msg = n.st === 'results' ? '' : body;
  return `${msg ? `<section class="ss-near" aria-label="Stations near you">${msg}</section>` : ''}<!--near-split-->${list}`; // messages end the selector's top block; nearby results start the list
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
  const n = r.u.near; n.auto = n.st === 'locating';
  if (V().net === 'offline') { n.st = 'offline'; render(); return; } // no connection: say so straight away
  n.st = 'locating'; render();
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
      V().nearCache = { key: nearKey(), results: res.results, radius: res.radius, approx: p.approx };
      track('nearby_results_loaded', { radius_mi: res.radius, count: res.results.length, precision: p.approx ? 'approximate' : 'precise' });
      if (!n.auto) pendingFocus = '.ss-nearlist .ads-stationrow__select'; render(); // loaded on its own: focus stays put
    }, 700);
  }, 800);
}
A['loc-alert-dismiss'] = () => { V().locAlertOff = true; const r = selRoute(); if (r && r.u.near) r.u.near.st = 'idle'; track('location_alert_dismissed', {}); pendingFocus = '#ss-q'; render(); };
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
  if (what === 'app' && r && r.u.near) { // back in the app: allowed shows nearby stations; still denied shows the default view
    if (v === 'keep') V().locAlertOff = true;
    r.u.near = { st: 'idle' }; if (locGranted()) track('location_enabled_in_settings', { what }); pendingFocus = '#ss-q'; render(); return;
  }
  if (r && r.u.near && (what === 'device' ? L.device === 'on' : locGranted())) { track('location_enabled_in_settings', { what }); A['near-start'](null); return; } // back in the app with access: carry on
  pendingFocus = '#near-msg, [data-a="near-start"]'; render();
};
function renderNative(o) {
  const and = o.platform === 'android';
  if (o.kind === 'perm') {
    if (and) return `<div class="native native--android" role="alertdialog" aria-modal="true" aria-labelledby="nat-t"><div class="native__card">${ic('map-pin')}<p class="native__title" id="nat-t">Allow <b>Amtrak</b> to access this device’s location?</p><div class="native__acc" role="radiogroup" aria-label="Location accuracy"><button type="button" role="radio" aria-checked="${o.precise}" data-a="native-precise" class="native__acc-opt${o.precise ? ' is-on' : ''}">Precise</button><button type="button" role="radio" aria-checked="${!o.precise}" data-a="native-precise" class="native__acc-opt${!o.precise ? ' is-on' : ''}">Approximate</button></div><button type="button" data-a="native-perm" data-native data-v="while">While using the app</button><button type="button" data-a="native-perm" data-native data-v="once">Only this time</button><button type="button" data-a="native-perm" data-native data-v="deny">Don’t allow</button></div></div>`;
    return `<div class="native native--ios" role="alertdialog" aria-modal="true" aria-labelledby="nat-t" aria-describedby="nat-b"><div class="native__card"><p class="native__title" id="nat-t">Allow “Amtrak” to use your location?</p><p class="native__body" id="nat-b">Amtrak uses your location to show stations near you.</p><div class="native__map" aria-hidden="true">${ic('map-pin')}</div><button type="button" class="native__toggle" data-a="native-precise" role="switch" aria-checked="${o.precise}">Precise: ${o.precise ? 'On' : 'Off'}</button><button type="button" data-a="native-perm" data-native data-v="once">Allow Once</button><button type="button" data-a="native-perm" data-native data-v="while">Allow While Using App</button><button type="button" data-a="native-perm" data-native data-v="deny">Don’t Allow</button></div></div>`;
  }
  if (o.what === 'app' && !and) return `<div class="native native--prefs" role="alertdialog" aria-modal="true" aria-labelledby="nat-t"><div class="native__sheet"><p class="native__title" id="nat-t">Amtrak Location Preferences</p>${[['precise', 'Always'], ['precise', 'Only While Using the App'], ['keep', 'Never']].map(([v, l], i) => `<button type="button" data-a="native-settings" data-v="${v}" ${i === 0 ? 'data-native' : ''}>${l}</button>`).join('')}</div></div>`; // Figma 3896:173633 (simulated)
  const rows = o.what === 'device'
    ? [['on', and ? 'Use location: On' : 'Location Services: On'], ['keep', 'Leave off']]
    : and ? [['precise', 'Allow only while using the app (precise)'], ['approx', 'Allow only while using the app (approximate)'], ['ask', 'Ask every time'], ['keep', 'Don’t allow']]
      : [['ask', 'Ask Next Time Or When I Share'], ['precise', 'While Using the App (Precise on)'], ['approx', 'While Using the App (Precise off)'], ['keep', 'Never']];
  return `<div class="native native--settings native--${and ? 'android' : 'ios'}" role="dialog" aria-modal="true" aria-labelledby="nat-t"><div class="native__card"><p class="native__eyebrow">${and ? 'Android Settings' : 'iOS Settings'} (simulated)</p><p class="native__title" id="nat-t">${o.what === 'device' ? (and ? 'Location' : 'Location Services') : (and ? 'Amtrak › Permissions › Location' : 'Amtrak › Location')}</p>${rows.map(([v, l]) => `<button type="button" data-a="native-settings" data-native data-v="${v}">${l}</button>`).join('')}</div></div>`;
}

// ---------- Map view (NMA-1084) ----------
function mapView(r, ri, field) {
  ref('1084');
  r.u.map = r.u.map || initialView(); gmLoad(); gmNotes();
  const m = r.u.map, sel = r.u.mapSel, groups = visibleMarkers(m), off = V().net === 'offline';
  if (m.why === 'location') snote('Initial map extent widened to include the nearest station around your location (NMA-1084: requested, flagged for UX confirmation).');
  if (m.why === 'recent') snote(`Without location: the map starts on your most recent station (${m.recent}). Proposal awaiting confirmation.`);
  if (m.why === 'predefined') snote('Without location or recents: the map starts on a predefined Northeast Corridor view. Proposal awaiting confirmation.');
  snote('Conflict (NMA-1084): older Jira notes say GPS is required to render the map; the acceptance criteria allow manual browsing without GPS. The prototype follows the acceptance criteria. Needs confirmation.');
  if (selPair() && (r.p.ctx || 'ff') !== 'ts') snote('Needs alignment with the user story and Product: after Select on the map, the selector returns to the station list when another station is still needed, or to Fare Finder when From and To are both set.');
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
  const markers = groups.sort((a, b) => a.y - b.y || a.x - b.x).map(g => markerHtml(g, sel, pos, true)).join('');
  const inView = groups.reduce((a, g) => a + g.items.length, 0);
  const card = sel ? stationCard(sel, r, ri, pos) : (r.u.mapGroup ? groupCard(r) : '');
  // Map controls (Figma 3336:40155): zoom in and out in one box, my location in its own; top right
  const ctl = `<div class="map-ctl"><div class="map-ctl__zoom" role="group" aria-label="Zoom"><button class="ads-icon-btn ads-icon-btn--sm map-ctl__btn" type="button" data-a="map-zoom" data-d="1" aria-label="Zoom in" ${m.z >= Z_MAX ? 'disabled' : ''}>${ic('plus')}</button><button class="ads-icon-btn ads-icon-btn--sm map-ctl__btn" type="button" data-a="map-zoom" data-d="-1" aria-label="Zoom out" ${m.z <= Z_MIN ? 'disabled' : ''}>${ic('minus')}</button></div><button class="ads-icon-btn ads-icon-btn--sm map-ctl__btn map-ctl__locate" type="button" data-a="map-locate" aria-label="${locKnown() ? 'Center the map on your location' : 'Show my location on the map'}">${ic('map-pin')}</button></div>`;
  return `<div class="ss-map-wrap ss-map-wrap--upd" id="ss-panel" role="tabpanel" aria-labelledby="ss-tab-map">
    <div class="ss-map${gmActive() ? ' ss-map--google' : ''}" id="ss-map" tabindex="0" role="application" aria-roledescription="map" data-provider="${gmActive() ? 'google' : 'placeholder'}" aria-label="Station map, zoom ${m.z}. ${inView} station${inView === 1 ? '' : 's'} in view. Use the arrow keys to move the map and plus or minus to zoom." aria-describedby="ss-map-count">
      ${gmActive() ? '<div class="gmap-slot"></div>' : `<div class="map-layer"><svg class="map-art" aria-hidden="true" width="100%" height="100%"><defs>${grid}</defs><rect width="100%" height="100%" fill="url(#mapgrid)"/><g class="map-rail" transform="translate(${(MAP_BOX.w / 2).toFixed(1)} ${(MAP_BOX.h / 2).toFixed(1)})">${lines}</g></svg>${me}${markers}</div>`}
      ${ctl}
    </div>
    ${off ? `<p class="ss-map__offline" role="status">${ic('alert-triangle', 'ads-icon--sm')}<span>${esc(NEAR_MSG.mapOffline)}</span></p>` : ''}
    <p class="${inView ? 'ads-sr-only' : 'ss-map__count ss-map__empty'}" id="ss-map-count" role="status">${inView ? `${inView} station${inView === 1 ? '' : 's'} in view` : 'No stations in this area. Zoom out or move the map.'}</p>
    ${card ? `<div class="ss-mapcard${sel ? ' ss-mapcard--listing' : ''}">${card}</div>` : ''}</div>`;
}
// The map's station listing (Figma 3336:40155): code, city and station, with Details (info) and Save (bookmark)
// icon buttons. Select sits in the sheet footer (mapFoot). The same listing serves both selector settings; what
// Select does still follows the setting (From / To: back to the list or Fare Finder; single field: back to where
// the selector was opened).
function stationCard(code, r, ri, pos) {
  const s = ST[code], g = geoOf(code), t = STATION_TYPES[g.type], saved = D().fav.includes(code);
  const dist = pos ? `, ${spokenMi(miles(pos, g), pos.approx)}` : '';
  return `<section class="map-listing" aria-labelledby="map-card-t" id="map-card" aria-describedby="map-card-sr">
    <p class="map-listing__code" aria-hidden="true">${s.code}</p>
    <div class="map-listing__lines"><h3 class="map-listing__city" id="map-card-t" tabindex="-1">${esc(s.city)}, ${s.st}<span class="ads-sr-only"> ${s.code}</span></h3><p class="map-listing__name">${esc(s.name)}</p><p class="ads-sr-only" id="map-card-sr">${t.label}${dist}${r.u.mapAsk ? `. ${esc(r.u.mapAsk)}` : ''}</p></div>
    <div class="map-listing__acts"><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="map-details" data-code="${code}" aria-label="Details for ${esc(s.city)}, ${esc(s.name)}">${ic('info-circle')}</button><button class="ads-icon-btn ads-icon-btn--sm map-listing__save" type="button" data-a="fav" data-code="${code}" aria-pressed="${saved}" aria-label="${saved ? 'Saved' : 'Save'} ${esc(s.city)}, ${esc(s.name)}">${ic(saved ? 'bookmark-filled' : 'bookmark')}</button></div></section>`;
}
// The sheet footer's Select for the station on the map listing (nothing to select until a station is tapped)
function mapFoot(r) {
  if (r.u.view !== 'map' || !r.u.mapSel || loc().map === 'fail') return null;
  const s = ST[r.u.mapSel], f = r.p.field, ctx = r.p.ctx || 'ff';
  return `<button class="ads-btn ads-btn--block" type="button" data-a="choose-station" data-code="${s.code}" data-field="${f}" data-k="map-select" aria-label="Select ${esc(s.city)}, ${esc(s.name)} as your ${ctx === 'ts' ? '' : f === 'from' ? 'departure ' : 'arrival '}station">Select</button>`;
}
function groupCard(r) {
  const codes = r.u.mapGroup;
  return `<section class="map-card ads-card" aria-labelledby="map-card-t" id="map-card"><div class="map-card__head"><div class="map-card__text"><h3 class="map-card__title" id="map-card-t" tabindex="-1">${codes.length} stations here</h3><p class="map-card__name">Choose one to see its information.</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="map-unselect" aria-label="Close station list">${ic('close')}</button></div>${group('', codes.map(c => grow({ a: 'map-pin', data: `data-code="${c}"`, icon: STATION_TYPES[geoOf(c).type].icon, label: `${ST[c].city}, ${ST[c].st}`, value: ST[c].name })))}</section>`;
}
// Interactions: select a marker (tentative), group, zoom, pan, locate, details
A['map-pin'] = (t, ri) => {
  const r = routeAt(selIndex()), c = t.dataset.code, prev = r.u.mapSel;
  if (prev === c && !t.closest('#map-card')) { r.u.mapSel = null; pendingFocus = '#ss-map'; render(); return; } // tapping the highlighted marker again clears it
  r.u.mapSel = c; r.u.mapGroup = null; r.u.mapAsk = null;
  track('map_marker_selected', { code: c, replaced: prev && prev !== c ? prev : '' });
  pendingFocus = '#map-card-t'; render();
};
A['map-group'] = (t, ri) => {
  const r = routeAt(selIndex()), codes = t.dataset.codes.split(','), m = r.u.map;
  const g = codes.map(geoOf), lat = g.reduce((a, x) => a + x.lat, 0) / g.length, lon = g.reduce((a, x) => a + x.lon, 0) / g.length;
  Object.assign(m, { lat, lon, z: Math.min(Z_MAX, m.z + 2) }); r.u.mapSel = null; r.u.mapGroup = codes;
  track('map_zoomed', { zoom: m.z, via: 'group' }); pendingFocus = '#map-card-t'; render();
};
A['map-unselect'] = () => { const r = routeAt(selIndex()); r.u.mapSel = null; r.u.mapGroup = null; r.u.mapJust = null; pendingFocus = '#ss-map'; render(); };
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
  const map = e.target.closest && e.target.closest('#device .ss-map'); if (!map || e.target.closest('.map-ctl') || map.classList.contains('ss-map--google')) return;
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
// Escape on the map or its station panel clears the highlight (the panel has no close button); otherwise Escape goes Back
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !e.target.closest || !e.target.closest('#device #ss-map, #device #map-card')) return;
  const r = selIndex() >= 0 ? routeAt(selIndex()) : null; if (!r || !(r.u.mapSel || r.u.mapGroup)) return;
  e.preventDefault(); e.stopPropagation(); A['map-unselect']();
}, true);
document.addEventListener('keydown', e => {
  const map = e.target.id === 'ss-map' && e.target.closest('#device'); if (!map) return;
  const k = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] }[e.key];
  if (k) { e.preventDefault(); mapPanBy(k[0], k[1], 'key'); return; }
  if (e.key === '+' || e.key === '=' || e.key === '-') { e.preventDefault(); const r = routeAt(selIndex()), m = r.u.map; m.z = Math.max(Z_MIN, Math.min(Z_MAX, m.z + (e.key === '-' ? -1 : 1))); track('map_zoomed', { zoom: m.z, via: 'key' }); pendingFocus = '#ss-map'; render(); }
});
let WHEEL_T = 0;
document.addEventListener('wheel', e => {
  const map = e.target.closest && e.target.closest('#device .ss-map'); if (!map || map.classList.contains('ss-map--google')) return; e.preventDefault();
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
// Train status tab: one station search entry (the same entry pattern as Book's New booking). It opens the shared
// station selector; the chosen station shows on the entry, with its arrivals and departures below (outside Sprint 4).
TABS['train-status'] = () => {
  ref('1084', '1085');
  const c = selTarget('ts').from, s = c && ST[c];
  const entry = `<button class="bk-new ts-entry" type="button" data-a="sel-open" data-ctx="ts" data-field="from" id="ts-from" aria-label="${s ? `Station: ${esc(s.city)}, ${esc(s.name)}. Change station` : 'Search stations'}">${ic('search', 'bk-new__icon')}<span class="bk-new__text">${s ? `<span class="bk-new__title">${esc(s.city)}, ${s.st} · ${c}</span><span class="bk-new__sub">${esc(s.name)}</span>` : '<span class="bk-new__title">Search stations</span><span class="bk-new__sub">Station name, city or code</span>'}</span>${s ? ic('chevron-right', 'ts-entry__chev') : ''}</button>`;
  const status = s ? `<section class="ts-result" aria-labelledby="ts-res-h"><h2 class="ads-h5" id="ts-res-h">Arrivals and departures</h2><div class="ads-summary"><p class="ads-summary__title">${esc(s.name)}</p><p class="ads-body-small">Content pending</p></div>${snote('Station arrivals and departures are outside Sprint 4. This tab demonstrates the shared station search entry point.')}</section>` : '';
  return `<div class="tabpage ts-page"><h1 class="ads-h3">Train status</h1><div class="bk-headx ts-search">${entry}</div>${status}</div>`;
};
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
    el.addEventListener('change', () => { loc()[k] = el.value; V().locAlertOff = false; V().nearCache = null; const r = typeof selRoute === 'function' && sheet() && selRoute(); if (r) r.u.near = { st: 'idle' }; render(); });
  });
})();

// ---- iOS keyboard (Figma Sprint 4 node 4735:235119: Apple iOS 27 "Keyboard" component, Light, Upper Case, no
// suggestions). Shown on iPhone while station search is active. Glyphs are the component's own vectors (shift.fill,
// delete.left, return, emoji); the microphone is drawn to match (its symbol isn't exported by Figma). The keyboard is a
// simulation, so it's hidden from assistive technology: the search field itself takes real typing.
const KB_G = {"shift": {"vb": "17.61 143.21 23.11 19.94", "d": "M25.8507 163.148C25.0988 163.148 24.5258 162.941 24.132 162.525C23.7381 162.117 23.5411 161.559 23.5411 160.85V156.037H19.1691C18.7322 156.037 18.3634 155.915 18.0626 155.672C17.7618 155.421 17.6115 155.092 17.6115 154.684C17.6115 154.433 17.6652 154.211 17.7726 154.018C17.8872 153.824 18.0483 153.624 18.256 153.416L27.838 143.866C28.0457 143.651 28.257 143.49 28.4718 143.383C28.6938 143.268 28.923 143.211 29.1593 143.211C29.4028 143.211 29.632 143.268 29.8468 143.383C30.0688 143.49 30.2837 143.651 30.4913 143.866L40.0734 153.416C40.2667 153.609 40.4207 153.806 40.5353 154.007C40.657 154.207 40.7179 154.433 40.7179 154.684C40.7179 155.092 40.5639 155.421 40.256 155.672C39.9552 155.915 39.5864 156.037 39.1495 156.037H34.7882V160.85C34.7882 161.559 34.5913 162.117 34.1974 162.525C33.8035 162.941 33.2306 163.148 32.4786 163.148H25.8507Z"}, "del": {"vb": "350.35 145.77 20.1 17.13", "d": "M367.471 162.904H359.473C359.082 162.904 358.717 162.862 358.379 162.777C358.047 162.699 357.731 162.572 357.432 162.396C357.139 162.221 356.859 161.993 356.592 161.713L351.26 156.137C350.934 155.798 350.7 155.486 350.557 155.199C350.42 154.906 350.352 154.617 350.352 154.33C350.352 154.135 350.381 153.943 350.439 153.754C350.505 153.565 350.602 153.37 350.732 153.168C350.869 152.966 351.045 152.751 351.26 152.523L356.582 146.928C356.849 146.641 357.129 146.417 357.422 146.254C357.721 146.085 358.037 145.964 358.369 145.893C358.708 145.814 359.072 145.775 359.463 145.775H367.471C368.454 145.775 369.196 146.023 369.697 146.518C370.199 147.006 370.449 147.738 370.449 148.715V160.014C370.449 160.99 370.199 161.716 369.697 162.191C369.196 162.667 368.454 162.904 367.471 162.904ZM367.412 161.254C367.855 161.254 368.193 161.137 368.428 160.902C368.669 160.668 368.789 160.32 368.789 159.857V148.832C368.789 148.37 368.669 148.021 368.428 147.787C368.193 147.553 367.855 147.436 367.412 147.436H359.414C359.082 147.436 358.796 147.478 358.555 147.562C358.314 147.641 358.076 147.8 357.842 148.041L352.549 153.598C352.295 153.871 352.168 154.115 352.168 154.33C352.168 154.441 352.194 154.555 352.246 154.672C352.305 154.783 352.406 154.916 352.549 155.072L357.852 160.6C358.086 160.84 358.32 161.01 358.555 161.107C358.796 161.205 359.085 161.254 359.424 161.254H367.412ZM359.58 157.992C359.424 158.155 359.235 158.236 359.014 158.236C358.792 158.236 358.604 158.158 358.447 158.002C358.298 157.846 358.223 157.66 358.223 157.445C358.223 157.23 358.304 157.042 358.467 156.879L364.648 150.717C364.792 150.561 364.977 150.482 365.205 150.482C365.42 150.482 365.605 150.557 365.762 150.707C365.918 150.857 365.996 151.042 365.996 151.264C365.996 151.479 365.915 151.661 365.752 151.811L359.58 157.992ZM364.639 157.992L358.467 151.811C358.304 151.661 358.223 151.479 358.223 151.264C358.223 151.042 358.298 150.857 358.447 150.707C358.604 150.557 358.792 150.482 359.014 150.482C359.235 150.482 359.417 150.561 359.561 150.717L365.752 156.879C365.915 157.042 365.996 157.23 365.996 157.445C365.996 157.66 365.918 157.846 365.762 158.002C365.605 158.158 365.42 158.236 365.205 158.236C364.984 158.236 364.795 158.155 364.639 157.992Z"}, "ret": {"vb": "327.04 198.34 19.58 17.03", "d": "M333.37 215.373C333.141 215.373 332.943 215.29 332.776 215.123L327.321 209.77C327.228 209.677 327.157 209.578 327.107 209.473C327.064 209.368 327.042 209.259 327.042 209.148C327.042 209.03 327.064 208.919 327.107 208.814C327.157 208.709 327.228 208.613 327.321 208.526L332.776 203.173C332.943 203 333.141 202.914 333.37 202.914C333.617 202.914 333.815 202.991 333.963 203.146C334.118 203.3 334.195 203.495 334.195 203.73C334.195 203.854 334.174 203.962 334.13 204.055C334.093 204.147 334.041 204.231 333.973 204.305L331.292 206.912L329 208.87L328.833 208.443L331.709 208.322H343.556C344.045 208.322 344.4 208.211 344.623 207.988C344.846 207.759 344.957 207.391 344.957 206.884V201.401C344.957 200.907 344.846 200.548 344.623 200.325C344.4 200.103 344.045 199.991 343.556 199.991H338.361C338.101 199.991 337.894 199.911 337.739 199.75C337.591 199.589 337.517 199.394 337.517 199.166C337.517 198.937 337.594 198.742 337.749 198.581C337.903 198.42 338.107 198.34 338.361 198.34H343.556C344.639 198.34 345.418 198.581 345.894 199.063C346.376 199.54 346.618 200.319 346.618 201.401V206.884C346.618 207.936 346.376 208.715 345.894 209.222C345.418 209.723 344.639 209.974 343.556 209.974H331.709L328.833 209.844L329 209.417L331.292 211.384L333.973 213.991C334.041 214.065 334.093 214.148 334.13 214.241C334.174 214.334 334.195 214.439 334.195 214.557C334.195 214.798 334.118 214.993 333.963 215.141C333.815 215.296 333.617 215.373 333.37 215.373Z"}, "emoji": {"vb": "0 0 26.8 26.8", "d": "M13.4 26.8C20.7305 26.8 26.8 20.7175 26.8 13.4C26.8 6.06941 20.7175 0 13.3868 0C6.06941 0 0 6.06941 0 13.4C0 20.7175 6.08255 26.8 13.4 26.8ZM13.4 24.5666C7.19922 24.5666 2.24647 19.6008 2.24647 13.4C2.24647 7.19922 7.18608 2.23333 13.3868 2.23333C19.5876 2.23333 24.5404 7.19922 24.5536 13.4C24.5666 19.5745 19.6008 24.5666 13.4 24.5666ZM9.49822 12.2045C10.339 12.2045 11.0878 11.3374 11.0878 10.339C11.0878 9.31431 10.3521 8.47353 9.49822 8.47353C8.63116 8.47353 7.92175 9.32744 7.92175 10.339C7.92175 11.3243 8.6443 12.2045 9.49822 12.2045ZM17.3149 12.2045C18.1557 12.2045 18.8782 11.3243 18.8782 10.339C18.8782 9.32744 18.1688 8.47353 17.3149 8.47353C16.4478 8.47353 15.7121 9.31431 15.7121 10.339C15.7121 11.3374 16.461 12.2045 17.3149 12.2045ZM13.4 22.3991C17.9192 22.3991 21.532 19.0753 22.0312 15.1473C22.1363 14.3459 21.6239 13.9912 20.9277 14.2014C18.379 14.9503 16.0144 15.3706 13.4 15.3706C10.7857 15.3706 8.42098 14.9503 5.87235 14.2014C5.16293 13.9912 4.66373 14.359 4.76882 15.1473C5.26803 19.0753 8.88078 22.3991 13.4 22.3991ZM13.3868 18.3264C11.298 18.3264 9.06469 18.0375 7.30431 17.5908C7.05471 17.5251 6.9102 17.4068 6.80509 17.223C6.60804 16.8683 6.39783 16.4215 6.24018 15.8435C6.22706 15.7516 6.2796 15.7121 6.35843 15.7253C8.48665 16.3033 10.917 16.6974 13.3868 16.6974C15.8567 16.6974 18.2871 16.3033 20.4153 15.7253C20.494 15.7121 20.5467 15.7516 20.5335 15.8435C20.389 16.4084 20.1393 16.8944 19.9686 17.223C19.8504 17.4068 19.7322 17.5119 19.4826 17.5908C17.7091 18.0375 15.4757 18.3264 13.3868 18.3264Z"}};
KB_G.mic = { vb: '0 0 16 24', d: 'M8 0a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V4a4 4 0 0 0-4-4Zm0 1.6A2.4 2.4 0 0 1 10.4 4v8a2.4 2.4 0 0 1-4.8 0V4A2.4 2.4 0 0 1 8 1.6ZM.8 10.4a.8.8 0 0 1 .8.8 6.4 6.4 0 0 0 12.8 0 .8.8 0 0 1 1.6 0 8 8 0 0 1-7.2 7.96v3.24h3.2a.8.8 0 0 1 0 1.6H4a.8.8 0 0 1 0-1.6h3.2v-3.24A8 8 0 0 1 0 11.2a.8.8 0 0 1 .8-.8Z' };
const kbG = (k, cls = '') => { const g = KB_G[k], [, , w, h] = g.vb.split(' ').map(Number); return `<svg class="kb-g ${cls}" viewBox="${g.vb}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><path d="${g.d}"/></svg>`; };
function iosKeyboard(upper) {
  const key = k => `<button type="button" class="kb-key" tabindex="-1" data-kb="${k}">${upper ? k : k.toLowerCase()}</button>`, row = s => [...s].map(key).join('');
  return `<div class="ios-kb" aria-hidden="true" data-kb-root><div class="ios-kb__keys">
<div class="ios-kb__row">${row('QWERTYUIOP')}</div><div class="ios-kb__row ios-kb__row--2">${row('ASDFGHJKL')}</div>
<div class="ios-kb__row ios-kb__row--3"><button type="button" class="kb-key kb-key--fn${upper ? ' is-on' : ''}" tabindex="-1" data-kb="shift">${kbG('shift', upper ? '' : 'kb-g--line')}</button><div class="ios-kb__mid">${row('ZXCVBNM')}</div><button type="button" class="kb-key kb-key--fn" tabindex="-1" data-kb="del">${kbG('del')}</button></div>
<div class="ios-kb__row ios-kb__row--4"><button type="button" class="kb-key kb-key--123" tabindex="-1" data-kb="123">123</button><button type="button" class="kb-key kb-key--space" tabindex="-1" data-kb=" "></button><button type="button" class="kb-key kb-key--ret" tabindex="-1" data-kb="ret">${kbG('ret')}</button></div>
</div><div class="ios-kb__bottom"><span class="kb-bb">${kbG('emoji')}</span><span class="kb-bb">${kbG('mic')}</span></div></div>`;
}
// Station search on iPhone (layout A, chosen): the From / To card sits above the search field. While search is active
// (the field has focus) the card folds away, the field glides up into its place, the keyboard rises and Cancel shows
// beside the field. Search ends with Cancel, Esc (hardware keyboard; VoiceOver's escape gesture in the build), Return,
// a tap outside, or dragging the results (the keyboard dismisses on drag, as in iOS). The X only clears the text.
let KB_MUTE = false; // programmatic focus (after X or Return) doesn't reopen the keyboard
const kbPane = el => el && el.closest('.ss-kbwrap');
const kbRouteOf = el => { const p = el && el.closest('[data-ri]'); return p ? routeAt(p.dataset.ri) : null; };
function kbSet(r, on, renderNow = true, focusSel) {
  if (!r || !!r.u.kb === on) return;
  r.u.kb = on; r.u.kbAnim = on ? 'in' : 'out';
  if (on && r.u.kbShift == null) r.u.kbShift = !(r.u.d && r.u.d.q);
  if (!renderNow) return;
  KB_MUTE = true; pendingFocus = focusSel || (on ? '#ss-q' : null); render(); KB_MUTE = false;
}
function kbInsert(inp, text) {
  const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s;
  inp.setRangeText(text, s, e, 'end'); inp.dispatchEvent(new Event('input', { bubbles: true }));
}
function kbDelete(inp) {
  let s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s; if (s === e) { if (!s) return; s--; }
  inp.setRangeText('', s, e, 'end'); inp.dispatchEvent(new Event('input', { bubbles: true }));
}
document.addEventListener('focusin', e => {
  if (KB_MUTE || !e.target.matches || !e.target.matches('#device #ss-q') || !kbPane(e.target)) return;
  const r = kbRouteOf(e.target); if (r && !r.u.kb) setTimeout(() => kbSet(r, true), 0); // after the tap lands
});
document.addEventListener('pointerdown', e => {
  const t = e.target; if (!t.closest || !t.closest('#device')) return;
  if (t.closest('[data-kb-root]')) { e.preventDefault(); return; } // keys never take focus from the field
  const pane = kbPane(t);
  if (t.closest('#ss-q') && pane) { const r = kbRouteOf(t); if (r && !r.u.kb && document.activeElement === t.closest('#ss-q')) setTimeout(() => kbSet(r, true), 0); return; } // after the tap lands, so focus stays in the field
  const open = document.querySelector('#device .ss-kbwrap.is-kb'); if (!open || t.closest('.ss-search')) return;
  const r = kbRouteOf(open); if (!r) return;
  // Tapping anything else ends search. A control (a station, a tab) still does its own job: its render closes the keyboard.
  if (t.closest('button, a, [data-a], input, select')) kbSet(r, false, false); else kbSet(r, false);
});
document.addEventListener('click', e => {
  const k = e.target.closest && e.target.closest('#device [data-kb]'); if (!k) return;
  const inp = document.querySelector('#device #ss-q'), r = kbRouteOf(k); if (!inp || !r) return;
  const v = k.dataset.kb;
  if (v === 'shift') { r.u.kbShift = !r.u.kbShift; render(); return; }
  if (v === 'del') { kbDelete(inp); if (!inp.value) { r.u.kbShift = true; render(); } return; }
  if (v === 'ret') { kbSet(r, false, true, '#ss-q'); return; }
  if (v === '123') return; // number and symbol layouts aren't simulated
  if (v === ' ') { kbInsert(inp, ' '); return; }
  const up = !!r.u.kbShift; r.u.kbShift = false; kbInsert(inp, up ? v : v.toLowerCase());
});

// Esc ends search first (it no longer leaves the station screen while searching)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return; const open = document.querySelector('#device .ss-kbwrap.is-kb'); if (!open) return;
  e.preventDefault(); e.stopImmediatePropagation(); kbSet(kbRouteOf(open), false, true, '#ss-q');
}, true);
// Dragging the results dismisses the keyboard (iOS interactive dismiss); the text and results stay
const kbDrag = e => { const sc = e.target.closest && e.target.closest('#device .ss-kbwrap.is-kb .pane__scroll'); if (!sc || e.target.closest('[data-kb-root]')) return; kbSet(kbRouteOf(sc), false, true); };
document.addEventListener('wheel', kbDrag, { passive: true });
document.addEventListener('touchmove', kbDrag, { passive: true });
