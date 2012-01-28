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
      if (this.isDebug)
        throw err

      this.log(msg.red)
    }

  , repositoryLoadError: function (err) {
      this.repositoryError(err, 'Something went wrong trying to load NPM!')
    }

  , heading: function (string, meta) {
      this.log(string.yellow + (meta ? (' (' + meta + ')').grey : ''))
      this.log(string.replace(/./g, '-'))
    }

  , create: function () {
      return Object.create(this)
    }

}

module.exports = Output
