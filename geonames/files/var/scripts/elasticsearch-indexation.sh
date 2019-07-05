#!/bin/bash

set -xe

source "$CONFIG_DIR/mongo.cfg"
source "$CONFIG_DIR/elasticsearch.cfg"

elastic_host="elasticsearch"
elastic_port="9200"
elastic_scheme="http"
elastic_index="geonames"
elastic_index_test="tests"

echo "Start indexing ..."
php "$SCRIPT_DIR/console.php" do-indexation $elastic_host $elastic_port $elastic_scheme $elastic_index cities $mongo_database cities $mongo_host $mongo_port

touch /state/elastic-index
