// Header design exploration (branch explore/header-variants): six visual variants of the app shell header and the
// New booking modal header, switched from Prototype controls › Header design. 0 is the current design.
// Only markup and styling change: the actions (open-account, open-inbox, close) and every business rule are the same.
// Feedback being explored: modal headers more subtle (same background, stripe hairline between; the arrow saved for
// the global header) and a more prominent profile entry (welcome with name, loyalty branding, room for personalization).
const HX_NAMES = ['Current', 'Hairline', 'Arrow band', 'Loyalty card', 'Tone on tone', 'Welcome and ribbon', 'Arrow pattern'];
const HX_LINES = [
  'Small avatar and greeting; navy modal header with the brand arrow.',
  'Welcome with full name and tier on the page color; a red and blue hairline under both headers.',
  'Navy global header carries the brand arrow; the modal header is quiet with one split hairline.',
  'Greeting plus a Guest Rewards card as the profile entry; centered modal title with fine hairlines.',
  'Warm band with a tone-on-tone arrow behind the welcome; modal title under a short stripe eyebrow.',
  'Large welcome, then an arrow ribbon above the search; modal header with a full-width hairline.',
  'Warm band with one large tone-on-tone arrow repeating; the modal header repeats large chevrons, with no stripe.'
];
TB.hx = Math.min(6, Math.max(0, +store.get('s4-hx') || 0));

// The brand arrow (two bars ending in the arrow tips), sized with --s. Decorative.
const hxArrow = cls => `<span class="hx-arrow ${cls || ''}" aria-hidden="true"><span class="ads-sheet-header__arrow ads-sheet-header__arrow--top">__ARROW_RED__<i></i></span><span class="ads-sheet-header__arrow ads-sheet-header__arrow--bottom">__ARROW_BLUE__<i></i></span></span>`;
const hxStripe = cls => `<span class="hx-stripe ${cls || ''}" aria-hidden="true"><i></i><i></i></span>`;

