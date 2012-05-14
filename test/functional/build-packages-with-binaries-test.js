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

testCase('Functional: build packages which contain binaries', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'
      refute.match.message = '${2}'
    }

    /**
     * tax depends on jshint which has binaries. This tests a
     * regression where packages depending on packages containing
     * binaries could not be built since - in this case - the
     * directory `node_modules/tax/node_moules/.bin` (which contains
     * the jshint binary) was regarded as a dependeny of tax.
     */
  , '`ender build tax@0.0.1`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build tax@0.0.1'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js tax@0.0.1')
            assert.stdoutReportsBuildCommand(stdout, 'ender build tax@0.0.1')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'tax', 'stdout')
            assert.hasVersionedPackage(stdout, 'jshint', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build tax@0.0.1$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceHasProvide(contents, 'tax', files[i])
              assert.sourceHasProvide(contents, 'jshint', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js tax'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})