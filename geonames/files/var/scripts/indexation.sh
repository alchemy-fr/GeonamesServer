#!/bin/bash

# Droping mongo database
#echo "Droping '$mongo_database' database ..."
#mongo $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass $mongo_database --eval "db.dropDatabase()" > /dev/null
#
#if [ $? -eq 1 ]; then
#    echo "Cannot drop '$mongo_database' database..."
#    exit 1;
#fi

set -xe

CONFIG_DIR="/var/GeonamesServer/config"
DATA_DIR="/data"
SOURCE_DIR="/sources"
SCRIPT_DIR="/var/scripts"

echo "Testing mongo connection ..."

mongo_database=geonames
cmd_mongo_host="--host mongo"
cmd_mongo_port="--port 27017"
cmd_mongo_dbauth="--authenticationDatabase=$mongo_database"
cmd_mongo_user="--username $MONGO_USER"
cmd_mongo_pass="-p$MONGO_PASSWORD"
MONGO_PARAMS="$cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database"
echo $MONGO_PARAMS

elastic_host="elasticsearch"
elastic_port="9200"
elastic_scheme="http"
elastic_index="geonames"
elastic_index_test="tests"

echo mongo $MONGO_PARAMS --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null
#echo mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot connect to mongo ..."
    exit 1;
fi

# IMPORT (copied from test.sh ... )

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport --host mongo \
    --port 27017 \
    --username $MONGO_USER \
    -p$MONGO_PASSWORD \
    $cmd_mongo_dbauth \
    -c admincodes \
    -d $mongo_database \
    --type tsv \
    --fields code,name \
    --stopOnError "$DATA_DIR/admincodes.txt"

mongoimport $MONGO_PARAMS -c admincodes --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"
#mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database -c admincodes \
    #--type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass -d $mongo_database -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

php "$SCRIPT_DIR/console.php" index:delete $elastic_host $elastic_port $elastic_scheme $elastic_index_test
echo ""
php "$SCRIPT_DIR/console.php" index:create $elastic_host $elastic_port $elastic_scheme $elastic_index_test
echo ""
php "$SCRIPT_DIR/console.php" index:setup $elastic_host $elastic_port $elastic_scheme $elastic_index_test cities
echo ""
while read line; do curl --silent -XPOST "$elastic_scheme://$elastic_host:$elastic_port/$elastic_index_test/cities" -d "$line"; done < "$FIXTURE_DIR/indexes" > /dev/null
# Importing collections collection
echo "Start importing 'allCities.txt' into cities collection ..."

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database -c cities \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$DATA_DIR/allCities.txt"
else
    mongoimport $cmd_mongo_host $cmd_mongo_port  $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database -c cities \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    "$DATA_DIR/allCities.txt"
fi

echo "Setup the mongodb database (adding pin location & all different name for one city) ..."
mongo $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth $mongo_database "$SCRIPT_DIR/setupDB.js"

#echo "Start importing 'admincodes.txt' in admincodes collection ..."
#mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database -c admincodes \
    #--type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

#echo "Start importing 'countrynames.txt' in countrynames collection"
#mongoimport $cmd_mongo_host $cmd_mongo_port $cmd_mongo_user $cmd_mongo_pass $cmd_mongo_dbauth -d $mongo_database -c countrynames \
    #--type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

echo "Start indexing ..."
php "$SCRIPT_DIR/console.php" do-indexation $elastic_host $elastic_port $elastic_scheme $elastic_index cities $mongo_database cities $mongo_host $mongo_port


tail -f /var/GeonamesServer/package.json
