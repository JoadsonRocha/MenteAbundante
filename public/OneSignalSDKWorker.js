try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  // Ignora erro de script se estiver offline ou bloqueado, permitindo que o PWA continue funcionando.
  console.warn("OneSignal Worker Import Failed (Offline or Blocked):", e);
}

// --- LÓGICA DO PWA (CACHE & OFFLINE) ---
const CACHE_NAME = 'mindrise-v5-store-ready';
// Apenas assets CRÍTICOS para o app abrir.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('SW: Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e Limpeza
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // console.log('SW: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch com Estratégia de Fallback para SPA
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requisições externas e OneSignal
  if (!url.origin.startsWith(self.location.origin) || url.href.includes('onesignal.com')) {
    return;
  }

  // Ignorar API calls locais se houver
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Estratégia para Navegação (HTML): Network First, depois Cache, depois Fallback para index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              // CRUCIAL: Retorna index.html se não conseguir carregar a rota (SPA Navigation Fallback)
              return caches.match('/index.html')
                .then(indexResponse => {
                     // Fallback final para evitar "Uncaught (in promise)" se nem o index.html estiver no cache
                     return indexResponse || new Response("Offline - Page not found. Please connect to internet.", { 
                        status: 404, 
                        headers: {'Content-Type': 'text/plain'} 
                     });
                });
            });
        })
    );
    return;
  }

  // Estratégia para Assets (JS, CSS, Imagens): Cache First, depois Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache dinâmico de novos arquivos
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});