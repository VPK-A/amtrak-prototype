// Pass Rider traveler selection by name: the signed-in traveler's checkbox shows their name; each other person on
// the pass is a 0/1 counter; Companions is the only counter above 1; no relationship labels anywhere; saved details
// prefill Traveler details; identity and assistance answers survive selection changes; Business and Leisure.
const { chromium } = require('playwright');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
const REL = /\b(Employees?|Spouses?|Dependents?|Retirees?)\b/;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(URL);
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 250) => p.waitForTimeout(ms), D_ = '#device ';
  const pane = () => ev(() => [...document.querySelectorAll('#device .pane')].pop().innerText);
  const go = (v, sc, type = 'leisure', loc = 'travelers') => ev(([v, sc, type, loc]) => { TB.v = v; TB.dev = 'iphone'; VS[v] = makeVS(sc); const b = D().booking; if (prCanStart(D()).ok) b.intent = 'pr'; b.prType = type; goLoc(loc); }, [v, sc, type, loc]).then(() => w());
  for (const v of [1, 3]) {
    const T = `C${v}`;
    for (const sc of ['passrider', 'passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent', 'triplink-passrider']) {
      await go(v, sc);
      const roster = await ev(() => D().passrider.people.map(x => x.id));
      const meLabel = await ev(() => { const i = document.querySelector('#device [data-a="pr-me"]'); return i && i.closest('label').innerText.split('\n')[0].trim(); });
      ok(meLabel === 'Alex Rivera' && await ev(() => document.querySelector('#device [data-a="pr-me"]').checked), `${T} ${sc}: signed-in traveler shown by name, checked by default`);
      const rows = await ev(() => [...document.querySelectorAll('#device [data-a="pax"][data-g="prp"][data-d="1"]')].map(x => x.dataset.k));
      ok(JSON.stringify([...new Set(rows)]) === JSON.stringify(roster), `${T} ${sc}: one row per person on the pass (${roster.join(', ')})`);
      ok(!REL.test(await pane()), `${T} ${sc}: no relationship labels`);
    }
    // 0/1 counters and companions
    await go(v, 'passrider');
    const btn = (k, d, g = 'prp') => `${D_}[data-a="pax"][data-g="${g}"][data-k="${k}"][data-d="${d}"]`;
    ok(await p.locator(btn('jordan', -1)).isDisabled() && await p.locator(btn('jordan', 1)).isEnabled(), `${T} at 0: minus disabled, plus enabled`);
    await p.click(btn('jordan', 1)); await w();
    ok(await p.locator(btn('jordan', 1)).isDisabled() && await p.locator(btn('jordan', -1)).isEnabled() && await ev(() => travelerList(D().booking).some(t => t.key === 'pr-jordan' && /Jordan Rivera/.test(t.label))), `${T} at 1: plus disabled; Jordan Rivera added by name`);
    for (let i = 0; i < 3; i++) { await p.click(btn('comp', 1, 'pr')); await w(150); }
    ok(await ev(() => D().booking.prPax.comp) === 3 && await ev(() => Object.values(D().booking.prPax.people).every(n => n === 1)), `${T} Companions count above 1; named people stay at 0 or 1`);
    // saved details prefill Traveler details; identity and assistance survive changes
    await p.click(btn('sam', 1)); await w();
    if (v === 1) ok(await ev(() => document.querySelector('#device #pk-pr-sam').value) === 'child' && /From your pass record · Date of birth 03\/21\/2016/.test(await pane()), `${T} Sam prefilled as Child with saved date of birth`);
    else ok(await ev(() => document.querySelector('#device #ovk-pr-sam').value) === 'child', `${T} Sam prefilled as Child`);
    await ev(() => { const b = D().booking; setAssistRec(b, 'pr-sam', { cat: 'station', dis: [], wc: null, needs: ['seat'], for: null }); render(); }); await w();
    await p.click(btn('jordan', -1)); await w();
    ok(await ev(() => { const b = D().booking; return assistCat(b, 'pr-sam') === 'station' && !travelerList(b).some(t => t.key === 'pr-jordan'); }), `${T} removing Jordan keeps Sam’s answers`);
    await p.click(btn('sam', -1)); await w(); await p.click(btn('sam', 1)); await w();
    ok(await ev(() => assistCat(D().booking, 'pr-sam') === 'station'), `${T} Sam removed and added again: same person, answers kept`);
    ok((await ev(() => travelerList(D().booking).map(t => t.label))).every(l => !REL.test(l)) && !REL.test(await pane()), `${T} traveler details use names only`);
    // book without the signed-in traveler; companions need someone on the pass
    await p.click(`${D_}[data-a="pr-me"]`, { force: true }); await w();
    ok(await ev(() => !travelerList(D().booking).some(t => t.key === 'pr-you') && prProblems(D().booking).length === 0), `${T} can book without the signed-in traveler`);
    await p.click(btn('sam', -1)); await w();
    ok(/Companions must travel with you or someone else on your pass\./.test(await pane()), `${T} companions alone are blocked (no relationship words)`);
    // assistance screen and summaries use names
    await go(v, 'passrider-assist');
    await p.click(`${D_}[data-a="assist-edit"][data-t="pr-jordan"]`); await w(500);
    const at = await pane(); ok(/For Traveler 2 · Jordan Rivera/.test(at) && !REL.test(at), `${T} assistance screen names the traveler`);
    await ev(() => { sheet().stack.pop(); render(); }); await w();
    await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); }); await w();
    const ff = await ev(() => document.querySelector('#device #ff-trav').innerText);
    ok(/Alex Rivera, Jordan Rivera, Maya Rivera, 1 companion/.test(ff) && !REL.test(ff), `${T} New booking summary lists names (${ff.split('\n')[0]})`);
    await p.click(D_ + '[data-a="find-trains"]'); await w(1000);
    const ho = await pane(); ok(/Traveler 2 · Jordan Rivera/.test(ho) && /Personal companion to Traveler 1 · Alex Rivera/.test(ho) && !REL.test(ho.replace(/Pass Rider/g, '')), `${T} search hand-off uses names`);
    // Business: the signed-in traveler alone, by name
    await go(v, 'passrider', 'business');
    const bt = await pane(); ok(/Alex Rivera/.test(bt) && /Business travel is for you alone/.test(bt) && !REL.test(bt) && await p.locator(D_ + '#ask-pr-you, ' + D_ + '[data-a="assist-edit"][data-t="pr-you"]').count() >= 1, `${T} Business: named, alone, assistance available`);
  }
  // minor can't start Pass Rider (unchanged)
  await ev(() => { TB.v = 1; VS[1] = makeVS('passrider-minor'); goLoc('ff'); }); await w();
  ok(await ev(() => D().booking.intent) !== 'pr' && !(await ev(() => prCanStart(D()).ok)), 'dependent 15 or younger still can’t start Pass Rider');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
