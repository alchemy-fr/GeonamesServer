#GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

##Documentation

Read The Documentation at [Read The Docs !](https://geonames-server.readthedocs.org/)


##Usage Example

```bash
curl -XGET "§SERVER_URL/find_city?city=paris"
curl -XGET "§SERVER_URL/find_city?city=paris,f"
curl -XGET "§SERVER_URL/find_city?city=paris,f&sort=population"
curl -XGET "$SERVER_URL/getname?geonameid=123456"
curl -XGET "$SERVER_URL/getname?geonameid=123456"
curl -XGET "$SERVER_URL/getname?geoip=4.23.171.0"

```

##v2

In the second version of **GeonamesServer**, the following routes were added to existing ones:

*  **/** : Returns a quick documentation listing available routes.
*  **/city** : Returns the list of all the cities in the database, limited to 30 results by default. The limit can be changed within the **vars.js** file. A *sort* paramater, with its only possible value being "population" can be added to the request.
*  **/city/id** : Returns the city which *geonameid* value is equal to the given id.
*  **/ip/adress** : Returns the city in which the given ip address is located.

All these routes can only be accessed through GET requests. Any other methods will result in a *405 Method not allowed* error. The results will be sent as text/XML or text/JSON files, according to the accept field within the request header. 


##License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


