/* Sprint 4 prototype: motion, following the Amtrak mobile motion system prompts.
   One small token scale (MT, EASE in core.js) used everywhere:
     tap 100 ms · control 200 ms · panel 280 ms · shared 360 ms · close 260 ms · stagger 35 ms · fade 120 ms
   Principles: source and destination stay related; the user's action leads; one element gets the primary
   movement; content reveals after its container settles; motion never delays travel information.
   Under reduced motion (system setting or the toolbar), spatial travel, scale and blur are replaced by
   short fades or direct changes, with the same focus order.
   Animations run with the Web Animations API and are re-applied at the right point if the screen
   re-renders mid-transition, so a render never restarts or cuts a transition short. */

const MOTION = { reduced: false, prev: {}, live: [], origin: null, closing: null, alerts: new Set() };
try { MOTION.reduced = localStorage.getItem('s4-motion') === 'reduced'; } catch (e) {}
const motionOff = () => MOTION.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;
const devEl = () => document.getElementById('device');
// Position of an element inside the (scaled) device frame, in device pixels
function rectIn(el) {
  const dev = devEl(), d = dev.getBoundingClientRect(), s = d.width / dev.offsetWidth || 1, r = el.getBoundingClientRect();
  return { x: (r.left - d.left) / s, y: (r.top - d.top) / s, w: r.width / s, h: r.height / s };
}
// A "live" animation survives re-renders: after every render it's applied again at its current time
function play(key, sel, frames, opts, stagger = 0) {
  MOTION.live = MOTION.live.filter(x => x.key !== key);
  const spec = { key, sel, frames, opts, stagger, start: performance.now() };
  MOTION.live.push(spec); applySpec(spec);
}
function applySpec(spec) {
  const els = $$(spec.sel, devEl()), t = performance.now() - spec.start;
  const total = (spec.opts.duration || 0) + (spec.opts.delay || 0) + spec.stagger * Math.max(0, els.length - 1);
  if (t >= total) return false;
  els.forEach((el, i) => { const a = el.animate(spec.frames, Object.assign({ fill: 'both' }, spec.opts, { delay: (spec.opts.delay || 0) + i * spec.stagger })); a.currentTime = t; });
  return true;
}
// Something that has just left the screen fades or slides out as a copy, so state changes stay immediate
function ghostOut(node, frames, duration, easing = EASE.exit) {
  if (!node) return;
  const g = node.cloneNode(true); g.setAttribute('inert', ''); g.setAttribute('aria-hidden', 'true'); g.style.pointerEvents = 'none'; g.classList.add('mo-ghost');
  g.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
  devEl().appendChild(g);
  const target = g.matches('.dialog-layer, .cover-layer, .toast-wrap, .info-layer') ? (g.querySelector('.pdialog, .pcover, .ads-toast, .info-sheet') || g) : g;
  const a = target.animate(frames, { duration, easing, fill: 'forwards' });
  if (target !== g) g.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing, fill: 'forwards' });
  a.onfinish = () => g.remove(); setTimeout(() => g.remove(), duration + 60);
}

