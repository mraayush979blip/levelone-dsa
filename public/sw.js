const CACHE_VERSION = 'levelone-v2.4';

self.addEventListener('install', (e) => {
    // Activate immediately without waiting for old SW
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        // Clean up old caches from previous versions
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION)
                    .map(key => {
                        console.log('[SW] Cleaning old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    // Network-first for HTML pages and API calls (always fresh)
    if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for static assets (JS, CSS, images, fonts)
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/) ||
        url.pathname.startsWith('/_next/static/')
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    // Only cache successful responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then(cache => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Default: network-first for everything else
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
