var zlib = require('zlib')
  , fs = require('fs')
  , async = require('async')
  , minify = require('./minify')
  , SourceBuild = require('./source-build')

  , exec = function (args, out, callback) {
      var filename = args.use ? args.use.replace(/(\.js)?$/, '.js') : 'ender.js'
        , sizes = function (callback) {
            var sizes = {}
              , mkcb = function (prop, callback) {
                  return function (err, data) {
                    if (err)
                      return callback(err)
                    sizes[prop] = data.length
                    callback(null, data)
                  }
                }

            async.waterfall(
                [
                    function (callback) {
                      fs.readFile(filename, 'utf-8', mkcb('raw', callback))
                    }
                  , function (data, callback) {
                      minify.minify(data, mkcb('minify', callback))
                    }
                  , function (data, callback) {
                      zlib.gzip(data, mkcb('gzip', callback))
                    }
                ]
              , function (err) {
                  callback(err, sizes)
                }
            )
          }
        , parseContext = function (callback) {
            SourceBuild.parseContext(filename, function (err, options, packages) {
              if (err)
                return callback(err)

              callback(null, {
                  options: options
                , packages: packages
              })
            })
          }
        , finish = function (err, data) {
            if (err)
              return callback(err)
            out.buildInfo(filename, data.context.options, data.context.packages, data.sizes)
            callback()
          }

      async.parallel({
          sizes: sizes
        , context: parseContext
      }, finish)
    }

module.exports.exec = exec