var buster = require('buster')
  , assert = buster.assert
  , fs = require('fs')
  , path = require('path')
  , SourceBuild = require('../../lib/source-build')
  , write = require('../../lib/write')
  , buildOutput = require('../../lib/output/main-build-output')

buster.testCase('Write', {
    'test standard write': function (done) {
      var sourceBuild = SourceBuild.create()
        , mockFs = this.mock(fs)
        , mockSourceBuild = this.mock(sourceBuild)
        , mockBuildOutput = this.mock(buildOutput)
        , sourceArg = 'source contents'
        , compressedSourceArg = 'compressed source'
        , fileArg = 'ender.js'
        , compressedFileArg = 'ender.min.js'

      mockSourceBuild.expects('asString').once().withArgs({ type: 'plain' }).callsArgWith(1, null, sourceArg)
      mockFs.expects('writeFile').once().withArgs(fileArg, sourceArg, 'utf-8').callsArg(3)
      mockSourceBuild.expects('asString').once().withArgs({ type: 'minified' }).callsArgWith(1, null, compressedSourceArg)
      mockFs.expects('writeFile').once().withArgs(compressedFileArg, compressedSourceArg, 'utf-8').callsArg(3)

      write.write({}, sourceBuild, buildOutput, function (err) {
        refute(err)
        done()
      })
    }
})

