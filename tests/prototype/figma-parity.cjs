// Figma parity: compares the prototype's text with the Sprint 4 Figma screens (iOS · Mobile · Portrait).
// figma-parity/text-styles.json: text | color variable | text style, per screen (from the Figma gallery).
// figma-parity/positions.json: text, x, y (top of the trimmed text box), height, per screen.
// Reports every text whose color token, size or weight differs, and every text more than TOL px from its Figma
// position. Different wording moves the content below it, so position notes after a copy difference are expected.
// Usage: node tests/prototype/figma-parity.cjs [tolerancePx=4]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const TOL = +(process.argv[2] || 4);
const STY = JSON.parse(fs.readFileSync(path.join(__dirname, 'figma-parity/text-styles.json'), 'utf8'));
const POS = JSON.parse(fs.readFileSync(path.join(__dirname, 'figma-parity/positions.json'), 'utf8'));
const TOKEN = { 'rgb(5, 18, 49)': 'text-primary', 'rgb(83, 75, 69)': 'text-secondary', 'rgb(109, 100, 94)': 'text-tertiary', 'rgb(137, 127, 120)': 'text-disabled', 'rgb(6, 76, 176)': 'text-link', 'rgb(255, 255, 255)': 'text-on-brand' };
const STYLE = { 'H3 Headline': [20, 600], 'H4 Headline': [17, 600], 'Body': [17, 400], 'Body - Emphasis': [17, 600], 'Body Small': [13, 400], 'Body Small - Emphasis': [13, 600], 'Field Label': [15, 600], 'Caption': [11, 400], 'Button': [17, 600], 'Body - Underline': [17, 400], 'Body Small - Underline': [13, 400] };
const norm = s => s.toLowerCase().replace(/\u2019/g, "'").trim();
(async()=>{
 const br=await chromium.launch(); const p=await br.newPage({viewport:{width:1400,height:1100},reducedMotion:'reduce'});
 await p.goto(require('url').pathToFileURL(path.resolve(__dirname, '../../prototypes/sprint4/index.html')).href);
 await p.waitForFunction(()=>typeof TB!=='undefined'&&document.querySelector('#device .app'));
 const ev=(f,a)=>p.evaluate(f,a), w=ms=>p.waitForTimeout(ms), D='#device ';
 const click=async(s,ms=700)=>{ await p.locator(D+s).first().click(); await w(ms); };
 const dump=()=>ev(()=>{ const app=document.querySelector('#device .app').getBoundingClientRect(); const top=[...document.querySelectorAll('#device .pane')].pop(); const root=top.closest('.psheet')||top; const out=[];
   const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n;
   while((n=tw.nextNode())){ const t=n.textContent.replace(/\s+/g,' ').trim(); if(!t) continue; const el=n.parentElement; if(el.closest('[inert],[aria-hidden="true"]:not(.ads-icon),.ads-sr-only,.navstage__under')) continue; const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none') continue;
     const rg=document.createRange(); rg.selectNodeContents(n); const rs=[...rg.getClientRects()].filter(r=>r.width>0); if(!rs.length) continue; const r0=rs[0];
     // glyph center of first line: line box center
     // block-level parent holding only this text: use its (trimmed) box top, as Figma does; otherwise the glyph box
     let top = r0.top; const blk = el.childNodes.length === 1 && !/^inline/.test(cs.display) ? el : null; if (blk) top = blk.getBoundingClientRect().top;
     out.push([t.slice(0,40), Math.round(r0.left-app.x), Math.round((r0.top+r0.bottom)/2-app.y), parseFloat(cs.fontSize), cs.color, cs.fontWeight, cs.textDecorationLine]); }
   return out; });
 const ff=async(sc='returning',fn='')=>{ await ev(([sc,fn])=>{TB.v=1;TB.dev='iphone';TB.orient='portrait';TB.theme='light';TB.text=100;TB.cpn='current';VS[1]=makeVS(sc);V().toast=null;goLoc('tab:book');A['open-booking']();const b=D().booking; if(fn) (new Function('b',fn))(b); render();},[sc,fn]); await w(700); };
 const go=async(sc,loc)=>{ await ev(([sc,loc])=>{TB.v=1;TB.dev='iphone';TB.theme='light';TB.cpn='current';VS[1]=makeVS(sc);V().toast=null;goLoc(loc);},[sc,loc]); await w(800); };
 const prof=async(k,sc='returning')=>{ await go(sc,'profile'); await click(`[data-k="${k}"]`,900); };
 const res={}; const S=async(n,f)=>{ try{ await f(); res[n]=await dump(); }catch(e){ res[n]='ERR '+e.message.split('\n')[0]; } };
 await S('FF.1',()=>ff('returning',"b.from=null;b.to=null;b.dep='2026-10-28';"));
 await S('FF.3',()=>ff('returning',"b.from='NYP';b.to='WAS';b.dep='2026-10-28';"));
 await S('ST.1',async()=>{ await ff('returning',"b.from=null;b.to=null;"); await click('#ff-from',900); });
 await S('DT.1',async()=>{ await ff('returning',"b.dep='2026-10-28';b.trip='ow';"); await click('#ff-dep',900); });
 await S('TR.1',()=>go('passrider','travelers'));
 await S('TR.8',async()=>{ await go('passrider','travelers'); await click('[role="tab"]:has-text("Business")',800); });
 await S('TR.11',async()=>{ await go('returning','travelers'); });
 await S('TR.21',()=>go('triplink','travelers'));
 await S('AS.10',async()=>{ await go('returning','travelers'); await click('#tc-adult-1 [data-a="assist-answer"]',900); });
 await S('AP.1',async()=>{ await ff('returning',"b.from='NYP';b.to='WAS';"); await click('#ff-coderow',900); });
 await S('PF.1',()=>go('returning','profile'));
 for (const [c,k] of [['ED.1','row-mi'],['ED.5','row-phone'],['DS.1','row-disc'],['PA.1','row-assist'],['CP.1','row-coupons'],['ED.3','row-dob'],['ED.8','row-address'],['ED.10','row-employee'],['VF.1','row-email']]) await S(c,()=>prof(k));
 await S('RL.1',async()=>{ await prof('row-disc'); await click('[data-topic="rules"]',900); });

 let styleBad = 0, styleN = 0, posBad = 0, posN = 0;
 for (const code of Object.keys(res)) {
  const pr = res[code]; if (!Array.isArray(pr)) { console.log(`?? ${code}: ${pr}`); continue; }
  const notes = [];
  for (const row of STY[code] || []) {
   const [t, col, st] = row.split('|'), cand = pr.filter(r => norm(r[0]).startsWith(norm(t).slice(0, 16))); if (!cand.length) continue;
   let best = null;
   for (const r of cand) { const is = [], [fsz, fw] = STYLE[st]; const pc = TOKEN[r[4]] || r[4];
    if (pc !== col) is.push(`color ${pc}, Figma ${col}`); if (Math.round(r[3]) !== fsz) is.push(`size ${r[3]}, Figma ${fsz}`); if (+r[5] !== fw) is.push(`weight ${r[5]}, Figma ${fw}`);
    if (/Underline/.test(st) && !/underline/.test(r[6])) is.push('not underlined'); if (!best || is.length < best.length) best = is; }
   styleN++; if (best.length) { styleBad++; notes.push(`style  ${t}: ${best.join('; ')}`); }
  }
  const used = new Set();
  for (const [t, x, y, h] of POS[code] || []) {
   const fc = h < 20 ? y + h / 2 : y + (h >= 35 ? 6 : 4.5); let bi = -1, bd = 1e9;
   pr.forEach((r, i) => { if (used.has(i) || !norm(r[0]).startsWith(norm(t).slice(0, 14))) return; const d = Math.abs(r[2] - fc); if (d < bd) { bd = d; bi = i; } });
   if (bi < 0) continue; used.add(bi); const dy = Math.round(pr[bi][2] - fc), dx = pr[bi][1] - x; posN++;
   if (Math.abs(dy) > TOL || Math.abs(dx) > TOL) { posBad++; notes.push(`place  ${t}: ${dy >= 0 ? '+' : ''}${dy}px down, ${dx >= 0 ? '+' : ''}${dx}px across`); }
  }
  console.log(`${notes.length ? '--' : 'ok'} ${code}`); notes.forEach(n => console.log('     ' + n));
 }
 console.log(`text styles: ${styleN - styleBad}/${styleN} match Figma · positions: ${posN - posBad}/${posN} within ${TOL}px`);
 await br.close();
})();
