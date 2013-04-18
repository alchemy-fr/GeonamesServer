var S = require('string');
var _ = require('underscore');
var request = require('request');
var mongojs = require('mongojs');

var vars = require('./../vars');
var geoloc = require('./../lib/geoloc');
var common = require('./../lib/common');
var controller = require('./../lib/controller/city');

module.exports = function(app) {
    app.get('/city', function(req, res) {
        var elasticSearchEndpoint = common.getElasticSearchEndpoint(vars.es.host, vars.es.name, vars.es.collection);
        var db = mongojs(vars.mongo.url);

        var countryNamesCollection = db.collection(vars.mongo.countrynames);

        var cityName = S(req.query.name || '').trim().toString();
        var countryName = S(req.query.country || '').trim().toString();

        // Find city by provided ip
        if (req.query.ip) {
            if ('' !== cityName) {
                res.send(400, 'You can not look up for a name and ip at the same time');
                return;
            }

            var ip = req.query.ip;

            var city = geoloc.getCityFromIp(ip);

            if (!city) {
                return common.sendEmptyResponse(res, app.get('req.type'));
            }

            var adminCodeCollection = db.collection(vars.mongo.admincodes);

            var code = city.country_code + '.' + city.region;

            adminCodeCollection.findOne({code: code}, function(err, result) {
                if ('xml' === app.get('req.type')) {
                    res.send(controller.xmlFromIpLookup(result, city, ip));
                } else {
                    res.jsonp(controller.jsonFromIpLookup(result, city, ip));
                }
            });

            return;
        }

        // find city
        var codes = [];
        countryNamesCollection.find({}, function(err, countries) {
            if ('' !== countryName) {
                _.each(countries, function(country) {
                    if (S(country.name.toLowerCase()).contains(countryName)) {
                        codes.push(country.code.toLowerCase());
                    }
                });

                if (codes.length === 0) {
                    common.sendEmptyResponse(res, app.get('req.type'));
                }
            }

            // Get client ip
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            if ('ip' === app.get('req.sort')) {
                var sortParams = req.params.sortParams || [];

                if (false === 'ip' in sortParams) {
                    res.send(400, 'You must provide an IP adress when sort is set to "ip". Here\'s an example "/city?sort=ip&sortParams[ip]=134.67.24.132" ');
                    return;
                }

                ip = sortParams['ip'];
            }

            var point = geoloc.getPointfromIp(ip);

            var requestBody = controller.esQuery.findCitiesByName(
                    cityName,
                    codes,
                    point,
                    app.get('req.sort'),
                    app.get('req.limit'),
                    app.get('req.ord')
            );

            request({
                uri: elasticSearchEndpoint,
                body: requestBody
            }, function(error, response, hits) {
                if (!error && response.statusCode === 200) {
                    var result = common.formatHits(hits);

                    var datas = result.data;
                    var adminCodes = result.admincodes;

                    if (datas === 0) {
                        common.sendEmptyResponse(res, app.get('req.type'));
                    }

                    var datas = controller.sortDatasFromCountries(datas, countries);

                    db.collection(vars.mongo.admincodes).find({code: {$in: adminCodes}}, function(err, adminCodes) {
                        if ('xml' === app.get('req.type')) {
                            res.send(controller.xmlFromQueryLookup(adminCodes, datas, cityName, countryName));
                        } else {
                            res.jsonp(controller.jsonFromQueryLookup(adminCodes, datas, cityName, countryName));
                        }
                    });
                } else {
                    common.sendEmptyResponse(res, app.get('req.type'));
                }
            });
        });
    }),
    app.get('/city/:id', function(req, res) {
        var elasticSearchEndpoint = common.getElasticSearchEndpoint(vars.es.host, vars.es.name, vars.es.collection);
        var db = mongojs(vars.mongo.url);

        var countryNamesCollection = db.collection(vars.mongo.countrynames);

        countryNamesCollection.find({}, function(err, countries) {
            var requestBody = controller.esQuery.findCityById(req.params.id);

            request({
                uri: elasticSearchEndpoint,
                body: requestBody
            },
            function(error, response, hits) {
                if (!error && response.statusCode === 200) {
                    var result = common.formatHits(hits);

                    var datas = result.data;
                    var adminCodes = result.admincodes;

                    if (datas === 0) {
                        common.sendEmptyResponse(res, app.get('req.type'));
                    }

                    var datas = controller.sortDatasFromCountries(datas, countries);

                    db.collection(vars.mongo.admincodes).find({code: {$in: adminCodes}}, function(err, result) {
                        if ('xml' === app.get('req.type')) {
                            res.send(controller.xmlFromQueryLookup(result, datas));
                        } else {
                            res.jsonp(controller.jsonFromQueryLookup(result, datas));
                        }
                    });
                } else {
                    common.sendEmptyResponse(res, app.get('req.type'));
                }
            });
        });
    });
};

