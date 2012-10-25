var path = require('path');

module.exports = function(app, express, vars){
    app.configure(function(){
	    app.set('port', vars.web.port);
	    app.set('views', __dirname + '/views');
	    app.set('view engine', 'ejs');
	    app.use(express.favicon());
	    app.use(express.logger('dev'));
	    app.use(express.bodyParser());
	    app.use(express.methodOverride());
	    app.use(app.router);
	    app.use(require('stylus').middleware(__dirname + '/public'));
	    app.use(express.static(path.join(__dirname, 'public')));
	    app.use(logErrors);
	    app.use(clientErrorHandler);
	    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
	    app.use(function(req, res, next){
		    res.status(404);
		    res.render('404', { error: 'Page not found' });
		});
	});


    function logErrors(err, req, res, next) {
	console.error(err.stack);
	next(err);
    }
    
    function clientErrorHandler(err, req, res, next) {
	if (req.xhr) {
	    res.send(500, { error: 'Something blew up!' });
	} else {
	    next(err);
	}
    }

    function errorHandler(err, req, res, next) {
	res.status(500);
	res.render('error', { error: err });
    }
    
    app.configure('development', function(){
	    app.use(express.errorHandler());
	});
}

    

