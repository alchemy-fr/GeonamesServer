var geoip = require('geoip');

function Point(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
}

module.exports = {
    /*
     ** Returns geoloc Point from the requester's ip adress
     */
    getPointfromIp: function(ip, geoliteConfig) {
        var latitude, longitude;

        try {
            var city = new geoip.City(geoliteConfig.geolitepath);
            var geo = city.lookupSync(ip);

            if (!geo) {
                longitude = geoliteConfig.default_lon;
                latitude = geoliteConfig.default_lat;
            } else {
                longitude = geo.longitude;
                latitude = geo.latitude;
            }
        } catch (Exception) {
            longitude = geoliteConfig.default_lon;
            latitude = geoliteConfig.default_lat;
        }

        return new Point(latitude, longitude);
    },
    getCityFromIp : function (ip, geoliteConfig) {
        var city = new geoip.City(geoliteConfig.geolitepath);

        return city.lookupSync(ip);
    }
};


