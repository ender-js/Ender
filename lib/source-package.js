/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/******************************************************************************
 * The SourcePackage object, each instance is associated with an npm package.
 * The object uses the package.json and commandline options to figure out how
 * to assemble an output via the asString() method.
 * Internally we use EJS templates to augment the source to provide an Ender-
 * compatible output (the less screwing with strings here the better).
 */

var fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , template        = require('./template')
  , packageUtil     = require('./package-util')
  , FilesystemError = require('./errors').FilesystemError

  , templateFiles = {
        'standard' : '../resources/source-package.ejs'
      , 'ender-js' : '../resources/ender-js-package.ejs' // a special template for the root package
    }

    // pass the source through
  , generateSource = function (type, data, callback) {
      if (!templateFiles[type]) type = 'standard'
      template.generateSource(templateFiles[type], data, callback)
    }

  , indent = function (str) {
      // was this: return str.replace(/^(?!\s*$)/gm, '  ')
      // but in some odd cases ^ was matching other things and inserting '  ' in unhelpful places
      // unfortunately I can't easily replicate the problem to write a test for it!
      // one example is this line in the ender-json package:
      //   https://github.com/douglascrockford/JSON-js/blob/master/json2.js#L372
      // which starts with: // If the space parameter...
      // and gets converted to:   /  / If the space parameter
      return str.split('\n').map(function (line) {
        return (/^\s*$/).test(line) ? line : ('  ' + line)
      }).join('\n')
    }

  , SourcePackage = {
        init: function (packageName, parents, packageJSON, options) {
          this.parents     = parents
          this.options     = options
          this.packageName = packageName
          this.packageJSON = packageJSON

          // custom hasher function for async.memoize so we have a single key, default will use
          // first arg (callback) as hash key which won't work
          this.asString    = async.memoize(this.asString.bind(this), function () { return '_' })
          return this
        }

      , getIdentifier: function () {
          return this.packageJSON.name + '@' + this.packageJSON.version
        }

        // utility to read multiple files in order and append them
      , loadFilesAsString: function (root, files, callback) {
          if (!Array.isArray(files)) files = [ files ]
          if (!files.length || (files.length == 1 && files[0] == 'noop')) return callback()

          // read each source file in parallel and assemble them together
          // in order, async.map() FTW!
          async.map(
              files
            , function (file, callback) {
                file = path.join(root, file).replace(/(\.js)?$/, '.js')
                fs.readFile(file, 'utf-8', function (err) {
                  if (err) return callback(new FilesystemError(err))
                  callback.apply(null, arguments)
                })
              }
            , function (err, sources) {
                callback(err, sources && sources.join('\n\n'))
              }
          )
        }

        // generate an object that can be fed to the templates
      , makeTemplateData: function (sources) {
          return {
              packageName : this.packageJSON.name
            , options     : {
                  noop    : this.options.noop
                , sandbox :
                      // if this package is in the `--sandbox <packages>` list, or, if we are
                      // an ender-js package and a --sandbox option is passed, then set this to true
                      Array.isArray(this.options.sandbox) && (
                           this.options.sandbox.indexOf(this.packageJSON.name) != -1
                        || this.packageJSON.name == 'ender-js')
              }
              // these objects have lazy methods so we don't do unnecessary indent()ing
            , mainSource: sources.main && {
                  raw      : function () { return sources.main }
                , indented : function () { return indent(sources.main) }
              }
            , enderSource: sources.ender && {
                  raw      : function () { return sources.ender }
                , indented : function () { return indent(sources.ender) }
              }
          }
        }

        // this method supports multiple calls but a single execution, hence the async.memoize in init()
      , asString: function (callback) {
          // note that "main" and "ender" are processed in the same way so they can both be just
          // a string pointing to a source file or an array of source files that are concatenated
          // or be left unspecified
          var root               = packageUtil.getPackageRoot(this.parents, this.packageName)
            , packageName        = this.packageJSON.name
            , mainSources        = this.packageJSON.main  || []
            , enderBridgeSources = this.packageJSON.ender || []

            , handleSourceData = function (err, sources) {
                if (err) return callback(err)

                generateSource(
                    packageName
                  , this.makeTemplateData(sources)
                  , callback
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