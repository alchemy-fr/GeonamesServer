var S = require('string');
var _ = require('underscore');
var common = require( './../common' );


/**
 * Get JSON DSL query to find city by name
 *
 * @param {type} name
 * @param {type} lon
 * @param {type} lat
 * @param {type} sort
 * @param {type} ord
 * @param {type} size
 * @returns {@exp;JSON@call;stringify}
 */
function getCityQuery(name, lon, lat, sort, ord, size)
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
                should: [{prefix: {'names': name}}],
                minimum_number_should_match:1,
                boost: 1.0
            }
        }
    };

    if ('population' === sort) {
        json.sort = {population:{order: ord || 'desc'}};
    }

    return JSON.stringify(json);
}

/**
 * Get assembling query to get city by geoname id
 *
 * @param {type} id
 * @returns {@exp;JSON@call;stringify}
 */
function getSingleCityQuery(id){
    var json = {
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
                        minimum_match : 1
                    }
                },
                should : [{ match: {geonameid : id}}],
                minimum_number_should_match : 1,
                boost : 1.0
            }
        }
    };

    return JSON.stringify(json);
}

function sendFullResult(res, result, data, type)
{
    if (type === 'xml') {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('geonames',
        {
            'version':'1.0',
            'encoding':'UTF-8'
        });
        var xmlS = '';

        xml.e('totalResultsCount', data.length.toString());

        _.each(data, function(o){
            var geo = xml.e('geoname');
            geo.e('geonameid', o.geonameid.toString());
            geo.e('title', o.name);
            geo.e('country', o.countryName);
            _.each(result, function(r){
                if (o.adminCode === r.code) {
                    o.adminName = r.name;
                }
            });

            geo.e('region', o.adminName);
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

        var tab = {
            'geonameid': o.geonameid.toString(),
            'title': o.name,
            'country': o.countryName
        };
        _.each(result, function(r){
            if (o.adminCode === r.code) {
                o.adminName = r.name;
            }
        });
        tab.region = o.adminName;
        tab.population = o.population;
        tab.latitude = o.latitude;
        tab.longitude = o.longitude;
        tab.names = o.names;
        json.geonames.geoname.push(tab);

    });

    res.json(json);

    return;
}

/**
 *
 * @param {type} body
 * @param {type} vars
 * @param {type} res
 * @param {type} db
 * @param {type} countries
 * @param {type} type
 * @returns {void}
 */
function getResult(body, vars, res, db, countries, type)
{
    var tabs = common.convertToTabs(body);

    var data = tabs.data;
    var admincodes = tabs.admincodes;

    if (data.length === 0) {
        return common.sendEmptyResponse(res, type);
    }

    for (var j in data) {
        for (var i in countries) {
            if (data[j].countryCode === countries[i].code)
                data[j].countryName = countries[i].name;
        }
    }

    var adminnames = db.collection(vars.mongo.admincodes);

    adminnames.find({code:{$in:admincodes}}, function(err, result) {
        sendFullResult(res, result, data, type);
    });
}


/*
 ** Returns latitude(lat) and longitude (lon) from the requester's ip adress
 */

function getGeoLoc(req, path, vars)
{
    var geoip = require('geoip');
    var res = {};
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        var city = new geoip.City(path);
        var geo = city.lookupSync(ip);
    }  catch (Exception) {
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

    return res;
}

module.exports = function(app, express, vars) {
    app.get('/city', function(req, res){
        var geoloc = getGeoLoc(req, vars.geo.geolitepath, vars);
        var elasticSearchEndpoint = common.getElasticSearchEndpoint(
            vars.es.host,
            vars.es.name,
            vars.es.collection
        );

        var request = require('request');
        var mongojs = require('mongojs');

        var db = mongojs(vars.mongo.url);

        var countrynames = db.collection(vars.mongo.countrynames);

        countrynames.find({}, function(err, docs) {
            var requestBody = getCityQuery(
                '',
                geoloc.lon,
                geoloc.lat,
                app.get('req.sort'),
                app.get('req.ord'),
                vars.es.size
            );

            request({
                uri: elasticSearchEndpoint,
                body:requestBody
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    getResult(body, vars, res, db, docs, app.get('req.type'));
                } else {
                    common.sendEmptyResponse(res, app.get('req.type'));
                }
            });
        });
    }),
    app.get('/city/:id', function(req, res){
        var elasticSearchEndpoint = common.getElasticSearchEndpoint(
            vars.es.host,
            vars.es.name,
            vars.es.collection
        );

        var request = require('request');
        var mongojs = require('mongojs');

        var db = mongojs(vars.mongo.url);
        var countrynames = db.collection(vars.mongo.countrynames);

        countrynames.find({}, function(err, docs) {
            var requestBody = getSingleCityQuery(req.params.id);
            request({
                uri:elasticSearchEndpoint,
                body:requestBody
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    getResult(body, vars, res, db, docs, app.get('req.type'));
                } else {
                    common.sendEmptyResponse(res, app.get('req.type'));
                }
            });
        });
    });
};

