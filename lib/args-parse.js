function UnknownMainError (message) {
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
    this.message = message
    this.name = 'UnknownMainError'
}
UnknownMainError.prototype.__proto__ = Error.prototype

function UnknownOptionError (message) {
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
    this.message = message
    this.name = 'UnknownOptionError'
}
UnknownOptionError.prototype.__proto__ = Error.prototype

var defaultArray

  , options = (function () {
      var arr = []
        , add = function (name, short, type, altMain) {
            if (typeof short != 'string') {
              altMain = type
              type = short
              short = null
            }
            var o = {
                name: name
              , short: short
              , type: type
              , altMain: altMain
            }
            if (short === '' && type === Array)
              defaultArray = name
            arr.push(o)
          }

      add('packages' , ''  , Array)
      add('output'   , 'o' , String)
      add('use'      , 'u' , String)
      add('max'            , Number)
      add('sandbox'        , Array)
      add('noop'     , 'x' , Boolean)
      add('silent'   , 's' , Boolean)
      add('help'     , 'h' , Boolean, true)
      add('sans'           , Boolean)
      add('debug'          , Boolean)
      add('version'  , 'v' , Boolean, true)

      return arr
    }())

  , mains = [ 'help', 'build', 'refresh', 'info', 'search', 'compile', 'version', 'help' ]

  , findOption = function (s) {
      var i, option, match = s.match(/^(--?)(\w+)$/)
      if (!match)
        return
      for (i = 0; i < options.length; i++) {
        option = options[i]
        if (
                (match[1] === '--' && match[2] === option.name)
             || (match[1] === '-' && option.short && match[2] === option.short))
          return option
      }
      throw new UnknownOptionError('Unknown option "' + s + '"')
    }

  , toContextString = function (options) {
      var str = options.main
        , p
      if (options.packages.length)
        str += ' ' + options.packages.join(' ')
      for (p in options) {
        if (p === 'packages' || p === 'main')
          continue
        str += ' --' + p
        if (Array.isArray(options[p]))
          str += ' ' + options[p].join(' ')
        else if (typeof options[p] !== 'boolean')
          str += ' ' + options[p]
      }
      return str
    }

  , parse = function (argv, slice) {
      var args = Array.prototype.slice.call(argv, slice)
        , options = {}
        , currentArray = defaultArray
        , arg, o

      options[currentArray] = []
      while (arg = args.shift()) {
        o = findOption(arg)
        if (o) {
          currentArray = defaultArray
          if (o.type === Boolean) {
            options[o.name] = true
            if (o.altMain && !options.main)
              options.main = o.name
          } else if ((o.type === String || o.type === Number) && args.length)
            options[o.name] = o.type(args.shift())
          else if (o.type === Array)
            options[currentArray = o.name] = []
        } else if (!options.main) {
          options.main = arg
        } else
          options[currentArray].push(arg)
      }

      if (!options.main)
        throw new UnknownMainError('No main command supplied')
      if (mains.indexOf(options.main) == -1)
        throw new UnknownMainError('Unknown main command "' + options.main + '"')
      return options
    }

module.exports = {
    parse: function (argv) { // with 2 additional args 'node script.js'
      return parse(argv, 2)
    }
  , parseClean: function (argv) { // without
      return parse(argv, 0)
    }
  , toContextString: toContextString
}
