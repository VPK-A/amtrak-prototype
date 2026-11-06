// Pass Rider traveler selection (proposal for team review): each named rider is a checkbox, selected or not, so a
// rider can't be added twice; Companions keep their counter; selections and counts survive navigation; the reviewer
// control switches back to the current counters.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  await p.addScriptTag({ content: AXE });
  const w = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), D_ = '#device ';
  const pax = () => ev(() => JSON.parse(JSON.stringify(D().booking.prPax)));
  const open = (th = 'light') => ev(th => { TB.v = 1; TB.dev = 'iphone'; TB.theme = th; PRSEL.v = 'check'; VS[1] = makeVS('passrider'); const b = D().booking; b.intent = 'pr'; b.prType = 'leisure'; b.from = 'NYP'; b.to = 'WAS'; goLoc('travelers'); }, th).then(() => w(600));
  const tick = async k => { await p.click(`${D_}label[for="prr-${k}"]`); await w(250); };
  const axe = async n => { const v = await ev(async () => (await axe.run('#device .psheet', { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length)); ok(!v.length, `axe ${n} (${v})`); };

  await open();
  const names = await ev(() => [...document.querySelectorAll('#device .ffc-rider .ads-choice__label > span:first-child')].map(e => e.textContent));
  ok(names.join() === 'Alex Rivera,Jordan Rivera,Maya Rivera,Sam Rivera', `each eligible rider by name (${names})`);
  ok(await p.locator(D_ + '.ffc-riders input[type="checkbox"]').count() === 4 && await p.locator(D_ + '[data-a="pax"][data-g="prp"], ' + D_ + '[data-a="pax"][data-g="prme"]').count() === 0, 'named riders are checkboxes, no 0–1 counters');
  ok(await p.locator(D_ + '.ffc-riders legend').innerText() === 'People on your pass', 'grouped under “People on your pass”');
  ok(await p.locator(D_ + '[data-a="pax"][data-g="pr"][data-k="comp"]').count() === 2, 'Companions keep the counter');
  // select and deselect once; no duplicates
  await tick('jordan'); await tick('maya');
  ok(JSON.stringify((await pax()).people) === '{"jordan":1,"maya":1}', 'selecting adds each rider once');
  await tick('maya'); await tick('maya');
  ok((await pax()).people.maya === 1 && Object.keys((await pax()).people).length === 2 && await ev(() => travelerList(D().booking).filter(t => t.key === 'pr-maya').length) === 1, 'toggling again can’t duplicate a rider');
  await tick('jordan'); ok(!(await pax()).people.jordan, 'deselecting removes the rider');
  await tick('me'); ok((await pax()).me === false, 'the signed-in traveler can be cleared too');
  await tick('me'); await tick('jordan');
  // companion counter still works
  await p.click(D_ + '[data-a="pax"][data-g="pr"][data-k="comp"][data-d="1"]'); await w(250);
  await p.click(D_ + '[data-a="pax"][data-g="pr"][data-k="comp"][data-d="1"]'); await w(250);
  ok((await pax()).comp === 2 && /Companions travel with you/.test(await ev(() => document.querySelector('#device').innerText)), 'companion counter adds');
  await p.click(D_ + '[data-a="pax"][data-g="pr"][data-k="comp"][data-d="-1"]'); await w(250);
  ok((await pax()).comp === 1, 'companion counter removes');
  // the 8-traveler limit disables unselected riders
  await ev(() => { D().booking.prPax.comp = 5; render(); }); await w(250);
  ok(await p.locator(D_ + '#prr-sam:disabled').count() === 1 && await p.locator(D_ + '#prr-jordan:disabled').count() === 0, 'at the limit: unselected riders disabled, selected can still be cleared');
  await ev(() => { D().booking.prPax.comp = 1; render(); }); await w(250);
  await axe('light');
  // kept when navigating
  await p.click(D_ + '[data-a="pick-travelers-done"]'); await w(600);
  const ff = await ev(() => document.querySelector('#device #ff-trav').innerText);
  ok(/Alex Rivera, Jordan Rivera, Maya Rivera, 1 companion/.test(ff), `Fare Finder summary (${ff.split('\n')[0]})`);
  await p.click(D_ + '#ff-trav'); await w(700);
  ok(await ev(() => ['me', 'jordan', 'maya', 'sam'].map(k => document.querySelector('#device #prr-' + k).checked).join()) === 'true,true,true,false' && await ev(() => document.querySelector('#device .ffc-count .ads-counter__value').textContent) === '1', 'reopening keeps selections and the companion count');
  // reviewer control: back to counters, same state
  await ev(() => { const s = document.getElementById('tbCmpPrSel'); s.value = 'counter'; s.dispatchEvent(new Event('change')); }); await w(400);
  ok(await p.locator(D_ + '.ffc-riders').count() === 0 && await p.locator(D_ + '[data-a="pax"][data-g="prp"][data-k="jordan"]').count() === 2 && (await pax()).people.jordan === 1, 'Prototype controls switch to the current counters with the same selection');
  await ev(() => { const s = document.getElementById('tbCmpPrSel'); s.value = 'check'; s.dispatchEvent(new Event('change')); }); await w(300);
  await open('dark'); await axe('dark');
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
