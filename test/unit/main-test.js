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


var buster = require('buster')
  , main = require('../../lib/main')
  , mainSearch = require('../../lib/main-search')
  , mainSearchOut = require('../../lib/output/main-search-output')
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

      main.exec('ender ' + expectedArgs.join(' '), done)
      assert(true)
    }
})
