var repository = require('./repository')
  , util = require('./util')
  , buildUtil = require('./main-build-util')

  , exec = function (args, out, callback) {
      var packages = buildUtil.packageList(args)
        , handler = handle.bind(null, packages, out, callback)

      out && out.buildInit()

      util.mkdir('node_modules', function (err) {
        if (err) {
          out && out.repositoryLoadError(err)
          return callback && callback(err)
        }

        repository.setup(function (err) {
          if (err) {
            out && out.repositoryLoadError(err)
            return callback && callback(err)
          }

          repository.install(packages, handler)
        })
      })
    }

  , handle = function (packages, out, callback, err, installed, tree, pretty) {
      repository.packup(err)
      if (err) {
        out && out.repositoryError(err)
        return callback && callback(err)
      }

      out && out.installedFromRepository(installed, tree, pretty)

      callback && callback()
    }

module.exports.exec = exec
