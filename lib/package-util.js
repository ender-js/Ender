var fs = require('fs')
  , path = require('path')

  , stripVersionRegex = /@.*$/

  , cleanName = function (name) {
      return name.replace(stripVersionRegex, '')
    }

  , isCWD = function (package) {
      return path.resolve(package) == path.resolve('.')
    }

    // perhaps this could be done with `require()` since it can now read package.json
  , readPackageJSON = function (rootPath, callback) {
      fs.readFile(path.resolve(rootPath, 'package.json'), 'utf-8', function (err, data) {
        if (err)
          return callback(err)

        callback(null, JSON.parse(data))
      })
    }

    // if one of the packages is a path that points to the CWD then get the
    // name of it
  , findRootPackageName = function (packages, callback) {
      for (var i = 0; i < packages.length; i++) {
        if (isCWD(packages[i])) {
          return readPackageJSON(packages[i], function (err, data) {
            if (err)
              return callback(err)
            callback(null, data.name)
          })
        }
      }
      callback()
    }

  , findAndReadPackageJSON = function (root, package, callback) {
      package = cleanName(package)
      if (package != '.' && !/[/\\]/.test(package)) // not a directory reference of some kind
        package = path.join(root, 'node_modules', package)
      readPackageJSON(package, callback)
    }

  , getDependenciesFromJSON = function (packageJSON) {
      var dep = packageJSON.dependencies
      if (dep && !Array.isArray(dep))
        dep = Object.keys(dep)
      return dep && dep.length ? dep : []
    }

  , getDependenciesFromDirectory = function (root, package, callback) {
      var dir = path.resolve(path.join(root, package, 'node_modules'))

      path.exists(dir, function (exists) {
        if (!exists)
          return callback(null, [])
        fs.readdir(dir, callback)
      })
    }

module.exports = {
    cleanName: cleanName
  , isCWD: isCWD
  , readPackageJSON: readPackageJSON
  , findRootPackageName: findRootPackageName
  , findAndReadPackageJSON: findAndReadPackageJSON
  , getDependenciesFromJSON: getDependenciesFromJSON
  , getDependenciesFromDirectory: getDependenciesFromDirectory
}
