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

    init: function (out, isDebug) {
      this.out = out // an object with a 'print' method, like `require('util')`
      this.isDebug = isDebug
      return this
    }

  , print: function (string) {
      this.out && this.out.print(string)
    }

    // generic method, like console.log, should avoid in favour of more specific 'views'
  , log: function (string) {
      if (typeof string != 'undefined')
        this.print(string)
      this.print('\n')
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

  , repositoryError: function (err, msg) {
      this.log(msg.red)
    }

  , repositoryLoadError: function (err) {
      this.repositoryError(err, 'Something went wrong trying to load NPM!')
    }

  , heading: function (string, meta) {
      this.log(string.yellow + (meta ? (' (' + meta + ')').grey : ''))
      this.log(string.replace(/./g, '-'))
    }

  , welcome: function () {
      this.log("Welcome to ENDER - The open module JavaScript framework".red)
      this.log("-------------------------------------------------------")
    }

  , enderError: function (err) {
      this.log('Error: '.red.bold + err.message.red)
      if (this.isDebug)
        this.log(err.stack)
    }

  , unknownError: function (err) {
      this.enderError(err)
      if (!this.isDebug)
        this.log('Run with --debug to see more information')
    }

  , create: function (out, debug) {
      return Object.create(this).init(out, debug)
    }

}

module.exports = Output