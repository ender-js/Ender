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
 * Utility functions for the main-info module.
 */

var zlib            = require('zlib')
  , fs              = require('fs')
  , async           = require('async')
  , minify          = require('./minify')
  , SourceBuild     = require('./source-build')
  , FilesystemError = require('./errors').FilesystemError

    // given a filename, return the 'raw', 'minified' and 'gzipped' sizes
  , sizes = function (options, filename, callback) {
      var sizes = {}
        , jobs  = []
          // make a function that async.waterfall() can use
        , mkcb  = function (prop, callback, errType) {
            return function (err, data) {
              if (err) return callback(errType ? new errType(err) : err)
              sizes[prop] = data.length
              callback(null, data)
            }
          }

      jobs.push(function (callback) {
          fs.readFile(filename, 'utf-8', mkcb('raw', callback, FilesystemError))
      })

      if (options.minifier != 'none') {
        jobs.push(function (data, callback) {
          minify.minify(options, data, mkcb('minify', callback))
        })
        jobs.push(function (data, callback) {
          zlib.gzip(data, mkcb('gzip', callback))
        })
      }

      // note we have to use waterfall cause each one depends on the data of the previous
      async.waterfall(
          jobs
        , function (err) {
            err ? callback(err) : callback(null, sizes)
          }
      )
    }

    // a simple interface to SourceBuild.parseContext()
  , parseContext = function (filename, callback) {
      SourceBuild.parseContext(filename, function (err, options, packages) {
        if (err) return callback(err) // err wrapped in SourceBuild.parseContext()
        callback(null, {
            options  : options
          , packages : packages
        })
      })
    }

module.exports = {
    sizes          : sizes
  , parseContext   : parseContext
}