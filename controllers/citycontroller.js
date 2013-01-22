function getUrl(host, dbname, dbcollection)
{
    var my_url = "http://" + host;
    if (host.charAt(host.length - 1) != "/")
        my_url += "/";
    my_url += dbname;
    if (dbname.charAt(dbname.length - 1) != "/")
        my_url += "/";
    my_url += dbcollection;
    if (dbcollection.charAt(dbcollection.length - 1) != "/")
        my_url += "/";
    my_url += '_search';
    return (my_url);
}

/*
 ** Query assembling function
 */

function getCityQuery(name, lon, lat, sort, ord, size)
{
    var my_query = '{"size" : ' + size + ', "sort" : ';
    if (sort == "population")
        my_query += '{"population" : {"order" : "' + ord + '" } }';
    else {
        my_query += '[{ "_geo_distance" : {'
        + '"pin.location" : [' + lon + ', ' + lat + '], "order" : "' + ord
        + '", "unit" : "km" } } ]';
    }
    my_query += ',"fields": ["geonameid", "name", "countryCode", '
    + '"longitude", "latitude", "admin1Code", "names"], "query":'
    + ' {"bool": { "must" : { "terms" : { "featureCode" : '
    + '["ppl", "ppla", "ppla2", "ppla3", "ppla4", "pplc", '
    + '"pplf", "pplg", "ppll", "pplq", "pplr", "ppls", '
    + '"pplw", "pplx", "stlmt"], "minimum_match" : 1 } }, '
    + '"should" : [ { "prefix": {"names" : "' + name
    +  '"} } ';
    my_query += '], "minimum_number_should_match" : 1, "boost" : 1.0 } } }';
    return (my_query);
}

function getSingleCityQuery(id){
    var my_query = '{"fields": ["geonameid", "name", "countryCode",'
    + '"longitude", "latitude", "admin1Code", "names"], "query":'
    + '{"bool": { "must" : { "terms" : { "featureCode" : ["'
    + 'ppl", "ppla", "ppla2", "ppla3", "ppla4", "pplc", "pplf", "pplg",'
    + '"ppll", "pplq", "pplr", "ppls", "pplw", "pplx"'
    + ', "stlmt"], "minimum_match" : 1 } }, "should" : ['
    + '{ "match": {"geonameid" : "' +  id + '"} } ], '
    + '"minimum_number_should_match" : 1, "boost" : 1.0 } } }';
    return (my_query);
    
}

function formatInt(code)
{
    var ret = "";
    if (code < 10)
        ret += "0";
    ret += code;
    return (ret);
}


/*
 ** Returns the part of the city/country name that matches with the query.
 ** Checks both "name" and "alternate names".
 */

function getMatch(match, origin, names)
{
    var pos = 0;
    if (match && origin) {
        var origin_lower = origin.toLowerCase();
        var match_lower = match.toLowerCase();
        pos = origin_lower.indexOf(match_lower);
        if (pos != 0) {
            for (var i in names) {
                var newpos = names[i].indexOf(match_lower);
                if (newpos == 0)
                    return (names[i].substr(newpos, match.length));
            }
            return (match);
        }
        return (origin.substr(pos, match.length));
    }
    return (match);
}

/*
 ** Returns the alt_title, used when the query only matches with an alternate name
 */

