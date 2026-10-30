// Writes the self-contained prototype page (prototypes/sprint4/index.html): one file, no network requests.
// Run with `npm run build:standalone`.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROTO, standalone } from './sprint4-assemble.mjs';

const out = standalone();
writeFileSync(join(PROTO, 'index.html'), out);
console.log('prototypes/sprint4/index.html', Math.round(out.length / 1024), 'KB');
