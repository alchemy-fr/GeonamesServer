<?php

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

require_once __DIR__ . '/AbstractIndexCommand.php';

class TransactionInfo
{
    static $_dumpDirectory;

    public function __construct(
        \Guzzle\Http\Message\RequestInterface $request
    ) {
        $response = $request->getResponse();

        $this->url = $request->getUrl();
        $e = explode('/', $this->url);
        $this->id = $e[count( $e )-1];
        $this->requestBody = $request->getBody();
        $this->responseCode = $response->getStatusCode();
        $this->serverMessage = $response->getMessage();
        $this->requestString = $request->__toString();
        $this->responseString = $response->__toString();
        $this->postFields = $request->getPostFields();

    }

    public static function setDumpDirectory( $path ) {
        self::$_dumpDirectory = $path;
    }

    public static function cleanDumpDirectory() {
        self::deleteDirectory(self::$_dumpDirectory );
    }

    /**
     * Remove directory and its content
     *
     */
    public static function deleteDirectory( $dir ) {
        if (!file_exists($dir)) {
            return true;
        }

        if (!is_dir($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }

            if (!self::deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
                return false;
            }

        }
        return rmdir($dir);
    }

    public function dumpTofile() {
        $parsed = parse_url($this->url);
        $path = $parsed['path'];
        $filepath = self::$_dumpDirectory.$path;
        self::createPath( dirname( $filepath ) );
        $str = array(
          "Request : {$this->requestString} ",
          "Size of body : " . strlen( $this->requestBody ) ,
          "POST fields :\n",
          json_encode( $this->postFields),
          "Response:",
          $this->responseString,
          "Server Response message:",
          $this->serverMessage,
          "Status code :" . $this->responseCode,
          "---------------------------------------------\n"
        );
        file_put_contents( $filepath, implode( "\n", $str ), FILE_APPEND );
    }

    /**
     * Create directory (recursively)
     *
     */
    static function createPath($path) {
        if (is_dir($path)) {
            return true;
        }
        $prev_path = substr($path, 0, strrpos($path, '/', -2) + 1 );
        $return = self::createPath($prev_path);
        return ($return && is_writable($prev_path)) ? @mkdir($path) : false;
    }


    public function getMark() {
        $char = '!';
        if( $this->responseCode == 400 ) {
            $char = '?';
        }
        return "$char({$this->id})";
    }


}


class DoIndexCommand extends AbstractIndexCommand
{
    // Number of record to send to elasticsearch
    const PACKET_SIZE = 100;

    // Position to start (useful for debug purpose)
    // const STARTING_POSITION = 1320000;
    const STARTING_POSITION = 0;

    // Set to true to push all request details to stdout
    const DUMP_ALL_REQUEST = false;

    public function __construct()
    {
        parent::__construct('do-indexation');
        TransactionInfo::setDumpDirectory( '/state/dump/' );
        TransactionInfo::cleanDumpDirectory();
    }

    public function execute(InputInterface $input, OutputInterface $output)
    {
        $mongoDbName = $input->getArgument('mongo-db');
        $mongoCollectionName = $input->getArgument('mongo-collection');
        $mongoHost = $input->getArgument('mongo-host');
        $mongoPort = $input->getArgument('mongo-port');
        $mongoUserName = $input->getOption('mongo-user');
        $mongoPassword = $input->getOption('mongo-password');

        $options = array();
        if (!empty($mongoUserName)) {
            $options['username'] = $mongoUserName;
        }
        if (!empty($mongoPassword)) {
            $options['password'] = $mongoPassword;
        }
        $options['username'] = "admin";
	    $options['password'] = "admin123456";
	    $options['db'] = "admin";
        $m = new MongoClient("mongodb://$mongoHost:$mongoPort", $options);
        $db = $m->$mongoDbName;
        \MongoCursor::$timeout = -1;

        $output->writeln("Connected to the database <info>$mongoDbName</info>");

        $collection = $db->{$mongoCollectionName};
        $cursor = $this->getCursor($collection);

        $i = 0;

        $output->writeln("Removing elastic-search index...");
        $this->doDeleteIndex($input, $output);
        $output->writeln("Creating elastic-search index...");
        $this->doCreateIndex($input, $output);
        $output->writeln("Setting-up elastic-search mapping...");
        $this->doSetupMapping($input, $output);

        $output->writeln("\nIndexing...");

        $guzzle = $this->getGuzzle($input);

        $flag = 0;
        $nbEntries = $cursor->count(true);

        $timeStart = microtime(true);
        $requests = array();
        $biggest_object_id = null;
        $transaction_size = 0;

        while ($flag == 0) {
            try {
                foreach ($cursor as $obj) {
                    $i++;
                    if ($i < self::STARTING_POSITION) continue;
                    $id = $obj['_id'];
                    unset($obj['_id']);

                    $encoded = json_encode($obj);

                    if( '' == $encoded ) {
                        $output->writeln( "[WARNING] No data at id $id (index $i) ! Will not be computed." );
                    } else {
                        $request = $guzzle->put($input->getArgument('es-type').'/'.$i, null, $encoded);
                        if( self::DUMP_ALL_REQUEST ) {
                            $t = new TransactionInfo( $request );
                            $t->dumpTofile();
                        }
                        $requests[] = $request;
                    }


                    if (0 === $i % self::PACKET_SIZE) {
                        $guzzle->send($requests);
                        $requests = array();
                        $transaction_size = 0;
                    }
                    if (0 === $i % 10000) {
                        $elapsedTime = microtime(true) - $timeStart;
                        $entriesPerSeconds = floor($i / $elapsedTime);
                        $output->writeln(date('H:i:s') . "\tProgress: $i/$nbEntries\t($entriesPerSeconds/seconds)\t" . round($i / $nbEntries * 100) . "% \t"
                            . "~" . $this->secsToString(($nbEntries - $i) / $entriesPerSeconds) . " left\tMemory usage : ".(memory_get_usage()>>20)."Mo");
                    }
                }
                $flag = 1;
            } catch (\Guzzle\Http\Exception\MultiTransferException $ex) {
                foreach( $ex->getFailedRequests() as $failedRequest ) {
                    $t = new TransactionInfo( $failedRequest );
                    $t->dumpTofile();
                    $output->write($t->getMark());
                }

                $flag = 0;
            }
        }

        $output->writeln("$i entries processed. Took " . $this->secsToString(floor(microtime(true)- $timeStart)) . " seconds");

        return 0;
    }


    //protected function _dumpServerException(
        //\Guzzle\Http\Exception\ServerErrorResponseException $e,
        //\Guzzle\Http\Message\RequestInterface $request,
        //$output ) {
        //$output->writeln( "SERVER ERROR : CODE ". $request->getResponse()->getStatusCode() );
        //$output->writeln( $e );
    //}

    protected function _dumpToFile( $var ) {
        ob_flush();
        ob_start();
        var_dump($var);
        file_put_contents('/state/dump.txt', ob_get_flush());
    }

    private function secsToString($d) {
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

    private function getCursor($collection) {
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

        return $cursor;
    }
}
