#!/bin/bash

CONFIG_DIR="/var/GeonamesServer/config"
DATA_DIR="/data"
SOURCE_DIR="/sources"

echo "Reading configuration files ...." >&2

# Create directories
if [ ! -d $DATA_DIR ];then
    mkdir $DATA_DIR
fi

if [ ! -d $SOURCE_DIR ];then
    mkdir $SOURCE_DIR
fi

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

