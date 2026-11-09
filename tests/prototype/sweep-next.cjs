// Design system › ADS Next: axe and overflow sweep across the concept's screens
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href); await p.addScriptTag({ content: AXE });
  let n = 0, runs = 0;
  const screens = [
    ['book', 'returning', 'tab:book', ''], ['ff long names', 'returning', 'ff', "const b=D().booking; b.from='PHL'; b.to='BWI'; b.pax.adult=2; b.codeText='60310045672211'; b.code=clone(D().coupons[0]);"],
    ['ff points guest', 'guest', 'ff', "D().booking.pay='points'"], ['pass rider', 'passrider', 'ff', ''], ['booking type', 'triplink', 'ff', ''],
    ['apply coupon', 'returning', 'ff', "push('dcode', {}, 0)"], ['codes info', 'returning', 'ff', "push('dcode', {}, 0); openInfo('codes')"], ['stations selected', 'returning', 'stations:to', "D().booking.from='PHL'; D().booking.to='WAS';"],
    ['travelers', 'assist', 'travelers', "D().booking.pax.adult=2"], ['assistance', 'returning', 'assist-booking', ''], ['exit dialog', 'returning', 'ff', "A.close(null,'0')"],
    ['profile', 'passrider', 'profile', ''], ['employee', 'passrider', 'edit:employee', ''], ['address', 'returning', 'edit:address', ''], ['profile assistance', 'assist', 'assist-profile', ''], ['account', 'returning', 'account', ''], ['calendar', 'returning', 'calendar:dep', ''], ['discounts', 'returning', 'discounts', ''], ['rules', 'returning', 'rules', ''], ['coupons', 'returning', 'coupons', ''], ['verify', 'returning', 'verify:change-email', ''], ['trips empty', 'returning', 'tab:trips', ''], ['offline ff', 'returning', 'ff', "V().net='offline'"], ['clear recents', 'returning', 'clear-recents', ''], ['dob error', 'returning', 'edit:dob', '']];
  for (const dev of ['iphone', 'ipad']) for (const orient of ['portrait', 'landscape']) for (const theme of ['light', 'dark']) for (const text of [100, 140]) for (const v of [1]) {
    if (orient === 'landscape' && text === 140) continue;
    for (const [name, sc, loc, js] of screens) {
      runs++;
      await p.evaluate(([dev, orient, theme, text, v, sc, loc, js]) => { TB.dev = dev; TB.orient = orient; TB.theme = theme; TB.text = text; TB.v = v; TB.ds = 'next'; VS[v] = makeVS(sc); V().toast = null; goLoc(loc); if (js) eval(js); render(); }, [dev, orient, theme, text, v, sc, loc, js]);
      await p.waitForTimeout(500);
      const r = await p.evaluate(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.map(v => v.id + ':' + v.nodes.filter(x => !x.target.join(' ').includes('dev-status')).map(x => x.target.join(' ')).slice(0, 2).join(',')).filter(x => !x.endsWith(':')));
      const o = await p.evaluate(() => { const d = document.querySelector('#device').getBoundingClientRect(); return [...document.querySelectorAll('#device .sheet-layer .pane *, #device .bk *, #device .info-sheet *, #device .pdialog *')].filter(e => !e.closest('[inert]') && e.getBoundingClientRect().width && e.getBoundingClientRect().right > d.right + 1).length; });
      if (r.length || o) { n++; console.log(`${dev}/${orient}/${theme}/${text}/v${v} ${name}`, r, o ? 'OVERFLOW ' + o : ''); }
    }
  }
  console.log('issues', n, 'of', runs); await b.close(); })();
