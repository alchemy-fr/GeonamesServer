# GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

## Documentation

Read The Documentation at [Read The Docs !](https://geonames-server.readthedocs.org/)


## Routes

The following is a list of available routes.
All these routes can only be accessed through GET requests.

Any other methods will result in a *405 Method not allowed* error.

The results will be sent as text/xml or application/json files, according
to the accept field within the request header.

If the *sort* parameter is specified and set to *closeness*
but the location of the request could not be determined
(due to a lack of data within the GEOIP database or GEOIP module not
being installed), the current sort will be replaced by the *population* sort.

If a mandatory parameter or unknown parameter value is detected the server will
respond with a *400 Bad Request* error.

### /

Returns a quick documentation in HTML format.

### /city

Gets the list of all the cities in the database, limited to *max_result_per_page* results by default.

*max_result_per_page* is setted from configuration files or overridden with limit
query parameter parameter up to 100.

#### Parameters

- **sort** (optional, string, default value : population) available values :

  - population : The results will be sorted by population.
  - closeness : The results will be sorted by closeness to the place the request was sent from.

- **ord** (optional, string, default value : desc) available values :

  - desc : The results will be displayed in descending order.
  - asc : The results will be displayed in ascending order.

- **name** (optional, string) : Filters city whose begins with a given name.

- **country** (optional, string) : Only cities located in countries whose name begins with this parameter will be returned.

- **limit** (optional, string) : The number of results.

- **sortParams** (optional, array) : This parameter is used within the *closeness* sort parameter to provide a custom IP. `/city?sort=closeness&sortParams[ip]=XXXX.XX.XX.XXXX`


### /city/{id}

Returns the city which *geonameid* value is equal to the given id.

### /ip?ip={ip}

Returns the city in which the given IP address is located

## Accepted content types

GeonamesServer can return data formated in two types, **json** or **xml**, according to the type specified
within the header request (see http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html). The server supports
qvalue ratings, choosing the return type by its rating. If * is specified, data will be returned as a
**json** document. If neither **xml**, **json** nor * are specified, the server will answer with a
*406 Not acceptable* error.

### Examples of response

Following are the results returned for the request */city/name=paris

##### xml

    <?xml version="1.0" encoding="UTF-8"?>
        <geonames>
            <totalResultsCount>30</totalResultsCount>
            <geoname>
              <geonameid>2988507</geonameid>
              <title>Paris</title>
              <title_alt>paris</title_alt>
              <title_match>Paris</title_match>
              <country>France</country>
              <country_match>France</country_match>
              <population>2138551</population>
              <latitude>48.85</latitude>
              <longitude>2.35</longitude>
              <region>Île-de-France</region>
            </geoname>
            <geoname>
              <geonameid>4717560</geonameid>
              <title>Paris</title>
              <title_alt>paris</title_alt>
              <title_match>Paris</title_match>
              <country>United States</country>
              <country_match>United States</country_match>
              <population>25171</population>
              <latitude>33.66</latitude>
              <longitude>-95.56</longitude>
              <region>Texas</region>
            </geoname>
            <geoname>
              <geonameid>3023645</geonameid>
              <title>Cormeilles-en-Parisis</title>
              <title_alt>cormeilles-en-parisis</title_alt>
              <title_match>Cormeilles-en-Parisis</title_match>
              <country>France</country>
              <country_match>France</country_match>
              <population>21973</population>
              <latitude>48.97</latitude>
              <longitude>2.2</longitude>
              <region>Île-de-France</region>
            </geoname>
                ...
        </geonames>

#### json

    {
        "geonames": {
          "totalResultsCount": "30",
          "geoname": [
            {
              "geonameid": "2988507",
              "title": "Paris",
              "country": "France",
              "match": {
                "title": "Paris",
                "country": "France"
              },
              "population": "2138551",
              "latitude": "48.85",
              "longitude": "2.35",
              "names": [
                "paris",
                "baariis",
                "bahliz",
                "gorad paryzh",
                "lungsod ng paris",
                "lutece",
                "lutetia",
                "lutetia parisorum",
                "par",
                "pa-ri",
                "paarys",
                "palika",
                "paname",
                "pantruche",
                "paraeis",
                "paras",
                "pari",
                "paries",
                "parigge",
                "pariggi",
                "parighji",
                "parigi",
                "pariis",
                "pariisi",
                "parij",
                "parijs",
                "paris",
                "parisi",
                "parixe",
                "pariz",
              ],
              "region": "Île-de-France",
              "title_alt": "paris"
            },
            {
              "geonameid": "4717560",
              "title": "Paris",
              "country": "United States",
              "match": {
                "title": "Paris",
                "country": "United States"
              },
              "population": "25171",
              "latitude": "33.66",
              "longitude": "-95.56",
              "names": [
                "paris",
                "prx",
                "parizh",
                "париж"
              ],
              "region": "Texas",
              "title_alt": "paris"
            },
            {
              "geonameid": "3023645",
              "title": "Cormeilles-en-Parisis",
              "country": "France",
              "match": {
                "title": "Cormeilles-en-Parisis",
                "country": "France"
              },
              "population": "21973",
              "latitude": "48.97",
              "longitude": "2.2",
              "names": [
                "cormeilles-en-parisis",
                "cormeilles",
                "cormeilles-en-parisis"
              ],
              "region": "Île-de-France",
              "title_alt": "cormeilles-en-parisis"
        }
    }


## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


