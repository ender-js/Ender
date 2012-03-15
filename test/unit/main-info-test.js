var testCase = require('buster').testCase
  , mainInfo = require('../../lib/main-info')
  , mainInfoOut = require('../../lib/main-info-output').create()
  , mainInfoUtil = require('../../lib/main-info-util')
  , mainBuildUtil = require('../../lib/main-build-util')
  , SourceBuild = require('../../lib/source-build')

testCase('Info', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, done) {
        var mainInfoOutMock = this.mock(mainInfoOut)
          , mainInfoUtilMock = this.mock(mainInfoUtil)
          , mainBuildUtilMock = this.mock(mainBuildUtil)
          , packagesArg = { packages: 1 }
          , optionsPackagesArg = { optionsPackages: 1 }
          , sizesArg = { sizes: 1 }
          , contextArg = { options: { packages: optionsPackagesArg }, packages: packagesArg }
          , treeArg = { tree: 1 }
          , archyTreeArg = { archyTree: 1 }

        mainInfoUtilMock
          .expects('sizes')
          .once()
          .withArgs(expectedFilename)
          .callsArgWith(1, null, sizesArg)
        mainInfoUtilMock
          .expects('parseContext')
          .once()
          .withArgs(expectedFilename)
          .callsArgWith(1, null, contextArg)
        mainBuildUtilMock
          .expects('constructDependencyTree')
          .once()
          .withArgs(optionsPackagesArg)
            // important we use packages from context->options->packages which is the command-line packages
            // and not context->packages which is the full list of packages in the build
          .callsArgWith(1, null, treeArg)
        mainInfoUtilMock
          .expects('buildArchyTree')
          .once()
          .withExactArgs(optionsPackagesArg, treeArg)
          .returns(archyTreeArg)
        mainInfoOutMock
          .expects('buildInfo')
          .once()
          .withExactArgs(expectedFilename, contextArg.options, packagesArg, sizesArg, archyTreeArg)

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