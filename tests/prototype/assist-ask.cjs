// Checking "Traveler with disability or need help?" opens that traveler's questions straight away; abandoning
// them leaves the box checked with Add; kept answers come back without reopening (both concepts)
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const stack = () => ev(() => sheet() ? sheet().stack.map(r => r.s).join('>') : '');
  const go = (v, net = 'online', dev = 'iphone') => ev(([v, net, dev]) => { TB.v = v; TB.dev = dev; VS[v] = makeVS('returning'); V().net = net; goLoc('travelers'); D().booking.pax.adult = 2; render(); }, [v, net, dev]);
  const openRow = async (v, key) => { if (v === 3) { await p.locator(D_ + `[data-a="ov-traveler"][data-t="${key}"]`).click(); await w(400); } };
  for (const v of [1, 3]) for (const where of v === 3 ? ['row', 'sheet'] : ['card']) {
    const T = `C${v} ${where}`;
    await go(v); if (where === 'sheet') await openRow(v, 'adult-2');
    const base = await stack();
    await p.locator(D_ + 'label:has(#ask-adult-2)').click(); await w(1100);
    ok((await stack()).endsWith('assist') && /For Traveler 2/.test(await ev(() => document.querySelector('#device').innerText)), `${T} checking opens Traveler 2's questions`);
    await p.locator(D_ + '.psheet [data-a="back"]').first().click(); await w(500);
    ok(await stack() === base && await p.locator(D_ + '#ask-adult-2').isChecked() && await p.locator(D_ + '[data-a="assist-answer"][data-t="adult-2"]').count() === 1, `${T} abandoning: box stays checked, Add shown`);
    await p.locator(D_ + '[data-a="assist-answer"][data-t="adult-2"]').click(); await w(1100);
    await ev(() => { const r = sheet().stack[sheet().stack.length - 1]; r.u.d = { cat: 'station', dis: [], wc: '', needs: [], for: '' }; render(); }); await p.locator(D_ + '[data-a="assist-confirm"]').click(); await w(500);
    ok(await ev(() => assistRec(D().booking, 'adult-2').done) && await p.locator(D_ + '[data-a="assist-edit"][data-t="adult-2"]').count() >= 0, `${T} answered through Add`);
    await p.locator(D_ + 'label:has(#ask-adult-2)').click(); await w(300); await p.locator(D_ + 'label:has(#ask-adult-2)').click(); await w(600);
    ok(await stack() === base && await ev(() => assistCat(D().booking, 'adult-2')) === 'station', `${T} re-checking with kept answers: no questions, answers restored`);
    if (where !== 'sheet') { await p.locator(D_ + 'label:has(#ask-adult-1)').click(); await w(1100); }
    if (where !== 'sheet') ok((await stack()).endsWith('assist') && /For Traveler 1/.test(await ev(() => document.querySelector('#device').innerText)), `${T} another traveler opens their own questions`);
  }
  for (const v of [1, 3]) {
    await go(v, 'offline'); await p.locator(D_ + 'label:has(#ask-adult-1)').click(); await w(400);
    ok(!(await stack()).endsWith('assist') && /offline/i.test(await ev(() => document.querySelector('#device').innerText)) && await p.locator(D_ + '#ask-adult-1').isChecked() && await p.locator(D_ + '[data-a="assist-answer"][data-t="adult-1"]').count() === 1, `C${v} offline first time: stays, offline message, box checked with Add`);
    await go(v, 'slow'); await p.locator(D_ + 'label:has(#ask-adult-1)').click(); await w(300);
    ok(/Opening questions/.test(await ev(() => document.querySelector('#device').innerText)), `C${v} slow connection: progress with Cancel`);
    await p.locator(D_ + '[data-a="cancel-busy"]').click(); await w(200); ok(await p.locator(D_ + '[data-a="assist-answer"][data-t="adult-1"]').count() === 1, `C${v} cancelled: Add shown`);
    await go(v, 'online', 'ipad'); await p.locator(D_ + 'label:has(#ask-adult-1)').click(); await w(1100); ok((await stack()).endsWith('assist'), `C${v} iPad: opens the questions`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
