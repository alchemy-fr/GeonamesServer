#!/bin/bash

for route in "/" "/city" "/city?name=hong-kong" "/ip?ip=173.194.40.162"
do
    response=$(curl --write-out %{http_code} --silent --output /dev/null $1$route)
    if [ "$response" == "200" ]
    then
        echo "SUCCESS, expecting 200, got $response for $route"
    else
        echo "FAIL, expecting 200, got $response for $route"
    fi
done
