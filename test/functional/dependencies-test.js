var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , functionalCommon = require('./common')

testCase('Functional: dependencies', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'
    }

  , 'ender build jeesh': function (done) {
      var files = [ 'ender.js', 'ender.min.js' ]
      functionalCommon.runEnder(
          'build jeesh'
        , files
        , function (err, dir, fileContents, stdout, stderr, callback) {
            refute(err)
            refute(stderr)

            assert.stdoutRefersToNPMPackages(stdout, 'ender-js jeesh')
            assert.stdoutReportsBuildCommand(stdout, 'ender build jeesh')
            assert.stdoutReportsOutputSizes(stdout)
            assert.hasVersionedPackage(stdout, 'jeesh', 'stdout')
            assert.hasVersionedPackage(stdout, 'domready', 'stdout')
            assert.hasVersionedPackage(stdout, 'qwery', 'stdout')
            assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
            assert.hasVersionedPackage(stdout, 'bean', 'stdout')

            fileContents.forEach(function (contents, i) {
              assert.match(contents, /Build: ender build jeesh$/m, files[i] + ' contains correct build command')
              assert.hasVersionedPackage(contents, 'jeesh', files[i])
              assert.hasVersionedPackage(contents, 'domready', files[i])
              assert.hasVersionedPackage(contents, 'qwery', files[i])
              assert.hasVersionedPackage(contents, 'bonzo', files[i])
              assert.hasVersionedPackage(contents, 'bean', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'domready', files[i])
              assert.sourceHasProvide(contents, 'domready', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'qwery', files[i])
              assert.sourceHasProvide(contents, 'qwery', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bonzo', files[i])
              assert.sourceHasProvide(contents, 'bonzo', files[i])
              assert.sourceHasStandardWrapFunction(contents, 'bean', files[i])
              assert.sourceHasProvide(contents, 'bean', files[i])
            })
            callback(done)
        })
    }
})