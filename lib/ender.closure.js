var process = require('child_process')
  , path = require('path')
  , exec = process.exec
  , CLOSURE = {

    compile: function (files, outfile, callback) {
      var nextIsExterns = false

      files = files.map(function (file) {
        if (file == '--externs') {
          nextIsExterns = true
          return ''
        } else if(nextIsExterns) {
          nextIsExterns = false
          return '--externs=' + file
        }
        return '--js=' + file
      }).join(' ')
      var jar = path.join(__dirname, '../support/closure.jar')
      exec('java -jar ' + jar + ' --compilation_level ADVANCED_OPTIMIZATIONS ' + files + ' --js_output_file=' + outfile, function (err, out, stderr) {
        if (err) return console.log('Something went wrong trying to compile :('.red)
        callback()
      })
    }
  }

module.exports = CLOSURE
