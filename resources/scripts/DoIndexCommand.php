<?php

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

require_once __DIR__ . '/AbstractIndexCommand.php';

class DoIndexCommand extends AbstractIndexCommand
{
    public function __construct()
    {
        parent::__construct('do-indexation');
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

        while ($flag == 0) {
            try {
                foreach ($cursor as $obj) {
                    $i++;
                    unset($obj['_id']);
            
                    $requests[] = $guzzle->put($input->getArgument('es-type').'/'.$i, null, json_encode($obj));

                    if (0 === $i % 180) {
                        $guzzle->send($requests);
                        $requests = array();
                    }
                    if (0 === $i % 10000) {
                        $elapsedTime = microtime(true) - $timeStart;
                        $entriesPerSeconds = floor($i / $elapsedTime);
                        $output->writeln(date('H:i:s') . "\tProgress: $i/$nbEntries\t($entriesPerSeconds/seconds)\t" . round($i / $nbEntries * 100) . "% \t"
                            . "~" . $this->secsToString(($nbEntries - $i) / $entriesPerSeconds) . " left\tMemory usage : ".(memory_get_usage()>>20)."Mo");
                    }
                }
                $flag = 1;
            } catch (Exception $ex) {
                $output->writeln("Something went wrong within MongoDB: ".$ex->getMessage().", Retrying ...");
                $flag = 0;
                $cursor = $this->getCursor($collection);
            }
        }

        $output->writeln("$i entries processed. Took " . $this->secsToString(floor(microtime(true)- $timeStart)) . " seconds");

        return 0;
    }

    /**
     * @param int $d
     * @return string
     */
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

    /**
     * @param MongoCollection $collection
     * @return MongoCursor
     */
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
