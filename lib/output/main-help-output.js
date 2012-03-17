var extend = require('../util').extend
  , Output = require('./output')

  , HelpOutput = extend(Output, { // inherit from Output

        noSuchCommand: function (command) {
          this.log('No such command: ' + (command || '').yellow)
          this.log('Use ' + 'ender help'.cyan + ' to show a summary of basic commands')
        }

      , showDocument: function (doc) {
          this.log(doc)
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = HelpOutput
