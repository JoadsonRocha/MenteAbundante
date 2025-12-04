import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const ONESIGNAL_APP_ID = 'f0d535c5-1b47-48be-89df-7bca30bf2b38';

const initOneSignal = () => {
  if (typeof window === 'undefined') return;
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  if (!isSecure) return;

  const os = (window as any).OneSignal || [];
  (window as any).OneSignal = os;
  os.push(() => {
    (window as any).OneSignal?.init?.({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });
  });

  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
  script.async = true;
  document.head.appendChild(script);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro do Service Worker para PWA (Offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW (PWA) registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('Info: Service Worker não registrado (normal em ambiente de preview/dev).', error);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);

initOneSignal();

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
