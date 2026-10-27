import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { unlockAudioOnFirstTap } from './lib/audio';
import { store } from './lib/store';
import { startAutoSync } from './lib/sync';
import './styles.css';

unlockAudioOnFirstTap();
// Ask the browser not to clear your cards when storage runs low.
navigator.storage?.persist?.().catch(() => undefined);
store.init().then(startAutoSync, err => console.error('Could not open the local database', err));

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
