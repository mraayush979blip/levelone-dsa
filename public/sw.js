self.addEventListener('install', (e) => {
    // Force the new service worker to activate immediately 
    // without waiting for the old one to shut down.
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        // Take control of all pages immediately 
        self.clients.claim().then(() => {
            // Nuke ALL CACHES belonging to levelone-cache-* or anything else
            return caches.keys().then(keys => {
                return Promise.all(
                    keys.map(key => {
                        console.log('[SW-Nuke] Destroying old cache completely:', key);
                        return caches.delete(key);
                    })
                );
            });
        }).then(() => {
            // After nuking caches, Unregister the service worker completely.
            self.registration.unregister().then(function (boolean) {
                console.log('[SW-Nuke] Service Worker force-unregistered: ', boolean);
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // 100% Pass-Through, no caching at all, to guarantee fresh files
    event.respondWith(fetch(event.request));
});
