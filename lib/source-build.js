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

var async      = require('async')
  , argsParser = require('ender-args-parser')
  , util       = require('./util')
  , minify     = require('./minify')
  , template   = require('./template')

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
                  , context: argsParser.toContextString(this.options)
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

  , create = function (options) {
      return Object.create(SourceBuild).init(options)
    }

module.exports = {
    create       : create
}