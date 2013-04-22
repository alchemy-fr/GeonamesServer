Documentation
=============

Introduction
------------

This server's purpose is to interrogate an ElasticSearch index and a MongoDB
database, and to return geolocation-related data. It relies on data found on
http://www.geonames.org/. You can use this server to retrieve the approximative
location of an IP address, to get more details about a city identified by its
geonameid, or to find the closest (or biggest) cities matching a given criteria.

The server accepts HTTP GET requests, and returns appropriatly filled XML or JSON
trees.

This server was created using `Express <http://expressjs.com/>`_.


Installation
------------

Prerequisites
+++++++++++++

In order to make the Geonames Server run, you need to have installed MongoDB
and ElasticSearch.

To install MongoDB, you should follow `the official MongoDB guides <http://www.mongodb.org/display/DOCS/Quickstart>`_.

If you use `homebrew <http://mxcl.github.com/homebrew/>`_, you can run **brew install elasticsearch** in order to install
ElasticSearch. Otherwise, follow `the official guide <http://www.elasticsearch.org/guide/reference/setup/installation.html>`_.

Once both MongoDB and Elasticsearch installed, you need to fill the MongoDB
database with geonames data, and then index this data with ElasticSearch.
You can do all of it in just a few steps with the import script located in the
**import** folder.

To ensure the proper functioning of these operations, `curl <http://fr2.php.net/manual/en/book.curl.php>`_ and `mongo <http://fr2.php.net/manual/en/book.mongo.php>`_ extensions for PHP are required.

Make sure that your mongo php extension is up-to-date and that
mongodb is running, then run the following command within the **import** folder:

.. code-block:: bash

   sh import.sh [-h mongohost] [-u user] [-p password] [-d database] [-c collection] [-e elasticsearchhost]

The default values are:
   - mongohost: http://127.0.0.1:27017/
   - user: none
   - password: none
   - database: **geonames**
   - collection: **countries**
   - elasticsearchhost: http://127.0.0.1:9200/


It will download the necessary files from the geonames servers, format them
to make them work with MongoDB, import them to MongoDB, and index the new
entries in ElasticSearch.

From now on, you should be able to access to your ElasticSearch index through
your web browser or through any request-forming tool (such as **curl**),
as described `here <http://www.elasticsearch.org/guide/reference/query-dsl/>`_.

For instance, you can try:

.. code-block:: bash

   curl -X GET "$ES_PATH/geonames/_count"

This should return you a JSON object containing, under the "count" field,
the number of entries indexed under *geonames*.

This server being written using node.js, you will need it to run the server.
Once again, for **homebrew** users, a simple **brew install node** is enough.
Otherwise, you can download it from the `Node.js official website <http://nodejs.org/>`_.

Finally, if you want the geolocation to work, you will need the **libgeoip C
library**, version **1.4.8** or higher. You can either install it through a
package manager (such as **homebrew** or **aptitude**), or build it using
the following commands (`source <http://github.com/kuno/GeoIP>`_):

.. code-block:: bash

   wget http://geolite.maxmind.com/download/geoip/api/c/GeoIP-1.4.8.tar.gz
   tar -xvzf GeoIP-1.4.8.tar.gz
   cd GeoIP-1.4.8
   ./configure --prefix=/usr
   make
   sudo make install


Geonames Server
+++++++++++++++

Once the prerequisites installed, assuming you have **npm** installed, go to
the root folder and execute

.. code-block:: bash

   make install

This will download the latest GeoIP data as well as all the packages this
server will need.

Configuration
-------------

The file **vars.js** contains some useful configuration variables. First, if
your instance of ElasticSearch is different from default, you should change
**vars.es.host** to your hostname. You can also change the port used by
GeoNames Server (3000 by default), as well as various Mongodb and ElasticSeach-related variables.
The **vars.js** file also contains a verbose option, which, when activated, displays the requests processed by the server.

Usage
-----

To start the server, make sure you have **node** installed, and run:

.. code-block:: bash

   node server

Then, you can send GET requests to it (through a web broser or any request
tool such as **curl**).

Accepted content types
++++++++++++++++++++++

GeonamesServer can return data formated in two types, **json** or **xml**, according to the type specified
within the header request (see http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html). The server supports
qvalue ratings, choosing the return type by its rating. If * is specified, data will be returned as a
**json** document. If neither **xml**, **json** nor * are specified, the server will answer with a
*406 Not acceptable* error. It's important to notice that json-formated responses usually include more fields
than xml-formated ones.

Available routes
++++++++++++++++++

