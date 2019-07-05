#!/bin/bash

set -xe

source "$CONFIG_DIR/mongo.cfg"

mongo_database=geonames
cmd_mongo_host="--host mongo"
cmd_mongo_port="--port 27017"
cmd_mongo_dbauth="--authenticationDatabase=$mongo_database"
cmd_mongo_user="--username $MONGO_USER"
cmd_mongo_pass="-p$MONGO_PASSWORD"
GLOBAL_PARAMS="$cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth"
MONGO_PARAMS="$GLOBAL_PARAMS $mongo_database"
MONGO_IMPORT_PARAMS="$GLOBAL_PARAMS -d $mongo_database"

echo "Testing mongo connection ..."
echo mongo $MONGO_PARAMS --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot connect to mongo ..."
    exit 1;
fi


# IMPORT FROM GORIGINAL install.sh
mongoimport $MONGO_IMPORT_PARAMS -c cities \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$DATA_DIR/allCities.txt"

echo "Setup the mongodb database (adding pin location & all different name for one city) ..."
mongo $MONGO_PARAMS "$SCRIPT_DIR/setupDB.js"

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport $MONGO_IMPORT_PARAMS -c admincodes \
    --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $MONGO_IMPORT_PARAMS -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"


touch /state/mongo-import
