var argsParse = require('./args-parse')

  , complete = function (err) {
      if (err) {
        console.log("ERROR", err)
        console.log(err.stack)
      }
    }

  , exec = function (argv) {
      var args = argsParse.parse(argv)
        , exe = args && require('./main-' + args.main)
        , out = args && require('./main-' + args.main + '-output').create(require('util'))

      if (exe && out) {
        out.welcome()
        exe.exec(args, out, complete)
      } // else err?
    }

module.exports.exec = exec
