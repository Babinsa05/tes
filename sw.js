const VERSION = '2.1.1';
const CACHE_NAME = `canvaspro-${VERSION}-${Date.now()}`;

const ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './manifest.json',  // opsional jika ada
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete, skip waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => {
      console.log('[SW] Activate complete, claim clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first untuk index.html dan manifest
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/site.webmanifest' || url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          let responseToCache = response.clone();
          const contentType = response.headers.get('content-type') || '';

          // Tambahkan ticker kecil di bawah tombol-tombol tanpa mengubah skrip halaman.
          if ((url.pathname === '/' || url.pathname === '/index.html') && contentType.includes('text/html')) {
            const html = await response.clone().text();
            const ticker = `\n    <style>\n      .developer-ticker{width:100%;overflow:hidden;margin:4px auto 0;white-space:nowrap;text-align:center;color:#176b32;font-size:11px;line-height:1.4}\n      .developer-ticker span{display:inline-block;padding-left:100%;animation:developerTicker 14s linear infinite}\n      @keyframes developerTicker{to{transform:translateX(-100%)}}\n      @media(prefers-reduced-motion:reduce){.developer-ticker span{animation:none;padding-left:0}}\n    </style>\n    <div class="developer-ticker" aria-label="Pengembang"><span>Pengembang Serka I Nyoman Arta</span></div>`;
            const updatedHTML = html.replace('</div>\n    \n</div>', `</div>${ticker}\n    \n</div>`);
            if (updatedHTML !== html) {
              const headers = new Headers(response.headers);
              headers.delete('content-length');
              responseToCache = new Response(updatedHTML, {
                status: response.status,
                statusText: response.statusText,
                headers
              });
            }
          }

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache.clone());
          });
          return responseToCache;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
      .catch(() => {
        // Fallback
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log(`[SW] CanvasPRO ${VERSION} loaded`);
console.log('[SW] Developer: Koramil Sukasada');