const appHeaderCurrent = appHeader;
appHeader = function () {
  const v = TB.hx; if (!v) return appHeaderCurrent();
  const d = D(), on = d.signedIn, first = on ? esc(d.profile.first) : '', full = on ? `${first} ${esc(d.profile.last)}` : '';
  const TIER = 'Select Plus', PTS = '12,450'; // the same sample membership the current header and Account show
  const acct = `type="button" data-a="open-account" aria-label="Account${on ? `: ${full}, ${TIER}, ${PTS} points` : ', signed out. Sign in or join Guest Rewards'}"`;
  const avatar = on ? `<span class="ads-avatar hx-avatar">${esc(d.profile.first[0] + d.profile.last[0])}</span>` : `<span class="ads-avatar hx-avatar hx-avatar--guest">${ic('person')}</span>`;
  const inbox = `<button class="ads-icon-btn ads-icon-btn--round hx-inbox" type="button" data-a="open-inbox" aria-label="Notification inbox, 2 unread">${ic('email')}<span class="ads-icon-btn__dot"></span></button>`;
  const loy = on ? `<span class="hx-loy"><span class="ads-badge hx-tier">${TIER}</span><span class="hx-pts">${PTS} pts</span></span>` : `<span class="hx-loy"><span class="hx-pts">Join Guest Rewards to earn points</span></span>`;
  const chev = ic('chevron-right', 'hx-chev');
  // On Book the New booking search is part of the header (one component); other tabs show the header without it
  const search = nav().tab === 'book' ? `<button class="bk-new hx-search" type="button" data-a="open-booking">${ic('search', 'bk-new__icon')}<span class="bk-new__text"><span class="bk-new__title">New booking</span><span class="bk-new__sub">Where to?</span></span></button>` : '';
  let h = '';
  if (v === 1) h = `<div class="hx-row"><button class="ads-appheader__account hx-acct" ${acct}>${avatar}<span class="hx-text"><span class="hx-eyebrow">${on ? 'Welcome back' : 'Welcome to Amtrak'}</span><span class="hx-name">${on ? full : 'Sign in'}</span>${loy}</span></button>${inbox}</div>${search}${hxStripe()}`;
  else if (v === 2) h = `<div class="hx-row"><button class="ads-appheader__account hx-acct" ${acct}><span class="hx-text"><span class="hx-eyebrow">${on ? 'Welcome back' : 'Welcome to Amtrak'}</span><span class="hx-name">${on ? first : 'Sign in'}</span><span class="hx-loy"><span class="hx-pts">${on ? `${TIER} · ${PTS} pts` : 'Join Guest Rewards'}</span></span></span></button>${inbox}${hxArrow()}</div>${search}`;
  else if (v === 3) h = `<div class="hx-row"><p class="hx-text"><span class="hx-eyebrow">Good morning</span><span class="hx-name">${on ? first : 'Welcome to Amtrak'}</span></p>${inbox}</div><button class="ads-appheader__account hx-card" ${acct}><span class="hx-card__l"><span class="hx-card__k">Amtrak Guest Rewards</span><span class="hx-card__tier">${on ? TIER : 'Sign in or join'}</span></span>${on ? `<span class="hx-card__r"><span class="hx-card__pts">${PTS}</span><span class="hx-card__k">points</span></span>` : ''}${chev}${hxStripe()}</button>${search}`;
  else if (v === 4) h = `${hxArrow('hx-arrow--tone')}<div class="hx-row"><button class="ads-appheader__account hx-acct" ${acct}>${avatar}<span class="hx-text"><span class="hx-eyebrow">${on ? 'Welcome back' : 'Welcome to Amtrak'}</span><span class="hx-name">${on ? first : 'Sign in'}</span>${loy}</span></button>${inbox}</div>${search}`;
  else if (v === 5) h = `<div class="hx-row"><button class="ads-appheader__account hx-acct" ${acct}>${avatar}<span class="hx-text"><span class="hx-name">${on ? `Good morning, ${first}` : 'Welcome to Amtrak'}</span>${on ? loy : `<span class="hx-loy"><span class="hx-pts">Sign in or join Guest Rewards</span></span>`}</span></button>${inbox}</div>${hxArrow('hx-arrow--ribbon')}${search}`;
  else h = `<span class="hx-pattern hx-pattern--bars" aria-hidden="true"></span><div class="hx-row"><button class="ads-appheader__account hx-acct" ${acct}>${avatar}<span class="hx-text"><span class="hx-eyebrow">${on ? 'Welcome back' : 'Welcome to Amtrak'}</span><span class="hx-name">${on ? first : 'Sign in'}</span>${loy}</span></button>${inbox}</div>${search}`;
  return `<header class="ads-appheader hx-ah hx-ah--${v}${search ? ' hx-ah--book' : ''}">${h}</header>`;
};

// Book landing: with a header variant on a phone, the search lives in the header, so the page omits its own copy
const bookLandingCurrent = bookLanding;
bookLanding = function () {
  const h = bookLandingCurrent();
  return TB.hx && !IPAD() ? h.replace(/<div class="bk-headx">[\s\S]*?<\/button><\/div>/, '') : h;
};

// New booking modal header: the same close button and title (same ids and actions), without the navy band and arrow
const sheetHeaderCurrent = sheetHeader;
sheetHeader = function (o) {
  const v = TB.hx; if (!v || o.plain) return sheetHeaderCurrent(o);
  return sheetHeaderCurrent(Object.assign({}, o, { plain: true })).replace('ads-sheet-header--plain', `ads-sheet-header--plain hx-mh hx-mh--${v}`).replace('</header>', `${v === 6 ? '<span class="hx-pattern hx-pattern--chev" aria-hidden="true"></span>' : hxStripe()}</header>`);
};

// Prototype controls › Header design
(function wireHx() {
  const seg = document.getElementById('tbHx'), name = document.getElementById('tbHxName'); if (!seg) return;
  const sync = () => { setSeg('#tbHx', String(TB.hx)); if (name) name.textContent = `${HX_NAMES[TB.hx]}: ${HX_LINES[TB.hx]}`; };
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; TB.hx = +b.dataset.v; store.set('s4-hx', String(TB.hx)); sync(); pendingFocus = null; render(); });
  sync();
})();
