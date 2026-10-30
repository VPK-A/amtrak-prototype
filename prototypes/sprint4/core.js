/* Sprint 4 prototype: state, routing, rendering shell, network mock, toolbar. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, cls = '') => `<span class="ads-icon ads-icon--${n}${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
const clone = o => JSON.parse(JSON.stringify(o));
// Motion tokens (Amtrak mobile motion system). Starting values inside the proposed ranges; tune on devices.
const MT = { tap: 100, control: 200, panel: 280, shared: 360, close: 260, stagger: 35, fade: 120 };
const EASE = { standard: 'cubic-bezier(0.2, 0, 0, 1)', settle: 'cubic-bezier(0.22, 1, 0.36, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

// ---------- Dates (stored as YYYY-MM-DD) ----------
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
// Fare Finder summaries show day name, month, day and year (NMA-1060 AC8)
const fmtShortY = s => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtShort = s => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtDate = s => parse(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const fmtWeekday = s => parse(s).toLocaleDateString('en-US', { weekday: 'long' });
const TODAY_S = iso(TODAY);

// ---------- Toolbar state (shared) and per-version state ----------
const TB = { v: 1, dev: 'iphone', orient: 'portrait', text: 100, notes: false, theme: 'light', tab: 'proto' };
const blankAssist = () => ({ cat: null, dis: [], wc: null, needs: [] });
const PR_ROLE = { 'passrider-spouse': 'spouse', 'passrider-dependent': 'dependent', 'passrider-minor': 'dependent', 'passrider-retiree': 'retiree' };
function seed(sc) {
  const intl = sc === 'intl';
  const d = {
    signedIn: sc !== 'guest', verified: sc !== 'unverified',
    profile: {
      first: 'Alex', last: 'Rivera', mi: sc === 'mi' ? 'J' : '', agr: '7012345678', email: 'alex.rivera@example.com',
      phone: intl ? { region: 'intl', mobile: '', home: '', business: '', ext: '', cc: 'GB', intl: '7700900123' } : { region: 'us', mobile: '2155550147', home: '', business: '', ext: '', cc: 'GB', intl: '' },
      address: intl ? { country: 'GB', street: '221 Baker Street', apt: 'Flat B', city: 'London', state: '', zip: 'NW1 6XE' } : { country: 'US', street: '1500 Market Street', apt: 'Apt 4B', city: 'Philadelphia', state: 'Pennsylvania', zip: '19102' },
      dob: sc === 'passrider-dependent' ? '03/12/2009' : sc === 'passrider-minor' ? '06/02/2012' : ''
    },
    discount: sc === 'assist' ? { type: 'pwd', rpa: '' } : sc === 'rpa' ? { type: 'rpa', rpa: '4815162' } : { type: 'none', rpa: '' },
    assist: sc === 'assist' ? { cat: 'disability', dis: ['mobility'], wc: true, needs: ['station', 'seat'] } : blankAssist(),
    fav: sc === 'new' ? [] : ['NYP'],
    // Fare Finder variants (all versions): TripLink (NMA-622), Pass Rider (NMA-623, 1016–1019), profile codes (NMA-613, 697)
    triplink: sc === 'triplink',
    passrider: sc.startsWith('passrider') ? { role: PR_ROLE[sc] || 'employee', business: sc === 'passrider', compLeft: sc === 'passrider' ? 5 : 0, minor: sc === 'passrider-minor' } : null,
    coupons: ['guest', 'new'].includes(sc) ? [] : clone(PROFILE_CODES),
    couponsPast: ['guest', 'new'].includes(sc) ? [] : clone(PAST_CODES),
    // Amtrak employee pass details in profile (NMA-20). Pass Rider scenarios start with them saved.
    employee: sc.startsWith('passrider') ? { rel: PR_ROLE[sc] || 'employee', pass: '418200774', index: { 'passrider-spouse': '002', 'passrider-dependent': '003', 'passrider-minor': '004' }[sc] || '001' } : null,
    rec: sc === 'new' ? [] : [{ c: 'WAS', d: 2 }, { c: 'PHL', d: 5 }, { c: 'BOS', d: 9 }, { c: 'BAL', d: 12 }],
    // Past trips for Book again on the Book landing (mock; none for new members or guests)
    history: ['new', 'guest'].includes(sc) ? [] : [{ from: 'NYP', to: 'WAS', date: '2026-10-12', train: 'Northeast Regional 171' }, { from: 'CHI', to: 'EMY', date: '2026-08-30', train: 'California Zephyr 5' }]
  };
  d.booking = freshBooking(d);
  return d;
}
// Booking assistance isn't prefilled from the profile while NMA-614 is open (Q7). A disability saved in the
// profile still sets Traveler 1's discount to PWD (NMA-612 BR6); other profile discounts carry over too.
const profilePwd = () => { const d = D(); return d.signedIn && (d.discount.type === 'pwd' || d.assist.cat === 'disability'); };
function freshBooking(d) {
  return {
    trip: 'ow', from: null, to: null, dep: TODAY_S, ret: null,
    disc: d.signedIn && ['military', 'rpa'].includes(d.discount.type) ? d.discount.type : 'none',
    assistOn: false, assist: blankAssist(), assistDone: false, assistFromProfile: false, notice: null,
    // Version 3 Fare Finder fields
    pax: { adult: 1, senior: 0, ya: 0, youth: 0, child: 0, infant: 0 }, tdisc: {}, pay: 'cash',
    intent: d.signedIn && d.triplink ? 'corporate' : d.signedIn && d.passrider && prCanStart(d).ok ? 'pr' : 'standard',
    prType: d.passrider && !d.passrider.business ? 'leisure' : null, prPax: { me: true, fam: 0, dep: 0, comp: 0 }, prKinds: {},
    code: null, codeText: '', codeState: '', codeSig: '', codeTries: 0, codeErr: '', modeNote: null
  };
}
const makeVS = (sc = 'returning') => ({ sc, net: 'online', entry: 'ff', token: 'valid', data: seed(sc), nav: { tab: 'book', sheet: null, cover: null, dialog: null }, toast: null });
let VS = { 1: makeVS(), 2: makeVS(), 3: makeVS(), 4: makeVS() };
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
// Question markers are never shown in the prototype; the question is still recorded for this screen
function q(n) { NOTES.qs.add(n); return ''; }

// ---------- Navigation ----------
let pendingFocus = null;
const sheet = () => nav().sheet;
const topR = () => { const s = sheet(); return s && s.stack[s.stack.length - 1]; };
function openSheet(id, stack, opener) { nav().sheet = { id, stack: stack.map(x => typeof x === 'string' ? R(x) : x), opener }; pendingFocus = 'title'; render(); }
// Child screens remember what opened them: closing one returns focus to that control, and its parent's
// scroll position is kept (SCROLL_MEM), so Back never jumps to the top of the parent
let LAST_TRIGGER = null;
const SCROLL_MEM = {};
function openerSel(el) {
  if (!el || !el.isConnected || !el.closest('#device')) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  if (el.dataset.k) return `[data-k="${el.dataset.k}"]`;
  if (!el.dataset.a) return null;
  return `[data-a="${el.dataset.a}"]` + ['s', 't', 'field', 'topic', 'code'].filter(k => el.dataset[k]).map(k => `[data-${k}="${CSS.escape(el.dataset[k])}"]`).join('');
}
const forgetScroll = (r, i) => { delete SCROLL_MEM[`p${i}-${r.s}`]; };
function push(s, p = {}, fromIdx) { const sh = sheet(); if (fromIdx != null && fromIdx >= 0) sh.stack.slice(fromIdx + 1).forEach((r, j) => forgetScroll(r, fromIdx + 1 + j)), sh.stack = sh.stack.slice(0, fromIdx + 1); const r = R(s, p); r.opener = openerSel(LAST_TRIGGER); forgetScroll(r, sh.stack.length); sh.stack.push(r); pendingFocus = 'title'; render(); }
function replaceTop(s, p = {}) { const sh = sheet(), old = sh.stack[sh.stack.length - 1], r = R(s, p); r.opener = old && old.opener; forgetScroll(old, sh.stack.length - 1); sh.stack[sh.stack.length - 1] = r; pendingFocus = 'title'; render(); }
function popTo(i) { const sh = sheet(); if (i < 0) return closeSheet(); const gone = sh.stack.slice(i + 1); gone.forEach((r, j) => forgetScroll(r, i + 1 + j)); sh.stack = sh.stack.slice(0, i + 1); pendingFocus = (gone[0] && gone[0].opener) || 'title'; render(); }
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
  if (n.info) { const i = n.info; n.info = null; const base = locOf(); n.info = i; return base + '|info:' + i.stack.join('>'); }
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
    case 'coupons': return 'coupons';
    case 'rules': return 'rules';
    case 'assist-profile': return 'assist-profile';
    case 'inbox': return 'tab:' + n.tab;
    default: return 'account';
  }
}
function goLoc(loc) {
  if (loc.includes('|info:')) { const [base, path] = loc.split('|info:'); goLoc(base); const [first, ...more] = path.split('>'); openInfo(first, null, true); nav().info.stack.push(...more); render(); return; }
  const v = V(), d = v.data, b = d.booking, v3 = TB.v === 3; // V3 edits Profile in place; its booking uses sheets like V1
  v.nav.cover = null; v.nav.dialog = null; v.nav.sheet = null; v.nav.info = null; v.toast = null;
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
    // Version 2 answers dates and travelers inside its guided sections
    case 'calendar': if (TB.v === 2) { if (arg === 'ret' && b.trip === 'ow') { b.trip = 'rt'; b.ret = b.dep; } booking([]); Object.assign(v.nav.sheet.stack[0].u, { open: 'when', picking: arg }); break; } booking([R('calendar', { field: arg })]); break;
    case 'travelers': if (TB.v === 2) { booking([]); v.nav.sheet.stack[0].u.open = 'who'; break; } booking([R('travelers')]); break;
    case 'code': booking([R('code')]); break;
    case 'handoff': sampleRoute(); booking([R('handoff')]); break;
    case 'assist-booking': case 'assist-review': {
      if (k === 'assist-review') sampleAssist(); else b.assistOn = true;
      const viaT = v.entry === 'travelers';
      if (TB.v !== 2) {
        if (k === 'assist-review') { booking(viaT ? [R('travelers')] : []); const st = v.nav.sheet.stack; st[st.length - 1].u.reviewFocus = true; }
        else booking(viaT ? [R('travelers'), R('assist')] : [R('assist')]);
      } else { const a = R('assist'); if (k === 'assist-review') a.u.step = 'review'; booking([a]); v.nav.sheet.stack[0].u.open = 'who'; }
      break;
    }
    case 'clear-recents': account([]); v.nav.dialog = clearDialog(); break;
    case 'account': account([]); break;
    case 'profile': if (guestBlocked()) break; account([R('profile')]); break;
    case 'edit': if (guestBlocked()) break; if (v3) { account([R('profile')]); v.nav.sheet.stack[1].u.inline = arg; } else account([R('profile'), R('edit', { field: arg })]); break;
    case 'discounts': if (guestBlocked()) break; account([R('profile'), R('discounts')]); break;
    case 'coupons': if (guestBlocked()) break; account([R('profile'), R('coupons')]); break;
    case 'rules': if (guestBlocked()) break; account([R('profile'), R('discounts')]); v.nav.info = { stack: ['rules'], returnFocus: '[data-topic="rules"]' }; break;
    case 'assist-profile': if (guestBlocked()) break; account([R('assist-profile')]); break;
    case 'v1': case 'v2': case 'v3': case 'v4': {
      // Version 3 and 4 demo entries: "v3:<scenario>:<place>"
      const [, sc, place] = loc.split(':'), n = +k[1];
      TB.v = n; store.set('s4-v', String(n));
      const keep = { net: 'online', entry: VS[n].entry, token: VS[n].token };
      VS[n] = Object.assign(makeVS(sc), keep);
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
    if (net === 'error') { if (opts.onError && opts.onError()) { render(); return; } r.u.alert = { kind: 'error', what: opts.what || 'save your changes' }; render(); return; }
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
  return r.u.busy ? `<div class="busyrow"><button class="ads-btn ads-btn--block" type="button" aria-busy="true" disabled>${ic('spinner-static')}${busyLabel}</button><button class="ads-btn ads-btn--tertiary ads-btn--sm busy-cancel" type="button" data-a="cancel-busy">Cancel</button></div>`
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
  return { id: 'clear', title: 'Clear recent stations?', body: 'All recent stations will be removed.', returnFocus: '[data-a="clear-recents"]',
    actions: [['Cancel', 'secondary', null], ['Confirm', 'destructive', () => { D().rec = []; toast('Recent stations cleared'); }]] };
}

// ---------- Rendering shell ----------
var render = function () {
  const dev = $('#device'); if (!dev) return;
  resetNotes();
  const ae = document.activeElement, keep = ae && dev.contains(ae) ? openerSel(ae) : null; // any control, so focus survives redraws
  const keepTitle = !!(ae && dev.contains(ae) && ae.matches('[data-title], .ads-navbar__title, .info-title'));
  const sel = ae && ae.id && 'selectionStart' in ae ? [ae.selectionStart, ae.selectionEnd] : null;
  $$('[data-scroll]', dev).forEach(e => { if (!e.closest('.navstage__under')) SCROLL_MEM[e.dataset.scroll] = e.scrollTop; });
  dev.className = `device device--${TB.dev} device--${TB.orient} ver-${TB.v}${TB.text > 100 ? ' text-large' : ''} notes-off`;
  dev.dataset.theme = TB.theme;
  // Booking is a modal flow: the app's bottom navigation is hidden while it's open
  if (nav().sheet && nav().sheet.id === 'booking') dev.classList.add('has-booking');
  dev.innerHTML = renderDevice();
  dev.style.setProperty('--text-zoom', TB.text / 100);
  // Closed layers start fresh next time; open ones get their scroll back, even after a child screen
  const n0 = nav(); for (const k of Object.keys(SCROLL_MEM)) if ((!n0.sheet && /^p\d/.test(k)) || (!n0.info && k.startsWith('info-'))) delete SCROLL_MEM[k];
  $$('[data-scroll]', dev).forEach(e => { const t = SCROLL_MEM[e.dataset.scroll]; if (t != null) e.scrollTop = t; });
  let target = null;
  if (!pendingFocus && keepTitle) pendingFocus = 'title'; // focus was on a screen title: keep it on the (new) title
  if (pendingFocus === 'title') target = $$('[data-title]', dev).filter(e => !e.closest('[inert]')).pop() || $$('.pane--focus #ss-q', dev).filter(e => !e.closest('[inert]')).pop(); // a focused view starts in its field
  else if (pendingFocus) target = $(pendingFocus, dev);
  else if (keep) target = $(keep, dev);
  if (target) { target.focus({ preventScroll: pendingFocus === null }); if (sel && target.id && '#' + CSS.escape(target.id) === keep && target.setSelectionRange) try { target.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
  pendingFocus = null;
  renderChrome();
}
function renderDevice() {
  const n = nav(), overlay = !!(n.sheet || n.cover || n.dialog || n.info);
  let h = `<div class="dev-status" aria-hidden="true"><span>9:41</span><span class="dev-status__right">${ic('wifi', 'ads-icon--sm')}<span class="dev-batt"></span></span></div>`;
  h += `<div class="app app--${n.tab}" ${overlay ? 'inert' : ''}>${IPAD() ? ipadNav() : appHeader()}<main class="app-main" data-scroll="main" aria-label="${esc(tabLabel(n.tab))}">${TABS[n.tab]()}</main>${IPAD() ? '' : tabBar()}</div>`;
  if (n.sheet) h += renderSheet(n.sheet, !!(n.cover || n.dialog || n.info));
  if (n.cover) h += renderCover(n.cover, !!(n.dialog || n.info));
  if (n.info) h += renderInfo(n.info, !!n.dialog);
  if (n.dialog) h += renderDialog(n.dialog);
  const t = V().toast;
  h += `<div class="toast-wrap" role="status" aria-live="polite">${t ? `<div class="ads-toast ads-toast--${t.kind}">${ic(t.kind === 'success' ? 'check-circle' : 'info-circle')}<span>${esc(t.msg)}</span></div>` : ''}</div>`;
  return h;
}
const tabLabel = t => ({ book: 'Book', trips: 'Trips', 'train-status': 'Train status', support: 'Support' }[t]);
const TAB_ICONS = { book: 'search', trips: 'payment-voucher', 'train-status': 'train', support: 'question-circle' };
function appHeader() {
  const d = D();
  const who = d.signedIn ? `<span class="ads-avatar">AR</span><span><span class="ads-appheader__name">Hi, Alex</span><span class="ads-appheader__meta">Select Plus · 12,450 pts</span></span>` : `<span class="ads-avatar" style="background:var(--ads-background-surface-sunken);color:var(--ads-content-icon-primary)">${ic('person')}</span><span><span class="ads-appheader__name">Sign in</span><span class="ads-appheader__meta">Guest</span></span>`;
  return `<header class="ads-appheader"><button class="ads-appheader__account" type="button" data-a="open-account" aria-label="Account${d.signedIn ? ': Alex Rivera' : ', signed out'}">${who}</button><button class="ads-icon-btn ads-icon-btn--round" type="button" data-a="open-inbox" aria-label="Notification inbox, 2 unread">${ic('email')}<span class="ads-icon-btn__dot"></span></button></header>`;
}
function tabBar() {
  const n = nav();
  return `<nav class="ads-tabbar app-tabbar" aria-label="App"><div class="ads-tabbar__tabs ads-glass">${Object.keys(TAB_ICONS).map(t => `<a class="ads-tabbar__tab" href="#" data-a="tab" data-tab="${t}" ${n.tab === t ? 'aria-current="page"' : ''}>${ic(TAB_ICONS[t])}<span>${tabLabel(t)}</span></a>`).join('')}</div></nav>`;
}
function ipadNav() {
  const n = nav(), d = D();
  return `<header class="ads-ipad-nav app-ipadnav"><span class="ipad-logo" role="img" aria-label="Amtrak">__LOGO_H__</span>
    <nav class="ads-tabbar-ipad ads-glass" aria-label="App"><div class="ads-tabbar-ipad__tabs">${Object.keys(TAB_ICONS).map(t => `<a class="ads-tabbar-ipad__tab" href="#" data-a="tab" data-tab="${t}" ${n.tab === t ? 'aria-current="page"' : ''}>${tabLabel(t)}</a>`).join('')}</div></nav>
    <div class="ads-row" style="--ads-row-gap:8px;flex-wrap:nowrap"><button class="ads-icon-btn ads-icon-btn--round" type="button" data-a="open-inbox" aria-label="Notification inbox, 2 unread">${ic('email')}<span class="ads-icon-btn__dot"></span></button><button class="ads-appheader__account" style="flex:none" type="button" data-a="open-account" aria-label="Account${d.signedIn ? ': Alex Rivera' : ', signed out'}">${d.signedIn ? '<span class="ads-avatar">AR</span>' : `<span class="ads-avatar" style="background:var(--ads-background-surface-sunken);color:var(--ads-content-icon-primary)">${ic('person')}</span><span class="ipad-signin">Sign in</span>`}</button></div></header>`;
}

// A pane = nav bar + optional offline banner + scrolling body + optional pinned footer.
// Screens return { title, body, foot, kind: 'root'|'push'|'editor', save, wide, noBack }.
function navbar(o, ri, ctx) {
  if (o.kind === 'focus') return `<div class="ads-navbar ads-navbar--focus"><h2 class="ads-sr-only" tabindex="-1" id="t-${ri}">${esc(o.title)}</h2></div>`;
  let lead = '', trail = '';
  const close = `<button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="${ctx.cover ? 'cover-cancel' : ctx.nested ? 'back' : 'close'}" aria-label="Close${ctx.nested ? ' ' + esc(o.title) : ''}">${ic('close', 'ads-icon--sm')}</button>`;
  if (o.kind === 'editor') {
    lead = `<button class="ads-navbar__btn" type="button" data-a="${o.cancelA || 'back'}">Cancel</button>`;
    if (o.close && !o.save && ctx.showClose) trail = close; // an editor step inside a flow: Cancel undoes it, X still closes the flow
    else if (o.save) trail = o.save.busy ? `<button class="ads-navbar__btn ads-navbar__btn--strong" type="button" aria-busy="true" disabled>${ic('spinner-static', 'ads-icon--sm')}Saving</button>` : `<button class="ads-navbar__btn ads-navbar__btn--strong" type="button" data-a="${o.save.a}" ${o.save.disabled ? 'disabled aria-describedby="nosave-' + ri + '"' : ''}>${o.save.label || 'Save'}</button>`;
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
// Second-level screens are pushed inside the same sheet (iOS navigation): the new screen slides in from
// the right and Back slides it out. While the slide runs, the screen it replaces stays underneath (inert).
const NAV_MS = MT.panel;
let navAnimT;
function renderSheet(sh, covered) {
  const st = sh.stack, n = st.length, ipad = IPAD();
  const splitOK = ipad && n >= 2 && SPLIT_PARENT(st[n - 2], st[n - 1]);
  const top = st[n - 1], selfSplit = ipad && SPLIT_SELF(top);
  let cls = 'psheet' + (TB.v === 3 && sh.id === 'booking' ? ' psheet--clear' : TB.v === 4 && sh.id === 'booking' ? ' psheet--fl' : '');
  if (n > 1) cls += ' psheet--pushed';
  // Which way to slide: compare with the depth and top screen at the last render
  const replaced = sh._n === n && sh._top && sh._top !== top;
  if (sh._n != null && (sh._n !== n || replaced) && !splitOK && !selfSplit && !sh._split) {
    sh._anim = { dir: n >= sh._n ? 'fwd' : 'back', under: replaced ? [sh._top, n - 1] : n > sh._n ? [st[n - 2], n - 2] : [sh._top, sh._n - 1], start: Date.now(), until: Date.now() + NAV_MS };
    clearTimeout(navAnimT); navAnimT = setTimeout(() => { if (sh._anim && Date.now() >= sh._anim.until - 5) { sh._anim = null; render(); } }, NAV_MS + 10);
  }
  if (sh._anim && Date.now() >= sh._anim.until) sh._anim = null;
  sh._n = n; sh._top = top; sh._split = splitOK || selfSplit;
  let panes;
  if (splitOK) {
    cls += ' psheet--split';
    panes = paneHtml(st[n - 2], n - 2, { showClose: true, hideBack: n - 2 === 0, parentTitle: n > 2 ? titleOf(st[n - 3], n - 3) : '' }) + paneHtml(st[n - 1], n - 1, { hideBack: true, parentTitle: titleOf(st[n - 2], n - 2) });
  } else {
    if (selfSplit) cls += ' psheet--split';
    const a = sh._anim;
    const current = paneHtml(top, n - 1, { showClose: true, parentTitle: n > 1 ? titleOf(st[n - 2], n - 2) : '' });
    if (a && a.under[0]) {
      const [ur, uri] = a.under;
      const under = `<div class="navstage__under nav-${a.dir}" inert aria-hidden="true">${paneHtml(ur, uri, { showClose: true, parentTitle: uri > 0 ? titleOf(st[uri - 1] || ur, uri - 1) : '' }).replace(/ (id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, '').replace(/data-title/g, '')}</div>`; // no duplicate ids while the copy is underneath
      panes = `<div class="navstage navstage--${a.dir}">${a.dir === 'fwd' ? under : ''}<div class="navstage__top nav-${a.dir}">${current}</div>${a.dir === 'back' ? under : ''}</div>`;
    } else panes = current;
  }
  const label = sh.id === 'booking' ? 'New booking' : sh.id === 'inbox' ? 'Notification inbox' : 'Account';
  return `<div class="sheet-layer" ${covered ? 'inert' : ''}><div class="sheet-scrim" data-a="scrim" aria-hidden="true"></div><div class="${cls}" role="dialog" aria-modal="true" aria-label="${label}">${ipad ? '' : '<span class="ads-sheet__grabber" aria-hidden="true"></span>'}<div class="psheet__panes">${panes}</div></div></div>`;
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
    LAST_TRIGGER = t;
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
    else if (n.info) { A[n.info.stack.length > 1 ? 'info-back' : 'info-close'](); e.preventDefault(); }
    else if (n.cover) { A['cover-cancel'](); e.preventDefault(); }
    else if (n.sheet) { const top = topR(), i = String(n.sheet.stack.length - 1), cancel = cancelActionFor(top); if (n.sheet.stack.length > 1) (cancel ? A[cancel] : A.back)(null, i); else closeSheet(); e.preventDefault(); }
  });
}
// Inputs inside V3's inline Profile editor write to that editor, not to the profile route
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
  $('#tbScenario').value = V().sc;
  scaleDevice();
}
function locLabel() { const l = locOf(); for (const [g, items] of FLOWS) for (const [k, label] of items) if (k === l) return `${g} › ${label}`; return l; }
const VERSION_NAMES = { 1: 'Familiar', 2: 'Guided', 3: 'Overview', 4: 'Compact' };
// Stakeholder feedback: Concepts 1 and 3 are advanced and reviewed; 2 and 4 are archived (still usable from Archive)
const REVIEWED = [1, 3], ARCHIVED = [2, 4];
const VERSION_LINES = { 1: 'Follows Core Flow. Lists open focused editors with Cancel and Save. On iPad the parent stays on the left and the editor opens on the right.', 2: 'Shows one decision at a time, explains dependencies before they cause errors, and skips steps that don’t apply. On iPad a step rail sits beside the question.', 3: 'Fare Finder: a navy header with the booking-mode controls over a rounded light surface; stations, dates and travelers open in rounded sheets over it; the discount code sits on the surface. It also carries the Sprint 4 Fare Finder variants: traveler types, discount codes, Use points, TripLink and Pass Rider. Profile: summaries you edit in place.', 4: 'Fare Finder: a white rounded sheet with a large “Find a train” heading, compact station and date controls, and aligned rows for travelers, assistance, discounts and codes, each with its own Edit action. Booking modes sit in context under the heading. Stations, dates and traveler details open in focused sheets. Profile and Account work as in Version 1.' };
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
  // Switching concept keeps the current scenario: the other concept's data is reloaded with it if it differs
  seg('#tbVersion', v => { const loc = locOf(), cur = V(); TB.v = +v; if (V().sc !== cur.sc) VS[TB.v] = Object.assign(makeVS(cur.sc), { net: cur.net, entry: cur.entry, token: cur.token }); if (locOf() !== loc) goLoc(loc); else render(); store.set('s4-v', v); });
  seg('#tbDevice', v => { TB.dev = v; store.set('s4-dev', v); render(); });
  seg('#tbOrient', v => { TB.orient = v; render(); });
  seg('#tbTheme', v => { TB.theme = v; render(); });
  $('#tbScenario').addEventListener('change', e => { const loc = locOf(); const v = V(); const keep = { net: v.net, entry: v.entry, token: v.token }; VS[TB.v] = Object.assign(makeVS(e.target.value), keep); goLoc(loc.startsWith('verify') ? 'tab:book' : loc); });
  $('#tbReset').addEventListener('click', () => { VS = { 1: makeVS(), 2: makeVS(), 3: makeVS(), 4: makeVS() }; goLoc('tab:book'); toast('Demo reset: all four versions are back to the default scenario', 'info'); });
  window.addEventListener('resize', scaleDevice);
  $('#tbScenario').innerHTML = SCENARIOS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
}
