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

  , 'test main loads main module as specified by args-parse': function () {
      var argsParseMock = this.mock(argsParse)
        , mainSearchMock = this.mock(mainSearch)
        , mainSearchOutMock = this.mock(mainSearchOut)
        , expectedArgs = [ 'foo', 'bar', 'search' ]

      argsParseMock.expects('parse').once().withArgs(expectedArgs).returns({ main: 'search' })
      mainSearchMock.expects('exec').once()
      mainSearchOutMock.expects('welcome').once()

      main.exec(expectedArgs)
      assert(true)
    }
})
