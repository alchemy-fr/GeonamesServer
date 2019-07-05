<?php

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

require_once __DIR__ . '/AbstractIndexCommand.php';

class SetupIndexCommand extends AbstractIndexCommand
{
    public function __construct()
    {
        parent::__construct('index:setup-mapping');
    }
    
    public function execute(InputInterface $input, OutputInterface $output)
    {
        return $this->doSetupMapping($input, $output);
    }
}
