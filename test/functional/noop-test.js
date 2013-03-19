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
  , reMultiComments  = /\/\*![\s\S]*?\*\//g

buster.testCase('Functional: build with noop', {
    'setUp': function () {
      this.timeout = 120000
      assert.match.message = '${2}'
      refute.match.message = '${2}'
    }

    // jeesh is a virtual package that we expect to pull in 5 actual packages
  , '`ender build qwery bean --noop`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build qwery bean --noop'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'qwery bean')
            assert.stdoutReportsBuildCommand(stdout, 'ender build qwery bean --noop')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build qwery bean --noop$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceContainsProvideStatements(contents, 0, files[i]) // -noop shouldn't give us provide()
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'qwery', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])

              // this is the important bit, strip out comments and there shouldn't be a mention
              // of 'ender' although this may cange in qwery and bean, perhaps it's best to use
              // something like underscore
              contents = contents.replace(reMultiComments, '')
              refute.match(contents, /\Wender\W/, 'file does not contain reference to "ender"')
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'qwery bean'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})