const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
  const open = (v, sc, loc = 'ff') => ev(([v, sc, loc]) => { TB.v = v; TB.dev = 'iphone'; VS[v] = makeVS(sc); goLoc(loc); }, [v, sc, loc]);
  const close = async () => { await p.locator('#device .psheet [data-a="close"]').first().click(); await w(400); return ev(() => ({ dlg: nav().dialog && nav().dialog.title, open: !!nav().sheet })); };
  for (const v of [1]) for (const sc of ['returning', 'guest', 'assist', 'passrider', 'triplink', 'triplink-passrider', 'rpa', 'passrider-retiree']) {
    const T = `C${v} ${sc}`;
    await open(v, sc); let r = await close(); ok(!r.dlg && !r.open, `${T} untouched: closes without asking`);
    await open(v, sc); await ev(() => { D().booking.from = 'NYP'; render(); }); r = await close(); ok(r.dlg === 'Exit booking?', `${T} station chosen: asks`);
  }
  for (const v of [1]) {
    const T = `C${v}`;
    await open(v, 'returning'); await p.locator('#device [data-a="trip"][data-v="rt"]').click(); await w(200); ok((await close()).dlg === 'Exit booking?', `${T} round-trip chosen: asks`);
    await open(v, 'returning'); await ev(() => { D().booking.codeText = 'V123'; render(); }); ok((await close()).dlg === 'Exit booking?', `${T} code typed: asks`);
    await open(v, 'returning'); await ev(() => { D().booking.pax.adult = 2; render(); }); ok((await close()).dlg === 'Exit booking?', `${T} travelers changed: asks`);
    await open(v, 'returning'); await ev(() => { D().booking.pay = 'points'; render(); }); ok((await close()).dlg === 'Exit booking?', `${T} points chosen: asks`);
    await open(v, 'returning', 'travelers'); ok((await close()).dlg !== 'Exit booking?', `${T} Travelers open, nothing changed: no question`);
    await open(v, 'returning'); await p.locator('#device [data-a="trip"][data-v="rt"]').click(); await w(150); await p.locator('#device [data-a="trip"][data-v="ow"]').click(); await w(150); ok(!(await close()).dlg, `${T} changed then put back: no question`);
    await open(v, 'returning'); await ev(() => { D().booking.from = 'NYP'; render(); }); await p.keyboard.press('Escape'); await w(300); ok(await ev(() => nav().dialog && nav().dialog.title) === 'Exit booking?', `${T} Escape with a station: asks`);
    await open(v, 'returning'); await p.keyboard.press('Escape'); await w(300); ok(await ev(() => !nav().dialog && !nav().sheet), `${T} Escape untouched: closes`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close(); })();
