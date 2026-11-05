/* Sprint 4 prototype: Google Maps surface for the station selector's Map view (NMA-1084).
   - Only the map surface changes. The screen, its List / Map tabs, the ADS zoom and locate controls, the floating
     station card, Details and Select, and every selection rule stay in stationmap.js.
   - Station IDs, names and coordinates come from the prototype's station data (STATIONS, STATION_GEO); stations
     with missing or invalid coordinates are left off the map and stay available in search and the list.
   - Selection state stays where it was: r.u.map (centre and zoom) and r.u.mapSel (the highlighted station). Tapping
     a marker runs the existing map-pin action (highlight and card); only Select or a list row writes the field.
     Panning and zooming update the view only.
   - Configuration: window.S4_CONFIG.googleMapsApiKey (and optional googleMapsMapId). `npm run dev` fills it from
     VITE_GOOGLE_MAPS_API_KEY in .env.local (not committed). The standalone index.html never contains a key.
   - Fallback: without a key, or if Google Maps fails to load or rejects the key, the existing placeholder map is
     used, with the same markers, gestures and selection path. See GOOGLE-MAPS.md. */

const GMAP_CFG = () => Object.assign({ googleMapsApiKey: '', googleMapsMapId: '' }, window.S4_CONFIG || {});
// state: off (not requested) · loading · ready · failed (reason: no-key, network, auth, timeout, import)
const GM = { state: 'off', reason: '', lib: null, map: null, host: null, markers: [], applied: null, warned: false };
const GM_TIMEOUT_MS = 15000;
const gmActive = () => GM.state === 'ready' && loc().map !== 'fail';

