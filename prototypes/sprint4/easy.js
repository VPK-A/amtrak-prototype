/* Sprint 4 prototype: Easy Mode.
   A second presentation of the same flows. It reads and writes the same data (V().data) and uses the
   same navigation stack and route names as Standard Mode, so switching modes keeps the task, entries,
   selections and progress. Only how each route is drawn changes, plus a few Easy-only steps that live
   inside existing routes (ff.u.ez, edit.u.ezs). */
const EZ = {};
const SCRF = s => (TB.easy && EZ[s]) || SCR[s];
const EASY_LINE = 'One question per screen, larger controls, plain words, and the trip summary always in view. Optional details sit behind labeled disclosures.';

// ---------- Mode switching ----------
// Rearranges the open stack where the two modes present a task differently, without losing drafts.
function normalizeFor(on) {
  const sh = nav().sheet; if (!sh) return;
  const st = sh.stack, ff = st[0].s === 'ff' ? st[0] : null;
  if (on) {
    // V3 edits in place; Easy gives each editor its own screen
    if (ff && ff.u.inline) {
      const k = ff.u.inline; let r = null;
      if (k.k === 'stations') { r = R('stations', { field: k.field }); r.u.d = ff.u.d || {}; }
      else if (k.k === 'calendar') { r = R('calendar', { field: k.field }); r.u.picking = k.field; }
      else if (k.k === 'travelers') { ff.u.ez = 'who'; ff.u.fromTravelers = R('travelers'); }
      else if (k.k === 'assist') { r = R('assist'); ff.u.ez = 'who'; if (ff.u.d && ff.u.d.cat !== undefined) { r.u.d = ff.u.d; r.u.mode = 'booking'; r.u.dirty = true; } }
      ff.u.inline = null; ff.u.d = {};
      if (r) { if (k.k === 'stations') ff.u.ez = k.field; if (k.k === 'calendar') ff.u.ez = 'when'; st.splice(1, st.length, r); }
    }
    // Traveler Selection is the "Travelers and help" step inside Easy booking
    const ti = st.findIndex((r, i) => i > 0 && r.s === 'travelers');
    if (ti > 0) { const tr = st.splice(ti, 1)[0]; if (ff) { ff.u.ez = 'who'; ff.u.fromTravelers = tr; } }
    if (ff && st[1]) { if (st[1].s === 'stations') ff.u.ez = st[1].p.field; if (st[1].s === 'calendar') ff.u.ez = 'when'; if (st[1].s === 'assist') ff.u.ez = 'who'; }
    const pi = st.findIndex(r => r.s === 'profile');
    if (pi >= 0 && st[pi].u.inline) { const p = st[pi], e = p.u.edit || R('edit', { field: p.u.inline }); p.u.inline = null; p.u.edit = null; st.splice(pi + 1, st.length, e); }
  } else {
    // Came from Traveler Selection and still on that step: put the screen back
    if (ff && ff.u.fromTravelers && ff.u.ez === 'who') {
      if (TB.v === 3) { if (st.length === 1) ff.u.inline = { k: 'travelers' }; }
      else st.splice(1, 0, ff.u.fromTravelers);
    }
    if (ff) ff.u.fromTravelers = null;
    if (TB.v === 1) st.forEach(r => { if (r.s === 'assist' || r.s === 'assist-profile') r.u.step = null; }); // V1 has no steps
  }
  if (!on && TB.v === 3) {
    // Back to V3: pushed editors return to their in-place panels, drafts included
    if (ff && st.length === 2 && ['stations', 'calendar', 'assist'].includes(st[1].s)) {
      const r = st[1];
      ff.u.inline = r.s === 'assist' ? { k: 'assist' } : { k: r.s, field: r.p.field };
      ff.u.d = r.u.d || {}; if (r.s === 'calendar') ff.u.picking = r.p.field;
      st.length = 1;
    }
    const pi = st.findIndex(r => r.s === 'profile');
    if (pi >= 0 && st.length === pi + 2 && st[pi + 1].s === 'edit') { const e = st[pi + 1]; st[pi].u.inline = e.p.field; st[pi].u.edit = e; st.length = pi + 1; }
  }
}
function setEasy(on, fromApp) {
  on = !!on; if (TB.easy === on) return;
  // Every version keeps its own state; rearrange each so switching versions later also lands well
  const keep = TB.v;
  for (const k of [1, 2, 3]) { TB.v = k; normalizeFor(on); }
  TB.v = keep; TB.easy = on; store.set('s4-easy', on ? '1' : '0');
  if (fromApp) { pendingFocus = '#set-easy'; toast(on ? 'Easy Mode is on' : 'Easy Mode is off', 'info'); }
  render();
}
A['easy-toggle'] = t => setEasy(t.checked, true);

// ---------- Small Easy pieces (new components: see HANDOFF.md › Easy Mode) ----------
const ezErr = (id, msg) => msg ? `<p class="ads-helper ads-helper--error ez-err" id="${id}" role="alert">${ic('alert-diamond')}<span>${msg}</span></p>` : '';
// Easy Question: the one thing this screen asks. Focus lands here when the step changes.
const ezQ = (text, sub = '') => `<div class="ez-q"><h3 class="ez-q__title" tabindex="-1" data-title>${text}</h3>${sub ? `<p class="ez-q__sub">${sub}</p>` : ''}</div>`;
// Easy Progress: "Step 2 of 5 · Going to" with a segmented bar
function ezProgress(i, n, name) {
  return `<div class="ez-progress"><p class="ez-progress__count"><span class="ads-steps__count" tabindex="-1">Step ${i + 1} of ${n}</span> · ${esc(name)}</p><div class="ads-steps__bar" aria-hidden="true">${Array.from({ length: n }, (_, j) => `<i class="${j <= i ? 'is-done' : ''}"></i>`).join('')}</div></div>`;
}
// Option Card: a full-width radio or checkbox with a large target. Without data-f it only fires its data-a.
const ezRadio = (name, val, checked, label, sup, attrs = '') => `<label class="ads-choice ads-radio"><input type="radio" name="${name}" value="${esc(val)}" ${checked ? 'checked' : ''} ${attrs}><span class="ads-choice__control"></span><span class="ads-choice__label"><span>${label}</span>${sup ? `<span class="ads-choice__supporting">${sup}</span>` : ''}</span></label>`;
// Disclosure: optional details, labeled and easy to find; state kept on the route so it survives re-renders
const ezDisclosure = (r, key, label, content, sub = '') => {
  const open = !!(r.u.open && r.u.open[key]);
  return `<div class="ez-disc${open ? ' is-open' : ''}"><button class="ez-disc__btn" type="button" data-a="ez-disc" data-key="${key}" aria-expanded="${open}" aria-controls="ezd-${key}"><span><span class="ez-disc__label">${label}</span>${sub ? `<span class="ez-disc__sub">${sub}</span>` : ''}</span>${ic('chevron-down')}</button><div class="ez-disc__panel" id="ezd-${key}" ${open ? '' : 'hidden'}>${content}</div></div>`;
};
A['ez-disc'] = (t, ri) => { const r = routeAt(ri) || TABUI; r.u.open = r.u.open || {}; r.u.open[t.dataset.key] = !r.u.open[t.dataset.key]; pendingFocus = `[data-a="ez-disc"][data-key="${t.dataset.key}"]`; render(); };
const TABUI = { u: {} }; // disclosure state for tab pages (no route there)

