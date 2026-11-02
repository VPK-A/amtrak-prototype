// Design system › ADS Next: Saved codes as an ADS Next List row (surface, row height, lines, chevron, focus); Current unchanged
const { chromium } = require('playwright'); const SP = require('os').tmpdir() + '/';
const res = []; const ok = (c, m) => { res.push([!!c, m]); console.log((c ? 'ok   ' : 'FAIL ') + m); };
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1400, height: 1100 }, reducedMotion: 'reduce' });
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
  await p.waitForFunction(() => typeof TB !== 'undefined' && document.querySelector('#device .app'));
  const tok = n => p.evaluate(n => { const i = document.createElement('i'); i.style.color = `var(${n})`; document.querySelector('#device .app').appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c; }, n);
  for (const v of [1, 3]) for (const th of ['light', 'dark']) { const T = `C${v} ${th}`;
    await p.evaluate(([v, th]) => { TB.v = v; TB.dev = 'iphone'; TB.theme = th; TB.ds = 'next'; VS[v] = makeVS('returning'); goLoc('ff'); }, [v, th]); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const b = document.querySelector('#device .dcode .ads-group__body'), r = b.querySelector('.ads-group__row'), l = r.querySelector('.ads-group__label'), s = r.querySelector('.ads-group__value'), ch = r.querySelector('.ads-icon--chevron-right'); const cb = getComputedStyle(b), cl = getComputedStyle(l), cs = getComputedStyle(s);
      return { rad: cb.borderTopLeftRadius, bw: cb.borderTopWidth, bc: cb.borderTopColor, bg: cb.backgroundColor, h: r.offsetHeight, pl: getComputedStyle(r).paddingLeft, lfs: cl.fontSize, lc: cl.color, sfs: cs.fontSize, sc: cs.color, chw: ch.getBoundingClientRect().width / (document.querySelector('#device').getBoundingClientRect().width / document.querySelector('#device').offsetWidth) }; });
    const sub = await tok('--ads-border-subtle'), raised = await p.evaluate(() => { const i = document.createElement('i'); i.style.background = 'var(--ads-background-surface-raised)'; document.querySelector('#device .app').appendChild(i); const c = getComputedStyle(i).backgroundColor; i.remove(); return c; }), prim = await tok('--ads-content-text-primary'), ter = await tok('--ads-content-text-tertiary');
    ok(m.rad === '4px' && m.bw === '1px' && m.bc === sub && m.bg === raised, `${T} surface: radius/4, 1px border/subtle, surface-raised`);
    ok(m.h === 44 && m.pl === '12px', `${T} row: 44px, space/12 sides (h ${m.h})`);
    ok(m.lfs === '16px' && m.lc === prim && m.sfs === '12px' && m.sc === (await tok('--ads-content-text-secondary')), `${T} lines: Body 16 primary, Caption 12 secondary (contrast)`);
    ok(Math.round(m.chw) === 24, `${T} trailing chevron 24px (${m.chw})`);
    await p.focus('#device [data-a="code-saved"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    const f = await p.evaluate(() => { const r = document.querySelector('#device [data-a="code-saved"]'), c = getComputedStyle(r); return { a: document.activeElement === r, o: c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineOffset, h: r.offsetHeight }; });
    ok(f.a && f.o === 'solid 2px -2px' && f.h === 44, `${T} focus: 2px inset ring, no size change (${f.o})`);
    if (th === 'light') { await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => document.querySelector('#device #dcode').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200); const bx = await p.locator('#device #dcode').boundingBox(); await p.screenshot({ path: SP + `sc-c${v}.png`, clip: { x: bx.x - 8, y: bx.y - 8, width: bx.width + 16, height: bx.height + 16 } }); }
    await p.evaluate(() => { TB.ds = 'current'; render(); }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('#device .dcode .ads-group__body')).borderTopLeftRadius) === '12px', `${T} Current design unchanged (radius 12)`);
  }
  console.log(`${res.filter(r => r[0]).length}/${res.length} passed`); await br.close(); })();