function getAltTitle(names, match)
{
    for (var i in names){
        for (var j = 0; names[i].charAt(j); j++)
        {
            var k = 0;
            var l = j;
            console.log(names, match);
            if (names[i].charAt(j) == match.charAt(k)
                && (j == 0 || (names[i].charAt(j - 1)
                    && (names[i].charAt(j - 1) == ' '
                        || names[i].charAt(j - 1) == '-'
                        || names[i].charAt(j - 1) == '~'))))
                        {
                while (names[i].charAt(l) && match.charAt(k)
                    && names[i].charAt(l) == match.charAt(k))
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
        if (pos != -1)
            return (names[i]);
    }
    return (match);
}

function        getType(tab)
{
    for (var i in tab) {
        if (tab[i].subtype == 'xml'
            || tab[i].subtype == "json")
            return (tab[i].subtype);
        else if (tab[i].subtype == "*")
            return ("json");
    }
    return (null);
}


/*
 ** Converts ES hits to an array, in order to improve readability.
 ** Also fills up an array with admincodes.
 */

function convertToTabs(body)
{
    var ret = {};

    ret.data = new Array();
    var results_req = JSON.parse(body);
    var results = results_req['hits']['hits'];

    ret.admincodes = new Array();

    for (var i in results) {
        var rowData = [];
        ret.data.push(results[i]['fields']);
        if (ret.data[i].admin1Code) {
            ret.data[i].adminCode = ret.data[i].countryCode + "."
            + formatInt(ret.data[i].admin1Code);
            ret.admincodes.push(ret.data[i].adminCode);
        } else {
            ret.data[i].adminCode = 0;
        }
    }
    return (ret);
}


/*
 ** Sends back an empty document list.
 */

function sendEmptyResult(res, type)
{
    if (type == "xml") {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('geonames',
        {
            'version':'1.0', 
            'encoding':'UTF-8'
        });
        xml.e('totalResultsCount', "0");
        var xmlS = xml.end({
            pretty:true
        });
        res.send(xmlS);
    }
    else {
        res.json({
            geonames: {
                totalResultsCount: 0
            }
        });
    }
}

function sendFullResult(res, result, data, type)
{
    if (type == "xml") {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('geonames',
        {
            'version':'1.0', 
            'encoding':'UTF-8'
        });
        var xmlS = "";
        
        xml.e('totalResultsCount', data.length.toString());
        for (var i in data) {
            var geo = xml.e('geoname');
            geo.e('geonameid', data[i].geonameid.toString());
            geo.e('title', data[i].name);
            geo.e('country', data[i].countryName);
            for (var j in result) {
                if (data[i].adminCode == result[j].code) {
                    data[i].adminName = result[j].name;
                }
            }
            geo.e('region', data[i].adminName);
        }
        xmlS = xml.end({
            pretty:true
        });
        res.send(xmlS);
    }
    else {
        res.set('Content-Type', 'application/json');
        var json = {
            geonames: {
                totalResultsCount: data.length.toString(),
                geoname: []
            }
        };
        for (i in data) {
            
            var tab = {
                "geonameid": data[i].geonameid.toString(),
                "title": data[i].name,
                "country": data[i].countryName
            };
            for (j in result) {
                if (data[i].adminCode == result[j].code) {
                    data[i].adminName = result[j].name;
                }
            }
            tab.region = data[i].adminName;
            tab.population = data[i].population;
            tab.latitude = data[i].latitude;
            tab.longitude = data[i].longitude;
            tab.names = data[i].names;
            json.geonames.geoname.push(tab);

        }
        res.json(json);
    }
}

/*
 ** Processes obtained results
 */

function getResult(body, vars, res, db, countries, type)
{
    var adminnames = db.collection(vars.mongo.admincodes);

    var tabs = convertToTabs(body);
    var data = tabs.data;
    var admincodes = tabs.admincodes;

    if (data.length == 0)
        return (sendEmptyResult(res, type));
    for (var j in data) {
        for (var i in countries) {
            if (data[j].countryCode == countries[i].code)
                data[j].countryName = countries[i].name;
        }
    }
    adminnames.find({
        code:{
            $in:admincodes
        }
    },
    function(err, result) {
        sendFullResult(res, result, data, type);
    });
    return (0);
}


/*
 ** Returns latitude(lat) and longitude (lon) from the requester's ip adress
 */

function getGeoLoc(req, path, vars)
{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var geoip = require('geoip');
    var res = {};
    try {
        var city = new geoip.City(path);
        var geo = city.lookupSync(ip);
    }
    catch (Exception)
    {
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
    return (res);
}

module.exports = function(app, express, vars) {
    app.get('/city', function(req, res){
        var my_body, sort, ord, type  = "";

        type = getType(req.accepted);
        if (type == null){
            res.send(406);
            return;
        }

        if (req.query.sort) {
            if (req.query.sort != "population" && req.query.sort != "closeness") {
                res.send(400);
                return;
            }
            sort = req.query.sort;
        }
        else
            sort = "population";
        if (req.query.ord) {
            if (req.query.ord != "asc" && req.query.ord != "desc") {
                res.send(400);
                return;
            }
            ord = req.query.ord;
        }
        else {
            if (sort == "population")
                ord = "desc";
            else
                ord = "asc";
        }
        
        var geoloc = getGeoLoc(req, vars.geo.geolitepath, vars);
        
        var my_url = getUrl(vars.es.host, vars.es.name, vars.es.collection);
        
        var request = require('request');
        var mongojs = require('mongojs');
        var db = mongojs(vars.mongo.url);
        var countrynames = db.collection(vars.mongo.countrynames);
        countrynames.find({},
            function(err, docs) {
                my_body = getCityQuery("", geoloc.lon, geoloc.lat, sort, ord, vars.es.size);
                request({
                    uri:my_url, 
                    body:my_body
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        getResult(body, vars, res,
                            db, docs, type);
                    }
                    else {
                        sendEmptyResult(res, type);
                    }
                });
            });
    }),
    app.get('/city/:id', function(req, res){
        var my_body, type  = "";
        type = getType(req.accepted);
        if (type == null){
            res.send(406);
            return;
        }
        var my_url = getUrl(vars.es.host,
            vars.es.name,
            vars.es.collection);
        var request = require('request');
        var mongojs = require('mongojs');
        var db = mongojs(vars.mongo.url);
        var countrynames = db.collection(vars.mongo.countrynames);
        countrynames.find({},
            function(err, docs) {
                my_body = getSingleCityQuery(req.params.id);
                request({
                    uri:my_url, 
                    body:my_body
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200)
                    {
                        getResult(body, vars, res,
                            db, docs, type);
                    }
                    else
                    {
                        sendEmptyResult(res, type);
                    }
                });
            });
    })
};