The following is a list of available routes (defined by controllers in
the **controllers** folder). All these routes can only be accessed through GET requests. Any other methods will result in a
*405 Method not allowed* error. The results will be sent as text/xml or application/json files, according
to the accept field within the request header. If the *sort* parameter is specified and set to *closeness*
but the location of the request could not be detetermined (due to a lack of data within the geoip database
or geoip module not being installed), default values of 0,0 will be used instead. If a mandatory parameter,
such as *sort* is used with a value not included in the list of available values, the request will result
in a *400 Bad request* error.

/
^

Returns a quick documentation listing available routes.

/city
^^^^^

Gets the list of all the cities in the database, limited to 30 results by default.
``````````````````````````````````````````````````````````````````````````````````

The limit can be changed within the **vars.js** file or overriden with limit parameter up to 100.

Parameters
##########

- sort (mandatory, default value : population) available values :

  - population : The results will be sorted by population.
  - closeness : The results will be sorted by closeness to the place the request was sent from.
  - ip : The results will be sorted by closeness to the provided ip.
- ord (mandatory, default value : desc) available values :

  - desc : The results will be displayed in descending order.
  - asc : The results will be displayed in ascending order.
- name (optional) : Filters city whose begins with a given name.
- ip (optional) : Find the city in which the given ip address is located. 'ip' parameter can not be set within a 'name' parameter.
- country (optional) :

    Only cities located in countries whose name begins with this parameter will be returned.

- limit (optional) : The number of results.

Examples
########

**Returns the list of all the cities in the database, limited to 30 results by default.**

.. code-block:: bash

   curl -XGET "$SERVER_URL/city"

will return one of these results, according to the expected content-type:

.. code-block:: xml

    <?xml version="1.0" encoding="UTF-8"?>
    <geonames>
        <totalResultsCount>2</totalResultsCount>
        <geoname>
            <geonameid>3435910</geonameid>
            <title>Buenos Aires</title>
            <country>Argentina</country>
            <region>Buenos Aires F.D.</region>
        </geoname>
        <geoname>
            <geonameid>1185241</geonameid>
            <title>Dhaka</title>
            <country>Bangladesh</country>
            <region>Dhaka</region>
        </geoname>
    </geonames>

.. code-block:: javascript

    {
        "geonames": {
            "totalResultsCount": "2",
            "geoname": [
            {
               "geonameid": "3435910",
               "title": "Buenos Aires",
               "country": "Argentina",
               "region": "Buenos Aires F.D.",
                "population": 13076300,
               "latitude": -34.61315,
               "longitude": -58.37723,
               "names": [
                 "buenos aires",
                 "buenos ayres",
                 "buenos-aires",
                 "buenos-ajres",
                 "ciudad de la santisima trinidad y puerto de santa maria del buen ayre"
               ]
             },
             {
               "geonameid": "1185241",
               "title": "Dhaka",
               "country": "Bangladesh",
               "region": "Dhaka",
               "population": 10356500,
               "latitude": 23.7104,
               "longitude": 90.40744,
               "names": [
                 "dhaka",
                 "dac",
                 "daca",
                 "dacca",
               ]
             }
           ]
        }
    }

**Gets the city whose name begins with the provided query.**


.. code-block:: bash

   curl -XGET "$SERVER_URL/city?name=buenos&country=ar&ord=asc"

will return one of these results, according to the expected content-type:

.. code-block:: xml

    <?xml version="1.0" encoding="UTF-8"?>
    <geonames>
        <totalResultsCount>3</totalResultsCount>
        <geoname>
            <geonameid>3863774</geonameid>
            <title>Buenos Aires Chico</title>
            <title_match>Buenos</title_match>
            <country>Argentina</country>
            <country_match>Ar</country_match>
            <region>Chubut</region>
        </geoname>
        <geoname>
            <geonameid>3841475</geonameid>
            <title>Perito Moreno</title>
            <title_alt>lago buenos aires</title_alt>
            <title_match>buenos</title_match>
            <country>Argentina</country>
            <country_match>Ar</country_match>
            <region>Santa Cruz</region>
        </geoname>
        <geoname>
            <geonameid>3435910</geonameid>
            <title>Buenos Aires</title>
            <title_match>Buenos</title_match>
            <country>Argentina</country>
            <country_match>Ar</country_match>
            <region>Buenos Aires F.D.</region>
        </geoname>
    </geonames>

