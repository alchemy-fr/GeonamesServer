var _ = require("underscore");
var S = require('string');

var common = require('./../common.js');

module.exports = {
    jsonFromIpLookup: function(adminCodes, data, ip) {
        return this.formatResult(adminCodes, data);
    },
    formatResult: function (adminCodes, o) { 
        var tab = {
            "score": o.score,
            "geonameid": o.geonameid,
            "name": o.name,
            "country": {
                "name": o.countryName,
                "code": o.countryCode
            },
            "timezone": o.timezone,
            "feature": {
                "class": o.featureClass,
                "code": o.featureCode
            },
            "highlight": o.highlight,
            "population": o.population,
            "location": {
                "latitude": o.latitude || '',
                "longitude": o.longitude || ''
            },
            "names": o.names,
            "admin1Code": o.admin1Code,
            "admin2Code": o.admin2Code,
            "admin3Code": o.admin3Code,
            "admin4Code": o.admin4Code,
            "updatedOn": o.modificationDate,
            "highlight": o.highlight
        };

        var region = _.find(adminCodes, function(r) {
            return r.code === o.adminCode;
        });

        if ('undefined' !== typeof region) {
            tab.region = {
                "code": region.code,
                "name": region.name
            }
        } else {
            tab.region = null;
        }
        
        return tab;
    },
    jsonFromQueryLookup: function(adminCodes, data) {
        var json = [], that = this;
        
        _.each(data, function(o) {
            json.push(that.formatResult(adminCodes, o));
        });

        return json;
    },
    jsonFromGeonameLookup: function(adminCodes, data) {
        var json = this.formatResult(adminCodes, data);
        
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
                    'asciiname',
                    'alternatenames',
                    'names',
                    'countryCode',
                    'featureClass',
                    'featureCode',
                    'cc2',
                    'admin1Code',
                    'admin2Code',
                    'admin3Code',
                    'admin4Code',
                    'latitude',
                    'longitude',
                    'population',
                    'DEM',
                    'timezone',
                    'modificationDate',
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
                sort: ["_score"],
                fields: [
                    'geonameid',
                    'name',
                    'asciiname',
                    'alternatenames',
                    'names',
                    'countryCode',
                    'featureClass',
                    'featureCode',
                    'cc2',
                    'admin1Code',
                    'admin2Code',
                    'admin3Code',
                    'admin4Code',
                    'latitude',
                    'longitude',
                    'population',
                    'DEM',
                    'timezone',
                    'modificationDate',
                    'pin'
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
                },
                "highlight" : {
                    "fields" : {
                        "name" : {}
                    }
                }
            };
            
            var filters = [
                {
                    "filter":{
                        "numeric_range" : {
                            "population" : {
                                "from" : "1000"
                            }
                        }
                    },
                    "boost":2
                },
                {
                    "filter":{
                        "numeric_range" : {
                            "population" : {
                                "from" : "10000"
                            }
                        }
                    },
                    "boost":5
                },
                {
                    "filter":{
                        "numeric_range" : {
                            "population" : {
                                "from" : "100000"
                            }
                        }
                    },
                    "boost":3
                }
            ];

            if ('closeness' === sort) {
                filters.push({
                    "filter":{
                        "geo_distance" : {
                            "distance" : "10km",
                            "pin.location" : {
                                "lat" : Math.round(geoLocPoint.latitude * 100) / 100,
                                "lon" : Math.round(geoLocPoint.longitude * 100) / 100
                            }
                        }
                    },
                    "boost":15
                });
                filters.push({
                    "filter":{
                        "geo_distance" : {
                            "distance" : "200km",
                            "pin.location" : {
                                "lat" : Math.round(geoLocPoint.latitude * 100) / 100,
                                "lon" : Math.round(geoLocPoint.longitude * 100) / 100
                            }
                        }
                    },
                    "boost":12
                }),
                filters.push({
                    "filter":{
                        "geo_distance" : {
                            "distance" : "1000km",
                            "pin.location" : {
                                "lat" : Math.round(geoLocPoint.latitude * 100) / 100,
                                "lon" : Math.round(geoLocPoint.longitude * 100) / 100
                            }
                        }
                    },
                    "boost":5
                });
            }

            if ('' !== name) {
                filters.push({
                    "filter":{
                        "query":{
                            "query_string":{
                                "default_field":"name.untouched", 
                                "query":name
                            }
                        }
                    },
                    "boost":2
                });
                filters.push({
                    "filter":{
                        "query":{
                            "query_string":{
                                "default_field":"name", 
                                "query":name
                            }
                        }
                    },
                    "boost":5
                });

                json.query.bool.should = [
                    {
                        "custom_filters_score" : {
                            "query": {
                                "query_string":{
                                    "fields" : ["name^3", "alternatenames"],
                                    "query":name
                                }
                            },
                            "filters": filters,
                            "score_mode" : "multiply"
                        }
                    },
                    {
                        "prefix": {
                            "name": name
                        }
                    },
                    {
                        "prefix": {
                            "alternatenames": name
                        }
                    }
                ];
            } else {
                json.query.bool.should = [
                    {
                        "custom_filters_score" : {
                            "query": {
                                "match_all" : {}
                            },
                            "filters": filters,
                            "score_mode" : "multiply"
                        }
                    }
                ];
            }

            json.track_scores = true;
            json.query.bool.boost = 1.0;
            json.query.bool.minimum_number_should_match = 1;

            if (codes.length > 0) {
                json.query.bool.must.push({
                    "terms": {
                        "countryCode": codes,
                        "minimum_match" : 1
                    }
                });
            }

            return JSON.stringify(json);
        }
    }
};


