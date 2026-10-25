import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initLogoSync } from './utils/logoManager';

// Register PWA service worker for offline caching & standalone installability
registerSW({ immediate: true });
initLogoSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
