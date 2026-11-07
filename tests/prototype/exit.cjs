const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
  const open = (v, sc, loc = 'ff') => ev(([v, sc, loc]) => { TB.v = v; TB.dev = 'iphone'; VS[v] = makeVS(sc); goLoc(loc); }, [v, sc, loc]);
  const close = async () => { await p.locator('#device .psheet [data-a="close"]').first().click(); await w(400); return ev(() => ({ dlg: nav().dialog && nav().dialog.title, open: !!nav().sheet })); };
  // Design review: leaving New booking never warns before something is in the cart; selections are kept.
  // With an item in the cart, "Abandon booking?" offers Continue booking / Abandon booking.
  for (const v of [1]) for (const sc of ['returning', 'guest', 'assist', 'passrider', 'triplink', 'rpa', 'passrider-retiree']) {
    const T = `C${v} ${sc}`;
    await open(v, sc); let r = await close(); ok(!r.dlg && !r.open, `${T} untouched: closes without asking`);
    await open(v, sc); await ev(() => { D().booking.from = 'NYP'; render(); }); r = await close();
    ok(!r.dlg && !r.open && await ev(() => D().booking.from) === 'NYP', `${T} station chosen, no cart: closes without asking; selection kept`);
  }
  for (const v of [1]) {
    const T = `C${v}`;
    await open(v, 'returning'); await p.locator('#device [data-a="trip"][data-v="rt"]').click(); await w(200); ok(!(await close()).dlg && await ev(() => D().booking.trip) === 'rt', `${T} round trip, no cart: no question, kept`);
    await open(v, 'returning'); await ev(() => { setCodeText(D().booking, 'V123'); render(); }); ok(!(await close()).dlg && await ev(() => D().booking.codeText) === 'V123', `${T} code typed, no cart: no question, code kept`);
    await open(v, 'returning'); await ev(() => { D().booking.pax.adult = 2; render(); }); ok(!(await close()).dlg && await ev(() => D().booking.pax.adult) === 2, `${T} travelers changed, no cart: no question, kept`);
    await open(v, 'returning'); await ev(() => { D().booking.from = 'NYP'; render(); }); await p.keyboard.press('Escape'); await w(300); ok(await ev(() => !nav().dialog && !nav().sheet), `${T} Escape at Fare Finder, no cart: closes`);
    await open(v, 'returning', 'travelers'); await p.keyboard.press('Escape'); await w(300); ok(await ev(() => !nav().dialog && sheet() && sheet().stack.length === 1), `${T} Escape on Traveler selection goes Back one level`);
    // with an item in the cart
    await open(v, 'returning'); await ev(() => { D().cart = [{ label: 'Sample train' }]; render(); });
    let r = await close(); ok(r.dlg === 'Abandon booking?' && r.open, `${T} with a cart: asks Abandon booking?`);
    await p.locator('.pdialog [data-dlg="0"]').click(); await w(300); ok(await ev(() => !nav().dialog && !!nav().sheet && (D().cart || []).length === 1), `${T} Continue booking keeps the cart and the screen`);
    await p.keyboard.press('Escape'); await w(300); ok(await ev(() => nav().dialog && nav().dialog.title) === 'Abandon booking?', `${T} Escape with a cart asks too`);
    await p.locator('.pdialog [data-dlg="1"]').click(); await w(300); ok(await ev(() => !nav().sheet && (D().cart || []).length === 0 && nav().tab === 'book'), `${T} Abandon booking clears the cart and returns to Book`);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close(); })();
