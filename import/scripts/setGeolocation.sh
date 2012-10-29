curl -s -X POST $1 -d '
{
  "'$2'" : {
    "properties" : {
      "pin" : {
          "properties" : {
              "location" : { "type" : "geo_point" }
          }
      }
    }
  }
}'