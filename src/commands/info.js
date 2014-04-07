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
 * 'Info' executable module, prints pretty details about the build, can be
 * used for the `ender info [--use <file>]` or by calling generateAndPrint()
 * directly (this is done in main-build). Most of the pretty printing is done
 * by main-info-output, we just provide the data/model here.
 */

var async         = require('async')
  , fs            = require('fs')
  , zlib          = require('zlib')

  , argsParser    = require('ender-args-parser')
  , enderPackage  = require('ender-package')
  , util          = require('./util')

  , CompressionError = require('./errors').CompressionError
  , FilesystemError  = require('./errors').FilesystemError

  , exec = function (options, out, callback, buildName, ids, files) {
      var sizes = {}

        , finish = function (callback) {
            // build an `archy` tree representing the packages in the build
            enderPackage.buildArchyTree(ids, true, function (err, archyTree) {
              if (err) return callback(err) // wrapped in ender-package

              out.log('Your current build command is: ' + ('ender ' + argsParser.toContextString(options)).yellow)
              out.log(
                  'Your current build size is: '
                + util.toKb(sizes.build).yellow + ' raw'
                + (sizes.minifiedBuild
                    ? ', ' + util.toKb(sizes.minifiedBuild).yellow + ' minified and '
                           + util.toKb(sizes.gzippedMinifiedBuild).yellow + ' gzipped'
                    : ''
                  )
                + '\n'
              )
              out.log(archyTree)

              callback()
            })
          }

        , calculateSizes = function (callback) {
            sizes.build = files.build.length

            if (!files.minifiedBuild) return callback()
            sizes.minifiedBuild = files.minifiedBuild.length

            zlib.gzip(files.minifiedBuild, function (err, data) {
              if (err) return callback(new CompressionError(err))

              sizes.gzippedMinifiedBuild = data.length
              callback()
            })
          }

        , loadFiles = function (callback) {
            if (files) return callback()

            var tasks = {}

            tasks.build = fs.readFile.bind(null, buildName, 'utf-8')

            if (options.minifier != 'none') {
              tasks.minifiedBuild = fs.readFile.bind(null, buildName.replace(/\.js$/, '.min.js'), 'utf-8')
            }

            async.parallel(tasks, function (err, _files) {
              if (err) return callback(new FilesystemError(err))
              files = _files
              callback()
            })
          }

        , loadOptions = function (callback) {
            // If we're the main command, we need to load things from the build
            if (!buildName) {
              buildName = util.getInputFilenameFromOptions(options)
              options = null
            }

            if (options && ids) return callback()

            // read 'Build: ...' and 'Packages: ...' from the head of the build file
            util.parseContext(buildName, function (err, context) {
              if (err) return callback(err)
              options = context.options

              if (!ids) ids = util.packageList(options)
              callback()
            })
          }

      async.series(
          [
              loadOptions
            , loadFiles
            , calculateSizes
            , finish
          ]
        , callback
      )
    }

module.exports.exec = exec
