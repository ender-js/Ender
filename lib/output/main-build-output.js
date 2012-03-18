var extend = require('../util').extend
  , MainInfoOutput = require('./main-info-output')

  , BuildOutput = extend(MainInfoOutput, { // inherit from MainInfoOutput

        buildInit: function (packages) {
          this.statusMsg('Installing packages from npm: "' + packages.join(' ') + '"...')
        }

      , repositoryError: function (err) {
          MainInfoOutput.repositoryError.call(this, err, 'Something went wrong fetching from npm')
        }

      , installedFromRepository: function (installed, tree, pretty) {
          this.log('Successfully finished installing packages')
          this.print('Assembling build...')
          /*
          if (pretty) {
            this.log('Installed:')
            this.log(pretty.replace(/^/mg, '  '))
          }
          */
        }

      , finishedAssembly: function () {
          this.print('\n\n')
        }

      , create: function (out, debug) {
          return Object.create(this).init(out, debug)
        }

    })

module.exports = BuildOutput