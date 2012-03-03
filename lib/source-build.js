var async = require('async')
  , minify = require('./minify')
  , template = require('./template')
  , argsParse = require('./args-parse')

  , templateFile = '../resources/build.handlebars'

  , SourceBuild = {
        init: function (options) {
          this.options = options
          this.packages = []
          return this
        }

      , addPackage: function (srcPackage) {
          this.packages.push(srcPackage)
        }

      , asString: function (options, callback) {
          //options.type == plain||minified
          var finish = function (sources) {
            var data = {
                    source: sources.join('\n\n')
                  , context: argsParse.toContextString(this.options)
                  , sandbox: !!this.options.sandbox
                  , packages: this.packages.map(function (p) {
                      return p.getIdentifier()
                    }).join(' ')
                }
            template.generateSource('source-build', templateFile, data, function (err, source) {
              if (err)
                return callback(err)
              if (options.type === 'minified')
                minify.minify(source, callback)
              else
                callback(null, source)
            })
          }.bind(this)

          async.map(
              this.packages
            , function (srcPackage, callback) {
                srcPackage.asString(callback)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)
                finish(sources)
              }
          )
        }
    }

module.exports.create = function (options) {
  return Object.create(SourceBuild).init(options)
}
