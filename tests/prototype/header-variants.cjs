// Header design exploration: the Prototype controls toggle, each variant in light and dark (axe), and unchanged actions.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) { f++; console.log('FAIL ' + m); } };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1000 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ content: AXE });
  await p.evaluate(() => { document.body.classList.remove('chrome-hidden'); document.getElementById('protoCtl').hidden = false; });
  const w = ms => p.waitForTimeout(ms);
  for (const th of ['light', 'dark']) for (let v = 0; v <= 6; v++) {
    await p.evaluate(th => { TB.theme = th; VS[1] = makeVS('returning'); goLoc('tab:book'); render(); }, th);
    await p.click(`#tbHx button[data-v="${v}"]`); await w(200);
    ok(await p.evaluate(v => TB.hx === v && document.querySelector('#device').classList.contains('hx-' + v) && document.querySelector(`#tbHx [data-v="${v}"]`).getAttribute('aria-pressed') === 'true', v), `toggle ${v}`);
    let ax = await p.evaluate(async () => (await axe.run('#device .app', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes[0].html.slice(0, 80)));
    ok(!ax.length, `axe app ${th} ${v} ${ax}`);
    // Book: with a variant, the New booking search is inside the header (one component); other tabs hide it
    const sb = await p.evaluate(() => { const q = s => document.querySelectorAll('#device ' + s).length; const r = { inHeader: q('.ads-appheader [data-a="open-booking"]'), inPage: q('.app-main [data-a="open-booking"]') }; goLoc('tab:trips'); render(); r.trips = q('[data-a="open-booking"]'); goLoc('tab:book'); render(); return r; });
    ok(v ? sb.inHeader === 1 && sb.inPage === 0 && sb.trips === 0 : sb.inHeader === 0 && sb.inPage === 1, `search placement ${v} ${JSON.stringify(sb)}`);
    await p.click('#device [data-a="open-account"]'); await w(500);
    ok(await p.evaluate(() => !!sheet() && sheet().stack[0].s === 'account'), `account opens ${v}`);
    await p.evaluate(() => { goLoc('tab:book'); render(); }); await w(200);
    await p.click('#device [data-a="open-inbox"]'); await w(400);
    ok(await p.evaluate(() => !!sheet() && sheet().stack[0].s === 'inbox'), `inbox opens ${v}`);
    await p.evaluate(() => { goLoc('tab:book'); render(); }); await w(200);
    await p.click('#device [data-a="open-booking"]'); await w(600);
    ax = await p.evaluate(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes[0].html.slice(0, 80)));
    ok(!ax.length, `axe modal ${th} ${v} ${ax}`);
    ok(await p.evaluate(() => document.activeElement && /New booking/.test(document.querySelector('#device .ads-sheet-header__title').textContent)), `title ${v}`);
    // exit rule unchanged: with a cart item, close asks to abandon; without, it closes
    await p.click('#device .ads-sheet-header__close'); await w(500);
    ok(await p.evaluate(() => !sheet() && !nav().dialog), `close without cart closes ${v}`);
  }
  await p.reload(); await p.waitForFunction(() => typeof TB !== 'undefined');
  ok(await p.evaluate(() => TB.hx) === 6, 'choice persists across reload');
  ok(!errs.length, 'errors ' + errs);
  console.log(`${n - f}/${n} passed`); await br.close();
})();
