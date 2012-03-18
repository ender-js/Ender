/******************************************************************************
 * Collection of utility functions that deal with npm packages on the
 * filesystem. Anything to do with node_modules, package.json, etc. should be
 * done here, the rest of the app shouldn't have to know about any of this
 * detail.
 */

var fs = require('fs')
  , path = require('path')

  , stripVersionRegex = /@.*$/

    // strip out the version if it exists, bean@0.4.5 -> bean
  , cleanName = function (name) {
      return name.replace(stripVersionRegex, '')
    }

  , isCWD = function (pkg) {
      return path.resolve(pkg) == path.resolve('.')
    }

  , isPath = function (pkg) {
      pkg = cleanName(pkg)
      return pkg === '.' || /[\/\\]/.test(pkg)
    }

    // given an array of parent packages and a package name, give us a path to the
    // package inside the CWD node_modules directory
  , getPackageRoot = function (parents, pkg) {
      var dirs = [ 'node_modules' ]
      pkg = cleanName(pkg)
      if (!isPath(pkg)) { // not a directory reference of some kind
        parents.forEach(function (p) {
          dirs.push(p)
          dirs.push(dirs[0])
        })
        return path.resolve(path.join.apply(null, dirs), pkg)
      }
      return path.resolve(pkg)
    }

    // perhaps this could be done with `require()` since it can now read package.json?
  , readPackageJSON = function (parents, pkg, callback) {
      var root = getPackageRoot(parents, pkg)
      fs.readFile(path.resolve(root, 'package.json'), 'utf-8', function (err, data) {
        if (err)
          return callback(err)

        callback(null, JSON.parse(data))
      })
    }

    // if one of the packages is a path that points to the CWD then get the
    // name of it
  , findRootPackageName = function (packages, callback) {
      var found = function (err, data) {
          if (err)
            return callback(err)
          callback(null, data.name)
        }

      for (var i = 0; i < packages.length; i++)
        if (isCWD(packages[i]))
          return readPackageJSON([], packages[i], found)
      callback()
    }

  , getDependenciesFromJSON = function (packageJSON) {
      var dep = packageJSON.dependencies
      if (dep && !Array.isArray(dep))
        dep = Object.keys(dep)
      return dep && dep.length ? dep : []
    }

  , getDependenciesFromDirectory = function (parents, pkg, callback) {
      var root = getPackageRoot(parents, pkg)
        , dir = path.resolve(path.join(root, 'node_modules'))

      path.exists(dir, function (exists) {
        if (!exists)
          return callback(null, [])
        fs.readdir(dir, callback)
      })
    }

module.exports = {
    cleanName: cleanName
  , isCWD: isCWD
  , isPath: isPath
  , getPackageRoot: getPackageRoot
  , readPackageJSON: readPackageJSON
  , findRootPackageName: findRootPackageName
  , getDependenciesFromJSON: getDependenciesFromJSON
  , getDependenciesFromDirectory: getDependenciesFromDirectory
}