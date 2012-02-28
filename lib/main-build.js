var repository = require('./repository')
  , util = require('./util')
  , buildUtil = require('./main-build-util')
  , SourcePackage = require('./source-package')
  , SourceBuild = require('./source-build')

  , handle = function (packages, out, callback, err, installed, tree, pretty) {
      repository.packup(err)
      if (err) {
        out && out.repositoryError(err)
        return callback && callback(err)
      }

      out && out.installedFromRepository(installed, tree, pretty)

      buildUtil.constructDependencyTree(packages, function (err, tree) {
        if (err)
          throw 'TODO'

        var srcBuild = SourceBuild.create({})
        buildUtil.forEachOrderedDependency(tree, function (packageName, parents, data) {
          srcBuild.addPackage(SourcePackage.create(parents, packageName, data.packageJSON, {}))
        })

        srcBuild.asString(function (err, str) {
          if (err) throw err
          require('fs').writeFileSync('ender.js', str, 'utf-8')
        })
      })

      callback && callback()
    }

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

module.exports.exec = exec
