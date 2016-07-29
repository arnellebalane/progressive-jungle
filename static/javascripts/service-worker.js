var cacheName = 'cache-v2';
var urlsToCache = [
    '/',
    '/offline',
    '/static/stylesheets/progressive-jungle.css',
    '/static/javascripts/progressive-jungle.js',
    '/static/javascripts/main.js',
    '/static/javascripts/jquery.js',
    '/static/images/home.png',
    '/static/images/logout.png',
    '/static/images/messages.png',
    '/static/images/offline.png',
    '/static/fonts/quicksand/bold.woff2',
    '/static/fonts/quicksand/regular.woff2'
];


self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(cacheName)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.info('Caching completed for cache:', cacheName);
                self.skipWaiting();
            })
            .catch(function(error) {
                console.error('Caching failed for cache:', cacheName, error);
            })
    );
});


self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.open(cacheName).then(function(cache) {
            return cache.match(e.request).then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(e.request).catch(function() {
                    return cache.match('/offline');
                });
            });
        })
    );
});
