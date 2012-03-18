/******************************************************************************
 * 'Add' executable module, for `ender add <packages> [--use <file>]`.
 * This module first parses the build command in the ender.js file in CWD or
 * the file or the file provided on the --use option.
 * The build command from the ender.js build is then modified to add the
 * packages specified on the commandline and is then passed to the Build
 * module which does all the hard work.
 */

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

        // merge commandline args with the build command in ender.js
        options = argsParse.extend(context.options, options)
        mainBuild.exec(options, out, callback)
      })
    }

module.exports.exec = exec