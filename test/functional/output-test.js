var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , functionalCommon = require('./common')

testCase('Functional: build output', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'
    }

    // jeesh is a virtual package that we expect to pull in 5 actual packages
  , 'ender build bonzo bean --output foobar': function (done) {
      var files = [ 'foobar.js', 'foobar.min.js' ]
      functionalCommon.runEnder(
          'build bonzo bean --output foobar'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js bonzo bean')
            assert.stdoutReportsBuildCommand(stdout, 'ender build bonzo bean --output foobar')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(
                  contents
                , /Build: ender build bonzo bean --output foobar$/m
                , files[i] + ' contains correct build command')
              assert.sourceContainsProvideStatements(contents, 2, files[i])
              assert.hasVersionedPackage(contents, 'bonzo', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bonzo', files[i])
              assert.sourceHasProvide(contents, 'bonzo', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])
              assert.sourceHasProvide(contents, 'bean', files[i])

              assert.sourceHasProvidesInOrder(contents, 'bonzo', 'bean', files[i])
            })

            functionalCommon.verifyNodeModulesDirectories(
                dir
              , 'ender-js bonzo bean'.split(' ')
              , callback.bind(null, done)
            )
        })
    }
})