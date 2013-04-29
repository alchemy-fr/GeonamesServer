var request = require('supertest');
var assert = require('assert');
var app = require('../server');

var config = app.get('app.config');

config.app.verbose = true;
config.es.elastic_index = config.es.elastic_index_test || 'tests';
config.mongo.mongo_database = config.mongo.mongo_database_test || 'tests';

// Sets tests config
app.set('app.config', config);

describe('Tests configuration', function() {
    describe('ElasticSearch configuration string', function() {
        it('Ensures elastic configuration is valid', function(done) {
            request(app).get('/').end(function(err, res) {
                var cs = app.get('es.connection.string')('node_type');
                assert(cs.indexOf("node_type") !== -1, "Expecting to find 'node_type' in " + cs);
                assert(typeof cs === 'string', "Expecting to find 'string' got " + typeof cs);
                done();
            });
        });
    });

    describe('MongoDB configuration string', function() {
        it('Ensures MongoDB configuration is valid', function(done) {
            request(app).get('/').end(function(err, res) {
                var cs = app.get('mongo.connection.string')();
                assert(typeof cs === 'string', "Expecting to find 'string' got " + typeof cs);
                done();
            });
        });
    });
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
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount,30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&limit=1', function() {
        it('Returns a collection with one result', function(done) {
            request(app)
                    .get('/city?name=paris&limit=1')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount,1, "Expecting 1 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe('GET /city?name=pa', function() {
        it('Returns a collection when providing an incomplete name', function(done) {
            request(app)
                    .get('/city?name=pa')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe('GET /city', function() {
        it('Returns a collection', function(done) {
            request(app)
                    .get('/city')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        var first = result.geonames.geoname.shift();
                        var second = result.geonames.geoname.shift();
                        var third = result.geonames.geoname.shift();
                        assert(parseInt(first.population) > parseInt(second.population));
                        assert(parseInt(second.population) > parseInt(third.population));
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness&sortParams[ip]=173.194.40.162&limit=1', function() {
        it('Returns a collection when sorting by closeness and providing an ip', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&sortParams[ip]=173.194.40.162&limit=1')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 1, "Expecting 1 got " + result.geonames.totalResultsCount);
                        var result = result.geonames.geoname.pop();
                        assert(result.country.indexOf("United") !== -1, "Expecting to find 'United' in " + result.country);
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

    describe('GET /city?name=paris&sort=closeness&sortParams[ip]=127.0.0.1', function() {
        it('Test fallback to sort by population if geo ip failed', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&sortParams[ip]=127.0.0.1')
                    .expect(200).
                    end(function(err, res) {
                        if (err) return done(err);
                        assert.equal(res.header['x-geonames-sortby'], 'population');
                        done();
                    });
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 1, "Expecting 1 got " + result.geonames.totalResultsCount);
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 0, "Expecting 0 got " + result.geonames.totalResultsCount);
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 0, "Expecting 0 got " + result.geonames.totalResultsCount);
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
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 2, "Expecting 2 got " + result.geonames.totalResultsCount);
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

    describe('GET /city?name=paris&order=asc', function() {
        it('Returns collection when sorting', function(done) {
            request(app)
                    .get('/city?name=paris&order=asc')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=population&order=desc', function() {
        it('Returns collection when sorting', function(done) {
            request(app)
                    .get('/city?name=paris&order=desc')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 30, "Expecting 30 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });


    describe("GET /city?name=paris-l&sort=population", function() {
        it('Returns a response when search words with hyphens and diacritics', function(done) {
            request(app)
                    .get("/city?name=paris-l'ho&sort=population")
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 1, "Expecting 1 got " + result.geonames.totalResultsCount);
                        done();
                    });
        });
    });

    describe("GET /city?name=paris&limit=1", function() {
        it('Returns JSON response with geopoint location', function(done) {
            request(app)
                    .get("/city?name=paris&limit=1&sort=population")
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.geonames.totalResultsCount, 1, "Expecting 1 got " + result.geonames.totalResultsCount);
                        var city = result.geonames.geoname[0];
                        assert.equal(city.location.latitude, "48.81");
                        assert.equal(city.location.longitude, "2.38");
                        done();
                    });
        });
    });

    describe("GET /city?name=paris&limit=1", function() {
        it('Returns XML response with geopoint location', function(done) {
            request(app)
                    .get("/city?name=paris&limit=1&sort=population")
                    .set('Accept', 'text/xml')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        assert(res.text.indexOf('<location latitude="48.81" longitude="2.38"/>') !== -1);
                        done();
                    });
        });
    });
});
