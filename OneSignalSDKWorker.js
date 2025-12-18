// WORKER FAKE PARA SUBSTITUIR ONESIGNAL E EVITAR ERROS DE DOMÍNIO
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {});