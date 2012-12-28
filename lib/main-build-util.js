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
 * Simple utilities for main-build
 */

var packageUtil     = require('ender-repository').util
  , DependencyGraph = require('ender-dependency-graph')

    // unique packages by proper name
var uniquePackages = function (packages) {
      var have = []

      return packages.filter(function (p) {
        var name = packageUtil.cleanName(p)

        if (have.indexOf(name) == -1) {
          have.push(name)
          return true
        }
      })
    }

  , isRootPackage = function (options, p) {
      if (options.noop || options.sans) return false
      return packageUtil.cleanName(p) === DependencyGraph.getClientPackageName(options)
    }

    // given a list of packages, provide a sanitised list without duplicates and with
    // the root package at the start.
  , packageList = function (options) {
      var packages = options.packages && options.packages.length ? options.packages : [ '.' ]

      if (!options.noop && !options.sans) packages = [ DependencyGraph.getClientPackageName(options) ].concat(packages)
      return uniquePackages(packages)
    }

module.exports = {
    packageList                    : packageList
  , uniquePackages                 : uniquePackages
  , isRootPackage                  : isRootPackage
}