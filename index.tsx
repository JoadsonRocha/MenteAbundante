import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro do Service Worker para PWA (Offline) e OneSignal
// Apontamos diretamente para o OneSignalSDKWorker.js que contém ambas as lógicas
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/OneSignalSDKWorker.js')
      .then(registration => {
        console.log('SW (PWA/OneSignal) registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('Info: Service Worker não registrado (normal em ambiente de preview/dev).', error);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);