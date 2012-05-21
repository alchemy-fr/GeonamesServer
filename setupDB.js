(function(){

    var addNamesIndex = function(place) {
            if( ! place.alternatenames)
            {
                    place.alternatenames = '';
            }

            var names = [];

            if(typeof place.asciiname.toLowerCase == 'function') {
                    names.push(place.asciiname.toLowerCase());
            }

            if(typeof place.alternatenames.split !== 'function')
            {
                    if(typeof place.name.toLowerCase == 'function') {
                            names.push(place.name.toLowerCase());
                    }
            }
            else
            {
                    tmpalt = place.alternatenames.split(',');

                    for(i in tmpalt)
                    {
                            if(tmpalt[i] != '')
                            {
                                    names.push(tmpalt[i].toLowerCase());
                            }
                    }
            }

            place.names = names;

            if(place.longitude && place.latitude) {
                    place.location = [place.longitude, place.latitude];
            }

            db.countries.save(place);
    }

    db.countries.find().forEach(addNamesIndex);
    db.countries.ensureIndex({ names : 1 });
    db.places.ensureIndex({ loc : "2d" });
    db.countries.ensureIndex({ countryCode : 1 });

})();
