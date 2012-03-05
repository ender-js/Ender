var extend = require('./util').extend
  , Output = require('./output')

  , BuildOutput = extend(Output, { // inherit from Output

        buildInit: function (packages) {
          this.statusMsg('Installing packages from NPM: "' + packages.join(' ') + '"...')
          this.log()
        }

      , repositoryError: function (err) {
          Output.repositoryError.call(this, err, 'Something went wrong searching NPM')
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
