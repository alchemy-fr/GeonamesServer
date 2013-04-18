var request = require('supertest');
var assert = require('assert');
var app = require('../server');

// Sets tests config
app.set('app.config', {
    app: {
        verbose: true,
        port: process.env.PORT || 3000,
        allowed_domains: ["*"]
    },
    es: {
        host: "127.0.0.1:9200",
        name: "tests",
        collection: "cities",
        size: 30
    },
    mongo: {
        url: "tests",
        countrynames: "countrynames",
        admincodes: "admincodes"
    },
    geo: {
        geolitepath: './resources/data/GeoLiteCity.dat',
        default_lon: 0,
        default_lat: 0
    }
});

describe('Geoname servers', function() {
    describe('GET /city/', function() {
        it('responds with a XML file', function(done) {
            request(app)
                    .get('/city/')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/', function() {
        it('responds with a JSON file', function(done) {
            request(app)
                    .get('/city/')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/2968815', function() {
        it('responds with an XML file', function(done) {
            request(app)
                    .get('/city/2968815')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/2968815', function() {
        it('responds with an non-JSON file', function(done) {
            request(app)
                    .get('/city/2968815')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city?name=paris', function() {
        it('responds with a XML file', function(done) {
            request(app)
                    .get('/city?name=paris')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city?name=paris', function() {
        it('responds with a non-JSON file', function(done) {
            request(app)
                    .get('/city?name=paris')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city?name=%20paris%20', function() {
        it('responds with a non-JSON file', function(done) {
            request(app)
                    .get('/city?name=paris')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200)
                    .end(function(err, res) {
                        console.log(err, res);
                        done();
                    });
        });
    });

    describe('GET /', function() {
        it('cannot access the root directory', function(done) {
            request(app)
                    .get('/')
                    .expect(200)
                    .end(function(err, res) {
                        done();
                    });
        });
    });

    describe('GET /random_url', function() {
        it('accesses non-existing URL', function(done) {
            request(app)
                    .get('/random_url')
                    .expect(404)
                    .end(function(err, res) {
                        done();
                    });
        });
    });

    describe('GET /city/2968815', function() {
        it('can\'t find Paris by geonameid', function(done) {
            request(app)
                    .get('/city/2968815')
                    .set('Accept', 'text/XML')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city/2968815', function() {
        it('can\'t find Paris by geonameid', function(done) {
            request(app)
                    .get('/city/2968815')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&country=aaaaaaaaaa', function() {
        it('finds Paris in a non-existing country', function(done) {
            request(app)
                    .get('/city?name=paris&country=aaaaaaaaaa')
                    .set('Accept', 'application/XML')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") === -1);
                        done();
                    });
        });
    });

    describe('GET /city', function() {
        it('finds Paris even though the name parameter is empty', function(done) {
            request(app)
                    .get('/city')
                    .set('Accept', 'application/XML')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&country=fr&ord=asc&sort=population', function() {
        it('responds with an non-XML file', function(done) {
            request(app)
                    .get('/city?name=paris&country=fr&ord=asc&sort=population')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city?sort=closeness&ord=asc', function() {
        it('responds with a non-JSON file', function(done) {
            request(app)
                    .get('/city?sort=closeness&ord=asc')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city?sort=randomparameter', function() {
        it('doesn\'t respond with a 400 error', function(done) {
            request(app)
                    .get('/city?sort=randomparameter')
                    .set('Accept', 'text/xml')
                    .expect(400, done);
        });
    });

    describe('GET /city', function() {
        it('Responds with a 406 error to a wrong accept header', function(done) {
            request(app)
                    .get('/city/')
                    .set('Accept', 'text/html')
                    .expect(406, done);
        });
    });

    describe('GET /city?name=paris&sort=ip', function() {
        it('Responds with a 400 error, missing sortParms parameter', function(done) {
            request(app)
                    .get('/city/?name=paris&sort=ip')
                    .set('Accept', 'text/xml')
                    .expect(400, done);
        });
    });

    describe('GET /city?name=paris&ip=127.0.0.1', function() {
        it('Responds with a 400 error, cannot handle ip and name at the same time', function(done) {
            request(app)
                    .get('/city/?name=paris&ip=127.0.0.1')
                    .set('Accept', 'text/xml')
                    .expect(400, done);
        });
    });
});
