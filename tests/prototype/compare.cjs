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
  for (const v of [1, 3]) {
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
      else ok(await p.locator(D_ + '.mode-entry').count() === 0 && await ev(() => [...document.querySelectorAll('#device .bp-seg button')].map(x => x.textContent + ':' + x.getAttribute('aria-pressed')).join()) === 'Pass Rider:true,Regular:false' && await p.locator(D_ + '.bp-tabs [role="tab"][data-a="pr-type"]').count() === 2, `${C} Business Pass: segmented Pass Rider / Regular and Business / Leisure tabs`);
    }
    // ---- Equivalence: each new control gives the same result as the original ----
    const run = async (bp, act) => { await setCmp('current', bp); await ev(v => { VS[v] = makeVS('passrider'); const b = D().booking; b.from = 'LOR'; b.to = 'SFA'; goLoc('ff'); }, v); await w(); await act(); return ev(() => { const b = D().booking; return JSON.stringify({ intent: b.intent, prType: b.prType, from: b.from, to: b.to, notice: b.notice, pay: b.pay, modeNote: b.modeNote }); }); };
    const viaSeg = await run('current', async () => { await p.click(D_ + '.ads-segmented [data-a="pr-type"][data-v="business"]'); await w(); });
    const viaTab = await run('compact', async () => { await p.click(D_ + '.bp-tabs [data-a="pr-type"][data-v="business"]'); await w(); });
    ok(viaSeg === viaTab && JSON.parse(viaTab).prType === 'business', `${T} Business tab = Business switcher (Auto Train cleared the same way)`);
    const leiSeg = await run('current', async () => { await p.click(D_ + '.ads-segmented [data-a="pr-type"][data-v="leisure"]'); await w(); });
    const leiTab = await run('compact', async () => { await p.click(D_ + '.bp-tabs [data-a="pr-type"][data-v="leisure"]'); await w(); });
    ok(leiSeg === leiTab && JSON.parse(leiTab).prType === 'leisure', `${T} Leisure tab = Leisure switcher`);
    const regSheet = await run('current', async () => { await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="personal"])`); await w(); });
    const regSeg = await run('compact', async () => { await p.click(D_ + '.bp-seg [data-v="personal"]'); await w(); });
    ok(regSheet === regSeg && JSON.parse(regSeg).intent === 'personal', `${T} Regular segment = Regular in the Booking type sheet`);
    ok(await p.locator(D_ + '.bp-tabs').count() === 0 && await p.locator(D_ + '.bp-seg [data-v="personal"][aria-pressed="true"]').count() === 1, `${T} Regular: tabs hidden like the switcher`);
    const prBack = await run('compact', async () => { await p.click(D_ + '.bp-seg [data-v="personal"]'); await w(); await p.click(D_ + '.bp-seg [data-v="pr"]'); await w(); });
    const prBackSheet = await run('current', async () => { await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="personal"])`); await w(); await p.click(D_ + '.mode-entry'); await w(); await p.click(`${D_}label:has(input[data-a="mode-pick"][data-v="pr"])`); await w(); });
    ok(prBack === prBackSheet, `${T} back to Pass Rider: same as the sheet`);
    // downstream: find trains with the compact controls
    await setCmp('current', 'compact'); await ev(v => { VS[v] = makeVS('passrider'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; goLoc('ff'); }, v); await w();
    ok(await p.locator(D_ + '[data-a="find-trains"]').isDisabled(), `${T} Find trains disabled until a travel type is chosen`);
    await p.click(D_ + '.bp-tabs [data-v="business"]'); await w(); await p.click(D_ + '[data-a="find-trains"]'); await w(1000);
    ok(/Pass Rider · Business/.test(await ev(() => document.querySelector('#device').innerText)), `${T} search hand-off: Pass Rider · Business`);
    // other pass scenarios keep the current UI
    for (const sc of ['passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent', 'triplink-passrider', 'triplink']) {
      await ev(([v, sc]) => { VS[v] = makeVS(sc); goLoc('ff'); }, [v, sc]); await w(200);
      ok(await p.locator(D_ + '.bp-seg, ' + D_ + '.bp-tabs').count() === 0 && await p.locator(D_ + '.mode-entry').count() === 1, `${T} ${sc}: current controls kept with the compact setting on`);
    }
    await setCmp('current', 'current');
  }
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
