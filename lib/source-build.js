var async = require('async')

  , SourceBuild = {
        init: function (options) {
          this.options = options
          this.packages = []
          return this
        }

      , addPackage: function (srcPackage) {
          this.packages.push(srcPackage)
        }

      , asString: function (callback) {
          async.map(
              this.packages
            , function (srcPackage, callback) {
                srcPackage.asString(callback)
              }
            , function (err, sources) {
                callback(err, sources && sources.join('\n\n'))
              }
          )

        }
    }

module.exports.create = function (options) {
  return Object.create(SourceBuild).init(options)
}
