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

var path          = require('path')
  , packageUtil   = require('ender-repository').util
  , util          = require('./util')
  , write         = require('./write')
  , mainInfo      = require('./main-info')
  , buildUtil     = require('./main-build-util')
  , install       = require('./install')
  , SourceBuild   = require('./source-build')
  , SourcePackage = require('./source-package')

  , handle = function (options, packages, out, installedPackages, dependencyTree, callback) {
      if (out && installedPackages) out.installedFromRepository(installedPackages.length)

          // new SourceBuild object to store each package in
      var srcBuild          = SourceBuild.create(options)
          // sanitise and localise the names from relative paths
        , localizedPackages = dependencyTree.localizePackageList(packages)
        , rootPackageName   = util.getRootPackageName(options)

      // DependencyTree does all the hard work of collecting and ordering dependencies for us
      dependencyTree.forEachUniqueOrderedDependency(localizedPackages, function (packageName, parents, data) {
        var pidx   = localizedPackages.indexOf(packageName)
          , isRoot = (pidx != -1 && packages[pidx] == rootPackageName) || packageName == rootPackageName

        // each package that we need, add it to SourceBuild as a SourcePackage object
        srcBuild.addPackage(SourcePackage.create(packageName, parents, isRoot, data.packageJSON, options))
      })

      // write the output files!
      write.write(options, srcBuild, out, function (err) {
        if (err) return callback(err) // wrapped in write.js

        out.finishedAssembly()

        // delegate to main-info to print details about the build, we can prime it with
        // the tree and options so it doesn't have to do that work itself
        if (!options.quiet) {
          mainInfo.generateAndPrint(
              options
            , out
            , util.getOutputFilenameFromOptions(options)
            , options
            , localizedPackages
            , dependencyTree
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
      install.installPackages(options, packages, function (err, installedPackages, dependencyTree) {
        if (err) return callback(err) // wrapped in repository.js

        handle(options, packages, out, installedPackages, dependencyTree, callback)
      })
    }

module.exports.exec = exec