var async = require('async')
  , mainBuildUtil = require('./main-build-util')
  , mainInfoUtil = require('./main-info-util')

  , exec = function (args, out, callback) {
      var filename = args.use ? args.use.replace(/(\.js)?$/, '.js') : 'ender.js'

        , generateSpec = function (callback) {
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

      async.parallel({
          sizes: generateSizes
        , spec: generateSpec
      }, finish)
    }

module.exports.exec = exec