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

var fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , hogan           = require('hogan.js')
  , FilesystemError = require('./errors').FilesystemError
  , templateCache   = {}

    // async.memoize lets us read each file once only, no matter how many calls before & after the file is read
  , readTemplate = async.memoize(function (file, callback) {
      fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
        if (err) return callback(new FilesystemError(err))
        callback(null, templateContents)
      })
    })

  , generateSource = function (file, data, callback) {
      readTemplate(file, function (err, templateContents) {
        if (err) return callback(err) // wrapped above
        var tmpl = templateCache[file] || (templateCache[file] = hogan.compile(templateContents))
        callback(null, tmpl.render(data))
      })
    }

module.exports.generateSource = generateSource