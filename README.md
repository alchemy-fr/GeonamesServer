# GeonamesServer

[![Build Status](https://secure.travis-ci.org/alchemy-fr/GeonamesServer.png?branch=master)](https://travis-ci.org/alchemy-fr/GeonamesServer)

A node.js server used to get the biggest or the closest cities based on a given HTTP request.

## Introduction

This server's purpose is to interrogate an ElasticSearch index and a MongoDB
database, and to return geolocation-related data. It relies on data found on
http://www.geonames.org/. You can use this server to retrieve the approximative
location of an IPV4 address, to get more details about a city identified by its
geonameid, or to find the closest (or biggest) cities matching a given criteria.

The server accepts only HTTP GET requests, and returns appropriatly filled JSON trees.

This server was created using `Express <http://expressjs.com/>`_.

It supports `JSONP <http://en.wikipedia.org/wiki/JSONP>`_ and
`CORS <http://en.wikipedia.org/wiki/Cross-origin_resource_sharing>`_ requests.

## Installation

### Prerequisites

In order to make the Geonames Server run, you need to have installed MongoDB,
ElasticSearch, PHP and NodeJS + NPM.

**MongoDB**

To install MongoDB, you should follow
`the official MongoDB guides <http://www.mongodb.org/display/DOCS/Quickstart>`_.

**ElasticSearch**

If you use `homebrew <http://mxcl.github.com/homebrew/>`_, you can run
**brew install elasticsearch** in order to install ElasticSearch.
Otherwise, follow `the official guide <http://www.elasticsearch.org/guide/reference/setup/installation.html>`_.

**NodeJS & npm**

To install NodeJS, if you use **homebrew**, a simple **brew install node** is
enough. Otherwise, you can download it from the
`Node.js official website <http://nodejs.org/>`_.


To ensure the proper functioning of these operations,
`curl <http://fr2.php.net/manual/en/book.curl.php>`_ and
`mongo <http://fr2.php.net/manual/en/book.mongo.php>`_ extensions for PHP are
required.

See `mongo extension install details here <http://php.net/manual/fr/mongo.installation.php>`_

Finally, if you want the geolocation to work, you will need the **libgeoip C
library**, version **1.4.8** or higher. You can either install it through a
package manager (such as **homebrew** or **aptitude**), or build it using
the following commands (`source <http://github.com/kuno/GeoIP>`_):

```
wget http://geolite.maxmind.com/download/geoip/api/c/GeoIP-1.4.8.tar.gz
tar -xvzf GeoIP-1.4.8.tar.gz
cd GeoIP-1.4.8
./configure --prefix=/usr
make
sudo make install
```

### Configuration

Once all required dependencies are installed, you must set the configuration
files located in the **config** folder.

First copy the configuration sample files and fill appropriate values according
to your system setup.

```
cp ./config/elasticsearch.cfg.sample ./config/elasticsearch.cfg
cp ./config/mongo.cfg.sample ./config/mongo.cfg
cp ./config/server.json.sample ./config/server.json
```

** ElasticSearch configuration**

```
elastic_host="127.0.0.1"
elastic_port="9200"
elastic_scheme="http"
elastic_index="geonames"
elastic_index_test="tests"
```

** MongoDB configuration**

```
mongo_host="127.0.0.1"
mongo_port="27017"
mongo_user=""
mongo_pass=""
mongo_database="geonames"
mongo_database_test="tests"
```

** Server configuration**

```json
{
    "app": {
        "verbose": false,
        "port": 3000,
        "allowed_domains": ["*"],
        "max_result_per_page" : 30
    },
    "geo": {
        "geolitepath": "./resources/data/GeoLiteCity.dat"
    }
}
```

### Setup

Once dependencies are installed, you need to fill the MongoDB
database with geonames data, and then index this data with ElasticSearch.

To do so, make sure MongoDB and ElasticSearch are running then run the
following command within the **root** folder:

`make install`

It will download in **resources** folder the necessary files from the geonames
servers, format them to make them work with MongoDB, import them to MongoDB,
and index the new entries in ElasticSearch.

Note : The installation process takes at least one hour.

From now on, you should be able to access to your ElasticSearch index through
your web browser or through any request-forming tool (such as **curl**),
as described `here <http://www.elasticsearch.org/guide/reference/query-dsl/>`_.

For instance, you can try:

`curl -X GET "$elastic_host/$index_name/cities/_count"`

This should return you a JSON object containing, under the "count" field,
the number of entries indexed under your cluster.

## Usage

To start the server, make sure you have **node** installed, and run:

`node server`

Then, you can send GET requests to it (through a web browser or any request
tool such as **curl**).

### CORS Requests

All responses from the GeonamesServer include required headers to be
`CORS <http://en.wikipedia.org/wiki/Cross-origin_resource_sharing>`_ compliant

### JSONP Requests

The GeonamesServer supports `JSONP <http://en.wikipedia.org/wiki/JSONP>` requests.
The callback parameter is `callback`.

*Request*

`/ip?ip=5.49.69.114&callback=myFunction`

*Response*

```json
myFunction({
  "result": {
    "ip": "5.49.69.114",
    "geoname": {
      "score": 581701.56,
      "geonameid": 2992090,
      "name": "Montreuil",
      "country": {
        "name": "France",
        "code": "FR"
      },
      "timezone": "Europe/Paris",
      "feature": {
        "class": "P",
        "code": "PPL"
      },
      "population": 90652,
      "location": {
        "latitude": 48.86415,
        "longitude": 2.44322
      },
      "names": [
        "montreuil",
        "montrej",
        "montreuil",
        "montreuil-sous-bois",
        "монтрей"
      ],
      "admin1Code": "A8",
      "admin2Code": 93,
      "admin3Code": 931,
      "admin4Code": 93048,
      "updatedOn": "2012-01-18",
      "region": {
        "code": "FR.A8",
        "name": "Île-de-France"
      }
    }
  }
})
```

## Routes

The following is a list of available routes.
All these routes can only be accessed through GET requests.

Any other methods will result in a *405 Method not allowed* error.

The results will be sent with the application/json mimetype.

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

- **name** (optional, string) : Filters city whose begins with a given name.

- **country** (optional, string) : Only cities located in countries whose name begins with this parameter will be returned.

- **limit** (optional, string) : The number of results.

- **client-ip** (optional, string) : This parameter is used within the *closeness* sort parameter to provide a custom remote IP. `/city?sort=closeness&client-ip=80.12.81.19`

Here is the result returned for the request `/city/name=paris&limit=2` 

```json
{
    "results": {
        "total": "2",
        "data": [
            {
                "score": 884.5834,
                "geonameid": 2988507,
                "name": "Paris",
                "country": {
                    "name": "France",
                    "code": "FR"
                },
                "timezone": "Europe/Paris",
                "feature": {
                    "class": "P",
                    "code": "PPLC"
                },
                "population": 2138551,
                "location": {
                    "latitude": 48.85341,
                    "longitude": 2.3488
                },
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
                    "parize",
                    "parizh",
                    "parizh osh",
                    "parizh'",
                    "parizo",
                    "parizs",
                    "pariž",
                    "parys",
                    "paryz",
                    "paryzius",
                    "paryż",
                    "paryžius",
                    "paräis",
                    "parís",
                    "paríž",
                    "parîs",
                    "parĩ",
                    "parī",
                    "parīze",
                    "paříž",
                    "páras",
                    "párizs",
                    "ville-lumiere",
                    "ville-lumière",
                    "ba li",
                    "barys",
                    "pairisa",
                    "pali",
                    "pari",
                    "paris",
                    "parys",
                    "paryzh",
                    "perisa",
                    "pryz",
                    "pyaris",
                    "pyarisa",
                    "pyrs",
                    "παρίσι",
                    "горад парыж",
                    "париж",
                    "париж ош",
                    "парижь",
                    "париз",
                    "парис",
                    "паріж",
                    "փարիզ",
                    "פאריז",
                    "פריז",
                    "باريس",
                    "پارىژ",
                    "پاريس",
                    "پاریس",
                    "پیرس",
                    "ܦܐܪܝܣ",
                    "पॅरिस",
                    "पेरिस",
                    "पैरिस",
                    "প্যারিস",
                    "ਪੈਰਿਸ",
                    "પૅરિસ",
                    "பாரிஸ்",
                    "పారిస్",
                    "ಪ್ಯಾರಿಸ್",
                    "പാരിസ്",
                    "ปารีส",
                    "ཕ་རི།",
                    "ပါရီမြို့",
                    "პარიზი",
                    "ፓሪስ",
                    "ប៉ារីស",
                    "パリ",
                    "巴黎",
                    "파리"
                ],
                "admin1Code": "A8",
                "admin2Code": 75,
                "admin3Code": 751,
                "admin4Code": 75056,
                "updatedOn": "2012-08-19",
                "region": {
                    "code": "FR.A8",
                    "name": "Île-de-France"
                }
            },
            {
                "score": 312.7515,
                "geonameid": 4717560,
                "name": "Paris",
                "country": {
                    "name": "United States",
                    "code": "US"
                },
                "timezone": "America/Chicago",
                "feature": {
                    "class": "P",
                    "code": "PPLA2"
                },
                "population": 25171,
                "location": {
                    "latitude": 33.66094,
                    "longitude": -95.55551
                },
                "names": [
                    "paris",
                    "prx",
                    "paris",
                    "parizh",
                    "barys",
                    " tksas",
                    "parys",
                    " tgzas",
                    "париж",
                    "парис",
                    "باريس، تكساس",
                    "پاریس، تگزاس"
                ],
                "admin1Code": "TX",
                "admin2Code": 277,
                "admin3Code": "",
                "admin4Code": "",
                "updatedOn": "2011-05-14",
                "region": {
                    "code": "US.TX",
                    "name": "Texas"
                }
            }
        ]
    }
}
```

### /city/{id}

Returns the city which *geonameid* value is equal to the given id.

Result for `/city/2992092`

```
{
  "score": 0.034130126,
  "geonameid": 2992092,
  "name": "Montreuil",
  "country": {
    "name": "France",
    "code": "FR"
  },
  "timezone": "Europe/Paris",
  "feature": {
    "class": "P",
    "code": "PPL"
  },
  "population": 698,
  "location": {
    "latitude": 46.408,
    "longitude": -0.83756
  },
  "names": [
    "montreuil",
    "montrej",
    "montreuil",
    "монтрей"
  ],
  "admin1Code": "B5",
  "admin2Code": 85,
  "admin3Code": 851,
  "admin4Code": 85148,
  "updatedOn": "2012-01-18",
  "region": {
    "code": "FR.B5",
    "name": "Pays de la Loire"
  }
}
```

### /ip?ip={ip}

Returns the city in which the given IP address is located

Result for `/ip?ip=5.49.69.114`

```
{
  "result": {
    "ip": "5.49.69.114",
    "geoname": {
      "score": 581701.56,
      "geonameid": 2992090,
      "name": "Montreuil",
      "country": {
        "name": "France",
        "code": "FR"
      },
      "timezone": "Europe/Paris",
      "feature": {
        "class": "P",
        "code": "PPL"
      },
      "population": 90652,
      "location": {
        "latitude": 48.86415,
        "longitude": 2.44322
      },
      "names": [
        "montreuil",
        "montrej",
        "montreuil",
        "montreuil-sous-bois",
        "монтрей"
      ],
      "admin1Code": "A8",
      "admin2Code": 93,
      "admin3Code": 931,
      "admin4Code": 93048,
      "updatedOn": "2012-01-18",
      "region": {
        "code": "FR.A8",
        "name": "Île-de-France"
      }
    }
  }
}
```

## Accepted content types

GeonamesServer can return data formated in **json**.

## Contribute

You found a bug and resolved it ? You added a feature you want to share ?
You optimized the code or made it more aesthetically pleasing ? You found
a typo in this doc and fixed it ? Feel free to send a
`Pull Request <http://help.github.com/send-pull-requests/>`_
on GitHub, we will be glad to merge your code.

## Test

This server relies on `Mocha <http://visionmedia.github.com/mocha/>`_
and `Supertest <https://github.com/visionmedia/supertest>`_ for unit testing.
All you have to do is to run the following command in the root folder:

```
make test
```

## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).


