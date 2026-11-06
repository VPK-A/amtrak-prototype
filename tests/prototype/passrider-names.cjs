// Runs with the current-design counters (Prototype controls › Pass Rider traveler selection); passrider-select.cjs covers the checkbox proposal.
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
  const go = (v, sc, type = 'leisure', loc = 'travelers') => ev(([v, sc, type, loc]) => { TB.v = v; TB.dev = 'iphone'; PRSEL.v = 'counter'; VS[v] = makeVS(sc); const b = D().booking; if (prCanStart(D()).ok) b.intent = 'pr'; b.prType = type; goLoc(loc); }, [v, sc, type, loc]).then(() => w());
  for (const v of [1]) {
    const T = `C${v}`;
    for (const sc of ['passrider', 'passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent', 'triplink-passrider']) {
      await go(v, sc);
      const roster = await ev(() => D().passrider.people.map(x => x.id));
      const me = await ev(() => { const r = document.querySelector('#device [data-g="prme"]').closest('.ffc-count'); return { name: r.querySelector('.ffc-count__label').textContent, sub: (r.querySelector('.ffc-count__sub') || {}).textContent, val: r.querySelector('.ads-counter').innerText.replace(/\D/g, ''), minus: r.querySelector('[data-d="-1"]').disabled, plus: r.querySelector('[data-d="1"]').disabled, checkbox: !!document.querySelector('#device [data-a="pr-me"]'), first: r === document.querySelector('#device .ffc-count') }; });
      const selfName = { 'passrider-spouse': 'Jordan Rivera', 'passrider-dependent': 'Maya Rivera' }[sc] || 'Alex Rivera';
      ok(!roster.includes(selfName.split(' ')[0].toLowerCase()) && await ev(n => document.querySelector('#device .ads-appheader__name').textContent === `Hi, ${n.split(' ')[0]}`, selfName), `${T} ${sc}: signed in as ${selfName}, not listed twice`);
      ok(me.name === selfName && me.val === '1' && !me.minus && me.plus && !me.checkbox && me.first && me.sub === 'Set to 0 to book for your family without you.', `${T} ${sc}: signed-in traveler is a 0/1 counter row at 1, first, with the new subtext`);
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
    const sel = v === 1 ? '#pk-pr-sam' : '#ovk-pr-sam';
    ok(await ev(s => document.querySelector('#device ' + s).value, sel) === 'adult' && JSON.stringify(await ev(s => [...document.querySelectorAll('#device ' + s + ' option')].map(o => o.textContent), sel)) === '["Adult","Child"]', `${T} added relative defaults to Adult; dropdown has only Adult and Child`);
    if (v === 1) ok(/From your pass record · Date of birth 06\/02\/2012/.test(await pane()), `${T} saved date of birth carried into Traveler details`);
    await p.selectOption(D_ + sel, 'child'); await w();
    await ev(() => { closeSheet(true); }); await w(); await ev(() => goLoc('travelers')); await w();
    ok(await ev(s => document.querySelector('#device ' + s).value, sel) === 'child', `${T} Child kept after closing and reopening Traveler selection`);
    ok(await ev(() => [...document.querySelectorAll('#device .ffc-count')].filter(r => r.querySelector('[data-g="prp"]')).every(r => !r.querySelector('.ffc-count__sub'))) && !/\b(Adult|Child)\b/.test(await ev(() => [...document.querySelectorAll('#device .ffc-count')].map(r => r.querySelector('.ffc-count__text').innerText).join(' '))), `${T} no Adult or Child under names in Who’s traveling`);
    const comp = v === 1 ? '#pk-pr-comp-1' : '#ovk-pr-comp-1';
    ok(await ev(s => { const e = document.querySelector('#device ' + s); return e && e.value === 'adult' && e.options.length === 2; }, comp), `${T} companion traveler details: Adult by default, two options`);
    await ev(() => { const b = D().booking; setAssistRec(b, 'pr-sam', { cat: 'station', dis: [], wc: null, needs: ['seat'], for: null }); render(); }); await w();
    await p.click(btn('jordan', -1)); await w();
    ok(await ev(() => { const b = D().booking; return assistCat(b, 'pr-sam') === 'station' && !travelerList(b).some(t => t.key === 'pr-jordan'); }), `${T} removing Jordan keeps Sam’s answers`);
    await p.click(btn('sam', -1)); await w(); await p.click(btn('sam', 1)); await w();
    ok(await ev(() => assistCat(D().booking, 'pr-sam') === 'station'), `${T} Sam removed and added again: same person, answers kept`);
    ok((await ev(() => travelerList(D().booking).map(t => t.label))).every(l => !REL.test(l)) && !REL.test(await pane()), `${T} traveler details use names only`);
    // book without the signed-in traveler; companions need someone on the pass
    await p.click(btn('me', -1, 'prme')); await w();
    ok(await p.locator(btn('me', -1, 'prme')).isDisabled() && await p.locator(btn('me', 1, 'prme')).isEnabled(), `${T} signed-in traveler at 0: minus disabled, plus enabled`);
    // count kept when reopening (Done, then Travelers again)
    await p.click(D_ + '[data-a="pick-travelers-done"]'); await w(); if (v === 3 && await ev(() => sheet().stack.at(-1).s !== 'ff')) await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); render(); });
    await p.click(D_ + '[data-a="pick-travelers"], ' + D_ + '#ff-trav'); await w();
    ok(await ev(() => !prMe(D().booking)) && await p.locator(btn('me', 1, 'prme')).isEnabled() && await p.locator(btn('me', -1, 'prme')).isDisabled(), `${T} signed-in traveler stays at 0 after reopening`);
    await p.click(btn('me', 1, 'prme')); await w(); ok(await ev(() => travelerList(D().booking)[0].key === 'pr-you'), `${T} back to 1 adds the signed-in traveler`);
    await p.click(btn('me', -1, 'prme')); await w();
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
    const ho = await pane(); ok(/Traveler 2 · Jordan Rivera/.test(ho) && /Traveler 2 · Jordan Rivera: I am a personal companion/.test(ho) && !/companion to Traveler 1/.test(ho) && !REL.test(ho.replace(/Pass Rider/g, '')), `${T} search hand-off uses names`);
    // Business: the signed-in traveler alone, by name
    await go(v, 'passrider', 'business');
    ok(await ev(() => { const r = document.querySelector('#device [data-g="prme"]').closest('.ffc-count'); return r.querySelector('.ads-counter').innerText.replace(/\D/g, '') === '1' && [...r.querySelectorAll('button')].every(x => x.disabled); }), `${T} Business: signed-in traveler row fixed at 1`);
    const bt = await pane(); ok(/Alex Rivera/.test(bt) && /Business travel is for you alone/.test(bt) && !REL.test(bt) && await p.locator(D_ + '#ask-pr-you, ' + D_ + '[data-a="assist-edit"][data-t="pr-you"]').count() >= 1, `${T} Business: named, alone, assistance available`);
  }
  // name, subtext and counter aligned in every layout
  for (const [v, dev, or, type] of [[1, 'iphone', 'portrait', 'leisure'], [1, 'iphone', 'landscape', 'leisure'], [1, 'ipad', 'portrait', 'leisure'], [1, 'ipad', 'landscape', 'business'], [3, 'iphone', 'portrait', 'business'], [3, 'ipad', 'landscape', 'leisure']]) {
    await ev(([v, dev, or, type]) => { TB.v = v; TB.dev = dev; PRSEL.v = 'counter'; TB.orient = or; VS[v] = makeVS('passrider'); D().booking.intent = 'pr'; D().booking.prType = type; goLoc('travelers'); }, [v, dev, or, type]); await w(350);
    const bad = await ev(() => [...document.querySelectorAll('#device .ffc-count')].filter(r => { const t = r.querySelector('.ffc-count__text').getBoundingClientRect(), c = r.querySelector('.ads-counter').getBoundingClientRect(); return t.right > c.left + 1 || r.scrollWidth > r.clientWidth + 1; }).length);
    ok(bad === 0, `C${v} ${dev} ${or} ${type}: rows without overlap or clipping`);
  }
  await ev(() => { TB.dev = 'iphone'; TB.orient = 'portrait'; });
  // minor can't start Pass Rider (unchanged)
  await ev(() => { TB.v = 1; VS[1] = makeVS('passrider-minor'); goLoc('ff'); }); await w();
  ok(await ev(() => D().booking.intent) !== 'pr' && !(await ev(() => prCanStart(D()).ok)), 'dependent 15 or younger still can’t start Pass Rider');
  ok(await ev(() => `${D().profile.first} ${D().profile.last}`) === 'Sam Rivera' && await ev(() => D().passrider.people.map(p => p.name).join()) === 'Alex Rivera,Jordan Rivera,Maya Rivera', 'dependent 15 or younger is Sam Rivera; Alex, Jordan and Maya on the pass');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
