var argsParse = require('./args-parse')

  , exec = function (argv) {
      var args = argsParse.parse(argv)
        , exe = args && require('./main-' + args.main)
        , out = args && require('./main-' + args.main + '-output').create(require('util'))

      if (exe)
        exe.exec(args, out)
    }

module.exports.exec = exec
