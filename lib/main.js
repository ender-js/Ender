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
 * Main entry point for both executable and API usage of Ender. Performs five
 * basic functions:
 *   1) parses command line or API arguments
 *   2) finds the main executable module for the given command
 *   3) finds the associated output (console) module for the given command
 *   4) executes the module
 *   5) handles any errors, via a generic output module if needed
 */

//FIXME: remove this after 0.8 available on travis
!('exists' in require('fs')) && (function () {
  require('fs').exists     = require('path').exists
  require('fs').existsSync = require('path').existsSync
}())

process.title = 'Ender'

var sysUtil    = require('util')
  , argsParser = require('ender-args-parser')
  , Output     = require('./output/output')

    // basic error handler, differentiates between 'known' EnderErrors and everything else
  , complete = function (out, callback, err) {
      if (err) out.error(err)
      callback(err)
    }

    // public entry point can be used with a standard argv array or a string for API usage
  , exec = function (argv, callback) {
      var parseType = 'parse'
        , options
        , exe
        , out

      if (typeof argv == 'string') {
        // for API use: ender.exec('ender <cmd>', cb)
        argv      = argv.split(/\s/).slice(1)
        parseType = 'parseClean' // parseClean knows there aren't 2 preceeding tokens
      }

      try {
        options = argsParser[parseType](argv)

        // get the module to execute and it's partner output module
        exe = options && require('./main-' + options.main)
        out = options && require('./output/main-' + options.main + '-output').create(sysUtil, options.debug, options.quiet)

        if (exe && out) {
          exe.exec(options, out, complete.bind(null, out, callback))
        } // else err? argsParser should take care of this if it's list of mains corresponds to the modules we have
      } catch (ex) {
        // create a generic/base 'out' module which can do the error printing
        out = Output.create(sysUtil, argv.indexOf('--debug') != -1)
        complete(out, callback, ex)
      }
    }

module.exports.exec = exec