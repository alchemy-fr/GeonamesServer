var _ = require("underscore");

module.exports = {
    setRequestType: function(app) {
        return function(req, res, next) {
            var accepted = req.accepted.length > 0 ? req.accepted : [{ value: '*', quality: 1, type: 'text', subtype: '*' }];

            var type = _.find(accepted, function(type) {
                if ('subtype' in type) {
                    return _.contains(['xml', 'json', '*'], type.subtype.toLowerCase());
                }
            });

            if ('undefined' === typeof type) {
                res.send(406);
                return;
            }

            var format = type.subtype;

            if ('*' === format) {
                format = 'json';
            }

            app.set('req.type', format.toLowerCase());

            next();
        };
    },
    setContentType: function(app) {
        return function(req, res, next) {
            if ('xml' === app.get('req.type')) {
                res.set('Content-Type', 'text/xml; charset=utf-8');
            } else {
                res.set('Content-Type', 'application/json; charset=utf-8');
            }

            next();
        };
    },
    lowercase: function(app) {
        return function(req, res, next) {
            for (var key in req.query) {
                if (typeof req.query[key] === "string") {
                    req.query[key.toLowerCase()] = req.query[key].toLowerCase();
                }
            }
            next();
        };
    },
    formalizeSortParameter: function(app) {
        return function(req, res, next) {
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
        };
    },
    formalizeOrderParameter : function (app) {
        return function(req, res, next) {
            var ord = 'asc';

            if (req.query.ord) {
                ord = req.query.ord;

                if (!_.contains(['asc', 'desc'], ord)) {
                    res.send(400);
                    return;
                }
            } else {
                if (app.get('req.sort') === "population")
                    ord = "desc";
            }

            app.set('req.ord', ord);

            next();
        };
    },
    formalizeLimitParameter : function (app) {
        return function(req, res, next) {
            var limit = app.get('app.config').es.size;

            if (false === isNaN(req.query.limit)) {
                limit = parseInt(req.query.limit);
            }

            app.set('req.limit', limit > 100 ? 100 : limit);

            next();
        };
    },
    enableCORS : function (app) {
        return function(req, res, next) {
            _.each(app.get('app.config').app.allowed_domains, function(domain) {
                res.header('Access-Control-Allow-Origin', domain);
            });

            res.header('Access-Control-Allow-Headers', 'X-Requested-With, origin, content-type, accept');
            res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');

            next();
        };
    },
    setGeonamesResponseHeaders: function (app) {
        return function(req, res, next) {
            res.header('X-Geonames-sortby', app.get('req.sort'));
            next();
        };
    }
};


