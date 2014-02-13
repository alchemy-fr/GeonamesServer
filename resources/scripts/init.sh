#!/bin/bash

#Testing dependencies
echo "Checking dependencies ..."

if [ -z `which mongo` ]; then
    echo "MongoDB not found. Please install it and run this script again."
    exit 1
fi

if [ -z `php -m | grep mongo` ]; then
    echo "php mongo extension not found. Please install it and run this script again."
    exit 1
fi

if [ -z `php -m | grep curl` ]; then
    echo "php curl extension not found. Please install it and run this script again."
    exit 1
fi

if [ -z `which node` ]; then
    echo "node not found. Please install it and run this script again."
    exit 1
fi

if [ -z `which npm` ]; then
    echo "npm not found. Please install it and run this script again."
    exit 1
fi

if [ -z `which php` ]; then
    echo "php not found. Please install it and run this script again."
    exit 1
fi

if [ -z `which composer` ]; then
    echo "composer not found. Please install it and run this script again."
    exit 1
fi

composer install --prefer-source

if [ $? -eq 1 ]; then
    echo "Failed to install composer dependencies"
    exit
fi

# Define paths
if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
CONFIG_DIR="$ROOT_PATH/../../config"
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

# Testing mongo connection
echo "Testing mongo connection ..."

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

echo mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot connect to mongo ..."
    exit 1;
fi

# Installing npm modules
echo "Installing npm modules ..."
/usr/bin/env npm install

# Create directories
if [ ! -d $DATA_DIR ];then
    mkdir $DATA_DIR
fi

if [ ! -d $SOURCE_DIR ];then
    mkdir $SOURCE_DIR
fi

# Get geonames resources
echo "Start fetching Geonames ressources ..."

rm -Rf "$SOURCE_DIR/GeoLiteCity.dat.gz" "$DATA_DIR/GeoLiteCity.dat"

if [ ! -f "$SOURCE_DIR/GeoLiteCity.dat.gz" ];then
    cd $SOURCE_DIR
    echo "Downloading GeoliteCity.dat.gz"
    wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
fi

if [ ! -f "$DATA_DIR/GeoLiteCity.dat" ];then
    echo "Extracting GeoliteCity.dat.gz"
    gunzip -c "$SOURCE_DIR/GeoLiteCity.dat.gz" > "$DATA_DIR/GeoLiteCity.dat"
fi

