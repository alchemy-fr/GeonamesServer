var S = require('string');
var _ = require('underscore');
var request = require('request');
var mongojs = require('mongojs');

var geoloc = require('./../lib/geoloc');
var common = require('./../lib/common');
var controller = require('./../lib/controller/city');

module.exports = function(app) {
    app.get('/city', function(req, res) {
        var db = mongojs(app.get('mongo.connection.string')());

        var countryNamesCollection = db.collection('countrynames');

        var cityName = S(req.query.name || '').trim().toString();
        var countryName = S(req.query.country || '').trim().toString();

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
                    common.sendEmptyResponse(res);
                    return;
                }
            }

            // Get client ip
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
            var point;

            if ('closeness' === app.get('req.sort')) {
                ip = req.query['client-ip'] || null;

                console.log('ip');
                if (!common.isIpV4(ip)) {
                    res.send(400, 'The provided IP is not valid');
                    return;
                }

                // if ip or city could not be found fallback to sort by population
                if (ip) {
                    try {
                        var point = geoloc.getPointfromIp(ip, app.get('app.config').geo.geolitepath);

                        if (null === point) {
                            app.set('req.sort', 'population');
                            res.header('X-Geonames-sortby', app.get('req.sort'));
                        }
                    } catch (Exception) {
                        res.send(500, 'An error occured while geolocalizing IP adress');
                        return;
                    }
                } else {
                    app.set('req.sort', 'population');
                    res.header('X-Geonames-sortby', app.get('req.sort'));
                }
            }

            var requestBody = controller.esQuery.findCitiesByName(
                    cityName,
                    codes,
                    point,
                    app.get('req.sort'),
                    app.get('req.limit')
            );

            request({
                uri: app.get('es.connection.string')('cities')+'?pretty=true',
                body: requestBody
            }, function(error, response, hits) {
                if (!error && response.statusCode === 200) {
                    var result = common.formatHits(hits);

                    var datas = result.data;
                    var adminCodes = result.admincodes;

                    if (datas.length === 0) {
                        common.sendEmptyResponse(res);
                        return;
                    }

                    var datas = controller.sortDatasFromCountries(datas, countries);

                    db.collection('admincodes').find({code: {$in: adminCodes}}, function(err, adminCodes) {
                        res.jsonp(controller.jsonFromQueryLookup(adminCodes, datas, cityName));
                    });
                } else {
                    console.log('elastic search error, got error ', error, ' status code ', res.statusCode, ' and response ', response);
                    common.sendEmptyResponse(res);
                }
            });
        });
    });

    app.get('/city/:id', function(req, res) {
        var db = mongojs(app.get('mongo.connection.string')());

        var countryNamesCollection = db.collection('countrynames');

        countryNamesCollection.find({}, function(err, countries) {
            var requestBody = controller.esQuery.findCityById(req.params.id);

            request({
                uri: app.get('es.connection.string')('cities'),
                body: requestBody
            },
            function(error, response, hits) {
                if (!error && response.statusCode === 200) {
                    var result = common.formatHits(hits);

                    var datas = result.data;
                    var adminCodes = result.admincodes;

                    if (datas === 0) {
                        common.sendEmptyResponse(res);
                        return;
                    }

                    var datas = controller.sortDatasFromCountries(datas, countries);

                    db.collection('admincodes').find({code: {$in: adminCodes}}, function(err, result) {
                        res.jsonp(controller.jsonFromQueryLookup(result, datas));
                    });
                } else {
                    common.sendEmptyResponse(res);
                }
            });
        });
    });

    app.get('/ip', function(req, res) {
        var db = mongojs(app.get('mongo.connection.string')());

        var ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (!common.isIpV4(ip)) {
            res.send(400, 'Could not determine your remote IP or the provided one is not valid');
            return;
        }

        var city = geoloc.getCityFromIp(ip, app.get('app.config').geo.geolitepath);

        if (!city) {
            return common.sendEmptyResponse(res);
        }

        var adminCodeCollection = db.collection('admincodes');

        var code = city.country_code + '.' + city.region;

        adminCodeCollection.findOne({code: code}, function(err, result) {
            res.jsonp(controller.jsonFromIpLookup(result, city, ip));
        });
    });
};

