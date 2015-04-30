<?php

use Symfony\Component\Console\Command\Command;
use Guzzle\Http\Client as Guzzle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Guzzle\Plugin\Backoff\BackoffPlugin;
use Guzzle\Http\Exception\ClientErrorResponseException;

abstract class AbstractIndexCommand extends Command
{
    private $guzzle;
    
    public function __construct($name = null)
    {
        parent::__construct($name);
        
        $this
            ->addArgument('es-host')
            ->addArgument('es-port')
            ->addArgument('es-scheme')
                
            ->addArgument('es-index')
            ->addArgument('es-type')
                
            ->addArgument('mongo-db')
            ->addArgument('mongo-collection')
            ->addArgument('mongo-host')
            ->addArgument('mongo-port')

            ->addOption('mongo-user')
            ->addOption('mongo-password');
    }
    
    protected function getGuzzle(InputInterface $input)
    {
        if (null !== $this->guzzle) {
            return $this->guzzle;
        }
        
        if (!in_array($input->getArgument('es-scheme'), array('http', 'https'))) {
            throw new InvalidArgumentException("Elastic search scheme must be http or https");
        }
        
        $uri = sprintf(
                '%s://%s:%s/%s', 
                $input->getArgument('es-scheme'), 
                rtrim($input->getArgument('es-host'), '/'), 
                $input->getArgument('es-port'), 
                $input->getArgument('es-index')
        );
        
        $this->guzzle = new Guzzle($uri);
        $this->guzzle->addSubscriber(BackoffPlugin::getExponentialBackoff());
        
        return $this->guzzle;
    }
    
    
    protected function doCreateIndex(InputInterface $input, OutputInterface $output)
    {
        $settings = array(
            'index' => array(
                'analysis' => array(
                    'analyzer' => array(
                        'city' => array(
                            'type' => 'custom',
                            'tokenizer' => 'whitespace',
                            'filter' => array('standard', 'lowercase', 'asciifolding'),
                        ),
                        'lowercase' => array(
                            'type' => 'custom',
                            'tokenizer' => 'standard',
                            'filter' => array('standard', 'lowercase'),
                        )
                    )
                )
            )
        );
        
        $response = $this->getGuzzle($input)->post(null, null, json_encode($settings))->send();
        
        if (!$response->isSuccessful()) {
            throw new RuntimeException('Failed to create index');
        }
        
        return 0;
    }
    
    protected function doDeleteIndex(InputInterface $input, OutputInterface $output)
    {
        $ignoreResponse = false;
        try {
            $response = $this->getGuzzle($input)->delete()->send();
        } catch (ClientErrorResponseException $e) {
            // ignore if deleting a non-existing index
            if (404 !== $e->getResponse()->getStatusCode()) {
                throw $e;
            }
            $ignoreResponse = true;
        }
        
        if (!$ignoreResponse && !$response->isSuccessful()) {
            throw new RuntimeException('Failed to delete index');
        }
        
        return 0;
    }
    
    protected function doSetupMapping(InputInterface $input, OutputInterface $output)
    {
        $mapping = array(
            $input->getArgument('es-type') => array(
                '_all'       => array(
                    'analyzer' => 'lowercase',
                ),
                'properties' => array(
                    'geonameid'        => array(
                        'type'  => 'integer',
                        'index' => 'not_analyzed',
                    ),
                    'name'             => array(
                        'type'   => 'string',
                        'fields' => array(
                            'name'      => array(
                                'type'     => 'string',
                                'index'    => 'analyzed',
                                'analyzer' => 'city',
                            ),
                            'untouched' => array(
                                'type'  => 'string',
                                'index' => 'not_analyzed',
                            ),
                        ),
                    ),
                    'names'            => array(
                        'type'   => 'string',
                        'fields' => array(
                            'names'     => array(
                                'type'     => 'string',
                                'index'    => 'analyzed',
                                'analyzer' => 'city',
                            ),
                            'untouched' => array(
                                'type'  => 'string',
                                'index' => 'not_analyzed',
                            ),
                        ),
                    ),
                    'asciiname'        => array(
                        'type'  => 'string',
                        'index' => 'no',
                    ),
                    'alternatenames'   => array(
                        'type'  => 'string',
                        'index' => 'no',
                    ),
                    'latitude'         => array(
                        'type'  => 'float',
                        'index' => 'no',
                    ),
                    'longitude'        => array(
                        'type'  => 'float',
                        'index' => 'no',
                    ),
                    'featureClass'     => array(
                        'type' => 'string',
                    ),
                    'featureCode'      => array(
                        'type' => 'string',
                    ),
                    'countryCode'      => array(
                        'type' => 'string',
                    ),
                    'cc2'              => array(
                        'type' => 'string',
                    ),
                    'admin1Code'       => array(
                        'type' => 'string',
                    ),
                    'admin2Code'       => array(
                        'type' => 'string',
                    ),
                    'admin3Code'       => array(
                        'type' => 'string',
                    ),
                    'admin4Code'       => array(
                        'type' => 'string',
                    ),
                    'population'       => array(
                        'type'       => 'integer'
                    ),
                    'elevation'        => array(
                        'type' => 'integer',
                    ),
                    'DEM'              => array(
                        'type' => 'integer',
                    ),
                    'timezone'         => array(
                        'type'  => 'string',
                        'index' => 'no',
                    ),
                    'modificationDate' => array(
                        'type'   => 'date',
                        'format' => 'yyyy-MM-dd',
                    ),
                    'pin'              => array(
                        'properties' => array(
                            'location' => array(
                                'type' => 'geo_point'
                            )
                        )
                    )
                )
            )
        );
        
        $uri = sprintf('%s/%s', $input->getArgument('es-type'), '_mapping');

        $response = $this->getGuzzle($input)->put($uri, null, json_encode($mapping))->send();

        if (!$response->isSuccessful()) {
            throw new RuntimeException('Failed to setup mapping');
        }
        
        return 0;
    }
}
