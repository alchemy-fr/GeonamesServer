`<?php
require_once __DIR__ . '/vendor/autoload.php';

use \ElasticSearch\Client;

include("vars.php");

function getElasticSearchUrl($url, $db, $collection,
			     $mongoDb, $mongoCollection) {
  if (substr($url, -1) != "/")
    $url .= "/";
  if (isset($db) && !empty($db))
    $url .= $db . "/";
  else
    $url .= $mongoDb . "/";
  if (isset($collection) && !empty($collection))
    $url .= $collection . "/";
  else
    $url .= $mongoCollection . "/";
  return ($url);
}

try
{
  $m = new Mongo();
  $db = $m->$varMongoDbName;
}
catch (MongoConnectionException $e)
{
  echo 'Couldn\'t connect to mongodb, is the "mongo" process running?';
  exit();
}

echo "Connected to the database $varMongoDbName.\n";

$collection = $db->$varMongoCollectionName;

$cursor = $collection->find();
$i = 0;

$URL = getElasticSearchUrl($varElasticSearchUrl,
			   $varElasticSearchDB,
			   $varElasticSearchCollection,
			   $varMongoDbName,
	$varMongoCollectionName);

$es = Client::connection($URL);

if (isset($es))
  {
    echo "Dropping current ElasticSearch index.\n";
    $es->request("", "DELETE");
    echo "Indexing...\n";
    foreach ($cursor as $obj)
      {
	$i++;
	$mongoid = $obj['_id'];
	
	unset($obj['_id']);
	$es->index($obj, $i);
      }
    $es->refresh();
    sleep($varUpdateTime);
    $result = $es->request("_count", "GET");
    $count = $result['count'];
    echo "Successfully added $count entries.\n";
    exit();
}
echo "Couldn\'t connect to the ElasticSearch database.\n";