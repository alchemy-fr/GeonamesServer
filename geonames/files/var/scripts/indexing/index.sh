#!/bin/bash

#Testing dependencies
echo "Checking dependencies ..."

if [ -z `which php` ]; then
    echo "php not found. Please install it and run this script again."
    exit 1
fi

if [ -z `php -m | grep mongo` ]; then
    echo "PHP-mongo extension not found. Please install it and run this script again."
    exit 1
fi


# Define paths
if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/../.."
CONFIG_DIR="$ROOT_PATH/../../../config"
DATA_DIR="$RESOURCE_DIR/data"
SOURCE_DIR="$RESOURCE_DIR/sources"
SCRIPT_DIR="$RESOURCE_DIR/scripts"

if [ ! -f "$CONFIG_DIR/mongo.cfg" ];then
    echo "Missing $CONFIG_DIR/mongo.cfg configuration file"
    exit
fi

if [ ! -f "$CONFIG_DIR/elasticsearch.cfg" ];then
    echo "Missing $CONFIG_DIR/elasticsearch.cfg configuration file"
    exit
fi

echo "Reading configuration files ...." >&2

# Get $mongo_host, $mongo_port, $mongo_user, $mongo_pass, $mongo_database variables
source "$CONFIG_DIR/mongo.cfg"

# Get $elastic_host, $elastic_port, $elastic_scheme, $elastic_index variables
source "$CONFIG_DIR/elasticsearch.cfg"


cmd_mongo_host="--host $mongo_host"
cmd_mongo_port="--port $mongo_port"
cmd_mongo_user=""
cmd_mongo_pass=""

if [ -n "$mongo_user" ]; then
    cmd_mongo_user="--username $mongo_user"
fi

if [ -n "$mongo_pass" ]; then
    cmd_mongo_pass="--password $mongo_pass"
fi

echo "Start indexing ..."
php "$SCRIPT_DIR/console.php" do-indexation $elastic_host $elastic_port $elastic_scheme $elastic_index cities $mongo_database cities $mongo_host $mongo_port $mongo_user $mongo_pass
