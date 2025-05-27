const CACHE_NAME = "gastos-pwa-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/css/styles.css",
    "/js/app.js",
    "/js/db.js",
    "/js/chart.js",
    "/manifest.json",
    "/assets/icon.png"
];

// Instalación del Service Worker y almacenamiento en caché
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Activación del Service Worker y eliminación de cachés antiguas
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar solicitudes y servir desde caché
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
