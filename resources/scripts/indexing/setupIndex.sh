curl -s -X POST $1 -d '
{
    "'$2'":{
        "_all":{
            "analyzer":"lowercase"
        },
        "properties":{
            "geonameid":{
                "type":"integer",
                "index":"not_analyzed"
            },
            "name":{
                "type":"multi_field",
                "fields":{
                    "name":{
                        "type":"string",
                        "index":"analyzed",
                        "analyzer":"city"
                    },
                    "untouched":{
                        "type":"string",
                        "index":"not_analyzed"
                    }
                }
            },
            "names":{
                "type":"multi_field",
                "fields":{
                    "names":{
                        "type":"string",
                        "index":"analyzed",
                        "analyzer":"city"
                    },
                    "untouched":{
                        "type":"string",
                        "index":"not_analyzed"
                    }
                }
            },
            "asciiname": {
                "type":"string",
                "index":"no"
            },
            "alternatenames": {
                "type":"string",
                "index":"no"
            },
            "latitude": {
                "type":"float",
                "index":"no"
            },
            "latitude": {
                "type":"float",
                "index":"no"
            },
            "featureClass": {
                "type":"string"
            },
            "featureCode": {
                "type":"string"
            },
            "countryCode": {
                "type":"string"
            },
            "cc2": {
                "type":"string"
            },
            "admin1Code": {
                "type":"string"
            },
            "admin2Code": {
                "type":"string"
            },
            "admin3Code": {
                "type":"string"
            },
            "admin4Code": {
                "type":"string"
            },
            "population": {
                "type":"integer",
                "null_value":""
            },
            "elevation": {
                "type":"integer"
            },
            "DEM": {
                "type":"integer"
            },
            "timezone": {
                "type":"string",
                "index":"no"
            },
            "modificationDate": {
                "type":"date",
                "format":"yyyy-MM-dd",
            },
            "pin" : {
                "properties" : {
                    "location" : {
                        "type" : "geo_point"
                    }
                }
            }
        }
    }
}
'
