#!/bin/bash

if [ ! -f "/state/mongo-import" ]; then
    # Import in mongo database
    ./mongo-import.sh
fi
if [ ! -f "/state/elastic-index" ]; then
    # Indexation in Elasticsearch
    ./elasticsearch-indexation.sh
fi

node /var/GeonamesServer/server.js
