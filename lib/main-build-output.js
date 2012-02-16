var extend = require('./util').extend
  , Output = require('./output')

  , BuildOutput = extend(Output, { // inherit from Output

        buildInit: function () {
          this.statusMsg('Installing packages from NPM...')
          this.log()
        }

      , repositoryError: function (err) {
          this.repositoryError(err, 'Something went wrong searching NPM')
        }

      , installedFromRepository: function (installed, tree, pretty) {
          this.log('Installed:')
          this.log(pretty)
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = BuildOutput
