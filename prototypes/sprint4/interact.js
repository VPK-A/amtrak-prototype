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
    title: 'About discount codes',
    body: () => `<p>Promo codes have 4 letters or numbers. Coupon codes have 14 and can give a percentage or dollar amount off, or a free companion.</p><p>Each code has a type, benefit, expiry date and its own restrictions, and most can’t be combined with other discounts. We check the code against your train, dates and travelers when you find trains.</p><p>Codes can’t be used when you pay with points, for TripLink Corporate bookings or for Pass Rider travel.</p>`
  },
  'youth-alone': {
    title: 'Traveling alone?',
    body: () => `<p>The rules for youths traveling without an adult (unaccompanied minors) will come from AEM. They aren’t in this prototype.</p><p>In the app, a youth needs an adult or senior on the same booking.</p>${q(10)}`
  },
  'service-animals': {
    title: 'Service animals',
    body: () => `<div class="info-art" aria-hidden="true">${ic('service-dog')}</div><p>Service animals aren’t pets, so you don’t add them as travelers.</p><p>If your service animal is large, add <b>Large service animal</b> in the traveler’s assistance, so the right space is planned for you.</p><p>Traveling with an emotional support animal? Check our ${infoLink('accessible-travel', 'accessible travel policy', 'push')}.</p><p class="info-draft">Draft text. The final content comes from AEM (NMA-628).</p>`
  },
  'accessible-travel': {
    title: 'Accessible travel',
    body: () => `<p>Accessible travel covers station assistance, accessible seats and spaces, mobility devices, service animals and the Passenger with Disability discount.</p><p>Tell us what you need in each traveler’s assistance and we plan it with your trip.</p><p class="info-draft">Placeholder. The policy content comes from AEM (NMA-621).</p>`
  },
  rules: { title: 'Discount rules', body: () => SCR.rules().body }
};
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
  const topic = o.stack[o.stack.length - 1], t = INFO[topic], depth = o.stack.length;
  const back = depth > 1 ? `<button class="ads-navbar__btn" type="button" data-a="info-back" aria-label="Back to ${esc(INFO[o.stack[depth - 2]].title)}">${ic('chevron-left')}<span>Back</span></button>` : '';
  return `<div class="info-layer" ${covered ? 'inert' : ''}><div class="info-scrim" data-a="info-close" aria-hidden="true"></div><div class="info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-t">${IPAD() ? '' : '<span class="ads-sheet__grabber" aria-hidden="true"></span>'}<div class="info-head"><div class="info-head__lead">${back}</div><h2 class="info-title" id="info-t" tabindex="-1" data-title>${esc(t.title)}</h2><div class="info-head__trail"><button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-a="info-close" aria-label="Close ${esc(t.title)}">${ic('close', 'ads-icon--sm')}</button></div></div><div class="info-body" data-scroll="info-${topic}" data-info-depth="${depth}">${t.body()}</div></div></div>`;
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