const ezDate = s => `${fmtWeekday(s)}, ${parse(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
const ezCity = c => c ? `${ST[c].city}, ${ST[c].st}` : '';
function ezHelpText(b) { return b.assistOn && b.assistDone ? assistSummaryItems(b.assist).join(' · ') : b.assistOn ? 'Questions not answered yet' : 'No help requested'; }

// Trip Summary: route, dates, travelers, price and help, visible while booking
function ezTrip(o = {}) {
  const b = D().booking;
  const row = (icon, label, val, step, empty) => `<div class="ez-trip__row">${ic(icon, 'ez-trip__icon')}<div class="ez-trip__text"><span class="ez-trip__label">${label}</span><span class="ez-trip__val${empty ? ' is-empty' : ''}">${val}</span>${o.errs && o.errs[label] ? ezErr('ezr-' + step, o.errs[label]) : ''}</div>${o.change ? `<button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="ez-go" data-step="${step}" aria-label="Change ${label.toLowerCase()}">Change</button>` : ''}</div>`;
  const route = b.from || b.to ? `${b.from ? esc(ezCity(b.from)) : 'Not chosen'} → ${b.to ? esc(ezCity(b.to)) : 'Not chosen'}` : 'Not chosen yet';
  const routeDetail = o.full && b.from && b.to ? `<span class="ez-trip__sub">${esc(ST[b.from].name)} to ${esc(ST[b.to].name)}</span>` : '';
  const dates = b.trip === 'rt' ? `${ezDate(b.dep)}<br>Back ${b.ret ? ezDate(b.ret) : 'not chosen'}` : `${ezDate(b.dep)} · One way`;
  const rows = [
    row('map-pin', 'Stations', route + routeDetail, 'from', !b.from && !b.to),
    row('calendar', 'Dates', dates, 'when'),
    row('person', 'Travelers', `1 adult · ${esc(discLabel(b))}`, 'who'),
    row('assistance', 'Help', esc(ezHelpText(b)), 'who', !b.assistOn)
  ];
  if (o.full) rows.push(row('dollar', 'Price', 'Shown when you choose a train', 'review', true).replace(/<button[^]*?<\/button>/, ''));
  return `<section class="ez-trip${o.full ? ' ez-trip--full' : ''}" aria-label="Your trip"><h3 class="ez-trip__title">${o.title || 'Your trip'}</h3>${rows.join('')}</section>`;
}

// ---------- App header and tabs ----------
function ezHeader() {
  const d = D();
  return `<header class="ads-appheader ez-header"><button class="ads-appheader__account" type="button" data-a="open-account" aria-label="Account${d.signedIn ? ', Alex Rivera' : ', not signed in'}">${d.signedIn ? '<span class="ads-avatar">AR</span>' : `<span class="ads-avatar ez-avatar--guest">${ic('person')}</span>`}<span><span class="ads-appheader__name">Account</span><span class="ads-appheader__meta">${d.signedIn ? 'Alex Rivera' : 'Not signed in'}</span></span></button><button class="ez-inbox" type="button" data-a="open-inbox" aria-label="Inbox, 2 new messages">${ic('email')}<span>Inbox</span><span class="ez-count" aria-hidden="true">2</span></button></header>`;
}
function ezStationBtn(s, f, sec, o = {}) {
  const d = D(), b = d.booking, other = f === 'from' ? 'to' : 'from', cur = b[f] === s.code, taken = !o.free && b[other] === s.code;
  const rec = d.rec.find(x => x.c === s.code), fav = d.fav.includes(s.code);
  const when = sec === 'rec' && rec ? (rec.d === 0 ? 'Used today' : rec.d === 1 ? 'Used yesterday' : `Used ${rec.d} days ago`) : '';
  const why = taken ? `Already your ${other === 'to' ? 'arrival' : 'departure'} station` : '';
  return `<li class="ez-station${cur ? ' is-current' : ''}"><button class="ez-station__btn" type="button" data-a="${o.a || 'ez-pick'}" data-code="${s.code}" data-field="${f}" data-k="ezst-${sec}-${s.code}" ${taken ? 'disabled' : ''} ${cur ? 'aria-current="true"' : ''}><span class="ez-station__city">${s.city}, ${s.st}${cur ? ' <span class="ez-tag">Selected</span>' : ''}</span><span class="ez-station__name">${s.name} · ${s.code}</span>${s.tag ? `<span class="ads-badge ads-badge--info">${s.tag} only</span>` : ''}${why || when ? `<span class="ez-station__meta">${why || when}</span>` : ''}</button><button class="ez-station__star" type="button" data-a="fav" data-code="${s.code}" aria-pressed="${fav}" aria-label="${fav ? 'Remove' : 'Add'} ${s.city} ${fav ? 'from' : 'to'} Favorites" data-k="ezfav-${sec}-${s.code}">${ic(fav ? 'star-filled' : 'star')}</button></li>`;
}
function ezStationLists(f, o = {}) {
  const d = D();
  const favs = d.fav.map(c => ST[c]);
  const recs = d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).sort((a, b) => a.d - b.d).map(x => ST[x.c]);
  let h = '';
  if (favs.length) h += `<h4 class="ez-sub">${ic('star-filled', 'ads-icon--sm')}Your favorite stations</h4><ul class="ez-list" aria-label="Favorite stations">${favs.map(s => ezStationBtn(s, f, 'fav', o)).join('')}</ul>`;
  if (recs.length) h += `<h4 class="ez-sub">${ic('history', 'ads-icon--sm')}Stations you used recently</h4><ul class="ez-list" aria-label="Recent stations">${recs.map(s => ezStationBtn(s, f, 'rec', o)).join('')}</ul>`;
  return { h, any: favs.length + recs.length > 0 };
}
const EZTABS = {
  book: () => {
    const d = D(), b = d.booking, started = b.from || b.to;
    const cont = started ? `<section class="ez-card" aria-labelledby="ez-cont"><h2 class="ez-card__title" id="ez-cont">Continue your trip</h2><p class="ez-card__text"><b>${b.from ? esc(ezCity(b.from)) : 'Choose a station'} → ${b.to ? esc(ezCity(b.to)) : 'choose a station'}</b><br>${ezDate(b.dep)}${b.trip === 'rt' && b.ret ? ` to ${ezDate(b.ret)}` : ''}</p><button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="open-booking">Continue booking</button><button class="ads-btn ads-btn--tertiary ads-btn--block" type="button" data-a="ez-start-over">Start a new trip instead</button></section>`
      : `<button class="ez-bigaction" type="button" data-a="open-booking">${ic('search')}<span><b>Book a trip</b><span>Choose where and when you’re going</span></span>${ic('chevron-right')}</button>`;
    const lists = ezStationLists('from', { a: 'ez-start', free: true });
    const quick = !started && lists.any ? `<section class="ez-section" aria-labelledby="ez-qs"><h2 class="ez-h2" id="ez-qs">Leave from a station you know</h2>${lists.h}</section>` : '';
    const more = ezDisclosure(TABUI, 'more', 'More ways to travel', `<div class="ads-group__body">${grow({ label: 'Explore destinations', value: 'Recommended trips and routes near you' })}${grow({ label: 'Passes', value: 'Not part of Sprint 4' })}${grow({ label: 'Gift cards', value: 'Not part of Sprint 4' })}</div>`, 'Destinations, passes and gift cards');
    return `<div class="tabpage ez-page"><h1 class="ez-h1">Book</h1>${cont}${quick}${more}</div>`;
  },
  trips: () => `<div class="tabpage ez-page"><h1 class="ez-h1">Trips</h1><div class="ads-segmented" role="group" aria-label="Show trips"><button type="button" aria-pressed="false">Active</button><button type="button" aria-pressed="true">Upcoming</button><button type="button" aria-pressed="false">Past</button></div><div class="ez-empty"><h2 class="ez-card__title">You have no upcoming trips</h2><p>Trips you book will show here.</p><button class="ads-btn ads-btn--block" type="button" data-a="tab" data-tab="book">Book a trip</button></div><p class="ss-note">Trip management isn’t part of Sprint 4.</p></div>`,
  'train-status': () => `<div class="tabpage ez-page"><h1 class="ez-h1">Train Status</h1><div class="ez-card">${fieldHtml({ id: 'ez-tsn', f: 'x', label: 'Train number', value: '', inputmode: 'numeric', help: 'You’ll find it on your ticket. For example: 171.' })}<button class="ads-btn ads-btn--block" type="button" data-a="noop">Check train status</button></div><p class="ss-note">Train Status isn’t part of Sprint 4.</p></div>`,
  support: () => `<div class="tabpage ez-page"><h1 class="ez-h1">Support</h1><a class="ez-bigaction" href="tel:18008727245">${ic('mobile')}<span><b>Call Amtrak</b><span>1-800-USA-RAIL (1-800-872-7245)</span></span></a>${group('', [grow({ icon: 'trip-interruption', label: 'Help with a trip', value: 'Delays, cancellations and changes' }), grow({ icon: 'assistance', label: 'Accessible travel', value: 'Help at stations and on board' }), grow({ icon: 'speech-bubble', label: 'Text or chat with us', value: 'Live Chat · Text · Email' })])}<p class="ss-note">Support content isn’t part of Sprint 4.</p></div>`
};
A['ez-start'] = t => {
  const c = t.dataset.code, b = D().booking;
  ezSetStation('from', c);
  openSheet('booking', ['ff'], '[data-a="open-booking"]');
  sheet().stack[0].u.ez = b.to ? 'when' : 'to'; pendingFocus = 'title'; render();
};
A['ez-start-over'] = () => dialog({ title: 'Start a new trip?', body: 'The stations, dates and help you chose for this trip will be cleared. Your Profile doesn’t change.', returnFocus: '[data-a="ez-start-over"]',
  actions: [['Keep my trip', 'secondary', null], ['Start a new trip', 'primary', () => { const d = D(); d.booking = freshBooking(d); toast('Started a new trip', 'info'); }]] });

// ---------- Booking: one question per screen ----------
const EZ_STEPS = ['from', 'to', 'when', 'who', 'review'];
const EZ_STEP_NAMES = { from: 'Leaving from', to: 'Going to', when: 'Dates', who: 'Travelers and help', review: 'Check your trip' };
function ezStepOf(r) { const b = D().booking; if (!EZ_STEPS.includes(r.u.ez)) r.u.ez = !b.from ? 'from' : !b.to ? 'to' : 'review'; return r.u.ez; }
// Applies a station with the same rules as Standard (no duplicate, Auto Train pairing, Recents). Returns an error or ''.
function ezSetStation(f, c) {
  const d = D(), b = d.booking, other = f === 'from' ? 'to' : 'from';
  if (b[other] === c) return `${ST[c].city} is already your ${other === 'to' ? 'arrival' : 'departure'} station. Choose a different station, or change the other one.`;
  b[f] = c; b.notice = null;
  if (AUTO_TRAIN[c]) { b[other] = AUTO_TRAIN[c]; b.notice = `${ST[c].city} is an Auto Train station. Auto Train only runs between Lorton, VA and Sanford, FL, so ${ST[AUTO_TRAIN[c]].city} was added as your ${other === 'to' ? 'arrival' : 'departure'} station.`; }
  else if (b[other] && AUTO_TRAIN[b[other]]) { b.notice = `${ST[b[other]].city} only connects to ${ST[AUTO_TRAIN[b[other]]].city} (Auto Train), so it was cleared. Choose your ${other === 'to' ? 'arrival' : 'departure'} station.`; b[other] = null; }
  if (!d.fav.includes(c)) d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)];
  return '';
}
function ezNext(ff, from) {
  const b = D().booking;
  if (ff.u.ezReturn && b.from && b.to) { ff.u.ezReturn = false; return 'review'; }
  if (from === 'from' && b.to && b.notice && AUTO_TRAIN[b.from]) return 'when'; // Auto Train filled the other end
  if (from === 'from' && !b.to) return 'to';
  if (from === 'to' && !b.from) return 'from';
  return EZ_STEPS[EZ_STEPS.indexOf(from) + 1];
}
function ezGo(ff, step) { ff.u.ez = step; ff.u.ezErr = null; pendingFocus = 'title'; render(); }

EZ.ff = (r, ri) => {
  const b = D().booking, step = ezStepOf(r), i = EZ_STEPS.indexOf(step), e = r.u.ezErr || {};
  ref('607', '608', '1060');
  let body = '', foot = '';
  const notice = b.notice ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description">${b.notice}</p></div><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="dismiss-notice" aria-label="Dismiss">${ic('close', 'ads-icon--sm')}</button></div>` : '';
  if (step === 'from' || step === 'to') {
    ref('600', '118', '984');
    const f = step, lists = ezStationLists(f);
    body = ezQ(f === 'from' ? 'Where are you leaving from?' : 'Where are you going?', f === 'from' ? 'Choose the station where your trip starts.' : `Leaving from ${b.from ? esc(ezCity(b.from)) : 'a station you haven’t chosen yet'}.`)
      + notice + ezErr('ez-st-err', e.st)
      + (lists.any ? lists.h : `<div class="ez-empty"><h4 class="ez-card__title">No saved stations yet</h4><p>Search by city, station name, code or ZIP code. Stations you choose will show here next time.</p></div>`)
      + `<button class="ads-btn ads-btn--secondary ads-btn--block ez-searchbtn" type="button" data-a="ez-search" data-field="${f}">${ic('search')}Search all stations</button>`;
    if (b[f]) foot = `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-next">Continue with ${esc(ST[b[f]].city)}</button>`;
  } else if (step === 'when') {
    const maxDep = addDays(TODAY_S, WINDOW_DAYS), tomorrow = addDays(TODAY_S, 1);
    const card = (f, label) => {
      const val = b[f], quick = f === 'dep' ? `<div class="ez-quick" role="group" aria-label="Quick choices">${[[TODAY_S, 'Today'], [tomorrow, 'Tomorrow']].map(([s, l]) => `<button class="ez-chip" type="button" data-a="ez-quickdate" data-d="${s}" aria-pressed="${b.dep === s}">${l}</button>`).join('')}</div>` : '';
      return `<div class="ez-date${e[f] ? ' has-error' : ''}" id="ez-${f}-card"><p class="ez-date__label">${label}</p><p class="ez-date__value${val ? '' : ' is-empty'}">${val ? ezDate(val) : 'Not chosen yet'}</p>${ezErr('ez-' + f + '-err', e[f])}${quick}<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="ez-cal" data-field="${f}" id="ez-${f}">${ic('calendar')}${f === 'dep' ? 'Choose a different date' : val ? 'Change return date' : 'Choose return date'}</button></div>`;
    };
    body = ezQ('When are you traveling?', `Dates up to ${fmtShort(maxDep)} can be booked. ${q(4)}`)
      + `<fieldset class="ads-fieldset ez-pair"><legend class="ads-field-label">Is this a round trip?</legend><div class="ads-fieldset__options">${ezRadio('ez-trip', 'ow', b.trip === 'ow', 'One way', 'Just going', 'data-a="ez-trip"')}${ezRadio('ez-trip', 'rt', b.trip === 'rt', 'Round trip', 'Going and coming back', 'data-a="ez-trip"')}</div></fieldset>`
      + (r.u.ezNote ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description">${r.u.ezNote}</p></div></div>` : '')
      + card('dep', 'Leaving') + (b.trip === 'rt' ? card('ret', 'Coming back') : '');
    foot = `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-next">Continue</button>`;
  } else if (step === 'who') {
    ref('612', '973', '614');
    prov('Traveler type and number (NMA-611) isn’t in this exploration: the sample traveler is 1 Adult.');
    const d = D(), pwd = pwdApplies(b);
    const fromProfile = d.signedIn && d.discount.type !== 'none' && d.discount.type !== 'pwd' && b.disc === d.discount.type;
    const disc = pwd ? `<div class="ez-card ez-card--quiet"><p class="ez-card__text"><b>Discount: Passenger with Disability</b><br>Applied because of the help you asked for. It replaces other traveler discounts for this trip. ${q(9)}</p></div>`
      : ezDisclosure(r, 'disc', `Discount: ${b.disc === 'none' ? 'None' : DISCOUNTS[b.disc].label}`, `<fieldset class="ads-fieldset"><legend class="ads-sr-only">Discount for Traveler 1</legend><div class="ads-fieldset__options">${['none', 'military', 'rpa'].map(k => ezRadio('ez-disc', k, b.disc === k, (k === 'none' ? 'No discount' : DISCOUNTS[k].label) + (fromProfile && b.disc === k ? ' <span class="ads-lock">From your Profile</span>' : ''), k === 'none' ? 'Adult fare.' : DISCOUNTS[k].info, 'data-a="bk-disc"')).join('')}</div></fieldset><p class="ez-small">Changing it here is for this trip only. Your Profile doesn’t change.</p>`, 'Optional. Senior and youth fares are set by age.');
    let help = `<fieldset class="ads-fieldset ez-pair" ${e.help ? 'aria-describedby="ez-help-err"' : ''}><legend class="ads-field-label">Does Traveler 1 need help when traveling?</legend><p class="ez-small">For example a wheelchair, a service animal, hearing or vision loss, or help at the station. One traveler with a disability may bring one companion.</p><div class="ads-fieldset__options">${ezRadio('ez-help', 'yes', b.assistOn, 'Yes, I need help', '', 'data-a="ez-help"')}${ezRadio('ez-help', 'no', !b.assistOn, 'No help needed', '', 'data-a="ez-help"')}</div>${ezErr('ez-help-err', e.help)}</fieldset>`;
    if (b.assistOn && b.assistDone) help += `<div class="ez-card"><div class="ez-card__head"><h4 class="ez-card__title">Help for this trip</h4><span class="ez-source">${b.assistFromProfile ? 'Saved in your Profile' : 'This trip only'}</span></div><ul class="ads-summary__list">${assistSummaryItems(b.assist).map(t => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul><p class="ez-small">${b.assistFromProfile ? 'We added the help saved in your Profile. Changes here are for this trip only.' : 'This help is for this trip only. To save help for every trip, go to Account › Help when you travel.'}</p><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="assist-edit">Change help for this trip</button></div>`;
    else if (b.assistOn) help += `<div class="ez-card"><p class="ez-card__text">Answer a few short questions so we can arrange the right help.</p><button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="assist-edit" id="ez-answer">Answer the help questions</button></div>`;
    body = ezQ('Who’s traveling?') + `<div class="ez-card ez-traveler"><span class="ads-avatar">${d.signedIn ? 'AR' : ic('person')}</span><div><p class="ez-card__title">1 adult</p><p class="ez-small">${d.signedIn ? 'Alex Rivera' : 'Traveler 1'}</p></div></div>` + disc + help + q(7);
    foot = `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-next">Continue</button>`;
  } else {
    const fe = r.u.showErr ? ffErrors(b) : {};
    body = ezQ('Check your trip', 'Change anything before you find trains.') + notice + netAlert(r) + ezTrip({ full: true, change: true, title: 'Trip details', errs: { Stations: fe.from && fe.to ? 'Choose both stations.' : fe.from ? 'Choose where you’re leaving from.' : fe.to ? 'Choose where you’re going.' : '', Dates: fe.ret ? 'Choose a return date, or change to One way.' : '' } });
    foot = r.u.busy ? busyBtn(r, '', 'Finding trains') : `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-find">Find trains</button>`;
  }
  const lead = i > 0 ? `<button class="ads-navbar__btn" type="button" data-a="ez-prev" aria-label="Back to ${EZ_STEP_NAMES[EZ_STEPS[i - 1]]}">${ic('chevron-left')}<span>Back</span></button>` : null;
  const showTrip = step !== 'review' && (b.from || b.to);
  const main = ezProgress(i, EZ_STEPS.length, EZ_STEP_NAMES[step]) + (showTrip && !IPAD() ? `<div class="ez-tripmini">${ic('map-pin', 'ads-icon--sm')}<span>${b.from ? esc(ezCity(b.from)) : '…'} → ${b.to ? esc(ezCity(b.to)) : '…'} · ${fmtShort(b.dep)}${b.trip === 'rt' ? ' – ' + (b.ret ? fmtShort(b.ret) : '…') : ''}</span></div>` : '') + body;
  const out = { title: 'Book a trip', kind: 'root', lead, foot, offlineText: 'You can plan your trip. Finding trains needs a connection.' };
  if (IPAD()) { out.wide = true; out.body = `<div class="split2 ez-split"><div class="split2__main">${main}</div><div class="split2__side">${step === 'review' ? '' : ezTrip()}</div></div>`; }
  else out.body = main;
  return out;
};
A['ez-prev'] = (t, ri) => { const r = routeAt(ri), i = EZ_STEPS.indexOf(ezStepOf(r)); r.u.ezReturn = false; ezGo(r, EZ_STEPS[Math.max(0, i - 1)]); };
A['ez-go'] = (t, ri) => { const r = routeAt(ri); r.u.ezReturn = true; r.u.showErr = false; ezGo(r, t.dataset.step); };
A['ez-next'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, step = ezStepOf(r);
  if ((step === 'from' || step === 'to') && !b[step]) { r.u.ezErr = { st: 'Choose a station to continue.' }; pendingFocus = '#ez-st-err'; render(); return; }
  if (step === 'when' && b.trip === 'rt' && !b.ret) { r.u.ezErr = { ret: 'Choose the date you’re coming back, or choose One way.' }; pendingFocus = '#ez-ret'; render(); return; }
  if (step === 'who' && b.assistOn && !b.assistDone) { r.u.ezErr = { help: 'Answer the help questions, or choose No help needed.' }; pendingFocus = '#ez-answer'; render(); return; }
  r.u.ezNote = null; ezGo(r, ezNext(r, step));
};
A['ez-pick'] = (t, ri) => {
  const r = routeAt(ri), f = t.dataset.field, err = ezSetStation(f, t.dataset.code);
  if (err) { r.u.ezErr = { st: err }; pendingFocus = r.s === 'ff' ? '#ez-st-err' : '#ss-err'; render(); return; }
  const ff = sheet().stack[0];
  if (r.s === 'stations') sheet().stack.length = +ri; // back to the booking steps
  ff.u.ezErr = null; ezGo(ff, ezNext(ff, f));
};
A['ez-search'] = (t, ri) => push('stations', { field: t.dataset.field }, +ri);
A['ez-trip'] = (t, ri) => { const b = D().booking; b.trip = t.value; if (b.trip === 'rt') { if (!b.ret) b.ret = b.dep; } else b.ret = null; routeAt(ri).u.ezErr = null; pendingFocus = `[data-a="ez-trip"][value="${t.value}"]`; render(); };
A['ez-quickdate'] = (t, ri) => { const r = routeAt(ri), b = D().booking, s = t.dataset.d; b.dep = s; r.u.ezNote = null; if (b.ret && b.ret < s) { b.ret = null; r.u.ezNote = 'Your return date was cleared because it was before the new departure date. Choose a return date.'; } pendingFocus = `[data-a="ez-quickdate"][data-d="${s}"]`; render(); };
A['ez-cal'] = (t, ri) => { routeAt(ri).u.ezErr = null; push('calendar', { field: t.dataset.field }, +ri); sheet().stack[sheet().stack.length - 1].u.picking = t.dataset.field; };
A['ez-help'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking; r.u.ezErr = null;
  b.assistOn = t.value === 'yes';
  if (b.assistOn && !b.assistDone) { push('assist', {}, +ri); return; }
  pendingFocus = `[data-a="ez-help"][value="${t.value}"]`; render();
};
A['ez-find'] = (t, ri) => {
  const r = routeAt(ri), b = D().booking, e = ffErrors(b);
  if (e.from || e.to || e.ret) { r.u.showErr = true; pendingFocus = '.ez-err'; render(); return; }
  r.u.showErr = false;
  runNet(r, () => {}, () => push('handoff', {}, +ri), { what: 'find trains' });
};

