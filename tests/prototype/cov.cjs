// Coverage round: trip setup and station memory, travelers/points/code, assistance, employee and corporate modes
const { chromium } = require('playwright');
const res = []; const ok = (c, m) => { res.push([!!c, m]); if (!c) console.log('FAIL ' + m); };
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const w = ms => p.waitForTimeout(ms), D = '#device ', ev = (f, a) => p.evaluate(f, a);
  const go = (v, sc, loc = 'ff', net = 'online') => ev(([v, sc, loc, net]) => { TB.v = v; VS[v] = makeVS(sc); VS[v].net = net; goLoc(loc); }, [v, sc, loc, net]);
  const dclick = async sel => { await p.locator(D + sel).first().dispatchEvent('click'); await w(250); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const stack = () => ev(() => nav().sheet ? nav().sheet.stack.map(r => r.s).join('>') : '');
  const notes = () => ev(() => document.querySelector('#notes').innerText);
  for (const v of [1, 3]) {
    const T = `C${v}`;
    // ---- 607/608/1060 ----
    await go(v, 'returning'); await w(200);
    let b = await ev(() => D().booking); ok(b.trip === 'ow' && b.dep === '2026-10-28' && !b.ret, `${T} 607 one-way, today`);
    await dclick('[data-a="add-return"]'); b = await ev(() => D().booking); ok(b.trip === 'rt' && b.ret === b.dep, `${T} 608 Add return → round-trip today/today`);
    await dclick('#ff-dep'); await w(300);
    ok(!/335 days|Dates up to/.test(await txt()), `${T} 1060 no unconfirmed booking-window text in the app`);
    ok(await p.locator(D + `[data-a="day"][data-d="2026-10-27"]`).isDisabled(), `${T} 1060 past dates disabled`);
    ok(/Booking window/.test(await notes()), `${T} 1060 horizon flagged in reviewer notes`);
    await ev(() => { const r = sheet().stack[1]; r.u.month = '2027-10'; render(); }); await w(150);
    ok(await ev(() => { const s = addDays(TODAY_S, WINDOW_DAYS + 1), e = document.querySelector(`#device [data-a="day"][data-d="${s}"]`); return !e || e.disabled; }), `${T} 1060 dates beyond the setting disabled`);
    await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); D().booking.ret = null; D().booking.from = 'NYP'; D().booking.to = 'WAS'; render(); });
    ok(/Missing return date/.test(await notes()), `${T} 1060 missing-return treatment flagged`);
    await dclick('[data-a="find-trains"]'); await w(300); ok(/Choose a return date/.test(await txt()) && await stack() === 'ff', `${T} 1060 search blocked without a return`);
    // ---- 118/984 ----
    await go(v, 'returning'); await ev(() => { D().fav = ['WAS', 'BOS', 'NYP', 'BOS']; goLoc('stations:from'); }); await w(300);
    const favs = await ev(() => [...document.querySelectorAll('#device [aria-label="Favorite stations"] .ads-stationrow__code')].map(e => e.textContent).join(','));
    ok(favs === 'BOS,NYP,WAS', `${T} 118 favorites alphabetical by city, no duplicates (${favs})`);
    const order = await ev(() => { const s = [...document.querySelectorAll('#device .stsection')].map(x => x.querySelector('.stlist[aria-label]').getAttribute('aria-label')); return s.join('|'); });
    ok(/^Favorite stations\|Recent stations/.test(order), `${T} 118 favorites above recents`);
    const recs = await ev(() => [...document.querySelectorAll('#device [aria-label="Recent stations"] .ads-stationrow__code')].map(e => e.textContent).join(','));
    ok(recs === 'PHL', `${T} 984 recents: within ${''}retention, not duplicating favorites, most recent first (${recs})`);
    ok(await ev(() => RECENT_DAYS === 10 && recentList({ rec: [{ c: 'A', d: 3 }, { c: 'B', d: 1 }, { c: 'C', d: 11 }], fav: [] }).map(x => x.c).join() === 'B,A'), `${T} 984 configurable 10-day retention, latest first`);
    await ev(() => { D().rec = []; goLoc('stations:from'); }); await w(200);
    ok(await p.locator(D + '[aria-label="Recent stations"]').count() === 0, `${T} 984 empty recents hidden`);
    // guest favorites
    await go(v, 'guest', 'stations:from'); await w(300);
    await dclick('[data-a="fav"][data-code="PHL"]'); ok(await ev(() => D().fav.includes('PHL')), `${T} 118 guest can save a favorite locally`);
    // sign out clears recents, keeps favorites
    await go(v, 'returning', 'account'); await w(300);
    await dclick('[data-a="sign-out"]'); ok(/Sign out\?/.test(await ev(() => nav().dialog && nav().dialog.title)), `${T} 984 sign out asks first`);
    await p.locator(D + '[data-dlg="1"]').click(); await w(300);
    b = await ev(() => ({ s: D().signedIn, rec: D().rec.length, fav: D().fav.length }));
    ok(!b.s && b.rec === 0 && b.fav > 0 && /Recent stations were cleared/.test(await txt()), `${T} 984 sign out clears recents, keeps favorites`);
    // 1004 clear recents: cancel, confirm, cleared, offline
    await go(v, 'returning', 'account', 'offline'); await w(300);
    await dclick('[data-a="clear-recents"]'); await p.locator(D + '[data-dlg="0"]').click(); await w(200);
    ok(await ev(() => D().rec.length) === 4, `${T} 1004 cancel keeps recents`);
    await dclick('[data-a="clear-recents"]'); await p.locator(D + '[data-dlg="1"]').click(); await w(300);
    ok(await ev(() => D().rec.length === 0 && D().fav.length === 1) && /No recent stations/.test(await txt()), `${T} 1004 cleared state, favorites kept, works offline`);
    // ---- 624 ----
    await go(v, 'guest'); await w(200);
    ok(await p.locator(D + '[data-key="pay"][data-v="points"]').count() === 1 && await ev(() => D().booking.pay) === 'cash', `${T} 624 guest sees Cash/Points, cash by default`);
    await dclick('[data-key="pay"][data-v="points"]');
    ok(!(await ev(() => !!nav().cover)) && /sign in to use your points after you choose a fare/.test(await txt()), `${T} 624 guest chooses points without signing in`);
    ok(await p.locator(D + '#ff-code').count() === 0, `${T} 613 code hidden for points`);
    await ev(() => { D().booking.from = 'NYP'; D().booking.to = 'WAS'; render(); }); await dclick('[data-a="find-trains"]'); await w(900);
    ok(/Points \(guest signs in after choosing a fare\)/.test(await txt()), `${T} 624 guest points carried into the search`);
    await go(v, 'returning'); ok(/Points · 12,450/.test(await txt()), `${T} 624 member balance shown`);
    for (const sc of ['passrider', 'triplink']) { await go(v, sc); ok(await p.locator(D + '[data-key="pay"]').count() === 0 && await p.locator(D + '#ff-code').count() === 0, `${T} 624/613 points and code hidden in ${sc}`); }
    // ---- 973/615/614 ----
    await go(v, 'returning'); await ev(() => { D().booking.pax.adult = 2; render(); });
    ok(!/Traveler with disability or need help/.test(await txt()), `${T} 973 indication not on the Fare Finder form (proposed mapping: Travelers)`);
    await dclick('[data-a="pick-travelers"]'); await w(300);
    ok(await p.locator(D + '#ff-assist, .ffassist').count() === 0, `${T} 973 no booking-level checkbox above Traveler details`);
    const inDetails = await ev(() => [...document.querySelectorAll('#device [data-a="assist-ask"]')].map(i => !!i.closest('.fam-card, .ov-trav') && i.closest('section').querySelector('.ffc-h').textContent.trim() === 'Traveler details'));
    ok(inDetails.length === 2 && inDetails.every(Boolean), `${T} 973 one checkbox per traveler, inside Traveler details`);
    ok(await ev(() => [...document.querySelectorAll('#device [data-a="assist-ask"]')].every(i => !i.checked)), `${T} 973 off by default without saved assistance`);
    const nm = await ev(() => { const i = document.querySelector('#device #ask-adult-2'); return i.closest('label').textContent.replace(/\s+/g, ' '); });
    ok(/Traveler with disability or need help\? Traveler 2 · Adult/.test(nm), `${T} 973 checkbox name includes the traveler (${nm.slice(0, 60)})`);
    ok(await p.locator(D + '[data-a="assist-edit"], [data-a="assist-answer"]').count() === 0, `${T} 973 no questions while unchecked`);
    await ev(() => { V().net = 'offline'; }); await dclick('#ask-adult-1'); await w(200);
    ok(await ev(() => asks(D().booking, 'adult-1') && !asks(D().booking, 'adult-2') && D().booking.assistOn), `${T} 973 checking works offline and only for that traveler`);
    ok(await p.locator(D + '[data-a="assist-answer"]').count() === 1 && await p.locator(D + '[data-a="assist-answer"][data-t="adult-1"]').count() === 1, `${T} 973 Answer only for the checked traveler`);
    await dclick('[data-a="assist-answer"][data-t="adult-1"]'); await w(200);
    ok(/offline/i.test(await txt()) && !(await stack()).endsWith('assist'), `${T} 973 Answer offline: no-connection message, stays`);
    await ev(() => { V().net = 'slow'; }); await dclick('[data-a="assist-answer"][data-t="adult-1"]'); await w(200);
    ok(/Opening questions/.test(await txt()), `${T} 973 slow connection shows progress with Cancel`); await dclick('[data-a="cancel-busy"]');
    await ev(() => { V().net = 'online'; }); await dclick('[data-a="assist-answer"][data-t="adult-1"]'); await w(950);
    ok((await stack()).endsWith('assist') && /Traveler 1/.test(await txt()), `${T} 973 Answer opens Traveler 1's questions, named`);
    const ans = async (cat, extra) => { await ev(([cat, extra]) => { const r = sheet().stack[sheet().stack.length - 1]; r.u.d = Object.assign({ cat, dis: [], wc: '', needs: [], for: '' }, extra); render(); }, [cat, extra]); await dclick('[data-a="assist-confirm"]'); await w(350); };
    await ans('disability', { dis: ['mobility'], wc: 'yes', needs: ['seat'] });
    ok(!(await stack()).endsWith('assist'), `${T} 973 back on Travelers after answering`);
    if (v === 3 && (await stack()).endsWith('traveler')) await dclick('[data-a="sheet-done"]');
    await dclick('#ask-adult-2'); await w(950);
    ok((await stack()).endsWith('assist') && /Traveler 2/.test(await txt()), `${T} 973 checking Traveler 2 opens their questions`);
    await ev(() => { while (sheet().stack.length > 1) sheet().stack.pop(); render(); }); await w(200);
    ok(/Assistance answered for 1 of 2/.test(await txt()), `${T} 973 Fare Finder summary counts checked travelers`);
    await dclick('[data-a="find-trains"]'); await w(300);
    ok(await stack() === 'ff' && /Answer the assistance questions for Traveler 2/.test(await txt()), `${T} 615 search blocked until every checked traveler answers`);
    await dclick('[data-a="pick-travelers"]'); await w(300); await dclick('[data-a="assist-answer"][data-t="adult-2"]'); await w(950);
    ok(/Traveler 2/.test(await txt()), `${T} 973 Answer opens Traveler 2's questions`);
    await ans('companion', { for: 'adult-1', needs: ['station', 'seat'] });
    ok(await ev(() => tdiscOf(D().booking, { key: 'adult-2', type: 'adult', i: 2 })) === 'companion', `${T} 997 companion answered, Companion discount`);
    if (v === 3 && (await stack()).endsWith('traveler')) await dclick('[data-a="sheet-done"]');
    await dclick('#ask-adult-1'); await w(200);
    ok(/Answers are kept for this trip/.test(await txt()) && await ev(() => tdiscOf(D().booking, { key: 'adult-1', type: 'adult', i: 1 })) !== 'pwd', `${T} 973 unchecked: answers kept but not applied`);
    await dclick('#ask-adult-1'); await w(200);
    ok(await ev(() => assistMissing(D().booking).length === 0 && tdiscOf(D().booking, { key: 'adult-1', type: 'adult', i: 1 }) === 'pwd'), `${T} 973 re-check restores the answers`);
    // 614 prefill
    await go(v, 'assist'); b = await ev(() => D().booking);
    ok(b.assistOn && b.assistDone && b.assistFromProfile, `${T} 614 indication on and Traveler 1 prefilled from Profile`);
    await dclick('[data-a="pick-travelers"]'); await w(300);
    if (v === 3) { ok(/From your profile/.test(await txt()), `${T} 614 prefill labeled`); await dclick('[data-a="ov-traveler"][data-t="adult-1"]'); await w(300); }
    else ok(/From your profile/.test(await txt()), `${T} 614 prefill labeled`);
    await dclick('[data-a="assist-edit"][data-t="adult-1"]'); await w(400);
    await ans('station', { needs: [] });
    ok(await ev(() => D().assist.cat === 'disability' && D().booking.assist.cat === 'station'), `${T} 614 booking edit doesn't write back to Profile`);
    await dclick('[data-a="assist-remove"][data-t="adult-1"]');
    ok(await ev(() => D().assist.cat === 'disability' && !D().booking.assistDone), `${T} 614 deselecting for this trip leaves Profile alone`);
    await go(v, 'guest'); ok(!(await ev(() => D().booking.assistOn)), `${T} 614 guests aren't prefilled`);
    await go(v, 'returning'); ok(!(await ev(() => D().booking.assistOn)), `${T} 614 indication off without saved requests or disability discount`);
    // ---- 1019: Pass Rider assistance, including companions ----
    await go(v, 'passrider'); await dclick('[data-a="pr-type"][data-v="leisure"]');
    await ev(() => { D().booking.prPax.comp = 1; render(); }); await dclick('[data-a="pick-travelers"]'); await w(300);
    ok(await p.locator(D + '#ask-pr-you').count() === 1 && await p.locator(D + '#ask-pr-comp-1').count() === 1, `${T} 1019 each Pass Rider traveler has the checkbox, including companions`);
    await dclick('#ask-pr-you'); await dclick('#ask-pr-comp-1');
    ok(await ev(() => assistMissing(D().booking).map(t => t.key).join()) === 'pr-you,pr-comp-1', `${T} 1019 assistance for every Pass Rider traveler, including companions`);
    // ---- 1018 ----
    await ev(() => { const b = D().booking; b.trip = 'rt'; b.ret = b.dep; render(); }); await w(100);
    ok(!/round trip uses/i.test(await txt()) && await p.locator(D + '[data-a="pax"][data-g="pr"][data-k="comp"][data-d="1"]').isEnabled(), `${T} 1018 no unconfirmed round-trip pass rule in the app`);
    ok(/Pass Rider travelers and companion passes/.test(await notes()), `${T} 1018 pass use rule flagged in reviewer notes`);
    await ev(() => { const b = D().booking; b.prPax.comp = 5; b.assistOn = false; b.ask = {}; render(); }); await w(100);
    ok(await p.locator(D + '[data-a="pax"][data-g="pr"][data-k="comp"][data-d="1"]').isDisabled(), `${T} 1018 picker stops at the remaining balance`);
    await ev(() => { const b = D().booking; b.prPax.comp = 1; b.from = 'NYP'; b.to = 'WAS'; while (sheet().stack.length > 1) sheet().stack.pop(); render(); });
    await dclick('[data-a="find-trains"]'); await w(900);
    ok(await stack() === 'ff>handoff' && await ev(() => D().passrider.compLeft) === 5, `${T} 1018 searching doesn't use passes`);
    // ---- dual eligibility ----
    await go(v, 'triplink-passrider'); b = await ev(() => D().booking);
    ok(b.intent === 'standard' && /Booking type Regular/.test(await txt()) && await ev(() => modeOptions(D()).map(o => o[0]).join()) === 'corporate,pr,personal', `${T} dual eligibility: both modes offered, none preselected`);
    ok(/Accounts eligible for TripLink and Pass Rider/.test(await notes()), `${T} dual eligibility flagged`);
    // eligibility fixtures in the controller
    const scs = await ev(() => [...document.querySelectorAll('#tbScenario option')].map(o => o.value));
    ok(['triplink', 'triplink-passrider', 'passrider', 'passrider-nopass', 'passrider-retiree', 'passrider-spouse', 'passrider-dependent', 'passrider-minor'].every(s => scs.includes(s)), `${T} reviewer scenarios for every eligibility group`);
    // reviewer controls
    ok(await ev(() => !!document.querySelector('#protoCtl #tbNet') && !!document.querySelector('#protoCtl #notes')), `${T} Network and Screen notes in the reviewer controller`);
  }
  // no Jira IDs in the app
  for (const v of [1, 3]) for (const sc of ['returning', 'guest', 'passrider', 'assist', 'triplink-passrider']) { await go(v, sc); ok(!/NMA-\d/.test(await txt()), `C${v} no Jira IDs on screen (${sc})`); }
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`);
  await br.close();
})();
