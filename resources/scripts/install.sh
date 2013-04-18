#!/bin/bash

#Testing dependencies
echo "Checking dependencies ..."

if [ -z `which mongo` ]; then
    echo "MongoDB not found. Please install it and run this script again."
    exit 1
fi

if [ -z `php -m | grep mongo` ]; then
    echo "PHP-mongo extension not found. Please install it and run this script again."
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

# Get mongo connection

echo "Testing mongo connection ..."

host="127.0.0.1"
port=27017
user=""
password=""
database="geonames"
collection="cities"
elastichost="127.0.0.1:9200"

while getopts ":h:u:p:d:c:e:" opt; do
  case $opt in
    h)
      host="$OPTARG"
      ;;
    hp)
      port="$OPTARG"
      ;;
    u)
      user="$OPTARG"
      ;;
    p)
      password="$OPTARG"
      ;;
    d)
      database="$OPTARG"
      ;;
    c)
      collection="$OPTARG"
      ;;
    e)
      elastichost="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG \n\nUsage: sh import.sh\n\t[-h hostname]\n\t[-u user]\n\t[-p password]\n\t[-d database]\n\t[-c collection]\n\t[-e elasticsearchhostname]\n" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

mongohost="--host $host"
mongoport="--port $port"
mongouser=""
mongopass=""

if [ -n "$user" ]; then
    mongouser="--username $user"
fi

if [ -n "$password" ]; then
    mongopass="--password $password"
fi

mongo $mongohost $mongoport $mongouser $mongopass --eval "printjson(db.adminCommand('listDatabases'))" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot connect to mongo ..."
    exit 1;
fi

# Installing npm modules
echo "Installing npm modules ..."
/usr/bin/env npm install

# Define paths
if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
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
echo "Droping '$database' database ..."
mongo $mongohost $mongoport  $mongouser $mongopass $database --eval "db.dropDatabase()" > /dev/null

if [ $? -eq 1 ]; then
    echo "Cannot drop '$database' database..."
    exit 1;
fi

# Importing collections collection
echo "Start importing 'allCities.txt' into '$collection' collection ..."

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c $collection \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    --stopOnError "$DATA_DIR/allCities.txt"
else
    mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c $collection \
    --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
    "$DATA_DIR/allCities.txt"
fi

echo "Setup the mongodb database ..."
mongo $mongohost $mongoport $mongouser $mongopass $database "$SCRIPT_DIR/setupDB.js"

echo "Start importing 'admincodes.txt' in admincodes collection ..."
mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c admincodes \
    --type tsv --fields code,name --stopOnError "$DATA_DIR/admincodes.txt"

echo "Start importing 'countrynames.txt' in countrynames collection"
mongoimport $mongohost $mongoport  $mongouser $mongopass -d $database -c countrynames \
    --type tsv --fields code,name --stopOnError  "$DATA_DIR/countrynames.txt"

echo "Start indexing ..."
php "$SCRIPT_DIR/indexing.php" $elastichost $database $collection $host $port $user $password

