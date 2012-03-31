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

var async = require('async')
  , util = require('./util')
  , mainBuildUtil = require('./main-build-util')
  , mainInfoUtil = require('./main-info-util')

  , generateAndPrint = function (args, out, filename, options, packages, tree, callback) {
      // the 2 main processes here is generateSpec() to read the build context from the
      // build file and construct a dependency tree from what we read, and generateSizes()
      // that gives us the raw, minified and gzipped sizes.
      var generateSpec = function (callback) {
            // if generateAndPrint() has been called from a module with existing options,
            // packages and dependency tree data we can skip the difficult part and return
            if (options && packages && tree) {
              return callback(null, {
                  context: {
                      options: options
                    , packages: packages
                  }
                , tree: tree
              })
            }

            // read 'Build: ...' and 'Packages: ...' from the head of the build file
            mainInfoUtil.parseContext(filename, function (err, context) {
              if (err)
                return callback(err) // wrapped in source-build.js

              // same process to build a dependency tree as in the original build
              mainBuildUtil.constructDependencyTree(context.options.packages, function (err, tree) {
                if (err)
                  return callback(err) // wrapped in package-util.js

                callback(null, {
                    context: context
                  , tree: tree
                })
              })
            })
          }

        , generateSizes = mainInfoUtil.sizes.bind(null, filename)

        , finish = function (err, data) {
            if (err)
              return callback(err) // wrapped through generateSpec and generateSizes

            var tree = data.spec.tree
              , context = data.spec.context
                // build an `archy` compatible tree representing the packages in the build
              , archyTree = mainInfoUtil.buildArchyTree(context.options.packages, tree)

            out.buildInfo(filename, context.options, context.packages, data.sizes, archyTree)
            callback()
          }

      //TODO: should perform a path.exists() on the file(s) we're going to check, otherwise we get a
      // random error from one of the fs read operations above
      async.parallel({
          spec: generateSpec
        , sizes: generateSizes
      }, finish)
    }

  , exec = function (args, out, callback) {
      generateAndPrint(
          args
        , out
        , util.getInputFilenameFromOptions(args)
        , null // no options, read them from build file
        , null // no packages, read them from build file
        , null // no dep tree, construct it yourself buddy
        , callback
      )
    }

module.exports = {
    exec: exec
  , generateAndPrint: generateAndPrint
}