var _ = require('underscore');
var common = require( './../common' );

/**
 * Find a city according to an ip address
 *
 * @param {string} ip An ip
 * @param {string} path The GeoLiteCity.dat filepath
 * @returns {@exp;city@call;lookupSync}
 */
function getGeoLoc(ip, path)
{
    var geoip = require('geoip');
    var city = new geoip.City(path);

    return city.lookupSync(ip);
}

function sendFullResult(res, result, geoloc, ip, type)
{
    if (type === 'xml') {
        var builder = require('xmlbuilder');
        res.set('Content-Type', 'text/xml');
        var xml = builder.create('result', {
            'version':'1.0',
            'encoding':'UTF-8'
        });
        var xmlS = '';

        xml.att('for', ip);
        var geo = xml.e('geoname');
        geo.e('city', geoloc.city);
        geo.e('country_code', geoloc.country_code);
        geo.e('country', geoloc.country_name);
        if (result && result.name) {
            geo.e('fips', result.name);
        } else {
            geo.e('fips');
        }
        geo.e('longitude', geoloc.longitude.toString());
        geo.e('latitude', geoloc.latitude.toString());
        xmlS = xml.end({
            pretty:true
        });
        res.send(xmlS);
        return;
    }

    res.set('Content-Type', 'application/json');
    var json = {
        ip: ip,
        result: {
            geoname: {
                city: geoloc.city,
                country_code: geoloc.country_code,
                country: geoloc.country_name,
                longitude: geoloc.longitude.toString(),
                latitude: geoloc.latitude.toString()
            }
        }
    };

    if (result && result.name) {
        json.result.geoname.fips = result.name;
    }

    res.json(json);

    return;
}

module.exports = function(app, express, vars) {
    app.get('/ip/:id', function(req, res){
        var mongojs = require('mongojs');
        var db = mongojs(vars.mongo.url);
        var ip, geoloc;


        if (req.params.id) {
            ip = req.params.id;
            geoloc = getGeoLoc(ip, vars.geo.geolitepath);

        }

        if (!req.params.id || !geoloc) {
            return (sendEmptyResult(res, app.get('req.type')));
        }

        var adminnames = db.collection(vars.mongo.admincodes);
        var code = geoloc.country_code + '.' + geoloc.region;

        adminnames.findOne({code:code}, function(err, result) {
            return(sendFullResult(res, result, geoloc, ip, app.get('req.type')));
        });
    });
};
