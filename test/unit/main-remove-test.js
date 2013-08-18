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


var buster         = require('bustermove')
  , assert         = require('referee').assert
  , refute         = require('referee').refute
  , repository     = require('ender-repository')
  , requireSubvert = require('require-subvert')(__dirname)
  , util
  , mainBuild
  , mainRemove

buster.testCase('Remove', {
    'test basic remove': function (done) {
      var utilMock
        , mainBuildMock
        , repositoryMock   = this.mock(repository)
        , parseContextStub = this.stub()
        , optionsArg       = {
              packages: [ 'bing', 'bar' ]
            , main: 'remove'
          }
        , filenameArg = { filename: 1 }
        , contextArg = { options: {
              packages: [ 'foo', 'bar', 'bing', 'bang' ]
            , main: 'build'
            , sandbox: [ 'foo' ]
          } }
        , expectedBuildOptions = {
              packages: [ 'foo', 'bang' ]
            , main: 'build'
            , sandbox: [ 'foo' ]
          }
        , outArg = { out: 1 }

      requireSubvert.subvert('../../lib/parse-context', parseContextStub)
      parseContextStub.callsArgWith(1, null, contextArg)
      util          = requireSubvert.require('../../lib/util')
      mainBuild     = requireSubvert.require('../../lib/main-build')
      utilMock      = this.mock(util)
      mainBuildMock = this.mock(mainBuild)
      mainRemove    = requireSubvert.require('../../lib/main-remove')

      utilMock.expects('getInputFilenameFromOptions').once().withExactArgs(optionsArg).returns(filenameArg)
      mainBuildMock.expects('exec').once().withArgs(expectedBuildOptions, outArg).callsArg(2)
      repositoryMock.expects('setup').once().callsArg(0)
      repositoryMock.expects('uninstall').once().withArgs(optionsArg.packages).callsArgWith(1)
      repositoryMock.expects('packup').once()

      mainRemove.exec(optionsArg, outArg, done)

      assert.equals(parseContextStub.callCount, 1)
      assert.equals(parseContextStub.getCall(0).args.length, 2)
      assert.equals(parseContextStub.getCall(0).args[0], filenameArg)
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }
})