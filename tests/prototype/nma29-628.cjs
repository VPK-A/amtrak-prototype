// Profile assistance follow-up questions: NMA-29 (mobility needs and device type) and NMA-628 (service animal).
// Checks which questions each combination of answers shows, that they're required, that they save, and the AS.2 design links.
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.addScriptTag({ content: AXE });
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 300) => p.waitForTimeout(ms), D_ = '#device ';
  const txt = () => ev(() => document.querySelector('#device').innerText);
  const open = async (d, sc = 'returning') => { await ev(([d, sc]) => { TB.v = 1; TB.dev = 'iphone'; TB.theme = 'light'; VS[1] = makeVS(sc); goLoc('assist-profile'); if (d) { const r = sheet().stack.at(-1); r.u.d = Object.assign({ cat: '', dis: [], wc: '', needs: [], for: '' }, d); render(); } }, [d, sc]); await w(); };
  const pick = async (name, v) => { await p.click(`${D_}label:has(input[name$="-${name}"][value="${v}"])`); await w(250); };
  const has = f => p.locator(`${D_}[data-f="${f}"]`).count().then(n => n > 0);
  const qs = async () => ({ mob: await has('mob'), dev: await has('dev'), sa: await has('sa'), task: await has('saTask'), size: await has('saSize') });
  const save = async () => { await p.click(D_ + '[data-a="assist-save"]'); await w(900); };
  const axe = async n => { const v = await ev(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.filter(x => x.nodes.some(n => !n.target.join(' ').includes('dev-status'))).map(x => x.id)); ok(!v.length, `axe ${n} ${v.join(',')}`); };

  // ---- Figma AS.2 / PA.2 design ----
  await open({ cat: 'disability' });
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="needs"]')].every(i => !i.disabled)), 'AS.2: other needs selectable before a disability is chosen');
  ok(await ev(() => ['About accessible seats', 'About station assistance', 'About service animals'].every(t => [...document.querySelectorAll('#device .assist-about')].some(a => a.innerText.trim() === t))), 'AS.2: About link under each other need');
  ok(/Large service animal/.test(await txt()) && !(await has('animal')), 'PA.2: Profile offers Large service animal, no size radios');
  await pick('dis', 'mobility'); ok(/About wheelchair space/.test(await txt()), 'PA.2: About wheelchair space link under the wheelchair question');
  await save(); ok(/Choose at least one disability|disability/.test(await txt()) && await ev(() => sheet().stack.at(-1).s) === 'assist-profile', 'a disability is still required to save');

  // ---- NMA-29 ----
  await open({ cat: 'station', needs: ['station'] }); let q = await qs();
  ok(!q.mob && !q.dev && !q.sa, 'NMA-29 AC1 / NMA-628 AC2: station assistance alone asks nothing');
  await open({ cat: 'station', needs: ['seat'] }); q = await qs();
  ok(q.mob && !q.dev, 'NMA-29 AC2: accessible seat asks mobility needs');
  await open({ cat: 'disability', dis: ['mobility'], wc: 'no' }); q = await qs();
  ok(q.mob && !q.dev, 'NMA-29 AC2: reduced mobility with no wheelchair space asks mobility needs');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="mob"]')].every(i => i.type === 'radio')), 'NMA-29 BR2.1: one mobility option only');
  await pick('mob', 'amtrak'); ok(await has('mobHelp') && !(await has('mobType')), 'NMA-29 BR2.2: Amtrak wheelchair asks whether help is needed');
  await pick('mob', 'own'); ok(await has('mobType') && !(await has('mobHelp')), 'NMA-29 BR2.2: own collapsible wheelchair asks its type');
  await pick('mob', 'aid'); ok(!(await has('mobType')) && !(await has('mobHelp')), 'mobility aid: no follow-up');
  await open({ cat: 'disability', dis: ['mobility', 'vision'], wc: 'yes' }); q = await qs();
  ok(q.dev && !q.mob && /sit in during travel/.test(await txt()), 'NMA-29 AC3: wheelchair space, no seat asks which device you’ll sit in (other disabilities don’t matter)');
  await open({ cat: 'disability', dis: ['mobility'], wc: 'yes', needs: ['seat'] }); q = await qs();
  ok(q.dev && !q.mob && /Which mobility device will you bring\?/.test(await txt()), 'NMA-29 AC4: wheelchair space and a seat asks which device you’ll bring');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="dev"]')].every(i => i.type === 'radio')), 'NMA-29 AC3/4: one device only');

  // ---- NMA-628 ----
  await open({ cat: 'disability', dis: ['hearing'] }); q = await qs();
  ok(q.sa && !q.task && !q.size, 'NMA-628 AC1: a disability without a large service animal asks about a service animal');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="sa"]')].map(i => i.value).join()) === 'no,yes', 'NMA-628 BR1.1: don’t have / travel with');
  await save(); ok(/Tell us whether you travel with a service animal\./.test(await txt()), 'NMA-628 BR1.1: answer required');
  await pick('sa', 'yes'); q = await qs(); ok(q.task && q.size && await ev(() => [...document.querySelectorAll('#device input[data-f="saSize"]')].map(i => i.value).join()) === 'small,medium', 'NMA-628 BR1.2: training and size (Small, Medium)');
  await save(); ok(/Tell us what your service animal is trained to do\./.test(await txt()) && /Choose the size of your service animal\./.test(await txt()), 'NMA-628 BR1.2: both required');
  await axe('service animal errors');
  await p.fill(D_ + 'input[data-f="saTask"]', 'Alerts me to sounds'); await pick('saSize', 'medium'); await save();
  ok(await ev(() => { const a = D().assist; return a.sa === 'yes' && a.saSize === 'medium' && a.saTask === 'Alerts me to sounds'; }), 'NMA-628: answers saved to the profile');
  await open({ cat: 'station', needs: ['station', 'seat'] }); q = await qs();
  ok(q.sa && q.mob, 'NMA-628 AC1: station assistance and an accessible seat asks about a service animal');
  await open({ cat: 'station', needs: ['seat'] }); ok((await qs()).sa, 'station type with a seat: service animal asked');
  await open({ cat: 'disability', dis: ['vision'], needs: ['animal'] }); q = await qs();
  ok(!q.sa && q.task && !q.size && /large service animal trained to do/.test(await txt()), 'NMA-628 AC3: large service animal asks only what it’s trained to do');
  await save(); ok(/Tell us what your service animal is trained to do\./.test(await txt()), 'NMA-628 AC3: training is mandatory');
  await p.fill(D_ + 'input[data-f="saTask"]', 'Guiding'); await p.locator(D_ + 'input[data-f="saTask"]').dispatchEvent('change'); await save();
  ok(await ev(() => { const a = D().assist; return a.animal === 'large' && a.saTask === 'Guiding' && !a.sa && !a.saSize; }), 'NMA-628 AC3: saved as a large service animal with its training');
  await axe('large animal');

  // ---- combined, cleanup and summary ----
  await open({ cat: 'disability', dis: ['mobility'], wc: 'yes', needs: ['seat'], dev: 'power', sa: 'yes', saTask: 'Retrieves items', saSize: 'small' }); await save();
  ok(await ev(() => { const a = D().assist; return a.dev === 'power' && a.sa === 'yes' && a.saSize === 'small' && !a.mob; }), 'both stories in one questionnaire save together');
  await open({ cat: 'station', needs: ['station'], mob: 'aid', sa: 'yes', saTask: 'x', saSize: 'small' }); await save();
  ok(await ev(() => { const a = D().assist; return !a.mob && !a.sa && !a.saTask && !a.saSize; }), 'answers to questions that no longer apply aren’t saved');
  await ev(() => { TB.v = 1; VS[1] = makeVS('assist'); goLoc('profile'); }); await w();
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