// Full station search (Easy)
EZ.stations = (r, ri) => {
  const f = r.p.field; r.u.d = r.u.d || {}; const qv = r.u.d.q || '', e = r.u.ezErr || {};
  ref('600', '118', '984');
  let h = `<div class="ez-search">${ezQ(f === 'from' ? 'Find your departure station' : 'Find your arrival station')}<label class="ads-field__label" for="ss-q">Search by city, station name, code or ZIP code</label><div class="ads-control">${ic('search')}<input id="ss-q" type="search" data-f="q" data-live data-nodirty value="${esc(qv)}" placeholder="For example: Boston" autocomplete="off">${qv ? `<button class="ads-control__clear" type="button" data-a="ss-clear" aria-label="Clear search">${ic('close', 'ads-icon--sm')}</button>` : ''}</div><p class="ads-helper">Works without a connection. ${q(1)}${q(2)}</p></div>${ezErr('ss-err', e.st)}`;
  if (qv.trim()) {
    const res = searchStations(qv);
    if (res.length) h += `<p class="ez-small" role="status">${res.length} station${res.length > 1 ? 's' : ''} found</p><ul class="ez-list" aria-label="Search results">${res.slice(0, 25).map(s => ezStationBtn(s, f, 'res')).join('')}</ul>`;
    else if (qv.trim().length > 2) h += `<div class="ez-empty" role="status"><h4 class="ez-card__title">No stations match “${esc(qv.trim())}”</h4><p>Check the spelling, or try the city name, a station code like NYP, or a ZIP code.</p></div>`;
    else h += `<p class="ez-small" role="status">Keep typing to search.</p>`;
    return { title: 'Search stations', kind: 'push', body: h + `<p class="ss-note">${q(3)}</p>`, banner: false };
  }
  const lists = ezStationLists(f);
  h += lists.h;
  const byState = {}; STATIONS.forEach(s => (byState[s.state] ||= []).push(s));
  h += ezDisclosure(r, 'all', 'Browse all stations by state', Object.keys(byState).sort().map(stn => `<h4 class="ez-sub">${stn}</h4><ul class="ez-list" aria-label="${stn}">${byState[stn].sort((a, b) => a.city.localeCompare(b.city)).map(s => ezStationBtn(s, f, 'all')).join('')}</ul>`).join(''), `${STATIONS.length} stations`);
  tip('Search “30th”, “Penn”, “Capitol”, “021” or “VA”. Choose Lorton to see Auto Train pairing.');
  return { title: 'Search stations', kind: 'push', body: h + `<p class="ss-note">${q(3)} Tap the star to keep a station in your favorites.</p>`, banner: false };
};

