const CACHE_NAME = "gastos-pwa-cache-v1.6.06"; // Incrementa la versión en cada actualización...
const urlsToCache = [
    "/ExpenseControl/",
    "/ExpenseControl/index.html",
    "/ExpenseControl/css/styles.css",
    "/ExpenseControl/css/footer.css",
    "/ExpenseControl/mdl/material.min.css",
    "/ExpenseControl/mdl/material.min.js",    
    "/ExpenseControl/js/app.js",
    "/ExpenseControl/js/db.js",
    "/ExpenseControl/js/chart.js",
    "/ExpenseControl/js/update_detector.js",
    "/ExpenseControl/css/pwa.css",
    "/ExpenseControl/js/pwa.js",
    "/ExpenseControl/manifest.json",
    "/ExpenseControl/assets/gastos.png"
];

// Instalación del Service Worker y almacenamiento en caché
self.addEventListener("install", (event) => {
    console.log('[SW] Instalando nueva versión:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando archivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] Archivos cacheados exitosamente');
                // NO hacer skipWaiting automáticamente - esperar instrucción del usuario
                console.log('[SW] Esperando instrucción del usuario para activar');
            })
    );
});

// Activación del Service Worker y eliminación de cachés antiguas
self.addEventListener("activate", (event) => {
    console.log('[SW] Activando nueva versión:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Caché limpiada, tomando control');
            return self.clients.claim(); // Toma control inmediatamente
        })
    );
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener("fetch", (event) => {
    // Solo interceptar requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, actualizar caché y devolver respuesta
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, servir desde caché
                console.log('[SW] Sirviendo desde caché:', event.request.url);
                return caches.match(event.request);
            })
    );
});

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);
    
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('[SW] Ejecutando skipWaiting por solicitud del usuario');
        self.skipWaiting();
        return;
    }
    
    if (event.data && event.data.action === 'getVersion') {
        // Usar MessageChannel para responder
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ version: CACHE_NAME });
        } else {
            // Fallback para casos sin MessageChannel
            event.source?.postMessage({ version: CACHE_NAME });
        }
        return;
    }
    
    if (event.data && event.data.action === 'checkUpdate') {
        console.log('[SW] Verificando actualizaciones por solicitud');
        self.registration.update().then(() => {
            console.log('[SW] Verificación de actualización completada');
        }).catch((error) => {
            console.error('[SW] Error al verificar actualización:', error);
        });
        return;
    }
});

// Notificar a los clientes cuando el SW está listo para tomar control
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando nueva versión:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando archivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] Archivos cacheados exitosamente');
                // Notificar a los clientes que hay una nueva versión disponible
                return self.clients.matchAll();
            })
            .then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NEW_VERSION_AVAILABLE',
                        version: CACHE_NAME
                    });
                });
                console.log('[SW] Clientes notificados sobre nueva versión');
            })
    );
});

// Limpiar recursos al ser reemplazado
self.addEventListener('redundant', () => {
    console.log('[SW] Service Worker marcado como redundante');
});
