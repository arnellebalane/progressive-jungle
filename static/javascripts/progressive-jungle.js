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
            $('.login-screen').removeClass('screen--maximized');
            $('.message-screen').addClass('screen--minimized');
            $(this).removeClass('button--loading');
        } else {
            toast.open('Logout failed. Please try again.');
            $(this).removeClass('button--loading');
        }
    }.bind(this), 1000);
});
