var fs = require('fs');

module.exports.parse = function(file, callback) {
    if (!callback) {
        return;
    }
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, parse(data));
        }
    });
};

module.exports.parseSync = function (file) {
    return parse(fs.readFileSync(file, 'utf8'));
};

function parse(data) {
    var value = {};
    var lines = data.split(/\r\n|\r|\n/);
    lines.forEach(function (line) {
        if (/^\s*([\w\.\-\_]+)\s*=\s*"(.*?)"\s*$/.test(line)) {
            var match = line.match(/^\s*([\w\.\-\_]+)\s*=\s*"(.*?)"\s*$/);
            value[match[1]] = match[2];
        }
    });
    return value;
}
