var async = require('async')
  , minify = require('./minify')
  , template = require('./template')
  , argsParse = require('./args-parse')

  , templateFile = '../resources/build.ejs'

  , SourceBuild = {
        init: function (options) {
          this.options = options
          this.packages = []
          return this
        }

      , addPackage: function (srcPackage) {
          this.packages.push(srcPackage)
        }

      , asString: function (options, callback) {
          //options.type == plain||minified
          var finish = function (sources) {
            var data = {
                    source: sources.join('\n\n')
                  , context: argsParse.toContextString(this.options)
                  , sandbox: !!this.options.sandbox
                  , packages: this.packages.map(function (p) {
                      return p.getIdentifier()
                    }).join(' ')
                }
            template.generateSource('source-build', templateFile, data, function (err, source) {
              if (err)
                return callback(err)
              if (options.type === 'minified')
                minify.minify(source, callback)
              else
                callback(null, source)
            })
          }.bind(this)

          async.map(
              this.packages
            , function (srcPackage, callback) {
                srcPackage.asString(callback)
              }
            , function (err, sources) {
                if (err)
                  return callback(err)
                finish(sources)
              }
          )
        }
    }

  /*
  , parseContext = function (file, callback) {
      fs.open(file, 'r', function (err, fd) {
        if (err)
          return callback(err)
        var buffer = new Buffer(256)
        fs.read(fd, buffer, 0, 256, null, function (err, bytesRead, buffer) {
          if (err)
            return callback(err)
        })
      })
    }
  */

module.exports = {
    create: function (options) {
      return Object.create(SourceBuild).init(options)
    }
  //, parseContext: parseContext
}
