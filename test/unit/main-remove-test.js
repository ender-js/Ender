var testCase = require('buster').testCase
  , util = require('../../lib/util')
  , mainBuild = require('../../lib/main-build')
  , mainInfoUtil = require('../../lib/main-info-util')
  , mainRemove = require('../../lib/main-remove')
  , repository = require('../../lib/repository')

testCase('Remove', {
    'test basic remove': function (done) {
      var utilMock = this.mock(util)
        , mainInfoUtilMock = this.mock(mainInfoUtil)
        , mainBuildMock = this.mock(mainBuild)
        , repositoryMock = this.mock(repository)
        , optionsArg = {
              packages: [ 'bing', 'bar' ]
            , main: 'remove'
            , noop: true
          }
        , expectedModifiedOptions = {
              packages: [] // expect it to not pass through the packages that we want to remove
            , noop: true
          }
        , filenameArg = { filename: 1 }
        , contextArg = { options: {
              packages: [ 'foo', 'bar', 'bing', 'bang' ]
            , main: 'build'
            , sandbox: [ 'foo' ]
          } }
        , expectedBuildOptions = {
              packages: [ 'foo', 'bang' ]
            , main: 'build'
            , noop: true
            , sandbox: [ 'foo' ]
          }
        , outArg = { out: 1 }

      utilMock.expects('getInputFilenameFromOptions').once().withExactArgs(optionsArg).returns(filenameArg)
      mainInfoUtilMock.expects('parseContext').once().withArgs(filenameArg).callsArgWith(1, null, contextArg)
      mainBuildMock.expects('exec').once().withArgs(expectedBuildOptions, outArg).callsArg(2)
      repositoryMock.expects('setup').once().callsArg(0)
      repositoryMock.expects('uninstall').once().withArgs(optionsArg.packages).callsArgWith(1)
      repositoryMock.expects('packup').once()

      mainRemove.exec(optionsArg, outArg, done)

      assert(true) // required for buster, bug
    }
})