var path = require('path');
var express = require('express');
var bodyparser = require('body-parser');
var nunjucks = require('nunjucks');
var morgan = require('morgan');
var firebase = require('firebase');
var request = require('request');
var webpush = require('web-push');
var config = require('./config');


var app = express();

app.use(morgan('dev'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
nunjucks.configure(app.get('views'), { express: app });

app.listen(config.get('PORT'), function() {
    console.log('Server is now running at port ' + config.get('PORT'));
});



firebase.initializeApp({
    databaseURL: config.get('FIREBASE_DATABASE_URL')
});
var database = firebase.database();
var messages = database.ref('messages');

webpush.setGCMAPIKey(config.get('GCM_API_KEY'));



app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/service-worker.js', express.static(
    path.join(__dirname, 'static', 'javascripts', 'service-worker.js')));

app.get('/', function(req, res) {
    res.render('index.html');
});

app.get('/messages', function(req, res) {
    res.render('messages.html');
});

app.get('/offline', function(req, res) {
    res.render('offline.html');
});

app.post('/send-message', function(req, res) {
    messages.push().set(req.body);
    database.ref('subscriptions').on('value', function(data) {
        var subscriptions = data.val();
        var notification = {
            title: req.body.name,
            body: req.body.message,
            icon: req.body.avatar
        };

        for (var key in subscriptions) {
            if (key === req.body.senderId) {
                continue;
            }
            var subscription = subscriptions[key];
            if (subscription.keys) {
                webpush.sendNotification(subscription.endpoint, {
                    userPublicKey: subscription.keys.p256dh,
                    userAuth: subscription.keys.auth,
                    payload: JSON.stringify(notification)
                });
            } else {
                var options = {
                    url: 'https://android.googleapis.com/gcm/send',
                    headers: {
                        Authorization: 'key=' + config.get('GCM_API_KEY')
                    },
                    body: {
                        registration_ids: key,
                        notification: notification
                    },
                    json: true
                };
                request.post(options);
            }
        }
    });
    res.json({ success: true });
});

app.post('/subscribe', function(req, res) {
    var subscriptionId = req.body.endpoint.replace(/.*\//g, '');
    database.ref('subscriptions/' + subscriptionId).set(req.body);
    res.json({ success: true });
});

app.post('/unsubscribe', function(req, res) {
    var subscriptionId = req.body.endpoint.replace(/.*\//g, '');
    database.ref('subscriptions/' + subscriptionId).remove();
    res.json({ success: true });
});
