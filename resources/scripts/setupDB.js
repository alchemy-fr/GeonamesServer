(function(){

    var addNamesIndex = function(place) {

        if(!place.alternatenames) {
            place.alternatenames = '';
        }

        var names = [];

        if(typeof place.asciiname.toLowerCase === 'function') {
            names.push(place.asciiname.toLowerCase());
        }

        if(typeof place.alternatenames.split !== 'function') {
            if(typeof place.name.toLowerCase === 'function') {
                names.push(place.name.toLowerCase());
            }
        } else {
            var tmpalt = place.alternatenames.split(',');

            for(var i in tmpalt) {
                if(tmpalt[i] !== '') {
                    names.push(tmpalt[i].toLowerCase());
                }
            }
        }

        place.names = names;

        if(place.longitude && place.latitude) {
            place.pin = {};
            place.pin.location = {};
            place.pin.location.lat = place.latitude;
            place.pin.location.lon = place.longitude;
        }

        db.cities.save(place);
    };

    var cur = db.cities.find();

    cur.immortal = true;

    var j = 0;

    cur.forEach(function(obj) {
        addNamesIndex(obj);
        if (j % 100000 === 0) {
            print(j + " entries processed");
        }
        j++;
    });


    db.cities.ensureIndex({
        names : 1
    });
    db.cities.ensureIndex({
        'pin.location' : "2d"
    });
    db.cities.ensureIndex({
        countryCode : 1
    });

    print(j + " entries processed");
})();
