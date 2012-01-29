var buster = require('buster')
  , assert = buster.assert
  , search = require('../../lib/main-search')

buster.testCase('Search', {
    'test exec() calls setup(), search() and packup() on repository': function () {
      var repository = require('../../lib/repository')
        , mock = this.mock(repository)
        , terms = 'terms argument'

      mock.expects('setup').once().callsArg(0)
      var searchExpectation = mock.expects('search').once().callsArg(1)
      mock.expects('packup').once()

      search.exec({ remaining: terms })

      assert.same(searchExpectation.args[0][0], terms)
      assert.isFunction(searchExpectation.args[0][1]) // internal 'handle()' method
    }
})

