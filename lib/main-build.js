var repository = require('./repository')
  , util = require('./util')
  , buildUtil = require('./main-build-util')
  , SourcePackage = require('./source-package')
  , SourceBuild = require('./source-build')
  , write = require('./write')

  , handle = function (options, packages, out, callback, err, results) {
      repository.packup(err)
      if (err) {
        out && out.repositoryError(err)
        return callback && callback(err)
      }

      if (out && results) {
        results.forEach(function (result) {
          out.installedFromRepository(result.installed, result.tree, result.pretty)
        })
      }

      buildUtil.constructDependencyTree(packages, function (err, tree) {
        if (err)
          return callback(err)

        var srcBuild = SourceBuild.create(options)
        packages = buildUtil.localizePackageList(packages, tree)
        //TODO: warn if this has > 0 elements: packages.map(function (p) { return packageUtil.isPath(p) })
        buildUtil.forEachUniqueOrderedDependency(packages, tree, function (packageName, parents, data) {
          srcBuild.addPackage(SourcePackage.create(parents, packageName, data.packageJSON, options))
        })

        write.write(options, srcBuild, out, callback)
      })
    }

  , exec = function (options, out, callback) {
      var packages = buildUtil.packageList(options)
        , handler = handle.bind(null, options, packages, out, callback)

      out && out.buildInit(packages)

      /*util.mkdir('node_modules', function (err) {
        if (err) {
          out && out.repositoryLoadError(err)
          return callback && callback(err)
        }*/

        repository.setup(function (err) {
          if (err) {
            out && out.repositoryLoadError(err)
            return callback && callback(err)
          }

          repository.install(packages, handler)
        })
      //})
    }

module.exports.exec = exec
