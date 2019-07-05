#!/bin/bash

set -xe

DATA_DIR="/data"
SOURCE_DIR="/sources"

# Get geonames resources
echo "Start fetching Geonames ressources ..."

cd $SOURCE_DIR
echo "Downloading GeoliteCity.dat.gz"
wget https://src.fedoraproject.org/lookaside/pkgs/GeoIP/GeoLiteCity.dat.gz/md5/2ec4a73cd879adddf916df479f3581c7/GeoLiteCity.dat.gz

echo "Extracting GeoliteCity.dat.gz"
gunzip -c "$SOURCE_DIR/GeoLiteCity.dat.gz" > "$DATA_DIR/GeoLiteCity.dat"

cd $SOURCE_DIR
echo "Downloading allCountries.zip"
wget http://download.geonames.org/export/dump/allCountries.zip

echo "Extracting allCountries.zip"
unzip "$SOURCE_DIR/allCountries.zip" -d "$DATA_DIR"

echo "Extracting cities from allCountries.txt to allCities.txt"
cat "$DATA_DIR/allCountries.txt" | grep -e PPL -e STLMT > "$DATA_DIR/allCities.txt"

cd $SOURCE_DIR
echo "Downloading admin1CodesASCII.txt"
wget http://download.geonames.org/export/dump/admin1CodesASCII.txt

cat "$SOURCE_DIR/admin1CodesASCII.txt" | cut -f1,2 > "$DATA_DIR/admincodes.txt"

cd $SOURCE_DIR
echo "Downloading countryInfo.txt"
wget http://download.geonames.org/export/dump/countryInfo.txt

cat "$SOURCE_DIR/countryInfo.txt" | grep -v '^#' | cut -f1,5 > "$DATA_DIR/countrynames.txt"

