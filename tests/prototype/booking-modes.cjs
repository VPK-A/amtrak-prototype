// Booking type switch (Pay with points style) and Pass Rider Business / Leisure tabs, neither preselected (settled design). The Fare Finder has a compact Booking
// type dropdown: TripLink corporate or Regular, or Pass Rider or Regular, with the special type selected by default. Business or Leisure is chosen
// with tabs in Traveler selection; neither is preselected for Business Pass holders (NMA-1016 AC2); Leisure lists named
// riders as checkboxes; Business is you alone and clears Auto Train; Back undoes the choice. Retired controls are gone.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ content: AXE });
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const go = (sc, th = 'light') => ev(([sc, th]) => { TB.v = 1; TB.dev = 'iphone'; TB.theme = th; VS[1] = makeVS(sc); goLoc('ff'); }, [sc, th]).then(() => w(500));
  // the booking type switch (Pay with points style): on = TripLink / Pass Rider, off = regular
  const sw = () => ev(() => { const i = document.querySelector('#device [data-a="mode-toggle"]'); return i ? { id: i.id, on: i.checked, title: i.closest('.ads-pointsrow').querySelector('.ads-pointsrow__title').textContent } : null; });
  const pick = async v => { const s = await sw(); const want = v !== 'personal'; if (s && s.on !== want) { await p.click(`${D_}label.ads-switch:has(#${s.id})`); await w(300); } };
  const bk = () => ev(() => { const b = D().booking; return { intent: b.intent, prType: b.prType, pay: b.pay }; });
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };

  ok(await ev(() => ['tbCmpAssist', 'tbCmpBp', 'tbCmpPrSel', 'tbCmpSel'].every(id => !document.getElementById(id))), 'Prototype controls: assistance layout, Business Pass controls, Pass Rider selection and Station selector options removed');
  // ---- TripLink ----
  await go('triplink');
  ok(JSON.stringify(await sw()) === JSON.stringify({ id: 'ff-mode-corporate', on: true, title: 'TripLink corporate booking' }) && await p.locator(D_ + '.v1modes .ads-pointsrow').count() === 1 && await p.locator(D_ + '#ff-mode').count() === 0 && (await bk()).intent === 'corporate' && await p.locator(D_ + '#ff-coderow').count() === 0, 'TripLink: one switch styled like Pay with points, on by default (no code)');
  await ev(() => { D().booking.pax.adult = 1; render(); });
  await pick('personal');
  ok((await bk()).intent === 'personal' && await p.locator(D_ + '#ff-coderow').count() === 1 && await p.locator(D_ + '#ff-points').count() === 1, 'switch off: regular booking with code and points');
  await pick('corporate'); ok((await bk()).intent === 'corporate', 'switch on: TripLink corporate again');
  // ---- Pass Rider (Business Pass holder) ----
  await go('passrider');
  ok(JSON.stringify(await sw()) === JSON.stringify({ id: 'ff-mode-pr', on: true, title: 'Pass Rider booking' }) && (await bk()).intent === 'pr' && (await bk()).prType === 'leisure', 'Pass Rider: switch on by default; Leisure preselected');
  ok(await p.locator(D_ + '[data-a="pr-type"]').count() === 0 && await p.locator(D_ + '[data-a="mode-open"]').count() === 0, 'no Booking type entry or Business / Leisure on the Fare Finder');
  ok(/Pass Rider · Leisure/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && !(await p.locator(D_ + '[data-a="find-trains"]').isDisabled()), 'Leisure default: Find trains ready');
  await p.click(D_ + '#ff-trav'); await w(700);
  ok(await ev(() => [...document.querySelectorAll('#device .pr-tabs [role="tab"]')].map(t => t.textContent + ':' + t.getAttribute('aria-selected')).join()) === 'Leisure:true,Business:false' && await p.locator(D_ + '.pr-choose').count() === 0, 'Traveler selection: Leisure tab on the left (selected), Business on the right');
  ok(await ev(() => document.querySelector('#device #prt-leisure').tabIndex === 0 && document.querySelector('#device #prt-business').tabIndex === -1), 'the selected tab is the keyboard stop');
  ok(/NMA-1016 AC2/.test(await ev(() => document.querySelector('#notes').innerText)) && await ev(() => !document.getElementById('tbCmpPrDef')), 'the AC2 conflict is noted; no Prototype control for the default');
  await axe('tabs, Leisure default');
  ok((await bk()).prType === 'leisure' && await p.locator(D_ + '.ffc-riders input[type="checkbox"]').count() === 4 && await p.locator(D_ + '[data-a="pax"][data-k="comp"]').count() === 2, 'Leisure: named riders as checkboxes, Companions counter');
  await p.click(`${D_}label[for="prr-maya"]`); await w(250);
  await p.click(D_ + '#prt-business'); await w(300);
  ok((await bk()).prType === 'business' && await p.locator(D_ + '.ffc-riders input').count() === 1 && await ev(() => { const i = document.querySelector('#device #prr-me'); return i.checked && i.disabled; }) && /for you only/.test(await ev(() => document.querySelector('#device #prt-h').textContent)), 'Business: you alone, fixed');
  await p.click(D_ + '#prt-leisure'); await w(300);
  ok(await ev(() => document.querySelector('#device #prr-maya').checked) && await ev(() => document.activeElement.id) === 'prt-leisure', 'switching tabs keeps Leisure selections; focus stays on the tab');
  await axe('Leisure');
  // Back undoes the choice
  await p.click(D_ + '.pane .ads-navbar [data-a="back"]'); await w(500);
  if (await ev(() => !!nav().dialog)) { await ev(() => closeDialog(nav().dialog.actions[1][2])); await w(400); }
  ok(await ev(() => sheet().stack.at(-1).s === 'ff') && (await bk()).prType === 'leisure', 'Back undoes Business / Leisure with the other traveler changes');
  // Business clears Auto Train; Done returns
  await ev(() => { const b = D().booking; b.prType = 'leisure'; b.from = 'LOR'; b.to = 'SFA'; render(); }); await w(200);
  await p.click(D_ + '#ff-trav'); await w(700); await p.click(D_ + '#prt-business'); await w(300);
  ok(await ev(() => !D().booking.from && !D().booking.to), 'Business clears Auto Train stations (NMA-1016 AC4)');
  await p.click(D_ + '[data-a="pick-travelers-done"]'); await w(500);
  ok(/You only · Business travel/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && /Pass Rider · Business/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && !(await p.locator(D_ + '[data-a="find-trains"]').isDisabled()), 'Done: Fare Finder shows Business travel; Find trains enabled');
  // Pass Rider off and on
  await pick('personal');
  ok((await bk()).intent === 'personal' && await p.locator(D_ + '#ff-coderow').count() === 1, 'switch off: regular booking');
  await pick('pr'); ok((await bk()).intent === 'pr', 'switch on: Pass Rider again');
  // Leisure only (no Business Pass): no tabs, Leisure set
  await go('passrider-nopass'); await p.click(D_ + '#ff-trav'); await w(700);
  ok(await p.locator(D_ + '.pr-tabs').count() === 0 && (await bk()).prType === 'leisure' && /Leisure travel\. Business travel needs an active Business Pass\./.test(await ev(() => document.querySelector('#device #prt-h').textContent)) && await p.locator(D_ + '.ffc-riders input').count() >= 2, 'no Business Pass: no tabs; Leisure with checkboxes and the reason');
  // Can't start Pass Rider: switch off and disabled
  await go('passrider-minor');
  ok(!(await sw()) && await p.locator(D_ + '.v1modes').count() === 0 && (await bk()).intent === 'standard' && await p.locator(D_ + '#ff-coderow').count() === 1 && !/15 or younger/.test(await ev(() => document.querySelector('#device').innerText)), 'dependent 15 or younger: no switch and no reason line; regular booking');
  ok(await ev(() => [...document.querySelectorAll('#tbScenario option')].every(o => o.value !== 'triplink-passrider')), 'no dual TripLink and Pass Rider scenario');
  await go('passrider');
  await axe('Fare Finder dropdown');
  ok(await ev(() => !document.getElementById('tbCmpPrType')), 'Prototype controls: no Pass Rider travel type option (tabs in Traveler selection only)');
  // Description line under the switch title: TripLink and Pass Rider, the same style
  for (const [sc, m, want] of [['triplink', 'tabs', 'ff-mode-corporate-h'], ['passrider', 'tabs', 'ff-mode-pr-h'], ['passrider-retiree', 'tabs', 'ff-mode-pr-h'], ['passrider-nopass', 'tabs', 'ff-mode-pr-h'], ['passrider-minor', 'tabs', '']]) {
    await go(sc);
    const got = await ev(() => [...document.querySelectorAll('#device .v1modes .ads-helper, #device .v1modes .ads-pointsrow__sub')].map(x => x.id).join());
    ok(got === want, `${sc} (${m}): lines under Booking type: ${got || 'none'}`);
    if (want) ok(await ev(() => { const s = document.querySelector('#device .v1modes .ads-pointsrow__sub'), t = document.querySelector('#device .v1modes .ads-pointsrow__title'), cs = getComputedStyle(s), ct = getComputedStyle(t); return [cs.color, cs.fontSize, ct.color, ct.fontSize].join(); }) === (await ev(() => window.__tlStyle || '')) || sc === 'triplink', `${sc}: title and description styled like TripLink`);
    if (sc === 'triplink') await ev(() => { const s = document.querySelector('#device .v1modes .ads-pointsrow__sub'), t = document.querySelector('#device .v1modes .ads-pointsrow__title'), cs = getComputedStyle(s), ct = getComputedStyle(t); window.__tlStyle = [cs.color, cs.fontSize, ct.color, ct.fontSize].join(); });
  }

  await go('passrider', 'dark'); await p.click(D_ + '#ff-trav'); await w(700); await p.click(D_ + '#prt-leisure'); await w(300); await axe('dark tabs');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
