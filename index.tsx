import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Critical: Render UI first
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Deferred Service Worker registration to prevent blocking the UI thread
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Use current window location to safely register without assuming root /
      const swUrl = './sw.js';
      const fakeOsUrl = './OneSignalSDKWorker.js';
      
      navigator.serviceWorker.register(swUrl).catch(() => {
        // Silent catch for sandboxed environments
      });
      
      navigator.serviceWorker.register(fakeOsUrl).catch(() => {
        // Silent catch for sandboxed environments
      });
    }, 5000);
  });
}
