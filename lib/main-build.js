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
 * 'Build' executable module, for `ender build <packages> [...]`.
 * This module should serve to control the build process with the details.
 * Most of the hard work in figuring out what to put together is done in the
 * main-build-util module, the SourceBuild and SourcePackage objects then do
 * the assembling work while the write module outputs the results.
 */

var builder   = require('ender-builder')
  , mainInfo  = require('./main-info')
  , buildUtil = require('./main-build-util')
  , install   = require('./install')

  , handle = function (options, packages, out, installedPackages, dependencyGraph, callback) {
      if (out && installedPackages) out.installedFromRepository(installedPackages.length)
      builder(options, packages, dependencyGraph, function (err, outputFilename) {
        if (err) return callback(err) // wrapped in write.js

        out.finishedAssembly()

        // delegate to main-info to print details about the build, we can prime it with
        // the tree and options so it doesn't have to do that work itself
        if (!options.quiet) {
          mainInfo.generateAndPrint(
              options
            , out
            , outputFilename
            , options
            , dependencyGraph.localizePackageList(packages)
            , dependencyGraph
            , callback
          )
        }
      })
    }

  , exec = function (options, out, callback) {
      var packages = buildUtil.packageList(options)

      out.buildInit(packages)

      // install takes care of collecting and organising dependencies for us and simply returns
      // a DependencyTree object that we can use to assemble a build
      install.installPackages(options, packages, function (err, installedPackages, dependencyGraph) {
        if (err) return callback(err) // wrapped in repository.js

        handle(options, packages, out, installedPackages, dependencyGraph, callback)
      })
    }

module.exports.exec = exec