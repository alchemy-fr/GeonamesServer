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

function getQuery(name, codes, lon, lat, sort, size)
{
    var my_query = '{"size" : ' + size + ', "sort" : ';
    if (sort == "population")
	my_query += '{"population" : {"order" : "desc" } }';
    else {
	my_query += '[{ "_geo_distance" : {'
	    + '"pin.location" : [' + lon + ', ' + lat + '], "order" : "asc",'
	    + '"unit" : "km" } } ]';
    }
    my_query += ',"fields": ["geonameid", "name", "countryCode", '
	+ '"longitude", "latitude", "admin1Code", "names"], "query":'
	+ ' {"bool": { "must" : { "terms" : { "featureCode" : '
	+ '["ppl", "ppla", "ppla2", "ppla3", "ppla4", "pplc", '
	+ '"pplf", "pplg", "ppll", "pplq", "pplr", "ppls", '
	+ '"pplw", "pplx", "stlmt"], "minimum_match" : 1 } }, '
	+ '"should" : [ { "prefix": {"names" : "' + name
	+  '"} } ';
    if (codes.length > 0) {
	my_query += ', { "terms" : { "countryCode" : [';
	var flag = false;
	for (var i in codes)
	    {
		if (flag == true) {
		    my_query += ',';
		}
		else
		    flag = true;
		my_query += ' "' + codes[i] + '" ';
	    }
	my_query += "] } }";
	my_query += '], "minimum_number_should_match" : 2, "boost" : 1.0 } } }';
    }
    else
	my_query += '], "minimum_number_should_match" : 1, "boost" : 1.0 } } }';
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
    for (var i in names){
	var pos = names[i].indexOf(match);
	if (pos != -1)
	    return (names[i]);
    }
    return (match);
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
** Sends back an empty XML tree.
*/

function sendEmptyResult(res)
{
    var builder = require('xmlbuilder');
    res.set('Content-Type', 'text/xml');
    var xml = builder.create('geonames',
			     {'version':'1.0', 'encoding':'UTF-8'});
    xml.e('totalResultsCount', "0");
    var xmlS = xml.end({pretty:true});
    res.send(xmlS);
}

/*
** Fills up and sends back an XML file containing all the data
*/

function sendFullResult(res, result, data, cityname, countryname)
{
    var builder = require('xmlbuilder');
    res.set('Content-Type', 'text/xml');
    var xml = builder.create('geonames',
			     {'version':'1.0', 'encoding':'UTF-8'});
    var xmlS = "";

    xml.e('totalResultsCount', data.length.toString());
    for (var i in data) {
	var geo = xml.e('geoname');
	geo.e('geonameid', data[i].geonameid.toString());
	geo.e('title', data[i].name);
	var title_match = getMatch(cityname, data[i].name, data[i].names);
	if (data[i].name.indexOf(title_match) != 0)
	    geo.e('title_alt', getAltTitle(data[i].names, cityname));
	geo.e('title_match', title_match);
	geo.e('country', data[i].countryName);
	geo.e('country_match', getMatch(countryname, data[i].countryName));
	for (var j in result) {
	    if (data[i].adminCode == result[j].code) {
		data[i].adminName = result[j].name;
	    }
	}
	geo.e('region', data[i].adminName);
    }
    xmlS = xml.end({pretty:true});
    res.send(xmlS);
}

/*
** Processes obtained results
*/

function getResult(body, vars, res, cityname, db, countryname, countries)
{
    var adminnames = db.collection(vars.mongo.admincodes);

    var tabs = convertToTabs(body);
    var data = tabs.data;
    var admincodes = tabs.admincodes;

   if (data.length == 0)
       return (sendEmptyResult(res));
   for (var j in data) {
       for (var i in countries) {
	   if (data[j].countryCode == countries[i].code)
	       data[j].countryName = countries[i].name;
       }
   }
   adminnames.find({code:{$in:admincodes}},
		   function(err, result) {
		       sendFullResult(res, result, data, cityname, countryname);
		   });
}


/*
** Returns latitude(lat) and longitude (lon) from the requester's ip adress
*/

function getGeoLoc(req, path, vars)
{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var geoip = require('geoip');
    try {
        var city = new geoip.City(path);
        var geo = city.lookupSync(ip);
    }
    catch (Exception)
        {
            var res = {};
            res.lon = vars.geo.default_lon;
            res.lat = vars.geo.default_lat;
            return (res);
        }
    var res = {};
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
    app.get('/find_city', function(req, res){
	    var city_lower, countryname, cityname, my_body, sort  = "";
	    if (req.query.city) {
		var tab = req.query.city.split(",");
		if (tab)
		    cityname = tab[0];
		else
		    cityname = req.query.city;
		if (tab && tab[1])
		    countryname = tab[1];
		city_lower = cityname.toLowerCase();
	    }
	    else
		return (sendEmptyResult(res));
	    if (req.query.sort)
		sort = req.query.sort;

	    var my_url = getUrl(vars.es.host,
				vars.es.name,
				vars.es.collection);


	    var request = require('request');

	    var mongojs = require('mongojs');
	    var db = mongojs(vars.mongo.url);

	    var geoloc = getGeoLoc(req, vars.geo.geolitepath, vars);
	    var codes = new Array();

	    var countrynames = db.collection(vars.mongo.countrynames);
	    countrynames.find({},
			      function(err, docs) {
				  if (countryname) {
				      var country_lower = countryname.toLowerCase();
				  for (var i in docs)
				      if (docs[i].name.toLowerCase().indexOf(country_lower) == 0 ) {
					  codes.push(docs[i].code.toLowerCase());
				      }
				  if (codes.length == 0)
				      return (sendEmptyResult(res));
				  }
				  my_body = getQuery(city_lower, codes,
						     geoloc.lon, geoloc.lat,
						     sort, vars.es.size);
				  request({uri:my_url, body:my_body},
					  function (error, response, body) {
					      if (!error && response.statusCode == 200)
                                                  getResult(body, vars, res, cityname,
                                                            db, countryname, docs);
					      else
						  sendEmptyResult(res);
					  });
			      });
	})};

