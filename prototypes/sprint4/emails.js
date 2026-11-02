/* Sprint 4 prototype: mock email artifacts (reviewer-only, never sent).
   - NMA-21 BR10: after a verified email change, a notification goes to the old address and to the new one.
     The final copy "remains as-is" from the existing templates, which aren't in this baseline, so the text
     here is a placeholder layout.
   - NMA-992: a password reset confirmation is generated only after a successful reset (AC1, AC2). It states
     the change, its date and time, what to do if it wasn't the customer, how to reach Customer Care, and that
     immediate action is needed (AC3, AC4). It never contains the password, part of it, hints or security
     answers (AC5). If delivery fails the reset stays successful and the failure is recorded (AC6).
   The password reset itself isn't a Sprint 4 screen (sign-in screens stay unchanged), so reviewers trigger it
   from the controller. Emails are listed in the controller and open in a preview outside the device. */

const fmtStamp = d => d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const NOW = () => { const n = new Date(); return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), n.getHours(), n.getMinutes()); };
const EMAILS = {
  'email-changed-old': (x = {}) => ({
    subject: 'Your Amtrak email address was changed', story: 'NMA-21 BR10 AC2', to: x.to || 'alex.rivera@example.com',
    body: `<p>Hi ${esc(x.first || 'Alex')},</p><p>The email address for your Amtrak Guest Rewards account was changed to <b>${esc(maskEmail(x.newEmail || 'alex.new@example.com'))}</b> on ${esc(x.when || fmtStamp(NOW()))}.</p><p>We’ll send account messages to the new address from now on.</p><p><b>Didn’t make this change?</b> Call Amtrak Customer Care at 1-800-USA-RAIL (1-800-872-7245) right away.</p>`,
    note: 'Placeholder layout. NMA-21 says the notification content stays as in the existing template, which isn’t in this baseline.'
  }),
  'email-changed-new': (x = {}) => ({
    subject: 'Your new email address is confirmed', story: 'NMA-21 BR10 AC1', to: x.to || 'alex.new@example.com',
    body: `<p>Hi ${esc(x.first || 'Alex')},</p><p>This is now the email address for your Amtrak Guest Rewards account. The change was made on ${esc(x.when || fmtStamp(NOW()))}.</p><p>Use this address to sign in from now on.</p><p><b>Didn’t make this change?</b> Call Amtrak Customer Care at 1-800-USA-RAIL (1-800-872-7245).</p>`,
    note: 'Placeholder layout. NMA-21 says the notification content stays as in the existing template, which isn’t in this baseline.'
  }),
  'password-reset': (x = {}) => ({
    subject: 'Your Amtrak password was changed', story: 'NMA-992 AC1, AC3–AC5', to: x.to || 'alex.rivera@example.com',
    body: `<p>Hi ${esc(x.first || 'Alex')},</p><p>The password for your Amtrak Guest Rewards account was changed on <b>${esc(x.when || fmtStamp(NOW()))}</b>.</p><p>If you made this change, you don’t need to do anything.</p><div class="mail__alert"><p><b>Didn’t change your password? Act now.</b></p><ol><li>Reset your password again from the Amtrak app or Amtrak.com.</li><li>Call Amtrak Customer Care at 1-800-USA-RAIL (1-800-872-7245) so we can help secure your account.</li></ol></div><p>For your security, we never include your password in emails.</p>`,
    note: 'Contains no password, part of a password, hint or security answer (AC5). Final wording follows content guidance.'
  })
};
// Record an email for this demo. Delivery is simulated: "failed" means the send didn't go through.
function mockEmail(kind, x, status = 'delivered') {
  const e = Object.assign({ id: Math.random().toString(36).slice(2, 8), kind, status, at: fmtStamp(NOW()) }, EMAILS[kind](Object.assign({ when: fmtStamp(NOW()) }, x)));
  V().outbox = [e, ...(V().outbox || [])];
  return e;
}
// NMA-992: simulate the end of a password reset (completed or abandoned)
function simulateReset(done) {
  const d = D(), fail = $('#tbMail') && $('#tbMail').value === 'fail';
  if (!done) { toast('Reset not completed: no confirmation email is generated', 'info'); renderChrome(); return; } // AC2
  mockEmail('password-reset', { to: d.profile.email, first: d.profile.first }, fail ? 'failed' : 'delivered');
  toast(fail ? 'Password reset complete. The confirmation email failed to send; the failure was recorded.' : 'Password reset complete. A confirmation email was sent.');
  renderChrome();
}

