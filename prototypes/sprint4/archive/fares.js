/* Sprint 4 prototype: illustrative fares for the date heat map, shared by every date picker.
   Sprint 4 has no fare data or fare-calendar story (Q20), so these are made up from the route, weekday, how
   soon the trip is and holiday periods. They're labeled as illustrative wherever they appear. */

const strHash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
// Lowest one-way Coach fare per traveler for a leg on a day, or null when it can't be priced
function dayFare(from, to, s) {
  if (!from || !to) return null;
  const base = 29 + (strHash([from, to].sort().join('')) % 96);           // route
  const d = parse(s), dow = d.getDay(), m = d.getMonth(), dd = d.getDate();
  const week = [1.12, 0.96, 0.86, 0.88, 1.02, 1.24, 1.08][dow];              // Fri and Sun cost more, Tue and Wed less
  const lead = Math.round((d - TODAY) / 864e5), soon = lead < 7 ? 1.3 : lead < 21 ? 1.12 : 1;
  const holiday = (m === 10 && dd >= 24 && dd <= 30) || (m === 11 && dd >= 19) || (m === 0 && dd <= 3) ? 1.35 : 1;
  const wobble = 0.93 + (strHash(s + from + to) % 15) / 100;
  return Math.round(base * week * soon * holiday * wobble);
}
// Which fares the calendar can show for this booking: dollars, points, or none (with the reason)
function fareMode(b) {
  const it = intentOf(b);
  if (it === 'corporate') return { kind: 'none', why: 'Prices aren’t shown for TripLink Corporate bookings. Corporate fares apply.' };
  if (it === 'pr') return { kind: 'none', why: 'Prices aren’t shown for Pass Rider travel. Pass Rider fares apply.' };
  if (!b.from || !b.to) return { kind: 'none', why: 'Choose your stations to see prices for each day.' };
  return { kind: D().signedIn && b.pay === 'points' ? 'points' : 'cash' };
}
const fareText = (v, kind) => kind === 'points' ? `${(Math.round(v / 0.029 / 10) * 10).toLocaleString('en-US')}` : `$${v}`;
// Lower / typical / higher, relative to the selectable days of the month on screen
function fareLevels(values) {
  const v = values.filter(x => x != null).sort((a, c) => a - c); if (v.length < 3) return () => 'mid';
  const lo = v[Math.floor(v.length / 3)], hi = v[Math.floor((v.length * 2) / 3)];
  return x => x == null ? null : x < lo ? 'low' : x >= hi ? 'high' : 'mid';
}
const FARE_WORD = { low: 'lower fare', mid: 'typical fare', high: 'higher fare' };
function fareLegend(mode) {
  if (mode.kind === 'none') return `<p class="cal-legend cal-legend--none">${esc(mode.why)}</p>`;
  return `<div class="cal-legend"><span class="cal-legend__keys"><span class="cal-key cal-key--low">Lower</span><span class="cal-key cal-key--mid">Typical</span><span class="cal-key cal-key--high">Higher</span></span><span class="cal-legend__note">Shading compares the lowest Coach fare per traveler, one way${mode.kind === 'points' ? ' (in points)' : ''}, across the month. Illustrative prices, not live fares. ${q(20)}</span></div>`;
}
// Month navigation (one month at a time)
const monthKey = s => s.slice(0, 7);
A['cal-month'] = (t, ri) => {
  const r = routeAt(ri), [y, m] = (r.u.month).split('-').map(Number), d = new Date(y, m - 1 + (+t.dataset.d), 1);
  r.u.month = iso(d).slice(0, 7); pendingFocus = `[data-a="cal-month"][data-d="${t.dataset.d}"]:not(:disabled), .cal-nav__title`; render();
};
