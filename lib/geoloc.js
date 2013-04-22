var geoip = require('geoip');

function Point(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
}

module.exports = {
    /*
     * Returns geoloc Point from the requester's ip adress
     * @throws Exception
     */
    getPointfromIp: function(ip, geoliteConfig) {
        var latitude, longitude;

        var city = new geoip.City(geoliteConfig.geolitepath);
        var geo = city.lookupSync(ip);

        if (!geo) {
            return null;
        }

        longitude = geo.longitude;
        latitude = geo.latitude;

        return new Point(latitude, longitude);
    },
    getCityFromIp : function (ip, geoliteConfig) {
        var city = new geoip.City(geoliteConfig.geolitepath);

        return city.lookupSync(ip);
    }
};


