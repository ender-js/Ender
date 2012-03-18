/******************************************************************************
 * A simple utility to write out the source files, both plain and minified.
 * The source comes from a SourceBuild object which has an asString() method
 * to pull together the component parts.
 */

var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , util = require('./util')

  , writeFile = function (file, callback, err, data) {
      if (err)
        return callback(err)
      fs.writeFile(file, data, 'utf-8', callback)
    }

  , writePlainFile = function (options, sourceBuild, out, callback) {
      var filename = util.getOutputFilenameFromOptions(options)
      sourceBuild.asString({ type: 'plain' }, writeFile.bind(null, filename, callback))
    }

  , writeMinifiedFile = function (options, sourceBuild, out, callback) {
      var filename = util.getOutputFilenameFromOptions(options).replace(/(\.min)?\.js/, '.min.js')
      sourceBuild.asString({ type: 'minified' }, writeFile.bind(null, filename, callback))
    }

  , write = function (options, sourceBuild, out, callback) {
      async.parallel([
          writePlainFile.bind(null, options, sourceBuild, out)
        , writeMinifiedFile.bind(null, options, sourceBuild, out)
      ], callback)
    }

module.exports.write = write
