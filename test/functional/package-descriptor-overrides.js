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
  , functionalCommon = require('./common')

buster.testCase('Functional: package descriptor overrides', {
    'setUp': function () {
      this.timeout = 120000
      assert.match.message = '${2}'

      this.runTest = function (pkg, expectedIncludes, expectedName, contentsAsserts, done) {
        var files = [ 'ender.js', 'ender.min.js' ]
        functionalCommon.runEnder(
            'build ' + pkg
          , files
          , function (err, dir, fileContents, stdout, stderr) {
              refute(err)
              refute(stderr)

              assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs ' + pkg) //TODO: would be nice to see bean on stdout
              assert.stdoutReportsBuildCommand(stdout, 'ender build ' + pkg)
              assert.stdoutReportsOutputSizes(stdout)
              expectedIncludes.forEach(function (incl) {
                assert.hasVersionedPackage(stdout, incl, 'stdout')
              })
              assert.hasVersionedPackage(stdout, pkg, 'stdout')

              fileContents.forEach(function (contents, i) {
                assert.match(
                    contents
                  , new RegExp('Build: ender build ' + pkg, 'm')
                  , files[i] + ' contains correct build command'
                )
                // should only have the 2 provide()s, not bonzo which is in the parent deps
                assert.sourceContainsPackages(contents, 2, files[i])
                expectedIncludes.forEach(function (incl) {
                  assert.hasVersionedPackage(contents, incl, files[i])
                  assert.sourceHasPackage(contents, incl, files[i])
                  assert.sourceHasRequire(contents, incl, files[i])
                })
                // should refer to proper name here
                assert.hasVersionedPackage(contents, pkg, files[i])
                // name rewritten name for provide()
                assert.sourceHasPackage(contents, expectedName, files[i])
                assert.sourceHasRequire(contents, expectedName, files[i])
                assert.sourceHasPackagesInOrder(contents, expectedIncludes[0], expectedName, files[i])

                contentsAsserts(contents, files[i])
              })

              functionalCommon.verifyNodeModulesDirectories(
                  dir
                , [ 'ender-core', 'ender-commonjs' ].concat(expectedIncludes).concat([ pkg ])
                , function (err) {
                    refute(err)
                    done()
                  }
              )
            }
        )
      }
    }

  , 'endr-test-1: rewrite name, main, bridge, deps': function (done) {
      this.runTest(
          'endr-test-1'
        , [ 'bean' ]
        , 'mynewname'
        , function (contents, filename) {
            // override main
            assert.match(contents, /"main: should be included"/, 'has correct main source in ' + filename)
            refute.match(contents, /"should not be included"/, 'doesn\'t have incorrect main in ' + filename)
            // override bridge/ender which otherwise didn't exist
            assert.match(contents, /"bridge: should be included"/, 'has correct bridge source in ' + filename)
          }
        , done
      )
    }

  , 'endr-test-2: rewrite deps only': function (done) {
      this.runTest(
          'endr-test-2'
        , [ 'traversty' ]
        , 'endr-test-2'
        , function (contents, filename) {
            // override main
            assert.match(contents, /"should be included"/, 'has correct main source in ' + filename)
          }
        , done
      )
    }
})