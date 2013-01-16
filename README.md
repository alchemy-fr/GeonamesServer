#GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

##Documentation

Read The Documentation at [Read The Docs !](https://geonames-server.readthedocs.org/)


##Usage

The following is a list of usable routes for the Geonames server:

*  **/** : Returns a quick documentation listing available routes.
*  **/city** : Returns the list of all the cities in the database, limited to 30 results by default. The limit can be changed within the **vars.js** file. The results are sorted by population, in descending order.
  *  **?sort=population&order=asc** : Same as the precedent route, but sorted in ascending order.
  *  **?sort=closeness** : The results will be ordered by closeness to the place the request was sent from.
*  **/city/search?query={city_name}** : Returns all the cities whose name begins with given *city_name*, limited to 30 results. The limit can be changed within the **vars.js** file. The results are sorted by population, in descending order.
  *  **&country={country_name}** : Adding this parameter will only display cities located in countries whose name starts with *country_name*.
  *  **&sort=population&order=asc** : Adding a *population* parameter and setting it to *asc* will order the results in an ascending order.
  *  **&sort=closeness** : Setting the *sort* parameter to *closeness* will order the results by closeness to the place the request was sent from.
*  **/city/{id}** : Returns the city which *geonameid* value is equal to the given id.
*  **/ip/{address}** : Returns the city in which the given ip address is located.

All these routes can only be accessed through GET requests. Any other methods will result in a *405 Method not allowed* error. The results will be sent as text/XML or text/JSON files, according to the accept field within the request header. If the *population* parameter is specified and set to *closeness* but the location of the request could not be detetermined (due to a lack of data within the geoip database or geoip module not being installed), default values of 0,0 will be used instead.


##License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


