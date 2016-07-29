var EventEmitter = (function() {
    function EventEmitter() {
        this.observers = {};
    }

    EventEmitter.prototype.on = function(eventname, callback) {
        if (!(eventname in this.observers)) {
            this.observers[eventname] = [];
        }
        this.observers[eventname].push(callback);
    };

    EventEmitter.prototype.off = function(eventname, callback) {
        if (!(eventname in this.observers)) {
            return null;
        } else if (callback) {
            var index = this.observers[eventname].indexOf(callback);
            this.observers[eventname].splice(index, 1);
        }
        if (!callback || this.observers[eventname].length === 0) {
            delete this.observers[eventname];
        }
    };

    EventEmitter.prototype.emit = function(eventname) {
        if (!(eventname in this.observers)) {
            return null;
        }
        var parameters = Array.prototype.slice.call(arguments, 1);
        this.observers[eventname].forEach(function(callback) {
            callback.apply(null, parameters);
        });
    };

    return EventEmitter;
})();


var toast = (function() {
    var element = $('.toast');
    var timer = null;

    function open(message) {
        element.text(message);
        element.addClass('toast--open');

        clearTimeout(timer);
        timer = setTimeout(close, 3000);
    }

    function close() {
        clearTimeout(timer);
        element.removeClass('toast--open');
    }

    return { open: open, close: close };
})();


var messenger = (function() {
    function send(message) {
        var emitter = new EventEmitter();

        $.ajax({
            url: '/send-message',
            type: 'POST',
            data: {
                name: localStorage.getItem('name'),
                avatar: localStorage.getItem('avatar'),
                message: message,
                senderId: localStorage.getItem('subscriptionId')
            },
            success: function(response) {
                emitter.emit('sent', response);
            },
            error: function(error) {
                emitter.emit('error', error);
            }
        });

        return emitter;
    }

    return { send: send };
})();


var messageslist = (function() {
    var container = $('.messages');

    function add(data) {
        var message = $('<div class="message"></div>');
        var avatar = $('<img class="message__avatar">');
        var body = $('<div class="message__body"></div>');
        var sender = $('<span class="message__sender"></span>');

        avatar.attr('src', data.avatar);
        sender.text(data.name);

        message.append(avatar).append(body);
        body.append(sender).append('<p>' + data.message + '</p>');
        container.prepend(message);

        setTimeout(function() {
            message.addClass('message--show');
        }, 10);
    }

    return { add: add };
})();


var notifications = (function() {
    function subscribe(subscription) {
        var emitter = new EventEmitter();
        var subscriptionId = subscription.endpoint.replace(/.*\//g, '');

        $.ajax({
            url: '/subscribe',
            type: 'POST',
            data: JSON.parse(JSON.stringify(subscription)),
            success: function(response) {
                localStorage.setItem('subscriptionId', subscriptionId);
                emitter.emit('subscribed', response);
            },
            error: function(error) {
                emitter.emit('error', error);
            }
        });

        return emitter;
    }

    function unsubscribe(subscription) {
        var emitter = new EventEmitter();

        $.ajax({
            url: '/unsubscribe',
            type: 'POST',
            data: JSON.parse(JSON.stringify(subscription)),
            success: function(response) {
                localStorage.removeItem('subscriptionId');
                emitter.emit('subscribed', response);
            },
            error: function(error) {
                emitter.emit('error', error);
            }
        });

        return emitter;
    }

    return { subscribe: subscribe, unsubscribe, unsubscribe };
})();


var idb = (function() {
    var request = indexedDB.open('progressive-jungle', 1);
    var db = null;

    request.onupgradeneeded = function(e) {
        var db = e.target.result;
        var messagesStore = db.createObjectStore('messages',
            { autoIncrement: true })
    };
    request.onsuccess = function(e) {
        db = e.target.result;
    };
    request.onerror = function() {
        toast.open('IndexedDB failed to initialize.');
    };

    function save(store, data) {
        if (!db) {
            return toast.open('IndexedDB is not yet ready.');
        }
        var emitter = new EventEmitter();

        var objectStore = db.transaction(store, 'readwrite')
            .objectStore(store);
        objectStore.add(data);
        objectStore.onsuccess = function(e) {
            emitter.emit('complete', e);
        };

        return emitter;
    }

    function all(store) {
        if (!db) {
            return toast.open('IndexedDB is not yet ready.');
        }
        var emitter = new EventEmitter();
        var objects = [];

        var objectStore = db.transaction(store).objectStore(store);
        objectStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                objects.push(cursor.value);
                cursor.continue();
            } else {
                emitter.emit('complete', objects);
            }
        };

        return emitter;
    }

    function clear(store) {
        if (!db) {
            return toast.open('IndexedDB is not yet ready.');
        }
        var emitter = new EventEmitter();

        var objectStore = db.transaction(store).objectStore(store);
        objectStore.clear().onsuccess = function(e) {
            emitter.emit('complete', e);
        };

        return emitter;
    }

    return { save: save, all: all, clear: clear };
})();





var sendMessageToEveryone = messenger.send;
var saveSubscriptionToServer = notifications.subscribe;
var removeSubscriptionFromServer = notifications.unsubscribe;
var saveMessageToIndexedDb = idb.save.bind(null, 'messages');
var getAllMessagesInIndexedDb = idb.all.bind(null, 'messages');
var clearMessagesInIndexedDb = idb.clear.bind(null, 'messages');





var name = localStorage.getItem('name');
if (name !== 'null') {
    $('.login-screen').addClass('hidden');
    $('.message-screen').removeClass('screen--minimized');
    $('.form__title strong').text(name);
}


function login(user) {
    var profile = user.getBasicProfile();
    localStorage.setItem('name', profile.getName());
    localStorage.setItem('avatar', profile.getImageUrl());
    $('.form__title strong').text(localStorage.getItem('name'));

    toast.open('You are now logged in.');
    $('.login-screen').addClass('screen--maximized');
    $('.message-screen').removeClass('screen--minimized');
}





$('.logout-button').on('click', function() {
    var button = $(this);

    if (button.hasClass('button--loading')) {
        return null;
    }

    button.addClass('button--loading');
    toast.close();

    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        toast.open('You are now logged out.');
        $('.login-screen').removeClass('screen--maximized hidden');
        $('.message-screen').addClass('screen--minimized');
        button.removeClass('button--loading');

        localStorage.removeItem('name');
        localStorage.removeItem('avatar');
    });
});


$('.message-form').on('submit', function(e) {
    e.preventDefault();

    var form = $(this);
    var messageInput = form.find('.form__input');
    var messageButton = form.find('.sendmessage-button');
    var message = messageInput.val().trim();

    if (messageButton.hasClass('button--loading') || message.length === 0) {
        return null;
    }

    messageInput.prop('readonly', true);
    messageButton.addClass('button--loading');
    message = sendMessageToEveryone(message);

    message.on('sent', function() {
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
});
