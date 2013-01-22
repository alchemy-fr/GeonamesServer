#!/bin/bash

mongohost=""
host=""
mongouser=""
user=""
mongopassword=""
password=""
database="geonames"
collection="countries"
elastichost="http://127.0.0.1:9200/"

while getopts ":h:u:p:d:c:e:" opt; do
  case $opt in
    h)
      mongohost="--host $OPTARG"
      host="$OPTARG"
      ;;
    u)
      mongouser="--user $OPTARG"
      user="$OPTARG"
      ;;
    p)
      mongopassword="--password $OPTARG"
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

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ -z `which mongo` ]; then
echo "MongoDB not found. Please install it and run this script again."
exit 1
fi

if [ -z `php -m | grep mongo` ]; then
echo "PHP-mongo extension not found. Please install it and run this script again."
exit 1
fi 

rm -f allCountries.zip allCountries.txt allCities.txt
wget http://download.geonames.org/export/dump/allCountries.zip
unzip allCountries.zip
echo "Extracting cities from allCountries.txt"
cat allCountries.txt | grep -e PPL -e STLMT > allCities.txt
rm allCountries.zip

mongo $mongohost $mongouser $mongopassword $database dropDB.js

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport $mongohost $mongouser $mongopassword -d $database -c $collection \
        --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
        --stopOnError allCities.txt
else
    mongoimport $mongohost $mongouser $mongopassword -d $database -c $collection \
        --type tsv --fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
         --stopOnError allCities.txt
fi

rm allCountries.txt allCities.txt
echo "Upgrading the mongodb collection."
mongo $mongohost $mongouser $mongopassword $database setupDB.js

rm countryInfo.txt admin1CodesASCII.txt admincodes.txt countrynames.txt
wget http://download.geonames.org/export/dump/admin1CodesASCII.txt
cat admin1CodesASCII.txt | cut -f1,2 > admincodes.txt
rm admin1CodesASCII.txt
wget http://download.geonames.org/export/dump/countryInfo.txt
cat countryInfo.txt | grep -v '^#' | cut -f1,5 > countrynames.txt
rm countryInfo.txt

mongoimport $mongohost $mongouser $mongopassword -d $database -c admincodes \
    --type tsv --fields code,name --stopOnError admincodes.txt
mongoimport $mongohost $mongouser $mongopassword -d $database -c countrynames \
    --type tsv --fields code,name --stopOnError countrynames.txt

rm countrynames.txt admincodes.txt

php ./index.php $elastichost $database $collection $host $user $password