// Calendar (one date at a time)
EZ.calendar = (r, ri) => {
  const b = D().booking, f = b.trip === 'ow' ? 'dep' : r.p.field, val = b[f];
  const body = ezQ(f === 'dep' ? 'When are you leaving?' : 'When are you coming back?', f === 'ret' ? `Dates before ${ezDate(b.dep)} aren’t available.` : 'Past dates aren’t available.') + calendarBody(r, ri, f, false, true);
  const foot = `<p class="ez-small ez-chosen" role="status">${val ? `<b>${f === 'dep' ? 'Leaving' : 'Coming back'}:</b> ${ezDate(val)}` : 'No date chosen yet'}</p><button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-cal-done" ${val ? '' : 'disabled'}>${val ? `Use ${fmtShort(val)}` : 'Choose a date'}</button>`;
  return { title: f === 'dep' ? 'Leaving date' : 'Return date', kind: 'push', body, foot, banner: false };
};
A['ez-cal-done'] = (t, ri) => { const f = routeAt(ri).p.field; popTo(+ri - 1); pendingFocus = `#ez-${f}`; render(); };

// Handoff: same content, Easy wording on the way back
EZ.handoff = (r, ri) => { const o = SCR.handoff(r, ri); o.title = 'Your search'; o.body = o.body.replace('Back to Fare Finder', 'Back to your trip'); return o; };

