/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express();
var vars = require('./vars');

var routes = require ('./routes');

require('./configuration')(app, express, vars);
require('./controllers')(app, express, vars);

app.get('/', routes.index);

app.listen(app.get('port'), function(err){
    if (err) {
        next(err);
        return;
    }
    console.log("Express server listening on port " + app.get('port'));
}).on('error', function(err){
    console.log('Error intercepted: ' + err.message);
});

