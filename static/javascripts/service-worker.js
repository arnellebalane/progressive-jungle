var cacheName = 'cache-v1';
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