// ---------- Assistance: one question per screen ----------
function ezWizard(r, ri, mode, title) {
  const src = mode === 'booking' ? D().booking.assist : D().assist;
  if (!r.u.d || r.u.d.cat === undefined) { r.u.d = toDraft(src); r.u.mode = mode; }
  if (!r.u.step) r.u.step = src.cat ? 'review' : 'cat';
  const x = r.u.d, steps = wizSteps(x, mode); if (!steps.includes(r.u.step)) r.u.step = 'cat';
  const i = steps.indexOf(r.u.step), e = r.u.err || {}, idp = 'ez';
  ref(mode === 'booking' ? '615' : '26', '27', '28', '995', '996');
  const who = mode === 'booking' ? 'Traveler 1' : 'you';
  let content = '';
  if (r.u.step === 'cat') {
    const cats = mode === 'booking' ? ['disability', 'station', 'companion', 'none'] : ['disability', 'station'];
    const L = { disability: ['I have a disability', 'We’ll ask what applies. The Passenger with Disability discount applies.'], station: ['I need help at the station only', 'I don’t have a disability. The disability discount doesn’t apply.'], companion: ['I’m a companion to a traveler with a disability', 'Not available here yet. Companion rules aren’t final.'], none: ['I don’t need help', ''] };
    content = ezQ(mode === 'booking' ? 'What help does Traveler 1 need?' : 'What help should we save for your trips?', mode === 'booking' ? 'Your answer decides the next questions.' : 'We’ll add this help each time you book. Choosing “I have a disability” also saves the Passenger with Disability discount.')
      + `<fieldset class="ads-fieldset" ${e.cat ? `aria-describedby="${idp}-cat-err"` : ''}><legend class="ads-sr-only">Type of help</legend><div class="ads-fieldset__options">${cats.map(k => choice('radio', `${idp}-cat`, 'cat', k, x.cat === k, L[k][0], L[k][1], k === 'companion' ? 'disabled' : 'data-hook="assist"')).join('')}</div>${ezErr(`${idp}-cat-err`, e.cat && 'Choose one option to continue.')}</fieldset>`
      + (mode === 'booking' ? q(9) : x.cat ? `<button class="ads-btn ads-btn--tertiary ads-btn--block" type="button" data-a="assist-clear-draft">Don’t save any help</button>` : '');
  }
  if (r.u.step === 'dis') content = ezQ('Which of these apply?', 'Choose all that apply.') + `<fieldset class="ads-fieldset" ${e.dis ? `aria-describedby="${idp}-dis-err"` : ''}><legend class="ads-sr-only">Disabilities</legend><div class="ads-fieldset__options">${DISABILITIES.map(([k, l, s]) => choice('checkbox', `${idp}-dis`, 'dis', k, x.dis.includes(k), l, s, 'data-hook="assist"')).join('')}</div>${ezErr(`${idp}-dis-err`, e.dis && 'Choose at least one option. If none fit, choose Other disability.')}</fieldset>`;
  if (r.u.step === 'wc') content = ezQ(`Will ${who === 'you' ? 'you' : who} bring a wheelchair?`, 'If yes, we’ll ask for wheelchair space on the train.') + `<fieldset class="ads-fieldset ez-pair" ${e.wc ? `aria-describedby="${idp}-wc-err"` : ''}><legend class="ads-sr-only">Wheelchair</legend><div class="ads-fieldset__options">${choice('radio', `${idp}-wc`, 'wc', 'yes', x.wc === 'yes', 'Yes', 'I need wheelchair space', 'data-hook="assist"')}${choice('radio', `${idp}-wc`, 'wc', 'no', x.wc === 'no', 'No', '', 'data-hook="assist"')}</div>${ezErr(`${idp}-wc-err`, e.wc && 'Choose Yes or No to continue.')}</fieldset><p class="ss-note">Mobility device details (NMA-29) aren’t part of this exploration.</p>`;
  if (r.u.step === 'needs') content = ezQ(x.cat === 'station' ? 'Do you need an accessible seat?' : 'Do you need anything else?', 'Optional. Choose any that help, or continue.') + needsBlock(r, x, idp, true).replace(/<legend[^]*?<\/legend>/, '<legend class="ads-sr-only">Other needs</legend>');
  if (r.u.step === 'review') {
    const m = fromDraft(x);
    content = ezQ('Check your answers') + `<div class="ez-card ez-review">${steps.filter(s => s !== 'review').map(s => `<div class="ez-review__row"><div><span class="ez-trip__label">${STEP_NAMES[s]}</span><p class="ez-review__val">${esc(stepValue(s, m))}</p></div><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="wiz-go" data-step="${s}" aria-label="Change ${STEP_NAMES[s]}">Change</button></div>`).join('')}</div>`
      + (mode === 'profile' ? pwdPreview(m) + `<p class="ez-small">Saved help is added to every booking. You can change it for one trip when you book.</p>` : `<p class="ez-small">This help is for this trip only. Your Profile doesn’t change.</p>`);
  }
  const last = r.u.step === 'review';
  const foot = last ? (mode === 'profile' ? busyBtn(r, 'Save help to my Profile', 'Saving', 'data-a="assist-save"') : `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="assist-confirm">Use this help for this trip</button>`) : `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="wiz-next">Continue</button>`;
  const lead = i > 0 ? `<button class="ads-navbar__btn" type="button" data-a="wiz-back" aria-label="Back to ${STEP_NAMES[steps[i - 1]]}">${ic('chevron-left')}<span>Back</span></button>` : (mode === 'profile' && D().assist.cat ? `<button class="ads-navbar__btn" type="button" data-a="assist-p-cancel">Cancel</button>` : null);
  return { title, kind: 'push', lead, body: ezProgress(i, steps.length, STEP_NAMES[r.u.step]) + netAlert(r) + content, foot, banner: mode === 'profile' ? undefined : false };
}
EZ.assist = (r, ri) => ezWizard(r, ri, 'booking', 'Help for this trip');
EZ['assist-profile'] = (r, ri) => {
  const d = D(), saved = d.assist;
  ref('26', '27', '28');
  if (r.u.editing || !saved.cat) return ezWizard(r, ri, 'profile', 'Help when you travel');
  const body = `${r.u.savedMsg ? alertBox('success', 'Help saved', r.u.savedMsg) : ''}${ezQ('Help saved in your Profile', 'We add this help each time you book. You can change it for one trip when you book, without changing what’s saved here.')}<div class="ez-card"><div class="ez-card__head"><h4 class="ez-card__title">Saved help</h4><span class="ez-source">Every trip</span></div><ul class="ads-summary__list">${assistSummaryItems(saved).map(t => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul></div>${r.u.returnTo || r.p.returnTo ? `<button class="ads-btn ads-btn--secondary ads-btn--block" type="button" data-a="assist-return">Back to Passenger discount</button>` : ''}`;
  return { title: 'Help when you travel', kind: 'push', body, foot: `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="assist-p-edit">Change saved help</button>`, banner: false };
};

