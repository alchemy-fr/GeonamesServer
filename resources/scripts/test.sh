#!/bin/bash

if [ -z "$ROOT_PATH" ]; then
 ROOT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
fi

RESOURCE_DIR="$ROOT_PATH/.."
FIXTURE_DIR="$RESOURCE_DIR/fixtures"
DATA_DIR="$RESOURCE_DIR/data"
SOURCE_DIR="$RESOURCE_DIR/sources"
SCRIPT_DIR="$RESOURCE_DIR/scripts"

curl -s -X DELETE "http://127.0.0.1:9200/tests/" > /dev/null
curl -s -X POST "http://127.0.0.1:9200/tests/" > /dev/null

bash "$SCRIPT_DIR/indexing/setGeolocation.sh" "http://127.0.0.1:9200/tests/cities/_mapping" "cities" > /dev/null

while read line; do curl --silent -XPOST "http://127.0.0.1:9200/tests/cities/" -d "$line" > /dev/null; done < "$FIXTURE_DIR/indexes"