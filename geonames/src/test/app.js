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

    describe('GET /city/6587', function() {
        it('an unknown geonameid returns a 404', function(done) {
            request(app)
                    .get('/city/6587')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(404, done);
        });
    });

    describe('GET /ip', function() {
        it('responds with a JSON file', function(done) {
            request(app)
                    .get('/ip?ip=80.12.81.19')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /ip', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/ip?ip=80.12.81.19')
                    .expect('Content-Type', "application/json; charset=utf-8")
                    .expect(200, done);
        });
    });

    describe('GET /ip', function() {
        it('by default responds with a JSON file', function(done) {
            request(app)
                    .get('/ip?ip=80.12.81.19')
                    .set('Accept', 'text/html')
                    .expect(406, done);
        });
    });

    describe('GET /ip', function() {
        it('responds with a 404 if not found', function(done) {
            request(app)
                    .get('/ip?ip=127.0.0.1')
                    .expect(404, done);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(1, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
                        var first = result.shift();
                        var second = result.shift();
                        var third = result.shift();
                        assert(parseInt(first.population) > parseInt(second.population));
                        assert(parseInt(first.population) > parseInt(third.population));
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
                        assert.equal(30, res.header['x-geonames-total']);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness&client-ip=173.236.51.130&limit=1', function() {
        it('Returns a collection when sorting by closeness and providing an ip', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&client-ip=173.236.51.130&limit=1')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(1, res.header['x-geonames-total']);
                        var result = result.pop();
                        assert(result.country.name.indexOf("United") !== -1, "Expecting to find 'United' in " + result.country);
                        done();
                    });
        });
    });

    describe('GET /city?name=paris&sort=closeness&client-ip=invalid-ip', function() {
        it('Returns 400 when ip is not valid', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&client-ip=invalid-ip')
                    .expect(400, done);
        });
    });

    describe('GET /city?name=paris&sort=closeness&client-ip=127.0.0.1', function() {
        it('Test fallback to sort by population if geo ip failed', function(done) {
            request(app)
                    .get('/city?name=paris&sort=closeness&client-ip=127.0.0.1')
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
                        assert.equal(result.name, "Paris", "Expecting name 'Paris'");
                        assert.equal(result.geonameid, 2988507, "Expecting geonameid '2988507'");
                        done();
                    });
        });
    });

    describe('GET /city/0000000', function() {
        it('Returns nothing when city can not be found', function(done) {
            request(app)
                    .get('/city/0000000')
                    .expect(404)
                    .end(function(err, res) {
                        if (err) return done(err);
                        var result = JSON.parse(res.text);
                        assert.equal(result.error, "not found", "Expecting a not found message");
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
                        assert.equal(0, res.header['x-geonames-total']);
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
                        assert.equal(2, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(30, res.header['x-geonames-total']);
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
                        assert.equal(1, res.header['x-geonames-total']);
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
                        assert.equal(1, res.header['x-geonames-total']);
                        var city = result[0];
                        assert.equal(city.location.latitude, "48.81");
                        assert.equal(city.location.longitude, "2.38");
                        done();
                    });
        });
    });
});
