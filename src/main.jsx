import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// No StrictMode: the prototype starts once and owns its markup after that
createRoot(document.getElementById('root')).render(<App />);
