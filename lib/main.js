/******************************************************************************
 * Main entry point for both executable and API usage of Ender. Performs five
 * basic functions:
 *   1) parses command line or API arguments
 *   2) finds the main executable module for the given command
 *   3) finds the associated output (console) module for the given command
 *   4) executes the module
 *   5) handles any errors, via a generic output module if needed
 */

var sysUtil = require('util')
  , argsParse = require('./args-parse')
  , Output = require('./output/output')
  , EnderError = require('./errors').EnderError

    // basic error handler, differentiates between 'known' EnderErrors and everything else
  , complete = function (out, callback, err) {
      if (err) {
        if (err instanceof EnderError)
          out.enderError(err)
        else
          out.unknownError(err)
      }
      callback(err)
    }

    // public entry point can be used with a standard argv array or a string for API usage
  , exec = function (argv, callback) {
      var options, exe, out, parseType = 'parse'

      if (typeof argv == 'string') {
        // for API use: ender.exec('ender <cmd>', cb)
        argv = argv.split(/\s/).slice(1)
        parseType = 'parseClean' // parseClean knows there aren't 2 preceeding tokens
      }

      try {
        options = argsParse[parseType](argv)

        // get the module to execute and it's partner output module
        exe = options && require('./main-' + options.main)
        out = options && require('./output/main-' + options.main + '-output').create(sysUtil, options.debug)

        if (exe && out) {
          out.welcome()
          exe.exec(options, out, complete.bind(null, out, callback))
        } // else err? argsParse should take care of this if it's list of mains corresponds to the modules we have
      } catch (ex) {
        // create a generic/base 'out' module which can do the error printing
        var out = Output.create(sysUtil, argv.indexOf('--debug') != -1)
        out.welcome()
        complete(out, callback, ex)
      }
    }

module.exports.exec = exec