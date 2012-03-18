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
 * A collection of small utilities used throughout the application.
 */

var fs = require('fs')
  , path = require('path')

// thanks to npm for these two, where is our process.tempDir NodeJS?
var tmpDir = process.env.TMPDIR
    || process.env.TMP
    || process.env.TEMP
    || (process.platform === "win32" ? "c:\\windows\\temp" : "/tmp")

  , homeDir = process.platform === "win32"
    ? process.env.USERPROFILE
    : process.env.HOME

  , extend = function (src, dst) {
      Object.getOwnPropertyNames(src).forEach(function (prop) {
        if (!(prop in dst))
          Object.defineProperty(dst, prop, Object.getOwnPropertyDescriptor(src, prop))
      })
      return dst
    }

    // safe mkdir
  , mkdir = function (dir, callback) {
      path.exists(dir, function (exists) {
        if (exists)
          callback()
        else
          fs.mkdir(dir, callback)
      })
    }

    // for the 'use' and 'output' options, default to ender.js
  , getFilenameFromOptions = function (opt) {
      return opt ? opt.replace(/(\.js)?$/, '.js') : 'ender.js'
    }

    // for --use <file>
  , getInputFilenameFromOptions = function (options) {
      return getFilenameFromOptions(options.use)
    }

    // for --output <file>
  , getOutputFilenameFromOptions = function (options) {
      return getFilenameFromOptions(options.output)
    }

module.exports = {
    tmpDir: tmpDir
  , homeDir: homeDir
  , extend: extend
  , mkdir: mkdir
  , getInputFilenameFromOptions: getInputFilenameFromOptions
  , getOutputFilenameFromOptions: getOutputFilenameFromOptions
}