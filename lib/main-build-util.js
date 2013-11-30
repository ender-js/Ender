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

const defaultClientLib = 'ender-core'
    , defaultModuleLib = 'ender-commonjs'


var getCorePackages = function (options) {
      var corePackages = []

      if (options['client-lib'] != 'none')
        corePackages.push(options['client-lib'] || defaultClientLib)

      if (options['module-lib'] != 'none')
        corePackages.push(options['module-lib'] || defaultModuleLib)

      return corePackages
    }

  , packageList = function (options) {
      var ids = options.packages && options.packages.length ? options.packages : [ '.' ]
      return getCorePackages(options).concat(ids)
    }


module.exports = {
    getCorePackages : getCorePackages
  , packageList     : packageList
}