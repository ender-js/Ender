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

const extend            = require('util')._extend
    , childProcess      = require('child_process')
    , path              = require('path')

    , MinifyError       = require('../errors').MinifyError


    , closureJar        = 'closure_v20131118.jar'
    , jarPath           = path.resolve(__dirname, '..', '..', 'support', closureJar)
    , javaCmd           = 'java'
    , levels            = {
                              whitespace : 'WHITESPACE_ONLY'
                            , simple     : 'SIMPLE_OPTIMIZATIONS'
                            , advanced   : 'ADVANCED_OPTIMIZATIONS'
                          }
    , reMultiComments   = /\/\*!([\s\S]*?)\*\//g
    , token             = 'Ender: preserved comment block'
    , reTokens          = RegExp('(\\/*\\n*\\s*)?' + token, 'g')


var minify = function (files, filenames, options, callback) {
      var comments  = []
        , stdin     = files.build.replace(reMultiComments, function(full, comment) {
                        comments.push(comment)
                        return '/** @preserve ' + token + '*/'
                      })
        , stdout    = ''
        , stderr    = ''
        , javaArgs  = ['-jar', jarPath]
        , child

      if (levels.hasOwnProperty(options.level))
        javaArgs.push('--compilation_level=' + levels[options.level])

      if (filenames.minifiedSourceMap)
        javaArgs.push('--create_source_map=' + filenames.minifiedSourceMap)

      if (options.externs)
        javaArgs.concat(options.externs.map(function (e) { return '--externs=' + e }))

      child = childProcess.spawn(javaCmd, javaArgs)

      child.stdout.on('data', function (data) {
        stdout += data.toString('utf-8')
      })

      child.stderr.on('data', function (data) {
        stderr += data.toString('utf-8')
      })

      child.on('exit', function (code, signal) {
        var err
        if (code !== 0) {
          err = new MinifyError('Child process exited on signal: ' + signal)
          err.stderr = stderr
          return callback(err)
        }
        stdout = stdout.replace(reTokens, function() {
          return '\n' + comments.shift().replace(/(^[\n\s]+)|([\n\s]+$)/g, '')
        })

        files.minifiedBuild = stdout
        callback(null, files)
      })

      child.stdin.write(stdin, 'utf-8')
      child.stdin.end()
    }

module.exports = minify
extend(module.exports, {
    levels  : Object.keys(levels)
  , jarPath : jarPath
})
