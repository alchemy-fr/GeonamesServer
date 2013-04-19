var S = require('string');
var _ = require('underscore');

function formatInt(code) {
    var ret = '';
    if (code < 10) ret += '0';
    return (ret += code);
}

module.exports = {
    /**
    * Send empty response according to the response format
    *
    * @param {object} res A response object
    * @param {string} type Aresponse format
    * @returns {void}
    */
    sendEmptyResponse : function (res, type) {
        if (type === 'xml') {
            var builder = require('xmlbuilder');

            var xml = builder.create('geonames', {
                'version':'1.0',
                'encoding':'UTF-8'
            });

            xml.e('totalResultsCount', '0');

            res.send(xml.end({pretty:true}));
        } else  {
             res.jsonp({geonames: {'totalResultsCount': 0}});
        }
    },
    /**
    * Construct the Elastic search connection string
    *
    * @param {string} host
    * @param {string} dbname
    * @param {string} dbcollection
    * @returns {String}
    */
    getElasticSearchEndpoint: function (host, dbname, dbcollection) {
       return 'http://'
           + S(host).ensureRight('/')
           + S(dbname).ensureRight('/')
           + S(dbcollection).ensureRight('/')
           + '_search';
    },
    /**
     * Converts ES hits to an array, in order to improve readability.
     * Also fills up an array with admincodes.
     *
     * @param {type} hits
     * @returns {module.exports.formatHits.ret}
     */
    formatHits: function (hits)
    {
        var ret = {data: [], admincodes: []};

        var results = JSON.parse(hits)['hits']['hits'] || [];
        console.log(results);
        _.each(results, function (o) {
            console.log(o._source.pin);
            var fields = o.fields;

            if (fields.hasOwnProperty('admin1Code')) {
                var code = fields.countryCode + '.' + formatInt(fields.admin1Code);
                fields.adminCode = code;
                ret.admincodes.push(code);
            }

            ret.data.push(fields);
        });

        return ret;
    },
    /*
     ** Returns the alt_title, used when the query only matches with an alternate name
     */
    getAltTitle: function (names, match)
    {
        for (var i in names){
            for (var j = 0; names[i].charAt(j); j++)
            {
                var k = 0;
                var l = j;
                if (names[i].charAt(j) === match.charAt(k)
                    && (j === 0 || (names[i].charAt(j - 1)
                        && (names[i].charAt(j - 1) === ' '
                            || names[i].charAt(j - 1) === '-'
                            || names[i].charAt(j - 1) === '~'))))
                            {
                    while (names[i].charAt(l) && match.charAt(k)
                        && names[i].charAt(l) === match.charAt(k))
                        {
                        k++;
                        l++;
                    }
                    if (!match.charAt(k))
                        return (names[i]);
                }
            }
        }
        for (i in names){
            var pos = names[i].indexOf(match);
            if (pos !== -1)
                return (names[i]);
        }
        return (match);
    },
    /**
     * Returns the part of the city/country name that matches with the query.
     * Checks both 'name' and 'alternate names'
     *
     * @param   {string} queryString    The client query
     * @param   {string} inBaseName     The in base name
     * @param   {string} alternativeNames   the alternate names
     * @returns {getMatch.inBaseName|getMatch.queryString}
     */
    getMatch: function (queryString, inBaseName, alternativeNames)
    {
        if (queryString === inBaseName) {
            return queryString;
        }

        if (queryString && inBaseName) {
            if (S(inBaseName.toLowerCase()).contains(queryString)) {
                var match = _.find(alternativeNames, function(name) {
                    return S(name.toLowerCase()).contains(queryString);
                });

                return  'undefined' !== match ? inBaseName : queryString;
            }
        }

        return queryString;
    },
    // see http://jsfiddle.net/DanielD/8S4nq/
    isIp: function(str) {
        var regexp = /(^\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$)/;
        return regexp.test(str);
    }
};