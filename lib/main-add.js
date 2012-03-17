var util = require('./util')
  , mainBuild = require('./main-build')
  , mainInfoUtil = require('./main-info-util')
  , argsParse = require('./args-parse')

  , exec = function (options, out, callback) {
      var filename = util.getInputFilenameFromOptions(options)
      ;delete options.use // don't want --use showing up in the 'Build:' context string
      mainInfoUtil.parseContext(filename, function (err, context) {
        if (err)
          return callback(err)

        options = argsParse.extend(context.options, options)
        mainBuild.exec(options, out, callback)
      })
    }

module.exports.exec = exec