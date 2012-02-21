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

  , packageList = function (args) {
      var packages = args.remaining || [ '.' ]
      if (!args.options || (!args.options.noop && !args.options.sans))
        packages = [ defaultRootPackage ].concat(packages)
      return uniquePackages(packages)
    }

  , constructDependencyTree = function (root, packages, callback) {
      constructDependencyTreePart(root, {}, packages, callback)
    }

  , constructDependencyTreePart = function (root, tree, packages, callback) {
      async.forEach(packages, processPackage.bind(null, root, tree), function (err) {
        callback(err, tree)
      })
    }

  , processPackage = function (root, tree, package, callback) {
      var name = packageUtil.cleanName(package)
        , jsonData, jsonDependencies, dirDependencies
        , getJSONDependencies = function (callback) {
            // get dependency list from package.json
            packageUtil.findAndReadPackageJSON(root, name, function (err, json) {
              if (err)
                return callback(err)

              jsonData = json
              jsonDependencies = packageUtil.getDependenciesFromJSON(json)
              callback()
            })
          }
        , getDirectoryDependencies = function (callback) {
            // dependency lits from the package's node_modules directory
            packageUtil.getDependenciesFromDirectory(root, name, function (err, dependencies) {
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
            constructDependencyTreePart(
                path.join(root, package, 'node_modules')
              , tree[name].dependencies
              , jsonDependencies
              , callback
            )
          }

      async.parallel([ getJSONDependencies, getDirectoryDependencies ], finish)
    }

    // recursive walk over the dependency tree, invoke the callback on each
    // leaf node, starting depth-first in key-order, which should give us the
    // correctly ordered dependencies
  , forEachOrderedDependency = function (tree, callback, _pkglist) { // _pkglist is for internal use
      if (!_pkglist)
        _pkglist = []

      Object.keys(tree).forEach(function (p) {
        if (_pkglist.indexOf(p) == -1) {
          if (tree[p].dependencies)
            forEachOrderedDependency(tree[p].dependencies, callback, _pkglist)
          callback(p, tree[p], _pkglist.length) // _pkglist.length tells us the call index
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
