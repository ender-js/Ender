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
 * Build a DependencyTree object that represents a complete tree of
 * dependencies that exist in node_modules and in any paths that have been
 * specified as packages.
 * See the tests for what the data structure looks like.
 */

var path        = require('path')
  , async       = require('async')
  , packageUtil = require('./package-util')
  , util        = require('./util')

  , DependencyTree = {
        init: function (options, treeData) {
          this.options  = options
          this.treeData = treeData
          return this
        }

        // recursive walk over the dependency tree, invoke the callback on each
        // leaf node, starting depth-first in key-order, which should give us the
        // correctly ordered dependencies
        // this may trigger the callback on duplicate packages (although the last
        // argument of the callback is a uniqueness indicator)
      , forEachOrderedDependency: function (packages, callback, _unique, _treeData, _pkglist) {
          var ejs

          // _treeData, _unique & _pkglist are for internal use

          if (!_treeData) _treeData = this.treeData
          if (!_pkglist) { // first call, do top-level stuff
            ejs = packages.indexOf(util.getRootPackageName(this.options))
            // take root package from where it is and put it at the front
            if (ejs > 0) packages.splice(0, 0, packages.splice(ejs, 1)[0])
            _pkglist = []
          }
          packages.forEach(function (p) {
            var isUnique = _pkglist.indexOf(p) == -1

            if (isUnique || !_unique) {
              if (_treeData[p].dependencies) {
                this.forEachOrderedDependency(
                    Object.keys(_treeData[p].dependencies)
                  , callback
                  , _unique
                  , _treeData[p].dependencies
                  , _pkglist
                )
              }
              callback(p, _treeData[p].parents, _treeData[p], _pkglist.length, isUnique) // _pkglist.length tells us the call index
              _pkglist.push(p)
            }
          }.bind(this))
        }

        // does the same as the above but doesn't trigger the callback for packages that have
        // already been passed.
        // this is for SourceBuild assembling
      , forEachUniqueOrderedDependency: function (packages, callback) {
          return this.forEachOrderedDependency(packages, callback, true)
        }

        // gives a list of packages by proper name from package.json, turns a path into a package name
      , localizePackageList: function (packages) {
          return packages.map(function (p) {
            return packageUtil.isPath(p)
                && typeof this.treeData[p] == 'object'
                && this.treeData[p].packageJSON
                && this.treeData[p].packageJSON.name
                && this.treeData[this.treeData[p].packageJSON.name]
              ? this.treeData[p].packageJSON.name
              : packageUtil.cleanName(p)
            }.bind(this))
          }

      , allRootPackages: function () {
          return Object.keys(this.treeData)
        }
    }

    // Called for each root package and each sub-package within those packages node_modules
    // directories, and so on down all the way. We get dependencies from the package.json
    // files and also the directories inside node_modules
  , processPackage = function (parents, treeData, processSubtree, pkg, callback) {
      var name = packageUtil.cleanName(pkg)

        , getJSONData = function (callback) {
            // get dependency list from package.json
            packageUtil.readPackageJSON(parents, name, function (err, json) {
              if (err) return callback(err) // wrapped in package-util.js
              callback(null, {
                  data         : json
                , dependencies : packageUtil.getDependenciesFromJSON(json)
              })
            })
          }

        , getDirectoryDependencies = function (callback) {
            // dependency list from the package's node_modules directory

            if (packageUtil.isPath(name)) {
              // not installed under ./node_modules/, 'name' is a dir, so don't fetch deps from dir/node_modules
              return callback(null, { dependencies: [] })
            }

            packageUtil.getDependenciesFromDirectory(parents, name, function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-util.js
              callback(null, { dependencies: dependencies })
            })
          }

        , finish = function (err, data) {
            if (err) {
              if (err.code == 'ENOENT') {
                treeData[name] = 'missing'
                return callback()
              }
              return callback(err) // wrapped in package-util.js (see getJSONData & getDirectoryDependencies)
            }

            // we have the data, now do something with it
            treeData[name] = {
                packageJSON  : data.json.data
              , dependencies : {} // init as empty
              , parents      : parents.slice(0) // make a copy of parents array
            }

            // processSubtree() is actually just constructDependencyTreePart()
            processSubtree(
                parents.concat([ pkg ])
              , treeData[name].dependencies
                // concat dependencies in node_modules with those in package.json but don't duplicate
              , data.dir.dependencies.concat(data.json.dependencies.filter(function (p) {
                  return data.dir.dependencies.indexOf(p) == -1
                }))
              , callback
            )
          }

      if (treeData[name]) return callback() // already done this part of the tree

      async.parallel(
          {
              json : getJSONData
            , dir  : getDirectoryDependencies
          }
        , finish
      )
    }

    // recursive function, called for each node
  , constructDependencyTreePart = function (memoizedProcessor, parents, treeData, packages, callback) {
      async.forEach(
          packages
        , memoizedProcessor.bind(null, parents, treeData, constructDependencyTreePart.bind(null, memoizedProcessor))
        , callback
      )
    }

    // will return a *complete* dependency tree of ./package.json and ./node_modules,
    // we may not want everything in the result so we need to walk the tree using the
    // forEach*() methods below
  , constructDependencyTree = function (options, packages, callback) {
      var treeData = {}

          // This bit of unfortunate complexity needs some explaination: we have 2 paths in our
          // dep tree construction, we search ./node_modules/* and we individually search through
          // the `packages` list--this leads to duplication of directory & package.json reads.
          // Even though this doesn't lead to a corrupt dep tree, the duplication is overhead
          // we can do without. The cleanest way is to memoize the processPackage() function and
          // make sure duplicate calls to it with the same `parents` and `pkg` arguments are
          // only handled once. This memoized function is passed around, it's only useful for
          // individual calls to `constructDependencyTree()`.
        , memoizedProcessor = async.memoize(
              processPackage
            , function (parents, _t, _p, pkg) {
                // just a hash string to match duplicate `parents` and `pkg` arguments
                return [''].concat(parents.concat([pkg, ''])).join('$$')
              }
          )

          // a special case of the CWD, in case we are in a package to be included, if we
          // didn't do this then a plain `ender build` wouldn't work.
          // even though this will result in a double-scan of node_modules, processPackage()
          // won't allow duplicate scans below that.
        , scanRootDirectory = function (callback) {
            packageUtil.getDependenciesFromDirectory([], '.', function (err, dependencies) {
              if (err) return callback(err) // wrapped in package-utils.js
              constructDependencyTreePart(memoizedProcessor, [], treeData, dependencies, callback)
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
              , dependencyTree
            collectTreeParts(treeData, flattened)
            completeTreeParts(treeData, flattened)
            dependencyTree = Object.create(DependencyTree).init(options, treeData)
            callback(null, dependencyTree)
          }

      async.parallel(
          [ scanRootDirectory, constructDependencyTreePart.bind(null, memoizedProcessor, [], treeData, packages) ]
        , function (err) {
            if (err) return callback(err) // wrapped in package-util.js
            completeTree()
          }
      )
    }

    // take existing tree data and instantiate a DependencyTree object
  , create = function (options, treeData) {
      return Object.create(DependencyTree).init(options, treeData)
    }

module.exports = {
    generate : constructDependencyTree
  , create   : create
}