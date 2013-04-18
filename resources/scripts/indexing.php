<?php

$varMongoDbName = "geonames";
$varMongoCollectionName = "cities";
$varElasticSearchUrl = "http://127.0.0.1:9200/";

// If the following two variables are empty, varMongoDbName
// and varMongoCollectionName will be used
$varElasticSearchDB = "";
$varElasticSearchCollection = "";

$varMongoUsername = "";
$varMongoPassword = "";
$varMongoHost = "127.0.0.1";

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
    $varMongoPort = $argv[5];
}
if (isset($argv[6]) && !empty($argv[6])) {
    $varMongoUserName = $argv[6];
}
if (isset($argv[7]) && !empty($argv[7])) {
    $varMongoPassword = $argv[7];
}

function getElasticSearchUrl($url, $db, $collection, $mongoDb, $mongoCollection) {
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
    if (substr($url, -1) != "/") {
        $url .= "/";
    }

    if (isset($db) && !empty($db)) {
        $url .= $db . "/";
    } else {
        $url .= $mongoDb . "/";
    }

    return ($url);
}

function secsToString($d) {
    $parts = array();
    foreach (array(
        'D' => 86400,
        'H' => 3600,
        'm' => 60,
        's' => 1
    ) as $name => $dur) {
        $div = floor($d / $dur);

        if ($div == 0) {
            continue;
        } else {
            $parts[] = $div . " " . $name;
        }

        $d %= $dur;
    }

    $last = array_pop($parts);

    if (empty($parts)) {
        return $last;
    } else {
        return join(', ', $parts) . " " . $last;
    }
}

function getCursor($collection) {
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

$options = array();

if (!empty($varMongoUsername)) {
    $option['username'] = $varMongoUserName;
}

if (!empty($varMongoPassword)) {
    $option['password'] = $varMongoPassword;
}


try {
    $m = new MongoClient("mongodb://$varMongoHost:$varMongoPort", $options);
    $db = $m->$varMongoDbName;
} catch (MongoConnectionException $e) {
    echo "Couldn't connect to mongodb, is the 'mongo' process running?\n";
    exit(1);
}

echo "Connected to the database $varMongoDbName\n";

$collection = $db->$varMongoCollectionName;

$cursor = getCursor($collection);
$i = 0;

$URL = getElasticSearchUrl(
        $varElasticSearchUrl, $varElasticSearchDB, $varElasticSearchCollection, $varMongoDbName, $varMongoCollectionName
);

$rootUrl = getUrl($varElasticSearchUrl, $varElasticSearchDB, $varMongoDbName);

echo "Dropping current ElasticSearch index ...\n";
exec("sh " . __DIR__ . "/indexing/deleteIndex.sh $rootUrl");

echo "Creating new index ...\n";
exec("sh " . __DIR__ . "/indexing/createIndex.sh $rootUrl");

echo "Setting geolocation parameters ...\n";
exec("sh " . __DIR__ . "/indexing/setGeolocation.sh $URL" . "_mapping $varMongoCollectionName");

echo "\nIndexing...\n";

$conn = curl_init();
$flag = 0;
$nbEntries = $cursor->count(true);

$timeStart = microtime(true);
$flagElapsedTime = null;
while ($flag == 0) {
    try {
        foreach ($cursor as $obj) {
            $i++;
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
                echo "An error ocurred: {$e->getMessage()} \nRetrying ...\n";
                sleep(5);
                $res = curl_exec($conn);
            }

            if ($nbEntries !== 0 && ($elapsedTime = floor(microtime(true) - $timeStart)) % 5 === 0 && $elapsedTime !== $flagElapsedTime) {
                $flagElapsedTime = $elapsedTime;
                if ($elapsedTime !== 0 && $entriesPerSeconds = floor($i / $elapsedTime) !== 0) {
                    echo date('D M d H:i:s') . "\t\tProgress: $i/$nbEntries ($entriesPerSeconds/seconds)  " . round($i / $nbEntries * 100) . "%  ";
                    echo "~ " . secsToString($nbEntries / $entriesPerSeconds) . " left\n";
                }
            }
        }
        $flag = 1;
    } catch (Exception $ex) {
        echo "Something went wrong within MongoDB: $ex\nRetrying ...\n";
        $flag = 0;
        $cursor = getCursor($collection);
    }
}

echo "$i entries proccessed. Tooks " . microtime(true);
- $timeStart . " seconds\n";
exit(0);
