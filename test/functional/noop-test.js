var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , functionalCommon = require('./common')
  , reMultiComments = /\/\*![\s\S]*?\*\//g

testCase('Functional: build with noop', {
    'setUp': function () {
      this.timeout = 30000
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