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
  , requireSubvert = require('require-subvert')(__dirname)

buster.testCase('Info', {
    'setUp': function () {
      var fs                  = require('fs')
        , zlib                = require('zlib')
        , enderPackage        = require('ender-package')
        , mainBuildUtil       = require('../../lib/main-build-util')
        , out                 = require('../../lib/output/main-info-output').create()

      this.runTest = function (options, expectedFilename, done) {
        var fsMock              = this.mock(fs)
          , zlibMock            = this.mock(zlib)
          , enderPackageMock    = this.mock(enderPackage)
          , mainBuildUtilMock   = this.mock(mainBuildUtil)
          , outMock             = this.mock(out)
          , parseContextStub    = this.stub()
          , mainInfo

          , packageIdsArg       = [ 'foobar@1.2.3' ]
          , sizesArg            = { sizes: 1 }
          , contextArg          = { options: {}, packages: packageIdsArg }
          , archyTreeArg        = { archyTree: 1 }

        // setup our stubs and mocks
        parseContextStub.callsArgWith(1, null, contextArg)

        mainBuildUtilMock
          .expects('packageList')
          .once()
          .withExactArgs(contextArg.options)
          .returns(packageIdsArg)

        fsMock
          .expects('readFile')
          .twice()
          .callsArgWith(2, null, 'file contents')

        zlibMock
          .expects('gzip')
          .once()
          .withArgs('file contents')
          .callsArgWith(1, null, 'gzipped contents')

        enderPackageMock
          .expects('buildArchyTree')
          .once()
          .withArgs(packageIdsArg, true)
          .callsArgWith(2, null, archyTreeArg)

        outMock
          .expects('buildInfo')
          .once()
          .withExactArgs(expectedFilename, contextArg.options, { build: 13, minifiedBuild: 13, gzippedMinifiedBuild: 16 }, archyTreeArg)

        // subvert single-function modules
        requireSubvert.subvert('../../lib/parse-context', parseContextStub)

        // load the module under test and execute
        mainInfo = requireSubvert.require('../../lib/main-info')
        mainInfo.exec(options, out, function (err) {
          refute(err)
          assert.equals(parseContextStub.callCount, 1)
          assert.equals(parseContextStub.getCall(0).args.length, 2)
          assert.equals(parseContextStub.getCall(0).args[0], expectedFilename)
          done()
        })
      }
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }

  , 'test no args': function (done) {
      this.runTest({}, 'ender.js', done)
    }

  , 'test --use afile.js': function (done) {
      this.runTest({ use: 'afile.js' }, 'afile.js', done)
    }

  , 'test --use afile': function (done) {
      this.runTest({ use: 'afile' }, 'afile.js', done)
    }
})
