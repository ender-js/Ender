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

buster.testCase('Functional: build / dependencies', {
    'setUp': function () {
      this.timeout = 240000
      assert.match.message = '${2}'
    }

    // jeesh is a virtual package that we expect to pull in 5 actual packages
  , '`ender build jeesh`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build jeesh'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs jeesh')
            assert.stdoutReportsBuildCommand(stdout, 'ender build jeesh')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'jeesh', 'stdout')
            assert.hasVersionedPackage(stdout, 'domready', 'stdout')
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
            assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(contents, /Build: ender build jeesh$/m, files[i] + ' contains correct build command')
              assert.sourceContainsPackages(contents, 4, files[i])
              assert.hasVersionedPackage(contents, 'domready', files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'bonzo', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.sourceHasPackage(contents, 'domready', files[i])
              assert.sourceHasPackage(contents, 'qwery', files[i])
              assert.sourceHasPackage(contents, 'bonzo', files[i])
              assert.sourceHasPackage(contents, 'bean', files[i])
              assert.sourceHasRequire(contents, 'domready', files[i])
              assert.sourceHasRequire(contents, 'qwery', files[i])
              assert.sourceHasRequire(contents, 'bonzo', files[i])
              assert.sourceHasRequire(contents, 'bean', files[i])
              assert.sourceHasRequire(contents, 'domready/src/ender', files[i])
              assert.sourceHasRequire(contents, 'qwery/src/ender', files[i])
              assert.sourceHasRequire(contents, 'bonzo/src/ender', files[i])
              assert.sourceHasRequire(contents, 'bean/src/ender', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-core ender-commonjs jeesh'.split(' ')
              , callback.bind(null, done)
            )
        })
    }

/*
Both sel and dagron have simple dependencies that we expect to pull in but we don't want duplicates
so if we include bean at the top level we should see it once in our build file.

  ┬─┬ sel
  │ └── es5-basic
  ├── bean
  └─┬ dagron
    ├── bean
    └── qwery
*/

  , '`ender build sel bean dagron`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build sel bean dagron'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs sel bean dagron')
            assert.stdoutReportsBuildCommand(stdout, 'ender build sel bean dagron')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'sel', 'stdout')
            assert.hasVersionedPackage(stdout, 'es5-basic', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')
            assert.hasVersionedPackage(stdout, 'dagron', 'stdout')
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(contents, /Build: ender build sel bean dagron$/m, files[i] + ' contains correct build command')
              assert.sourceContainsPackages(contents, 5, files[i])
              assert.hasVersionedPackage(contents, 'sel', files[i])
              assert.hasVersionedPackage(contents, 'es5-basic', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'dagron', files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              // sel & es5-basic don't have the standard wrapper pattern
              assert.sourceHasPackage(contents, 'sel', files[i])
              assert.sourceHasPackage(contents, 'es5-basic', files[i])
              assert.sourceHasPackage(contents, 'bean', files[i])
              // dagron doesn't have the standard wrapper pattern
              assert.sourceHasPackage(contents, 'dagron', files[i])
              assert.sourceHasPackage(contents, 'qwery', files[i])

              // check they are in order, we only care about the following ordering pairs:
              assert.sourceHasPackagesInOrder(contents, 'es5-basic', 'sel', files[i])
              assert.sourceHasPackagesInOrder(contents, 'bean', 'dagron', files[i])
              assert.sourceHasPackagesInOrder(contents, 'qwery', 'dagron', files[i])
              // check that they are in the order specified on the commandline
              assert.sourceHasPackagesInOrder(contents, 'sel', 'dagron', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-core ender-commonjs sel bean dagron'.split(' ')
              , callback.bind(null, done)
            )
        })
    }

/*
 The ender-bootstrap-* packages have a more complex dependency tree and have dependencies that
 pull in dependencies. The tree looks something like this:
  ┬ ender-bootstrap-popover
  ├─┬ ender-bootstrap-base
  │ ├── bowser
  │ ├── bonzo
  │ ├── domready
  │ ├── bean
  │ └── qwery
  ├─┬ ender-bootstrap-transition
  │ └─┬ ender-bootstrap-base
  │   └── ...
  └─┬ ender-bootstrap-tooltip
    └─┬ ender-bootstrap-base
      └── ...
*/
  , '`ender build ender-bootstrap-popover`': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build ender-bootstrap-popover@2.0.2'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-core ender-commonjs ender-bootstrap-popover@2.0.2')
            assert.stdoutReportsBuildCommand(stdout, 'ender build ender-bootstrap-popover@2.0.2')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'ender-bootstrap-popover', 'stdout')
            assert.hasVersionedPackage(stdout, 'ender-bootstrap-base', 'stdout')
            assert.hasVersionedPackage(stdout, 'bowser', 'stdout')
            assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
            assert.hasVersionedPackage(stdout, 'domready', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
            assert.hasVersionedPackage(stdout, 'ender-bootstrap-transition', 'stdout')
            assert.hasVersionedPackage(stdout, 'ender-bootstrap-tooltip', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build ender-bootstrap-popover@2.0.2$/m
                , files[i] + ' contains correct build command'
              )
              assert.sourceContainsPackages(contents, 9, files[i])
              assert.hasVersionedPackage(contents, 'ender-bootstrap-popover', files[i])
              assert.hasVersionedPackage(contents, 'ender-bootstrap-base', files[i])
              assert.hasVersionedPackage(contents, 'bowser', files[i])
              assert.hasVersionedPackage(contents, 'bonzo', files[i])
              assert.hasVersionedPackage(contents, 'domready', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'ender-bootstrap-transition', files[i])
              assert.hasVersionedPackage(contents, 'ender-bootstrap-tooltip', files[i])
              // the ender-bootstrap packages don't have the standard wrapper pattern
              assert.sourceHasPackage(contents, 'bowser', files[i])
              assert.sourceHasPackage(contents, 'domready', files[i])
              assert.sourceHasPackage(contents, 'qwery', files[i])
              assert.sourceHasPackage(contents, 'bonzo', files[i])
              assert.sourceHasPackage(contents, 'bean', files[i])

              // check they are in order, we only care about the following ordering pairs:
              assert.sourceHasPackagesInOrder(contents, 'ender-bootstrap-transition', 'ender-bootstrap-popover', files[i])
              assert.sourceHasPackagesInOrder(contents, 'ender-bootstrap-tooltip', 'ender-bootstrap-popover', files[i])
              assert.sourceHasPackagesInOrder(contents, 'ender-bootstrap-base', 'ender-bootstrap-popover', files[i])
              assert.sourceHasPackagesInOrder(contents, 'ender-bootstrap-base', 'ender-bootstrap-transition', files[i])
              assert.sourceHasPackagesInOrder(contents, 'ender-bootstrap-base', 'ender-bootstrap-tooltip', files[i])
              assert.sourceHasPackagesInOrder(contents, 'bowser', 'ender-bootstrap-base', files[i])
              assert.sourceHasPackagesInOrder(contents, 'bonzo', 'ender-bootstrap-base', files[i])
              assert.sourceHasPackagesInOrder(contents, 'domready', 'ender-bootstrap-base', files[i])
              assert.sourceHasPackagesInOrder(contents, 'bean', 'ender-bootstrap-base', files[i])
              assert.sourceHasPackagesInOrder(contents, 'qwery', 'ender-bootstrap-base', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-core ender-commonjs ender-bootstrap-popover'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})
