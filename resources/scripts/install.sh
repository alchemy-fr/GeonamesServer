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

if [ ! -f "$SOURCE_DIR/GeoLiteCity.dat.gz" ];then
    cd $SOURCE_DIR
    echo "Downloading GeoliteCity.dat.gz"
    wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
fi

if [ ! -f "$DATA_DIR/GeoLiteCity.dat" ];then
    echo "Extracting GeoliteCity.dat.gz"
    gunzip -c "$SOURCE_DIR/GeoLiteCity.dat.gz" > "$DATA_DIR/GeoLiteCity.dat"
fi

if [ ! -f "$SOURCE_DIR/allCountries.zip" ];then
    cd $SOURCE_DIR
    echo "Downloading allCountries.zip"
    wget http://download.geonames.org/export/dump/allCountries.zip
fi

if [ ! -f "$DATA_DIR/allCountries.txt" ];then
    echo "Extracting allCountries.zip"
    unzip "$SOURCE_DIR/allCountries.zip" -d "$DATA_DIR"
fi

if [ ! -f "$DATA_DIR/allCities.txt" ];then
    echo "Extracting cities from allCountries.txt to allCities.txt"
    cat "$DATA_DIR/allCountries.txt" | grep -e PPL -e STLMT > "$DATA_DIR/allCities.txt"
fi

if [ ! -f "$SOURCE_DIR/admin1CodesASCII.txt" ];then
    cd $SOURCE_DIR
    echo "Downloading admin1CodesASCII.txt"
    wget http://download.geonames.org/export/dump/admin1CodesASCII.txt
fi

if [ ! -f "$DATA_DIR/admincodes.txt" ];then
    cat "$SOURCE_DIR/admin1CodesASCII.txt" | cut -f1,2 > "$DATA_DIR/admincodes.txt"
fi

if [ ! -f "$SOURCE_DIR/countryInfo.txt" ];then
    cd $SOURCE_DIR
    echo "Downloading countryInfo.txt"
    wget http://download.geonames.org/export/dump/countryInfo.txt
fi

if [ ! -f "$DATA_DIR/countrynames.txt" ];then
    cat "$SOURCE_DIR/countryInfo.txt" | grep -v '^#' | cut -f1,5 > "$DATA_DIR/countrynames.txt"
fi

# Droping mongo database
echo "Droping '$mongo_database' database ..."
mongo $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass $mongo_database --eval "db.dropDatabase()" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot drop '$mongo_database' database..."
    exit 1;
fi

# Importing collections collection
echo "Start importing 'allCities.txt' into cities collection ..."

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass -d $mongo_database -c cities \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$DATA_DIR/allCities.txt"
else
    mongoimport $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass -d $mongo_database -c cities \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    "$DATA_DIR/allCities.txt"
fi

echo "Setup the mongodb database (adding pin location & all different name for one city) ..."
mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $mongo_database "$SCRIPT_DIR/setupDB.js"

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass -d $mongo_database -c admincodes \
    --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass -d $mongo_database -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

echo "Start indexing ..."
php "$SCRIPT_DIR/indexing.php" $elastic_host $elastic_port $elastic_scheme $elastic_index cities $mongo_database cities $mongo_host $mongo_port $mongo_user $mongo_pass