.. code-block:: javascript

    {
        "geonames": {
            "totalResultsCount": "15",
            "geoname": [
            {
                "geonameid": "3863774",
                "title": "Buenos Aires Chico",
                "country": "Argentina",
                "region": "Chubut",
                "population": 0,
                "latitude": -42.06802,
                "longitude": -71.21729,
                "names": [
                  "buenos aires chico",
                  "buenas aires chico",
                  "buenos aires chico"
                ]
            },
            {
              "geonameid": "3841475",
              "title": "Perito Moreno",
              "country": "Argentina",
              "region": "Santa Cruz",
              "population": 0,
              "latitude": -46.58994,
              "longitude": -70.92975,
              "names": [
                "perito moreno",
                "lago buenos aires",
                "pmq",
                "perito moreno",
                "rio fenix",
                "río fénix"
              ]
            },
            {
                "geonameid": "3435910",
                "title": "Buenos Aires",
                "country": "Argentina",
                "match": {
                  "title": "Buenos"
                },
                "title_alt": "buenos aires",
                "region": "Buenos Aires F.D.",
                "population": 13076300,
                "latitude": -34.61315,
                "longitude": -58.37723,
                "names": [
                  "buenos aires",
                  "buenos ayres",
                  "buenos-aires",
                  "buenos-ajres",
                  "ciudad de la santisima trinidad y puerto de santa maria del buen ayre"
                ]
              }
            ]
        }
    }

The *title_match* and *country_match* fields show the parts of the initial
request that match with the results. This might be used for highlighting the
beginning of the world as the user types it in.

In cases where the request doesn't match with the default name of the city
but does match with an alternate name (different language or different
spelling), a *title_alt* field is displayed, so the *title_match* can still
be relevant.

**Returns the city in which the given ip address is located.**

.. code-block:: bash

   curl -XGET "$SERVER_URL/city/ip=4.23.171.0"

will return one of these results, according to the expected content-type:

.. code-block:: xml

   <?xml version="1.0" encoding="UTF-8"?>
   <result for="4.23.171.0">
      <geoname>
       <city>New York</city>
       <country_code>US</country_code>
       <country>United States</country>
       <fips>New York</fips>
       <longitude>-73.97650146484375</longitude>
       <latitude>40.754600524902344</latitude>
      </geoname>
   </result>

.. code-block:: javascript

    {
        "ip": "4.23.171.0",
        "result": {
            "geoname": {
                "city": "New York",
                "country_code": "US",
                "country": "United States",
                "fips": "New York",
                "longitude": "-73.97650146484375",
                "latitude": "40.754600524902344"
            }
        }
    }

/city/{id}
^^^^^^^^^^

Returns the city which *geonameid* value is equal to the given id.

Examples
########

.. code-block:: bash

   curl -XGET "$SERVER_URL/city/3435910"

will return one of these results, according to the expected content-type:

.. code-block:: xml

    <?xml version="1.0" encoding="UTF-8"?>
    <geonames>
        <totalResultsCount>1</totalResultsCount>
        <geoname>
            <geonameid>3435910</geonameid>
            <title>Buenos Aires</title>
            <country>Argentina</country>
            <region>Buenos Aires F.D.</region>
        </geoname>
    </geonames>

.. code-block:: javascript

    {
        "geonames": {
            "totalResultsCount": "1",
            "geoname": [
            {
               "geonameid": "3435910",
               "title": "Buenos Aires",
               "country": "Argentina",
               "region": "Buenos Aires F.D.",
                "population": 13076300,
               "latitude": -34.61315,
               "longitude": -58.37723,
               "names": [
                 "buenos aires",
                 "buenos ayres",
                 "buenos-aires",
                 "buenos-ajres",
                 "ciudad de la santisima trinidad y puerto de santa maria del buen ayre"
               ]
             }
           ]
        }
    }

Testing
-------

This server relies on `Mocha <http://visionmedia.github.com/mocha/>`_ and `Supertest <https://github.com/visionmedia/supertest>`_ for unit testing.
All you have to do is to run the following command in the root folder:

.. code-block:: bash

   make test

Upgrading
---------

In order to upgrade this server, you should run the following command within
the **import** folder:

.. code-block:: bash

   sh import.sh [-h hostname] [-u user] [-p password] [-d database] [-c collection] [-e elasticsearchhost]

If you installed ElasticSearch on *localhost:9200* (default value), you can
use this command instead:

.. code-block:: bash

   make import

Contribute
----------

You found a bug and resolved it ? You added a feature you want to share ?
You optimized the code or made it more aesthetically pleasing ? You found
a typo in this doc and fixed it ? Feel free to send a `Pull Request <http://help.github.com/send-pull-requests/>`_
on GitHub, we will be glad to merge your code.
