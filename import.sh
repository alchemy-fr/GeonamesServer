#!/bin/bash

MONGO_VERSION=`mongo --version | sed -e "s|.*: \.*||" | cut -d "." -f -1`

rm -f allCountries.zip allCountries.txt
wget http://download.geonames.org/export/dump/allCountries.zip
unzip allCountries.zip
rm allCountries.zip

mongo geonames dropDB.js

if [ $MONGO_VERSION -gt 1 ]; then
    mongoimport -d geonames -c countries --type tsv \
	--fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
	--stopOnError allCountries.txt
else
    mongoimport -d geonames -c countries --type tsv \
	--fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
	 allCountries.txt
fi

rm allCountries.txt
mongo geonames setupDB.js

