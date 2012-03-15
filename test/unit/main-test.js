var buster = require('buster')
  , assert = buster.assert
  , main = require('../../lib/main')
  , mainSearch = require('../../lib/main-search')
  , mainSearchOut = require('../../lib/main-search-output')
  , argsParse = require('../../lib/args-parse')

buster.testCase('Main program', {
    'test main has exec': function () {
      assert.isFunction(main.exec)
    }

  , 'test main calls argsParse to parse arguments': function () {
      var argsParseMock = this.mock(argsParse)
        , expectedArgs = [ 'foo', 'bar', 'search' ]

      argsParseMock.expects('parse').once().withArgs(expectedArgs).returns(null)

      main.exec(expectedArgs)
      assert(true)
    }

  , 'test main loads main module as specified by args-parse': function (done) {
      var argsParseMock = this.mock(argsParse)
        , mainSearchMock = this.mock(mainSearch)
        , mainSearchOutMock = this.mock(mainSearchOut)
        , expectedArgs = [ 'foo', 'bar', 'search' ]
        , argsArg = { main: 'search' }

      argsParseMock.expects('parse').once().withArgs(expectedArgs).returns(argsArg)
      mainSearchMock.expects('exec').once().withArgs(argsArg).callsArg(2)
      mainSearchOutMock.expects('welcome').once()

      main.exec(expectedArgs, done)
      assert(true)
    }

  , 'test API exec(string, cb) call': function (done) {
      var argsParseMock = this.mock(argsParse)
        , mainSearchMock = this.mock(mainSearch)
        , mainSearchOutMock = this.mock(mainSearchOut)
        , expectedArgs = [ 'search', 'foo', 'bar' ]
        , argsArg = { main: 'search' }

      // note the difference hear is that the first 2 elements of our args array aren't
      // discarded, only the unnecessary 'ender' element (below)
      argsParseMock.expects('parseClean').once().withArgs(expectedArgs).returns(argsArg)
      mainSearchMock.expects('exec').once().withArgs(argsArg).callsArg(2)
      mainSearchOutMock.expects('welcome').once()

      main.exec('ender ' + expectedArgs.join(' '), done)
      assert(true)
    }
})