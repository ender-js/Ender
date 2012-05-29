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
 * All console `output` modules inhert from this Output object. Each session
 * needs an Output object to print stuff to stdout, this root object contains
 * the basic common functionality while the others implement functionality
 * specific to their `main` functions.
 * We don't use `console` but rather we expect to be passed an `out` object
 * in Output.create() that just needs to have a `print()` method. Normally
 * this is the standard Node 'util' package but it could be anything!
 */

var colors = require('colors')

  , Output = {

    init: function (out, isDebug, isQuiet) {
      this.out     = out // an object with a 'print' method, like `require('util')`
      this.isDebug = isDebug
      this.isQuiet = isQuiet
      return this
    }

  , print: function (string) {
      this.out && this.out.print(string)
    }

    // generic method, like console.log, should avoid in favour of more specific 'views'
  , log: function (string, newline) {
      if (this.isQuiet) return
      if (typeof string != 'undefined') this.print(string)
      if (newline || typeof newline == 'undefined') this.print('\n')
    }

  , debug: function (string) {
      this.isDebug && this.print('DEBUG: ' + String(string) + '\n')
    }

  , statusMsg: function (string) {
      this.log(string)
    }

  , warnMsg: function (string) {
      this.log(string.grey)
    }

  , heading: function (string, meta) {
      this.log(string.yellow + (meta ? (' (' + meta + ')').grey : ''))
      this.underline(string)
    }

  , underline: function (s) {
      this.log(s.replace(/./g, '-'))
    }

  , error: function (err) {
      var name = (err.name || 'Error').replace(/([a-z])([A-Z])/g, '$1 $2')
      this.log((name + ': ').red.bold + err.message.red)
      if (this.isDebug) {
        this.log(err.stack)
        if (err.cause) {
          this.log('Caused by:')
          this.log(err.cause.stack)
        }
      } else if (!this.isDebug)
        this.log('Run with --debug to see more information')
    }

  , create: function (out, debug, quiet) {
      return Object.create(this).init(out, debug, quiet)
    }

}

module.exports = Output