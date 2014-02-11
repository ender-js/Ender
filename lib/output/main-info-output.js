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


var archy      = require('archy')
  , colors     = require('colors')
  , argsParser = require('ender-args-parser')
  , extend     = require('util')._extend
  , toKb       = require('../util').toKb
  , Output     = require('./output')

  , InfoOutput = extend({

        buildInfo: function (filename, options, sizes, archyTree) {
          //this.log('Your current build type is ' + ('"' + options.main + '"').yellow)
          this.log('Your current build command is: ' + ('ender ' + argsParser.toContextString(options)).yellow)
          this.log(
              'Your current build size is: '
            + toKb(sizes.build).yellow + ' raw'
            + (sizes.minifiedBuild
                ? ', ' + toKb(sizes.minifiedBuild).yellow + ' minified and '
                       + toKb(sizes.gzippedMinifiedBuild).yellow + ' gzipped'
                : ''
              )

          )
          this.log()
          this.log(archyTree)
        }

      , create: function (out, debug, quiet) {
          return Object.create(this).init(out, debug, quiet)
        }

    }, Output) // inherit from Output

module.exports = InfoOutput