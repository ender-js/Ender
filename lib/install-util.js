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
 * Utilities to help the install process, particularly to help select packages
 * that require installing.
 */

var path        = require('path')
  , async       = require('async')
  , packageUtil = require('ender-repository').util
  , util        = require('./util')

    // scan the tree starting at the 'packages' nodes and return any dependencies that
    // are 'missing'; although if 'missing' packages exist in other parts of the complete
    // tree they are not counted
  , findMissingDependencies = function (packages, dependencyTree) {
      var unmissing         = []
        , missing           = []
        , localizedPackages = dependencyTree.localizePackageList(packages)

      // collect non-missing pkgs across the *whole* tree
      dependencyTree.forEachOrderedDependency(
          dependencyTree.allRootPackages()
        , function (pkg, parents, node) {
            if (node != 'missing') unmissing.push(pkg)
          }
      )

      // now look at just the part of the tree starting at the 'packages' nodes
      dependencyTree.forEachOrderedDependency(
          dependencyTree.localizePackageList(packages)
        , function (pkg, parents, node) {
            if (node == 'missing' && unmissing.indexOf(pkg) == -1) missing.push(pkg)
          }
      )

      // translate any packages back to their original names as passed in
      // e.g. foo@1.2.3, or /path/to/pkg
      missing = missing.map(function (p) {
        var i = localizedPackages.indexOf(p)
        return i > -1 ? packages[i] : p
      })

      return missing
    }

  , filterPackagesWithoutCwd = function (packages) {
      var cwd = path.resolve('.')
      return packages.filter(function (p) {
        return !packageUtil.isPath(p) || path.resolve(p) != cwd
      })
    }

  , findPathDependencies = function (packages, dependencyTree) {
      var dependencies = []
      dependencyTree.forEachUniqueOrderedDependency(
          // don't localize packages here, we want the root paths
          packageUtil.cleanName(packages)
        , function (pkg, parents, node) {
            if (packageUtil.isPath(pkg))
              dependencies.push(pkg)
        }
      )
      return dependencies
    }

module.exports = {
    findMissingDependencies        : findMissingDependencies
  , filterPackagesWithoutCwd       : filterPackagesWithoutCwd
  , findPathDependencies           : findPathDependencies
}