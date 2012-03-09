var extend = require('./util').extend
  , Output = require('./output')

  , InfoOutput = extend(Output, { // inherit from Output

        buildInfo: function (filename, options, packages, compressSize) {
          this.log('Your current build type is ' + ('"' + options.main + '"').yellow)
          console.log(options,packages,compressSize)
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }
    })

module.exports = InfoOutput