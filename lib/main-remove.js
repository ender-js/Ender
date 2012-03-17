var async = require('async')
  , util = require('./util')
  , mainBuild = require('./main-build')
  , mainBuildUtil = require('./main-build-util')
  , mainInfoUtil = require('./main-info-util')
  , argsParse = require('./args-parse')
  , repository = require('./repository')

  , exec = function (options, out, callback) {
      var filename = util.getInputFilenameFromOptions(options)
        , packages = options.packages.filter(function (p) {
            return !mainBuildUtil.isRootPackage(options, p)
          })
        , repositorySetup = function (callback) {
            repository.setup(function (err) {
              if (err && out)
                out.repositoryLoadError(err)
              callback(err)
            })
          }
        , finish = function (err) {
            repository.packup(err)
            callback(err)
          }

      ;delete options.use // don't want --use showing up in the 'Build:' context string
      options.packages = []

      mainInfoUtil.parseContext(filename, function (err, context) {
        if (err)
          return callback(err)

        options = argsParse.extend(context.options, options)
        options.packages = options.packages.filter(function (p) {
          return packages.indexOf(p) == -1
        })

        async.series(
            [
                repositorySetup
              , repository.uninstall.bind(null, packages)
              , mainBuild.exec.bind(null, options, out)
            ]
          , finish
        )
      })
    }

module.exports.exec = exec