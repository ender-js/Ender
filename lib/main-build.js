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
 * 'Build' executable module, for `ender build <packages> [...]`.
 * This module should serve to control the build process with the details.
 * Most of the hard work in figuring out what to put together is done in the
 * main-build-util module, the SourceBuild and SourcePackage objects then do
 * the assembling work while the write module outputs the results.
 */

var builder       = require('ender-builder')
  , install       = require('ender-installer')
  , enderPackage  = require('ender-package')
  , mainInfo      = require('./main-info')
  , mainBuildUtil = require('./main-build-util')

  , handle = function (options, out, ids, installResults, callback) {
      if (out && installResults) out.installedFromRepository(installResults.length)

      enderPackage.walkDependencies(ids, true, true, function (err, packages) {
        if (err) return callback(err) // wrapper in ender-package

        builder(options, packages, function (err, files, filenames) {
          if (err) return callback(err) // wrapped in write.js

          out.finishedAssembly()

          // delegate to main-info to print details about the build, we can prime it with
          // the options and ids so it doesn't have to do that work itself
          if (!options.quiet) {
            mainInfo.generateAndPrint(
                out
              , filenames.build
              , options
              , ids
              , files
              , callback
            )
          }
        })
      })
    }

  , exec = function (options, out, callback) {
      var ids = mainBuildUtil.packageList(options)
        , refresh = options['force-install'] || options['_force-install']

      out.buildInit(ids)

      install(ids, refresh, function (err, ids, installResults) {
        if (err) return callback(err) // wrapped in repository.js

        // 'refresh' uses '_force-install' to signal that it doesn't want a trace left
        // in the 'Build:' header
        if ('_force-install' in options) delete options['_force-install']

        handle(options, out, ids, installResults, callback)
      })
    }

module.exports.exec = exec