var builder = require('xmlbuilder');
var _ = require("underscore");
var S = require('string');

var common = require('./../common.js');

module.exports = {
    xmlFromIpLookup: function(result, cityObject, ip) {
        var xml = builder.create('geonames', {
            'version': '1.0',
            'encoding': 'UTF-8'
        });

        xml.e('ip', ip);

        var geo = xml.e('geoname');

        geo.e('city', cityObject.city);
        geo.e('country_code', cityObject.country_code);
        geo.e('country', cityObject.country_name);

        if (result && result.name) {
            geo.e('fips', result.name);
        } else {
            geo.e('fips');
        }

        var longitude = Math.round(cityObject.longitude * 100) / 100;
        var latitude = Math.round(cityObject.latitude * 100) / 100;

        geo.e('longitude', longitude.toString());
        geo.e('latitude', latitude.toString());

        return xml.end({pretty: true});
    },
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
                    longitude: longitude.toString(),
                    latitude: latitude.toString()
                }
            }
        };

        if (result && result.name) {
            json.geonames.geoname.fips = result.name;
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

            geo.e('population', o.population.toString());
            geo.e('latitude', o.pin.location.lat.toString() || '');
            geo.e('longitude', o.pin.location.lon.toString() || '');

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
                population: o.population.toString(),
                latitude: o.pin.location.lat.toString() || '',
                longitude: o.pin.location.lon.toString() || '',
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
                        minimum_number_should_match : 1,
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
                json.query.bool.must.push({
                    prefix: {
                        name: name
                    }
                });
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


