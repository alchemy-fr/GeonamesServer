// Dependencies
var S = require('string');
var _ = require("underscore");
var express = require('express');
var vars = require('./vars');

var app = module.exports = express();

// Check for request type, return 406 if content is not acceptable
app.use(function(req, res, next){
    var type = _.find(req.accepted, function(type) {
        return _.contains(['xml', 'json'], type.subtype.toLowerCase());
    });

    if ('undefined' === typeof type) {
        res.send(406);
        return;
    }

    app.set('req.type', type.subtype.toLowerCase());

    next();
});

// Check for sort parameter
app.use(function(req, res, next){
    var sort = 'population';

    if (req.query.sort) {
        sort = req.query.sort;

        if (!_.contains(['population', 'closeness'], sort)) {
            res.send(400);
            return;
        }
    }

    app.set('req.sort', sort);

    next();
});

// Check for ord parameter
app.use(function(req, res, next){
    var ord = 'asc';

    if (req.query.ord) {
        ord = req.query.ord;

        if (!_.contains(['asc', 'desc'], ord)) {
            res.send(400);
            return;
        }
    } else {
        if (app.get('req.sort') === "population") ord = "desc";
    }

    next();
});

// Set root controller, template are in views directory
app.get('/', function(req, res) {res.render('index');});

// Add controller collection
require('./controllers')(app, express, vars);

// Set global app configuration
require('./configuration')(app, express, vars);

//CORS middleware
app.use(function(req, res, next) {
    _.each(vars.allowedDomains, function(domain) {
        res.header('Access-Control-Allow-Origin', domain);
    });

    res.header('Access-Control-Allow-Headers', 'X-Requested-With');

    next();
});

// Fallback 404 absence of additional work to do
app.use(function(req, res, next){
    res.status(404);
    res.render('404');
});

// Fallback 500 error is thrown
app.use(function(err, req, res, next) {
    res.send(500, 'Something broke!');
});

// Start app
app.listen(app.get('port'), function(err) {
    if (err) { next(err); return; }
    console.log("Express server listening on port " + app.get('port'));
});

