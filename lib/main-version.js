/******************************************************************************
 * 'Version' executable module, for `ender version` or `ender -v`, just read
 * the package.json and print the current version.
 */

var fs = require('fs')
  , path = require('path')

  , exec = function (args, out, callback) {
      fs.readFile(path.resolve(__dirname, '../package.json'), 'utf-8', function (err, data) {
        if (err)
          return callback(err)
        out.version(JSON.parse(data).version)
        callback()
      })
    }

module.exports.exec = exec
