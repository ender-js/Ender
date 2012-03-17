var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , functionalCommon = require('./common')

testCase('Functional: info', {
    'setUp': function () {
      this.timeout = 30000
      assert.match.message = '${2}'

      this.runTest = function (use, done) {
        var files = [ (use || 'ender') + '.js', (use || 'ender') + '.min.js' ]
        async.waterfall([
            function (callback) {
              functionalCommon.runEnder(
                  'build bonzo bean' + (use ? ' --output ' + use : '')
                , files
                , function (err, dir, fileContents, stdout, stderr) {
                    refute(err)
                    refute(stderr)

                    assert.stdoutRefersToNPMPackages(stdout, 'ender-js bonzo bean')
                    assert.stdoutReportsBuildCommand(stdout, 'ender build bonzo bean' + (use ? ' --output ' + use : ''))
                    assert.stdoutReportsOutputSizes(stdout)
                    assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
                    assert.hasVersionedPackage(stdout, 'bean', 'stdout')

                    fileContents.forEach(function (contents, i) {
                      assert.match(
                          contents
                        , new RegExp('Build: ender build bonzo bean' + (use ? ' --output ' + use : '') + '$', 'm')
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
                      , function (err) { callback(err, dir) }
                    )
                }
              )
            }
          , function (dir, callback) {
              functionalCommon.runEnder(
                  'info' + (use ? ' --use ' + use : '')
                , []
                , dir
                , function (err, dir, fileContents, stdout, stderr, callback) {
                    refute(err)
                    refute(stderr)

                    assert.stdoutReportsBuildCommand(stdout, 'ender build bonzo bean' + (use ? ' --output ' + use : ''))
                    assert.stdoutReportsOutputSizes(stdout)
                    assert.hasVersionedPackage(stdout, 'bonzo', 'stdout')
                    assert.hasVersionedPackage(stdout, 'bean', 'stdout')

                    callback(done)
                  }
              )
            }
          ], done
        )
      }
    }

  , '`ender build bonzo bean; ender info`': function (done) {
      this.runTest(false, done)
    }

  , '`ender build bonzo bean --output foobar; ender info --use foobar`': function (done) {
      this.runTest('foobar', done)
    }
})