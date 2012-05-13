/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/******************************************************************************
 * A simple utility to write out the source files, both plain and minified.
 * The source comes from a SourceBuild object which has an asString() method
 * to pull together the component parts.
 */

var fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , util            = require('./util')
  , FilesystemError = require('./errors').FilesystemError
  , SourceMap       = require('./sourcemap')

  , writeFile = function (file, data, callback) {
      fs.writeFile(file, data, 'utf-8', function (err) {
        if (err) return callback(new FilesystemError(err))
        callback.apply(null, arguments)
      })
    }

  , write = function (options, sourceBuild, out, callback) {
      var plainFilename = util.getOutputFilenameFromOptions(options), sourceMap
	  var mapFilename = plainFilename.replace(/(\.min)?\.js/, '.map.js')
      // These can't really be separate since now the write stages depend on one-another
      async.parallel({
        plainSource: sourceBuild.asString.bind(null, {type: 'plain'})
      , miniSource: function (callback) {
          sourceBuild.asString({type: 'minified'}, function (err, minified, map) { // Is there a better way to get the source map from the minifier?
            sourceMap = map
            callback(err, minified)
          })
        }
      , sources: sourceBuild.sources
      }, function (err, results) {
          sourceMap = SourceMap.buildSourceMap(options, results.plainSource, results.sources, sourceMap)
          var miniSource = results.miniSource + '//@ sourceMappingURL=' + mapFilename; // We might want an option for this too

          async.parallel([
            writeFile.bind(null, plainFilename, results.plainSource)
          , writeFile.bind(null, plainFilename.replace(/(\.min)?\.js/, '.min.js'), miniSource)
          , writeFile.bind(null, mapFilename, sourceMap)
          ], callback)
      })
    }

module.exports.write = write