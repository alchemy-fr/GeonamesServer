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

            res.set('Content-Type', 'text/xml');

            var xml = builder.create('geonames', {
                'version':'1.0',
                'encoding':'UTF-8'
            });

            xml.e('totalResultsCount', '0');

            res.send(xml.end({pretty:true}));

            return;
        }

        res.set('Content-Type', 'application/json');
        res.json({geonames: {'totalResultsCount': 0}});
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
     * @param   {string}    body A json response
     * @returns {object}
     */
    convertToTabs: function (body)
    {
        var ret = {data: [], admincodes: []};

        var results = JSON.parse(body)['hits']['hits'] || [];

        _.each(results, function (o) {
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
        if (queryString && inBaseName) {
            var queryStringLower = queryString.toLowerCase();

            if (S(inBaseName.toLowerCase()).contains(queryStringLower)) {
                var match = _.find(alternativeNames, function(name) {
                    return S(name.toLowerCase()).contains(queryStringLower);
                });

                return  'undefined' !== match ? inBaseName : queryString;
            }
        }

        return queryString;
    }
};