var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , handlebars = require('handlebars')
  , packageUtil = require('./package-util')

  , templateFiles = {
        'standard': '../resources/source-package.handlebars'
      , 'ender-js': '../resources/ender-js-package.handlebars'
    }
  , templates = {}

  , generateSource = function (type, data, callback) {
      if (!templateFiles[type])
        type = 'standard'
      if (!templates[type]) {
        fs.readFile(path.resolve(__dirname, templateFiles[type]), 'utf-8', function (err, templateContents) {
          if (err)
            return callback(err)

          // allow our templates to be human-readable but not leave unnecessary
          // whitespace when being used
          templateContents = templateContents
            .replace(/^\s*\{\{/gm, '{{')
            .replace(/\s*\\\n/g, '')
          templates[type] = handlebars.compile(templateContents)
          callback(null, templates[type](data))
        })
      } else
        callback(null, templates[type](data))
    }

  , indent = function (str) {
      return str.replace(/^(?!\s*$)/gm, '  ')
    }

  , SourcePackage = {
        init: function (packageName, parents, packageJSON, options) {
          this._asStringCallbacks = []
          this._status = 'new'
          this.packageName = packageName
          this.parents = parents
          this.packageJSON = packageJSON
          this.options = options
          return this
        }

      , fireCallbacks: function (err, data) {
          return this._asStringCallbacks.forEach(function (callback) {
            callback(err, data)
          })
        }

      , loadFilesAsString: function (root, files, callback) {
          if (!Array.isArray(files))
            files = [ files ]

          if (!files.length)
            return callback()

          // read each source file in parallel and assemble them together
          // in order, async.map() FTW!
          async.map(
              files
            , function (file, callback) {
                file = path.join(root, file).replace(/(\.js)?$/, '.js')
                fs.readFile(file, 'utf-8', callback)
              }
            , function (err, sources) {
                callback(err, sources && sources.join('\n\n'))
              }
          )
        }

      , makeTemplateData: function (sources) {
          return {
              packageName: this.packageJSON.name
            , options: this.options
            , mainSource: sources.main && {
                  toString: function () { return sources.main }
                , indented: function () { return indent(sources.main) }
              }
            , enderSource: sources.ender && {
                  toString: function () { return sources.ender }
                , indented: function () { return indent(sources.ender) }
              }
          }
        }

        // this method supports multiple calls but a single execution, hence the _status cruft
      , asString: function (callback) {
          if (this._status == 'generated')
            return callback(null, this._stringContent)
          this._asStringCallbacks.push(callback)
          if (this._status == 'generating')
            return
          this._status = 'generating'

          // note that "main" and "ender" are processed in the same way so they can both be just
          // a string pointing to a source file or an array of source files that are concatenated
          // or be left unspecified
          var root = packageUtil.getPackageRoot(this.parents, this.packageName)
            , packageName = this.packageJSON.name
            , mainSources = this.packageJSON.main || []
            , enderBridgeSources = this.packageJSON.ender || []

            , handleSourceData = function (err, sources) {
                if (err)
                  return this.fireCallbacks(err)

                generateSource(
                    packageName
                  , this.makeTemplateData(sources)
                  , function (err, source) {
                      this._status = 'generated'
                      this._stringContent = source
                      this.fireCallbacks(err, source)
                    }.bind(this)
                )
              }.bind(this)

            , sourceLoaders = {
                  main: this.loadFilesAsString.bind(this, root, mainSources)
                , ender: this.loadFilesAsString.bind(this, root, enderBridgeSources)
              }

          async.parallel(sourceLoaders, handleSourceData)
        }
    }

module.exports.create = function (parents, packageName, packageJSON, options) {
  return Object.create(SourcePackage).init(packageName, parents, packageJSON, options)
}
