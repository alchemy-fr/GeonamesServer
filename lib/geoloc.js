var vars = require('./../vars');
var geoip = require('geoip');

function Point(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
}

module.exports = {
    /*
     ** Returns geoloc Point from the requester's ip adress
     */
    getPointfromIp: function(ip) {
        var latitude, longitude;

        try {
            var city = new geoip.City(vars.geo.geolitepath);
            var geo = city.lookupSync(ip);

            if (!geo) {
                longitude = vars.geo.default_lon;
                latitude = vars.geo.default_lat;
            } else {
                 longitude = geo.longitude;
                latitude = geo.latitude;
            }
        } catch (Exception) {
            longitude = vars.geo.default_lon;
            latitude = vars.geo.default_lat;
        }

        return new Point(latitude, longitude);
    },
    getCityFromIp : function (ip) {
        var city = new geoip.City(vars.geo.geolitepath);

        return city.lookupSync(ip);
    }
};


