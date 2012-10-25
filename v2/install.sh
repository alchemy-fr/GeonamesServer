
cd data

rm -f GeoLiteCity.dat GeoLiteCity.dat.gz
wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
gunzip GeoLiteCity.dat

cd ..

npm install