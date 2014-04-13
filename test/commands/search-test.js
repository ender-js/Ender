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
  , repository   = require('../../lib/repository')
  , search       = require('../../lib/commands/search')

buster.testCase('Search', {
    'test exec() calls setup(), search() and packup() on repository': function (done) {
      var repositoryMock = this.mock(repository)
        , terms = 'terms argument'

        , logArg = {
              infoActual: ''
            , warnActual: ''
            , errorActual: ''

            , info: function (str) { logArg.infoActual += str + '\n' }
            , warn: function (str) { logArg.warnActual += str + '\n' }
            , error: function (str) { logArg.errorActual += str + '\n' }
          }
        , searchExpectation

      repositoryMock.expects('setup').once().callsArg(0)
      searchExpectation = repositoryMock.expects('search').once().callsArg(1)
      repositoryMock.expects('packup').once()

      search.exec({ packages: terms }, logArg, function (err) {
        refute(err)
        assert.same(searchExpectation.args[0][0], terms)
        assert.isFunction(searchExpectation.args[0][1]) // internal 'handle()' method
        done()
      })
    }
})
