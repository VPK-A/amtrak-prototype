/* Sprint 4 prototype shell (not part of the app): the header, control panel and screen notes are hidden by
   default and shown together from a floating launcher. Showing or hiding them never touches the demo state. */
function setChrome(open, moveFocus = true) {
  const btn = $('#chromeToggle'), label = open ? 'Hide prototype controls and notes' : 'Show prototype controls and notes';
  document.body.classList.toggle('chrome-hidden', !open);
  btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', label); btn.title = label;
  // With the panel hidden only the device shows, so the Prototype view comes back if Handoff was open
  if (!open && TB.tab !== 'proto') $('#viewTabs [data-v="proto"]').click();
  scaleDevice();
  if (moveFocus) (open ? $('#chromeClose') : btn).focus();
}
$('#chromeToggle').addEventListener('click', () => setChrome(document.body.classList.contains('chrome-hidden')));
$('#chromeClose').addEventListener('click', () => setChrome(false));
// Escape hides them, unless the key belongs to the app inside the device (sheets, dialogs)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented || document.body.classList.contains('chrome-hidden')) return;
  if ($('#device').contains(e.target)) return;
  setChrome(false);
});
setChrome(false, false);
// The device is a phone or tablet app, where nothing hovers: drop every hover style except the prototype's
// own controls outside the device (toolbar, view switch, launcher). Press and focus states stay.
(function dropAppHover() {
  const keep = /toolbar|\.tb|viewtabs|chrome-|\.notes|\.doc|\.top\b/;
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
