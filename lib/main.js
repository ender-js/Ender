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

process.title = 'Ender'

var argsParser = require('./args-parser')


    // public entry point can be used with a standard argv array or a string for API usage
  , exec = function (argv, log, callback) {
      var parseType = 'parse'
        , options

        , complete = function (err) {
            if (err && log) {
              var name = (err.name || 'Error').replace(/([a-z])([A-Z])/g, '$1 $2')

              log.error('{red}{bold}' + name + ': {/bold}' + err.message + '{/red}')

              if (options.debug) {
                log.error(err.stack)
                if (err.cause) log.error('Caused by:\n' + err.cause.stack)

              } else log.error('Run with --debug to see more information')
            }

            callback(err)
          }

      if (arguments.length < 3) {
        callback = log
        log = undefined
      }

      if (typeof argv == 'string') {
        // for API use: ender.exec('ender <cmd>', cb)
        argv = argv.split(/\s/).slice(1)
        parseType = 'parseClean' // parseClean knows there aren't 2 preceding tokens
      }

      try {
        options = argsParser[parseType](argv)
        require('./commands/' + options.command).exec(options, log, complete)
      } catch (ex) {
        options = options || { debug: argv.indexOf('--debug') != -1 }
        complete(ex)
      }
    }

module.exports.exec = exec
