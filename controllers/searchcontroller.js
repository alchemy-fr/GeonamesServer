var S = require('string');
var _ = require('underscore');
var common = require( './../common' );

/**
 * Send response object with formated datas according to the response format
 *
 * @param {object} res          A response object
 * @param {object} result       A admin name collection
 * @param {object} data         An elsatci search http body response
 * @param {string} cityname     A city name
 * @param {string} countryname  A country name
 * @param {string} type         A response format
 * @returns {void}
 */
function sendFullResult(res, result, data, cityname, countryname, type)
{
    if (type === 'xml') {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('geonames', {
            'version':'1.0',
            'encoding':'UTF-8'
        });

        var xmlS = '';

        xml.e('totalResultsCount', data.length.toString());

        _.each(data, function(o) {
            var geo = xml.e('geoname');

            geo.e('geonameid', o.geonameid.toString());
            geo.e('title', o.name);

            var title_match = common.getMatch(cityname, o.name, o.names);

            if (S(o.name).contains(title_match)) {
                geo.e('title_alt', common.getAltTitle(o.names, cityname));
            }

            geo.e('title_match', title_match);
            geo.e('country', o.countryName);
            geo.e('country_match', common.getMatch(countryname, o.countryName));

            var region = o.adminName;

            var match = _.find(result, function(r){ return r.code === o.adminCode; });

            if ('undefined' !== match) {
                region = match.name;
            }

            geo.e('region', region);
        });

        xmlS = xml.end({pretty:true});

        res.send(xmlS);

        return;
    }

    res.set('Content-Type', 'application/json');

    var json = {
        geonames: {
            totalResultsCount: data.length.toString(),
            geoname: []
        }
    };

    _.each(data, function(o){

        var title_match = common.getMatch(cityname, o.name, o.names);

        var tab = {
            geonameid: o.geonameid.toString(),
            title: o.name,
            country: o.countryName,
            match : {
                title : title_match,
                country : common.getMatch(countryname, o.countryName)
            },
            population : o.population,
            latitude : o.latitude,
            longitude : o.longitude,
            names : o.names,
            region: o.adminName
        };

        if (S(o.name).contains(title_match) !== 0) {
            tab.title_alt = common.getAltTitle(o.names, cityname);
        }

        var match = _.find(result, function(r){ return r.code === o.adminCode; });

        if ('undefined' !== match) {
             tab.region = match.name;
        }

        json.geonames.geoname.push(tab);
    });

    res.json(json);
}

/**
 * Returns results
 *
 * @param {object} body
 * @param {object} vars
 * @param {object} res
 * @param {string} cityname
 * @param {object} db
 * @param {string} countryname
 * @param {array} countries
 * @param {string} type
 * @returns {void}
 */
function getResult(body, vars, res, cityname, db, countryname, countries, type)
{
    var tabs = common.convertToTabs(body);
    var data = tabs.data;

    if (data.length === 0) {
        common.sendEmptyResponse(res, type);
        return;
    }

    for (var j in data) {
        for (var i in countries) {
            if (data[j].countryCode === countries[i].code)
                data[j].countryName = countries[i].name;
        }
    }

    var adminnames = db.collection(vars.mongo.admincodes);

    adminnames.find({code:{$in:tabs.admincodes}},function(err, result) {
        sendFullResult(res, result, data, cityname, countryname, type);
    });
}


/**
 * Returns latitude(lat) and longitude (lon) from the requester's ip adress
 *
 * @param {object} req
 * @param {string} path
 * @param {object} vars
 * @returns {object}
 */
function getGeoLoc(req, path, vars)
{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var geoip = require('geoip');
    var res = {};

    try {
        var city = new geoip.City(path);
        var geo = city.lookupSync(ip);
    } catch (Exception) {
        res.lon = vars.geo.default_lon;
        res.lat = vars.geo.default_lat;
        return (res);
    }

    if (!geo) {
        res.lon = vars.geo.default_lon;
        res.lat = vars.geo.default_lat;
        return (res);
    }

    res.lon = geo.longitude;
    res.lat = geo.latitude;

    return (res);
}

/**
 * Construct full Elastic search JSON DSL query
 *
 * @param {type} name   The city name
 * @param {type} codes
 * @param {type} lon    The requester longitude
 * @param {type} lat    The request latitude
 * @param {type} sort   Sorting option
 * @param {type} size   Number of results
 * @param {type} ord    Order option
 *
 * @returns string
 */
function getQuery(name, codes, lon, lat, sort, size, ord)
{
    var json = {
        size: size,
        sort: [{
            _geo_distance: {
                'pin.location' : [lon, lat],
                order: ord,
                unit: 'km'
        }}],
        fields: [
            'geonameid',
            'name',
            'countryCode',
            'longitude',
            'latitude',
            'admin1Code',
            'names',
            'population'
        ],
        query: {
            bool: {
                must: {
                    terms: {
                        featureCode: [
                            'ppl',
                            'ppla',
                            'ppla2',
                            'ppla3',
                            'ppla4',
                            'pplc',
                            'pplf',
                            'pplg',
                            'ppll',
                            'pplq',
                            'pplr',
                            'ppls',
                            'pplw',
                            'pplx',
                            'stlmt'
                        ],
                        minimum_match: 1
                    }
                },
                should: [{prefix: {names: name}}],
                minimum_number_should_match: 0 < codes.length ? 2 : 1,
                boost: 1.0
            }
        }
    };

    if ('population' === sort) {
        json.sort = {population:{order: ord || 'desc'}};
    }

    if (0 < codes.length) {
        json.query.bool.should.push({
            terms: { countryCode: codes}
        });
    }

    return JSON.stringify(json);
}

module.exports = function(app, express, vars) {
    app.get('/search', function(req, res){
        if (!req.query.query) {
            res.send(400);
            return;
        }

        var cityname = req.query.query;
        var countryname = req.query.country || '';

        var city_lower = cityname.toLowerCase();

        var elasticSearchEndpoint = common.getElasticSearchEndpoint(
            vars.es.host,
            vars.es.name,
            vars.es.collection
        );

        var request = require('request');
        var mongojs = require('mongojs');

        var db = mongojs(vars.mongo.url);
        var geoloc = getGeoLoc(req, vars.geo.geolitepath, vars);
        var codes = [];

        var countrynames = db.collection(vars.mongo.countrynames);

        countrynames.find({}, function(err, docs) {
            if (countryname) {
                var country_lower = countryname.toLowerCase();

                _.each(docs, function(doc) {
                    if (S(doc.name.toLowerCase()).contains(country_lower)) {
                        codes.push(doc.code.toLowerCase());
                    }
                });

                if (codes.length === 0) {
                    common.sendEmptyResponse(res, app.get('req.type'));
                    return;
                }
            }

            var requestBody = getQuery(
                city_lower,
                codes,
                geoloc.lon,
                geoloc.lat,
                app.get('req.sort'),
                vars.es.size,
                app.get('req.ord')
            );

            request({
                uri: elasticSearchEndpoint,
                body: requestBody
            }, function (error, response, body) {
                if (!error && response.statusCode === 200){
                    getResult(
                        body,
                        vars,
                        res,
                        cityname,
                        db,
                        countryname,
                        docs,
                        app.get('req.type')
                    );
                } else {
                    common.sendEmptyResult(res, app.get('req.type'));
                }
            });
        });
    });
};