// ---------- Account and Settings ----------
EZ.account = (r, ri) => {
  const d = D();
  ref('1004');
  const recCount = d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).length;
  const clearRow = recCount ? grow({ a: 'clear-recents', label: 'Clear recent stations', value: `${recCount} recent station${recCount > 1 ? 's' : ''}`, cls: 'ads-group__row--action', chev: false }) : `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Clear recent stations</span><span class="ads-group__value">No recent stations</span></span></div>`;
  const settings = group('Settings', [grow({ a: 'push', data: 'data-s="settings"', icon: 'eye', label: 'Accessibility', value: 'Easy Mode is on', k: 'row-settings' })]);
  const quick = quickSettings(d, clearRow);
  if (!d.signedIn) return { title: 'Account', kind: 'root', banner: false, body: `<div class="ez-card"><h3 class="ez-card__title">You’re not signed in</h3><p class="ez-card__text">Sign in to use your saved details, discount and help.</p><button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="sign-in">Sign in</button></div>${settings}${quick}` };
  const assistVal = d.assist.cat ? (d.assist.cat === 'disability' ? 'I have a disability' : 'Help at the station') : 'Nothing saved';
  const body = `<div class="ez-me"><span class="ads-avatar">AR</span><div><p class="ez-card__title">Alex Rivera</p><p class="ez-small">Guest Rewards 7012 3456 78 · 12,450 points</p></div></div>
    ${group('Your details', [grow({ a: 'push', data: 'data-s="profile"', icon: 'person-circle', label: 'Profile', value: 'Name, contact details and discount', k: 'row-profile' }), grow({ a: 'push', data: 'data-s="assist-profile"', icon: 'assistance', label: 'Help when you travel', value: assistVal })])}
    ${settings}
    ${group('More', [grow({ a: 'open-inbox-from-account', icon: 'email', label: 'Inbox', value: '2 new messages' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Travelers"}\'', icon: 'people', label: 'Travelers', value: '3 saved' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Payment"}\'', icon: 'payment-cash', label: 'Payment', value: 'Visa ending 4821' }), grow({ a: 'push', data: 'data-s="stub" data-p=\'{"t":"Points activity"}\'', icon: 'AGR_points-evergreen', label: 'Points activity' })])}
    ${quick}`;
  return { title: 'Account', kind: 'root', body, banner: false };
};
// Settings › Accessibility (both modes): the in-app Easy Mode switch
SCR.settings = () => {
  prov('Account › Settings › Accessibility is new. The IA lists Quick settings in Account but no Settings screen yet (Q10).');
  const easy = `<label class="ads-group__row ez-switchrow"><span class="ads-group__text"><span class="ads-group__label" id="set-easy-l">Easy Mode</span><span class="ads-group__value" id="set-easy-d">Larger controls and a simpler layout to help you book and manage your travel.</span></span><span class="ads-switch"><input type="checkbox" role="switch" id="set-easy" data-a="easy-toggle" aria-labelledby="set-easy-l" aria-describedby="set-easy-d" ${TB.easy ? 'checked' : ''}><span class="ads-switch__track"></span></span></label>`;
  const text = `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Text size</span><span class="ads-group__value">Follows the text size set on your ${IPAD() ? 'iPad' : 'iPhone'}.</span></span></div>`;
  return { title: 'Settings', kind: 'push', banner: false, body: `${group('Accessibility', [easy, text], `Easy Mode is saved on this device. Anything you’ve started, like a booking, stays as it is when you switch. ${q(13)}`)}` };
};

