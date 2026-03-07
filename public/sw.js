const CACHE_NAME = 'levelone-cache-v7'; // Bumped version to v7/fix-extension-error
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.png',
    '/icon-512.png',
    '/globals.css'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('[SW] Cache addAll failed, attempting individual:', err);
                return Promise.all(
                    ASSETS_TO_CACHE.map(url => cache.add(url).catch(e => console.warn(`[SW] Failed ${url}:`, e)))
                );
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        clients.claim().then(() => {
            return caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            console.log('[SW] Clearing old cache:', key);
                            return caches.delete(key);
                        }
                    })
                );
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // 1. For HTML Navigation (Pages): Network First, then Cache (Fallback)
    // This ensures users always get the latest deployment if online.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with new version
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => {
                    // Offline? Serve cached version
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. For GET requests (Assets, CSS, Images): Cache First, then Network
    // EXCLUDE: API calls, Supabase requests, and non-http schemes (e.g. chrome-extension)
    const url = new URL(event.request.url);
    const isSupabaseProxy = url.pathname.startsWith('/rest/') ||
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/storage/') ||
        url.pathname.startsWith('/realtime/') ||
        url.hostname.includes('supabase');

    if (
        event.request.method === 'GET' &&
        url.protocol.startsWith('http') && // Only cache http/https
        !url.pathname.startsWith('/api/') &&
        !isSupabaseProxy
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // 3. For POST/PUT/DELETE or API requests: Do NOT intercept.
    // Let the browser handle these directly to ensure request bodies (streams) are preserved.
    return;
});
