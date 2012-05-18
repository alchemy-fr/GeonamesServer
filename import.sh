#!/bin/bash
rm -f allCountries.zip allCountries.txt
wget http://download.geonames.org/export/dump/allCountries.zip
unzip allCountries.zip
rm allCountries.zip
mongo geonames dropDB.js
mongoimport -d geonames -c countries --type tsv \
	--fields geonameid,name,asciiname,alternatenames,latitude,longitude,featureClass,featureCode,countryCode,cc2,admin1Code,admin2Code,admin3Code,admin4Code,population,elevation,DEM,timezone,modificationDate \
	--stopOnError allCountries.txt
rm allCountries.txt
mongo geonames setupDB.js

