var testCase = require('buster').testCase
  , fs = require('fs')
  , zlib = require('zlib')
  , mainInfo = require('../../lib/main-info')
  , mainInfoOut = require('../../lib/main-info-output').create()
  , SourceBuild = require('../../lib/source-build')
  , minify = require('../../lib/minify')

  , _i = 100

testCase('Info', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, done) {
        var sourceBuildMock = this.mock(SourceBuild)
          , mainInfoOutMock = this.mock(mainInfoOut)
          , fsMock = this.mock(fs)
          , zlibMock = this.mock(zlib)
          , minifyMock = this.mock(minify)
          , optionsArg = { options: 1 }
          , packagesArg = { packages: 1 }
          , fileContentsArg = { fileContents: 1, length: _i++ }
          , minifyContentsArg = { minifyContents: 1, length: _i++ }
          , gzipContentsArg = { gzipContents: 1, length: _i++ }
          , expectedSizes = {
                raw: fileContentsArg.length
              , minify: minifyContentsArg.length
              , gzip: gzipContentsArg.length
            }

        fsMock.expects('readFile').withArgs(expectedFilename, 'utf-8').callsArgWith(2, null, fileContentsArg)
        minifyMock.expects('minify').withArgs(fileContentsArg).callsArgWith(1, null, minifyContentsArg)
        zlibMock.expects('gzip').withArgs(minifyContentsArg).callsArgWith(1, null, gzipContentsArg)
        sourceBuildMock.expects('parseContext').once().withArgs(expectedFilename).callsArgWith(1, null, optionsArg, packagesArg)
        mainInfoOutMock.expects('buildInfo').once().withExactArgs(expectedFilename, optionsArg, packagesArg, expectedSizes)
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