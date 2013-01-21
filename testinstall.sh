#!/bin/bash
mkdir data
cd data

rm -f GeoLiteCity.dat GeoLiteCity.dat.gz
cp ../GeoIP.dat.gz ./GeoLiteCity.dat.gz
gunzip GeoLiteCity.dat

cd ..

npm install
