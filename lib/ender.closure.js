var process = require('child_process')
  , path = require('path')
  , exec = process.exec
  , CLOSURE = {

    compile: function (files, use, callback) {
      var nextIsExterns = false;
      use = use || "ender"
      files.unshift(use + '.js');
      files = files.map(function (file) {
        if(file == '--externs') {
          nextIsExterns = true;
          return '';
        } else if(nextIsExterns) {
          nextIsExterns = false;
          return '--externs=' + file;
        }
        return '--js=' + file;
      }).join(' ');
      var jar = path.join(__dirname, '../support/closure.jar');
      exec('java -jar ' + jar + ' --compilation_level ADVANCED_OPTIMIZATIONS ' + files + ' --js_output_file=' + use + '-app.js', function (err, out, stderr) {
        if (err) return console.log('Something went wrong trying to compile :('.red)
        callback(null, out);
      });
    }
  };

module.exports = CLOSURE;
