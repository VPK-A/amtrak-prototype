// Assembles the Sprint 4 prototype from its source files. Used by:
//   - vite.config.js (the npm dev server and build, e.g. for Figma Make), and
//   - scripts/build-sprint4.mjs (the self-contained prototypes/sprint4/index.html).
// The prototype is plain JavaScript that shares globals across files, so the files are joined in this order
// and run as one classic script. The order is part of the behavior (later files wrap earlier actions).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marked } from 'marked';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PROTO = join(ROOT, 'prototypes/sprint4');
export const CSS_FILES = ['tokens', 'icons', 'components'].map(n => join(ROOT, `css/${n}.css`)).concat(join(PROTO, 'proto.css'), join(PROTO, 'ads-next.css'));
export const JS_ORDER = ['data', 'core', 'screens', 'clear', 'flighty', 'guided', 'travelers', 'motion', 'interact', 'fields', 'profile', 'emails', 'familiar', 'overview', 'compact', 'chrome', 'boot'];
export const JS_FILES = JS_ORDER.map(n => join(PROTO, `${n}.js`));
export const SHELL = join(PROTO, 'src.html');
export const HANDOFF = join(PROTO, 'HANDOFF.md');
export const LOGO = join(ROOT, 'logos/travelmark-horizontal.svg');
// Book tab card photos, inlined as data URIs so the standalone page stays self-contained
export const IMAGES = { __IMG_TRIPS__: join(PROTO, 'img/recommended-trips.jpg'), __IMG_NEAR__: join(PROTO, 'img/favorite-stations.jpg') };
export const WATCHED = [...CSS_FILES, ...JS_FILES, SHELL, HANDOFF, LOGO, ...Object.values(IMAGES)];

const read = f => readFileSync(f, 'utf8');

export function assemble() {
  const logo = read(LOGO).trim().replace(/width="\d+" height="\d+"/, 'aria-hidden="true" focusable="false"');
  if (logo.includes('`') || logo.includes('${')) throw new Error('logo SVG would break the template literals it is inserted into');
  const css = CSS_FILES.map(read).join('\n');
  let js = JS_FILES.map(read).join('\n').split('__LOGO_H__').join(logo);
  for (const [token, file] of Object.entries(IMAGES)) js = js.split(token).join('data:image/jpeg;base64,' + readFileSync(file).toString('base64'));
  const handoff = marked.parse(read(HANDOFF), { gfm: true });
  const shell = read(SHELL).replace('<!--__HANDOFF__-->', () => handoff);
  const title = (shell.match(/<title>([\s\S]*?)<\/title>/) || [, 'Sprint 4 Exploration'])[1];
  const body = shell.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script>[\s\S]*?<\/script>\s*$/, '').trim();
  return { css, js, body, title, shell };
}

// The self-contained page: everything inlined, no network requests
export function standalone() {
  const { js, shell } = assemble();
  return shell.replace('/*__ADS_CSS__*/', () => CSS_FILES.slice(0, 3).map(read).join('\n'))
    .replace('/*__PROTO_CSS__*/', () => CSS_FILES.slice(3).map(read).join('\n'))
    .replace('/*__JS__*/', () => js);
}
