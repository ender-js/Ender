/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var buster       = require('bustermove')
  , assert       = require('referee').assert
  , refute       = require('referee').refute
  , repository   = require('ender-repository')
  , searchUtil   = require('../../lib/main-search-util')
  , search       = require('../../lib/main-search')
  , searchOutput = require('../../lib/output/main-search-output').create()

buster.testCase('Search', {
    'test exec() calls setup(), search() and packup() on repository': function (done) {
      var mock = this.mock(repository)
        , terms = 'terms argument'

      mock.expects('setup').once().callsArg(0)
      var searchExpectation = mock.expects('search').once().callsArg(1)
      mock.expects('packup').once()

      search.exec({ packages: terms }, searchOutput, function (err) {
        refute(err)
        assert.same(searchExpectation.args[0][0], terms)
        assert.isFunction(searchExpectation.args[0][1]) // internal 'handle()' method
        done()
      })
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
