import './styles/bootstrap-lite.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './i18n';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA support
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
