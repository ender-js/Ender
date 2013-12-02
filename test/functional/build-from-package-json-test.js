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

buster.testCase('Functional: build from package.json', {
    'setUp': function () {
      this.timeout = 120000
      assert.match.message = '${2}'
      refute.match.message = '${2}'
    }

    // install qwery and bean using a package.json file
  , '`ender build .`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build .'
        , {
              fixtureFiles: {
                  'package.json': functionalCommon.fixturePackageJSON({
                      name: 'test-package'
                    , main: 'main.js'
                    , dependencies: {
                          'qwery' : '3.0.0'
                        , 'bean'  : '0.3.0'
                      }
                  })
                , 'main.js': '// Main file'
              }
            , expectedFiles: files
          }
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs .')
            assert.stdoutReportsBuildCommand(stdout, 'ender build .')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build .$/m
                , files[i] + ' contains correct build command'
              )

              assert.sourceContainsPackages(contents, 3, files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'test-package', files[i])
              assert.sourceHasPackage(contents, 'qwery', files[i])
              assert.sourceHasPackage(contents, 'bean', files[i])
              assert.sourceHasPackage(contents, 'test-package', files[i])
              assert.sourceHasRequire(contents, 'qwery', files[i])
              assert.sourceHasRequire(contents, 'bean', files[i])
              assert.sourceHasRequire(contents, 'test-package', files[i])
              assert.sourceHasRequire(contents, 'qwery/src/ender', files[i])
              assert.sourceHasRequire(contents, 'bean/src/ender', files[i])

              assert.sourceHasPackagesInOrder(contents, 'bean', 'test-package', files[i])
              assert.sourceHasPackagesInOrder(contents, 'qwery', 'test-package', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-core ender-commonjs qwery bean'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})