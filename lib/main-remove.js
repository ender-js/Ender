/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/******************************************************************************
 * 'Remove' executable module, for `ender remove <packages> [--use <file>]`.
 * This module first parses the build command in the ender.js file in CWD or
 * the file or the file provided on the --use option.
 * The packages to be removed are deleted from node_modules by invoking npm
 * remove. The build command from the ender.js build is then modified to
 * remove the packages specified on the commandline and is then passed to the
 * Build module which does all the hard work.
 */

var async         = require('async')
  , repository    = require('ender-repository')
  , argsParser    = require('ender-args-parser')
  , util          = require('./util')
  , mainBuild     = require('./main-build')
  , parseContext  = require('./parse-context')

  , exec = function (options, out, callback) {
      var filename = util.getInputFilenameFromOptions(options)
        , toRemove = options.packages
        , finish   = function (err) {
            repository.packup(err)
            callback(err)
          }

    ; delete options.use // don't want --use showing up in the 'Build:' context string
      options.packages = [] // reset the packages list so argsParser.extend() doesn't include them

      parseContext(filename, function (err, context) {
        if (err) return callback(err) // wrapped in source-build.js

        // merge the commandline with the ender.js build command
        options          = argsParser.extend(context.options, options)
        options.packages = options.packages.filter(function (p) {
          return toRemove.indexOf(p) == -1 // do the remove!
        })

        async.series(
            [
                repository.setup // shouldn't need to do a packup because main-build will do it
              , repository.uninstall.bind(null, toRemove)
              , mainBuild.exec.bind(null, options, out) // hard work done by main-build
            ]
          , finish
        )
      })
    }

module.exports.exec = exec