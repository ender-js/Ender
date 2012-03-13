var extend = require('./util').extend
  , BuildOutput = require('./main-build-output')

  , RemoveOutput = extend(BuildOutput, { // inherit from BuildOutput

        create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = RemoveOutput