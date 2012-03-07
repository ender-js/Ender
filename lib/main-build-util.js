var async = require('async')
  , path = require('path')
  , packageUtil = require('./package-util')

var defaultRootPackage = 'ender-js'

  , uniquePackages = function (packages) {
      var ret = []
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

  , packageList = function (options) {
      var packages = options.packages && options.packages.length ? options.packages : [ '.' ]
      if (!options.noop && !options.sans)
        packages = [ defaultRootPackage ].concat(packages)
      return uniquePackages(packages)
    }

  , processPackage = function (parents, tree, processSubtree, pkg, callback) {
      var name = packageUtil.cleanName(pkg)
        , jsonData, jsonDependencies, dirDependencies
        , getJSONData = function (callback) {
            // get dependency list from package.json
            packageUtil.readPackageJSON(parents, name, function (err, json) {
              if (err)
                return callback(err)

              jsonData = json
              jsonDependencies = packageUtil.getDependenciesFromJSON(json)
              callback()
            })
          }
        , getDirectoryDependencies = function (callback) {
            // dependency lits from the package's node_modules directory
            packageUtil.getDependenciesFromDirectory(parents, name, function (err, dependencies) {
              if (err)
                return callback(err)

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
              return callback(err)
            }

            // we have the data, now do something with it
            tree[name] = { packageJSON: jsonData, dependencies: {}, parents: parents.slice(0) }
            processSubtree(
                parents.concat([ pkg ])
              , tree[name].dependencies
              , dirDependencies.concat(jsonDependencies.filter(function (p) {
                  return dirDependencies.indexOf(p) == -1
                }))
              , callback
            )
          }

      if (tree[name]) // already done this part of the tree
        return callback()
      async.parallel([ getJSONData, getDirectoryDependencies ], finish)
    }

  , constructDependencyTreePart = function (parents, tree, packages, callback) {
      async.forEach(
          packages
        , processPackage.bind(null, parents, tree, constructDependencyTreePart)
        , function (err) {
            callback(err)
          }
      )
    }

  , constructDependencyTree = function (packages, callback) {
      var tree = {}
        , scanRootDirectory = function (callback) {
            packageUtil.getDependenciesFromDirectory([], '.', function (err, dependencies) {
              if (err)
                return callback(err)
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
              if (part[k] === 'missing') {
                if (store[k])
                  part[k] = store[k][0]
              } else
                completeTreeParts(part[k].dependencies, store)
            })
          }
        , completeTree = function () {
            var flattened = {}
            collectTreeParts(tree, flattened)
            completeTreeParts(tree, flattened)
            callback(null, tree)
          }

      async.parallel(
          [ scanRootDirectory, constructDependencyTreePart.bind(null, [], tree, packages) ]
        , function (err) {
            if (err)
              return callback(err)
            completeTree()
          }
      )
    }

    // recursive walk over the dependency tree, invoke the callback on each
    // leaf node, starting depth-first in key-order, which should give us the
    // correctly ordered dependencies
  , forEachOrderedDependency = function (packages, tree, callback, _pkglist) { // _pkglist is for internal use
      if (!_pkglist) { // first call, to top-level stuff
        var ejs = packages.indexOf('ender-js')
        if (ejs > 0)
          packages.splice(0, 0, packages.splice(ejs, 1)[0]) // take ender-js from where it is and put it at the front
        _pkglist = []
      }

      packages.forEach(function (p) {
        if (_pkglist.indexOf(p) == -1) {
          if (tree[p].dependencies)
            forEachOrderedDependency(Object.keys(tree[p].dependencies), tree[p].dependencies, callback, _pkglist)
          callback(p, tree[p].parents, tree[p], _pkglist.length) // _pkglist.length tells us the call index
          _pkglist.push(p)
        }
      })
    }

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
          newList.push(p)
      })
      return newList
    }

module.exports = {
    packageList: packageList
  , uniquePackages: uniquePackages
  , constructDependencyTree: constructDependencyTree
  , forEachOrderedDependency: forEachOrderedDependency
  , localizePackageList: localizePackageList
}