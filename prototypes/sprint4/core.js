/* Sprint 4 prototype: state, routing, rendering shell, network mock, toolbar. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, cls = '') => `<span class="ads-icon ads-icon--${n}${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
const clone = o => JSON.parse(JSON.stringify(o));
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

// ---------- Dates (stored as YYYY-MM-DD) ----------
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const fmtShort = s => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtDate = s => parse(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const fmtWeekday = s => parse(s).toLocaleDateString('en-US', { weekday: 'long' });
const TODAY_S = iso(TODAY);

// ---------- Toolbar state (shared) and per-version state ----------
const TB = { v: 1, dev: 'iphone', orient: 'portrait', text: 100, notes: true, theme: 'light', tab: 'proto' };
const blankAssist = () => ({ cat: null, dis: [], wc: null, needs: [] });
function seed(sc) {
  const intl = sc === 'intl';
  const d = {
    signedIn: sc !== 'guest', verified: sc !== 'unverified',
    profile: {
      first: 'Alex', last: 'Rivera', mi: sc === 'mi' ? 'J' : '', agr: '7012345678', email: 'alex.rivera@example.com',
      phone: intl ? { region: 'intl', mobile: '', home: '', business: '', ext: '', cc: 'GB', intl: '7700900123' } : { region: 'us', mobile: '2155550147', home: '', business: '', ext: '', cc: 'GB', intl: '' },
      address: intl ? { country: 'GB', street: '221 Baker Street', apt: 'Flat B', city: 'London', state: '', zip: 'NW1 6XE' } : { country: 'US', street: '1500 Market Street', apt: 'Apt 4B', city: 'Philadelphia', state: 'Pennsylvania', zip: '19102' },
      dob: ''
    },
    discount: sc === 'assist' ? { type: 'pwd', rpa: '' } : sc === 'rpa' ? { type: 'rpa', rpa: '4815162' } : { type: 'none', rpa: '' },
    assist: sc === 'assist' ? { cat: 'disability', dis: ['mobility'], wc: true, needs: ['station', 'seat'] } : blankAssist(),
    fav: sc === 'new' ? [] : ['NYP'],
    // Fare Finder variants (Version 3): TripLink (NMA-622), Pass Rider (NMA-623, 1016–1019), profile codes (NMA-613)
    triplink: sc === 'triplink',
    passrider: sc.startsWith('passrider') ? { role: sc === 'passrider-spouse' ? 'spouse' : 'employee', business: sc === 'passrider', compLeft: sc === 'passrider' ? 5 : 0 } : null,
    coupons: ['guest', 'new'].includes(sc) ? [] : clone(PROFILE_CODES),
    rec: sc === 'new' ? [] : [{ c: 'WAS', d: 2 }, { c: 'PHL', d: 5 }, { c: 'BOS', d: 9 }, { c: 'BAL', d: 12 }]
  };
  d.booking = freshBooking(d);
  return d;
}
function freshBooking(d) {
  const has = d.signedIn && !!d.assist.cat;
  return {
    trip: 'ow', from: null, to: null, dep: TODAY_S, ret: null,
    disc: d.signedIn && ['military', 'rpa'].includes(d.discount.type) ? d.discount.type : 'none',
    assistOn: d.signedIn && (has || d.discount.type === 'pwd'),
    assist: has ? clone(d.assist) : blankAssist(), assistDone: has, assistFromProfile: has, notice: null,
    // Version 3 Fare Finder fields
    pax: { adult: 1, senior: 0, ya: 0, youth: 0, child: 0, infant: 0 }, tdisc: {}, pay: 'cash',
    intent: d.signedIn && d.triplink ? 'corporate' : d.signedIn && d.passrider ? 'pr' : 'standard',
    prType: d.passrider && !d.passrider.business ? 'leisure' : null, prPax: { fam: 0, dep: 0, comp: 0 },
    code: null, codeTries: 0, codeErr: '', modeNote: null
  };
}
const makeVS = (sc = 'returning') => ({ sc, net: 'online', entry: 'ff', token: 'valid', data: seed(sc), nav: { tab: 'book', sheet: null, cover: null, dialog: null }, toast: null });
let VS = { 1: makeVS(), 2: makeVS(), 3: makeVS() };
const V = () => VS[TB.v];
const D = () => V().data;
const nav = () => V().nav;
const R = (s, p = {}) => ({ s, p, u: {} });
const IPAD = () => TB.dev === 'ipad';
const WIDE = () => IPAD() && TB.orient === 'landscape';

// ---------- Notes collected while rendering (shown in the side panel) ----------
let NOTES;
const resetNotes = () => { NOTES = { refs: new Set(), qs: new Set(), prov: new Set(), tips: new Set() }; };
const ref = (...ids) => ids.forEach(i => NOTES.refs.add(i));
const prov = t => NOTES.prov.add(t);
const tip = t => NOTES.tips.add(t);
function q(n) { NOTES.qs.add(n); return `<button type="button" class="pq" data-a="q" data-q="${n}" aria-label="Open question ${n}: ${esc(QUESTIONS[n][0])}">Q${n}</button>`; }

// ---------- Navigation ----------
let pendingFocus = null;
const sheet = () => nav().sheet;
const topR = () => { const s = sheet(); return s && s.stack[s.stack.length - 1]; };
function openSheet(id, stack, opener) { nav().sheet = { id, stack: stack.map(x => typeof x === 'string' ? R(x) : x), opener }; pendingFocus = 'title'; render(); }
function push(s, p = {}, fromIdx) { const sh = sheet(); if (fromIdx != null && fromIdx >= 0) sh.stack = sh.stack.slice(0, fromIdx + 1); sh.stack.push(R(s, p)); pendingFocus = 'title'; render(); }
function replaceTop(s, p = {}) { const sh = sheet(); sh.stack[sh.stack.length - 1] = R(s, p); pendingFocus = 'title'; render(); }
function popTo(i) { const sh = sheet(); if (i < 0) return closeSheet(); sh.stack = sh.stack.slice(0, i + 1); pendingFocus = 'title'; render(); }
function pop() { popTo(sheet().stack.length - 2); }
function closeSheet(force) {
  const sh = sheet(); if (!sh) return;
  if (!force && sh.stack.some(r => r.u.dirty || (r.u.edit && r.u.edit.u.dirty))) return confirmDiscard(() => closeSheet(true));
  nav().sheet = null; pendingFocus = sh.opener || null; render();
}
function confirmDiscard(go) {
  dialog({ title: 'Discard changes?', body: 'Your changes haven’t been saved.', actions: [['Keep editing', 'secondary', null], ['Discard', 'destructive', go]] });
}
function dialog(o) { nav().dialog = o; pendingFocus = '.pdialog [data-dlg]'; render(); }
function closeDialog(then) { const o = nav().dialog; nav().dialog = null; pendingFocus = o && o.returnFocus || 'title'; render(); if (then) then(); }
let toastT;
function toast(msg, kind = 'success') { V().toast = { msg, kind }; render(); clearTimeout(toastT); const v = V(); toastT = setTimeout(() => { v.toast = null; render(); }, 3200); }

// ---------- Location: lets the toolbar keep the same place across versions and devices ----------
function locOf() {
  const n = nav();
  if (n.cover) return 'verify:' + n.cover.trigger;
  if (n.dialog && n.dialog.id === 'clear') return 'clear-recents';
  const sh = n.sheet; if (!sh) return 'tab:' + n.tab;
  const t = sh.stack[sh.stack.length - 1], b = D().booking;
  switch (t.s) {
    case 'ff': return b.assistDone && b.assistOn && t.u.reviewFocus ? 'assist-review' : (b.trip === 'rt' ? 'ff-rt' : 'ff');
    case 'code': return 'code';
    case 'stations': return 'stations:' + t.p.field;
    case 'calendar': return 'calendar:' + t.p.field;
    case 'travelers': return 'travelers';
    case 'assist': return t.u.step === 'review' ? 'assist-review' : 'assist-booking';
    case 'handoff': return 'handoff';
    case 'profile': return t.u.inline ? 'edit:' + t.u.inline : 'profile';
    case 'edit': return 'edit:' + t.p.field;
    case 'discounts': return 'discounts';
    case 'rules': return 'rules';
    case 'assist-profile': return 'assist-profile';
    case 'inbox': return 'tab:' + n.tab;
    default: return 'account';
  }
}
function goLoc(loc) {
  const v = V(), d = v.data, b = d.booking, v3 = TB.v === 3; // V3 edits Profile in place; its booking uses sheets like V1
  v.nav.cover = null; v.nav.dialog = null; v.nav.sheet = null; v.toast = null;
  const [k, arg] = loc.split(':');
  const booking = extra => { v.nav.tab = 'book'; v.nav.sheet = { id: 'booking', stack: [R('ff'), ...extra], opener: '[data-a="open-booking"]' }; };
  const account = extra => { v.nav.sheet = { id: 'account', stack: [R('account'), ...extra], opener: '[data-a="open-account"]' }; };
  // Guests have no Profile: those locations land on the guest Account sheet instead of signing in silently
  const guestBlocked = () => { if (d.signedIn) return false; account([]); return true; };
  const sampleRoute = () => { if (!b.from) b.from = 'NYP'; if (!b.to || b.to === b.from) b.to = 'WAS'; };
  const sampleAssist = () => { if (!b.assistDone) { b.assist = { cat: 'disability', dis: ['mobility'], wc: true, needs: ['station'] }; b.assistDone = true; } b.assistOn = true; };
  switch (k) {
    case 'tab': v.nav.tab = arg; break;
    case 'ff': b.trip = 'ow'; booking([]); break;
    case 'ff-rt': b.trip = 'rt'; if (!b.ret || b.ret < b.dep) b.ret = b.dep; booking([]); break;
    case 'stations': booking([R('stations', { field: arg })]); break;
    case 'calendar': booking([R('calendar', { field: arg })]); break;
    case 'travelers': booking([R('travelers')]); break;
    case 'code': booking([R('code')]); break;
    case 'handoff': sampleRoute(); booking([R('handoff')]); break;
    case 'assist-booking': case 'assist-review': {
      if (k === 'assist-review') sampleAssist(); else b.assistOn = true;
      const viaT = v.entry === 'travelers';
      if (TB.v !== 2) {
        if (k === 'assist-review') { booking(viaT ? [R('travelers')] : []); const st = v.nav.sheet.stack; st[st.length - 1].u.reviewFocus = true; }
        else booking(viaT ? [R('travelers'), R('assist')] : [R('assist')]);
      } else { const a = R('assist'); if (k === 'assist-review') a.u.step = 'review'; booking(viaT ? [R('travelers'), a] : [a]); }
      break;
    }
    case 'clear-recents': account([]); v.nav.dialog = clearDialog(); break;
    case 'account': account([]); break;
    case 'profile': if (guestBlocked()) break; account([R('profile')]); break;
    case 'edit': if (guestBlocked()) break; if (v3) { account([R('profile')]); v.nav.sheet.stack[1].u.inline = arg; } else account([R('profile'), R('edit', { field: arg })]); break;
    case 'discounts': if (guestBlocked()) break; account([R('profile'), R('discounts')]); break;
    case 'rules': if (guestBlocked()) break; account([R('profile'), R('discounts'), R('rules')]); break;
    case 'assist-profile': if (guestBlocked()) break; account([R('assist-profile')]); break;
    case 'v3': {
      // Version 3 demo entries: "v3:<scenario>:<place>"
      const [, sc, place] = loc.split(':');
      TB.v = 3; store.set('s4-v', '3');
      const keep = { net: VS[3].net, entry: VS[3].entry, token: VS[3].token };
      VS[3] = Object.assign(makeVS(sc), keep);
      goLoc('ff'); (V3_PLACES[place] || V3_PLACES.ff)();
      return;
    }
    case 'verify':
      if (arg === 'sign-in') { d.signedIn = false; account([]); startVerify('sign-in', {}, true); }
      else if (arg === 'change-email') { if (guestBlocked()) break; account([R('profile')]); startVerify('change-email', {}, true); }
      else { if (guestBlocked()) break; d.verified = false; if (v3) { account([R('profile')]); v.nav.sheet.stack[1].u.inline = 'phone'; } else account([R('profile'), R('edit', { field: 'phone' })]); }
      break;
  }
  pendingFocus = k === 'assist-review' && TB.v !== 2 ? '[data-a="assist-edit"]' : 'title';
  // V3 edits Profile in place: move focus (and the scroll) into the open panel
  if (v3 && k === 'edit') pendingFocus = '.edpane input, .edpane select, .edpane button';
  render();
}

// ---------- Network mock ----------
// online: 700 ms then success. offline: blocked at once. slow: spinner with Cancel, timeout at 6 s
// (stands in for the 120 s Mobile App Global Standard). error: technical failure with Retry.
function runNet(r, work, done, opts = {}) {
  const v = V(), net = v.net;
  r.u.alert = null; r.u.retry = () => runNet(r, work, done, opts);
  if (net === 'offline') { r.u.alert = { kind: 'offline', what: opts.what || 'save your changes' }; render(); return; }
  const token = r.u.busy = Math.random(); render();
  if (net === 'slow') { setTimeout(() => { if (r.u.busy !== token) return; r.u.busy = null; r.u.alert = { kind: 'timeout' }; render(); }, 6000); return; }
  setTimeout(() => {
    if (r.u.busy !== token) return; r.u.busy = null;
    if (net === 'error') { r.u.alert = { kind: 'error', what: opts.what || 'save your changes' }; render(); return; }
    const out = work(); done(out);
  }, 700);
}
function runSave(r, work, done) {
  const d = D();
  if (d.signedIn && !d.verified) { startVerify('unverified', { resume: () => runSave(r, work, done) }); return; }
  runNet(r, work, done);
}
function netAlert(r) {
  const a = r.u.alert; if (!a) return '';
  if (a.kind === 'offline') return alertBox('warning', 'You’re offline', `Connect to the internet to ${a.what}. Everything you entered is kept.`);
  if (a.kind === 'timeout') return alertBox('warning', 'This is taking longer than usual', 'Check your connection and try again.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="retry">Try again</button>');
  if (a.kind === 'error') return alertBox('error', a.what === 'find trains' ? 'We couldn’t search right now' : 'We couldn’t save your changes', 'Something went wrong on our side. Everything you entered is kept.', '<button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="retry">Try again</button>');
  if (a.kind === 'custom') return alertBox(a.tone, a.title, a.text, a.action || '');
  return '';
}
const alertBox = (tone, title, text, action = '') => `<div class="ads-alert ads-alert--${tone}" role="${tone === 'error' ? 'alert' : 'status'}">${ic(tone === 'error' ? 'alert-diamond' : tone === 'warning' ? 'alert-triangle' : tone === 'success' ? 'check-circle' : 'info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">${title}</p><p class="ads-alert__description ads-body-small">${text}</p>${action ? `<div>${action}</div>` : ''}</div></div>`;
function busyBtn(r, label, busyLabel, attrs = '') {
  return r.u.busy ? `<div class="busyrow"><button class="ads-btn ads-btn--block" type="button" aria-busy="true" disabled>${ic('spinner-static')}${busyLabel}</button><button class="ads-btn ads-btn--tertiary" type="button" data-a="cancel-busy">Cancel</button></div>`
    : `<button class="ads-btn ads-btn--block" type="button" ${attrs}>${label}</button>`;
}

// ---------- Verification cover (reusable for every trigger) ----------
function startVerify(trigger, opts = {}, silent) {
  const v = V(), d = v.data;
  const steps = trigger === 'change-email' ? [...(v.token === 'expired' ? ['reauth'] : []), 'newemail', 'code'] : trigger === 'sign-in' ? ['signin', 'channel', 'code'] : ['channel', 'code'];
  v.nav.cover = { trigger, steps, i: 0, u: { d: { code: '', channel: 'email', email: d.profile.email, password: '', newEmail: '' }, err: {} }, status: 'idle', resume: opts.resume || null, cooldown: 0, sends: 0 };
  if (!silent) { pendingFocus = 'title'; render(); }
}
function endVerify(ok) {
  const v = V(), c = v.nav.cover, d = v.data; v.nav.cover = null; clearInterval(cooldownT);
  if (!ok) { pendingFocus = 'title'; render(); if (c.trigger === 'change-email') toast('Email not changed', 'info'); return; }
  if (c.trigger === 'change-email') { d.profile.email = c.u.d.newEmail; pendingFocus = 'title'; toast('Your email has been updated'); }
  else if (c.trigger === 'sign-in') { d.signedIn = true; d.verified = true; d.booking = Object.assign(freshBooking(d), { from: d.booking.from, to: d.booking.to, trip: d.booking.trip, dep: d.booking.dep, ret: d.booking.ret }); pendingFocus = 'title'; toast('Signed in as Alex Rivera'); }
  else { d.verified = true; pendingFocus = 'title'; render(); if (c.resume) c.resume(); }
}
let cooldownT;
function startCooldown() {
  const c = nav().cover; c.cooldown = 10; clearInterval(cooldownT);
  cooldownT = setInterval(() => {
    const cc = nav().cover; if (!cc) return clearInterval(cooldownT);
    cc.cooldown = Math.max(0, cc.cooldown - 1);
    const b = $('#resendBtn'); if (b) { if (cc.cooldown) b.textContent = `Resend code in 0:${String(cc.cooldown).padStart(2, '0')}`; else { render(); } }
    if (!cc.cooldown) clearInterval(cooldownT);
  }, 1000);
}

// ---------- Clear recent stations (NMA-1004) ----------
function clearDialog() {
  return { id: 'clear', title: 'Clear recent stations?', body: 'All Recent Stations will be removed.', returnFocus: '[data-a="clear-recents"]',
    actions: [['Cancel', 'secondary', null], ['Confirm', 'destructive', () => { D().rec = []; toast('Recent stations cleared'); }]] };
}

// ---------- Rendering shell ----------
var render = function () {
  const dev = $('#device'); if (!dev) return;
  resetNotes();
  const ae = document.activeElement, keep = ae && dev.contains(ae) ? (ae.id ? '#' + CSS.escape(ae.id) : ae.dataset.k ? `[data-k="${ae.dataset.k}"]` : null) : null;
  const sel = ae && ae.id && 'selectionStart' in ae ? [ae.selectionStart, ae.selectionEnd] : null;
  const scrolls = $$('[data-scroll]', dev).map(e => [e.dataset.scroll, e.scrollTop]);
  dev.className = `device device--${TB.dev} device--${TB.orient} ver-${TB.v}${TB.notes ? '' : ' notes-off'}`;
  dev.dataset.theme = TB.theme;
  dev.innerHTML = renderDevice();
  dev.style.setProperty('--text-zoom', TB.text / 100);
  for (const [k, t] of scrolls) { const e = $(`[data-scroll="${k}"]`, dev); if (e) e.scrollTop = t; }
  let target = null;
  if (pendingFocus === 'title') target = $$('[data-title]', dev).filter(e => !e.closest('[inert]')).pop();
  else if (pendingFocus) target = $(pendingFocus, dev);
  else if (keep) target = $(keep, dev);
  if (target) { target.focus({ preventScroll: pendingFocus === null }); if (sel && target.id && '#' + CSS.escape(target.id) === keep && target.setSelectionRange) try { target.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
  pendingFocus = null;
  renderChrome();
}
function renderDevice() {
  const n = nav(), overlay = !!(n.sheet || n.cover || n.dialog);
  let h = `<div class="dev-status" aria-hidden="true"><span>9:41</span><span class="dev-status__right">${ic('wifi', 'ads-icon--sm')}<span class="dev-batt"></span></span></div>`;
  h += `<div class="app" ${overlay ? 'inert' : ''}>${IPAD() ? ipadNav() : appHeader()}<main class="app-main" data-scroll="main" aria-label="${esc(tabLabel(n.tab))}">${TABS[n.tab]()}</main>${IPAD() ? '' : tabBar()}</div>`;
  if (n.sheet) h += renderSheet(n.sheet, !!(n.cover || n.dialog));
  if (n.cover) h += renderCover(n.cover, !!n.dialog);
  if (n.dialog) h += renderDialog(n.dialog);
  const t = V().toast;
  h += `<div class="toast-wrap" role="status" aria-live="polite">${t ? `<div class="ads-toast ads-toast--${t.kind}">${ic(t.kind === 'success' ? 'check-circle' : 'info-circle')}<span>${esc(t.msg)}</span></div>` : ''}</div>`;
  return h;
}
const tabLabel = t => ({ book: 'Book', trips: 'Trips', 'train-status': 'Train Status', support: 'Support' }[t]);
const TAB_ICONS = { book: 'search', trips: 'payment-voucher', 'train-status': 'train', support: 'question-circle' };
function appHeader() {
  const d = D();
  const who = d.signedIn ? `<span class="ads-avatar">AR</span><span><span class="ads-appheader__name">Hi, Alex</span><span class="ads-appheader__meta">Select Plus · 12,450 pts</span></span>` : `<span class="ads-avatar" style="background:var(--ads-background-surface-sunken);color:var(--ads-content-icon-primary)">${ic('person')}</span><span><span class="ads-appheader__name">Sign in</span><span class="ads-appheader__meta">Guest</span></span>`;
  return `<header class="ads-appheader"><button class="ads-appheader__account" type="button" data-a="open-account" aria-label="Account${d.signedIn ? ': Alex Rivera' : ', signed out'}">${who}</button><button class="ads-icon-btn ads-icon-btn--round" type="button" data-a="open-inbox" aria-label="Notification Inbox, 2 unread">${ic('email')}<span class="ads-icon-btn__dot"></span></button></header>`;
}
function tabBar() {
  const n = nav();
  return `<nav class="ads-tabbar app-tabbar" aria-label="App"><div class="ads-tabbar__tabs ads-glass">${Object.keys(TAB_ICONS).map(t => `<a class="ads-tabbar__tab" href="#" data-a="tab" data-tab="${t}" ${n.tab === t ? 'aria-current="page"' : ''}>${ic(TAB_ICONS[t])}<span>${tabLabel(t)}</span></a>`).join('')}</div></nav>`;
}
function ipadNav() {
  const n = nav(), d = D();
  return `<header class="ads-ipad-nav app-ipadnav"><span class="ipad-logo" role="img" aria-label="Amtrak">__LOGO_H__</span>
    <nav class="ads-tabbar-ipad ads-glass" aria-label="App"><button class="ads-tabbar-ipad__button" type="button" aria-label="Show sidebar" aria-pressed="false" data-a="noop" title="Sidebar (not part of Sprint 4)">${ic('sidebar')}</button><div class="ads-tabbar-ipad__tabs">${Object.keys(TAB_ICONS).map(t => `<a class="ads-tabbar-ipad__tab" href="#" data-a="tab" data-tab="${t}" ${n.tab === t ? 'aria-current="page"' : ''}>${tabLabel(t)}</a>`).join('')}</div></nav>
    <div class="ads-row" style="--ads-row-gap:8px;flex-wrap:nowrap"><button class="ads-icon-btn ads-icon-btn--round" type="button" data-a="open-inbox" aria-label="Notification Inbox, 2 unread">${ic('email')}<span class="ads-icon-btn__dot"></span></button><button class="ads-appheader__account" style="flex:none" type="button" data-a="open-account" aria-label="Account${d.signedIn ? ': Alex Rivera' : ', signed out'}">${d.signedIn ? '<span class="ads-avatar">AR</span>' : `<span class="ads-avatar" style="background:var(--ads-background-surface-sunken);color:var(--ads-content-icon-primary)">${ic('person')}</span>`}</button></div></header>`;
}

// A pane = nav bar + optional offline banner + scrolling body + optional pinned footer.
// Screens return { title, body, foot, kind: 'root'|'push'|'editor', save, wide, noBack }.
function navbar(o, ri, ctx) {
  let lead = '', trail = '';
  const close = `<button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="${ctx.cover ? 'cover-cancel' : ctx.nested ? 'back' : 'close'}" aria-label="Close${ctx.nested ? ' ' + esc(o.title) : ''}">${ic('close', 'ads-icon--sm')}</button>`;
  if (o.kind === 'editor') {
    lead = `<button class="ads-navbar__btn" type="button" data-a="${o.cancelA || 'back'}">Cancel</button>`;
    if (o.save) trail = o.save.busy ? `<button class="ads-navbar__btn ads-navbar__btn--strong" type="button" aria-busy="true" disabled>${ic('spinner-static', 'ads-icon--sm')}Saving</button>` : `<button class="ads-navbar__btn ads-navbar__btn--strong" type="button" data-a="${o.save.a}" ${o.save.disabled ? 'disabled aria-describedby="nosave-' + ri + '"' : ''}>${o.save.label || 'Save'}</button>`;
  } else {
    if (ri > 0 && !ctx.hideBack) lead = `<button class="ads-navbar__btn" type="button" data-a="back" aria-label="Back to ${esc(ctx.parentTitle || 'previous screen')}">${ic('chevron-left')}<span>Back</span></button>`;
    if (ctx.showClose) trail = close;
  }
  if (ctx.cover && o.kind !== 'editor') lead = `<button class="ads-navbar__btn" type="button" data-a="cover-cancel">Cancel</button>`;
  return `<div class="ads-navbar"><div class="ads-navbar__lead">${lead}</div><h2 class="ads-navbar__title${o.srTitle ? ' ads-sr-only' : ''}" tabindex="-1" ${o.srTitle ? '' : 'data-title'} id="t-${ri}">${esc(o.title)}</h2><div class="ads-navbar__trail">${trail}</div></div>`;
}
function offlineBanner(what) { return V().net === 'offline' ? `<div class="ads-banner" role="status">${ic('alert-triangle')}<span>You’re offline. ${what}</span></div>` : ''; }
function paneHtml(r, ri, ctx) {
  const o = SCR[r.s](r, ri);
  const body = typeof o.body === 'string' ? o.body : '';
  return `<section class="pane${o.wide ? ' pane--wide' : ''}${o.cls ? ' ' + o.cls : ''}" data-ri="${ri}" aria-labelledby="t-${ri}">${navbar(o, ri, ctx)}${o.banner === false ? '' : offlineBanner(o.offlineText || 'You can view everything here. Saving needs a connection.')}<div class="pane__scroll" data-scroll="p${ri}-${r.s}"><div class="pane__body">${body}</div></div>${o.foot ? `<div class="pane__foot">${o.foot}</div>` : ''}</section>`;
}
function renderSheet(sh, covered) {
  const st = sh.stack, n = st.length, ipad = IPAD();
  const splitOK = ipad && n >= 2 && SPLIT_PARENT(st[n - 2], st[n - 1]);
  let panes = '', cls = 'psheet';
  // V3 booking: the Fare Finder stays underneath and each picker opens as a rounded sheet over it
  if (TB.v === 3 && sh.id === 'booking') {
    const top = st[n - 1], nested = n > 1;
    const base = paneHtml(st[0], 0, { showClose: true });
    const nest = nested ? `<div class="nest-layer"><div class="nest-scrim" data-a="back" aria-hidden="true"></div><div class="psheet-nest" role="dialog" aria-modal="true" aria-labelledby="t-${n - 1}">${paneHtml(top, n - 1, { nested: true, showClose: true, hideBack: n === 2, parentTitle: titleOf(st[n - 2], n - 2) })}</div></div>` : '';
    return `<div class="sheet-layer" ${covered ? 'inert' : ''}><div class="sheet-scrim" data-a="scrim" aria-hidden="true"></div><div class="psheet psheet--clear" role="dialog" aria-modal="true" aria-label="New Booking" ${nested ? 'inert' : ''}>${ipad ? '' : '<span class="ads-sheet__grabber" aria-hidden="true"></span>'}<div class="psheet__panes">${base}</div></div>${nest}</div>`;
  }
  if (splitOK) {
    cls += ' psheet--split';
    panes = paneHtml(st[n - 2], n - 2, { showClose: true, hideBack: n - 2 === 0, parentTitle: n > 2 ? titleOf(st[n - 3], n - 3) : '' }) + paneHtml(st[n - 1], n - 1, { hideBack: true, parentTitle: titleOf(st[n - 2], n - 2) });
  } else {
    const top = st[n - 1];
    if (ipad && SPLIT_SELF(top)) cls += ' psheet--split';
    panes = paneHtml(top, n - 1, { showClose: true, parentTitle: n > 1 ? titleOf(st[n - 2], n - 2) : '' });
  }
  return `<div class="sheet-layer" ${covered ? 'inert' : ''}><div class="sheet-scrim" data-a="scrim" aria-hidden="true"></div><div class="${cls}" role="dialog" aria-modal="true" aria-label="${sh.id === 'booking' ? 'New Booking' : sh.id === 'inbox' ? 'Notification Inbox' : 'Account'}">${ipad ? '' : '<span class="ads-sheet__grabber" aria-hidden="true"></span>'}<div class="psheet__panes">${panes}</div></div></div>`;
}
function titleOf(r, ri) { const save = NOTES; resetNotes(); const t = SCR[r.s](r, ri).title; NOTES = save; return t; }
function renderCover(c, covered) {
  return `<div class="cover-layer" ${covered ? 'inert' : ''}><div class="pcover" role="dialog" aria-modal="true" aria-labelledby="t-c">${paneHtml({ s: 'verify', p: {}, u: c.u }, 'c', { cover: true })}</div></div>`;
}
function renderDialog(o) {
  return `<div class="dialog-layer"><div class="pdialog ads-modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b"><div class="pdialog__text"><h2 class="ads-h4" id="dlg-t">${esc(o.title)}</h2><p class="ads-body-small" id="dlg-b">${o.body}</p></div><div class="pdialog__actions">${o.actions.map(([l, k], i) => `<button class="ads-btn ads-btn--${k === 'primary' ? '' : k} ads-btn--block" type="button" data-dlg="${i}">${esc(l)}</button>`).join('')}</div></div></div>`;
}

// ---------- Events ----------
const A = {};
const SCR = {};
function routeAt(ri) { if (ri === 'c') return nav().cover; const sh = sheet(); return sh ? sh.stack[+ri] : null; }
function riOf(el) { const p = el.closest('[data-ri]'); return p ? p.dataset.ri : null; }
function wireDevice() {
  const dev = $('#device');
  dev.addEventListener('click', e => {
    const dl = e.target.closest('[data-dlg]');
    if (dl) { const o = nav().dialog, act = o.actions[+dl.dataset.dlg][2]; closeDialog(act); return; }
    const t = e.target.closest('[data-a]'); if (!t) return;
    if (t.tagName === 'A') e.preventDefault();
    if (t.disabled || t.getAttribute('aria-disabled') === 'true') return;
    const fn = A[t.dataset.a]; if (fn) fn(t, riOf(t), e);
  });
  dev.addEventListener('input', e => {
    const t = e.target; if (!t.dataset.f) return;
    const r = inputRoute(t); if (!r) return;
    setDraft(r, t); if (t.dataset.live != null) render();
  });
  dev.addEventListener('change', e => {
    const t = e.target; if (!t.dataset.f) return;
    const r = inputRoute(t); if (!r) return;
    setDraft(r, t);
    const hook = t.dataset.hook && HOOKS[t.dataset.hook]; if (hook) hook(r, t);
    if (t.type === 'text' || t.type === 'tel' || t.type === 'email' || t.type === 'search' || t.type === 'password' || t.tagName === 'TEXTAREA') { if (r.u.touched) r.u.touched[t.dataset.f] = true; setTimeout(render, 0); }
    else render();
  });
  dev.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const n = nav();
    if (n.dialog) { closeDialog(); e.preventDefault(); }
    else if (n.cover) { A['cover-cancel'](); e.preventDefault(); }
    else if (n.sheet) { const top = topR(); if (n.sheet.stack.length > 1) A.back(null, String(n.sheet.stack.length - 1)); else closeSheet(); e.preventDefault(); }
  });
}
// Inputs inside V3's inline Profile editor write to that editor, not to the Profile route
function inputRoute(t) { const ri = riOf(t); const r = routeAt(ri); return t.closest('[data-ri-edit]') && r && r.u.edit ? r.u.edit : r; }
function setDraft(r, t) {
  r.u.d = r.u.d || {};
  const f = t.dataset.f;
  let val = t.type === 'checkbox' ? (t.dataset.multi != null ? toggleIn(r.u.d[f] || [], t.value, t.checked) : t.checked) : t.value;
  if (t.dataset.digits != null) { const clean = String(val).replace(/\D/g, '').slice(0, +t.dataset.digits || 99); if (clean !== t.value && t.type !== 'checkbox') { t.value = clean; } val = clean; }
  if (t.dataset.alpha != null) { const clean = String(val).replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase(); if (clean !== t.value) t.value = clean; val = clean; }
  r.u.d[f] = val; if (t.dataset.nodirty == null) r.u.dirty = true;
}
const toggleIn = (arr, v, on) => on ? [...new Set([...arr, v])] : arr.filter(x => x !== v);
const HOOKS = {};

A.noop = () => {};
A.q = t => { TB.notes = true; renderChrome(); const li = $(`#notes [data-qn="${t.dataset.q}"]`); if (li) { li.classList.add('flash'); li.scrollIntoView({ block: 'nearest' }); setTimeout(() => li.classList.remove('flash'), 1400); } };
A.tab = t => { nav().tab = t.dataset.tab; pendingFocus = `[data-a="tab"][data-tab="${t.dataset.tab}"]`; render(); };
A['open-booking'] = () => openSheet('booking', ['ff'], '[data-a="open-booking"]');
A['open-account'] = () => openSheet('account', ['account'], '[data-a="open-account"]');
A['open-inbox'] = () => openSheet('inbox', ['inbox'], '[data-a="open-inbox"]');
A.close = () => closeSheet();
A.scrim = () => closeSheet();
A.back = (t, ri) => {
  const sh = sheet(), i = +ri;
  const r = sh.stack[i];
  if (r && r.u.dirty && r.u.guard !== false) return confirmDiscard(() => popTo(i - 1));
  popTo(i - 1);
};
A.push = (t, ri) => { const p = t.dataset.p ? JSON.parse(t.dataset.p) : {}; push(t.dataset.s, p, ri == null || ri === 'c' ? null : +ri); };
A.retry = (t, ri) => { let r = routeAt(ri); if (r && r.s === 'profile' && r.u.edit && t.closest('[data-ri-edit]')) r = r.u.edit; if (r && r.u.retry) r.u.retry(); };
A['cancel-busy'] = (t, ri) => { const r = routeAt(ri); if (r) { r.u.busy = null; r.u.alert = { kind: 'custom', tone: 'info', title: 'Cancelled', text: 'Nothing was sent. Your entries are kept.' }; render(); } };
A['cover-cancel'] = () => endVerify(false);
A['clear-recents'] = () => dialog(clearDialog());

// ---------- Toolbar, notes panel, scaling (outside the device) ----------
function renderChrome() {
  setSeg('#tbVersion', String(TB.v)); setSeg('#tbDevice', TB.dev); setSeg('#tbOrient', TB.orient); setSeg('#tbTheme', TB.theme);
  $('#tbText').value = String(TB.text); $('#tbNotes').checked = TB.notes;
  const v = V();
  $('#tbScenario').value = v.sc; $('#tbNet').value = v.net; $('#tbEntry').value = v.entry; $('#tbToken').value = v.token;
  $('#tbFlow').value = FLOWS.flatMap(g => g[1]).some(([k]) => k === locOf()) ? locOf() : '';
  $('#scDesc').textContent = SCENARIOS.find(s => s[0] === v.sc)[2];
  const notes = $('#notes');
  const qs = [...NOTES.qs].sort((a, b) => a - b);
  notes.innerHTML = `<p class="nlabel">Version ${TB.v} · ${VERSION_NAMES[TB.v]}</p><p class="nsmall">${VERSION_LINES[TB.v]}</p>
    <p class="nlabel">Location</p><p class="nsmall">${esc(locLabel())}</p>
    ${NOTES.refs.size ? `<p class="nlabel">Stories on this screen</p><p class="nsmall">${[...NOTES.refs].map(r => 'NMA-' + r).join(' · ')}</p>` : ''}
    ${qs.length ? `<p class="nlabel">Open questions here</p><ul class="nlist">${qs.map(n => `<li data-qn="${n}"><b>Q${n} · ${esc(QUESTIONS[n][0])}.</b> ${esc(QUESTIONS[n][1])}</li>`).join('')}</ul>` : ''}
    ${NOTES.prov.size ? `<p class="nlabel">Provisional</p><ul class="nlist">${[...NOTES.prov].map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${NOTES.tips.size ? `<p class="nlabel">Try</p><ul class="nlist">${[...NOTES.tips].map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`;
  scaleDevice();
}
function locLabel() { const l = locOf(); for (const [g, items] of FLOWS) for (const [k, label] of items) if (k === l) return `${g} › ${label}`; return l; }
const VERSION_NAMES = { 1: 'Familiar & direct', 2: 'Guided & focused', 3: 'CLEAR-inspired Fare Finder · quick editing' };
const VERSION_LINES = { 1: 'Follows Core Flow. Lists open focused editors with Cancel and Save. On iPad the parent stays on the left and the editor opens on the right.', 2: 'Shows one decision at a time, explains dependencies before they cause errors, and skips steps that don’t apply. On iPad a step rail sits beside the question.', 3: 'Fare Finder: a navy header with the booking-mode controls over a rounded light surface; stations, dates, travelers, codes and assistance open in rounded sheets over it. It also carries the Sprint 4 Fare Finder variants: traveler types, discount codes, Use Points, TripLink and Pass Rider. Profile: summaries you edit in place.' };
function setSeg(sel, v) { $$(sel + ' button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
function scaleDevice() {
  const dev = $('#device'), stage = $('#stage'); if (!dev || !stage) return;
  const dims = { iphone: [390, 844], ipad: [834, 1194] }[TB.dev];
  const [w, h] = TB.orient === 'portrait' ? dims : [dims[1], dims[0]];
  dev.style.width = w + 'px'; dev.style.height = h + 'px';
  const availW = stage.clientWidth - 16, availH = Math.max(420, window.innerHeight - stage.getBoundingClientRect().top - 24);
  const s = Math.min(1, availW / w, availH / h);
  dev.style.transform = `scale(${s})`;
  $('#deviceBox').style.width = (w * s) + 'px'; $('#deviceBox').style.height = (h * s) + 'px';
}
function wireToolbar() {
  const seg = (sel, fn) => $(sel).addEventListener('click', e => { const b = e.target.closest('button'); if (b) fn(b.dataset.v); });
  seg('#tbVersion', v => { const loc = locOf(); TB.v = +v; if (locOf() !== loc) goLoc(loc); else render(); store.set('s4-v', v); });
  seg('#tbDevice', v => { TB.dev = v; store.set('s4-dev', v); render(); });
  seg('#tbOrient', v => { TB.orient = v; render(); });
  seg('#tbTheme', v => { TB.theme = v; render(); });
  $('#tbText').addEventListener('change', e => { TB.text = +e.target.value; render(); });
  $('#tbNotes').addEventListener('change', e => { TB.notes = e.target.checked; render(); });
  $('#tbFlow').addEventListener('change', e => { if (e.target.value) goLoc(e.target.value); });
  $('#tbScenario').addEventListener('change', e => { const loc = locOf(); const v = V(); const keep = { net: v.net, entry: v.entry, token: v.token }; VS[TB.v] = Object.assign(makeVS(e.target.value), keep); goLoc(loc.startsWith('verify') ? 'tab:book' : loc); });
  $('#tbNet').addEventListener('change', e => { V().net = e.target.value; render(); });
  $('#tbEntry').addEventListener('change', e => { V().entry = e.target.value; const loc = locOf(); goLoc(loc); });
  $('#tbToken').addEventListener('change', e => { V().token = e.target.value; render(); });
  $('#tbReset').addEventListener('click', () => { VS = { 1: makeVS(), 2: makeVS(), 3: makeVS() }; goLoc('tab:book'); toast('Demo reset: all three versions are back to the default scenario', 'info'); });
  $$('#viewTabs button').forEach(b => b.addEventListener('click', () => { TB.tab = b.dataset.v; $$('#viewTabs button').forEach(x => x.setAttribute('aria-selected', String(x === b))); $('#protoView').hidden = TB.tab !== 'proto'; $('#handoffView').hidden = TB.tab !== 'handoff'; if (TB.tab === 'proto') scaleDevice(); }));
  window.addEventListener('resize', scaleDevice);
  // Fill selects
  $('#tbScenario').innerHTML = SCENARIOS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
  $('#tbNet').innerHTML = NETWORKS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
  $('#tbFlow').innerHTML = '<option value="">Jump to a flow…</option>' + FLOWS.map(([g, items]) => `<optgroup label="${esc(g)}">${items.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</optgroup>`).join('');
}
