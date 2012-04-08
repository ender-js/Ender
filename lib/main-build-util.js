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
 * Utilities for main-build and also main-info which also needs a dependency
 * tree. This is arguably the most important part of the system, and also the
 * most complex.
 * See the tests for this code for a more comprehensive treatment of what we
 * expect from this module.
 */

var async       = require('async')
  , path        = require('path')
  , packageUtil = require('./package-util')
  , util        = require('./util')

    // unique packages by proper name
var uniquePackages = function (packages) {
      var ret  = []
        , have = []

      packages.forEach(function (p) {
        var name = packageUtil.cleanName(p)
        if (have.indexOf(name) == -1) {
          ret.push(p)
          have.push(name)
        }
      })

      return ret
    }

  , isRootPackage = function (options, p) {
      if (options.noop || options.sans) return false
      return packageUtil.cleanName(p) === util.getRootPackageName(options)
    }

    // given a list of packages, provide a sanitised list without duplicates and with
    // the root package at the start.
  , packageList = function (options) {
      var packages = options.packages && options.packages.length ? options.packages : [ '.' ]
      if (!options.noop && !options.sans) packages = [ util.getRootPackageName(options) ].concat(packages)
      return uniquePackages(packages)
    }

    // Called for each root package and each sub-package within those packages node_modules
    // directories, and so on down all the way. We get dependencies from the package.json
    // files and also the directories inside node_modules
  , processPackage = function (parents, tree, processSubtree, pkg, callback) {
      var name = packageUtil.cleanName(pkg)
        , jsonData
        , jsonDependencies
        , dirDependencies

        , getJSONData = function (callback) {
            // get dependency list from package.json
            packageUtil.readPackageJSON(parents, name, function (err, json) {
              if (err) return callback(err) // wrapped in package-util.js
              jsonData = json
              jsonDependencies = packageUtil.getDependenciesFromJSON(json)
              callback()
            })
          }
        , getDirectoryDependencies = function (callback) {
            // dependency lits from the package's node_modules directory
            packageUtil.getDependenciesFromDirectory(parents, name, function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-util.js
              dirDependencies = dependencies
              callback()
            })
          }
        , finish = function (err) {
            if (err) {
              if (err.code == 'ENOENT') {
                tree[name] = 'missing'
                return callback()
              }
              return callback(err) // wrapped in package-util.js (see getJSONData & getDirectoryDependencies)
            }

            // we have the data, now do something with it
            tree[name] = {
                packageJSON  : jsonData
              , dependencies : {} // init as empty
              , parents      : parents.slice(0) // make a copy of parents array
            }

            // processSubtree() is actually just constructDependencyTreePart()
            processSubtree(
                parents.concat([ pkg ])
              , tree[name].dependencies
                // concat dependencies in node_modules with those in package.json but don't duplicate
              , dirDependencies.concat(jsonDependencies.filter(function (p) {
                  return dirDependencies.indexOf(p) == -1
                }))
              , callback
            )
          }

      if (tree[name]) return callback()// already done this part of the tree

      async.parallel([ getJSONData, getDirectoryDependencies ], finish)
    }

    // recursive function, called for each node
  , constructDependencyTreePart = function (parents, tree, packages, callback) {
      async.forEach(
          packages
        , processPackage.bind(null, parents, tree, constructDependencyTreePart)
        , callback
      )
    }

    // will return a *complete* dependency tree of ./package.json and ./node_modules,
    // we may not want everything in the result so we need to walk the tree using the
    // forEach*() methods below
  , constructDependencyTree = function (packages, callback) {
      var tree = {}
          // a special case of the CWD, in case we are in a package to be included, if we
          // didn't do this then a plain `ender build` wouldn't work.
          // even though this will result in a double-scan of node_modules, processPackage()
          // won't allow duplicate scans below that.
        , scanRootDirectory = function (callback) {
            packageUtil.getDependenciesFromDirectory([], '.', function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-utils.js
              constructDependencyTreePart([], tree, dependencies, callback)
            })
          }
        , collectTreeParts = function (part, store) {
            Object.keys(part).forEach(function (k) {
              if (typeof part[k].dependencies == 'object') {
                (store[k] || (store[k] = [])).push(part[k])
                collectTreeParts(part[k].dependencies, store)
              }
            })
          }
        , completeTreeParts = function (part, store) {
            Object.keys(part).forEach(function (k) {
              if (part[k] !== 'missing') return completeTreeParts(part[k].dependencies, store)
              if (store[k]) part[k] = store[k][0]
            })
          }
          // using collectTreeParts() and completeTreeParts() we first assemble a flat collection of
          // all packages by name, then we walk the full tree again and fill in any gaps where packages
          // may have dependencies that exist elsewhere in ther tree--npm doesn't always give us a
          // complete tree where there are duplicates so we have to go looking.
          // we end up with a tree that can contain many duplicates but it's a complete tree.
        , completeTree = function () {
            var flattened = {}
            collectTreeParts(tree, flattened)
            completeTreeParts(tree, flattened)
            callback(null, tree)
          }

      async.parallel(
          [ scanRootDirectory, constructDependencyTreePart.bind(null, [], tree, packages) ]
        , function (err) {
            if (err) return callback(err) // wrapped in package-util.js
            completeTree()
          }
      )
    }

    // recursive walk over the dependency tree, invoke the callback on each
    // leaf node, starting depth-first in key-order, which should give us the
    // correctly ordered dependencies
    // this is used for dependency tree printing and may trigger the callback on
    // duplicate packages (although the last argument of the callback is a uniqueness
    // indicator)
  , forEachOrderedDependency = function (options, packages, tree, callback, _unique, _pkglist) {
      var ejs
      // _unique, _pkglist is for internal use
      if (!_pkglist) { // first call, to top-level stuff
        ejs = packages.indexOf(util.getRootPackageName(options))
        // take root package from where it is and put it at the front
        if (ejs > 0) packages.splice(0, 0, packages.splice(ejs, 1)[0])
        _pkglist = []
      }

      packages.forEach(function (p) {
        var isUnique = _pkglist.indexOf(p) == -1
        if (isUnique || !_unique) {
          if (tree[p].dependencies) {
            forEachOrderedDependency(
                options
              , Object.keys(tree[p].dependencies)
              , tree[p].dependencies
              , callback
              , _unique
              , _pkglist
            )
          }
          callback(p, tree[p].parents, tree[p], _pkglist.length, isUnique) // _pkglist.length tells us the call index
          _pkglist.push(p)
        }
      })
    }

    // does the same as the above but doesn't trigger the callback for packages that have
    // already been passed.
    // this is for SourceBuild assembling
  , forEachUniqueOrderedDependency = function (options, packages, tree, callback) {
      return forEachOrderedDependency(options, packages, tree, callback, true)
    }

    // gives a list of packages by proper name from package.json, turns a path into a package name
  , localizePackageList = function (packages, tree) {
      var newList = []
      packages.forEach(function (p) {
        if (packageUtil.isPath(p)
            && typeof tree[p] == 'object'
            && tree[p].packageJSON
            && tree[p].packageJSON.name
            && tree[tree[p].packageJSON.name]) {
          newList.push(tree[p].packageJSON.name)
        } else
          newList.push(packageUtil.cleanName(p))
      })
      return newList
    }

module.exports = {
    packageList                    : packageList
  , uniquePackages                 : uniquePackages
  , isRootPackage                  : isRootPackage
  , localizePackageList            : localizePackageList
  , constructDependencyTree        : constructDependencyTree
  , forEachOrderedDependency       : forEachOrderedDependency
  , forEachUniqueOrderedDependency : forEachUniqueOrderedDependency
}