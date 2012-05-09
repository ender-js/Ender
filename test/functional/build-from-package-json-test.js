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
  , path = require('path')
  , functionalCommon = require('./common')

testCase('Functional: build from package.json', {
    'setUp': function () {
      this.timeout = 30000
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
                    , dependencies: [ 'qwery@3.0.0', 'bean@0.3.0' ]
                  })
                , 'main.js': '// Main file'
              }
            , expectedFiles: files
          }
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js .')
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
              assert.sourceContainsProvideStatements(contents, 3, files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'test-package', files[i])
              assert.sourceHasProvide(contents, 'qwery', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'qwery', files[i])
              assert.sourceHasProvide(contents, 'bean', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])
              assert.sourceHasProvide(contents, 'test-package', files[i])

              assert.sourceHasProvidesInOrder(contents, 'bean', 'test-package', files[i])
              assert.sourceHasProvidesInOrder(contents, 'qwery', 'test-package', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js qwery bean'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})