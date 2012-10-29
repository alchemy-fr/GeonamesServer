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

php ./index.php $1 geonames countries