// ---------- Reviewer list and preview (outside the device) ----------
function renderEmails() {
  const box = $('#emails'); if (!box) return;
  const out = V().outbox || [];
  const row = (id, title, sub, attr) => `<li><button class="ctl-mail" type="button" ${attr}><span class="ctl-mail__title">${esc(title)}</span><span class="ctl-mail__sub">${esc(sub)}</span></button></li>`;
  box.innerHTML = `<p class="nsmall">Mock emails are shown here only. Nothing is sent.</p>
    <p class="nlabel">Password reset (NMA-992)</p>
    <div class="ads-field"><label class="ads-field__label" for="tbMail">Email delivery</label><div class="ads-control ads-control--select"><select id="tbMail"><option value="ok">Delivered</option><option value="fail">Fails</option></select><span class="ads-icon ads-icon--chevron-down" aria-hidden="true"></span></div></div>
    <div class="ctl-mail__acts"><button class="ads-btn ads-btn--secondary ads-btn--sm" type="button" data-mail-reset="1">Complete a reset</button><button class="ads-btn ads-btn--tertiary ads-btn--sm" type="button" data-mail-reset="0">Abandon a reset</button></div>
    <p class="nlabel">Generated in this demo</p>
    ${out.length ? `<ul class="ctl-mails">${out.map(e => row(e.id, e.subject, `${e.status === 'failed' ? 'Not delivered · failure recorded' : 'To ' + e.to} · ${e.at}`, `data-mail-id="${e.id}"`)).join('')}</ul>` : '<p class="nsmall">None yet. Change your email in Profile, or complete a reset above.</p>'}
    <p class="nlabel">Email designs</p>
    <ul class="ctl-mails">${Object.keys(EMAILS).map(k => { const t = EMAILS[k](); return row(k, t.subject, t.story, `data-mail-kind="${k}"`); }).join('')}</ul>`;
  const keep = window.__tbMail; if (keep) $('#tbMail').value = keep;
}
function openEmail(e) {
  let dlg = $('#mailPreview');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'mailPreview'; dlg.className = 'mailprev'; dlg.setAttribute('aria-labelledby', 'mailSubj'); document.body.appendChild(dlg); }
  const failed = e.status === 'failed';
  dlg.innerHTML = `<div class="mailprev__bar"><span class="mailprev__tag">Mock email · not sent</span><button class="ads-icon-btn ads-icon-btn--sm ads-icon-btn--round" type="button" data-mail-close aria-label="Close email preview">${ic('close', 'ads-icon--sm')}</button></div>
    ${failed ? `<div class="ads-alert ads-alert--warning" role="status">${ic('alert-triangle', 'ads-alert__icon')}<div class="ads-alert__content"><p class="ads-alert__title">Delivery failed</p><p class="ads-alert__description ads-body-small">The password reset stayed successful. The failure was recorded for monitoring and support (NMA-992 AC6). The customer didn’t receive this email.</p></div></div>` : ''}
    <dl class="mailprev__meta"><dt>From</dt><dd>Amtrak &lt;no-reply@amtrak.example&gt;</dd><dt>To</dt><dd>${esc(e.to)}</dd><dt>Subject</dt><dd id="mailSubj">${esc(e.subject)}</dd>${e.at ? `<dt>Generated</dt><dd>${esc(e.at)}</dd>` : ''}</dl>
    <article class="mail"><div class="mail__head"><span class="mail__logo" role="img" aria-label="Amtrak">__LOGO_H__</span></div><div class="mail__body">${e.body}</div><p class="mail__foot">Amtrak Guest Rewards · This is an automated message.</p></article>
    <p class="mailprev__note">${esc(e.story)}. ${esc(e.note)}</p>`;
  dlg.showModal();
}
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-mail-reset], [data-mail-id], [data-mail-kind], [data-mail-close]'); if (!t) return;
  if (t.dataset.mailReset != null) { window.__tbMail = $('#tbMail').value; simulateReset(t.dataset.mailReset === '1'); }
  else if (t.dataset.mailId) openEmail((V().outbox || []).find(e => e.id === t.dataset.mailId));
  else if (t.dataset.mailKind) openEmail(Object.assign({ kind: t.dataset.mailKind, status: 'design' }, EMAILS[t.dataset.mailKind]()));
  else if (t.dataset.mailClose != null) $('#mailPreview').close();
});
document.addEventListener('change', ev => { if (ev.target.id === 'tbMail') window.__tbMail = ev.target.value; });
