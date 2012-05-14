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
 * Utility functions for source-package.js
 */

var fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , glob            = require('glob')
  , packageUtil     = require('./package-util')
  , FilesystemError = require('./errors').FilesystemError

  , collectFiles = function (root, files, callback) {
      async.map(
          files
        , function (file, callback) {
            // use glob.Glob because it's easier to stub for tests
            new glob.Glob(file, { cwd: root, root: root, nomount: true }, function (err, files) {
              if (err) return callback(new FilesystemError(err))
              files.sort()
              callback(null, files)
            })
          }
        , function (err, files) {
            if (err) return callback(err)
            // flatten files array
            files = files.reduce(function (p, c) { return p.concat(c) }, [])
            callback(null, files)
          }
      )
    }

    // utility to read multiple files in order and append them
  , loadFiles = function (files, callback) {
      if (!Array.isArray(files)) files = [ files ]
      if (!files.length || (files.length == 1 && files[0] == 'noop')) return callback()
      var root = this.rootPath

      collectFiles(root, files, function (err, files) {
        // read each source file in parallel and assemble them together
        // in order, async.map() FTW!
        async.map(
            files
          , function (file, callback) {
              file = path.join(root, file).replace(/(\.js)?$/, '.js')
              fs.readFile(file, 'utf-8', function (err, contents) {
                if (err) return callback(new FilesystemError(err))
                callback(null, { file: file, contents: contents })
              })
            }
          , callback
        )
      })
    }

module.exports = {
    loadFiles: loadFiles
}