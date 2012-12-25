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
 * An interface to UglifyJS. Preserves copyright comments, which UglifyJS
 * currently doesn't do: https://github.com/mishoo/UglifyJS/issues/85
 */

var enderMinify   = require('ender-minify')
  , MinifyError   = require('./errors').MinifyError

  , minify = function (options, source, callback) {
      var minifier = enderMinify.minifiers.indexOf(options.minifier) > -1 ? options.minifier : 'uglify'
        , minifyOptions  = {}

      if (minifier == 'closure') {
        if (enderMinify.closureLevels.indexOf(options.level) > -1) {
          minifyOptions.level = options.level
        }
        if (Array.isArray(options.externs)) {
          minifyOptions.externs = options.externs
        }
      }

      enderMinify(minifier, source, minifyOptions, function (err, minifiedSource) {
        if (err) return callback(new MinifyError(err))

        callback(null, minifiedSource)
      })
    }

module.exports.minify = minify