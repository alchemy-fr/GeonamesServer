#!/bin/bash

if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
CONFIG_DIR="$ROOT_PATH/../../config"
FIXTURE_DIR="$RESOURCE_DIR/fixtures"
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

# Get $mongo_host, $mongo_port, $mongo_user, $mongo_pass, $mongo_database_test variables
source "$CONFIG_DIR/mongo.cfg"

# Get $elastic_host, $elastic_port, $elastic_index_test variables
source "$CONFIG_DIR/elasticsearch.cfg"

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

mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot connect to mongo ..."
    exit 1;
fi

# Create directories
if [ ! -d $DATA_DIR ];then
    mkdir $DATA_DIR
fi

if [ ! -d $SOURCE_DIR ];then
    mkdir $SOURCE_DIR
fi

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
echo "Droping '$mongo_database_test' database ..."
mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $mongo_database_test --eval "db.dropDatabase()" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot drop '$mongo_database_test' database..."
    exit 1;
fi

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass -d $mongo_database_test -c admincodes \
    --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass -d $mongo_database_test -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

bash "$SCRIPT_DIR/indexing/console.php" index:delete $elastic_host $elastic_port $elastic_scheme $elastic_index_test
echo ""
bash "$SCRIPT_DIR/indexing/console.php" index:create $elastic_host $elastic_port $elastic_scheme $elastic_index_test
echo ""
bash "$SCRIPT_DIR/indexing/console.php" index:setup $elastic_host $elastic_port $elastic_scheme $elastic_index_test cities
echo ""
while read line; do curl --silent -XPOST "$elastic_scheme://$elastic_host:$elastic_port/$elastic_index_test/cities" -d "$line"; done < "$FIXTURE_DIR/indexes" > /dev/null
