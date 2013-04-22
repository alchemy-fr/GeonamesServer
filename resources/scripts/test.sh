#!/bin/bash

if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
FIXTURE_DIR="$RESOURCE_DIR/fixtures"
DATA_DIR="$RESOURCE_DIR/data"
SOURCE_DIR="$RESOURCE_DIR/sources"
SCRIPT_DIR="$RESOURCE_DIR/scripts"

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

echo "Testing mongo connection ..."

host="127.0.0.1"
port=27017
user=""
password=""
database="tests"
elastichost="127.0.0.1:9200"

mongohost="--host $host"
mongoport="--port $port"
mongouser=""
mongopass=""

# Droping mongo database
echo "Droping '$database' database ..."
mongo $mongohost $mongoport  $mongouser $mongopass $database --eval "db.dropDatabase()" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot drop '$database' database..."
    exit 1;
fi

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c admincodes \
    --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

curl -s -X DELETE "http://$elastichost/$database/" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot drop '$database' indexes..."
    exit 1;
fi

curl -s -X POST "http://$elastichost/$database/" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot create '$database' database..."
    exit 1;
fi

bash "$SCRIPT_DIR/indexing/setGeolocation.sh" "http://$elastichost/$database/cities/_mapping" "cities" > /dev/null

while read line; do curl --silent -XPOST "http://$elastichost/$database/cities/" -d "$line" > /dev/null; done < "$FIXTURE_DIR/indexes"