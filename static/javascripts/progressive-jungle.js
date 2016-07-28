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
                message: message
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





var name = localStorage.getItem('name');
if (name !== 'null') {
    $('.login-screen').addClass('hidden');
    $('.message-screen').removeClass('screen--minimized');
    $('.form__title strong').text(name);
}


$('.login-button').on('click', function() {
    if ($(this).hasClass('button--loading')) {
        return null;
    }

    $(this).addClass('button--loading');
    toast.close();

    setTimeout(function() {
        if (Math.random() < 0.5) {
            toast.open('You are now logged in.');
            $('.login-screen').addClass('screen--maximized');
            $('.message-screen').removeClass('screen--minimized');
            $(this).removeClass('button--loading');


            localStorage.setItem('name', 'Arnelle Balane');
            localStorage.setItem('avatar', 'https://avatars1.githubusercontent.com/u/1428598?v=3&s=460');
            $('.form__title strong').text(localStorage.getItem('name'));
        } else {
            toast.open('Login failed. Please try again.');
            $(this).removeClass('button--loading');
        }
    }.bind(this), 1000);
});


$('.logout-button').on('click', function() {
    if ($(this).hasClass('button--loading')) {
        return null;
    }

    $(this).addClass('button--loading');
    toast.close();

    setTimeout(function() {
        if (Math.random() < 0.5) {
            toast.open('You are now logged out.');
            $('.login-screen').removeClass('screen--maximized hidden');
            $('.message-screen').addClass('screen--minimized');
            $(this).removeClass('button--loading');

            localStorage.removeItem('name');
            localStorage.removeItem('avatar');
        } else {
            toast.open('Logout failed. Please try again.');
            $(this).removeClass('button--loading');
        }
    }.bind(this), 1000);
});


$('.message-form').on('submit', function(e) {
    e.preventDefault();

    var form = $(this);
    var messageInput = form.find('.form__input');
    var messageButton = form.find('.sendmessage-button');

    if (messageButton.hasClass('button--loading')) {
        return null;
    }

    var message = messenger.send(messageInput.val());
    messageInput.prop('readonly', true);
    messageButton.addClass('button--loading');

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