// ---------- Profile ----------
EZ.profile = (r, ri) => {
  ref('19', '22', '23', '919', '21');
  const d = D(), p = d.profile;
  const row = (field, label, value, empty, action) => grow({ a: action || 'edit', data: field ? `data-field="${field}"` : '', label, value: empty ? `<span class="ez-notadded">${value}</span>` : value, meta: empty ? 'Add' : 'Change', k: 'row-' + (field || 'email') });
  const body = `${ezQ('Your details')}
    ${group('Name', [`<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Name</span><span class="ads-group__value">${esc(p.first)} ${p.mi ? esc(p.mi) + '. ' : ''}${esc(p.last)}</span></span></div>`,
      p.mi ? `<div class="ads-group__row"><span class="ads-group__text"><span class="ads-group__label">Middle initial</span><span class="ads-group__value">${esc(p.mi)} · Added. It can’t be changed in the app.</span></span></div>` : row('mi', 'Middle initial', 'Not added. You can add it once.', true)],
      'To change your name, call <a class="ads-link" href="tel:18003075000">1-800-307-5000</a>.')}
    ${group('Contact', [row(null, 'Email', esc(p.email), false, 'change-email'), row('phone', 'Phone', esc(fmtPhone(p.phone)), p.phone.region === 'us' && !p.phone.mobile), row('address', 'Billing address', fmtAddress(p.address), !p.address.street)])}
    ${group('Optional', [row('dob', 'Date of birth', p.dob || 'Not added', !p.dob)])}
    ${group('Discount', [grow({ a: 'push', data: 'data-s="discounts"', label: 'Passenger discount', value: d.discount.type === 'none' ? 'No discount' : DISCOUNTS[d.discount.type].label, meta: 'Change', k: 'row-disc' })], 'Guest Rewards number 7012 3456 78')}`;
  return { title: 'Profile', kind: 'push', body, offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
};
// Plain-language errors that also say how to fix the problem
function ezMsg(field, msg, r) {
  if (!msg) return msg;
  const intl = r && r.u.d && r.u.d.region === 'intl';
  const map = { mobile: 'Enter 10 digits, numbers only. For example: 2155550147.', home: 'Enter 10 digits, numbers only, or leave it empty.', business: 'Enter 10 digits, numbers only, or leave it empty.', intl: 'Enter 5 to 15 digits, numbers only. Don’t include the country code.', dob: 'Enter a real date that isn’t in the future. For example: April 15, 1988.' };
  if (msg.startsWith('Enter a valid') && map[field]) return map[field];
  if (field === 'dob') return map.dob;
  return msg;
}
const EZED = {};
const EZ_SAVE_LABEL = { mi: 'Save middle initial', phone: 'Save phone number', address: 'Save billing address', dob: 'Save date of birth' };
EZ.edit = (r, ri) => {
  const f = r.p.field, o = (EZED[f] || EDITORS[f])(r, ri, false);
  const why = o.saveDisabled && o.noSaveWhy ? `<p class="ads-helper" id="nosave-${ri}">${o.noSaveWhy}</p>` : '';
  const foot = o.foot != null ? o.foot : D().profile.mi && f === 'mi' ? '' : why + busyBtn(r, EZ_SAVE_LABEL[f], 'Saving', `data-a="${o.saveA || 'edit-save'}" ${o.saveDisabled ? `disabled aria-describedby="nosave-${ri}"` : ''}`);
  return { title: PFIELDS[f], kind: 'push', lead: o.lead || null, body: (o.progress || '') + o.body, foot, offlineText: 'You’re seeing your last saved details. Saving changes needs a connection.' };
};
const ezStepLead = v => `<button class="ads-navbar__btn" type="button" data-a="ez-ed-step" data-v="${v}" aria-label="Back to the previous question">${ic('chevron-left')}<span>Back</span></button>`;
A['ez-ed-step'] = (t, ri) => { const r = routeAt(ri); r.u.ezs = t.dataset.v; pendingFocus = 'title'; render(); };
// Phone: 1) where the number is from, 2) the number
EZED.phone = (r, ri) => {
  const p = D().profile.phone; if (!r.u.d) r.u.d = clone(p); const x = r.u.d, e = r.u.err || {};
  ref('22');
  if (!r.u.ezs) r.u.ezs = Object.keys(e).length ? 'number' : 'type';
  const changed = JSON.stringify(x) !== JSON.stringify(p);
  if (r.u.ezs === 'type') return {
    progress: ezProgress(0, 2, 'Number type'),
    body: ezQ('Where is your phone number from?', 'This decides how we ask for it. You can use a number that’s also on another account.') + `<fieldset class="ads-fieldset"><legend class="ads-sr-only">Number type</legend><div class="ads-fieldset__options">${choice('radio', 'ph-region', 'region', 'us', x.region === 'us', 'United States or Canada', 'A mobile number is required.')}${choice('radio', 'ph-region', 'region', 'intl', x.region === 'intl', 'Another country', 'Choose the country code, then enter the number.')}</div></fieldset>`,
    foot: `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-ed-step" data-v="number">Continue</button>`
  };
  let fields;
  if (x.region === 'us') {
    r.u.open = r.u.open || {}; if (!('more' in r.u.open)) r.u.open.more = !!(x.home || x.business);
    fields = fieldHtml({ id: 'ph-mobile', f: 'mobile', label: 'Mobile number', type: 'tel', value: x.mobile, digits: 10, req: true, autocomplete: 'tel-national', help: '10 digits, numbers only.', err: ezMsg('mobile', e.mobile, r) })
      + ezDisclosure(r, 'more', 'Add a home or business number', fieldHtml({ id: 'ph-home', f: 'home', label: 'Home number', type: 'tel', value: x.home, digits: 10, opt: true, help: '10 digits.', err: ezMsg('home', e.home, r) }) + fieldHtml({ id: 'ph-bus', f: 'business', label: 'Business number', type: 'tel', value: x.business, digits: 10, opt: true, help: '10 digits.', err: ezMsg('business', e.business, r) }) + fieldHtml({ id: 'ph-ext', f: 'ext', label: 'Business extension', type: 'tel', value: x.ext, digits: 3, opt: true, help: 'Up to 3 digits.', err: e.ext, cls: 'field--narrow' }), 'Optional');
  } else fields = fieldHtml({ id: 'ph-cc', f: 'cc', label: 'Country code', select: DIAL.map(([k, n, c, fl]) => [k, `${fl} ${n} (${c})`]), value: x.cc, req: true }) + fieldHtml({ id: 'ph-intl', f: 'intl', label: 'Phone number', type: 'tel', value: x.intl, digits: 15, req: true, prefix: (DIAL.find(z => z[0] === x.cc) || DIAL[0])[2], autocomplete: 'tel-national', help: '5 to 15 digits, numbers only.', err: ezMsg('intl', e.intl, r) });
  return { progress: ezProgress(1, 2, 'Number'), lead: ezStepLead('type'), body: ezQ(x.region === 'us' ? 'What’s your mobile number?' : 'What’s your phone number?') + netAlert(r) + fields + `<p class="ss-note">${q(6)}</p>`, saveDisabled: !changed, noSaveWhy: 'Change a number to save.' };
};
// Billing address: 1) country, 2) address
EZED.address = (r, ri) => {
  const a = D().profile.address; if (!r.u.d) { r.u.d = clone(a); r.u.prevCountry = a.country; } const x = r.u.d, e = r.u.err || {};
  ref('23');
  if (!r.u.ezs) r.u.ezs = Object.keys(e).length ? 'address' : 'country';
  const cty = x.country, usca = cty === 'US' || cty === 'CA';
  if (r.u.ezs === 'country') return {
    progress: ezProgress(0, 2, 'Country'),
    body: ezQ('Which country is your billing address in?', 'This decides which details you need. US and Canadian addresses need a state or province.') + fieldHtml({ id: 'ad-country', f: 'country', label: 'Country', select: COUNTRIES, value: cty, req: true, hook: 'country', help: 'Changing the country clears the address on the next step.' })
      + (r.u.undo ? `<div class="ads-alert ads-alert--info" role="status">${ic('info-circle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__description">The address was cleared because the country changed. ${q(5)}</p><div><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-a="addr-undo">Undo</button></div></div></div>` : ''),
    foot: `<button class="ads-btn ads-btn--block ads-btn--lg" type="button" data-a="ez-ed-step" data-v="address">Continue</button>`
  };
  const zipLabel = cty === 'US' ? 'ZIP code' : 'Postal code';
  const body = ezQ('What’s your billing address?', `In ${esc((COUNTRIES.find(c => c[0] === cty) || ['', cty])[1])}.`) + netAlert(r)
    + fieldHtml({ id: 'ad-street', f: 'street', label: 'Street address', value: x.street, req: true, max: 32, autocomplete: 'address-line1', help: '2 to 32 characters.', err: e.street })
    + fieldHtml({ id: 'ad-apt', f: 'apt', label: 'Apartment, suite or unit', value: x.apt, opt: true, autocomplete: 'address-line2' })
    + fieldHtml({ id: 'ad-city', f: 'city', label: 'City', value: x.city, req: true, autocomplete: 'address-level2', err: e.city })
    + (usca ? fieldHtml({ id: 'ad-state', f: 'state', label: cty === 'US' ? 'State' : 'Province', select: [['', cty === 'US' ? 'Choose a state' : 'Choose a province'], ...(cty === 'US' ? US_STATES : CA_PROVINCES).map(s => [s, s])], value: x.state, req: true, err: e.state }) : '')
    + fieldHtml({ id: 'ad-zip', f: 'zip', label: zipLabel, value: x.zip, req: true, autocomplete: 'postal-code', inputmode: cty === 'US' ? 'numeric' : 'text', help: cty === 'US' ? '5 digits, or ZIP+4. For example: 19102.' : cty === 'CA' ? 'For example: K1A 0B1.' : '', err: e.zip, cls: 'field--mid' });
  return { progress: ezProgress(1, 2, 'Address'), lead: ezStepLead('country'), body, saveDisabled: JSON.stringify(x) === JSON.stringify(a), noSaveWhy: 'Change something to save.' };
};
// Date of birth: separate, labeled month, day and year
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
EZED.dob = (r, ri) => {
  const p = D().profile; if (!r.u.d) r.u.d = { dob: p.dob }; const x = r.u.d, e = r.u.err || {};
  ref('919');
  if (x.mm === undefined) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(x.dob || ''); x.mm = m ? String(+m[1]) : ''; x.dd = m ? String(+m[2]) : ''; x.yy = m ? m[3] : ''; }
  x.dob = x.mm || x.dd || x.yy ? `${String(x.mm).padStart(2, '0')}/${String(x.dd).padStart(2, '0')}/${x.yy}` : '';
  const err = ezMsg('dob', e.dob);
  const body = ezQ('What’s your date of birth?', 'Optional.') + netAlert(r)
    + `<fieldset class="ads-fieldset" ${err ? 'aria-describedby="ed-dob-err"' : ''}><legend class="ads-sr-only">Date of birth</legend><div class="ez-dob">${fieldHtml({ id: 'ed-dob-m', f: 'mm', label: 'Month', select: [['', 'Month'], ...MONTHS.map((m, i) => [String(i + 1), m])], value: x.mm })}${fieldHtml({ id: 'ed-dob-d', f: 'dd', label: 'Day', value: x.dd, digits: 2, inputmode: 'numeric', placeholder: 'DD', cls: 'ez-dob__day' })}${fieldHtml({ id: 'ed-dob', f: 'yy', label: 'Year', value: x.yy, digits: 4, inputmode: 'numeric', placeholder: 'YYYY', autocomplete: 'bday-year', cls: 'ez-dob__year' })}</div>${ezErr('ed-dob-err', err)}</fieldset>`
    + (p.dob ? `<button class="ads-btn ads-btn--tertiary ads-btn--block" type="button" data-a="ez-dob-remove">Remove date of birth</button>` : '') + `<p class="ss-note">${q(6)}</p>`;
  return { body, saveDisabled: (x.dob || '') === (p.dob || ''), noSaveWhy: 'Change the date to save.', saveA: 'ez-dob-save' };
};
A['ez-dob-remove'] = (t, ri) => { const r = routeAt(ri); Object.assign(r.u.d, { mm: '', dd: '', yy: '', dob: '' }); r.u.dirty = true; render(); };
A['ez-dob-save'] = (t, ri) => { const r = routeAt(ri), x = r.u.d; x.dob = x.mm || x.dd || x.yy ? `${String(x.mm).padStart(2, '0')}/${String(x.dd).padStart(2, '0')}/${x.yy}` : ''; SAVE.dob(r, ri); };
// Discount: same choices and rules, with a labeled save button
EZ.discounts = (r, ri) => {
  const o = SCR.discounts(r, ri), d = D(), x = r.u.d;
  const changed = x.type !== d.discount.type || (x.type === 'rpa' && x.rpa !== d.discount.rpa);
  const body = ezQ('Choose your discount', 'We’ll choose it for you when you book. Senior and youth fares are set by age when you book.') + o.body.replace(/<p class="ads-helper" id="nosave-[^"]*">[^<]*<\/p>/, '').replace('Passenger types and discount rules', 'Who can get each discount').replace(/<p class="ghint">[^]*?<\/p>/, '');
  return { title: 'Passenger discount', kind: 'push', body, foot: (changed ? '' : `<p class="ads-helper" id="nosave-${ri}">Choose a different discount to save.</p>`) + busyBtn(r, 'Save discount', 'Saving', `data-a="disc-save" ${changed ? '' : `disabled aria-describedby="nosave-${ri}"`}`), offlineText: o.offlineText };
};
EZ.rules = (r, ri) => { const o = SCR.rules(r, ri); o.title = 'Discount rules'; return o; };

// Verification keeps its shared screens; Easy styling makes the code boxes and buttons larger.
