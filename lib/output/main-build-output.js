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


var extend         = require('util')._extend
  , MainInfoOutput = require('./main-info-output')

  , BuildOutput    = extend({

        buildInit: function (ids) {
          this.statusMsg('Installing packages: "' + ids.join(' ') + '"...')
        }

      , repositoryError: function (err) {
          MainInfoOutput.repositoryError.call(this, err, 'Something went wrong fetching packages')
        }

      , installedFromRepository: function (installed) {
          if (installed) this.log('Successfully finished installing packages')
          this.log('Assembling build...', false)
        }

      , finishedAssembly: function () {
          this.log()
          this.log()
        }

      , create: function (out, debug, quiet) {
          return Object.create(this).init(out, debug, quiet)
        }

    }, MainInfoOutput) // inherit from MainInfoOutput

module.exports = BuildOutput