/* Sprint 4 prototype: shared interaction system (all versions).
   Navigation levels:
     1. Tabs switch between top-level destinations (no transition).
     2. Inside a flow, a detail screen is pushed; Back returns one level.
     3. A contained task (booking, Account, Inbox) is a modal sheet: Close at its root; Back on deeper
        screens, plus Close, which ends the whole flow.
     4. Supporting information (explanations, policies, help) is a secondary sheet over the task. The task
        stays visible, dimmed and inactive. A further level opens inside the same sheet with Back; sheets
        never stack. Closing restores the exact step, selections and scroll position.
   Focused input: on iPhone, station search grows out of the field that was tapped. The search field leads,
   with Back inside it; results follow. Choosing a station returns it to the task. */

// ---------- Supporting information content ----------
const INFO = {
  codes: {
    title: 'About coupon and promotion codes',
    body: () => `<p>Promo codes have 4 letters or numbers. Coupon codes have 14 and can give a percentage or dollar amount off, or a free companion.</p><p>Each code has a type, benefit, expiry date and its own restrictions, and most can’t be combined with other discounts. We check the code against your train, dates and travelers when you find trains.</p><p>Codes can’t be used when you pay with points, for TripLink Corporate bookings or for Pass Rider travel.</p>`
  },
  'youth-alone': {
    title: 'Traveling alone?',
    body: () => `<p>A youth needs an adult or senior on the same booking in the app.</p><div class="info-pending"><b>Youths traveling without an adult</b><span>Content pending</span></div>${snote('Unaccompanied minor rules will come from AEM.')}${q(10)}`
  },
  // NMA-628 and NMA-621 have no defined content: placeholders only, no invented copy or behavior
  'service-animals': {
    title: 'Service animals',
    body: () => `<div class="info-art" aria-hidden="true">${ic('service-dog')}</div><div class="info-pending"><b>Service animal information</b><span>Content pending</span></div>${snote('Service animal content and rules will come from AEM; none are defined for Sprint 4.')}<p>${infoLink('accessible-travel', 'About accessible travel', 'push')}</p>`
  },
  'accessible-travel': {
    title: 'Accessible travel',
    body: () => `<div class="info-pending"><b>Accessible travel with Amtrak</b><span>Content pending</span></div>${snote('Accessible travel content will come from AEM.')}`
  },
  rules: { title: 'Discount rules', body: () => SCR.rules().body }
};
// Topics with a parameter: coupon details (NMA-697) and station details (NMA-600 S4)
function infoTopic(topic) {
  const [k, arg] = topic.split(':');
  if (k === 'coupon') return couponInfo(arg);
  if (k === 'station') return stationInfo(arg);
  return INFO[topic];
}
// Station details (NMA-600 S4): a separate control, because tapping a station chooses it (S2). The details
// page itself is NMA-604, outside Sprint 4, so only the data the app already has is shown (Q3).
function stationInfo(code) {
  const s = ST[code]; if (!s) return { title: 'Station', body: () => '' };
  return { title: `${s.city}, ${s.st}`, body: () => `<dl class="cpn-dl"><dt>Station</dt><dd>${esc(s.name)}</dd><dt>Code</dt><dd>${s.code}</dd><dt>City</dt><dd>${esc(s.city)}, ${esc(s.state)}</dd><dt>ZIP code</dt><dd>${s.zip}</dd>${s.aliases.length ? `<dt>Also known as</dt><dd>${esc(s.aliases.join(', '))}</dd>` : ''}${s.tag ? `<dt>Service</dt><dd>${esc(s.tag)} only</dd>` : ''}</dl><div class="info-pending"><b>Hours, accessibility, parking and amenities</b><span>Content pending</span></div>${snote('The station details page isn’t part of Sprint 4.')}${q(3)}` };
}
// A link that opens supporting information (or, inside the sheet, goes one level deeper)
function infoLink(topic, label, mode = 'open') {
  return `<button class="ads-link ads-link--sm linkbtn" type="button" data-a="${mode === 'push' ? 'info-push' : 'info'}" data-topic="${topic}">${label}</button>`;
}

// ---------- The sheet ----------
function openInfo(topic, returnFocus, silent) {
  nav().info = { stack: [topic], returnFocus: returnFocus || `[data-topic="${topic}"]` };
  pendingFocus = 'title'; if (!silent) render();
}
function renderInfo(o, covered) {
  const topic = o.stack[o.stack.length - 1], t = infoTopic(topic), depth = o.stack.length;
  const back = depth > 1 ? `<button class="ads-navbar__btn" type="button" data-a="info-back" aria-label="Back to ${esc(infoTopic(o.stack[depth - 2]).title)}">${ic('chevron-left')}<span>Back</span></button>` : '';
  return `<div class="info-layer" ${covered ? 'inert' : ''}><div class="info-scrim" data-a="info-close" aria-hidden="true"></div><div class="info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-t">${IPAD() ? '' : '<span class="ads-sheet__grabber" aria-hidden="true"></span>'}<div class="info-head"><div class="info-head__lead">${back}</div><h2 class="info-title" id="info-t" tabindex="-1" data-title>${esc(t.title)}</h2><div class="info-head__trail"><button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="info-close" aria-label="Close ${esc(t.title)}">${ic('close', 'ads-icon--sm')}</button></div></div><div class="info-body" data-scroll="info-${topic.replace(':', '-')}" data-info-depth="${depth}">${t.body()}</div></div></div>`;
}
A.info = t => openInfo(t.dataset.topic, t.dataset.k ? `[data-k="${t.dataset.k}"]` : `[data-a="${t.dataset.a}"][data-topic="${t.dataset.topic}"]`);
A['info-push'] = t => { nav().info.stack.push(t.dataset.topic); pendingFocus = 'title'; render(); };
A['info-back'] = () => { const i = nav().info, from = i.stack.pop(); pendingFocus = `.info-body [data-topic="${from}"]`; render(); };
A['info-close'] = () => { const i = nav().info; if (!i) return; nav().info = null; pendingFocus = i.returnFocus; render(); };

// Explanations that used to be alert dialogs are supporting information
A['code-info'] = t => openInfo('codes', `[data-a="code-info"]`);
A['youth-alone'] = () => openInfo('youth-alone', '[data-a="youth-alone"]');

// ---------- Focused station search: remember the field it grows out of ----------
const pickStationBeforeFocus = A['pick-station'];
A['pick-station'] = (t, ri) => {
  if (stationFocus() && t && t.getBoundingClientRect) MOTION.field = { rect: rectIn(t), at: performance.now() };
  pickStationBeforeFocus(t, ri);
};
