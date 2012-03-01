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
      var packages = options.packages || [ '.' ]
      if (!options.noop && !options.sans)
        packages = [ defaultRootPackage ].concat(packages)
      return uniquePackages(packages)
    }

  , processPackage = function (parents, tree, processSubtree, pkg, callback) {
      var name = packageUtil.cleanName(pkg)
        , jsonData, jsonDependencies, dirDependencies
        , getJSONDependencies = function (callback) {
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
            tree[name] = { packageJSON: jsonData, dependencies: {} }
            processSubtree(
                parents.concat([ pkg ])
              , tree[name].dependencies
              , jsonDependencies
              , callback
            )
          }

      async.parallel([ getJSONDependencies, getDirectoryDependencies ], finish)
    }

  , constructDependencyTreePart = function (parents, tree, packages, callback) {
      async.forEach(packages, processPackage.bind(null, parents, tree, constructDependencyTreePart), function (err) {
        callback(err, tree)
      })
    }

  , constructDependencyTree = function (packages, callback) {
      constructDependencyTreePart([], {}, packages, callback)
    }

    // recursive walk over the dependency tree, invoke the callback on each
    // leaf node, starting depth-first in key-order, which should give us the
    // correctly ordered dependencies
  , forEachOrderedDependency = function (tree, callback, _parents, _pkglist) { // _parents & _pkglist is for internal use
      var keys = Object.keys(tree)

      if (!_pkglist) { // first call, to top-level stuff
        var ejs = keys.indexOf('ender-js')
        if (ejs > 0)
          keys.splice(0, 0, keys.splice(ejs, 1)[0]) // take ender-js from where it is and put it at the front
        _pkglist = []
      }

      keys.forEach(function (p) {
        var parents = _parents || []
        if (_pkglist.indexOf(p) == -1) {
          if (tree[p].dependencies)
            forEachOrderedDependency(tree[p].dependencies, callback, parents.concat([ p ]), _pkglist)
          callback(p, _parents || [], tree[p], _pkglist.length) // _pkglist.length tells us the call index
          _pkglist.push(p)
        }
      })
    }

module.exports = {
    packageList: packageList
  , uniquePackages: uniquePackages
  , constructDependencyTree: constructDependencyTree
  , forEachOrderedDependency: forEachOrderedDependency
}
