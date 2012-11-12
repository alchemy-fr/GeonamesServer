var vars = {};

vars.app = {};
vars.web = {};
vars.es = {};
vars.mongo = {};
vars.geo = {};

vars.app.verbose = false;

vars.web.port = process.env.PORT || 3000;

vars.es.host = "localhost:9200";
vars.es.name = "geonames";
vars.es.collection = "countries";
vars.es.size = 30;

vars.mongo.url = "geonames";
vars.mongo.countrynames = "countrynames";
vars.mongo.admincodes = "admincodes";

vars.geo.geolitepath = './data/GeoLiteCity.dat';
vars.geo.default_lon = 0;
vars.geo.default_lat = 0;

// do not touch

module.exports = vars;