var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , handlebars = require('handlebars')
  , packageUtil = require('./package-util')

  , templateFile = '../resources/source-package.handlebars'

  , template = null

  , generateSource = function (data, callback) {
      if (!template) {
        fs.readFile(path.resolve(__dirname, templateFile), 'utf-8', function (err, templateContents) {
          if (err)
            return callback(err)

          template = handlebars.compile(templateContents)
          callback(null, template(data))
        })
      } else
        callback(null, template(data))
    }

  , indent = function (str) {
      return str.replace(/^(?!\s*$)/gm, '  ')
    }

  , SourcePackage = {
        loadFilesAsString: function (root, files, callback) {
          if (!Array.isArray(files))
            files = [ files ]

          if (!files.length)
            return callback()

          // read each source file in parallel and assemble them together
          // in order, async.map() FTW!
          async.map(
              files
            , function (file, callback) {
                file = path.join(root, file)

                if (!/\.js$/.test(file))
                  file += '.js'

                fs.readFile(file, 'utf-8', callback)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)
                callback(null, sources.join('\n\n'))
              }
          )
        }

      , asString: function (callback) {
          // note that "main" and "ender" are processed in the same way so they can both be just
          // a string pointing to a source file or an array of source files that are concatenated
          // or be left unspecified
          var root = packageUtil.getPackageRoot(this.parents, this.packageName)
            , packageName = this.packageJSON.name
            , mainSources = this.packageJSON.main || []
            , enderBridgeSources = this.packageJSON.ender || []

          async.parallel(
              {
                  main: this.loadFilesAsString.bind(this, root, mainSources)
                , ender: this.loadFilesAsString.bind(this, root, enderBridgeSources)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)

                generateSource({
                    mainSource: sources.main ? indent(sources.main) : null
                  , enderBridge: sources.ender ? indent(sources.ender) : null
                  , packageName: packageName
                }, callback)
              }
          )
        }
    }

module.exports.create = function (parents, packageName, packageJSON) {
  var sourcePackage = Object.create(SourcePackage)
  sourcePackage.packageName = packageName
  sourcePackage.parents = parents
  sourcePackage.packageJSON = packageJSON
  return sourcePackage
}
