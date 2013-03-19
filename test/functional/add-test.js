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
  , async            = require('async')
  , functionalCommon = require('./common')

buster.testCase('Functional: add', {
    'setUp': function () {
      this.timeout = 120000
      assert.match.message = '${2}'

      this.runTest = function (use, done) {
        var files = [ (use || 'ender') + '.js', (use || 'ender') + '.min.js' ]

        async.waterfall([
            function (callback) {
              functionalCommon.runEnder(
                  'build qwery bean' + (use ? ' --output ' + use : '')
                , files
                , function (err, dir, fileContents, stdout, stderr) {
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
              )
            }
          , function (dir, callback) {
              functionalCommon.runEnder(
                  'add bonzo sel' + (use ? ' --use ' + use : '')
                , files
                , dir
                , function (err, dir, fileContents, stdout, stderr, callback) {
                    refute(err)
                    refute(stderr)

                    assert.stdoutRefersToNPMPackages(stdout, 'ender-js qwery bean bonzo sel')
                    assert.stdoutReportsBuildCommand(stdout, 'ender build qwery bean bonzo sel' + (use ? ' --output ' + use : ''))
                    assert.stdoutReportsOutputSizes(stdout)
                    assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
                    assert.hasVersionedPackage(stdout, 'bean', 'stdout')
                    assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
                    assert.hasVersionedPackage(stdout, 'sel', 'stdout')

                    fileContents.forEach(function (contents, i) {
                      assert.match(
                          contents
                        , new RegExp('Build: ender build qwery bean bonzo sel' + (use ? ' --output ' + use : '') + '$', 'm')
                        , files[i] + ' contains correct build command'
                      )
                      assert.sourceContainsProvideStatements(contents, 5, files[i])
                      assert.hasVersionedPackage(contents, 'qwery', files[i])
                      assert.hasVersionedPackage(contents, 'bean', files[i])
                      assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
                      assert.hasVersionedPackage(stdout, 'es5-basic', 'stdout')
                      assert.hasVersionedPackage(stdout, 'sel', 'stdout')
                      assert.sourceHasStandardWrapFunction(contents, 'qwery', files[i])
                      assert.sourceHasProvide(contents, 'qwery', files[i])
                      assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])
                      assert.sourceHasProvide(contents, 'bean', files[i])
                      assert.sourceHasStandardWrapFunction(contents, 'bonzo', files[i])
                      assert.sourceHasProvide(contents, 'bonzo', files[i])
                      assert.sourceHasProvide(contents, 'es5-basic', files[i])
                      assert.sourceHasProvide(contents, 'sel', files[i])

                      assert.sourceHasProvidesInOrder(contents, 'qwery', 'bean', files[i])
                      assert.sourceHasProvidesInOrder(contents, 'bean', 'bonzo', files[i])
                      assert.sourceHasProvidesInOrder(contents, 'bonzo', 'es5-basic', files[i])
                      assert.sourceHasProvidesInOrder(contents, 'es5-basic', 'sel', files[i])
                    })

                    functionalCommon.verifyNodeModulesDirectories(
                        dir
                      , 'ender-js qwery bean bonzo sel'.split(' ')
                      , callback.bind(null, done)
                    )
                  }
                )
              }
            ], done
          )
      }
    }

  , '`ender build qwery bean; ender add bonzo sel`': function (done) {
      this.runTest(false, done)
    }

  , '`ender build qwery bean --output foobar; ender add bonzo sel --use foobar`': function (done) {
      this.runTest('foobar', done)
    }
})
