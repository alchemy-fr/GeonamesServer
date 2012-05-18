(function(){

    var addNamesIndex = function(tab) {
            if( ! tab.alternatenames)
            {
                    tab.alternatenames = '';
            }

            var names = [];

            if(typeof tab.asciiname.toLowerCase == 'function') {
                    names.push(tab.asciiname.toLowerCase());
            }

            if(typeof tab.alternatenames.split !== 'function')
            {
                    if(typeof tab.name.toLowerCase == 'function') {
                            names.push(tab.name.toLowerCase());
                    }
            }
            else
            {
                    tmpalt = tab.alternatenames.split(',');

                    for(i in tmpalt)
                    {
                            if(tmpalt[i] != '')
                            {
                                    names.push(tmpalt[i].toLowerCase());
                            }
                    }
            }

            tab.names = names;

            if(tab.longitude && tab.latitude) {
                    tab.location = [tab.longitude, tab.latitude];
            }

            db.countries.update( { _id: tab._id }, tab);
    }

    db.countries.find().forEach(addNamesIndex);
    db.countries.ensureIndex({ names : 1 });
    db.places.ensureIndex({ loc : "2d" });
    db.countries.ensureIndex({ countryCode : 1 });

})();
