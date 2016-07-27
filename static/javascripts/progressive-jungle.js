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





$('.button--google').on('click', function() {
    $(this).addClass('button--loading');
    toast.close();

    setTimeout(function() {
        if (Math.random() < 0.5) {
            toast.open('Successfully logged in!');
            $('.screen--login').addClass('screen--maximized');
        } else {
            toast.open('Login failed. Please try again.');
            $(this).removeClass('button--loading');
        }
    }.bind(this), 1000);
});
