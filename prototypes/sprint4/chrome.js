/* Sprint 4 prototype shell (not part of the app): a compact controller beside the device, collapsed by default
   and opened from a floating button. Opening or closing it never touches the demo state. */
function setChrome(open, moveFocus = true) {
  const btn = $('#chromeToggle'), label = open ? 'Hide prototype controls' : 'Show prototype controls';
  document.body.classList.toggle('chrome-hidden', !open);
  $('#protoCtl').hidden = !open;
  btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', label); btn.title = label;
  scaleDevice();
  if (moveFocus) (open ? $('#ctlTitle') : btn).focus();
}
$('#chromeToggle').addEventListener('click', () => setChrome(document.body.classList.contains('chrome-hidden')));
// Escape closes it, unless the key belongs to the app inside the device (sheets, dialogs)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented || document.body.classList.contains('chrome-hidden')) return;
  if ($('#device').contains(e.target)) return;
  setChrome(false);
});
setChrome(false, false);
// The device is a phone or tablet app, where nothing hovers: drop every hover style except the prototype's
// own controls outside the device (toolbar, view switch, launcher). Press and focus states stay.
(function dropAppHover() {
  const keep = /\.ctl\b|chrome-/;
  const walk = list => {
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; }
      if (!r.selectorText || !r.selectorText.includes(':hover')) continue;
      const parts = r.selectorText.split(/,(?![^(]*\))/).map(x => x.trim()).filter(x => !x.includes(':hover') || keep.test(x));
      if (!parts.length) (r.parentRule || r.parentStyleSheet).deleteRule(i);
      else if (parts.join(', ') !== r.selectorText) r.selectorText = parts.join(', ');
    }
  };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
})();

// Sentence case everywhere: no labels forced into capitals by CSS (prototype only; the ADS files are untouched)
(function noForcedCaps() {
  const walk = list => { for (const r of list) { if (r.cssRules && !r.style) { walk(r.cssRules); continue; } const st = r.style; if (!st) continue; if (/uppercase|capitalize/.test(st.textTransform)) { st.textTransform = 'none'; if (st.letterSpacing) st.letterSpacing = '0'; } } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
})();
