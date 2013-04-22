var builder = require('xmlbuilder');
var _ = require("underscore");
var S = require('string');

var common = require('./../common.js');

module.exports = {
    xmlFromIpLookup: function(result, cityObject, ip) {
        var xml = builder.create('result', {
            'version': '1.0',
            'encoding': 'UTF-8'
        });

        xml.att('for', ip);

        var geo = xml.e('geoname');

        geo.e('city', cityObject.city);
        geo.e('country_code', cityObject.country_code);
        geo.e('country', cityObject.country_name);

        if (result && result.name) {
            geo.e('fips', result.name);
        } else {
            geo.e('fips');
        }

        geo.e('longitude', cityObject.longitude.toString());
        geo.e('latitude', cityObject.latitude.toString());

        return xml.end({pretty: true});
    },
    jsonFromIpLookup: function(result, cityObject, ip) {
        var json = {
            ip: ip,
            result: {
                geoname: {
                    city: cityObject.city,
                    country_code: cityObject.country_code,
                    country: cityObject.country_name,
                    longitude: cityObject.longitude.toString(),
                    latitude: cityObject.latitude.toString()
                }
            }
        };

        if (result && result.name) {
            json.result.geoname.fips = result.name;
        }

        return json;
    },
    xmlFromQueryLookup: function(adminCodes, data, cityName, countryName) {
        var xml = builder.create('geonames', {
            'version': '1.0',
            'encoding': 'UTF-8'
        });

        xml.e('totalResultsCount', data.length.toString());

        _.each(data, function(o) {
            var geo = xml.e('geoname');

            geo.e('geonameid', o.geonameid.toString());
            geo.e('title', o.name);

            var titleMatch = common.getMatch(cityName || o.name, o.name, o.names);

            if (S(o.name).contains(titleMatch)) {
                geo.e('title_alt', common.getAltTitle(o.names, cityName || o.name));
            }

            geo.e('title_match', titleMatch);
            geo.e('country', o.countryName);
            geo.e('country_match', common.getMatch(countryName || o.countryName, o.countryName));

            var region = o.adminName;

            var match = _.find(adminCodes, function(r) {
                return r.code === o.adminCode;
            });

            if ('undefined' !== typeof match) {
                region = match.name;
            }

            geo.e('region', region);
        });

        return xml.end({pretty: true});
    },
    jsonFromQueryLookup: function(adminCodes, data, cityName, countryName) {
        var json = {
            geonames: {
                totalResultsCount: data.length.toString(),
                geoname: []
            }
        };

        _.each(data, function(o) {
            var title_match = common.getMatch(cityName || o.name, o.name, o.names);

            var tab = {
                geonameid: o.geonameid.toString(),
                title: o.name,
                country: o.countryName,
                match: {
                    title: title_match,
                    country: common.getMatch(countryName || o.countryName, o.countryName)
                },
                population: o.population,
                latitude: o.latitude,
                longitude: o.longitude,
                names: o.names,
                region: o.adminName
            };

            if (S(o.name).contains(title_match) !== 0) {
                tab.title_alt = common.getAltTitle(o.names, cityName || o.name);
            }

            var match = _.find(adminCodes, function(r) {
                return r.code === o.adminCode;
            });

            if ('undefined' !== typeof match) {
                tab.region = match.name;
            }

            json.geonames.geoname.push(tab);
        });

        return json;
    },
    sortDatasFromCountries: function(datas, countries) {
        for (var j in datas) {
            for (var i in countries) {
                if (datas[j].countryCode === countries[i].code)
                    datas[j].countryName = countries[i].name;
            }
        }

        return datas;
    },
    esQuery: {
        /**
         * Get assembling query to get city by geoname id
         *
         * @param {type} id
         * @returns {@exp;JSON@call;stringify}
         */
        findCityById: function(id) {
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
                        must: [{
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
                        {
                            term: {geonameid: id}
                        }]
                    }
                }
            };

            return JSON.stringify(json);
        },
        findCitiesByName: function(name, codes, geoLocPoint, sort, size, ord)
        {
            var json = {
                size: size,
                sort: [{
                    population: {order: ord || 'desc'}
                }],
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
                        must: [
                            {
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
                            {
                                prefix: {
                                    name: name
                                }
                            }
                        ],
                        minimum_number_should_match : 1,
                        boost: 1.0
                    }
                }
            };

            if ('closeness' === sort) {
                json.sort = [{
                    _geo_distance: {
                        'pin.location': [48, 2],//Math.round(geoLocPoint.latitude * 100) / 100, Math.round(geoLocPoint.longitude * 100) / 100],
                        order: ord,
                        unit: 'km'
                }}];
            }

            if (codes.length > 0) {
                json.query.bool.should = [{
                    terms: {
                        countryCode: codes,
                        minimum_match : 1
                    }
                }];
            }

            return JSON.stringify(json);
        }
    }
};


