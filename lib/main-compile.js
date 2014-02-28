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
 * 'Compile' executable module, for `ender compile` command. Invokes the Google
 * Closure Compiler to compile down an 'app.js'. Inserts the current ender.js
 * file by default (override location/name with --use <file>) and any other
 * .js files specified on the commandline. Also allows optional --externs to
 * be passed through and an optional --output to specify where the resulting
 * file will be, otherwise it'll append -app.js to the end of the original
 * filename (ender-app.js).
 */

var childProcess      = require('child_process')
  , fs                = require('fs')
  , zlib              = require('zlib')
  , async             = require('async')
  , util              = require('./util')
  , FilesystemError   = require('./errors').FilesystemError
  , CompressionError  = require('./errors').CompressionError
  , ChildProcessError = require('./errors').ChildProcessError

  , javaCmd = 'java -jar {jarPath} --compilation_level {level} {js} {externs} --js_output_file={outfile}'
  , LEVELS = {
        advanced: 'ADVANCED_OPTIMIZATIONS'
      , simple: 'SIMPLE_OPTIMIZATIONS'
      , whitespace: 'WHITESPACE_ONLY'
    }

  , closure = function (args, callback) {
      var infile =  util.getInputFilenameFromOptions(args)
        , outfile = args.output ? args.output.replace(/(\.js)?$/, '.js') : 'ender-app.js'
        , js = [ infile ]
            .concat(args.packages)
            .map(function (p) { return '--js=' + p })
            .join(' ')
        , level = LEVELS[LEVELS.hasOwnProperty(args.level) ? args.level : 'advanced']
        , externs = args.externs
            ? args.externs.map(function (p) { return '--externs=' + p }).join(' ')
            : ''
        , cmd = javaCmd
            .replace('{jarPath}', require('ender-builder/lib/minifiers/closure').jarPath)
            .replace('{outfile}', outfile)
            .replace('{js}', js)
            .replace('{externs}', externs)
            .replace('{level}', level)
            .replace(/\s+/g, ' ')

      childProcess.exec(cmd, function (err) {
        if (err) return callback(new ChildProcessError(err))
        callback(null, outfile)
      })
    }

  , exec = function (args, out, callback) {
      var outfile, rawsize

      out.compiling()

      async.waterfall([
          function (callback) {
            closure(args, function (err, file) {
              if (err)
                return callback(err) // wrapped in closure()
              callback(null, outfile = file)
            })
          }
        , function (file, callback) {
            fs.readFile(file, 'utf-8', function (err, data) {
              if (err)
                return callback(new FilesystemError(err))
              rawsize = data.length
              callback(null, data)
            })
          }
        , function (data, callback) {
            zlib.gzip(data, function (err) {
              if (err)
                return callback(new CompressionError(err))
              callback.apply(null, arguments)
            })
          }
        , function (data, callback) {
            out.compiled(outfile, rawsize, data.length)
            callback()
          }
      ], callback)
    }

module.exports.exec = exec