var request = require('supertest');
var assert = require('assert');

var app = require('../server');

describe('App', function() {
	describe('GET /find_city', function() {
		it('responds with a non-XML file', function(done) {
			request(app)
			    .get('/find_city')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200, done);
		    })
		    });

	describe('GET /get_name', function() {
		it('responds with an non-XML file', function(done) {
			request(app)
			    .get('/get_name')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200, done);
		    })
		    });


	describe('GET /geoip', function() {
		it('responds with an non-XML file', function(done) {
			request(app)
			    .get('/geoip')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
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


	describe('GET /find_city', function() {
		it('can\'t find Paris', function(done) {
			request(app)
			    .get('/find_city?city=paris')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200)
			    .end(function(err, res) {
				    assert(res.text.indexOf("Paris") != -1);
				    done();
				});
			    })
		    });
	
	describe('GET /find_city', function() {
		it('finds Paris in a non-existing country', function(done) {
			request(app)
			    .get('/find_city?city=paris,sgseggssfgsdg')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200)
			    .end(function(err, res) {
				    assert(res.text.indexOf("Paris") == -1);
				    done();
				});
		    })
		    });

	describe('GET /find_city', function() {
		it('finds Paris even though the city parameter is empty', function(done) {
			request(app)
			    .get('/find_city?name=paris')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200)
			    .end(function(err, res) {
				    assert(res.text.indexOf("Paris") == -1);
				    done();
				});
		    })
		    });
	
	describe('GET /find_city', function() {
		it('responds with an non-XML file', function(done) {
			request(app)
			    .get('/find_city?city=paris,c&sort=population')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200, done);
		    })
		    });



	describe('GET /geoip', function() {
		it('fails to identify a New-York IP', function(done) {
			request(app)
			    .get('/geoip?ip=4.23.171.0')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .end(function(err, res) {
				    assert(res.text.indexOf("New York") != -1);
				    done();
				});
		    })
		    });

	describe('GET /geoip', function() {
		it('responds with an non-XML file', function(done) {
			request(app)
			    .get('/geoip?city=paris')
			    .set('Accept', 'application/XML')
			    .expect('Content-Type', "text/xml")
			    .expect(200, done);
		    })
		    });

	
	
    });
	    
