/******************************************************************************
 * The SourcePackage object, each instance is associated with an npm package.
 * The object uses the package.json and commandline options to figure out how
 * to assemble an output via the asString() method.
 * Internally we use EJS templates to augment the source to provide an Ender-
 * compatible output (the less screwing with strings here the better).
 */

var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , packageUtil = require('./package-util')
  , template = require('./template')

  , templateFiles = {
        'standard': '../resources/source-package.ejs'
      , 'ender-js': '../resources/ender-js-package.ejs' // a special template for the root package
    }

    // pass the source through
  , generateSource = function (type, data, callback) {
      if (!templateFiles[type])
        type = 'standard'
      template.generateSource('source-package.' + type, templateFiles[type], data, callback)
    }

  , indent = function (str) {
      return str.replace(/^(?!\s*$)/gm, '  ')
    }

  , SourcePackage = {
        init: function (packageName, parents, packageJSON, options) {
          // keep track of current status so we don't double-up callbacks, since asString()
          // is called for both the plain and minified output
          this._asStringCallbacks = []
          this._status = 'new'
          this.packageName = packageName
          this.parents = parents
          this.packageJSON = packageJSON
          this.options = options
          return this
        }

      , getIdentifier: function () {
          return this.packageJSON.name + '@' + this.packageJSON.version
        }

      , fireCallbacks: function (err, data) {
          return this._asStringCallbacks.forEach(function (callback) {
            callback(err, data)
          })
        }

        // utility to read multiple files in order and append them
      , loadFilesAsString: function (root, files, callback) {
          if (!Array.isArray(files))
            files = [ files ]

          if (!files.length || (files.length == 1 && files[0] == 'noop'))
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

        // generate an object that can be fed to the templates
      , makeTemplateData: function (sources) {
          return {
              packageName: this.packageJSON.name
            , options: {
                  noop: this.options.noop
                , sandbox:
                      // if this package is in the `--sandbox <packages>` list, or, if we are
                      // an ender-js package and a --sandbox option is passed, then set this to true
                      Array.isArray(this.options.sandbox) && (
                           this.options.sandbox.indexOf(this.packageJSON.name) != -1
                        || this.packageJSON.name == 'ender-js')
              }
              // these objects have lazy methods so we don't do unnecessary indent()ing if need be
            , mainSource: sources.main && {
                  raw: function () { return sources.main }
                , indented: function () { return indent(sources.main) }
              }
            , enderSource: sources.ender && {
                  raw: function () { return sources.ender }
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