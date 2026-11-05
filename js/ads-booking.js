/* ADS booking components (iOS · New booking modal, Figma Sprint 4 node 3295:51258).
   Markup renderers for the components styled in css/components.css › Booking components:
     sheetHeader  · navy brand header: close, title, brand arrows (or plain)
     stationGroup · From and To stacked in one field group, with the swap button
     dateGroup    · two date fields side by side (value with icon and weekday, or an "add" prompt)
     selectRow    · field label above a row that opens a picker (icon, value or prompt, supporting text, chevron)
     pointsRow    · title, supporting text and a Switch
   Trip-type tabs are ads-tabs ads-tabs--fill; the action footer is ads-actionfooter around a pointsRow and a Button.
   States: selected (aria-selected / aria-pressed), focus (:focus-visible), disabled, error (aria-invalid + helper).
   Used by the Sprint 4 prototype (scripts/sprint4-assemble.mjs) and the DS catalog (scripts/build-docs.py), so the
   screen and its examples always share markup. __ARROW_RED__ / __ARROW_BLUE__ are replaced with the brand arrow SVGs
   from logos/ at build time. Plain script: defines globals. */
const bkEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bkIc = (n, cls = '') => `<span class="ads-icon ads-icon--${n}${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;

// Station field group: From and To stacked in one ADS field group, with the circular swap button on the divider
function stationGroup(o) {
  const fld = f => {
    const v = o[f] || {}, err = o.errors && o.errors[f];
    return `<button class="ads-fieldgroup__field" type="button" ${v.attrs || ''} aria-label="${bkEsc(v.label)}: ${v.code ? bkEsc(`${v.city}, ${v.facility}`) : 'not chosen'}"${err ? ` aria-invalid="true" aria-describedby="${v.errId}"` : ''}${v.expanded ? ' aria-expanded="true"' : ''}><span class="ads-fieldgroup__label" aria-hidden="true">${bkEsc(v.label)}</span><span class="ads-stationgroup__value">${v.code ? `<span class="ads-stationgroup__code">${bkEsc(v.code)}</span><span class="ads-stationgroup__lines"><span class="ads-stationgroup__city">${bkEsc(v.city)}</span><span class="ads-stationgroup__facility">${bkEsc(v.facility)}</span></span>` : `<span class="ads-fieldgroup__placeholder">${bkEsc(v.placeholder || '')}</span>`}</span></button>`;
  };
  const errs = ['from', 'to'].filter(f => o.errors && o.errors[f]).map(f => `<p class="ads-helper ads-helper--error" id="${o[f].errId}">${bkIc('alert-diamond')}<span>${bkEsc(o.errors[f])}</span></p>`).join('');
  return `<div class="ads-fieldwrap"><div class="ads-fieldgroup ads-stationgroup${errs ? ' ads-fieldgroup--error' : ''}">${fld('from')}${fld('to')}<button class="ads-swap-btn" type="button" ${o.swapAttrs || ''} aria-label="${bkEsc(o.swapLabel || 'Swap from and to')}"${o.swapDisabled ? ' disabled' : ''}>${bkIc('trip-swap-vertical')}</button></div>${errs}</div>`;
}
// Date group: two fields side by side. A field is { label, value, sub, icon, attrs } or an "add" prompt.
function dateGroup(o) {
  const fld = v => `<button class="ads-fieldgroup__field" type="button" ${v.attrs || ''} aria-label="${bkEsc(v.aria || v.label)}"${v.err ? ` aria-invalid="true" aria-describedby="${o.errId}"` : ''}${v.expanded ? ' aria-expanded="true"' : ''}><span class="ads-fieldgroup__label" aria-hidden="true">${bkEsc(v.label)}</span><span class="ads-dategroup__value">${v.value ? bkEsc(v.value) : `<span class="ads-fieldgroup__placeholder">${bkEsc(v.placeholder || '')}</span>`}${v.icon ? bkIc(v.icon) : ''}</span>${v.sub ? `<span class="ads-dategroup__sub">${bkEsc(v.sub)}</span>` : ''}</button>`;
  return `<div class="ads-fieldwrap"><div class="ads-fieldgroup ads-dategroup${o.error ? ' ads-fieldgroup--error' : ''}">${fld(o.start)}${fld(o.end)}</div>${o.error ? `<p class="ads-helper ads-helper--error" id="${o.errId}">${bkIc('alert-diamond')}<span>${bkEsc(o.error)}</span></p>` : ''}</div>`;
}
// Selector row: field label above a 53px row with an optional leading icon, the value or prompt, supporting
// text and a chevron. Opens a picker; the accessible name carries the label and the value.
function selectRow(o) {
  const lid = o.id + '-l';
  return `<div class="ads-selectrow${o.cls ? ' ' + o.cls : ''}"><span class="ads-selectrow__label" id="${lid}">${bkEsc(o.label)}${o.marker || ''}${o.labelTrail || ''}</span><button class="ads-selectrow__btn" type="button" id="${o.id}" ${o.attrs || ''} aria-labelledby="${lid} ${o.id}-v"${o.describedby ? ` aria-describedby="${o.describedby}"` : ''}${o.invalid ? ' aria-invalid="true"' : ''}${o.disabled ? ' disabled' : ''}>${o.icon ? bkIc(o.icon) : ''}<span class="ads-selectrow__text" id="${o.id}-v"><span class="ads-selectrow__value">${bkEsc(o.value)}</span>${o.sub ? `<span class="ads-selectrow__sub">${bkEsc(o.sub)}</span>` : ''}</span>${bkIc('chevron-right', 'ads-selectrow__chev')}</button>${o.after || ''}</div>`;
}
// Points payment row: title, balance and an ADS Switch that acts immediately
function pointsRow(o) {
  return `<div class="ads-pointsrow"><span class="ads-pointsrow__text"><span class="ads-pointsrow__title" id="${o.id}-l">${bkEsc(o.title)}</span>${o.sub ? `<span class="ads-pointsrow__sub" id="${o.id}-h">${bkEsc(o.sub)}</span>` : ''}</span><label class="ads-switch"><input type="checkbox" role="switch" id="${o.id}" ${o.attrs || ''} aria-labelledby="${o.id}-l"${o.sub ? ` aria-describedby="${o.id}-h"` : ''}${o.checked ? ' checked' : ''}${o.disabled ? ' disabled' : ''}><span class="ads-switch__track"></span></label></div>`;
}
// Sheet header: close, title (H2) and the brand arrows
function sheetHeader(o) {
  return `<header class="ads-sheet-header${o.plain ? ' ads-sheet-header--plain' : ''}"><button class="ads-icon-btn ads-icon-btn--sm ads-sheet-header__close" type="button" ${o.closeAttrs || ''} aria-label="${bkEsc(o.closeLabel || 'Close')}">${bkIc('close')}</button><h2 class="ads-sheet-header__title" id="${o.id}" tabindex="-1" data-title>${bkEsc(o.title)}</h2>${o.plain ? '' : `<span class="ads-sheet-header__brand" aria-hidden="true"><span class="ads-sheet-header__arrow ads-sheet-header__arrow--top">__ARROW_RED__<i></i></span><span class="ads-sheet-header__arrow ads-sheet-header__arrow--bottom">__ARROW_BLUE__<i></i></span></span>`}</header>`;
}
