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
    * @returns {void}
    */
    sendEmptyResponse : function (res) {
        res.header('X-Geonames-Total', '0');
        res.jsonp([]);
    },
    sendNotFoundResponse : function (res) {
        res.status(404).jsonp({"error":"not found"});
    },
    sendErrorResponse : function (res) {
        res.status(500).jsonp({"error":"internal server error"});
    },
    sendBadRequestResponse : function (res, message) {
        res.status(400).jsonp({"error":message});
    },
    /**
    * Construct the Elastic search connection string
    *
    * @param {string} host
    * @param {string} dbname
    * @param {string} dbcollection
    * @returns {String}
    */
    getElasticSearchEndpoint: function (scheme, host, port, index, index_type) {
        var port = port || 9200;

        return scheme + '://'
            + S(host).chompRight('/')
            + ':' + S(port).ensureRight('/')
            + S(index).ensureRight('/')
            + S(index_type).ensureRight('/')
            + '_search';
    },
    getMongoConnectionString: function(host, port, user, pass, database) {
        user = user || '';
        pass = pass || '';
        port = port || 27017;
        database = database || '';

        var credentials = user + ('' !== pass ? ':' + pass + '@' : ('' !== user ? '@' : ''));

        return credentials
           + host
           + ':' + S(port).ensureRight('/').s
           + database;
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
        var ret = {data: [], admincodes: [], highlight: hits.highlight};

        var results = JSON.parse(hits)['hits']['hits'] || [];

        _.each(results, function (o) {
            var fields = o._source;
            fields.score = o._score;
            
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
    isIpV4: function(str) {

        var regexp = /^\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*$/;
        return regexp.test(str);
    }
};
