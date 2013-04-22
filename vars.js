/**
 * Sets application global configuration variables
 */

var vars = {
    app: {
        verbose: false,
        port: process.env.PORT || 3000,
        allowed_domains: ["*"]
    },
    es: {
        host: "127.0.0.1:9200",
        name: "geonames",
        collection: "cities",
        size: 30
    },
    mongo: {
        url: "geonames",
        countrynames: "countrynames",
        admincodes: "admincodes"
    },
    geo: {
        geolitepath: './resources/data/GeoLiteCity.dat',
        default_lon: 0,
        default_lat: 0
    }
};

// do not touch
module.exports = vars;