// ---------- Selection indicators: segmented controls and tab bars move one surface between options ----------
const IND_GROUPS = [['.ads-segmented', ':scope > button[aria-pressed="true"]'], ['.ads-tabbar__tabs', ':scope > [aria-current="page"]'], ['.ads-tabbar-ipad__tabs', ':scope > [aria-current="page"]']];
function indKey(g, i) { return `${g.className.split(' ')[0]}|${g.getAttribute('aria-label') || g.getAttribute('aria-labelledby') || ''}|${i}`; }
function captureIndicators(dev) {
  const out = {};
  for (const [gs, ss] of IND_GROUPS) $$(gs, dev).forEach((g, i) => { const s = g.querySelector(ss); if (s && s.offsetWidth) out[indKey(g, i)] = { x: s.offsetLeft, w: s.offsetWidth }; });
  return out;
}
function placeIndicators(dev, before, animate) {
  if (!animate) return;
  for (const [gs, ss] of IND_GROUPS) $$(gs, dev).forEach((g, i) => {
    const s = g.querySelector(ss), p = before[indKey(g, i)]; if (!s || !s.offsetWidth || !p) return;
    if (p.x === s.offsetLeft && p.w === s.offsetWidth) return;
    // Only while it moves: a copy of the selected surface slides from the old option to the new one.
    // At rest the selected option keeps its own styling.
    const c = getComputedStyle(s), cs = { backgroundColor: c.backgroundColor, boxShadow: c.boxShadow, borderRadius: c.borderRadius };
    g.classList.add('has-ind');
    const x = s.offsetLeft, w = s.offsetWidth;
    const ind = document.createElement('span'); ind.className = 'mo-ind'; ind.setAttribute('aria-hidden', 'true');
    Object.assign(ind.style, { left: x + 'px', top: s.offsetTop + 'px', width: w + 'px', height: s.offsetHeight + 'px', background: cs.backgroundColor, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius });
    g.insertBefore(ind, g.firstChild);
    const a = ind.animate([{ left: p.x + 'px', width: p.w + 'px' }, { left: x + 'px', width: w + 'px' }], { duration: MT.control, easing: EASE.standard });
    a.onfinish = a.oncancel = () => { ind.remove(); g.classList.remove('has-ind'); };
  });
}

// ---------- Expandable cards (FLIP): height and position animate from where each card was ----------
const CARD_SEL = '.gs-stack > .gs';
function captureCards(dev) { const out = {}; $$(CARD_SEL, dev).forEach(e => { if (e.id || e.getAttribute('aria-label')) out[e.id || e.getAttribute('aria-label')] = rectIn(e); }); return out; }
function flipCards(dev, before) {
  if (!before) return;
  $$(CARD_SEL, dev).forEach(e => {
    const b = before[e.id || e.getAttribute('aria-label')]; if (!b) return;
    const a = rectIn(e), dy = b.y - a.y, dh = b.h - a.h; if (Math.abs(dy) < 1 && Math.abs(dh) < 1) return;
    e.style.overflow = 'clip';
    const x = e.animate([{ height: b.h + 'px', transform: `translateY(${dy}px)` }, { height: a.h + 'px', transform: 'none' }], { duration: 300, easing: EASE.standard });
    x.onfinish = x.oncancel = () => { e.style.overflow = ''; };
  });
}

