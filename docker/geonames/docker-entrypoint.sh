#!/bin/sh

set -e
		
cd /var/GeonamesServer/
cp /var/elasticsearch.cfg /var/GeonamesServer/config/elasticsearch.cfg
cp /var/mongo.cfg /var/GeonamesServer/config/mongo.cfg
cp /var/server.json /var/GeonamesServer/config/server.json
make install

exec "$@"


