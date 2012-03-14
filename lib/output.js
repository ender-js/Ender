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
      this.log(string.grey)
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

  , create: function (outfd, debug) {
      return Object.create(this).init(outfd, debug)
    }

}

module.exports = Output
