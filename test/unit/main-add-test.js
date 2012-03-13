var testCase = require('buster').testCase
  , util = require('../../lib/util')
  , mainBuild = require('../../lib/main-build')
  , mainInfoUtil = require('../../lib/main-info-util')
  , argsParse = require('../../lib/args-parse')
  , mainAdd = require('../../lib/main-add')

testCase('Add', {
    'test basic add': function (done) {
      var utilMock = this.mock(util)
        , mainInfoUtilMock = this.mock(mainInfoUtil)
        , argsParseMock = this.mock(argsParse)
        , mainBuildMock = this.mock(mainBuild)
        , optionsArg = { options: 1 }
        , filenameArg = { filename: 1 }
        , contextArg = { options: { contextOptions: 1 } }
        , extendedOptionsArg = { extendedOptions: 1 }
        , outArg = { out: 1 }

      utilMock.expects('getFilenameFromOptions').once().withExactArgs(optionsArg).returns(filenameArg)
      mainInfoUtilMock.expects('parseContext').once().withArgs(filenameArg).callsArgWith(1, null, contextArg)
      argsParseMock.expects('extend').once().withExactArgs(contextArg.options, optionsArg).returns(extendedOptionsArg)
      mainBuildMock.expects('exec').once().withExactArgs(extendedOptionsArg, outArg, done).callsArg(2)

      mainAdd.exec(optionsArg, outArg, done)

      assert(true) // required for buster, bug
    }
})