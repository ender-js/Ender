var fs = require('fs')
  , path = require('path')

  , stripVersionRegex = /@.*$/

  , cleanName = function (name) {
      return name.replace(stripVersionRegex, '')
    }

  , isCWD = function (pkg) {
      return path.resolve(pkg) == path.resolve('.')
    }

  , getPackageRoot = function (parents, pkg) {
      var dirs = [ 'node_modules' ]
      pkg = cleanName(pkg)
      if (pkg != '.' && !/[\/\\]/.test(pkg)) { // not a directory reference of some kind
        parents.forEach(function (p) {
          dirs.push(p)
          dirs.push(dirs[0])
        })
        return path.resolve(path.join.apply(null, dirs), pkg)
      }
      return path.resolve(pkg)
    }

    // perhaps this could be done with `require()` since it can now read package.json
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
  , getPackageRoot: getPackageRoot
  , readPackageJSON: readPackageJSON
  , findRootPackageName: findRootPackageName
  , getDependenciesFromJSON: getDependenciesFromJSON
  , getDependenciesFromDirectory: getDependenciesFromDirectory
}
