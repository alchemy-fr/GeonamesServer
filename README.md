#GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

##Documentation

Read The Documentation at [Read The Docs !](https://geonames-server.readthedocs.org/)


##Usage

The following is a list of usable routes for the Geonames server:

*  **/** : Returns a quick documentation listing available routes.
*  **/city** : Returns the list of all the cities in the database, limited to 30 results by default. The limit can be changed within the **vars.js** file.
*  **/city?sort=population** : Same as the precedent route, but ordered by population.
*  **/city/search?query={city_name}** : Returns all the cities whose name begins with given city_name, limited to 30 results. The limit can be changed within the **vars.js** file.
*  **/city/search?query={city_name}&sort=population** : Same as the precedent route, but ordered by population.
*  **/city/search?query={city_name}&country={country_name}** : Returns all the cities whose name begins with given city_name and which are located within country_name, limited to 30 results. The limit can be changed within the **vars.js** file.
*  **/city/search?query={city_name}&country={country_name}&sort=population** : Same as the precedent route, but ordered by population.
*  **/city/{id}** : Returns the city which *geonameid* value is equal to the given id.
*  **/ip/{address}** : Returns the city in which the given ip address is located.

All these routes can only be accessed through GET requests. Any other methods will result in a *405 Method not allowed* error. The results will be sent as text/XML or text/JSON files, according to the accept field within the request header. 


##License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


