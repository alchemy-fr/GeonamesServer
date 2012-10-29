function getUrl(host, dbname, dbcollection)
{
    var my_url = "http://" + host + "/"
	+ dbname + "/" + dbcollection
	+ '/_search';
    return (my_url);
}

function getQuery(geonameid)
{
    var my_query = '{"fields": ["name", "countryCode", '
	+ '"longitude", "latitude", "admin1Code"], "query":' 
	+ ' {"bool": { "must" : { "terms" : { "featureCode" : '
	+ '["ppl", "ppla", "ppla2", "ppla3", "ppla4", "pplc", '
	+ '"pplf", "pplg", "ppll", "pplq", "pplr", "ppls", '
	+ '"pplw", "pplx", "stlmt"], "minimum_match" : 1 } }, '
	+ '"should" : { "term": {"geonameid" : "' + geonameid 
	+  '"} }, "minimum_number_should_match" : 1, "boost" : 1.0 } } }';
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

function sendEmptyResult(res) {
    var builder = require('xmlbuilder');
    res.set('Content-Type', 'text/xml');
    var xml = builder.create('result',
			     {'version':'1.0', 'encoding':'UTF-8'});
    var xmlS = "";
    xmlS = xml.end({pretty:true});
    res.send(xmlS);
}

function sendFullResult(res, data, i, docs) {
    var builder = require('xmlbuilder');
    res.set('Content-Type', 'text/xml');
    var xml = builder.create('result',
			     {'version':'1.0', 'encoding':'UTF-8'});
    var xmlS = "";
    var geo = xml.ele('geoname');
    geo.ele('city', data[i].name);
    geo.ele('country_code', data[i].countryCode);
    geo.ele('country', data[i].countryName);
    if (docs)
	geo.ele('fips', docs.name);
    else
	geo.ele('fips');
    geo.ele('latitude', data[i].latitude.toString());
    geo.ele('longitude', data[i].longitude.toString());
    xmlS = xml.end({pretty:true});
    res.send(xmlS);
}


function convertToTabs(body) {
    var data = new Array();
    var results_req = JSON.parse(body);
    var results = results_req['hits']['hits'];
    for (var i in results) 
	data[i] = results[i]['fields'];
    return (data);
}


function getResults(body, vars, res)
{
    var mongojs = require('mongojs');
    var db = mongojs(vars.mongo.url);
    var countrynames = db.collection(vars.mongo.countrynames);
    var admincodes = db.collection(vars.mongo.admincodes);

    var data = convertToTabs(body);
    if (!data || data.length == 0)
	return(sendEmptyResult(res));
    for (var i in data) {
	countrynames.findOne({code:data[i].countryCode},
			     function(err, docs) {
				 data[i].countryName = docs.name;
				 var code = data[i].countryCode + "."
				     + formatInt(data[i].admin1Code);
				 admincodes.findOne({code:code},
						    function (err, docs) {
							return (sendFullResult(res, data,
									       i, docs));
						    });
			     });
    }
}

module.exports = function(app, express, vars) {
    app.get('/get_name', function(req, res){
	    var request = require('request');    
	    var my_url = getUrl(vars.es.host,
				vars.es.name,
				vars.es.collection);
	    var geonameid = "";
	    if (req.param('geonameid'))
		geonameid = req.param('geonameid');
	    var my_body = getQuery(geonameid);
	    request({uri:my_url, body:my_body},
		    function (error, response, body) {
			var results = "";
			if (!error && response.statusCode == 200)
			    return (getResults(body, vars, res));
			else
			    return (sendEmptyResult(res));
		    });
	});
}