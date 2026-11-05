import { useEffect, useRef } from 'react';
import { css, js, body, title } from 'virtual:sprint4';

// Mounts the Sprint 4 prototype. Its source lives in prototypes/sprint4 (plain JavaScript sharing globals),
// so it runs once as a classic script after its CSS and shell markup are in place. React only hosts it.
export default function App() {
  const host = useRef(null);
  useEffect(() => {
    if (window.__sprint4Started) return;
    window.__sprint4Started = true;
    // Google Maps for the station map: the browser key comes from .env.local (never committed). The standalone
    // prototypes/sprint4/index.html is built without it and uses the placeholder map. See GOOGLE-MAPS.md.
    window.S4_CONFIG = Object.assign({}, window.S4_CONFIG, {
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''
    });
    document.title = title;
    const style = document.createElement('style');
    style.dataset.sprint4 = '';
    style.textContent = css;
    document.head.appendChild(style);
    host.current.innerHTML = body;
    const script = document.createElement('script');
    script.textContent = js;
    document.body.appendChild(script);
  }, []);
  return <div ref={host} style={{ display: 'contents' }} />;
}
