var extend = require('../util').extend
  , BuildOutput = require('./main-build-output')

  , RemoveOutput = extend(BuildOutput, { // inherit from BuildOutput

        create: function (out, debug) {
          return Object.create(this).init(out, debug)
        }

    })

module.exports = RemoveOutput