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


self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(cacheKeys) {
            return Promise.all(cacheKeys.map(function(cacheKey) {
                if (cacheKey !== cacheName) {
                    return caches.delete(cacheKey);
                }
            }));
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


self.addEventListener('push', function(e) {
    var notification = e.data ? e.data.json() : {
        title: 'Push Notification',
        body: 'Hey, you received a push notification!',
        icon: ''
    };
    var options = { tag: 'progressive-jungle-message' };
    e.waitUntil(
        self.registration.getNotifications(options).then(function(notifications) {
            if (notifications.length > 0) {
                notification.title = 'Progressive Jungle';
                notification.body = 'You have ' + (notifications.length + 1) + ' notifications.';
                notification.icon = '';
            }
            self.registration.showNotification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                tag: 'progressive-jungle-message'
            })
        })
    );
});
