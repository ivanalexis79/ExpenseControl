self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("app-cache").then((cache) => {
            return cache.addAll(["/", "/index.html", "/css/styles.css", "/js/app.js", "/js/chart.js"]);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
