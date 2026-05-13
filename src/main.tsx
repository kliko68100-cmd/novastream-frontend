import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// PWA registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/sw.js');
    wb.register();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
