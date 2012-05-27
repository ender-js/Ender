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

var util          = require('./util')
  , write         = require('./write')
  , mainInfo      = require('./main-info')
  , buildUtil     = require('./main-build-util')
  , repository    = require('./repository')
  , packageUtil   = require('./package-util')
  , SourceBuild   = require('./source-build')
  , SourcePackage = require('./source-package')

  , handle = function (options, packages, out, callback, err, results) {
      repository.packup(err)
      if (err) return callback(err) // wrapped in repository.js

      if (out && results) {
        results.forEach(function (result) {
          out.installedFromRepository(result.installed, result.tree, result.pretty)
        })
      }

      // This is where the magic happens, build a tree representing the dependencies
      // in node_modules and all packages referred by path, we then cherry pick
      // the modules that we need, in the right order, to assemble the output file(s).
      // Note that we always prefer what's in node_modules over any relative paths;
      // npm should make copies in there for us.
      buildUtil.constructDependencyTree(packages, function (err, tree) {
        if (err) return callback(err) // wrapped in package-utils.js

            // new SourceBuild object to store each package in
        var srcBuild          = SourceBuild.create(options)
            // sanitise and localise the names from relative paths
          , localizedPackages = buildUtil.localizePackageList(packages, tree)
          , rootPackageName   = util.getRootPackageName(options)

        //TODO: warn if this: packages.some(function (p) { return packageUtil.isPath(p) })
        buildUtil.forEachUniqueOrderedDependency(options, localizedPackages, tree, function (packageName, parents, data) {
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
          mainInfo.generateAndPrint(
              options
            , out
            , util.getOutputFilenameFromOptions(options)
            , options
            , localizedPackages
            , tree
            , callback
          )
        })
      })
    }

  , exec = function (options, out, callback) {
      var packages = buildUtil.packageList(options)
        , handler  = handle.bind(null, options, packages, out, callback)

      out && out.buildInit(packages)

      packageUtil.preparePackagesDirectory(function (err) {
        if (err) return callback(err) // wrapped in util.js

        repository.setup(function (err) {
          if (err) return callback(err) // wrapped in repository.js

          repository.install(packages, handler)
        })
      })
    }

module.exports.exec = exec