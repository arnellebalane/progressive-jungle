if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
            console.info('Service worker successfully registered.', registration);
        })
        .catch(function(error) {
            console.error('Service worker registration failed.', error);
        });
}



$('.subscription-button').on('click', function() {
    if (!('serviceWorker' in navigator)) {
        return toast.open('Subscription failed. Your browser does not support service workers.');
    } else if (!('Notification' in window)) {
        return toast.open('Subscription failed. Your browser does not support notifications.');
    } else if (Notification.permission === 'denied') {
        return toast.open('Subscription failed. Notifications are blocked in this browser.');
    } else if (!('PushManager' in window)) {
        return toast.open('Subscription failed. Your browser does not support push notifications.');
    }

    var button = $(this);
    button.addClass('button--loading');

    navigator.serviceWorker.getRegistration().then(function(registration) {
        registration.pushManager.getSubscription().then(function(subscription) {
            if (subscription) {
                return subscription.unsubscribe().then(function() {
                    toast.open('You are now unsubscribed from push notifications.');
                    button.text('Subscribe to Push Notifications').removeClass('button--loading');
                });
            }
            registration.pushManager.subscribe({ userVisibleOnly: true })
                .then(function(subscription) {
                    console.log(subscription);
                    toast.open('You are now subscribed to push notifications.');
                    button.text('Unsubscribe from Push Notifications').removeClass('button--loading');
                })
                .catch(function(error) {
                    toast.open(error.message);
                    button.removeClass('button--loading');
                });
        });
    });
});
