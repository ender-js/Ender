var sysUtil = require('util')
  , argsParse = require('./args-parse')
  , Output = require('./output')
  , EnderError = require('./errors').EnderError

  , complete = function (out, callback, err) {
      if (err) {
        if (err instanceof EnderError)
          out.enderError(err)
        else
          out.unknownError(err)
      }
      callback(err)
    }

  , exec = function (argv, callback) {
      var options, exe, out, parseType = 'parse'

      if (typeof argv == 'string') {
        // for API use: ender.exec('ender <cmd>', cb)
        argv = argv.split(/\s/).slice(1)
        parseType = 'parseClean'
      }

      try {
        options = argsParse[parseType](argv)
        exe = options && require('./main-' + options.main)
        out = options && require('./main-' + options.main + '-output').create(sysUtil, options.debug)

        if (exe && out) {
          out.welcome()
          exe.exec(options, out, complete.bind(null, out, callback))
        } // else err?
      } catch (ex) {
        var out = Output.create(sysUtil, argv.indexOf('--debug') != -1)
        out.welcome()
        complete(out, callback, ex)
      }
    }

module.exports.exec = exec