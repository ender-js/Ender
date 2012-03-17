var extend = require('../util').extend
  , Output = require('./output')

  , VersionOutput = extend(Output, { // inherit from Output
        version: function (string) {
          this.log('Active version: v' + string)
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = VersionOutput
