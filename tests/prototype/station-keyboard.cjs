// Station search on iPhone: the iOS keyboard (Figma 4735:235119) rises while search is active, in two layouts
// (Prototype controls › Station search layout): A, From / To above search (card folds, field glides up); B, search
// above From / To (field stays, card folds beneath). Tap outside, the X or Return ends search and the card returns.
const { chromium } = require('playwright');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 450) => p.waitForTimeout(ms), D = '#device ';
  const kb = () => ev(() => !!document.querySelector('#device .ss-kbwrap.is-kb'));
  const top = s => ev(s => Math.round(document.querySelector(s).getBoundingClientRect().top), s);
  const cardH = () => ev(() => Math.round(document.querySelector('#device .ss-collapse').getBoundingClientRect().height));
  ok(await ev(() => [...document.querySelectorAll('#tbSsl option')].map(o => o.value).join()) === 'a,b', 'Prototype controls offer layouts A and B');
  for (const lay of ['a', 'b']) {
    await ev(l => { TB.v = 1; TB.dev = 'iphone'; TB.ssl = l; VS[1] = makeVS('returning'); goLoc('stations:from'); }, lay); await w(800);
    const order = await ev(() => { const s = document.querySelector('#device .ss-search'), c = document.querySelector('#device .ss-collapse'); return s.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING ? 'search-first' : 'card-first'; });
    ok(order === (lay === 'a' ? 'card-first' : 'search-first'), `${lay}: ${lay === 'a' ? 'From / To above search' : 'search above From / To'}`);
    ok(!(await kb()) && await cardH() > 100, `${lay}: at rest, no keyboard and the card shows`);
    const y0 = await top(D + '#ss-q');
    await p.click(D + '#ss-q'); await w();
    ok(await kb() && await ev(() => document.activeElement.id === 'ss-q'), `${lay}: tapping search raises the keyboard, the field keeps focus`);
    ok(await cardH() === 0 && await ev(() => document.querySelector('#device .ss-collapse').hasAttribute('inert')), `${lay}: the From / To card is hidden (and inert) while searching`);
    const y1 = await top(D + '#ss-q');
    ok(lay === 'a' ? y1 < y0 - 100 : y1 === y0, `${lay}: ${lay === 'a' ? 'the field moves up into the card’s place' : 'the field stays in place'}`);
    ok(await ev(() => { const k = document.querySelector('#device .ios-kb'), d = document.querySelector('#device').getBoundingClientRect(), r = k.getBoundingClientRect(); return Math.abs(r.bottom - d.bottom) < 2 && k.getAttribute('aria-hidden') === 'true'; }), `${lay}: keyboard sits at the bottom of the screen, hidden from assistive tech`);
    for (const k of ['P', 'E', 'N', 'N']) await p.click(`${D}[data-kb="${k}"]`);
    await w(200); ok(await ev(() => document.querySelector('#ss-q').value) === 'Penn' && /Penn Station|New York/.test(await ev(() => document.querySelector('#device').innerText)), `${lay}: keys type into search (first letter capitalised) and results update`);
    await p.click(D + '[data-kb="del"]'); await w(150); ok(await ev(() => document.querySelector('#ss-q').value) === 'Pen', `${lay}: delete removes a letter`);
    await p.click(D + '.ss-head__title', { force: true }); await w();
    ok(!(await kb()) && await cardH() > 100 && await top(D + '#ss-q') === y0, `${lay}: tapping outside drops the keyboard and the card returns`);
    await p.click(D + '#ss-q'); await w(); await p.click(D + '[data-a="ss-clear"]'); await w();
    ok(!(await kb()) && await ev(() => document.querySelector('#ss-q').value) === '' && await cardH() > 100, `${lay}: the X clears search, drops the keyboard and brings the card back`);
    await p.click(D + '#ss-q'); await w(); ok(await kb(), `${lay}: tapping the focused field again raises the keyboard`);
    await p.click(D + '[data-kb="ret"]'); await w(); ok(!(await kb()), `${lay}: Return ends search`);
  }
  await ev(() => { TB.dev = 'ipad'; VS[1] = makeVS('returning'); goLoc('stations:from'); }); await w(800);
  ok(await p.locator(D + '.ios-kb').count() === 0, 'iPad: no simulated keyboard');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
