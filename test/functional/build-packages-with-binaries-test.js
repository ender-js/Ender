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

buster.testCase('Functional: build packages that contain binaries', {
    'setUp': function () {
      this.timeout = 120000
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
  , '`ender build tracer-bullet@0.0.0 long-stack-traces@0.1.2`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build tracer-bullet@0.0.0 long-stack-traces@0.1.2'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs tracer-bullet@0.0.0 long-stack-traces@0.1.2')
            assert.stdoutReportsBuildCommand(stdout, 'ender build tracer-bullet@0.0.0 long-stack-traces@0.1.2')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'tracer-bullet', 'stdout')
            assert.hasVersionedPackage(stdout, 'long-stack-traces', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build tracer-bullet@0.0.0 long-stack-traces@0.1.2$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceHasPackage(contents, 'long-stack-traces', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-core ender-commonjs tracer-bullet long-stack-traces .bin'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})