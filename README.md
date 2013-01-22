# GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

## Documentation

Read The Documentation at [Read The Docs !](https://geonames-server.readthedocs.org/)


## Routes

The following is a list of usable routes for the Geonames server:

### /

Returns a quick documentation listing available routes.

### /city

Returns the list of all the cities in the database, limited to 30 results by default. 
The limit can be changed within the **vars.js** file.

#### Parameters 

  - sort (mandatory, default value : population)
    available values :
    - population : The results will be sorted by population.
    - closeness : The results will be sorted by closeness to the place the request was sent from.
  - ord (mandatory, default value : desc)
    available values :
    - desc : The results will be displayed in descending order.
    - asc : The results will be displayed in ascending order.

### /city/search

Returns all the cities whose name begins with a given *query*, limited to 30 results by default.
The limit can be changed within the **vars.js** file.

#### Parameters

  - query (mandatory) :
    Only cities whose name begins with this parameter will be returned.
  - country (optional) :
    Only cities located in countries whose name begins with this parameter will be returned.
  - sort (mandatory, default value : population)
    available values :
    - population : The results will be sorted by population.
    - closeness : The results will be sorted by closeness to the place the request was sent from.
  - ord (mandatory, default value : desc)
    available values :
    - desc : The results will be displayed in descending order.
    - asc : The results will be displayed in ascending order.

### /city/{id}

Returns the city which *geonameid* value is equal to the given id.

### /ip/{address}
Returns the city in which the given ip address is located.


All these routes can only be accessed through GET requests. Any other methods will result in a 
*405 Method not allowed* error. The results will be sent as text/XML or text/JSON files, according 
to the accept field within the request header. If the *sort* parameter is specified and set to *closeness* 
but the location of the request could not be detetermined (due to a lack of data within the geoip database 
or geoip module not being installed), default values of 0,0 will be used instead. If a mandatory parameter,
such as *sort* is used with a value not included in the list of available values, the request will result
in a *400 Bad request* error.


## Accepted content types

GeonamesServer can return data formated in two types, **json** or **xml**, according to the type specified
within the header request (see http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html). The server supports
qvalue ratings, choosing the return type by its rating. If ***** is specified, data will be returned as a 
**json** document. If neither **xml**, **json** nor ***** are specified, the server will answer with a 
*406 Not acceptable* error.

### Examples of response

Following are the results returned for the request "/search/query=york&country=aus

##### xml

    <?xml version="1.0" encoding="UTF-8"?>
        <geonames>
            <totalResultsCount>2</totalResultsCount>
            <geoname>
                <geonameid>2206601</geonameid>
                <title>Yorkeys Knob</title>
                <title_match>York</title_match>
                <country>Australia</country>
                <country_match>Aus</country_match>
                <region>Queensland</region>
            </geoname>
            <geoname>
                <geonameid>2057277</geonameid>
                <title>York</title>
                <title_match>York</title_match>
                <country>Australia</country>
                <country_match>Aus</country_match>
                <region>Western Australia</region>
            </geoname> 
        </geonames>

#### json

    {
     "geonames": {
        "totalResultsCount":2,
        "geoname":[
            {
                "geonameid": "2206601",
                "title": "Yorkeys Knob",
                "title_match": "York",
                "title_alt": "yorkeys knob",
                "country": "Australia",
                "country_match": "Aus"
                "region": "Queensland",
                "population": 2645,
                "latitude": -16.81667,
                "longitude": 145.71667,
                "names": [
                    "yorkeys knob",
                    "yorkeys knob",
                    "yorkeys knob beach"
                ]
            },
            {
                "geonameid": "2057277",
                "title": "York",
                "title_match": "York",
                "title_alt": "york",
                "country": "Australia",
                "region": "Western Australia",
                "population": 2090,
                "latitude": -31.88467,
                "longitude": 116.76874,
                "names": [
                    "york",
                    "jork",
                    "york",
                    "йорк"
                ]
            }
        ]
     }
    }


## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