function gmLoad() {
  if (GM.state !== 'off') return;
  const cfg = GMAP_CFG();
  if (!cfg.googleMapsApiKey) { GM.state = 'failed'; GM.reason = 'no-key'; return; }
  GM.state = 'loading';
  const ready = async () => {
    try {
      const { Map } = await google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
      if (GM.state !== 'loading') return;
      clearTimeout(GM.timer); GM.lib = { Map, AdvancedMarkerElement }; GM.state = 'ready';
      track('map_load_succeeded', { provider: 'google' }); render();
    } catch (e) { gmFail('import'); }
  };
  // Google calls gm_authFailure when the key is invalid, restricted or not enabled for the Maps JavaScript API
  window.gm_authFailure = () => gmFail('auth');
  GM.timer = setTimeout(() => { if (GM.state === 'loading') gmFail('timeout'); }, GM_TIMEOUT_MS);
  if (window.google && google.maps && google.maps.importLibrary) { ready(); return; } // already loaded (or a test double)
  window.__s4GmapsReady = ready;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(cfg.googleMapsApiKey)}&v=weekly&loading=async&libraries=marker&callback=__s4GmapsReady`;
  s.async = true; s.onerror = () => gmFail('network');
  document.head.appendChild(s);
}
function gmFail(why) {
  if (GM.state === 'failed') return;
  clearTimeout(GM.timer); GM.state = 'failed'; GM.reason = why;
  gmClear(); GM.map = null; GM.host = null; GM.applied = null;
  track('map_load_failed', { provider: 'google', reason: why });
  render(); // the placeholder map takes over with the same view and selection
}
function gmNotes() {
  const bad = geoIssues();
  if (bad.length) { snote(`Not on the map (missing or invalid coordinates): ${bad.join(', ')}. They stay available in search and the list.`); if (!GM.warned) { GM.warned = true; console.warn('[station map] stations without valid coordinates:', bad.join(', ')); } }
  if (GM.state === 'ready') snote('Map: Google Maps JavaScript API. Markers come from the prototype’s station data for the visible area.');
  else if (GM.state === 'loading') snote('Map: loading Google Maps; the placeholder map is shown until it’s ready.');
  else snote(`Map: placeholder drawing (Google Maps ${GM.reason === 'no-key' ? 'has no API key configured' : `didn’t load: ${GM.reason}`}). Markers, gestures and selection work the same. See GOOGLE-MAPS.md.`);
}

// ---------- The surface: one Google map that survives the prototype's re-renders ----------
function gmEnsure(r) {
  if (GM.map) return;
  const m = r.u.map, cfg = GMAP_CFG();
  GM.host = document.createElement('div'); GM.host.className = 'gmap-host';
  GM.map = new GM.lib.Map(GM.host, {
    center: { lat: m.lat, lng: m.lon }, zoom: m.z, mapId: cfg.googleMapsMapId || 'DEMO_MAP_ID',
    disableDefaultUI: true, clickableIcons: false, keyboardShortcuts: false, gestureHandling: 'greedy',
    isFractionalZoomEnabled: false, minZoom: Z_MIN, maxZoom: Z_MAX
  });
  GM.applied = { lat: m.lat, lon: m.lon, z: m.z };
  // A pan or zoom by the person changes the view only: never the highlighted station or the booking
  GM.map.addListener('idle', () => {
    const r2 = selRoute(); if (!r2 || !r2.u.map || r2.u.view !== 'map') return;
    const c = GM.map.getCenter(), z = GM.map.getZoom(), lat = c.lat(), lon = c.lng(), a = GM.applied;
    if (a && Math.abs(a.lat - lat) < 1e-7 && Math.abs(a.lon - lon) < 1e-7 && a.z === z) return;
    const m2 = r2.u.map, zoomed = z !== m2.z;
    Object.assign(m2, { lat, lon, z, why: 'moved' }); GM.applied = { lat, lon, z };
    track(zoomed ? 'map_zoomed' : 'map_panned', { via: zoomed ? 'pinch_or_wheel' : 'drag', zoom: z, provider: 'google' });
    pendingFocus = null; render();
  });
}
function gmClear() { GM.markers.forEach(mk => { mk.map = null; }); GM.markers = []; }
// Apply the selector's state to the map: camera (when the app moved it), markers and the highlighted station
function gmSync(r) {
  const m = r.u.map, a = GM.applied;
  if (!a || Math.abs(a.lat - m.lat) > 1e-7 || Math.abs(a.lon - m.lon) > 1e-7 || a.z !== m.z) {
    GM.applied = { lat: m.lat, lon: m.lon, z: m.z };
    GM.map.setCenter({ lat: m.lat, lng: m.lon }); GM.map.setZoom(m.z);
  }
  gmClear();
  const pos = locKnown() ? devicePos() : null, put = (lat, lon, html, z) => {
    const el = document.createElement('div'); el.className = 'gmap-marker'; el.innerHTML = html;
    GM.markers.push(new GM.lib.AdvancedMarkerElement({ map: GM.map, position: { lat, lng: lon }, content: el, zIndex: z }));
  };
  for (const g of visibleMarkers(m)) {
    const lat = g.items.reduce((s, p) => s + geoOf(p.s.code).lat, 0) / g.items.length, lon = g.items.reduce((s, p) => s + geoOf(p.s.code).lon, 0) / g.items.length;
    put(lat, lon, markerHtml(g, r.u.mapSel, pos, false), g.items.some(p => p.s.code === r.u.mapSel) ? 3 : 1);
  }
  if (pos) put(pos.lat, pos.lon, `<div class="map-me${pos.approx ? ' map-me--approx' : ''}" style="--acc:${pos.approx ? 60 : 14}px" role="img" aria-label="Your location${pos.approx ? ', approximate' : ''}"></div>`, 2);
}
// After every render: put the persistent map back into the Map view's slot, then sync it
const renderBeforeGmap = render;
render = function () {
  const out = renderBeforeGmap.apply(this, arguments);
  const slot = document.querySelector('#device .gmap-slot'), r = selRoute();
  if (slot && GM.state === 'ready' && r && r.u.map) { gmEnsure(r); if (GM.host.parentNode !== slot) slot.appendChild(GM.host); gmSync(r); }
  else if (!slot && GM.markers.length) gmClear(); // the Map view closed: markers go; the map keeps its camera for reopening
  return out;
};
