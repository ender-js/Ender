var extend = require('./util').extend
  , Output = require('./output')

  , BuildOutput = extend(Output, { // inherit from Output

        buildInit: function (packages) {
          this.statusMsg('Installing packages from NPM: "' + packages.join(' ') + '"...')
          this.log()
        }

      , repositoryError: function (err) {
          Output.repositoryError.call(this, err, 'Something went wrong fetching from NPM')
        }

      , installedFromRepository: function (installed, tree, pretty) {
          if (pretty) {
            this.log('Installed:')
            this.log(pretty.replace(/^/mg, '  '))
          }
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = BuildOutput
