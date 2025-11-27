import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos './sw.js' (relativo) para evitar erros de origem cruzada em ambientes de preview
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        // Em ambientes de desenvolvimento/preview, falhas de SW são comuns devido a iframes e SSL
        console.log('Info: Service Worker não registrado (normal em ambiente de preview).');
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);