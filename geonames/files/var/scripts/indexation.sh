#!/bin/bash

set -xe

if [ $NEVER_INDEX == 0 ]; then
    if [ ! -f "/state/mongo-import" ]; then
        # Import in mongo database
        /var/scripts//mongo-import.sh
    fi
    if [ ! -f "/state/elastic-index" ]; then
        # Indexation in Elasticsearch
        /var/scripts/elasticsearch-indexation.sh
    fi
fi

node /var/GeonamesServer/server.js
