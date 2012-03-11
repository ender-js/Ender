var testCase = require('buster').testCase
  , fs = require('fs')
  , zlib = require('zlib')
  , mainInfo = require('../../lib/main-info')
  , mainInfoOut = require('../../lib/main-info-output').create()
  , mainInfoUtil = require('../../lib/main-info-util')
  , SourceBuild = require('../../lib/source-build')
  , minify = require('../../lib/minify')

  , _i = 100

testCase('Info', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, done) {
        var mainInfoOutMock = this.mock(mainInfoOut)
          , mainInfoUtilMock = this.mock(mainInfoUtil)
          , optionsArg = { options: 1 }
          , packagesArg = { packages: 1 }
          , sizesArg = { sizes: 1 }
          , contextArg = { options: optionsArg, packages: packagesArg }

        mainInfoUtilMock.expects('sizes').once().withArgs(expectedFilename).callsArgWith(1, null, sizesArg)
        mainInfoUtilMock
          .expects('parseContext')
          .once()
          .withArgs(expectedFilename)
          .callsArgWith(1, null, contextArg)
        mainInfoOutMock
          .expects('buildInfo')
          .once()
          .withExactArgs(expectedFilename, optionsArg, packagesArg, sizesArg)
        mainInfo.exec(options, mainInfoOut, function (err) {
          refute(err)
          done()
        })
      }
    }
  , 'test no args': function (done) {
      this.runTest({}, 'ender.js', done)
    }

  , 'test --use afile.js': function (done) {
      this.runTest({ use: 'afile.js' }, 'afile.js', done)
    }

  , 'test --use afile': function (done) {
      this.runTest({ use: 'afile' }, 'afile.js', done)
    }
})