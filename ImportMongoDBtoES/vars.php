<?php

$varMongoDbName = "geonames";
$varMongoCollectionName = "countries";
$varElasticSearchUrl = "http://127.0.0.1:9200/";

// Time (in seconds) used to wait until the ElasticSearch
// index is fully updated.

$varUpdateTime = 2;

// If the following two variables are empty, varMongoDbName
// and varMongoCollectionName will be used

$varElasticSearchDB = "";
$varElasticSearchCollection = "";

?>