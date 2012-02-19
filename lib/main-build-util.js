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
            if (err && err.code == 'ENOENT') {
              // have to assume it's a read error
              tree[name] = 'missing'
              callback()
            } else {
              // we have the data, now do something with it
              tree[name] = { packageJSON: jsonData, dependencies: {} }
              constructDependencyTreePart(
                  path.join(root, package, 'node_modules')
                , tree[name].dependencies
                , jsonDependencies
                , callback
              )
            }
          }

      async.parallel([ getJSONDependencies, getDirectoryDependencies ], finish)
    }

module.exports = {
    packageList: packageList
  , uniquePackages: uniquePackages
  , constructDependencyTree: constructDependencyTree
}
