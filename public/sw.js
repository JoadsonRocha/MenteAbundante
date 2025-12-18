// SW MÍNIMO E SEGURO - RISE MINDR
const CACHE_NAME = 'mindrise-v7';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  return;
});