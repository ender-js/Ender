var process = require('child_process')
  , path = require('path')
  , exec = process.exec
  , LEVELS = {
      advanced: 'ADVANCED_OPTIMIZATIONS'
    , simple: 'SIMPLE_OPTIMIZATIONS'
    , whitespace: 'WHITESPACE_ONLY'
  }
  , CLOSURE = {
      compile: function (files, use, level, callback) {
        level = LEVELS[level || 'advanced']
        use = use || "ender"
        files.unshift(use + '.js');
        files = files.map(function (file) {
          return '--js=' + file;
        }).join(' ');
        var jar = path.join(__dirname, '../support/closure.jar');
        exec('java -jar ' + jar + ' --compilation_level ' + level + ' ' + files + ' --js_output_file=' + use + '-app.js', function (err, out, stderr) {
          if (err) return console.log('Something went wrong trying to compile :('.red)
          callback(null, out);
        });
      }
  };

module.exports = CLOSURE;
