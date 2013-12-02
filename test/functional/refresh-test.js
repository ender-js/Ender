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
  , fs               = require('fs')
  , async            = require('async')
  , path             = require('path')
  , rimraf           = require('rimraf')
  , functionalCommon = require('./common')

buster.testCase('Functional: refresh', {
    'setUp': function () {
      this.timeout = 120000
      assert.match.message = '${2}'

      this.runTest = function (use, rmdir, done) {
        var files = [ (use || 'ender') + '.js', (use || 'ender') + '.min.js' ]
          , firstQweryTs
          , testBuild = function (callback, err, dir, fileContents, stdout, stderr) {
              refute(err)
              refute(stderr)

              assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs qwery bean')
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
                assert.sourceContainsPackages(contents, 2, files[i])
                assert.hasVersionedPackage(contents, 'qwery', files[i])
                assert.hasVersionedPackage(contents, 'bean', files[i])
                assert.sourceHasPackage(contents, 'qwery', files[i])
                assert.sourceHasPackage(contents, 'bean', files[i])
                assert.sourceHasRequire(contents, 'qwery', files[i])
                assert.sourceHasRequire(contents, 'bean', files[i])
                assert.sourceHasRequire(contents, 'qwery/src/ender', files[i])
                assert.sourceHasRequire(contents, 'bean/src/ender', files[i])

                assert.sourceHasPackagesInOrder(contents, 'qwery', 'bean', files[i])
              })

              functionalCommon.verifyNodeModulesDirectories(
                  dir
                , 'ender-core ender-commonjs qwery bean'.split(' ')
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
              fs.stat(path.join(dir, 'node_modules', 'qwery', 'qwery.js' ), function (err, stat) {
                if (err) return callback(err)
                firstQweryTs = stat.ctime
                callback(null, dir)
              })
            }
          , function (dir, callback) {
              if (rmdir) rimraf(path.join(dir, 'node_modules'), callback.bind(null, dir))
              else       callback(null, dir)
            }
          , function (dir, callback) {
              functionalCommon.runEnder(
                  'refresh' + (use ? ' --use ' + use : '')
                , files
                , dir
                , testBuild.bind(null, callback)
              )
            }
          , function (dir, callback) {
              fs.stat(path.join(dir, 'node_modules', 'qwery', 'qwery.js' ), function (err, stat) {
                if (err) return callback(err)
                assert(stat.ctime.getTime() > firstQweryTs.getTime(), 'qwery was reinstalled')
                callback(null)
              })
            }
          ], done
        )
      }
    }

  , '`ender build qwery bean; ender refresh`': function (done) {
      this.runTest(false, true, done)
    }

  , '`ender build qwery bean --output foobar; ender refresh --use foobar`': function (done) {
      this.runTest('foobar', true, done)
    }

  , '`ender build qwery bean; ender refresh` (don\'t clear node_modules)': function (done) {
      // this is to test that --force-install is used
      this.runTest(false, false, done)
    }
})
