#!/bin/bash

if [ ! -f "/state/mongo-import" ]; then
    # Import in mongo database
    /var/scripts//mongo-import.sh
fi
if [ ! -f "/state/elastic-index" ]; then
    # Indexation in Elasticsearch
    /var/scripts/elasticsearch-indexation.sh
fi

node /var/GeonamesServer/server.js
