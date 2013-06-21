var builder = require('xmlbuilder');
var _ = require("underscore");
var S = require('string');

var common = require('./../common.js');

module.exports = {
    jsonFromIpLookup: function(result, cityObject, ip) {
        var longitude = Math.round(cityObject.longitude * 100) / 100;
        var latitude = Math.round(cityObject.latitude * 100) / 100;

        var json = {
            geonames: {
                ip: ip,
                geoname: {
                    city: cityObject.city,
                    country_code: cityObject.country_code,
                    country: cityObject.country_name,
                    location : {
                        longitude: longitude.toString(),
                        latitude: latitude.toString()
                    }
                }
            }
        };

        if (result && result.name) {
            json.geonames.geoname.fips = result.name;
        }

        return json;
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
                population: o.population.toString(),
                location : {
                    latitude: o.pin.location.lat.toString() || '',
                    longitude: o.pin.location.lon.toString() || ''
                },
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
                    'population',
                    'pin'
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
                    'population',
                    "pin"
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
                            }
                        ],
                        boost: 1.0
                    }
                }
            };

            if ('closeness' === sort) {
                json.sort = [{
                    _geo_distance: {
                        'pin.location': [Math.round(geoLocPoint.longitude * 100) / 100, Math.round(geoLocPoint.latitude * 100) / 100],
                        order: ord,
                        unit: 'km'
                }}];
            }

            if ('' !== name) {
                json.query.bool.should = [];

                json.query.bool.should.push({
                    prefix: {
                        name: name
                    }
                });

                json.query.bool.should.push({
                    prefix: {
                        alternatenames: name
                    }
                });

                json.query.bool.minimum_number_should_match = 1;
            }

            if (codes.length > 0) {
                json.query.bool.must.push({
                    terms: {
                        countryCode: codes,
                        minimum_match : 1
                    }
                });
            }

            return JSON.stringify(json);
        }
    }
};


