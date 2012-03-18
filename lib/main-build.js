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

var repository = require('./repository')
  , util = require('./util')
  , buildUtil = require('./main-build-util')
  , mainInfo = require('./main-info')
  , SourcePackage = require('./source-package')
  , SourceBuild = require('./source-build')
  , write = require('./write')
  , packageUtil = require('./package-util')

  , handle = function (options, packages, out, callback, err, results) {
      repository.packup(err)
      if (err) {
        out && out.repositoryError(err)
        return callback && callback(err)
      }

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
        if (err)
          return callback(err)

        var srcBuild = SourceBuild.create(options) // new SourceBuild object to store each package in
        packages = buildUtil.localizePackageList(packages, tree) // sanitise and localise the names from relative paths
        //TODO: warn if this has > 0 elements: packages.map(function (p) { return packageUtil.isPath(p) })
        buildUtil.forEachUniqueOrderedDependency(packages, tree, function (packageName, parents, data) {
          // each package that we need, add it to SourceBuild as a SourcePackage object
          srcBuild.addPackage(SourcePackage.create(parents, packageName, data.packageJSON, options))
        })

        // write the output files!
        write.write(options, srcBuild, out, function (err) {
          out.finishedAssembly()
          // delegate to main-info to print details about the build, we can prime it with
          // the tree and options so it doesn't have to do that work itself
          mainInfo.generateAndPrint(
              options
            , out
            , util.getOutputFilenameFromOptions(options)
            , options
            , packages
            , tree
            , callback
          )
        })
      })
    }

  , exec = function (options, out, callback) {
      var packages = buildUtil.packageList(options)
        , handler = handle.bind(null, options, packages, out, callback)

      out && out.buildInit(packages)

      packageUtil.preparePackagesDirectory(function (err) {
        if (err) {
          out && out.repositoryLoadError(err)
          return callback && callback(err)
        }

        repository.setup(function (err) {
          if (err) {
            out && out.repositoryLoadError(err)
            return callback(err)
          }

          repository.install(packages, handler)
        })
      })
    }

module.exports.exec = exec