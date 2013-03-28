function sendEmptyResult(res, type)
{
    if (type == "xml") {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('result',
        {
            'version':'1.0', 
            'encoding':'UTF-8'
        });
        var xmlS = xml.end({
            pretty:true
        });
        res.send(xmlS);
    }
    else {
        res.set('Content-Type', 'application/json');
        res.json({
            "result": {
        }
        });
    }
}

function getGeoLoc(ip, path)
{
    var geoip = require('geoip');
    var city = new geoip.City(path);
    
    var geo = city.lookupSync(ip);
    return (geo);
}

function sendFullResult(res, result, geoloc, ip, type)
{
    if (type == "xml") {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('result', {
            'version':'1.0', 
            'encoding':'UTF-8'
        });
        var xmlS = "";
    
        xml.att('for', ip);
        var geo = xml.e('geoname');
        geo.e('city', geoloc.city);
        geo.e('country_code', geoloc.country_code);
        geo.e('country', geoloc.country_name);
        if (result && result.name)
            geo.e('fips', result.name);
        else
            geo.e('fips');
        geo.e('longitude', geoloc.longitude.toString());
        geo.e('latitude', geoloc.latitude.toString());
        xmlS = xml.end({
            pretty:true
        });
        res.send(xmlS);
    }
    else {
        res.set('Content-Type', 'application/json');
        var json = {
            "ip":ip,
            result: {
                geoname: {
                    'city':geoloc.city,
                    'country_code':geoloc.country_code,
                    "country":geoloc.country_name

                }
            }
        };
        if (result && result.name)
            json.result.geoname.fips = result.name;
        json.result.geoname.longitude = geoloc.longitude.toString();
        json.result.geoname.latitude = geoloc.latitude.toString();
        res.json(json);
    }
}

function        getType(tab)
{
    for (var i in tab) {
        if (tab[i].subtype
            && (tab[i].subtype.toLowerCase() == 'xml'
                || tab[i].subtype.toLowerCase() == "json"))
            return (tab[i].subtype.toLowerCase());
        else if (tab[i].subtype == "*")
            return ("json");
    }
    return (null);
}

module.exports = function(app, express, vars) {
    app.get('/ip/:id', function(req, res){
        var request = require('request');    
        var mongojs = require('mongojs');
        var db = mongojs(vars.mongo.url);
        var ip, geoloc, type = "";
         
        type = getType(req.accepted);
        if (type == null){
            res.send(406);
            return;
        }
         
        if (req.params.id) {
            ip = req.params.id;
            geoloc = getGeoLoc(ip, vars.geo.geolitepath);
                
        }
        if (!req.params.id || !geoloc)
            return (sendEmptyResult(res, type));
        var adminnames = db.collection(vars.mongo.admincodes);
        var code = geoloc.country_code + "." + geoloc.region;
        adminnames.findOne({
            'code':code
        },
        function(err, result) {
            return(sendFullResult(res, result, geoloc, ip, type));
        });
        return (0);
    })
};
