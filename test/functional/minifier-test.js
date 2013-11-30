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


var buster           = require('bustermove')
  , assert           = require('referee').assert
  , refute           = require('referee').refute
  , fs                = require('fs')
  , async             = require('async')
  , path              = require('path')
  , childProcess      = require('child_process')
  , xregexp           = require('xregexp').XRegExp
  , functionalCommon  = require('./common')

  , javaVersionRe     = /\W1\.\d\.\d/

buster.testCase('Functional: minify', {
    'setUp': function (done) {
      this.timeout = 120000
      childProcess.exec('java -version', function (err, stdout, stderr) {
        this.javaAvailable =
            !err && (javaVersionRe.test(stderr.toString()) || javaVersionRe.test(stdout.toString()))
        if (err) {
          require('colors')
          console.log('\nWARNING: java not available on this system, can\'t test Closure'.magenta.bold.inverse)
        }
        done()
      }.bind(this))
    }

  , 'ender build qwery bonzo bean --minifier <all>': function (done) {
      assert.match.message = '${2}'
      this.timeout = 120000

      var buildCmd = 'build qwery bonzo bean --minifier '
        , mkbuild  = function (cmdend, files) {
            return function (callback) {
              var cmd = buildCmd + cmdend
              functionalCommon.runEnder(
                  cmd
                , files
                , function (err, dir, fileContents, stdout, stderr) {
                    callback(null, {
                        err           : err
                      , dir           : dir
                      , fileContents  : fileContents
                      , stdout        : stdout
                      , stderr        : stderr
                      , files         : files
                      , cmd           : cmd
                    })
                  }
              )
            }
          }
        , jobs = {
              'none'   : mkbuild('none --output none', [ 'none.js' ])
            , 'uglify' : mkbuild('uglify --output uglify', [ 'uglify.js', 'uglify.min.js' ])
          }

      if (this.javaAvailable) {
        jobs['closure-w'] = mkbuild('closure --level whitespace --output closure-w', [ 'closure-w.js', 'closure-w.min.js' ])
        jobs['closure-s'] = mkbuild('closure --level simple --output closure-s', [ 'closure-s.js', 'closure-s.min.js' ])
        jobs['closure-a'] = mkbuild('closure --level advanced --output closure-a', [ 'closure-a.js', 'closure-a.min.js' ])
      }

      async.parallel(
          jobs
        , function (err, data) {
            Object.keys(jobs).forEach(function (build) {
              refute(data[build].err)

              refute(data[build].stderr, build + ': ' + data[build].stderr)

              assert.stdoutRefersToNPMPackages(data[build].stdout, 'ender-core ender-commonjs qwery bonzo bean')
              assert.stdoutReportsBuildCommand(data[build].stdout, data[build].cmd)
              ; (build == 'none' ? refute : assert).stdoutReportsOutputSizes(data[build].stdout)
              assert.hasVersionedPackage(data[build].stdout, 'qwery', 'stdout')
              assert.hasVersionedPackage(data[build].stdout, 'bonzo', 'stdout')
              assert.hasVersionedPackage(data[build].stdout, 'bean', 'stdout')

              assert(data[build].fileContents, 'build ' + build + ' has file contents')
              data[build].fileContents.forEach(function (contents, i) {
                assert.match(
                    contents
                  , new RegExp('Build: ender ' + xregexp.escape(data[build].cmd) + '$', 'm')
                  , data[build].files[i] + ' contains correct build command: [' + data[build].cmd + ']'
                )
                if (build != 'closure-a') {
                  assert.sourceContainsPackages(contents, 3, data[build].files[i])
                }
                assert.hasVersionedPackage(contents, 'qwery', data[build].files[i])
                assert.hasVersionedPackage(contents, 'bean', data[build].files[i])
                assert.hasVersionedPackage(contents, 'bonzo', data[build].files[i])
              })
            })

            // non minified files should be roughly the same size, give or take a bit due to build cmd at the top and the sourceMapping reference at the end
            assert.equals(data.none.fileContents[0].length, data.uglify.fileContents[0].length - 6)
            if (this.javaAvailable) {
              assert.equals(data.none.fileContents[0].length, data['closure-w'].fileContents[0].length - 32)
              assert.equals(data.none.fileContents[0].length, data['closure-s'].fileContents[0].length - 28)
              assert.equals(data.none.fileContents[0].length, data['closure-a'].fileContents[0].length - 30)
            }

            // lets shoot for at least 60% compression
            assert(data.uglify.fileContents[1].length < data.uglify.fileContents[0].length * 0.6)
            if (this.javaAvailable) {
              assert(data['closure-w'].fileContents[1].length < data['closure-w'].fileContents[0].length * 0.6)
              assert(data['closure-s'].fileContents[1].length < data['closure-s'].fileContents[0].length * 0.6)
              assert(data['closure-a'].fileContents[1].length < data['closure-a'].fileContents[0].length * 0.6)

              // closure simple should be at least 90% the size of closure whitespace
              assert(data['closure-s'].fileContents[1].length < data['closure-w'].fileContents[1].length * 0.9)
              // closure advanced should be at least 90% the size of closure simple
              assert(data['closure-a'].fileContents[1].length < data['closure-s'].fileContents[1].length * 0.9)
            }

            // shouldn't make a .min.js for none
            fs.exists(path.join(data.none.dir, 'none.min.js'), function (exists) {
              refute(exists, 'no minified file for --minifier none')
              done()
            })
          }.bind(this)
      )
    }
})