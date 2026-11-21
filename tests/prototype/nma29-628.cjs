// Assistance follow-up questions: NMA-29 (mobility needs and device type, on their own page, Profile and booking) and
// NMA-628 (service animal, Profile). Which questions appear, the fill-on-finish / unfilled-on-abandon rule, saving, AS.2 links.
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
  const row = () => p.locator(D_ + '.assist-mobrow').count().then(n => n > 0);
  const top = () => ev(() => sheet().stack.at(-1).s), par = () => ev(() => sheet().stack.at(-2).u.d);
  const card = async v => { await p.click(`${D_}.mobq__card label:has(input[value="${v}"])`); await w(200); };
  const next = async () => { await p.click(D_ + '[data-a="mob-next"]'); await w(500); };
  const qs = async () => ({ mob: await row(), dev: await has('dev'), sa: await has('sa'), task: await has('saTask'), size: await has('saSize') });
  const save = async () => { await p.click(D_ + '[data-a="assist-save"]'); await w(900); };
  const axe = async n => { const v = await ev(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.filter(x => x.nodes.some(n => !n.target.join(' ').includes('dev-status'))).map(x => x.id)); ok(!v.length, `axe ${n} ${v.join(',')}`); };

  // ---- Figma AS.2 / PA.2 design ----
  await open({ cat: 'disability' });
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="needs"]')].every(i => !i.disabled)), 'AS.2: other needs selectable before a disability is chosen');
  ok(await ev(() => ['About accessible seats', 'About station assistance', 'About service animals'].every(t => [...document.querySelectorAll('#device .assist-about')].some(a => a.innerText.trim() === t))), 'AS.2: About link under each other need');
  ok(/Large service animal/.test(await txt()) && !(await has('animal')), 'PA.2: Profile offers Large service animal, no size radios');
  await pick('dis', 'mobility'); ok(/About wheelchair space/.test(await txt()), 'PA.2: About wheelchair space link under the wheelchair question');
  await save(); ok(/Choose at least one disability|disability/.test(await txt()) && await ev(() => sheet().stack.at(-1).s) === 'assist-profile', 'a disability is still required to save');

  // ---- NMA-29: the questions open on their own page ----
  await open({ cat: 'station', needs: ['station'] }); let q = await qs();
  ok(!q.mob && !q.dev && !q.sa, 'NMA-29 AC1 / NMA-628 AC2: station assistance alone asks nothing');
  await open({ cat: 'station' }); await pick('needs', 'seat');
  ok(await top() === 'assist-mob' && !(await par()).needs.includes('seat'), 'NMA-29 AC2: checking Accessible seat opens the mobility questions; the box isn’t filled yet');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="mob"]')].map(i => i.type + i.value).join()) === 'radioamtrak,radioown,radioaid' && /Step 1 of 2/.test(await txt()) && /Amtrak trains accommodate most standard-sized wheeled mobility devices/.test(await txt()), 'NMA-29 AC2, BR2.1: Amtrak wheelchair, own collapsible or mobility aid, one only; Amtrak.com layout');
  ok(await ev(() => document.querySelector('#device [data-a="mob-next"]').getAttribute('aria-disabled')) === 'true', 'Next stays unavailable until an option is chosen');
  await axe('mobility questions');
  await p.click(D_ + '[data-a="back"]'); await w(500);
  ok(await top() === 'assist-profile' && !(await ev(() => sheet().stack.at(-1).u.d.needs.includes('seat'))) && !(await row()), 'abandoning returns with Accessible seat unfilled');
  ok(await ev(() => document.activeElement.matches('input[data-f="needs"][value="seat"]')), 'focus returns to Accessible seat');
  await pick('needs', 'seat'); await card('amtrak'); await next();
  ok(/Step 2 of 2/.test(await txt()) && await has('mobHelp') && !(await has('mobType')), 'NMA-29 BR2.2: Amtrak wheelchair asks whether help is needed (step 2)');
  await p.click(D_ + '[data-a="back"]'); await w(400);
  ok(await top() === 'assist-mob' && /Step 1 of 2/.test(await txt()) && await ev(() => document.querySelector('#device input[value="amtrak"]').checked), 'Back from step 2 returns to step 1 with the answer kept');
  await next(); await card('yes'); await next();
  ok(await top() === 'assist-profile' && (await ev(() => sheet().stack.at(-1).u.d.needs)).includes('seat') && /Amtrak wheelchair, help moving in it/.test(await txt()), 'finishing returns with Accessible seat filled and the answers shown');
  ok(/Accessible seat selected\. Mobility needs answered\./.test(await txt()), 'the change is announced');
  await p.click(D_ + '[data-a="assist-mob-open"]'); await w(500); await card('own'); await next();
  ok(await has('mobType') && !(await has('mobHelp')), 'NMA-29 BR2.2: own collapsible wheelchair asks its type');
  await card('power'); await next();
  ok(/Own collapsible wheelchair, power/.test(await txt()) && (await ev(() => sheet().stack.at(-1).u.d.mobHelp)) === '', 'Change updates the answers; the help answer is cleared');
  await open({ cat: 'station' }); await pick('needs', 'seat'); await card('aid');
  ok(!/Step 1 of/.test(await txt()) && await ev(() => document.querySelector('#device [data-a="mob-next"]').textContent) === 'Done', 'mobility aid: no follow-up, one step');
  await next(); ok(/Mobility aid/.test(await txt()), 'mobility aid saved to the form');
  await open({ cat: 'disability', dis: ['mobility'] }); await pick('wc', 'no');
  ok(await top() === 'assist-mob' && await has('mob'), 'NMA-29 AC2: reduced mobility with no wheelchair space opens the mobility questions');
  await p.click(D_ + '[data-a="back"]'); await w(500); ok((await ev(() => sheet().stack.at(-1).u.d.wc)) === '', 'abandoning leaves the wheelchair answer unfilled');
  await open({ cat: 'disability', dis: ['mobility', 'vision'] }); await pick('wc', 'yes');
  ok(await has('dev') && /Which mobility device will you sit in during travel\?/.test(await txt()) && /I travel with a scooter and I will sit in it during travel\./.test(await txt()), 'NMA-29 AC3, BR3.1: wheelchair space, no seat: device you’ll sit in (other disabilities don’t matter)');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="dev"]')].every(i => i.type === 'radio')), 'NMA-29 BR3.2: one device only');
  await card('manual'); await next(); ok((await ev(() => sheet().stack.at(-1).u.d.wc)) === 'yes' && /Manual wheelchair, you’ll sit in it during travel/.test(await txt()), 'finishing fills wheelchair space Yes');
  await pick('needs', 'seat');
  ok(await top() === 'assist-mob' && /Which mobility device will you bring\?/.test(await txt()) && /I travel with a power wheelchair\./.test(await txt()) && await ev(() => document.querySelector('#device input[value="manual"]').checked), 'NMA-29 AC4, BR4.2: adding a seat asks which device you’ll bring, prefilled');
  await next(); ok((await ev(() => sheet().stack.at(-1).u.d.needs)).includes('seat'), 'finishing fills Accessible seat');
  await open({ cat: 'station', needs: ['seat'] }); ok(/Not answered yet/.test(await txt()), 'an unanswered set shows Answer on the form');
  await save(); ok(/Answer the mobility questions\./.test(await txt()) && await top() === 'assist-profile', 'saving needs the mobility questions answered');

  // ---- NMA-29 in the booking flow (traveler details) ----
  await ev(() => { TB.v = 1; VS[1] = makeVS('returning'); goLoc('travelers'); }); await w(600);
  await p.click(D_ + '#ask-adult-1', { force: true }); await w(900);
  await pick('cat', 'disability'); await pick('dis', 'mobility'); await pick('wc', 'yes');
  ok(await top() === 'assist-mob' && /Traveler 1|Adult/.test(await txt()), 'booking: wheelchair space opens the device questions for the traveler');
  await p.click(D_ + '[data-a="back"]'); await w(500); ok(await top() === 'assist' && (await ev(() => sheet().stack.at(-1).u.d.wc)) === '', 'booking: abandoning leaves it unfilled');
  await pick('wc', 'yes'); await card('scooter'); await next();
  await p.click(D_ + '[data-a="assist-confirm"]'); await w(600);
  ok(await ev(() => assistRec(D().booking, 'adult-1').m.dev === 'scooter'), 'booking: the device answer is saved with the traveler’s assistance');

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
  // NMA-628 AC3: checking Large service animal opens its one question on its own page (no step counter)
  await open({ cat: 'disability', dis: ['vision'] }); await pick('needs', 'animal');
  ok(await top() === 'assist-mob' && !(await par()).needs.includes('animal') && /What skill or task does your animal provide\?/.test(await txt()) && /I travel with a service animal\./.test(await txt()) && !/Step \d of/.test(await txt()), 'NMA-628 AC3: Large service animal opens the skill or task question, one step, no counter');
  ok(await ev(() => document.querySelector('#mobq-satask').placeholder) === 'Enter the skill or task your animal provides…' && await ev(() => document.querySelector('#device [data-a="mob-next"]').getAttribute('aria-disabled')) === 'true', 'NMA-628 AC3: the answer is mandatory before Done');
  await axe('large animal question');
  await p.click(D_ + '[data-a="back"]'); await w(500);
  ok(await top() === 'assist-profile' && !(await ev(() => sheet().stack.at(-1).u.d.needs.includes('animal'))) && await ev(() => document.activeElement.matches('input[data-f="needs"][value="animal"]')), 'abandoning leaves Large service animal unchecked, focus back on it');
  await pick('needs', 'animal'); await p.fill(D_ + '#mobq-satask', 'Guiding'); await w(250);
  ok(await ev(() => document.activeElement.id) === 'mobq-satask' && await ev(() => document.querySelector('#device [data-a="mob-next"]').getAttribute('aria-disabled')) === null, 'typing keeps focus and enables Done');
  await p.click(D_ + '[data-a="mob-next"]'); await w(500);
  ok(await top() === 'assist-profile' && (await ev(() => sheet().stack.at(-1).u.d.needs)).includes('animal') && /Guiding/.test(await txt()), 'finishing returns with Large service animal checked and the task shown');
  await save();
  ok(await ev(() => { const a = D().assist; return a.animal === 'large' && a.saTask === 'Guiding' && !a.sa && !a.saSize; }), 'NMA-628 AC3: saved as a large service animal with its skill or task');
  await open({ cat: 'disability', dis: ['vision'], needs: ['animal'] }); await save();
  ok(/Tell us the skill or task your service animal provides\./.test(await txt()), 'an unanswered large service animal blocks saving');
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
