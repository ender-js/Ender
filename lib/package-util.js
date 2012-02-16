var fs = require('fs')
  , path = require('path')

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
      var i = 0, cwd = path.resolve('.')
      for (i; i < packages.length; i++) {
        if (path.resolve(packages[i]) == cwd) {
          return readPackageJSON(cwd, function (err, data) {
            if (err)
              return callback(err)
            callback(null, data.name)
          })
        }
      }
      callback()
    }

module.exports = {
    readPackageJSON: readPackageJSON
  , findRootPackageName: findRootPackageName
}
