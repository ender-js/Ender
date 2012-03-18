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
 * Utility functions for the main-info module.
 */

var zlib = require('zlib')
  , fs = require('fs')
  , async = require('async')
  , minify = require('./minify')
  , SourceBuild = require('./source-build')
  , mainBuildUtil = require('./main-build-util')

    // given a filename, return the 'raw', 'minified' and 'gzipped' sizes
  , sizes = function (filename, callback) {
      var sizes = {}
          // make a function that async.waterfall() can use
        , mkcb = function (prop, callback) {
            return function (err, data) {
              if (err)
                return callback(err)
              sizes[prop] = data.length
              callback(null, data)
            }
          }

      // note we have to use waterfall cause each one depends on the data of the previous
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

    // a simple interface to SourceBuild.parseContext()
  , parseContext = function (filename, callback) {
      SourceBuild.parseContext(filename, function (err, options, packages) {
        if (err)
          return callback(err)

        callback(null, {
            options: options
          , packages: packages
        })
      })
    }

    // we use `archy` to print the tree (thanks @substack), but we have to turn out
    // dependency tree into an archy-compatible tree.
    // we only do a 1/2 job here and leave it to main-info-output to complete the
    // process and make it perdy.
  , buildArchyTree = function (packages, tree) {
      var archyTree = { label: 'Active packages:', nodes: [] }
        , localPackages = mainBuildUtil.localizePackageList(packages, tree)

      mainBuildUtil.forEachOrderedDependency(localPackages, tree, function (packageName, parents, data, index, first) {
        var archyTreeNode = archyTree
          , found, newNode, regexp

        parents = parents.concat([ packageName ])
        for (var i = 0; i < parents.length; i++) {
          found = false
          regexp = new RegExp('^(.\\[\\d\\dm)?' + parents[i] + '(?:@.*)?$')
          for (var j = 0; j < archyTreeNode.nodes.length; j++) {
            if (regexp.test(archyTreeNode.nodes[j].label)) {
              archyTreeNode = archyTreeNode.nodes[j]
              found = true
              break
            }
          }
          if (!found) {
            archyTreeNode.nodes.push(newNode = { label: parents[i], nodes: [] })
            archyTreeNode = newNode
          }
        }
        if (!archyTreeNode.version) {
          archyTreeNode.version = data.packageJSON.version
          archyTreeNode.description = data.packageJSON.description
          archyTreeNode.first = first
        }
      })

      return archyTree
    }

module.exports = {
    sizes: sizes
  , parseContext: parseContext
  , buildArchyTree: buildArchyTree
}