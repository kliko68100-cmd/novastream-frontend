import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Appliquer le thème depuis le store dès le démarrage
const stored = localStorage.getItem('novastream-user-v5');
if (stored) {
  try {
    const data = JSON.parse(stored);
    const theme = data?.state?.theme ?? 'dark';
    const accent = data?.state?.accentColor ?? 'red';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
