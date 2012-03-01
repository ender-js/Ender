var fs = require('fs')
  , path = require('path')
  , async = require('async')

  , defaultOutputFile = 'ender.js'
  , defaultMinifiedOutputFile = 'ender.min.js'

  , writeFile = function (file, callback, err, data) {
      if (err)
        return callback(err)
      fs.writeFile(file, data, 'utf-8', callback)
    }

  , writePlainFile = function (options, sourceBuild, out, callback) {
      var file = defaultOutputFile
      sourceBuild.asString({ type: 'plain' }, writeFile.bind(null, file, callback))
    }

  , writeMinifiedFile = function (options, sourceBuild, out, callback) {
      var file = defaultMinifiedOutputFile
      sourceBuild.asString({ type: 'minified' }, writeFile.bind(null, file, callback))
    }

  , write = function (options, sourceBuild, out, callback) {
      async.parallel([
          writePlainFile.bind(null, options, sourceBuild, out)
        , writeMinifiedFile.bind(null, options, sourceBuild, out)
      ], callback)
    }

module.exports.write = write
