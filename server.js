var express = require('express');

var vars = require('./vars');
var middlewares = require('./lib/middleware');

var app = module.exports = express();

app.set('app.config', vars);

app.set('port', vars.app.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Check for request type, return 406 if content is not acceptable
app.use(middlewares.setRequestType(app));

// Set response appropriate content type
app.use(middlewares.setContentType(app));

// Lowercase query parameters
app.use(middlewares.lowercase(app));

// Formalize sort query parameter
app.use(middlewares.formalizeSortParameter(app));

// Formalize order query parameter
app.use(middlewares.formalizeOrderParameter(app));

// Formalize limit query parameter
app.use(middlewares.formalizeLimitParameter(app));

// Enable CORS request
app.use(middlewares.enableCORS(app));

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// Set root controller, template are in views directory
app.get('/', function(req, res) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.render('index');
});

// Add city route
require('./routes/city')(app);

// Set X-Geoname-* Response headers
app.use(middlewares.setGeonamesResponseHeaders(app));

// Log errors
app.use(function(err, req, res, next) {
    console.error(err.stack);
    next(err);
});

// Fallback to internal server error
app.use(function(err, req, res, next) {
    res.status(500); return;
});

// Start app
app.listen(app.get('port'), function(err) {
    if (err) { next(err); return; }
    console.log("Express server listening on port " + app.get('port'));
});

