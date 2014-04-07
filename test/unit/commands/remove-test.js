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
  , util           = require('../../../src/commands/util')
  , build          = require('../../../src/commands/build')
  , remove         = require('../../../src/commands/remove')
  , requireSubvert = require('require-subvert')(__dirname)

buster.testCase('Remove', {
    'test basic remove': function (done) {
      var optionsArg       = {
              packages: [ 'bing', 'bar' ]
            , command: 'remove'
          }
        , filenameArg = { filename: 1 }
        , contextArg = { options: {
              packages: [ 'foo', 'bar', 'bing', 'bang' ]
            , command: 'build'
            , sandbox: [ 'foo' ]
          } }
        , expectedBuildOptions = {
              packages: [ 'foo', 'bang' ]
            , command: 'build'
            , sandbox: [ 'foo' ]
          }
        , outArg = { out: 1 }


        , repositoryMock   = this.mock(repository)
        , utilMock         = this.mock(util)
        , buildMock        = this.mock(build)

      utilMock.expects('parseContext').once().callsArgWith(1, null, contextArg)
      utilMock.expects('getInputFilenameFromOptions').once().withExactArgs(optionsArg).returns(filenameArg)
      buildMock.expects('exec').once().withArgs(expectedBuildOptions, outArg).callsArg(2)
      repositoryMock.expects('setup').once().callsArg(0)
      repositoryMock.expects('uninstall').once().withArgs(optionsArg.packages).callsArgWith(1)
      repositoryMock.expects('packup').once()

      remove.exec(optionsArg, outArg, done)
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }
})