// ---------- Transitions, decided by comparing the state before and after each render ----------
function sheetRadius(ps) { const c = getComputedStyle(ps); return `${c.borderTopLeftRadius} ${c.borderTopRightRadius} ${c.borderBottomRightRadius} ${c.borderBottomLeftRadius}`; }
function insetTo(ps, o) { const p = rectIn(ps); return `inset(${o.y - p.y}px ${p.x + p.w - (o.x + o.w)}px ${p.y + p.h - (o.y + o.h)}px ${o.x - p.x}px round ${o.h / 2}px)`; }
function openSheetMotion(dev) {
  const ps = $('.sheet-layer .psheet', dev); if (!ps) return;
  if (motionOff()) { play('sheet', '.sheet-layer .psheet', [{ opacity: 0 }, { opacity: 1 }], { duration: MT.fade }); return; }
  play('scrim', '.sheet-layer .sheet-scrim', [{ opacity: 0 }, { opacity: 1 }], { duration: MT.shared, easing: EASE.standard });
  play('app', '.app', [{ filter: 'blur(0px)', transform: 'scale(1)' }, { filter: 'blur(3px)', transform: 'scale(0.985)' }], { duration: MT.shared, easing: EASE.settle });
  const o = MOTION.origin && performance.now() - MOTION.origin.at < 600 ? MOTION.origin : null; MOTION.origin = null;
  if (o) {
    // Shared element: the compact "New booking · Where to?" control grows into the booking surface
    play('sheet', '.sheet-layer .psheet', [{ clipPath: insetTo(ps, o) }, { clipPath: `inset(0px round ${sheetRadius(ps)})` }], { duration: MT.shared, easing: EASE.settle });
    play('sheet-content', '.sheet-layer .ads-navbar, .sheet-layer .pane__body > *:nth-child(-n+8), .sheet-layer .pane__foot', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: MT.control, delay: MT.shared * 0.45, easing: EASE.standard }, MT.stagger);
  } else play('sheet', '.sheet-layer .psheet', IPAD() ? [{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }] : [{ translate: '0 100%' }, { translate: '0 0' }], { duration: MT.panel + 40, easing: EASE.settle });
}
function pushMotion(sh) {
  const a = sh._anim; if (!a) return;
  const t = Date.now() - a.start, top = $('.navstage__top', devEl()), under = $('.navstage__under', devEl());
  const run = (el, frames, dur) => { if (!el) return; const x = el.animate(frames, { duration: dur, easing: EASE.standard, fill: 'both' }); x.currentTime = Math.min(t, dur); };
  if (motionOff()) return run(top, [{ opacity: 0 }, { opacity: 1 }], MT.fade);
  const st = sh.stack, topR_ = st[st.length - 1], underR = a.under && a.under[0];
  const focusTop = stationFocus() && topR_.s === 'stations', focusUnder = stationFocus() && underR && underR.s === 'stations';
  if (focusTop && focusUnder) return run(top, [{ opacity: 0 }, { opacity: 1 }], MT.control); // From → To inside the focused view
  const clipFor = (el, f) => { const p = rectIn(el); return `inset(${Math.max(0, f.y - p.y)}px ${Math.max(0, p.x + p.w - (f.x + f.w))}px ${Math.max(0, p.y + p.h - (f.y + f.h))}px ${Math.max(0, f.x - p.x)}px round 16px)`; };
  if (a.dir === 'fwd' && focusTop) {
    // The tapped field grows into the focused search view; the task behind fades back
    const f = MOTION.field && performance.now() - MOTION.field.at < 1500 ? MOTION.field.rect : null;
    if (f && top) run(top, [{ clipPath: clipFor(top, f) }, { clipPath: 'inset(0px round 0px)' }], NAV_MS);
    else run(top, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], NAV_MS);
    run(top && top.querySelector('.pane__body'), [{ opacity: 0 }, { opacity: 1 }], NAV_MS * 0.7);
    run(under, [{ opacity: 1 }, { opacity: 0 }], NAV_MS);
    return;
  }
  if (a.dir === 'back' && focusUnder) {
    // Back from the focused view: it collapses into the field, and the task returns updated
    const fld = top && (top.querySelector(`#ff-${underR.p.field}`) || top.querySelector('#gs-where'));
    if (fld && under) run(under, [{ clipPath: 'inset(0px round 0px)', opacity: 1 }, { clipPath: clipFor(under, rectIn(fld)), opacity: 0.4 }], NAV_MS);
    else run(under, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(12px)' }], NAV_MS);
    run(top, [{ opacity: 0.4 }, { opacity: 1 }], NAV_MS);
    return;
  }
  if (a.dir === 'fwd') { run(top, [{ transform: 'translateX(100%)' }, { transform: 'none' }], NAV_MS); run(under, [{ transform: 'none' }, { transform: 'translateX(-25%)', opacity: 0.7 }], NAV_MS); }
  else { run(top, [{ transform: 'translateX(-25%)', opacity: 0.7 }, { transform: 'none', opacity: 1 }], NAV_MS); run(under, [{ transform: 'none' }, { transform: 'translateX(100%)' }], NAV_MS); }
}
function afterRenderMotion(dev, prev, cur, ghosts, ind) {
  const same = prev.v === cur.v && prev.dev === cur.dev && prev.orient === cur.orient;
  const off = motionOff();
  if (same) {
    if (!prev.sheet && cur.sheet) openSheetMotion(dev);
    if (!prev.dialog && cur.dialog) {
      play('dlg', '.dialog-layer .pdialog', off ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: off ? MT.fade : MT.control, easing: EASE.settle });
      play('dlgscrim', '.dialog-layer', [{ backgroundColor: 'transparent' }, {}], { duration: MT.control });
    }
    if (prev.dialog && !cur.dialog) ghostOut(ghosts.dialog, off ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.98)' }], MT.fade);
    if (!prev.cover && cur.cover) play('cover', '.cover-layer .pcover', off || IPAD() ? [{ opacity: 0 }, { opacity: 1 }] : [{ translate: '0 100%' }, { translate: '0 0' }], { duration: off ? MT.fade : MT.panel + 40, easing: EASE.settle });
    if (prev.cover && !cur.cover) ghostOut(ghosts.cover, off || IPAD() ? [{ opacity: 1 }, { opacity: 0 }] : [{ translate: '0 0' }, { translate: '0 100%' }], off ? MT.fade : MT.close);
    if (cur.toast && cur.toast !== prev.toast) play('toast', '.toast-wrap .ads-toast', off ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: MT.control, easing: EASE.settle });
    if (prev.toast && !cur.toast) ghostOut(ghosts.toast, [{ opacity: 1 }, { opacity: 0 }], MT.fade);
    // Tab switch: top-level destinations change in place, with no transition; only the tab indicator moves
    // Supporting information: the sheet rises from the bottom over a dimmed, inactive task, and reverses on close
    if (!prev.info && cur.info) {
      play('info', '.info-layer .info-sheet', off ? [{ opacity: 0 }, { opacity: 1 }] : IPAD() ? [{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }] : [{ translate: '0 100%' }, { translate: '0 0' }], { duration: off ? MT.fade : MT.shared, easing: EASE.settle });
      play('infoscrim', '.info-layer .info-scrim', [{ opacity: 0 }, { opacity: 1 }], { duration: off ? MT.fade : MT.shared, easing: EASE.standard });
    }
    if (prev.info && !cur.info) ghostOut(ghosts.info, off ? [{ opacity: 1 }, { opacity: 0 }] : IPAD() ? [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 24px' }] : [{ translate: '0 0' }, { translate: '0 100%' }], off ? MT.fade : MT.close);
    if (prev.info && cur.info && prev.info !== cur.info) {
      // A deeper level inside the same sheet: content moves sideways, the sheet eases to its new height
      const fwd = cur.info.length > prev.info.length, sh = $('.info-layer .info-sheet', dev);
      if (sh && ghosts.infoH && !off) sh.animate([{ height: ghosts.infoH + 'px' }, { height: sh.offsetHeight + 'px' }], { duration: MT.panel, easing: EASE.standard });
      play('infobody', '.info-layer .info-head > *, .info-layer .info-body', off ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateX(${fwd ? 24 : -24}px)` }, { opacity: 1, transform: 'none' }], { duration: off ? MT.fade : MT.panel, easing: EASE.standard });
    }
    // Expandable cards: the previous section collapses and the next expands; the cards around them reposition
    if (cur.sheet && prev.sheet === cur.sheet && !cur.sheet._anim && !off) flipCards(dev, ghosts.cards);
    // Version 2 guided sections: the opened section's content arrives after the card settles
    if (cur.gsOpen && cur.gsOpen !== prev.gsOpen && prev.sheet) play('gs', `#gs-${cur.gsOpen} .gs__head, #gs-${cur.gsOpen} .gs__body > *`, off ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: off ? MT.fade : MT.control, easing: EASE.standard }, off ? 0 : MT.stagger);
  }
  if (cur.sheet) pushMotion(cur.sheet);
  placeIndicators(dev, ind, same && !off);
  // New alerts and field errors appear with a short fade (stable, readable, no movement)
  const seen = new Set();
  $$('.ads-alert, .ads-helper--error, .gs__err', dev).forEach(el => { const k = el.textContent.trim().slice(0, 80); seen.add(k); if (same && !MOTION.alerts.has(k)) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MT.fade + 40, easing: EASE.standard }); });
  MOTION.alerts = seen;
  MOTION.live = MOTION.live.filter(applySpec);
  if (MOTION.closing && cur.sheet === MOTION.closing) { const l = $('.sheet-layer', dev); if (l) l.classList.add('is-closing'); }
}
const renderBeforeMotion = render;
render = function () {
  const dev = devEl(); if (!dev) return renderBeforeMotion();
  const ghosts = { info: $('.info-layer', dev), infoH: ($('.info-layer .info-sheet', dev) || {}).offsetHeight, cards: captureCards(dev), dialog: $('.dialog-layer', dev), cover: $('.cover-layer', dev), toast: $('.toast-wrap', dev) && $('.toast-wrap .ads-toast', dev) ? $('.toast-wrap', dev) : null };
  const ind = captureIndicators(dev), prev = MOTION.prev;
  renderBeforeMotion();
  const n = nav(), open = $('.gs.is-open', dev);
  dev.classList.toggle('mo-reduced', motionOff());
  dev.classList.toggle('has-overlay', !!(n.sheet || n.cover));
  const cur = { v: TB.v, dev: TB.dev, orient: TB.orient, sheet: n.sheet, dialog: n.dialog, cover: n.cover, toast: V().toast && V().toast.msg, tab: n.tab, info: n.info ? n.info.stack.join('>') : null, gsOpen: open ? open.id.slice(3) : null };
  afterRenderMotion(dev, prev, cur, ghosts, ind);
  MOTION.prev = cur;
};

