// Booking type dropdown and Pass Rider Business / Leisure tabs, neither preselected (settled design). The Fare Finder has a compact Booking
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
  const pick = v => p.selectOption(D_ + '#ff-mode', v).then(() => w(300));
  const opts = () => ev(() => [...document.querySelectorAll('#device #ff-mode option')].map(o => o.value + ':' + o.textContent + (o.disabled ? ':off' : '')).join());
  const bk = () => ev(() => { const b = D().booking; return { intent: b.intent, prType: b.prType, pay: b.pay }; });
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };

  ok(await ev(() => ['tbCmpAssist', 'tbCmpBp', 'tbCmpPrSel', 'tbCmpSel'].every(id => !document.getElementById(id))), 'Prototype controls: assistance layout, Business Pass controls, Pass Rider selection and Station selector options removed');
  // ---- TripLink ----
  await go('triplink');
  ok(await opts() === 'corporate:TripLink corporate,personal:Regular' && await ev(() => document.querySelector('#device #ff-mode').value) === 'corporate' && (await bk()).intent === 'corporate' && await p.locator(D_ + '#ff-coderow').count() === 0, 'TripLink: dropdown with TripLink corporate and Regular; TripLink corporate by default (no code)');
  await ev(() => { D().booking.pax.adult = 1; render(); });
  await pick('personal');
  ok((await bk()).intent === 'personal' && await p.locator(D_ + '#ff-coderow').count() === 1 && await p.locator(D_ + '#ff-points').count() === 1, 'Regular: regular booking with code and points');
  await pick('corporate'); ok((await bk()).intent === 'corporate', 'TripLink corporate again');
  // ---- Pass Rider (Business Pass holder) ----
  await go('passrider');
  ok(await opts() === 'pr:Pass Rider,personal:Regular' && (await bk()).intent === 'pr' && (await bk()).prType === null, 'Pass Rider: dropdown with Pass Rider and Regular; Pass Rider by default; Business / Leisure not preselected');
  ok(await p.locator(D_ + '[data-a="pr-type"]').count() === 0 && await p.locator(D_ + '[data-a="mode-open"]').count() === 0, 'no Booking type entry or Business / Leisure on the Fare Finder');
  ok(/Choose Business or Leisure/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && await p.locator(D_ + '[data-a="find-trains"]').isDisabled() && /in Travelers/.test(await ev(() => document.querySelector('#device #ff-find-why').textContent)), 'Find trains disabled until Business or Leisure is chosen in Travelers');
  await p.click(D_ + '#ff-trav'); await w(700);
  ok(await ev(() => [...document.querySelectorAll('#device .pr-tabs [role="tab"]')].map(t => t.textContent + ':' + t.getAttribute('aria-selected')).join()) === 'Business:false,Leisure:false' && await p.locator(D_ + '.pr-choose').count() === 1 && await p.locator(D_ + '[data-a="pick-travelers-done"]').isDisabled(), 'Traveler selection: Business / Leisure tabs, neither selected, Done waits');
  ok(await ev(() => document.querySelector('#device #prt-business').tabIndex === 0), 'tabs reachable by keyboard before a choice');
  await axe('tabs, nothing chosen');
  await p.click(D_ + '#prt-leisure'); await w(300);
  ok((await bk()).prType === 'leisure' && await p.locator(D_ + '.ffc-riders input[type="checkbox"]').count() === 4 && await p.locator(D_ + '[data-a="pax"][data-k="comp"]').count() === 2, 'Leisure: named riders as checkboxes, Companions counter');
  await p.click(`${D_}label[for="prr-maya"]`); await w(250);
  await p.click(D_ + '#prt-business'); await w(300);
  ok((await bk()).prType === 'business' && await p.locator(D_ + '.ffc-riders input').count() === 1 && await ev(() => { const i = document.querySelector('#device #prr-me'); return i.checked && i.disabled; }) && /for you alone/.test(await ev(() => document.querySelector('#device #prt-h').textContent)), 'Business: you alone, fixed');
  await p.click(D_ + '#prt-leisure'); await w(300);
  ok(await ev(() => document.querySelector('#device #prr-maya').checked) && await ev(() => document.activeElement.id) === 'prt-leisure', 'switching tabs keeps Leisure selections; focus stays on the tab');
  await axe('Leisure');
  // Back undoes the choice
  await p.click(D_ + '.pane .ads-navbar [data-a="back"]'); await w(500);
  if (await ev(() => !!nav().dialog)) { await ev(() => closeDialog(nav().dialog.actions[1][2])); await w(400); }
  ok(await ev(() => sheet().stack.at(-1).s === 'ff') && (await bk()).prType === null, 'Back undoes Business / Leisure with the other traveler changes');
  // Business clears Auto Train; Done returns
  await ev(() => { const b = D().booking; b.prType = 'leisure'; b.from = 'LOR'; b.to = 'SFA'; render(); }); await w(200);
  await p.click(D_ + '#ff-trav'); await w(700); await p.click(D_ + '#prt-business'); await w(300);
  ok(await ev(() => !D().booking.from && !D().booking.to), 'Business clears Auto Train stations (NMA-1016 AC4)');
  await p.click(D_ + '[data-a="pick-travelers-done"]'); await w(500);
  ok(/You only · Business travel/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && /Pass Rider · Business/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && !(await p.locator(D_ + '[data-a="find-trains"]').isDisabled()), 'Done: Fare Finder shows Business travel; Find trains enabled');
  // Pass Rider off and on
  await pick('personal');
  ok((await bk()).intent === 'personal' && await p.locator(D_ + '#ff-coderow').count() === 1, 'Regular: regular booking');
  await pick('pr'); ok((await bk()).intent === 'pr', 'Pass Rider again');
  // Leisure only (no Business Pass): no tabs, Leisure set
  await go('passrider-nopass'); await p.click(D_ + '#ff-trav'); await w(700);
  ok(await p.locator(D_ + '.pr-tabs').count() === 0 && (await bk()).prType === 'leisure' && /Leisure travel\. Business travel needs an active Business Pass\./.test(await ev(() => document.querySelector('#device #prt-h').textContent)) && await p.locator(D_ + '.ffc-riders input').count() >= 2, 'no Business Pass: no tabs; Leisure with checkboxes and the reason');
  // Can't start Pass Rider: switch off and disabled
  await go('passrider-minor');
  ok(await p.locator(D_ + '#ff-mode').count() === 0 && await p.locator(D_ + '.v1modes').count() === 0 && (await bk()).intent === 'standard' && await p.locator(D_ + '#ff-coderow').count() === 1 && !/15 or younger/.test(await ev(() => document.querySelector('#device').innerText)), 'dependent 15 or younger: no Booking type dropdown and no reason line; regular booking');
  ok(await ev(() => [...document.querySelectorAll('#tbScenario option')].every(o => o.value !== 'triplink-passrider')), 'no dual TripLink and Pass Rider scenario');
  await go('passrider');
  await axe('Fare Finder dropdown');
  // Prototype controls › Pass Rider default travel type: None (default) or Leisure
  ok(await ev(() => [...document.querySelectorAll('#tbCmpPrDef option')].map(o => o.value).join()) === 'none,leisure' && await ev(() => document.getElementById('tbCmpPrDef').value) === 'none', 'Prototype controls: Pass Rider default travel type, None by default');
  await ev(() => { const s = document.getElementById('tbCmpPrDef'); s.value = 'leisure'; s.dispatchEvent(new Event('change')); }); await go('passrider');
  ok((await bk()).prType === 'leisure' && /Pass Rider · Leisure/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)) && !(await p.locator(D_ + '[data-a="find-trains"]').isDisabled()), 'Leisure default: Leisure set for a Business Pass holder; Find trains ready');
  await p.click(D_ + '#ff-trav'); await w(700);
  ok(await ev(() => [...document.querySelectorAll('#device .pr-tabs [role="tab"]')].map(t => t.getAttribute('aria-selected')).join()) === 'false,true' && /NMA-1016 AC2/.test(await ev(() => document.querySelector('#notes').innerText)), 'Leisure tab selected; the AC2 conflict is noted');
  await ev(() => { const s = document.getElementById('tbCmpPrDef'); s.value = 'none'; s.dispatchEvent(new Event('change')); }); await go('passrider');
  ok((await bk()).prType === null, 'back to None: neither preselected');
  ok(await ev(() => !document.getElementById('tbCmpPrType')), 'Prototype controls: no Pass Rider travel type option (tabs in Traveler selection only)');
  // Description line under Booking type: TripLink only; Pass Rider shows a line only for an unavailable option
  for (const [sc, m, want] of [['triplink', 'tabs', 'ff-mode-h'], ['passrider', 'tabs', ''], ['passrider-retiree', 'tabs', ''], ['passrider-nopass', 'tabs', ''], ['passrider-minor', 'tabs', '']]) {
    await go(sc);
    const got = await ev(() => [...document.querySelectorAll('#device .v1modes .ads-helper')].map(x => x.id).join());
    ok(got === want, `${sc} (${m}): lines under Booking type: ${got || 'none'}`);
  }

  await go('passrider', 'dark'); await p.click(D_ + '#ff-trav'); await w(700); await p.click(D_ + '#prt-leisure'); await w(300); await axe('dark tabs');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
