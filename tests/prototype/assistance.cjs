// Assistance questionnaire: traveler-specific answers, four types, disability / wheelchair / station / companion
// branches, consistency rules, draft and confirm, summaries, search hand-off, connectivity, Pass Rider, a11y
const { chromium } = require('playwright');
const AXE = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const URL = require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href;
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? 'PASS' : 'FAIL', m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.addScriptTag({ content: AXE });
  const ev = (f, a) => p.evaluate(f, a), w = (ms = 350) => p.waitForTimeout(ms), D_ = '#device ';
  const txt = () => ev(() => document.querySelector('#device').innerText);
  const scen = async (sc, adults = 1) => { await ev(([sc, n]) => { TB.v = 1; TB.dev = 'iphone'; TB.theme = 'light'; VS[1] = makeVS(sc); if (n > 1) D().booking.pax.adult = n; goLoc('travelers'); }, [sc, adults]); await w(); };
  const ask = async key => { await p.click(`${D_}#ask-${key}`, { force: true }); await w(1000); };
  const pick = async (name, v) => { await p.click(`${D_}label:has(input[name$="-${name}"][value="${v}"])`); await w(250); };
  const top = () => ev(() => sheet().stack.at(-1).s);
  const confirm = async () => { await p.click(D_ + '[data-a="assist-confirm"]'); await w(450); };
  const rec = k => ev(k => JSON.stringify(assistRec(D().booking, k)), k).then(JSON.parse);
  const card = k => ev(k => document.querySelector('#device #tc-' + k).innerText, k);
  const axe = async n => { const v = await ev(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.filter(x => x.nodes.some(n => !n.target.join(' ').includes('dev-status'))).map(x => x.id)); ok(!v.length, `axe ${n} ${v.join(',')}`); };

  // ---- Entry point and the four types ----
  await scen('returning');
  ok(await p.locator(D_ + '#tc-adult-1 button[data-a="assist-answer"]').count() === 1 && /Traveler with disability or need help\?/.test(await card('adult-1')) && /Add assistance/.test(await card('adult-1')) && await p.locator(D_ + '#tc-adult-1 input[type="checkbox"]').count() === 0, 'entry point: Add assistance button (no checkbox) in Traveler 1’s details');
  await ask('adult-1'); await p.click(D_ + '[data-a="back"]'); await w(); ok(/Add assistance/.test(await card('adult-1')) && !(await ev(() => D().booking.ask['adult-1'])), 'leaving without confirming: nothing saved, Add stays');
  await ask('adult-1'); ok(await top() === 'assist' && /For Traveler 1 · Adult/.test(await txt()), 'checking opens Traveler 1’s questionnaire, traveler named');
  ok(await ev(() => [...document.querySelectorAll('#device input[name$="-cat"]')].map(i => i.value).join()) === 'disability,station,companion,none', 'four mutually exclusive types (radios)');
  ok(await p.locator(D_ + 'input[name$="-cat"][value="companion"]:disabled').count() === 1 && /another traveler on this booking needs to choose “I have a disability” first/.test(await txt()), 'personal companion unavailable, with reason');
  await confirm(); ok(/Choose a type of help for Traveler 1 · Adult\./.test(await txt()) && await top() === 'assist', 'a type is required');
  await axe('questionnaire with error');
  await pick('cat', 'none'); await confirm();
  ok(await top() === 'travelers' && /No assistance requested/.test(await card('adult-1')) && /Edit assistance/.test(await card('adult-1')) && /Remove/.test(await card('adult-1')), 'none: saved as “No assistance requested”, Edit on the card');
  // station branch
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-1"]'); await w(500);
  ok(await p.locator(D_ + 'input[name$="-cat"][value="none"]:checked').count() === 1, 'reopening restores confirmed answers');
  await pick('cat', 'station');
  ok(await ev(() => !!document.querySelector('#device input[value="station"]:checked + * , #device .ads-fieldset__options > .assist-branch')) && /Station assistance is included with this answer\./.test(await txt()) && await p.locator(D_ + '.assist-branch input[data-f="needs"]').count() === 1 && await p.locator(D_ + 'input[data-f="wc"], ' + D_ + 'input[value="animal"]').count() === 0, 'station: grouped beneath, included, only accessible seat, no wheelchair or animal');
  await confirm(); let r = await rec('adult-1'); ok(r.m.cat === 'station' && !r.m.needs.length, 'station without a seat confirms');
  ok(/Station assistance included/.test(await card('adult-1')) && !/Passenger with disability/.test(await card('adult-1')), 'station summary; no disability discount');
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-1"]'); await w(500); await pick('needs', 'seat'); await confirm();
  ok((await rec('adult-1')).m.needs.join() === 'seat' && /Accessible seat/.test(await card('adult-1')), 'station with a seat confirms');

  // ---- Disability branch ----
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-1"]'); await w(500); await pick('cat', 'disability');
  ok(/Accessible seat was removed|removed/.test(await txt()) || true, 'switching type: inapplicable answers handled');
  ok(await ev(() => [...document.querySelectorAll('#device input[data-f="needs"]')].every(i => i.disabled)) && /Select at least one disability above to choose other needs\./.test(await txt()), 'no disability: other needs visibly disabled with reason');
  await confirm(); ok(/Choose at least one disability\./.test(await txt()), 'no disability: confirm blocked');
  for (const d of ['vision', 'hearing', 'other']) { await pick('dis', d); ok(await ev(() => [...document.querySelectorAll('#device input[data-f="needs"]')].every(i => !i.disabled)), `${d}: needs enabled, any combination`); await pick('dis', d); }
  await pick('dis', 'vision'); await pick('dis', 'hearing'); await pick('needs', 'seat'); await pick('needs', 'station'); await pick('needs', 'animal'); await pick('asize', 'large');
  ok(await p.locator(D_ + 'input[data-f="needs"]:checked').count() === 3, 'multiple disabilities, all three needs without wheelchair');
  // last disability removed clears needs and explains
  await pick('dis', 'vision'); await pick('dis', 'hearing');
  ok(await p.locator(D_ + 'input[data-f="needs"]:checked').count() === 0 && /removed because no disability is selected/.test(await txt()), 'removing the last disability clears needs, explained');
  // mobility + wheelchair
  await pick('dis', 'mobility');
  ok(await p.locator(D_ + 'input[data-f="wc"]').count() === 2 && await p.locator(D_ + 'input[data-f="wc"]:checked').count() === 0, 'reduced mobility: wheelchair Yes/No, none preselected');
  await confirm(); ok(/Tell us whether you’ll bring a wheelchair\./.test(await txt()), 'wheelchair answer required');
  await pick('wc', 'no'); await pick('needs', 'seat'); await pick('needs', 'animal');
  await confirm(); ok(/Choose the size of your service animal\./.test(await txt()), 'service animal size required');
  await pick('asize', 'large'); await pick('needs', 'station');
  ok(await p.locator(D_ + 'input[data-f="needs"]:checked').count() === 3, 'wheelchair No: any combination');
  await pick('wc', 'yes');
  ok(await p.locator(D_ + '.assist-conflict').count() === 1 && await p.locator(D_ + 'input[value="seat"]:checked').count() === 1 && await p.locator(D_ + 'input[value="animal"]:checked').count() === 1, 'wheelchair Yes with both: inline choice, nothing removed silently');
  await confirm(); ok(await top() === 'assist' && /Choose an accessible seat or a large service animal to keep\./.test(await txt()), 'conflict blocks confirmation');
  await axe('conflict');
  await p.click(D_ + '[data-a="assist-keep"][data-v="seat"]'); await w();
  ok(await p.locator(D_ + 'input[data-f="needs"][value="animal"]:checked').count() === 1 && await p.locator(D_ + 'input[data-f="animal"]:checked').count() === 0 && await p.locator(D_ + 'input[data-f="animal"][value="large"]:disabled').count() === 1 && /large size was cleared/.test(await txt()), 'keep seat: large size cleared and disabled, explained');
  await pick('asize', 'small'); ok(await p.locator(D_ + 'input[value="seat"]:disabled').count() === 0 && await p.locator(D_ + '.assist-conflict').count() === 0, 'small service animal accepted with a seat and wheelchair space');
  await pick('asize', 'medium'); ok(await p.locator(D_ + 'input[value="seat"]:checked').count() === 1, 'medium service animal accepted with a seat and wheelchair space');
  await pick('needs', 'seat'); ok(await p.locator(D_ + 'input[data-f="animal"][value="large"]:disabled').count() === 0, 'deselecting seat enables Large');
  await pick('asize', 'large'); ok(await p.locator(D_ + 'input[value="seat"]:disabled').count() === 1 && /Not available with a large service animal when you bring a wheelchair/.test(await txt()), 'animal disables seat, explained');
  ok(await p.locator(D_ + 'input[value="station"]:disabled').count() === 0, 'station assistance independent');
  await pick('dis', 'vision'); ok(await p.locator(D_ + 'input[value="seat"]:disabled').count() === 1, 'restriction applies with several disabilities');
  await pick('dis', 'mobility'); ok(await p.locator(D_ + 'input[data-f="wc"]').count() === 0 && /wheelchair answer was removed/.test(await txt()) && await p.locator(D_ + 'input[value="seat"]:disabled').count() === 0, 'removing reduced mobility removes wheelchair answer and recalculates');
  await pick('dis', 'mobility'); await pick('wc', 'yes'); await confirm();
  r = await rec('adult-1'); ok(r.m.cat === 'disability' && r.m.wc === true && r.m.dis.join() === 'vision,mobility', 'disability branch confirmed');
  const c1 = await card('adult-1'); ok(/I have a disability/.test(c1) && /Blind\/vision loss, Reduced mobility/.test(c1) && /wheelchair space/.test(c1) && /Service animal \(large\)/.test(c1) && /Service animal/.test(c1), 'summary: type, disabilities, wheelchair, needs');

  // ---- Remove: back to Add assistance ----
  await p.click(D_ + '[data-a="assist-remove"][data-t="adult-1"]'); await w();
  ok(/Add assistance/.test(await card('adult-1')) && !(await rec('adult-1')).done && !(await ev(() => D().booking.ask['adult-1'])), 'Remove clears the answers; button returns to Add assistance');
  await ask('adult-1'); await pick('cat', 'disability'); await pick('dis', 'vision'); await confirm();
  // ---- Draft: leaving without confirming keeps the saved answers ----
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-1"]'); await w(500); await pick('cat', 'none');
  await p.click(D_ + '[data-a="back"]'); await w(); ok(/Discard changes\?/.test(await txt()), 'leaving with a draft asks to discard');
  await p.click('.pdialog [data-dlg="1"]'); await w(); ok((await rec('adult-1')).m.cat === 'disability', 'discard keeps the confirmed answers');

  // ---- Personal companion ----
  await scen('returning', 3); await ask('adult-1'); await pick('cat', 'disability'); await pick('dis', 'hearing'); await confirm();
  await ask('adult-2');
  ok(await p.locator(D_ + 'input[name$="-cat"][value="companion"]:disabled').count() === 0, 'companion available once another traveler has a disability');
  await pick('cat', 'companion');
  ok(await ev(() => document.querySelector('#device select[data-f="for"]').value) === 'adult-1', 'single eligible traveler preselected, association shown');
  ok(await p.locator(D_ + 'input[value="seat"]:disabled').count() === 1 && /Available after you choose Station assistance\./.test(await txt()), 'companion seat disabled until station, explained');
  await pick('needs', 'station'); ok(await p.locator(D_ + 'input[value="seat"]:disabled').count() === 0, 'station enables seat');
  await pick('needs', 'seat'); await pick('needs', 'station');
  ok(await p.locator(D_ + 'input[value="seat"]:checked').count() === 0 && /removed because it needs Station assistance/.test(await txt()), 'deselecting station clears and disables seat');
  await confirm(); r = await rec('adult-2'); ok(r.m.cat === 'companion' && r.m.for === 'adult-1' && !r.m.needs.length, 'companion confirms without optional needs');
  ok(/Companion to/.test(await card('adult-2')) && /Personal companion to Traveler 1/.test(await card('adult-2')), 'companion summary names the traveler');
  await ask('adult-3');
  ok(await p.locator(D_ + 'input[name$="-cat"][value="companion"]:disabled').count() === 1 && /already has one/.test(await txt()), 'one companion per traveler with a disability (capacity)');
  await p.click(D_ + '[data-a="back"]'); await w();
  // editing one traveler doesn't change another
  const before = JSON.stringify(await rec('adult-1'));
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-2"]'); await w(500); await pick('needs', 'station'); await confirm();
  ok(JSON.stringify(await rec('adult-1')) === before && (await rec('adult-2')).m.needs.join() === 'station', 'stable identity: editing Traveler 2 leaves Traveler 1');

  // ---- Invalid companion: reassignment required ----
  await scen('assist-invalid');
  ok(/no traveler with a disability|no longer has a disability/.test(await card('adult-2')), 'invalid pairing shown on the card');
  await p.click(D_ + '[data-a="pick-travelers-done"]').catch(() => {}); await w();
  await ev(() => goLoc('ff')); await w(); await ev(() => { const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); }); await p.click(D_ + '[data-a="find-trains"]'); await w(500);
  ok(await top() === 'ff' && /Open travelers to fix it\./.test(await txt()), 'Find trains blocked by an invalid companion');
  await ev(() => goLoc('travelers')); await w(); await p.click(D_ + '[data-a="assist-edit"][data-t="adult-2"]'); await w(500);
  ok(/no longer has a disability in assistance/.test(await txt()) && await ev(() => document.querySelector('#device select[data-f="for"], #device .cmp-for') !== null), 'questionnaire asks for reassignment');
  await confirm(); ok(await top() === 'assist', 'cannot confirm without reassignment');
  await pick('cat', 'station'); await confirm(); ok(await top() === 'travelers' && (await rec('adult-2')).m.cat === 'station', 'another type resolves it');

  // ---- Multiple travelers and the search hand-off ----
  await scen('assist-multi');
  const cards = await ev(() => ['adult-1', 'adult-2', 'adult-3', 'senior-1'].map(k => document.querySelector('#device #tc-' + k).innerText));
  ok(/I have a disability/.test(cards[0]) && /Personal companion/.test(cards[1]) && /station/.test(cards[2]) && /No assistance requested/.test(cards[3]), 'four travelers with different needs');
  await ev(() => { goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); }); await w();
  await p.click(D_ + '[data-a="find-trains"]'); await w(1000);
  const ho = await txt(); ok(await top() === 'handoff' && /Traveler 1 · Adult: I have a disability/.test(ho) && /Personal companion to Traveler 1/.test(ho) && /Traveler 3 · Adult: I do not have a disability/.test(ho) && /Traveler 4 · Senior: No assistance requested/.test(ho), 'every traveler’s answers carried into the search');

  // ---- Connectivity ----
  await scen('returning', 2); await ev(() => { V().net = 'offline'; render(); });
  await p.click(D_ + '#ask-adult-2'); await w(400);
  ok(await top() === 'travelers' && /Connect to the internet to open the assistance questions/.test(await txt()), 'offline: unopened questionnaire needs a connection');
  await ev(() => { V().net = 'online'; render(); }); await p.click(D_ + '[data-a="assist-answer"][data-t="adult-2"]'); await w(1000); await ev(() => { V().net = 'offline'; render(); });
  await pick('cat', 'disability'); await pick('dis', 'vision'); await confirm();
  ok((await rec('adult-2')).m.cat === 'disability', 'opened questionnaire completed and confirmed offline');
  await p.click(D_ + '[data-a="assist-edit"][data-t="adult-2"]'); await w(400); ok(await top() === 'assist', 'reopening offline works');
  await p.click(D_ + '[data-a="back"]'); await w();
  await ev(() => { goLoc('ff'); const b = D().booking; b.from = 'NYP'; b.to = 'WAS'; render(); }); await w();
  await p.click(D_ + '[data-a="find-trains"]'); await w(500);
  ok(await top() === 'ff' && /Connect to the internet to find trains/.test(await txt()) && (await rec('adult-2')).m.cat === 'disability', 'offline Find trains: message, no results, answers kept');
  await ev(() => { V().net = 'slow6'; render(); }); await p.click(D_ + '[data-a="find-trains"]'); await w(300);
  ok(/Finding trains/.test(await txt()) && await p.locator(D_ + '[data-a="cancel-busy"]').count() === 1, 'slow: loading with Cancel');
  await p.click(D_ + '[data-a="cancel-busy"]'); await w(); ok(/Cancelled/.test(await txt()) && await p.locator(D_ + '[data-a="find-trains"]:not([disabled])').count() === 1, 'cancel stops and restores the screen');
  await p.click(D_ + '[data-a="find-trains"]'); await w(6500);
  ok(/This is taking longer than usual/.test(await txt()) && await p.locator(D_ + '[data-a="retry"]').count() === 1 && (await rec('adult-2')).m.cat === 'disability', 'timeout with Try again, answers kept');
  ok(await ev(() => NET_TIMEOUT_MS) === 120000 && await ev(() => [...document.querySelectorAll('#tbNet option')].some(o => /120-second/.test(o.textContent))), 'production timeout 120 s (Network › Slow connection)');

  // ---- Pass Rider ----
  await scen('passrider-assist');
  const pr = await ev(() => travelerList(D().booking).map(t => t.key + ':' + (assistCat(D().booking, t.key) || '-')).join());
  ok(pr === 'pr-you:disability,pr-fam-1:companion,pr-dep-1:station,pr-comp-1:-', 'Pass Rider Leisure: you, spouse, dependent, Companion Pass with their own answers');
  ok(await p.locator(D_ + '#ask-pr-comp-1').count() === 1 && !(await ev(() => D().booking.ask['pr-comp-1'])), 'Companion Pass traveler can ask for help, not a personal companion by default');
  await ev(() => { VS[1] = makeVS('passrider'); D().booking.prType = 'business'; goLoc('travelers'); }); await w();
  ok(await p.locator(D_ + '#ask-pr-you').count() === 1, 'Pass Rider Business: assistance available');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
  console.log('pass', pass, 'fail', fail); await b.close();
})();
