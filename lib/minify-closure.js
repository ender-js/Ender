var path = require('path')
var fs = require('fs')
var child_process = require('child_process')

var supportpath = path.resolve(__dirname, '../support/')
var jarpath = path.join(supportpath, 'closure.jar')
var mappath = '_tmp_map' // Should probably make use of that generateTempFile function
var cmd = 'java -jar "' + jarpath + '" --compilation_level SIMPLE_OPTIMIZATIONS --create_source_map ' + mappath + ' --source_map_format V3'

// This needs some error handling and general cleanup
function minify(source, cb) {
    var child = child_process.exec(cmd), minified = ''

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', function(data) {
        minified += data
    })

    child.on('exit', function() {
        fs.readFile(mappath, 'utf8', function(err, mapdata) {
            fs.unlink(mappath, function () {
                cb(null, minified, mapdata)
            })
        })
    })

    child.stdin.end(source);
}

exports.minify = minify;