var testCase = require('buster').testCase
  , fs = require('fs')
  , zlib = require('zlib')
  , minify = require('../../lib/minify')
  , mainInfoUtil = require('../../lib/main-info-util')
  , SourceBuild = require('../../lib/source-build')

  , _i = 100

testCase('Info util', {
    'test sizes': function (done) {
      var fsMock = this.mock(fs)
        , zlibMock = this.mock(zlib)
        , minifyMock = this.mock(minify)
        , filenameArg = { filename: 1 }
        , fileContentsArg = { fileContents: 1, length: _i++ }
        , minifyContentsArg = { minifyContents: 1, length: _i++ }
        , gzipContentsArg = { gzipContents: 1, length: _i++ }
        , expectedSizes = {
              raw: fileContentsArg.length
            , minify: minifyContentsArg.length
            , gzip: gzipContentsArg.length
          }

      fsMock.expects('readFile').once().withArgs(filenameArg, 'utf-8').callsArgWith(2, null, fileContentsArg)
      minifyMock.expects('minify').once().withArgs(fileContentsArg).callsArgWith(1, null, minifyContentsArg)
      zlibMock.expects('gzip').once().withArgs(minifyContentsArg).callsArgWith(1, null, gzipContentsArg)

      mainInfoUtil.sizes(filenameArg, function (err, sizes) {
        refute(err)
        assert.equals(sizes, expectedSizes)
        done()
      })
    }

  , 'test parseContest': function (done) {
      var sourceBuildMock = this.mock(SourceBuild)
          , optionsArg = { options: 1 }
          , packagesArg = { packages: 1 }
          , filenameArg = { filename: 1 }

      sourceBuildMock
        .expects('parseContext')
        .once()
        .withArgs(filenameArg)
        .callsArgWith(1, null, optionsArg, packagesArg)

      mainInfoUtil.parseContext(filenameArg, function (err, data) {
        refute(err)
        assert.equals(data, { options: optionsArg, packages: packagesArg })
        done()
      })
    }
})