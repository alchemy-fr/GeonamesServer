#!/bin/bash

if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
FIXTURE_DIR="RESOURCE_DIR/fixtures"
DATA_DIR="$RESOURCE_DIR/data"
SOURCE_DIR="$RESOURCE_DIR/sources"
SCRIPT_DIR="$RESOURCE_DIR/scripts"

MONGO_DB="tests"

if [ -z `which mongo` ]; then
    echo "MongoDB not found. Please install it and run this script again."
    exit 1
fi

mongo $MONGO_DB --eval "db.dropDatabase()" > /dev/null

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport -d $MONGO_DB -c countries --type tsv \
    --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$FIXTURE_DIR/testCountries.txt" > /dev/null
else
    mongoimport -d $MONGO_DB -c countries --type tsv \
    --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$FIXTURE_DIR/testCountries.txt" > /dev/null
fi

mongo $MONGO_DB "$SCRIPT_DIR/setupDB.js" > /dev/null

mongoimport -d $MONGO_DB -c admincodes --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt" > /dev/null

mongoimport -d $MONGO_DB -c countrynames --type tsv --fields code,name --stopOnError "$DATA_DIR/countrynames.txt" > /dev/null

curl -s -X DELETE "http://127.0.0.1:9200/tests/" > /dev/null
curl -s -X POST "http://127.0.0.1:9200/tests/" > /dev/null

bash "$SCRIPT_DIR/indexing/setGeolocation.sh" "http://127.0.0.1:9200/tests/countries/_mapping" "countries" > /dev/null

curl -XPOST "http://127.0.0.1:9200/tests/countries/" -d '{"geonameid" : "2968815","name" : "Paris","asciiname" : "Paris","alternatenames": "Paris, Paris","latitude" : "48.8534","longitude" : "2.3486","featureClass" : "A","featureCode" : "PPL","countryCode" : "FR","admin1Code" : "A8","admin2Code" : "75","admin3Code" : "","admin4Code" : "2257981","elevation" : "","DEM" : "30","timezone" : "Europe/Paris","modificationDate" : "2012-09-13","names" : "paris"}' > /dev/null
