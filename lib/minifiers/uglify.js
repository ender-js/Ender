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

const UglifyJS    = require('uglify-js')

    , MinifyError = require('../errors').MinifyError


var minify = function (files, filenames, options, callback) {
      try {
        var ast = UglifyJS.parse(files.build, { filename: filenames.build })
          , sourceMap = UglifyJS.SourceMap({ file: filenames.minifiedBuild, orig: files.sourceMap })
          , compressor = UglifyJS.Compressor()
          , minifiedBuild

        // Supress warnings (mainly to prevent extraneous SourceMap warnings)
        UglifyJS.AST_Node.warn_function = null

        ast.figure_out_scope()
        ast = ast.transform(compressor)
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()

        files.minifiedBuild = ast.print_to_string({
            source_map: sourceMap
          , comments: function (node, comment) {
              return comment.type == "comment2" && /^!|@preserve|@license|@cc_on/i.test(comment.value)
            }
        })

        files.minifiedSourceMap = sourceMap.toString()
        callback(null, files)

      } catch (ex) {
        var err = new MinifyError('Uglify error')
        err.cause = ex
        return callback(err)
      }
  }

module.exports = minify
