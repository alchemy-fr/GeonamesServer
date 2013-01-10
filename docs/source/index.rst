Documentation
=============

Introduction
------------

This server's purpose is to interrogate an ElasticSearch index and a MongoDB 
database, and to return geolocation-related data. It relies on data found on 
http://www.geonames.org/. You can use this server to retrieve the approximative
location of an IP address, to get more details about a city identified by its
geonameid, or to find the closest (or biggest) cities matching a given criteria.

The server accepts HTTP GET requests, and returns appropriatly filled XML
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

If your ElasticSearch instance isn't installed on *localhost:9200*, 
you migh want to change this value in **import/scripts/vars.php.** 

Make sure that mongodb is running, then, if you installed ElasticSearch on *localhost:9200* (default value), run the 
following commands within the **import** folder:

.. code-block:: bash
   
   make install
   make import

Otherwise, you can use the following commands:

.. code-block:: bash
   
   make install
   sh import.sh [-h hostname] [-u user] [-p password] [-d database] [-c collection] [-e elasticsearchhost]

The default values are:
   - hostname: http://127.0.0.1/
   - user: none
   - password: none
   - database: **geonames**
   - collection: **countries**
   - elasticsearchhost: http://127.0.0.1:9200/


It will download the necessary files from the geonames servers, format them
to make them work with MongoDB, import them to MongoDB, and index the new 
entries in ElasticSearch. The script uses `Composer <http://getcomposer.org/>`_.

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
GeoNames Server (3000 by default), as well as various Mongodb and ElasticSeach-related variables. The **vars.js** file also contains a verbose option, which, when activated, displays the requests processed by the server.

Usage
-----

To start the server, make sure you have **node** installed, and run:

.. code-block:: bash

   node server

Then, you can send GET requests to it (through a web broser or any request
tool such as **curl**).

Available commands
++++++++++++++++++

The following is a list of available commands (defined by controllers in 
the **controllers** folder). Others commands, or commands used with wrong
or empty parameters will return empty XML trees.

geoip
^^^^^

Useful to get the city where is located the given IP adress. For example,

.. code-block:: bash

   curl -XGET "$SERVER_URL/geoip?ip=4.23.171.0"

Returns this:

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

get_name
^^^^^^^^

Useful to get the name of the city with a given geonameid, along with some
data related to this city. For example,

.. code-block:: bash

   curl -XGET "$SERVER_URL/get_name?geonameid=3435910"

Returns this:

.. code-block:: xml

   <?xml version="1.0" encoding="UTF-8"?>
   <result>
      <geoname>
       <city>Buenos Aires</city>
       <country_code>AR</country_code>
       <country>Argentina</country>
       <fips>Buenos Aires F.D.</fips>
       <latitude>-34.61315</latitude>
       <longitude>-58.37723</longitude>
      </geoname>
   </result>

find_city
^^^^^^^^^

Useful to find the nearest or the biggest cities matching the given request.
Will parse city names to return everything that starts with the *city*
parameter. You can also add a comma to this parameter, everything after which
will be considered as a *country* parameter. This adds an extra filtering to
the request, only searching through the cities located in countries starting 
with the *country* parameter. Finally, you can add a *sort* parameter, 
with its only possible value being *population*. If this parameter is
specified, the search will be sorted by population, instead of proximity.

The results are limited to 30 entries by default. This value can be changed
in **vars.js**.

In case the sender's IP adress cannot be localized, the values
**vars.geo.default_lat** and **vars.geo.default_lon** from **vars.js**
will be used.

This command works with non-latin characters, is case-insensitive, and matches
to every word if the city name contains whitespaces. For instance, searching
for *aires* will return *Buenos Aires*.

Examples:

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=p"

Will search for all the cities starting with *p*, ordered by proximity.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=pa,f"

Will search for all the cities starting with *pa* in countries starting with 
*f*, ordered by proximity.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=pa,fr&sort=population"

Will search for all the cities starting with *pa* in countries starting with
*fr*, orderd by population.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city="

Will return an empty result.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?randomword=pa"

Same as above.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=p,"

Will ignore the comma and search for all the cities starting with *p*, 
ordered by proximity.

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=p&sort=randomword"

Will ignore the *sort* parameter and search for all the cities starting 
with *p*, ordered by proximity.

The results are returned as an XML tree containing the result count and the
results. For instance:

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=york,aus"

Will return:

.. code-block:: xml
   
   <?xml version="1.0" encoding="UTF-8"?>
   <geonames>
      <totalResultsCount>2</totalResultsCount>
      <geoname>
	<geonameid>2057277</geonameid>
       	<title>York</title>
      	<title_match>York</title_match>
      	<country>Australia</country>
      	<country_match>Aus</country_match>
      	<region>Western Australia</region>
      </geoname>
      <geoname>
        <geonameid>2206601</geonameid>
	<title>Yorkeys Knob</title>
   	<title_match>York</title_match>
   	<country>Australia</country>
   	<country_match>Aus</country_match>
   	<region>Queensland</region>
      </geoname>
   </geonames>

The *title_match* and *country_match* fields show the parts of the initial
request that match with the results. This might be used for highlighting the
beginning of the world as the user types it in.

In cases where the request doesn't match with the default name of the city
but does match with an alternate name (different language or different
spelling), a *title_alt* field is displayed, so the *title_match* can still
be relevant.

Example:

.. code-block:: bash

   curl -XGET "$SERVER_URL/find_city?city=qahir"

No cities matching *qahir* were found, but *al qahirah* being an alternate
name to *Cairo*, this city could therefore be returned, with a *title_alt* field:

.. code-block:: xml

   <?xml version="1.0" encoding="UTF-8"?>
   <geonames>
      <totalResultsCount>1</totalResultsCount>
      <geoname>
       <geonameid>360630</geonameid>
       <title>Cairo</title>
       <title_alt>al qahirah</title_alt>
       <title_match>qahir</title_match>
       <country>Egypt</country>
       <country_match/>
       <region>Al Qāhirah</region>
      </geoname>
   </geonames>

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
   
   sh import.sh $ELASTICSEARCH_URL

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
