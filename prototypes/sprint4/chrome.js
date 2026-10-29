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
