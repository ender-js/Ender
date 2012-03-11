var async = require('async')
  , mainInfoUtil = require('./main-info-util')

  , exec = function (args, out, callback) {
      var filename = args.use ? args.use.replace(/(\.js)?$/, '.js') : 'ender.js'
        , finish = function (err, data) {
            if (err)
              return callback(err)
            out.buildInfo(filename, data.context.options, data.context.packages, data.sizes)
            callback()
          }

      async.parallel({
          sizes: mainInfoUtil.sizes.bind(null, filename)
        , context: mainInfoUtil.parseContext.bind(null, filename)
      }, finish)
    }

module.exports.exec = exec