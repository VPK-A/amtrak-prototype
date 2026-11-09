// Pass Rider travelers by name with one checkbox per named rider (Leisure); Business is you alone. Companions keep the counter.
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
  const tick = async k => { await p.click(`${D_}label[for="prr-${k}"]`); await w(); };
  const chk = k => ev(k => { const e = document.querySelector('#device #prr-' + k); return e ? { on: e.checked, off: e.disabled } : null; }, k);
  for (const v of [1]) {
    const T = `C${v}`;
    for (const sc of ['passrider', 'passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent']) {
      await go(v, sc);
      const roster = await ev(() => D().passrider.people.map(x => x.id));
      const me = await ev(() => { const i = document.querySelector('#device #prr-me'), l = i.closest('.ffc-rider'); return { name: l.querySelector('.ads-choice__label > span').textContent, sub: (l.querySelector('.ads-choice__supporting') || {}).textContent, on: i.checked, off: i.disabled, first: l === document.querySelector('#device .ffc-rider') }; });
      const selfName = { 'passrider-spouse': 'Jordan Rivera', 'passrider-dependent': 'Maya Rivera' }[sc] || 'Alex Rivera';
      ok(!roster.includes(selfName.split(' ')[0].toLowerCase()) && await ev(n => document.querySelector('#device .ads-appheader__name').textContent === `Hi, ${n.split(' ')[0]}`, selfName), `${T} ${sc}: signed in as ${selfName}, not listed twice`);
      ok(me.name === selfName && me.on && !me.off && me.first && me.sub === 'You', `${T} ${sc}: signed-in traveler is a checked checkbox, first, marked You`);
      const rows = await ev(() => [...document.querySelectorAll('#device .ffc-riders input[data-a="pr-pick"]')].map(x => x.dataset.k).filter(k => k !== 'me'));
      ok(JSON.stringify([...new Set(rows)]) === JSON.stringify(roster), `${T} ${sc}: one row per person on the pass (${roster.join(', ')})`);
      ok(!REL.test(await pane()), `${T} ${sc}: no relationship labels`);
    }
    // one checkbox per named rider; companions keep the counter
    await go(v, 'passrider');
    const btn = (k, d, g = 'pr') => `${D_}[data-a="pax"][data-g="${g}"][data-k="${k}"][data-d="${d}"]`;
    ok(JSON.stringify(await chk('jordan')) === '{"on":false,"off":false}', `${T} not selected: unchecked and available`);
    await tick('jordan');
    ok((await chk('jordan')).on && await ev(() => travelerList(D().booking).filter(t => t.key === 'pr-jordan' && /Jordan Rivera/.test(t.label)).length === 1), `${T} selected: Jordan Rivera added once, by name`);
    for (let i = 0; i < 3; i++) { await p.click(btn('comp', 1)); await w(150); }
    ok(await ev(() => D().booking.prPax.comp) === 3 && await ev(() => Object.values(D().booking.prPax.people).every(n => n === 1)), `${T} Companions count above 1; named people stay at 0 or 1`);
    // saved details prefill Traveler details; identity and assistance survive changes
    await tick('sam');
    const sel = v === 1 ? '#pk-pr-sam' : '#ovk-pr-sam';
    ok(await ev(s => document.querySelector('#device ' + s).value, sel) === 'adult' && JSON.stringify(await ev(s => [...document.querySelectorAll('#device ' + s + ' option')].map(o => o.textContent), sel)) === '["Adult","Child"]', `${T} added relative defaults to Adult; dropdown has only Adult and Child`);
    if (v === 1) ok(!/From your pass record/.test(await pane()), `${T} no “From your pass record” line in Traveler details`);
    await p.selectOption(D_ + sel, 'child'); await w();
    await ev(() => { closeSheet(true); }); await w(); await ev(() => goLoc('travelers')); await w();
    ok(await ev(s => document.querySelector('#device ' + s).value, sel) === 'child', `${T} Child kept after closing and reopening Traveler selection`);
    ok(await ev(() => [...document.querySelectorAll('#device .ffc-rider')].filter(r => r.querySelector('[data-k]:not([data-k="me"])')).every(r => !r.querySelector('.ads-choice__supporting'))) && !/\b(Adult|Child)\b/.test(await ev(() => document.querySelector('#device .ffc-riders').innerText)), `${T} rider rows show only the name (no type)`);
    const comp = v === 1 ? '#pk-pr-comp-1' : '#ovk-pr-comp-1';
    ok(await ev(s => { const e = document.querySelector('#device ' + s); return e && e.value === 'adult' && e.options.length === 2; }, comp), `${T} companion traveler details: Adult by default, two options`);
    await ev(() => { const b = D().booking; setAssistRec(b, 'pr-sam', { cat: 'station', dis: [], wc: null, needs: ['seat'], for: null }); render(); }); await w();
    await tick('jordan');
    ok(await ev(() => { const b = D().booking; return assistCat(b, 'pr-sam') === 'station' && !travelerList(b).some(t => t.key === 'pr-jordan'); }), `${T} removing Jordan keeps Sam’s answers`);
    await tick('sam'); await tick('sam');
    ok(await ev(() => assistCat(D().booking, 'pr-sam') === 'station'), `${T} Sam removed and added again: same person, answers kept`);
    ok((await ev(() => travelerList(D().booking).map(t => t.label))).every(l => !REL.test(l)) && !REL.test(await pane()), `${T} traveler details use names only`);
    // book without the signed-in traveler; companions need someone on the pass
    await tick('me');
    ok(!(await chk('me')).on, `${T} signed-in traveler cleared`);
    // count kept when reopening (Done, then Travelers again)
    await p.click(D_ + '[data-a="pick-travelers-done"]'); await w(); if (v === 3 && await ev(() => sheet().stack.at(-1).s !== 'ff')) await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); render(); });
    await p.click(D_ + '[data-a="pick-travelers"], ' + D_ + '#ff-trav'); await w();
    ok(await ev(() => !prMe(D().booking)) && !(await chk('me')).on, `${T} signed-in traveler stays cleared after reopening`);
    await tick('me'); ok(await ev(() => travelerList(D().booking)[0].key === 'pr-you'), `${T} selecting again adds the signed-in traveler`);
    await tick('me');
    ok(await ev(() => !travelerList(D().booking).some(t => t.key === 'pr-you') && prProblems(D().booking).length === 0), `${T} can book without the signed-in traveler`);
    await tick('sam');
    ok(/Companions must travel with you or someone else on your pass\./.test(await pane()), `${T} companions alone are blocked (no relationship words)`);
    // assistance screen and summaries use names
    await go(v, 'passrider-assist');
    await p.click(`${D_}[data-a="assist-edit"][data-t="pr-jordan"]`); await w(500);
    const at = await pane(); ok(/Traveler 2 · Jordan Rivera/.test(await ev(() => document.querySelector("#device .assist-who").textContent)) && !REL.test(at), `${T} assistance screen names the traveler`);
    await ev(() => { sheet().stack.pop(); render(); }); await w();
    await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); }); await w();
    const ff = await ev(() => document.querySelector('#device #ff-trav').innerText);
    ok(/Alex Rivera, Jordan Rivera, Maya Rivera, 1 companion/.test(ff) && !REL.test(ff), `${T} New booking summary lists names (${ff.split('\n')[0]})`);
    await p.click(D_ + '[data-a="find-trains"]'); await w(1000);
    const ho = await pane(); ok(/Traveler 2 · Jordan Rivera/.test(ho) && /Traveler 2 · Jordan Rivera: I am a personal companion/.test(ho) && !/companion to Traveler 1/.test(ho) && !REL.test(ho.replace(/Pass Rider/g, '')), `${T} search hand-off uses names`);
    // Business: the signed-in traveler alone, by name
    await go(v, 'passrider', 'business');
    ok(JSON.stringify(await chk('me')) === '{"on":true,"off":true}' && await p.locator(D_ + '.ffc-riders input').count() === 1, `${T} Business: signed-in traveler checked and fixed; no one else`);
    const bt = await pane(); ok(/Alex Rivera/.test(bt) && /Business travel is for you alone/.test(bt) && !REL.test(bt) && await p.locator(D_ + '#ask-pr-you, ' + D_ + '[data-a="assist-edit"][data-t="pr-you"]').count() >= 1, `${T} Business: named, alone, assistance available`);
  }
  // name, subtext and counter aligned in every layout
  for (const [v, dev, or, type] of [[1, 'iphone', 'portrait', 'leisure'], [1, 'iphone', 'landscape', 'leisure'], [1, 'ipad', 'portrait', 'leisure'], [1, 'ipad', 'landscape', 'business'], [3, 'iphone', 'portrait', 'business'], [3, 'ipad', 'landscape', 'leisure']]) {
    await ev(([v, dev, or, type]) => { TB.v = v; TB.dev = dev; TB.orient = or; VS[v] = makeVS('passrider'); D().booking.intent = 'pr'; D().booking.prType = type; goLoc('travelers'); }, [v, dev, or, type]); await w(350);
    const bad = await ev(() => [...document.querySelectorAll('#device .ffc-count')].filter(r => { const t = r.querySelector('.ffc-count__text').getBoundingClientRect(), c = r.querySelector('.ads-counter').getBoundingClientRect(); return t.right > c.left + 1 || r.scrollWidth > r.clientWidth + 1; }).length + [...document.querySelectorAll('#device .ffc-rider')].filter(r => r.scrollWidth > r.clientWidth + 1).length);
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
