var async = require('async')
  , fs = require('fs')
  , BuildParseError = require('./errors').BuildParseError
  , minify = require('./minify')
  , template = require('./template')
  , argsParse = require('./args-parse')

  , buildInfoRegex = /\n {2}\* Build: ender ([^\n]*)\s\S*(?:(?: {2}\* Packages: )([^\n]*))?/
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

  , parseContext = function (file, callback) {
      fs.open(file, 'r', function (err, fd) {
        if (err)
          return callback(err)
        var buffer = new Buffer(2048)
        fs.read(fd, buffer, 0, 2048, null, function (err, bytesRead, buffer) {
          if (err)
            return callback(err)
          fs.close(fd, function (err) {
            // err? who cares, we have our data, let's use it and run for the hills!
            var options, match = String(buffer).match(buildInfoRegex)
            if (!match)
              return callback(new BuildParseError('Could not parse ender spec from "' + file + '" (not an Ender build file?)'))
            try {
              options = argsParse.parseClean(match[1].split(' '))
            } catch (ex) {
              return callback(new BuildParseError('Could not parse ender spec from "' + file + '"', ex))
            }
            callback(null, options, match[2] && match[2].split(' '))
          })
        })
      })
    }

module.exports = {
    create: function (options) {
      return Object.create(SourceBuild).init(options)
    }
  , parseContext: parseContext
}
