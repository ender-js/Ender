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
 * 'Version' executable module, for `ender version` or `ender -v`, just read
 * the package.json and print the current version.
 */

var fs              = require('fs')
  , path            = require('path')

  , JSONParseError  = require('../errors').JSONParseError
  , FilesystemError = require('../errors').FilesystemError


  , exec = function (options, log, callback) {
      var file = path.resolve(__dirname, '..', '..', 'package.json')

      if (arguments.length < 3) {
        callback = log
        log = undefined
      }

      if (!log) return callback()

      fs.readFile(file, 'utf-8', function (err, data) {
        if (err) return callback(new FilesystemError(err))
        try {
          data = JSON.parse(data)
        } catch (err) {
          return callback(new JSONParseError(err.message + ' [' + file + ']', err))
        }

        log.info('Active version: v' + data.version)
        callback()
      })
    }

module.exports.exec = exec
