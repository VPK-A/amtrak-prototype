/* Sprint 4 prototype: Version 2 Fare Finder, Airbnb-inspired guided search.
   Three stacked rounded sections (Where, When, Who), one expanded at a time. Completed sections
   collapse into short, editable summaries and can be reopened without restarting. Booking intent sits
   at the top; coupon and promo codes have their own card, apart from passenger
   discounts. A persistent bottom bar holds Next and Find Trains. All rules come from the shared code. */

const GS = ['where', 'when', 'who'];
const GS_Q = { where: 'Where are you traveling?', when: 'When are you traveling?', who: 'Who’s traveling?' };
const GS_LABEL = { where: 'Where', when: 'When', who: 'Who' };
function gsState(b) {
  const intent = intentOf(b);
  return {
    where: !!(b.from && b.to),
    when: b.trip === 'ow' || !!b.ret,
    who: intent === 'corporate' ? true : intent === 'pr' ? !!b.prType : !paxProblems(b.pax).length
  };
}
function gsErrors(r, b) {
  if (!r.u.showErr) return {};
  const e = ffErrors(b), st = gsState(b), out = {};
  if (e.from || e.to) out.where = e.from && e.to ? 'Choose a departure and an arrival station.' : e.from ? 'Choose a departure station.' : 'Choose an arrival station.';
  if (e.ret) out.when = 'Choose a return date, or switch to One-way.';
  if (!st.who) out.who = intentOf(b) === 'pr' ? 'Choose Business or Leisure travel.' : paxProblems(b.pax)[0];
  return out;
}
function gsSummary(k, b, d) {
  const intent = intentOf(b);
  if (k === 'where') return b.from || b.to ? `${b.from ? `${b.from} · ${ST[b.from].city}` : 'Choose departure'} → ${b.to ? `${b.to} · ${ST[b.to].city}` : 'choose arrival'}` : 'Choose stations';
  if (k === 'when') return b.trip === 'ow' ? `One-way · ${fmtShort(b.dep)}` : `Round-trip · ${fmtShort(b.dep)} – ${b.ret ? fmtShort(b.ret) : 'choose return'}`;
  if (intent === 'corporate') return `1 Adult · Corporate${b.assistOn && b.assistDone ? ' · Assistance' : ''}`;
  if (intent === 'pr') return `${prSummary(b, d)}${b.prType ? '' : ' · choose travel type'}`;
  const extras = [discSummary(b) !== 'None chosen' ? 'Discounts' : '', b.assistOn ? 'Assistance' : ''].filter(Boolean);
  return [paxSummary(b), ...extras].join(' · ');
}
function gsSeg(label, key, opts, cur, id) {
  return `<div class="gs-mode"><span class="gs-mode__label" id="gs-${id}">${label}</span><div class="ads-segmented" role="group" aria-labelledby="gs-${id}">${opts.map(([v, l]) => `<button type="button" data-a="ffc-set" data-key="${key}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div></div>`;
}
// Favorites first, then recent stations (last 10 days), as quick picks for the empty field
function gsQuick(b, d) {
  const f = !b.from ? 'from' : !b.to ? 'to' : null; if (!f) return '';
  const other = f === 'from' ? 'to' : 'from';
  const list = [...d.fav, ...d.rec.filter(x => x.d <= 10 && !d.fav.includes(x.c)).sort((a, c) => a.d - c.d).map(x => x.c)].filter(c => c !== b[other] && !(AUTO_TRAIN[c] && autoTrainBlocked())).slice(0, 2); // two quick picks: favorites first, then the most recent
  if (!list.length) return '';
  return `<div class="gs-quick"><p class="gs-quick__label" id="gs-ql">${f === 'from' ? 'Leave from' : 'Go to'} a favorite or recent station</p><div class="gs-quick__list" role="group" aria-labelledby="gs-ql">${list.map(c => `<button class="gs-chip" type="button" data-a="gs-quick" data-field="${f}" data-code="${c}">${d.fav.includes(c) ? ic('bookmark-filled', 'ads-icon--sm') : ic('history', 'ads-icon--sm')}<span><b>${c}</b> ${ST[c].city}, ${ST[c].st}</span></button>`).join('')}</div></div>`;
}
function ffGuided(r, ri) {
  const d = D(), b = d.booking, v = V(), member = d.signedIn, intent = intentOf(b);
  const corp = intent === 'corporate', pr = intent === 'pr', std = !corp && !pr;
  const st = gsState(b), errs = gsErrors(r, b);
  if (r.u.open === undefined) r.u.open = st.where ? null : 'where';
  ref('607', '608', '1060', '611', '612'); if (std) ref('613'); if (member) ref('624');
  if (d.triplink && member) ref('622'); if (d.passrider && member) ref('623', '1016', '1017', '1018', '1019');
  // Booking intent (TripLink, Pass Rider), at the top like Airbnb's tabs
  const modes = [];
  if (member && d.triplink) modes.push(gsSeg('Booking for', 'intent', [['corporate', 'Corporate'], ['personal', 'Personal']], b.intent, 'intent'));
  if (member && d.passrider) modes.push(gsSeg('Book as', 'intent', [['pr', 'Pass Rider'], ['personal', 'Personal']], b.intent, 'intent'));
  const top = modes.length || b.modeNote ? `<div class="gs-top">${modes.join('')}${b.modeNote ? `<p class="gs-note" role="status">${ic('info-circle', 'ads-icon--sm')}<span>${b.modeNote}</span></p>` : ''}${corp ? q(12) : ''}</div>` : '';
  const content = {
    where: () => {
      const e = r.u.showErr ? ffErrors(b) : {};
      return `${ffNotice(b)}${routeField(r, ri)}${gsQuick(b, d)}<p class="ss-note">Choose a field to search every station by city, name, code or ZIP. Favorites and recent stations come first. ${q(1)}</p>`;
    },
    when: () => {
      const e = r.u.showErr ? ffErrors(b) : {};
      const field = b.trip === 'ow' ? 'dep' : (r.u.picking || 'dep');
      return `${tripSeg()}${b.trip === 'ow' ? `<p class="gs-chosen"><span>Depart</span><b>${fmtWeekday(b.dep)}, ${fmtDate(b.dep)}</b></p>` : ''}${e.ret ? `<p class="ads-helper ads-helper--error" id="ff-ret-err">${ic('alert-diamond')}<span>${e.ret}</span></p>` : ''}<div class="gs-cal" data-scroll="gs-cal">${calendarBody(r, ri, field)}</div>`;
    },
    who: () => {
      let h = '';
      if (pr) {
        const elig = d.passrider.role === 'employee' && d.passrider.business, miss = r.u.showErr && !b.prType;
        h += elig ? `<div class="gs-field"><span class="gs-field__label" id="gs-prt">Travel type <span class="ads-field__marker ads-field__marker--required">Required</span></span><div class="ads-segmented" role="group" aria-labelledby="gs-prt" ${miss ? 'aria-describedby="gs-prt-err"' : ''}>${[['business', 'Business'], ['leisure', 'Leisure']].map(([k, l]) => `<button type="button" data-a="pr-type" data-v="${k}" aria-pressed="${b.prType === k}">${l}</button>`).join('')}</div>${miss ? `<p class="ads-helper ads-helper--error" id="gs-prt-err">${ic('alert-diamond')}<span>Choose Business or Leisure travel.</span></p>` : '<p class="ads-helper">Business travel is for you alone. Family and companions travel as Leisure.</p>'}</div>`
          : `<p class="gs-chosen"><span>Travel type</span><b>Leisure</b></p><p class="ads-helper">${d.passrider.role === 'employee' ? 'Business travel needs an active Business Pass.' : 'Spouses and dependents travel as Leisure.'}</p>`;
      }
      return h + travelersClear(r, ri, 'parts', v.entry).body;
    }
  };
  const sections = GS.map((k, i) => {
    const open = r.u.open === k, err = errs[k];
    if (!open) return `<section class="gs${err ? ' has-error' : ''}" id="gs-${k}"><button class="gs__sum" type="button" data-a="gs-open" data-k="${k}" aria-expanded="false" aria-controls="gs-${k}-body" ${err ? `aria-describedby="gs-${k}-err"` : ''}><span class="gs__label">${GS_LABEL[k]}</span><span class="gs__val">${esc(gsSummary(k, b, d))}</span>${ic(err ? 'alert-diamond' : 'chevron-down', 'gs__chev')}</button>${err ? `<p class="gs__err" id="gs-${k}-err">${err}</p>` : ''}<div id="gs-${k}-body" hidden></div></section>`;
    return `<section class="gs is-open${err ? ' has-error' : ''}" id="gs-${k}" aria-labelledby="gs-${k}-q"><div class="gs__head"><h3 class="gs__q" id="gs-${k}-q" tabindex="-1">${GS_Q[k]}</h3><span class="gs__step">${i + 1} of 3</span></div><div class="gs__body" id="gs-${k}-body">${content[k]()}</div></section>`;
  }).join('');
  // Coupon and promo codes: a separate card, apart from passenger discounts (NMA-613)
  let code = '';
  if (std) code = b.code
    ? `<section class="gs gs--code" aria-label="Coupon or promo code"><div class="gs__sum gs__sum--static"><span class="gs__label">Code</span><span class="gs__val">${esc(b.code.code)} · ${esc(b.code.kind)}<small>${b.code.benefit ? esc(b.code.benefit) + '. ' : ''}Checked for your trip when you find trains.</small></span><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-a="code-remove" aria-label="Remove code ${esc(b.code.code)}">Remove</button></div>${b.codeErr ? `<p class="gs__err" id="ffc-code-err" role="alert">${b.codeErr}</p>` : ''}</section>`
    : `<section class="gs gs--code" aria-label="Coupon or promo code"><div class="gs__sum gs__sum--split"><button class="gs__sumbtn" type="button" data-a="push" data-s="code"><span class="gs__label">Coupon or promo code</span><span class="gs__val">Add</span>${ic('chevron-right', 'gs__chev')}</button><button class="ads-icon-btn ads-icon-btn--sm" type="button" data-a="code-info" aria-label="About discount codes">${ic('info-circle', 'ads-icon--sm')}</button></div></section>`;
  else code = `<section class="gs gs--code gs--muted"><div class="gs__sum gs__sum--static"><span class="gs__label">Discounts</span><span class="gs__val">Discounts and codes aren’t used for ${corp ? 'Corporate bookings' : 'Pass Rider travel'}.</span></div></section>`;
  if (d.coupons.length && std) tip('Discount code: try V123, a 14-character coupon, the companion coupon with 1 traveler, “EXP1” (rejected) or “DATE” (wrong date range).');
  tip('Open any section to change it; the others keep their answers. Find Trains works at any point and opens the first section that needs attention.');
  const offline = v.net === 'offline' ? `<div class="ads-banner gs-banner" role="status">${ic('alert-triangle')}<span>You’re offline. You can fill in your trip. Finding trains needs a connection.</span></div>` : '';
  const nextK = r.u.open && GS[GS.indexOf(r.u.open) + 1];
  const foot = `<div class="gs-foot">${nextK ? `<button class="ads-btn ads-btn--secondary" type="button" data-a="gs-next" aria-label="Next: ${GS_LABEL[nextK]}">Next</button>` : ''}${r.u.busy ? busyBtn(r, '', 'Finding trains') : `<button class="ads-btn ads-btn--block" type="button" data-a="find-trains">${ic('search')}Find Trains</button>`}</div>`;
  return { title: 'New Booking', kind: 'root', cls: 'pane--gs', banner: false, body: `${offline}${top}<div class="gs-stack">${sections}${code}</div>${netAlert(r)}`, foot };
}
A['gs-open'] = (t, ri) => { const r = routeAt(ri); r.u.open = t.dataset.k; pendingFocus = `#gs-${t.dataset.k}-q`; render(); };
A['gs-next'] = (t, ri) => { const r = routeAt(ri), n = GS[GS.indexOf(r.u.open) + 1]; if (n) { r.u.open = n; pendingFocus = `#gs-${n}-q`; render(); } };
// A favorite or recent station chip: same rules as choosing it in station search
A['gs-quick'] = (t, ri) => {
  const r = routeAt(ri), d = D(), b = d.booking, f = t.dataset.field, c = t.dataset.code, other = f === 'from' ? 'to' : 'from';
  if (b[other] === c) { dialog({ title: 'Select a different station', body: 'Select different origin and destination stations.', actions: [['OK', 'primary', null]], returnFocus: `[data-a="gs-quick"][data-code="${c}"]` }); return; }
  b[f] = c; b.notice = null;
  if (AUTO_TRAIN[c]) { b[other] = AUTO_TRAIN[c]; b.notice = `${ST[c].city} is an Auto Train station. Auto Train only runs between Lorton, VA and Sanford, FL, so ${ST[AUTO_TRAIN[c]].city} was added as your ${other === 'to' ? 'arrival' : 'departure'} station.`; }
  else if (b[other] && AUTO_TRAIN[b[other]]) { b.notice = `${ST[b[other]].city} only connects to ${ST[AUTO_TRAIN[b[other]]].city} (Auto Train), so it was cleared. Choose your ${other === 'to' ? 'arrival' : 'departure'} station.`; b[other] = null; }
  if (!d.fav.includes(c)) d.rec = [{ c, d: 0 }, ...d.rec.filter(x => x.c !== c)];
  if (b.from && b.to) { r.u.open = 'when'; pendingFocus = '#gs-when-q'; } else pendingFocus = `#ff-${other}`;
  render();
};
// After station search returns with both stations, the guided flow moves on to When
const chooseStationBase = A['choose-station'];
A['choose-station'] = (t, ri) => {
  chooseStationBase(t, ri);
  if (!v2() || nav().dialog) return;
  const sh = sheet(), b = D().booking;
  if (sh && sh.stack.length === 1 && sh.stack[0].s === 'ff' && b.from && b.to && sh.stack[0].u.open === 'where') { sh.stack[0].u.open = 'when'; pendingFocus = '#gs-when-q'; render(); }
};
// Find Trains: open the first section that needs attention, so nothing required stays hidden
function findGuided(t, ri) {
  const r = routeAt(ri), b = D().booking;
  r.u.showErr = true;
  const errs = gsErrors(r, b), first = GS.find(k => errs[k]);
  if (first) { r.u.open = first; pendingFocus = first === 'where' ? (b.from ? '#ff-to' : '#ff-from') : first === 'when' ? '#ff-ret-err' : '#gs-who .ads-helper--error, #gs-who-q'; render(); return; }
  r.u.showErr = false; searchWithCode(r, ri);
}

// Version 2 demo states (Flow menu › I)
const populatedBase = V3_PLACES.populated;
Object.assign(V3_PLACES, {
  populated: () => { populatedBase(); if (v2()) { sheet().stack[0].u.open = null; render(); } },
  partial: () => { const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; sheet().stack[0].u.open = 'when'; pendingFocus = '#gs-when-q'; render(); },
  reopened: () => { V3_PLACES.populated(); sheet().stack[0].u.open = 'where'; pendingFocus = '#gs-where-q'; render(); },
  validate: () => A['find-trains'](null, '0'),
  whoerror: () => { const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; b.pax = { adult: 0, senior: 0, ya: 0, youth: 0, child: 1, infant: 0 }; sheet().stack[0].u.open = null; A['find-trains'](null, '0'); },
  who: () => { const b = D().booking; if (b.intent === 'pr') b.prType = 'leisure'; sheet().stack[0].u.open = 'who'; render(); }
});
