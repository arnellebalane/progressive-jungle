if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
            console.info('Service worker successfully registered.', registration);
        })
        .catch(function(error) {
            console.error('Service worker registration failed.', error);
        });
}
