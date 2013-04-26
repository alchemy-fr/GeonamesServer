curl -s -X POST $1 -d '{
    "settings": {
        "index": {
            "analysis": {
                "analyzer": {
                    "geonames": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": [
                            "lowercase", "standard", "asciifolding"
                        ]
                    }
                }
            }
        }
    }
}'