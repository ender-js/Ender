var testCase = require('buster').testCase
  , searchUtil = require('../../lib/main-search-util')
  , repository = require('../../lib/repository')
  , search = require('../../lib/main-search')

testCase('Search', {
    'test exec() calls setup(), search() and packup() on repository': function () {
      var mock = this.mock(repository)
        , terms = 'terms argument'

      mock.expects('setup').once().callsArg(0)
      var searchExpectation = mock.expects('search').once().callsArg(1)
      mock.expects('packup').once()

      search.exec({ packages: terms })

      assert.same(searchExpectation.args[0][0], terms)
      assert.isFunction(searchExpectation.args[0][1]) // internal 'handle()' method
    }

  , 'test main-search-util interaction': function (done) {
      var mockRepository = this.mock(repository)
      var mockSearchUtil = this.mock(searchUtil)
      var out = require('../../lib/output/main-search-output').create(1)
      var outMock = this.mock(out)

      mockRepository.expects('setup').once().callsArg(0)
      mockRepository.expects('packup').once()
      mockRepository.expects('search').once().callsArgWith(1, null, {
          r1: { keywords: [ 'ender', 'foobar' ] }
        , r2: { keywords: [ 'foobar' ] }
        , r3: { keywords: [ 'foobar' ] }
        , r4: { keywords: [ 'whobar', 'ender' ] }
        , r5: { keywords: [ 'whobar' ] }
      })

      mockSearchUtil.expects('sortByRegExp').exactly(6) // 3 for primary, 3 for secondary

      outMock.expects('searchInit').once()
      outMock.expects('searchError').never()
      outMock.expects('searchNoResults').never()
      var resultsEx = outMock.expects('searchResults').once()

      // execute
      search.exec({ packages: [ 'hoohaa' ] }, out, done)

      var results = resultsEx.args[0][0]
      // verify searchResults data
      assert.equals(results.primary.length, 2)
      assert.equals(results.secondary.length, 3)
      assert.equals(results.secondaryTotal, 3)
      assert.equals(results.max, 8)
      results.primary.forEach(function (r) { assert.contains(r.keywords, 'ender') })
      results.secondary.forEach(function (r) { refute.contains(r.keywords, 'ender') })
    }
})
