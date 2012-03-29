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


var testCase = require('buster').testCase
  , fs = require('fs')
  , async = require('async')
  , path = require('path')
  , rimraf = require('rimraf')
  , functionalCommon = require('./common')

testCase('Functional: refresh', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'

      this.runTest = function (use, done) {
        var files = [ (use || 'ender') + '.js', (use || 'ender') + '.min.js' ]
          , testBuild = function (callback, err, dir, fileContents, stdout, stderr) {
              refute(err)
              refute(stderr)

              assert.stdoutRefersToNPMPackages(stdout, 'ender-js qwery bean')
              assert.stdoutReportsBuildCommand(stdout, 'ender build qwery bean' + (use ? ' --output ' + use : ''))
              assert.stdoutReportsOutputSizes(stdout)
              assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
              assert.hasVersionedPackage(stdout, 'bean', 'stdout')

              fileContents.forEach(function (contents, i) {
                assert.match(
                    contents
                  , new RegExp('Build: ender build qwery bean' + (use ? ' --output ' + use : '') + '$', 'm')
                  , files[i] + ' contains correct build command'
                )
                assert.sourceContainsProvideStatements(contents, 2, files[i])
                assert.hasVersionedPackage(contents, 'qwery', files[i])
                assert.hasVersionedPackage(contents, 'bean', files[i])
                assert.sourceHasStandardWrapFunction(contents, 'qwery', files[i])
                assert.sourceHasProvide(contents, 'qwery', files[i])
                assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])
                assert.sourceHasProvide(contents, 'bean', files[i])

                assert.sourceHasProvidesInOrder(contents, 'qwery', 'bean', files[i])
              })

              functionalCommon.verifyNodeModulesDirectories(
                  dir
                , 'ender-js qwery bean'.split(' ')
                , function (err) { callback(err, dir) }
              )
            }

        async.waterfall([
            function (callback) {
              functionalCommon.runEnder(
                  'build qwery bean' + (use ? ' --output ' + use : '')
                , files
                , testBuild.bind(null, callback)
              )
            }
          , function (dir, callback) {
              rimraf(path.join(dir, 'node_modules'), callback.bind(null, dir))
            }
          , function (dir, callback) {
              functionalCommon.runEnder(
                  'refresh' + (use ? ' --use ' + use : '')
                , files
                , dir
                , testBuild.bind(null, callback)
              )
            }
          ], done
        )
      }
    }

  , '`ender build qwery bean; ender refresh`': function (done) {
      this.runTest(false, done)
    }

  , '`ender build qwery bean --output foobar; ender refresh --use foobar`': function (done) {
      this.runTest('foobar', done)
    }
})
