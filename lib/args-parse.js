function UnknownMainError (message) {
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
    this.message = message
    this.name = 'UnknownMainError'
}
UnknownMainError.prototype.__proto__ = Error.prototype

var nopt = require('nopt')

  , knownOptions = {
        'output':   String
      , 'use':      String
      , 'max':      Number
      , 'sandbox':  Array
      , 'noop':     Boolean
      , 'silent':   Boolean
      , 'help':     Boolean
      , 'sans':     Boolean
      , 'debug':    Boolean
    }

  , shorthandOptions = {
        'o': 'output'
      , 'u': 'use'
      , 'x': 'noop'
      , 's': 'silent'
    }

  , knownMains = [ 'help', 'build', 'refresh', 'info', 'search', 'compile' ]

  , parse = function (argv) {
      var parsed = nopt(knownOptions, shorthandOptions, argv)
        , main = parsed.argv.remain[0]
        , remaining = parsed.argv.remain.slice(1)

      if (knownMains.indexOf(main) == -1)
        throw new UnknownMainError('Unknown main command "' + main + '"')

      return {
          main: main
        , remaining: remaining
        , options: parsed
      }
    }

module.exports.parse = parse
