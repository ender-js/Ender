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

      utilMock.expects('getInputFilenameFromOptions').once().withExactArgs(optionsArg).returns(filenameArg)
      mainInfoUtilMock.expects('parseContext').once().withArgs(filenameArg).callsArgWith(1, null, contextArg)
      argsParseMock.expects('extend').once().withExactArgs(contextArg.options, optionsArg).returns(extendedOptionsArg)
      mainBuildMock.expects('exec').once().withExactArgs(extendedOptionsArg, outArg, done).callsArg(2)

      mainAdd.exec(optionsArg, outArg, done)

      assert(true) // required for buster, bug
    }
})