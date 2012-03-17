var testCase = require('buster').testCase
  , fs = require('fs')
  , async = require('async')
  , path = require('path')
  , functionalCommon = require('./common')

testCase('Functional: remove', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'
    }

  , 'ender build qwery bean bonzo sel; ender remove bonzo sel': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]

      async.waterfall([
          function (callback) {
            functionalCommon.runEnder(
                'build qwery bean bonzo sel'
              , files
              , function (err, dir, fileContents, stdout, stderr) {
                  refute(err)
                  refute(stderr)

                  assert.stdoutRefersToNPMPackages(stdout, 'ender-js qwery bean bonzo sel')
                  assert.stdoutReportsBuildCommand(stdout, 'ender build qwery bean bonzo sel')
                  assert.stdoutReportsOutputSizes(stdout)
                  assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
                  assert.hasVersionedPackage(stdout, 'bean', 'stdout')
                  assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
                  assert.hasVersionedPackage(stdout, 'sel', 'stdout')

                  fileContents.forEach(function (contents, i) {
                    assert.match(contents, /Build: ender build qwery bean bonzo sel$/m, files[i] + ' contains correct build command')
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
                    , function (err) { callback(err, dir) }
                  )
                }
            )
          }
        , function (dir, callback) {
            functionalCommon.runEnder(
                'remove bonzo sel'
              , files
              , dir
              , function (err, dir, fileContents, stdout, stderr, callback) {
                  refute(err)
                  refute(stderr)

                  assert.stdoutRefersToNPMPackages(stdout, 'ender-js qwery bean')
                  assert.stdoutReportsBuildCommand(stdout, 'ender build qwery bean')
                  assert.stdoutReportsOutputSizes(stdout)
                  assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
                  assert.hasVersionedPackage(stdout, 'bean', 'stdout')

                  fileContents.forEach(function (contents, i) {
                    assert.match(contents, /Build: ender build qwery bean$/m, files[i] + ' contains correct build command')
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
                    , callback.bind(null, done)
                  )
                }
              )
            }
          ], done)
    }
})