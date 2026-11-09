// Station selection (initial flow, destination-only editing, incomplete and complete map selection, "Saved"),
// Profile editing (whole-row targets, chevrons, third-level edit screens incl. assistance and employee pass, no inline
// editing), and "Apply code" labels.
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
  const click = async (s, ms = 450) => { await p.locator(D_ + s).first().click(); await w(ms); };
  const txt = () => ev(() => document.querySelector('#device').innerText.replace(/\s+/g, ' '));
  const stack = () => ev(() => sheet() ? sheet().stack.map(r => r.s + (r.p && r.p.field ? ':' + r.p.field : '')).join('>') : 'none');
  const bk = () => ev(() => [D().booking.from, D().booking.to]);
  const ff = (sc = 'new', o = {}) => ev(([sc, o]) => { TB.v = 1; TB.dev = o.dev || 'iphone'; VS[1] = makeVS(sc); goLoc('ff'); const b = D().booking; if (o.from) b.from = o.from; if (o.to) b.to = o.to; render(); }, [sc, o]).then(() => w(400));
  const pick = async c => { await p.fill(D_ + '#ss-q', c); await w(200); await click(`[data-a="choose-station"][data-code="${c}"]`, 500); };
  const toMap = async () => { await click('#ss-tab-map', 600); await ev(() => { const r = sheet().stack.at(-1); r.u.map = { lat: 40.0, lon: -75.0, z: 8 }; render(); }); await w(300); };
  const pin = c => ev(c => document.querySelector('#device .map-pin[data-code="' + c + '"]').click(), c).then(() => w(450));

  // ================= Station selection =================
  await ff('new'); await click('#ff-from', 700); await pick('NYP');
  ok(await stack() === 'ff>stations:to' && (await bk()).join() === 'NYP,', 'initial: From chosen → To becomes active, selector stays open');
  await pick('WAS');
  ok(await stack() === 'ff' && (await bk()).join() === 'NYP,WAS', 'initial: To chosen → back on Fare Finder with both stations');
  // destination-only edit
  await click('#ff-to', 700); await pick('PHL');
  ok(await stack() === 'ff' && (await bk()).join() === 'NYP,PHL', 'destination-only: reopening To and choosing returns at once; From kept');
  await click('#ff-from', 700); await pick('BOS');
  ok(await stack() === 'ff' && (await bk()).join() === 'BOS,PHL', 'origin-only: reopening From and choosing returns at once; To kept');
  // map: incomplete (another station still needed) → back to the list
  await ff('new'); await click('#ff-from', 700); await toMap(); await pin('PHL'); await click('[data-k="map-select"]', 600);
  ok(await stack() === 'ff>stations:to' && await ev(() => sheet().stack.at(-1).u.view === 'list') && await p.locator(D_ + '#ss-q').count() === 1 && (await bk()).join() === 'PHL,', 'map, incomplete: Select returns to the station list for To');
  ok(await ev(() => document.activeElement.id) === 'ss-q' && /set as your departure station\. Now choose your arrival station\./.test(await ev(() => document.querySelector('#device .ss-top [role="status"]').textContent)), 'map, incomplete: announced; focus in search');
  // map: complete (both set) → Fare Finder
  await toMap(); await pin('TRE'); await click('[data-k="map-select"]', 600);
  ok(await stack() === 'ff' && (await bk()).join() === 'PHL,TRE', 'map, complete: Select returns to Fare Finder with both stations');
  await ff('new', { from: 'NYP', to: 'WAS' }); await click('#ff-to', 700); await toMap(); await pin('PHL'); await click('[data-k="map-select"]', 600);
  ok(await stack() === 'ff' && (await bk()).join() === 'NYP,PHL', 'map, destination-only: Select returns to Fare Finder; From kept');
  await click('#ff-to', 700); await toMap();
  ok(/Needs alignment with the user story and Product: after Select on the map/.test(await ev(() => document.querySelector('#notes').innerText)), 'map selection behaviour annotated for alignment with the user story and Product');
  await click('.ss-head__back');
  // "Saved"
  await ff('returning'); await click('#ff-from', 700);
  const t = await txt();
  ok(/\bSaved\b/.test(t) && !/Favorite/i.test(t) && await p.locator(D_ + '[aria-label="Saved stations"]').count() === 1 && await p.locator(D_ + '[aria-label="Favorite stations"]').count() === 0, '"Favorites" is "Saved" in station selection');
  ok(await p.locator(D_ + '.ads-stationrow__star .ads-icon--bookmark-filled').count() >= 1 && /^Save /.test(await ev(() => document.querySelector('#device [data-a="fav"]').getAttribute('aria-label'))), 'bookmark icon kept; its name is Save');
  await click('[data-a="fav"][data-code="WAS"]'); ok(/Washington saved/.test(await ev(() => (V().toast || {}).msg || '')), 'saving a station says "saved"');

  // ================= Profile editing =================
  for (const dev of ['iphone', 'ipad']) {
    await ev(dev => { TB.v = 1; TB.dev = dev; VS[1] = makeVS('passrider'); goLoc('profile'); }, dev); await w(600);
    const rows = await ev(() => [...[...document.querySelectorAll('#device .pane')].find(x => (x.querySelector('.ads-navbar__title') || {}).textContent === 'Profile').querySelectorAll('.ads-group__row')].map(r => ({ l: r.querySelector('.ads-group__label').textContent, btn: r.tagName === 'BUTTON', chev: !!r.querySelector('.ads-icon--chevron-right'), meta: (r.querySelector('.ads-group__meta') || {}).textContent || '', locked: !!r.querySelector('.ads-lock') })));
    const editable = rows.filter(r => !r.locked);
    ok(editable.length >= 8 && editable.every(r => r.btn && r.chev && !r.meta), `${dev}: every editable row is one button with a chevron, no extra action text (${editable.map(r => r.l).join(', ')})`);
    ok(rows.filter(r => r.locked).every(r => !r.btn && !r.chev), `${dev}: read-only rows have no chevron`);
    const base = await stack();
    for (const [k, s, title] of [['row-phone', 'edit', 'Phone'], ['row-address', 'edit', 'Billing address'], ['row-employee', 'edit', 'Employee pass'], ['row-disc', 'discounts', 'Passenger discounts'], ['row-assist', 'assist-profile', 'Assistance requests']]) {
      await click(`[data-k="${k}"]`, 600);
      const st = await stack(), panes = await ev(() => document.querySelectorAll('#device .psheet .pane:not(.navstage__under .pane)').length);
      ok(st.startsWith(base + '>' + s) && panes === 1 && await ev(t => [...document.querySelectorAll('#device .pane .ads-navbar__title')].pop().textContent === t, title), `${dev}: ${title} opens its own third-level screen (${st})`);
      ok(await p.locator(D_ + '.pane .ads-navbar [data-a="back"], ' + D_ + '.pane .ads-navbar__btn').count() >= 1 && await p.locator(D_ + '[data-a="assist-p-edit"], .ads-summary [data-a="edit"]').count() === 0, `${dev}: ${title}: Back, close and Save editor, no inline Edit inside`);
      await ev(() => { const r = sheet().stack.at(-1); r.u.dirty = false; popTo(sheet().stack.length - 2); }); await w(400);
    }
    await click('[data-k="row-email"]', 600); ok(await ev(() => !!nav().cover), `${dev}: Email opens its own screen (verify, then change)`); await ev(() => endVerify(false)); await w(300);
  }
  // assistance editor saves and returns to Profile
  await ev(() => { TB.dev = 'iphone'; VS[1] = makeVS('returning'); goLoc('profile'); }); await w(500);
  await click('[data-k="row-assist"]', 600);
  ok(await p.locator(D_ + 'input[name$="-cat"]').count() >= 2 && await p.locator(D_ + '.pane__foot [data-a="assist-save"]').count() === 1, 'Assistance requests: the questionnaire opens directly with Save');
  await click('label:has(input[name$="-cat"][value="station"])', 300); await click('.pane__foot [data-a="assist-save"]', 900);
  ok(await stack() === 'account>profile' && await ev(() => D().assist.cat === 'station') && /Station assistance/i.test(await ev(() => document.querySelector('#device [data-k="row-assist"]').innerText)), 'saving returns to Profile with the new value');
  await click('[data-k="row-assist"]', 600); await click('label:has(input[name$="-cat"][value="disability"])', 300); await click('.pane .ads-navbar [data-a="back"]', 500);
  ok(await ev(() => nav().dialog && nav().dialog.title) === 'Discard changes?', 'Cancel with changes asks Discard changes?'); await ev(() => closeDialog(nav().dialog.actions[1][2])); await w(400);
  ok(await stack() === 'account>profile' && await ev(() => D().assist.cat === 'station'), 'Discard returns to Profile; saved assistance unchanged');

  // ================= Apply code =================
  await ff('returning', { from: 'NYP', to: 'WAS' });
  ok(await ev(() => document.querySelector('#device #ff-coderow .ads-selectrow__value').textContent) === 'Apply code', 'entry point reads "Apply code"');
  await click('#ff-coderow', 700);
  ok(await ev(() => document.querySelector('#device .pane .ads-navbar__title').textContent) === 'Apply code' && await ev(() => document.querySelector('#device #apc-in').placeholder) === 'Enter code', 'the code screen is titled "Apply code"');
  ok(!/discount code|Apply coupon/i.test(await txt()), 'no "Discount code" or "Apply coupon" wording on the code screen');
  await click('[data-a="apc-pick"][data-code="60310045672211"]', 300); await click('[data-a="apc-save"]', 500);
  ok((await stack()) === 'ff' && await ev(() => D().booking.codeText) === '60310045672211', 'saved-code selection still works');
  await click('#ff-coderow', 700); await p.fill(D_ + '#apc-in', 'zq7m'); await click('[data-a="apc-save"]', 500);
  ok(await ev(() => D().booking.codeText) === 'ZQ7M' && !/discount code/i.test(await txt()), 'manual entry still works; Fare Finder has no "Discount code" wording');
  await w(3500); const v = await ev(async () => (await axe.run('#device', { resultTypes: ['violations'] })).violations.filter(x => x.nodes.some(n => !n.target.join(' ').includes('dev-status'))).map(x => x.id + ':' + x.nodes.map(n => n.target.join(' ')).join('|'))); ok(!v.length, `axe Fare Finder (${v})`);
  ok(errs.length === 0, `no page errors (${errs.join(' | ')})`);
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close();
})();
