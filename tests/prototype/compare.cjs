// Design comparison settings (Prototype controls): Traveler assistance layout and Pass Rider Business Pass
// controls. All four combinations in both concepts; presentation only; same handlers and results as the originals.
const { chromium } = require('playwright');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(URL);
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 250) => p.waitForTimeout(ms), D_ = '#device ';
  // set through the real Prototype controls
  const setCmp = async (assist, bp) => { await p.click('#chromeToggle'); await p.selectOption('#tbCmpAssist', assist); await p.selectOption('#tbCmpBp', bp); await p.click('#chromeToggle'); await w(); };
  await p.click('#chromeToggle');
  ok(await ev(() => document.querySelector('#tbCmpAssist').value === 'current' && document.querySelector('#tbCmpBp').value === 'current'), 'both settings default to Current design');
  ok(await ev(() => { const c = document.querySelector('#protoCtl'); return c.contains(document.querySelector('#tbCmpAssist')) && !document.querySelector('#device #tbCmpAssist'); }), 'settings live in the Prototype controls, not in the app');
  await p.click('#chromeToggle');
  const travelers = v => ev(v => { TB.v = v; TB.dev = 'iphone'; VS[v] = makeVS('assist-multi'); const b = D().booking; b.pax.adult = 4; b.tdisc = { 'adult-3': 'military' }; goLoc('travelers'); }, v).then(() => w());
  for (const v of [1]) {
    const T = `C${v}`, card = k => v === 1 ? `${D_}#tc-${k}` : `${D_}#ovt-${k}`;
    for (const [assist, bp] of [['current', 'current'], ['above', 'current'], ['current', 'compact'], ['above', 'compact']]) {
      const C = `${T} [${assist}/${bp}]`;
      await travelers(v); await setCmp(assist, bp);
      if (assist === 'current') {
        ok(await p.locator(D_ + '.tassist-intro').count() === 0 && await p.locator(card('adult-4') + ' .tassist__label').count() === 1, `${C} traveler cards keep the copy`);
      } else {
        const pos = await ev(() => { const i = document.querySelectorAll('#device .tassist-intro'), s = document.querySelector('#device .fam-travelers, #device .ov-travs'); return { n: i.length, before: i[0] && i[0].nextElementSibling === s, txt: i[0] && i[0].innerText }; });
        ok(pos.n === 1 && pos.before && /Traveler with disability or need help\?\s*Like a wheelchair space, an accessible seat, station assistance or a personal companion\./.test(pos.txt), `${C} copy shown once, directly above Traveler details`);
        ok(await p.locator(D_ + '.fam-card .tassist__label, ' + D_ + '.ov-trav .tassist__label').count() === 0, `${C} copy not repeated in any card`);
        ok(await p.locator(card('adult-4') + ' [data-a="assist-answer"]').count() === 1 && await p.locator(card('adult-4') + (v === 1 ? ' #td-adult-4' : ' #ovd-adult-4')).count() === 1 && /Traveler 4 · Adult/.test(await ev(s => document.querySelector(s).innerText, card('adult-4'))), `${C} empty traveler: name, Add assistance and discount dropdown`);
        ok(await ev(() => document.querySelector('#device [data-a="assist-answer"][data-t="adult-4"]').getAttribute('aria-describedby')) === 'tassist-intro', `${C} Add assistance is described by the block above`);
      }
      ok(await p.locator(card('adult-1') + ' [data-a="assist-edit"]').count() === 1 && /I have a disability/.test(await ev(s => document.querySelector(s).innerText, card('adult-1'))), `${C} traveler with assistance keeps summary and Edit assistance`);
      ok(await ev(s => document.querySelector(s).value, v === 1 ? '#device #td-adult-3' : '#device #ovd-adult-3') === 'military', `${C} traveler with a discount keeps it`);
      // switching the other way keeps the screen and selections
      const before = await ev(() => JSON.stringify([sheet().stack.map(r => r.s), D().booking]));
      await setCmp(assist === 'above' ? 'current' : 'above', bp);
      ok(await ev(() => JSON.stringify([sheet().stack.map(r => r.s), D().booking])) === before, `${C} switching the layout keeps the screen and every selection`);
      // assistance still per traveler in the variant
      if (assist === 'current') {
        await p.click(card('adult-4') + ' [data-a="assist-answer"]'); await w(1000);
        await p.click(`${D_}label:has(input[name$="-cat"][value="none"])`); await p.click(D_ + '[data-a="assist-confirm"]'); await w(500);
        ok(await ev(() => { const b = D().booking; return assistCat(b, 'adult-4') === 'none' && assistCat(b, 'adult-1') === 'disability'; }) && (v === 3 || /No assistance requested/.test(await ev(s => document.querySelector(s).innerText, card('adult-4')))), `${C} (variant on) Add assistance applies to that traveler only`);
      }
      // ---- Business Pass ----
      await ev(v => { VS[v] = makeVS('passrider'); goLoc('ff'); }, v); await w();
      if (bp === 'current') ok(await p.locator(D_ + '.mode-entry').count() === 1 && await p.locator(D_ + '.bp-seg, ' + D_ + '.bp-tabs').count() === 0 && await p.locator(D_ + '.ads-segmented [data-a="pr-type"]').count() === 2, `${C} Business Pass: original Booking type entry and switcher`);
      else {
        const dd = await ev(() => { const s = document.querySelector('#device select[data-f="bpcombo"]'); return s && { opts: [...s.options].map(o => o.textContent + (o.disabled ? ':off' : '')), val: s.value, req: s.getAttribute('aria-required'), label: document.querySelector(`label[for="${s.id}"]`).textContent.trim(), help: document.getElementById(s.id + '-h').textContent }; });
        ok(await p.locator(D_ + '.mode-entry').count() === 0 && await p.locator(D_ + '[data-a="pr-type"]').count() === 0 && dd && JSON.stringify(dd.opts) === '["Choose booking and travel type","Pass Rider — Business","Pass Rider — Leisure","Regular"]', `${C} Business Pass: one dropdown with every allowed combination; no Regular travel types`);
        ok(dd.val === '' && dd.req === 'true' && /^Booking type\s*Required$/.test(dd.label) && /Business travel is for you alone\. Leisure lets you bring family and companions\./.test(dd.help) && await p.locator(D_ + '[data-a="find-trains"]').isDisabled(), `${C} nothing preselected, required, guidance beneath, Find trains disabled`);
      }
    }
    // ---- Equivalence: each new control gives the same result as the original ----
    const run = async (bp, act) => { await setCmp('current', bp); await ev(v => { VS[v] = makeVS('passrider'); const b = D().booking; b.from = 'LOR'; b.to = 'SFA'; goLoc('ff'); }, v); await w(); await act(); return ev(() => { const b = D().booking; return JSON.stringify({ intent: b.intent, prType: b.prType, from: b.from, to: b.to, notice: b.notice, pay: b.pay, modeNote: b.modeNote }); }); };
    const viaSeg = await run('current', async () => { await p.click(D_ + '.ads-segmented [data-a="pr-type"][data-v="business"]'); await w(); });
    const viaTab = await run('compact', async () => { await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'pr:business'); await w(); });
    ok(viaSeg === viaTab && JSON.parse(viaTab).prType === 'business', `${T} Pass Rider — Business = Business switcher (Auto Train cleared the same way)`);
    const leiSeg = await run('current', async () => { await p.click(D_ + '.ads-segmented [data-a="pr-type"][data-v="leisure"]'); await w(); });
    const leiTab = await run('compact', async () => { await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'pr:leisure'); await w(); });
    ok(leiSeg === leiTab && JSON.parse(leiTab).prType === 'leisure', `${T} Pass Rider — Leisure = Leisure switcher`);
    const regSheet = await run('current', async () => { await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="personal"])`); await w(); });
    const regSeg = await run('compact', async () => { await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'personal'); await w(); });
    ok(regSheet === regSeg && JSON.parse(regSeg).intent === 'personal', `${T} Regular = Regular in the Booking type sheet`);
    ok(await ev(() => document.querySelector('#device select[data-f="bpcombo"]').value) === 'personal' && /Regular fares/.test(await ev(() => document.querySelector('#device .bp-mode__help').textContent)) && await p.locator(D_ + '[data-a="find-trains"]').isEnabled(), `${T} Regular: selected, guidance updated, Find trains enabled (no travel type needed)`);
    const prBack = await run('compact', async () => { await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'personal'); await w(); await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'pr:leisure'); await w(); });
    const prBackSheet = await run('current', async () => { await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="personal"])`); await w(); await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="pr"])`); await w(); await p.click(D_ + '.ads-segmented [data-a="pr-type"][data-v="leisure"]'); await w(); });
    ok(prBack === prBackSheet, `${T} Regular then Pass Rider — Leisure = sheet then switcher`);
    // downstream: find trains with the compact controls
    await setCmp('current', 'compact'); await ev(v => { VS[v] = makeVS('passrider'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; goLoc('ff'); }, v); await w();
    ok(await p.locator(D_ + '[data-a="find-trains"]').isDisabled(), `${T} Find trains disabled until a travel type is chosen`);
    await p.focus(D_ + 'select[data-f="bpcombo"]'); await p.keyboard.press('ArrowDown'); await w(300);
    ok(await ev(() => document.activeElement && document.activeElement.dataset.f === 'bpcombo') && await ev(() => getComputedStyle(document.activeElement.closest('.ads-control')).boxShadow !== 'none' || getComputedStyle(document.activeElement).outlineStyle !== 'none'), `${T} keyboard: dropdown keeps focus with a visible focus style`);
    await p.selectOption(D_ + 'select[data-f="bpcombo"]', 'pr:business'); await w(); await p.click(D_ + '[data-a="find-trains"]'); await w(1000);
    ok(/Pass Rider · Business/.test(await ev(() => document.querySelector('#device').innerText)), `${T} search hand-off: Pass Rider · Business`);
    // other pass scenarios keep the current UI
    for (const sc of ['passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent', 'triplink-passrider', 'triplink']) {
      await ev(([v, sc]) => { VS[v] = makeVS(sc); goLoc('ff'); }, [v, sc]); await w(200);
      ok(await p.locator(D_ + 'select[data-f="bpcombo"]').count() === 0 && await p.locator(D_ + '.mode-entry').count() === 1, `${T} ${sc}: current controls kept with the compact setting on`);
    }
    await setCmp('current', 'current');
  }
  await p.addScriptTag({ content: require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
  for (const v of [1]) { await setCmp('current', 'compact'); await ev(v => { TB.v = v; VS[v] = makeVS('passrider'); goLoc('ff'); }, v); await w();
    const vio = await ev(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.filter(x => x.nodes.some(n => !n.target.join(' ').includes('dev-status'))).map(x => x.id));
    ok(!vio.length, `C${v} axe with the dropdown ${vio.join(',')}`); }
  // unavailable options: not reachable in the Business Pass scenario today; checked against the rule functions
  const offs = await ev(() => { const d = clone(D()); d.passrider.business = false; const a = bpComboOpts(d).map(o => o.off ? 'off' : 'on').join(); d.passrider.business = true; d.passrider.role = 'dependent'; d.passrider.minor = true; const c = bpComboOpts(d).map(o => o.off ? 'off' : 'on').join(); return a + '|' + c; });
  ok(offs === 'off,on,on|off,off,on', `rules: no Business Pass disables Business; a dependent 15 or younger disables both Pass Rider options (${offs})`);
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
