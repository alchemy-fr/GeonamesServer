#!/bin/bash
MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

if [ -z `which mongo` ]; then
echo "MongoDB not found. Please install it and run this script again."
exit 1
fi

if [ -z `which elasticsearch` ]; then
echo "ElasticSearch not found. Please install it and run this script again."
exit 1
fi 

if [ -z `php -m | grep mongo` ]; then
echo "PHP-mongo extension not found. Please install it and run this script again."
exit 1
fi 

mongo geonames dropDB.js

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport -d geonames -c countries --type tsv \
	--fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
	--stopOnError testCountries.txt
else
    mongoimport -d geonames -c countries --type tsv \
	--fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
	 testCountries.txt
fi

rm allCountries.txt
mongo geonames setupDB.js

rm countryInfo.txt admin1CodesASCII.txt admincodes.txt countrynames.txt
wget http://download.geonames.org/export/dump/admin1CodesASCII.txt
cat admin1CodesASCII.txt | cut -f1,2 > admincodes.txt
rm admin1CodesASCII.txt
wget http://download.geonames.org/export/dump/countryInfo.txt
cat countryInfo.txt | grep -v '^#' | cut -f1,5 > countrynames.txt
rm countryInfo.txt

mongoimport -d geonames -c admincodes --type tsv --fields code,name --stopOnError admincodes.txt
mongoimport -d geonames -c countrynames --type tsv --fields code,name --stopOnError countrynames.txt

rm countrynames.txt admincodes.txt

curl -s -X DELETE "http://127.0.0.1:9200/"

curl -s -X POST "http://127.0.0.1:9200/geonames/"

sh ./scripts/setGeolocation.sh "http://127.0.0.1:9200/geonames/countries/_mapping" "countries"

curl -XPOST "http://127.0.0.1:9200/geonames/countries/" -d '{"geonameid" : "2968815","name" : "Paris","asciiname" : "Paris","alternatenames": "Paris, Paris","latitude" : "48.8534","longitude" : "2.3486","featureClass" : "A","featureCode" : "PPL","countryCode" : "FR","admin1Code" : "A8","admin2Code" : "75","admin3Code" : "","admin4Code" : "2257981","elevation" : "","DEM" : "30","timezone" : "Europe/Paris","modificationDate" : "2012-09-13","names" : "paris"}'

