//internal get methods for ender
var fs = require('fs')
  , path = require('path')
  , ENDER = { get: module.exports }

module.exports = {

    special: function (options) {
      return options.sans || options.noop ? [] : ['ender-js'];
    }

  , buildHistory: function (file, callback) {
      file = file || 'ender'
      file = file += '.js'

      path.exists(file, function (exists) {
        if (exists) {
          returnBuildHistory(file)
        } else if(/\.min\.js$/.test(file)) {
          console.log('Active Ender library couldn\'t be found.')
          callback(new Error)
        }
      })

      function returnBuildHistory(file) {
        fs.readFile(file, 'utf-8', function (err, data) {
          if (err) {
            callback(err)
            return console.log('something went wrong trying to read' + file + '.js')
          }
          callback(null, data.match(/\*\sBuild:\s([^\n]*)/)[1])
        })
      }
    }
}