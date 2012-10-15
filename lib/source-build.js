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
 * SourceBuild is an object that is created for each Ender build to hold and
 * manage multiple SourcePackage objects. It is able to pull together the
 * source files through its asString() method which in turn invokes asString()
 * on the list of SourcePackages.
 */

var async           = require('async')
  , fs              = require('fs')
  , util            = require('./util')
  , minify          = require('./minify')
  , template        = require('./template')
  , argsParse       = require('./args-parse')
  , BuildParseError = require('./errors').BuildParseError
  , FilesystemError = require('./errors').FilesystemError

    // 'Packages:' is optional because it's not in <= 0.8.x Ender builds
  , buildInfoRegex  = /\n {2}\* Build: ender ([^\n]*)\s\S*(?:(?: {2}\* Packages: )([^\n]*))?/
  , templateFile    = '../resources/build.mustache'

  , SourceBuild = {
        init: function (options) {
          this.options  = options
          this.packages = []
          return this
        }

      , addPackage: function (srcPackage) { // add a SourcePackage object for each package
          this.packages.push(srcPackage)
        }

      , asString: function (options, callback) {
          //options.type == plain||minified
          var finish = function (err, source) {
                if (err) return callback(err) // wrapped in template.js
                if (options.type != 'minified') return callback(null, source)
                minify.minify(this.completeOptions(), source, callback)
              }.bind(this)

            , tmplData = function (sources) {
                return {
                    source: sources.join('\n\n')
                  , context: argsParse.toContextString(this.options)
                  , sandbox: !!this.options.sandbox
                  , packages: this.packages.map(function (p) {
                      return p.identifier
                    }).join(' ')
                }
              }.bind(this)

            , readComplete = function (err, sources) {
                if (err) return callback(err) // wrapped in source-package.js
                template.generateSource(templateFile, tmplData(sources), finish)
              }.bind(this)

            , packageToString = function (srcPackage, callback) {
                srcPackage.asString(callback)
              }

          // async.map, oh my! do an asString() on each SourcePackage async but reassemble them in order
          async.map(this.packages, packageToString, readComplete)
        }

      , completeOptions: function () { // options + any additional options child packages may wish to add
          var options = util.extend(this.options, {})
          this.packages.forEach(function (pkg) {
            pkg.extendOptions(options)
          })
          return options
        }
    }

    // a utility static method to partially read an ender build file and parse the head comment
    // to pull out the 'Build:' and 'Packages:' lines. Returns the build command as a properly
    // parsed options object (via argsParse).
  , parseContext = function (file, callback) {
      fs.open(file, 'r', function (err, fd) {
        if (err) return callback(new FilesystemError(err))

        var buffer = new Buffer(2048)
        fs.read(fd, buffer, 0, 2048, null, function (err, bytesRead, buffer) {
          if (err) return callback(new FilesystemError(err))

          fs.close(fd, function () {
            // err? who cares, we have our data, let's use it and run for the hills!
            var options
              , error
              , match = String(buffer).match(buildInfoRegex)

            if (!match) {
              error = 'Could not parse ender spec from "' + file + '" (not an Ender build file?)'
              return callback(new BuildParseError(error))
            }

            try {
              options = argsParse.parseClean(match[1].split(' '))
            } catch (ex) {
              error = 'Could not parse ender spec from "' + file + '"'
              return callback(new BuildParseError(error, ex))
            }

            callback(null, options, match[2] && match[2].split(' '))
          })
        })
      })
    }

  , create = function (options) {
      return Object.create(SourceBuild).init(options)
    }

module.exports = {
    create       : create
  , parseContext : parseContext
}