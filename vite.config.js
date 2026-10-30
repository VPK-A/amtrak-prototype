import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { assemble, WATCHED } from './scripts/sprint4-assemble.mjs';

// Serves the Sprint 4 prototype source files as one virtual module (CSS, shell markup and script),
// and reloads the page when any of them changes.
function sprint4() {
  const id = 'virtual:sprint4', resolved = '\0' + id;
  return {
    name: 'sprint4',
    resolveId: s => (s === id ? resolved : null),
    load(s) {
      if (s !== resolved) return null;
      WATCHED.forEach(f => this.addWatchFile(f));
      const { css, js, body, title } = assemble();
      return `export const css = ${JSON.stringify(css)};\nexport const js = ${JSON.stringify(js)};\nexport const body = ${JSON.stringify(body)};\nexport const title = ${JSON.stringify(title)};`;
    },
    configureServer(server) {
      server.watcher.add(WATCHED);
      server.watcher.on('change', f => {
        if (!WATCHED.includes(f)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sprint4()],
  // `dist/` holds the design system's generated tokens, so the app builds to `build/`
  build: { outDir: 'build', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
  server: { port: 5173 }
});
