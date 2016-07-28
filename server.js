var path = require('path');
var express = require('express');
var bodyparser = require('body-parser');
var nunjucks = require('nunjucks');
var morgan = require('morgan');
var config = require('./config');


var app = express();

app.use(morgan('dev'));
app.use(bodyparser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
nunjucks.configure(app.get('views'), { express: app });

app.listen(config.get('PORT'), function() {
    console.log('Server is now running at port ' + config.get('PORT'));
});



app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res) {
    res.render('index.html');
});
