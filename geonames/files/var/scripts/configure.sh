#!/bin/bash

set -xe

envsubst < /var/GeonamesServer/config/mongo.cfg.sample > /var/GeonamesServer/config/mongo.cfg
envsubst < /var/GeonamesServer/config/elasticsearch.cfg.sample > /var/GeonamesServer/config/elasticsearch.cfg