// ---------- Actions that need motion context ----------
// Opening booking from the Book tab: remember the compact control as the shared element's source
const openBookingBeforeMotion = A['open-booking'];
A['open-booking'] = (t, ri, e) => {
  MOTION.origin = t && t.closest && t.closest('.app') ? Object.assign(rectIn(t), { at: performance.now() }) : null;
  openBookingBeforeMotion(t, ri, e);
};
// Closing a sheet: collapse back into the Book control, or slide down; then remove it
const closeSheetBeforeMotion = closeSheet;
closeSheet = function (force) {
  const sh = sheet(); if (!sh) return;
  if (!force && sh.stack.some(r => r.u.dirty || (r.u.edit && r.u.edit.u.dirty))) return closeSheetBeforeMotion(force);
  if (motionOff() || MOTION.closing === sh) { MOTION.closing = null; return closeSheetBeforeMotion(true); }
  const dev = devEl(), ps = $('.sheet-layer .psheet', dev), src = sh.id === 'booking' ? $('.app [data-a="open-booking"]', dev) : null;
  MOTION.closing = sh;
  const l = $('.sheet-layer', dev); if (l) l.classList.add('is-closing');
  if (ps && src) {
    play('sheet', '.sheet-layer .psheet', [{ clipPath: `inset(0px round ${sheetRadius(ps)})` }, { clipPath: insetTo(ps, rectIn(src)) }], { duration: MT.close, easing: EASE.exit });
    play('sheet-content', '.sheet-layer .psheet__panes', [{ opacity: 1 }, { opacity: 0 }], { duration: MT.close * 0.6, easing: EASE.exit });
  } else play('sheet', '.sheet-layer .psheet', IPAD() ? [{ opacity: 1 }, { opacity: 0, translate: '0 24px' }] : [{ translate: '0 0' }, { translate: '0 100%' }], { duration: MT.close, easing: EASE.exit });
  play('scrim', '.sheet-layer .sheet-scrim', [{ opacity: 1 }, { opacity: 0 }], { duration: MT.close, easing: EASE.exit });
  play('app', '.app', [{ filter: 'blur(3px)', transform: 'scale(0.985)' }, { filter: 'blur(0px)', transform: 'scale(1)' }], { duration: MT.close, easing: EASE.standard });
  setTimeout(() => { if (MOTION.closing === sh && nav().sheet === sh) { closeSheetBeforeMotion(true); } MOTION.closing = null; }, MT.close);
};
// Tabs: reselecting the current tab scrolls it to the top; each tab keeps its own scroll position
const tabBeforeMotion = A.tab;
A.tab = (t, ri) => {
  const n = nav(), to = t.dataset.tab, main = $('#device .app-main');
  if (to === n.tab) { if (main) main.scrollTo({ top: 0, behavior: motionOff() ? 'auto' : 'smooth' }); return; }
  const v = V(); v.tabScroll = v.tabScroll || {}; if (main) v.tabScroll[n.tab] = main.scrollTop;
  tabBeforeMotion(t, ri);
  const m2 = $('#device .app-main'); if (m2) m2.scrollTop = v.tabScroll[to] || 0;
};
