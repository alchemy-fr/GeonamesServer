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
        url: "geonames",
        countrynames: "countrynames",
        admincodes: "admincodes"
    },
    geo: {
        geolitepath: './resources/data/GeoLiteCity.dat',
        default_lon: 0,
        default_lat: 0
    }
});

describe('Tests accepted content types', function() {
    describe('GET /city', function() {
        it('responds with a XML file', function(done) {
            request(app)
                    .get('/city/')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city', function() {
        it('responds with a JSON file', function(done) {
            request(app)
                    .get('/city')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/city')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/city')
                    .set('Accept', 'text/html')
                    .expect(406, done);
        });
    });

    describe('GET /city/2988507', function() {
        it('responds with a XML file', function(done) {
            request(app)
                    .get('/city/2988507')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/2988507', function() {
        it('responds with a JSON file', function(done) {
            request(app)
                    .get('/city/2988507')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/2988507', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/city/2988507')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /city/2988507', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/city/2988507')
                    .set('Accept', 'text/html')
                    .expect(406, done);
        });
    });

    describe('GET /ip', function() {
        it('responds with a XML file', function(done) {
            request(app)
                    .get('/ip')
                    .set('Accept', 'text/xml')
                    .expect('Content-Type', "text/xml; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /ip', function() {
        it('responds with a JSON file', function(done) {
            request(app)
                    .get('/ip')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /ip', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/ip')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /ip', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/ip')
                    .set('Accept', 'text/html')
                    .expect(406, done);
        });
    });
});

describe('Tests / route', function() {
    describe('GET /', function() {
        it('Return a 200 code', function(done) {
            request(app)
                    .get('/')
                    .expect(200,done);
        });
    });
});

describe('Tests functionnal', function() {
    describe('GET /random_url', function() {
        it('accesses non-existing URL', function(done) {
            request(app)
                    .get('/random_url')
                    .expect(404, done);
        });
    });
});

describe('Tests /city route', function() {

    describe('GET /city?name=paris', function() {
        it('Returns a collection when providing a full name', function(done) {
            request(app)
                    .get('/city?name=paris')
                    .expect(200, done)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=pa', function() {
        it('Returns a collection when providing an incomplete name', function(done) {
            request(app)
                    .get('/city?name=pa')
                    .expect(200, done)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city', function() {
        it('Returns a collection', function(done) {
            request(app)
                    .get('/city')
                    .expect(200, done)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=%20paris%20', function() {
        it('Returns a response when providing a name with space chars', function(done) {
            request(app)
                    .get('/city?name=%20paris%20')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=population', function() {
        it('Returns a response when sorting by population', function(done) {
            request(app)
                    .get('/city?name=paris&sort=population')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness', function() {
        it('Returns a collection when sorting by closeness', function(done) {
            request(app)
                    .get('/city?name=paris')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness&sortParams[ip]=144.35.6.78', function() {
        it('Returns a collection when sorting by closeness and providing an ip', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&sortParams[ip]=144.35.6.78')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness&sortParams[ip]=invalid-ip', function() {
        it('Returns 400 when ip is not valid', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&sortParams[ip]=invalid-ip')
                    .expect(400, done);
        });
    });

    describe('GET /city?name=paris&sort=unknown', function() {
        it('Returns 400 when sort is not valid', function(done) {
            request(app)
                    .get('/city?name=paris&sort=unknown')
                    .expect(400, done);
        });
    });

    describe('GET /city/2988507', function() {
        it('Find Paris by geonameid', function(done) {
            request(app)
                    .get('/city/2988507')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city/0000000', function() {
        it('Returns nothing when city can not be found', function(done) {
            request(app)
                    .get('/city/0000000')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") === -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&country=aaaaaaaaaa', function() {
        it('Cant find paris in a non-existing country', function(done) {
            request(app)
                    .get('/city?name=paris&country=aaaaaaaaaa')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") === -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&country=fr', function() {
        it('Find paris in a france', function(done) {
            request(app)
                    .get('/city?name=paris&country=fr')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") !== -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=avg', function() {
        it('Returns collection when sorting', function(done) {
            request(app)
                    .get('/city?name=paris&sort=asc')
                    .expect(400, done);
        });
    });

    describe('GET /city?name=paris&sort=asc', function() {
        it('Returns collection when sorting', function(done) {
            request(app)
                    .get('/city?name=paris&sort=asc')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") === -1);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=desc', function() {
        it('Returns collection when sorting', function(done) {
            request(app)
                    .get('/city?name=paris&sort=desc')
                    .expect(200)
                    .end(function(err, res) {
                        assert(res.text.indexOf("Paris") === -1);
                        done();
                    });
        });
    });
});
