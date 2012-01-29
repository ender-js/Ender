var buster = require('buster')
  , assert = buster.assert
  , main = require('../../lib/main')

buster.testCase('Main program', {
    tearDown: function () {
      //delete require.cache[require.resolve('../../lib/args-parse')]
    }

  , 'test main has exec': function () {
      assert.isFunction(main.exec)
    }

  , 'test main calls argsParse to parse arguments': function () {
      var argsParse = require('../../lib/args-parse')
        //, search = require('../../lib/main-search')
        , expectedArgs = [ 'foo', 'bar', 'search' ]

      argsParseMock = this.mock(argsParse)
      //searchMock = this.mock(search)

      argsParseMock.expects('parse').once().withArgs(expectedArgs).returns(null) 
      //searchMock.expects('exec').once()

      main.exec(expectedArgs)
      assert(true)
    }

  , 'test main loads main module as specified by args-parse': function () {
      var argsParse = require('../../lib/args-parse')
        , search = require('../../lib/main-search')
        , expectedArgs = [ 'foo', 'bar', 'search' ]

      argsParseMock = this.mock(argsParse)
      searchMock = this.mock(search)

      argsParseMock.expects('parse').once().withArgs(expectedArgs).returns({ main: 'search' }) 
      searchMock.expects('exec').once()

      main.exec(expectedArgs)
      assert(true)
    }
})
