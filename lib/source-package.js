var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , packageUtil = require('./package-util')

  , SourcePackage = {
        loadMainSourceAsString: function (callback) {
          var root = packageUtil.getPackageRoot(this.parents, this.packageName)
            , main = this.packageJSON.main

          if (!main)
            callback()

          if (!Array.isArray(main))
            main = [ main ]

          // read each main source file in parallel and assemble them together
          // in order, async.map() FTW!
          async.map(
              main
            , function (main, callback) {
                main = path.join(root, main)

                if (!/\.js$/.test(main))
                  main += '.js'

                fs.readFile(main, 'utf-8', callback)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)
                this.mainSource = sources.join('\n\n')
                callback()
              }.bind(this)
          )
        }

      , asString: function (callback) {
          this.loadMainSourceAsString(function (err) {
            if (err)
              return callback(err)
            callback(null, this.mainSource)
          }.bind(this))
        }
    }

module.exports.create = function (parents, packageName, packageJSON) {
  var sourcePackage = Object.create(SourcePackage)
  sourcePackage.packageName = packageName
  sourcePackage.parents = parents
  sourcePackage.packageJSON = packageJSON
  return sourcePackage
}
