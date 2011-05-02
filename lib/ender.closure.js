/*NPM METHODS*/
var process = require('child_process')
  , path = require('path')
  , exec = process.exec
  , CLOSURE = {

    compile: function (files, callback) {
      files.unshift('./ender.min.js');
      files = files.map(function (file) {
        return '--js=' + file;
      }).join(' ');
      var jar = path.join(__dirname, 'closure.jar');
      exec('java -jar ' + jar + ' --compilation_level ADVANCED_OPTIMIZATIONS ' + files + ' --js_output_file=ender-app.js', function (err, out, stderr) {
        if (err) throw err;
        callback(out);
      });
    }
  };

module.exports = CLOSURE;