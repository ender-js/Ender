var async = require('async')
  , util = require('./util')
  , mainBuildUtil = require('./main-build-util')
  , mainInfoUtil = require('./main-info-util')

  , generateAndPrint = function (args, out, options, packages, tree, callback) {
      var filename = util.getFilenameFromOptions(args)

        , generateSpec = function (callback) {
            if (options && packages && tree) {
              return callback(null, {
                  context: {
                      options: options
                    , packages: packages
                  }
                , tree: tree
              })
            }

            mainInfoUtil.parseContext(filename, function (err, context) {
              mainBuildUtil.constructDependencyTree(context.packages, function (err, tree) {
                if (err)
                  return callback(err)

                callback(null, {
                    context: context
                  , tree: tree
                })
              })
            })
          }

        , generateSizes = mainInfoUtil.sizes.bind(null, filename)

        , finish = function (err, data) {
            if (err)
              return callback(err)

            var tree = data.spec.tree
              , context = data.spec.context
              , archyTree = mainInfoUtil.buildArchyTree(context.packages, tree)

            out.buildInfo(filename, context.options, context.packages, data.sizes, archyTree)
            callback()
          }

      //TODO: should perform a path.exists() on the file(s) we're going to check, otherwise we get a
      // random error from one of the fs read operations above
      async.parallel({
          spec: generateSpec
        , sizes: generateSizes
      }, finish)
    }

  , exec = function (args, out, callback) {
      generateAndPrint(args, out, null, null, null, callback)
    }

module.exports = {
    exec: exec
  , generateAndPrint: generateAndPrint
}