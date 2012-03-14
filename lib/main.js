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
      try {
        var args = argsParse.parse(argv)
          , exe = args && require('./main-' + args.main)
          , out = args && require('./main-' + args.main + '-output').create(sysUtil, args.debug)

        if (exe && out) {
          out.welcome()
          exe.exec(args, out, complete.bind(null, out, callback))
        } // else err?
      } catch (ex) {
        complete(Output.create(sysUtil, argv.indexOf('--debug') != -1), callback, ex)
      }
    }

module.exports.exec = exec
