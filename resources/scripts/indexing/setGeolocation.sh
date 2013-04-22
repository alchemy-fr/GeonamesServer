curl -s -X POST $1 -d '
{
    "'$2'": {
        "properties": {
            "pin": {
                "properties": {
                    "location": {
                        "type": "geo_point"
                    }
                }
            },
            "admin1Code": {
                "type": "string"
            },
            "admin2Code": {
                "type": "string"
            },
            "admin3Code": {
                "type": "string"
            },
            "admin4Code": {
                "type": "string"
            },
            "population": {
                "type": "long",
                "null_value": 0
            }
        }
    }
}'