var request = require('supertest');
var assert = require('assert');

var app = require('../server');

describe('App', function() {
        describe('GET /city/', function() {
                it('responds with a non-XML file', function(done) {
                        request(app)
                            .get('/city/')
                            .set('Accept', 'text/xml')
                            .expect('Content-Type', "text/xml")
                            .expect(200, done);
                    })
                    });
                    
        describe('GET /city/', function() {
                it('responds with a non-JSON file', function(done) {
                        request(app)
                            .get('/city/')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200, done);
                    })
                    });

        describe('GET /city/2968815', function() {
                it('responds with an non-XML file', function(done) {
                        request(app)
                            .get('/city/2968815')
                            .set('Accept', 'text/xml')
                            .expect('Content-Type', "text/xml")
                            .expect(200, done);
                    })
                    });

        describe('GET /city/2968815', function() {
                it('responds with an non-JSON file', function(done) {
                        request(app)
                            .get('/city/2968815')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200, done);
                    })
                    });


        describe('GET /ip/0.0.0.0', function() {
                it('responds with an non-XML file', function(done) {
                        request(app)
                            .get('/ip/0.0.0.0')
                            .set('Accept', 'text/xml')
                            .expect('Content-Type', "text/xml")
                            .expect(200, done);
                    })
                    });

        describe('GET /ip/0.0.0.0', function() {
                it('responds with an non-JSON file', function(done) {
                        request(app)
                            .get('/ip/0.0.0.0')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200, done);
                    })
                    });

        describe('GET /search?query=paris', function() {
                it('responds with a non-XML file', function(done) {
                        request(app)
                            .get('/search?query=paris')
                            .set('Accept', 'text/xml')
                            .expect('Content-Type', "text/xml")
                            .expect(200, done);
                    })
                    });
                    
        describe('GET /search?query=paris', function() {
                it('responds with a non-JSON file', function(done) {
                        request(app)
                            .get('/search?query=paris')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200, done);
                    })
                    });

        describe('GET /', function() {
                it('cannot access the root directory', function(done) {
                        request(app)
                            .get('/')
                            .expect(200)
                            .end(function(err, res) {
                                    done();
                                });
                    })
                    });


        describe('GET /random_url', function() {
                it('accesses non-existing URL', function(done) {
                        request(app)
                            .get('/random_url')
                            .expect(404)
                            .end(function(err, res) {
                                    done();
                                });
                    })
                    });


        describe('GET /city/2968815', function() {
                it('can\'t find Paris by geonameid', function(done) {
                        request(app)
                            .get('/city/2968815')
                            .set('Accept', 'text/XML')
                            .expect('Content-Type', "text/xml")
                            .expect(200)
                            .end(function(err, res) {
                                    assert(res.text.indexOf("Paris") != -1);
                                    done();
                                });
                    })
                    });
                    
         describe('GET /city/2968815', function() {
                it('can\'t find Paris by geonameid', function(done) {
                        request(app)
                            .get('/city/2968815')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200)
                            .end(function(err, res) {
                                    assert(res.text.indexOf("Paris") != -1);
                                    done();
                                });
                    })
                    });

        describe('GET /search?query=paris&country=aaaaaaaaaa', function() {
                it('finds Paris in a non-existing country', function(done) {
                        request(app)
                            .get('/search?query=paris&country=aaaaaaaaaa')
                            .set('Accept', 'application/XML')
                            .expect('Content-Type', "text/xml")
                            .expect(200)
                            .end(function(err, res) {
                                    assert(res.text.indexOf("Paris") == -1);
                                    done();
                                });
                    })
                    });

        describe('GET /search', function() {
                it('finds Paris even though the query parameter is empty', function(done) {
                        request(app)
                            .get('/search')
                            .set('Accept', 'application/XML')
                            .expect('Content-Type', "text/xml")
                            .expect(200)
                            .end(function(err, res) {
                                    assert(res.text.indexOf("Paris") == -1);
                                    done();
                                });
                    })
                    });

        describe('GET /search?query=paris&country=fr&ord=asc&sort=population', function() {
                it('responds with an non-XML file', function(done) {
                        request(app)
                            .get('/search?query=paris&country=fr&ord=asc&sort=population')
                            .set('Accept', 'text/xml')
                            .expect('Content-Type', "text/xml")
                            .expect(200, done);
                    })
                    });
        
        describe('GET /city?sort=closeness&ord=asc', function() {
                it('responds with a non-JSON file', function(done) {
                        request(app)
                            .get('/city?sort=closeness&ord=asc')
                            .set('Accept', 'application/json')
                            .expect('Content-Type', "application/json")
                            .expect(200, done);
                    })
                    });
                    
         describe('GET /city?sort=randomparameter', function() {
                it('doesn\'t respond with a 400 error', function(done) {
                        request(app)
                            .get('/city?sort=randomparameter')
                            .set('Accept', 'text/xml')
                            .expect(400, done);
                    })
                    });
                    
         describe('GET /city', function() {
                it('doesn\'t respond with a 406 error to a wrong accept header', function(done) {
                        request(app)
                            .get('/city/')
                            .set('Accept', 'text/html')
                            .expect(406, done);
                    })
                    });   

    });
