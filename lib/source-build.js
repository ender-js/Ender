var async = require('async')
  , minify = require('./minify')

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
          async.map(
              this.packages
            , function (srcPackage, callback) {
                srcPackage.asString(callback)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)

                var source = sources.join('\n\n')
                if (options.type === 'minified')
                  minify.minify(source, callback)
                else
                  callback(null, source)
              }
          )
        }
    }

module.exports.create = function (options) {
  return Object.create(SourceBuild).init(options)
}
