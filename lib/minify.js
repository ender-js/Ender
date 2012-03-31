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

var uglifyParser = require('uglify-js').parser
  , uglifyMangler = require('uglify-js').uglify
  , MinifyError = require('./errors').MinifyError

  , minify = function (source, callback) {
      var comments = []
        , token = '"Ender: preserved comment block"'
        , reMultiComments = /\/\*![\s\S]*?\*\//g
          // we add a comma because uglify does too
        , reTokens = RegExp(token + ',?', 'g')

      source = source.replace(reMultiComments, function(comment) {
        comments.push(comment)
        return ';' + token + ';'
      })

      try {
        source =
          uglifyMangler.gen_code(
            uglifyMangler.ast_squeeze(
              uglifyMangler.ast_mangle(
                uglifyParser.parse(source))))

        source = source.replace(reTokens, function(s, i) {
          return (i ? '\n' : '') + comments.shift() + '\n'
        })

        callback(null, source)
      } catch (ex) {
        callback(new MinifyError(ex))
      }
    }

module.exports.minify = minify