// Traveler selection: Youth, Child and Infant under a collapsible "Children and infants" row (both concepts)
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const vis = sel => p.locator(D_ + sel).first().isVisible().catch(() => false);
  for (const v of [1]) for (const dev of ['iphone', 'ipad']) for (const th of ['light', 'dark']) {
    const T = `C${v} ${dev} ${th}`;
    await ev(([v, dev, th]) => { TB.v = v; TB.dev = dev; TB.theme = th; VS[v] = makeVS('returning'); goLoc('ff'); }, [v, dev, th]); await w(300);
    await p.locator(D_ + '[data-a="pick-travelers"]').click(); await w(400);
    const head = p.locator(D_ + '#ffc-kids-h');
    ok(await vis('[data-a="pax"][data-k="adult"]') && await vis('[data-a="pax"][data-k="senior"]') && await vis('[data-a="pax"][data-k="ya"]'), `${T} Adult, Senior and Young adult visible`);
    ok(await head.count() === 1 && await head.getAttribute('aria-expanded') === 'false' && await p.locator(D_ + '#ffc-kids-h .ads-icon--chevron-down').count() === 1 && /Children & infants/.test(await head.innerText()), `${T} "Children & infants" row (Figma) with a chevron, collapsed`);
    ok(!(await vis('[data-a="pax"][data-k="youth"]')) && !(await vis('[data-a="pax"][data-k="child"]')) && !(await vis('[data-a="pax"][data-k="infant"]')), `${T} Youth, Child and Infant hidden by default`);
    const bb = await head.boundingBox(); ok(bb && bb.height >= 40, `${T} whole header is the tap target`);
    await head.click(); await w(250);
    ok(await head.getAttribute('aria-expanded') === 'true' && await vis('[data-a="pax"][data-k="youth"]') && await vis('[data-a="pax"][data-k="infant"]'), `${T} tapping reveals the three rows`);
    const t = await ev(() => document.querySelector('#device #ffc-kids-rows').innerText);
    ok(/Ages 13-15/.test(t) && /Ages 2-12/.test(t) && /Under 2/.test(t) && await p.locator(D_ + '#ffc-kids-rows [data-a="youth-alone"]').count() === 1, `${T} ages and "Traveling alone?" kept`);
    await p.locator(D_ + '[data-a="pax"][data-k="child"][data-d="1"]').click(); await w(150); await p.locator(D_ + '[data-a="pax"][data-k="infant"][data-d="1"]').click(); await w(150);
    const pax = await ev(() => JSON.stringify(D().booking.pax));
    ok(await ev(() => document.activeElement && document.activeElement.dataset.k) === 'infant', `${T} focus stays on the counter`);
    await head.click(); await w(250);
    ok(await head.getAttribute('aria-expanded') === 'false' && !(await vis('[data-a="pax"][data-k="child"]')) && /1 child, 1 infant/.test(await head.innerText()), `${T} collapsing hides the rows; header says "1 child, 1 infant"`);
    ok(await ev(() => JSON.stringify(D().booking.pax)) === pax && await ev(() => document.activeElement.id) === 'ffc-kids-h', `${T} toggling keeps counts and focus on the header`);
    await head.click(); await head.click(); await w(200); ok(await ev(() => JSON.stringify(D().booking.pax)) === pax, `${T} repeated toggling never changes counts`);
    ok(await ev(() => D().booking.pax.child === 1 && D().booking.pax.infant === 1) && /Traveler 3 · Infant/.test(await ev(() => document.querySelector('#device').innerText)), `${T} Traveler details lists the child and infant`);
    await p.locator(D_ + '[data-a="pick-travelers-done"]').click(); await w(400);
    ok(!(await ev(() => sheet().stack.some(r => r.s === 'travelers'))) && /1 child/.test(await ev(() => document.querySelector('#device #ff-trav').innerText)), `${T} Done returns with the counts`);
    await p.locator(D_ + '[data-a="pick-travelers"]').click(); await w(400);
    ok(await p.locator(D_ + '#ffc-kids-h').getAttribute('aria-expanded') === 'false' && /1 child, 1 infant/.test(await p.locator(D_ + '#ffc-kids-h').innerText()), `${T} reopening starts collapsed with the summary`);
    ok(await ev(() => !!document.querySelector('#device #ffc-kids-h').closest('.ffc-counts')), `${T} header sits in the same counter list`);
    await p.keyboard.press('Escape'); await w(200);
  }
  ok(!errs.length, 'no page errors ' + errs.join('|'));
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
