<?php
$usage = "Usage:\n"
    . "\t php ./indexing.php <elastic_host> <elastic_port> <elastic_scheme> <elastic_index> <elastic_node>"
    . "<mongo_db> <mongo_collection> <mongo_host> <mongo_port> [mongo_user] [mongo_pass]\n";

if (isset($argv[1]) && !empty($argv[1])) {
    $varElasticSearchHost = trim($argv[1], '/ ');
}
if (isset($argv[2]) && !empty($argv[2])) {
    $varElasticSearchPort = (int) $argv[2];
}
if (isset($argv[3]) && !empty($argv[3])) {
    $varElasticSearchScheme = trim($argv[3], ' ');
    if (!in_array($varElasticSearchScheme, array('http', 'https'))) {
        echo "Elastic search scheme must be http or https;\n";
        exit(1);
    }
}
if (isset($argv[4]) && !empty($argv[4])) {
    $varElasticSearchIndex = trim($argv[4], ' ');
}
if (isset($argv[5]) && !empty($argv[5])) {
    $varElasticSearchIndexType = trim($argv[5], ' ');
}
if (isset($argv[6]) && !empty($argv[6])) {
    $varMongoDbName = trim($argv[6], ' ');
}
if (isset($argv[7]) && !empty($argv[7])) {
    $varMongoCollectionName = trim($argv[7], ' ');
}
if (isset($argv[8]) && !empty($argv[8])) {
    $varMongoHost = trim($argv[8], '/ ');
}
if (isset($argv[9]) && !empty($argv[9])) {
    $varMongoPort = (int) $argv[9];
}
if (isset($argv[10]) && !empty($argv[10])) {
    $varMongoUserName = $argv[10];
}
if (isset($argv[11]) && !empty($argv[11])) {
    $varMongoPassword = $argv[11];
}

if (count($argv) < 9){
    echo 'Missing arguments\n';
    echo $usage;
    exit(1);
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
            $parts[] = $div . $name;
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

if (!empty($varMongoUserName)) {
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

\MongoCursor::$timeout = -1;

$collection = $db->$varMongoCollectionName;

$cursor = getCursor($collection);

$i = 0;

$indexUrl = sprintf('%s://%s:%s/%s/', $varElasticSearchScheme, $varElasticSearchHost, $varElasticSearchPort, $varElasticSearchIndex);

$indexTypeUrl = sprintf('%s/%s/', $indexUrl, $varElasticSearchIndexType);

echo "Dropping current ElasticSearch index ...\n";
exec("sh " . __DIR__ . "/indexing/deleteIndex.sh $indexUrl");

echo "Creating new index ...\n";
exec("sh " . __DIR__ . "/indexing/createIndex.sh $indexUrl");

echo "Setting index mapping ...\n";
exec("sh " . __DIR__ . "/indexing/setupIndex.sh $indexTypeUrl" . "_mapping $varElasticSearchIndexType");

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
            curl_setopt($conn, CURLOPT_URL, $indexTypeUrl . $i);
            curl_setopt($conn, CURLOPT_POSTFIELDS, json_encode($obj));
            curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($conn, CURLOPT_CUSTOMREQUEST, strtoupper("PUT"));
            curl_setopt($conn, CURLOPT_FORBID_REUSE, 0);
            curl_setopt($conn, CURLOPT_CONNECTTIMEOUT, 0);
            curl_setopt($conn, CURLOPT_TIMEOUT, 60);

            try {
                $res = curl_exec($conn);
            } catch (Exception $e) {
                echo "An error occurred: {$e->getMessage()} \nRetrying ...\n";
                sleep(5);
                $res = curl_exec($conn);
            }

            if ($nbEntries !== 0 && ($elapsedTime = (int) floor(microtime(true) - $timeStart)) % 5 === 0 && $elapsedTime !== $flagElapsedTime) {
                $flagElapsedTime = $elapsedTime;
                if ($elapsedTime !== 0 && ($entriesPerSeconds = (int) floor($i / $elapsedTime)) !== 0) {
                    echo date('D M d H:i:s') . "\tProgress: $i/$nbEntries\t($entriesPerSeconds/seconds)\t" . round($i / $nbEntries * 100) . "% \t";
                    echo "~" . secsToString(($nbEntries - $i) / $entriesPerSeconds) . " left\n";
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

echo "$i entries processed. Took " . secsToString(floor(microtime(true)- $timeStart)) . " seconds\n";
exit(0);
