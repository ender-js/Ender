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
  , enderPackage  = require('ender-package')
  , util          = require('./util')
  , mainBuildUtil = require('./main-build-util')
  , mainInfoUtil  = require('./main-info-util')
  , parseContext  = require('./parse-context')

  , generateAndPrint = function (out, filename, options, ids, callback) {
      var loadSizesAndFinish = function (callback) {
            mainInfoUtil.sizes(options, filename, function (err, sizes) {
              if (err) return callback(err) // wrapped in main-info-util.js

              // build an `archy` tree representing the packages in the build
              enderPackage.buildArchyTree(ids, true, function (err, archyTree) {
                if (err) return callback(err) // wrapped in ender-package
                out.buildInfo(filename, options, sizes, archyTree)
                callback()
              })
            })
          }
          
        , loadOptions = function (callback) {
            if (options && ids) return callback()
            
            // read 'Build: ...' and 'Packages: ...' from the head of the build file
            parseContext(filename, function (err, context) {
              if (err) return callback(err) // wrapped in source-build.js
              options = context.options

              if (!ids) ids = mainBuildUtil.packageList(options)
              callback()
            })
          }
      
      async.series(
          [
              loadOptions
            , loadSizesAndFinish
          ]
        , callback
      )
    }

  , exec = function (args, out, callback) {
      generateAndPrint(
          out
        , util.getInputFilenameFromOptions(args)
        , null // no options, read them from build file
        , null // no packages, read them from build file
        , callback
      )
    }

module.exports = {
    exec             : exec
  , generateAndPrint : generateAndPrint
}