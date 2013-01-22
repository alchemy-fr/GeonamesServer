<?php

include __DIR__ . "/vars.php";

$varMongoUsername = "";
$varMongoPassword = "";
$varMongoHost = "localhost";

if (isset($argv[1]) && !empty($argv[1])) {
    $varElasticSearchUrl = $argv[1];
}
if (isset($argv[2]) && !empty($argv[2])) {
    $varMongoDbName = $argv[2];
}
if (isset($argv[3]) && !empty($argv[3])) {
    $varMongoCollectionName = $argv[3];
}
if (isset($argv[4]) && !empty($argv[4])) {
    $varMongoHost = $argv[4];
}
if (isset($argv[5]) && !empty($argv[5])) {
    $varMongoUserName = $argv[5];
}
if (isset($argv[6]) && !empty($argv[6])) {
    $varMongoPassword = $argv[6];
}

function getElasticSearchUrl($url, $db, $collection, $mongoDb, $mongoCollection)
{
  if (substr($url, -1) != "/") {
    $url .= "/";
  }
  if (isset($db) && !empty($db)) {
    $url .= $db . "/";
  } else {
    $url .= $mongoDb . "/";
  }
  if (isset($collection) && !empty($collection)) {
    $url .= $collection . "/";
  } else {
    $url .= $mongoCollection . "/";
  }
  return ($url);
}

function getUrl($url, $db, $mongoDb) {
  if (substr($url, -1) != "/")
    $url .= "/";
  if (isset($db) && !empty($db))
    $url .= $db . "/";
  else
    $url .= $mongoDb . "/";
  return ($url);
}

function getCursor($collection)
{
    $cursor = $collection->find(array(
        'featureCode' => array(
            '$in' => array(
                'PPL',
                'PPLA',
                'PPLA2',
                'PPLA3',
                'PPLA4',
                'PPLC',
                'PPLCH',
                'PPLF',
                'PPLG',
                'PPLH',
                'PPLL',
                'PPLQ',
                'PPLR',
                'PPLS',
                'PPLW',
                'PPLX',
                'STLMT'
        ))
    ));
    $cursor->immortal(true);

    return ($cursor);
}

try {
  if (!empty($varMongoUsername) && !empty($varMongoPassword))
    $m = new MongoClient("mongodb://$varMongoHost",
                         array("username" => $varMongoUsername,
                               "password" => $varMongoPassword));
  else if (!empty($varMongoUsername))
    $m = new MongoClient("mongodb://$varMongoHost",
                         array("username" => $varMongoUsername));
  else
    $m = new MongoClient("mongodb://$varMongoHost");
  $db = $m->$varMongoDbName;
    
} catch (MongoConnectionException $e) {
    echo "Couldn't connect to mongodb, is the 'mongo' process running?\n";
    exit();
}

echo "Connected to the database $varMongoDbName.\n";

$collection = $db->$varMongoCollectionName;
$cursor = getCursor($collection);
$i = 0;

$URL = getElasticSearchUrl($varElasticSearchUrl,
			   $varElasticSearchDB,
			   $varElasticSearchCollection,
			   $varMongoDbName,
			   $varMongoCollectionName);



$rootUrl = getUrl($varElasticSearchUrl,
		  $varElasticSearchDB,
		  $varMongoDbName);

echo "Dropping current ElasticSearch index.\n";
exec("sh ./scripts/deleteIndex.sh $rootUrl");
echo "Creating new index.\n";
exec("sh ./scripts/createIndex.sh $rootUrl");
echo "Setting geolocation parameters.\n";
exec("sh ./scripts/setGeolocation.sh $URL" . "_mapping $varMongoCollectionName");

echo "\nIndexing...\n";

$conn = curl_init();
$flag = 0;

while ($flag == 0) {
  try {
    foreach ($cursor as $obj) {
      $i++;
      $mongoid = $obj['_id'];
      unset($obj['_id']);
      curl_setopt($conn, CURLOPT_URL, $URL . $i);
      curl_setopt($conn, CURLOPT_POSTFIELDS, json_encode($obj));
      curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($conn, CURLOPT_CUSTOMREQUEST, strtoupper("PUT"));
      curl_setopt($conn, CURLOPT_FORBID_REUSE, 0);
      curl_setopt($conn, CURLOPT_CONNECTTIMEOUT, 0);
      curl_setopt($conn, CURLOPT_TIMEOUT, 60);
      try {
        $res = curl_exec($conn);
      } catch (Exception $e) {
        echo "An error ocurred: $e\nRetrying...\n";
        sleep(5);
        $res = curl_exec($conn);
      }
      if ($i % 100000 === 0) {
        echo "Processed $i entries\n";
      }
    }
    $flag = 1;
  } catch (Exception $ex) {
    "Something went wrong within MongoDB: $ex\nRetrying...\n";
    $flag = 0;
    $cursor = getCursor($collection);
  }
}

echo "$i entries proccessed.\n";
exit();
