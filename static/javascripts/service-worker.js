var cacheName = 'cache-v7';
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
        }).catch(function(error) {
            console.error('Error getting cache keys.', error);
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
                    if (e.request.mode === 'navigate') {
                        return cache.match('/offline');
                    }
                });
            }).catch(function(error) {
                console.error('Error getting request match.', error);
            });
        }).catch(function(error) {
            console.error('Error opening cache.', error);
        })
    );
});


self.addEventListener('push', function(e) {
    var notification = e.data ? e.data.json() : {
        title: 'Progressive Jungle',
        body: 'Hey, you received a push notification!',
        icon: '/static/images/default-icon.png'
    };
    e.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            tag: 'progressive-jungle-message'
        })
    );
});


self.addEventListener('notificationclick', function(e) {
    var options = { tag: 'progressive-jungle-message' };
    e.waitUntil(
        self.registration.getNotifications(options).then(function(notifications) {
            notifications.forEach(function(notification) {
                notification.close();
            });
            return self.clients.openWindow('/messages');
        })
    );
});


/** @TODO this sucks, must refactor this ugh **/
self.addEventListener('sync', function(e) {
    if (e.tag === 'progressive-jungle-message') {
        e.waitUntil(
            Promise.resolve().then(function() {
                return new Promise(function(resolve, reject) {
                    var request = indexedDB.open('progressive-jungle', 1);
                    request.onsuccess = function(e) {
                        var db = e.target.result;
                        var objects = [];
                        var objectStore = db.transaction('messages').objectStore('messages');
                        objectStore.openCursor().onsuccess = function(e) {
                            var cursor = e.target.result;
                            if (cursor) {
                                objects.push(cursor.value);
                                cursor.continue();
                            } else {
                                resolve(objects);
                            }
                        };
                    };
                });
            }).then(function(messages) {
                return Promise.all(messages.map(function(message) {
                    var request = new Request('/send-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message)
                    });
                    return fetch(request);
                }));
            }).then(function() {
                return new Promise(function(resolve, reject) {
                    var request = indexedDB.open('progressive-jungle', 1);
                    request.onsuccess = function(e) {
                        var db = e.target.result;
                        var objectStore = db.transaction('messages', 'readwrite').objectStore('messages');
                        objectStore.clear().onsuccess = resolve;
                    };
                });
            }).catch(function(error) {
                console.error('Error inside the worst code ever.', error);
            })
        );
    }
});
