if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        console.info('Service worker successfully registered.', registration);

        registration.pushManager.getSubscription().then(function(subscription) {
            if (subscription) {
                $('.subscription-button').text('Unsubscribe from Push Notifications').removeClass('button--loading');
            } else {
                $('.subscription-button').text('Subscribe to Push Notifications').removeClass('button--loading');
            }
        }).catch(function(error) {
            console.error('Error getting push notification subscription.', error);
        });
    }).catch(function(error) {
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
                    removeSubscriptionFromServer(subscription);
                    toast.open('You are now unsubscribed from push notifications.');
                    button.text('Subscribe to Push Notifications').removeClass('button--loading');
                });
            }
            registration.pushManager.subscribe({ userVisibleOnly: true })
                .then(function(subscription) {
                    saveSubscriptionToServer(subscription);
                    toast.open('You are now subscribed to push notifications.');
                    button.text('Unsubscribe from Push Notifications').removeClass('button--loading');
                })
                .catch(function(error) {
                    toast.open(error.message);
                    button.removeClass('button--loading');
                    console.error('Error subscribing to push notifications.', error);
                });
        }).catch(function(error) {
            console.error('Error getting push notification subscription.', error);
        });
    }).catch(function(error) {
        console.error('Error getting registration.', error);
    });
});



var form = $('.message-form');
var messageInput = form.find('.form__input');
var messageButton = form.find('.sendmessage-button');



$('.message-form').on('submit', function(e) {
    e.preventDefault();
    var message = messageInput.val().trim();

    if (messageButton.hasClass('button--loading') || message.length === 0) {
        return null;
    }

    messageInput.prop('readonly', true);
    messageButton.addClass('button--loading');

    if ('SyncManager' in window) {
        var messageData = {
            name: localStorage.getItem('name'),
            avatar: localStorage.getItem('avatar'),
            message: message,
            senderId: localStorage.getItem('subscriptionId')
        };
        saveMessageToIndexedDb(messageData).on('complete', function(data) {
            navigator.serviceWorker.getRegistration().then(function(registration) {
                registration.sync.register('progressive-jungle-message')
                    .then(function() {
                        messageInput.val('');
                        messageInput.prop('readonly', false);
                        messageButton.removeClass('button--loading');
                    })
                    .catch(function(error) {
                        sendMessageTraditionally(message);
                        console.error('Error registering for background sync.', error);
                    });
            }).catch(function(error) {
                console.error('Error getting registration.', error);
            });
        });
    } else {
        sendMessageTraditionally(message);
    }
});



function sendMessageTraditionally(message) {
    messageInput.prop('readonly', true);
    messageButton.addClass('button--loading');
    message = sendMessageToEveryone(message);

    message.on('sent', function(data) {
        messageInput.val('');
        messageInput.prop('readonly', false);
        messageButton.removeClass('button--loading');
        toast.open('Message successfully sent.');
    });

    message.on('error', function() {
        messageInput.prop('readonly', false);
        messageButton.removeClass('button--loading');
        toast.open('Message sending failed.');
    });
}
