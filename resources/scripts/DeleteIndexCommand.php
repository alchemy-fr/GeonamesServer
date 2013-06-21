<?php

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

require_once __DIR__ . '/AbstractIndexCommand.php';

class DeleteIndexCommand extends AbstractIndexCommand
{
    public function __construct()
    {
        parent::__construct('index:delete');
    }
    
    public function execute(InputInterface $input, OutputInterface $output)
    {
        return $this->doDeleteIndex($input, $output);
    }
}
