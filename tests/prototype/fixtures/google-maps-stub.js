// Minimal stand-in for the Google Maps JavaScript API, for tests without a key or network. It implements only what
// prototypes/sprint4/gmap.js uses: importLibrary('maps' | 'marker'), Map (center, zoom, idle) and AdvancedMarkerElement.
// Marker content is placed in the map element so clicks bubble through the DOM as they do with the real API.
(() => {
  const stub = window.__gmStub = { maps: [], markers: new Set(), options: [] };
  class Map {
    constructor(el, o) { this.el = el; this.c = { ...o.center }; this.z = o.zoom; this.l = {}; stub.maps.push(this); stub.options.push(o); el.dataset.gmapStub = '1'; }
    addListener(ev, fn) { (this.l[ev] = this.l[ev] || []).push(fn); return { remove() {} }; }
    getCenter() { const c = this.c; return { lat: () => c.lat, lng: () => c.lng }; }
    getZoom() { return this.z; }
    setCenter(c) { this.c = { ...c }; } setZoom(z) { this.z = z; }
    // test hook: the person drags or pinches the map, then Google fires idle
    _user(c, z) { this.c = { ...c }; if (z != null) this.z = z; (this.l.idle || []).forEach(f => f()); }
  }
  class AdvancedMarkerElement {
    constructor(o) { this.position = o.position; this.content = o.content; this.zIndex = o.zIndex; this._map = null; this.map = o.map; }
    set map(m) { if (this._map && this.content.parentNode) this.content.remove(); this._map = m; if (m) { m.el.appendChild(this.content); stub.markers.add(this); } else stub.markers.delete(this); }
    get map() { return this._map; }
  }
  window.google = { maps: { importLibrary: async n => (n === 'maps' ? { Map } : { AdvancedMarkerElement }) } };
})();
