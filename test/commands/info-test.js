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

buster.testCase('Info', {
    'setUp': function () {
      var fs                  = require('fs')
        , zlib                = require('zlib')
        , LocalPackage        = require('../../lib/local-package')
        , util                = require('../../lib/util')
        , info                = require('../../lib/commands/info')

      this.runTest = function (options, expectedFilename, done) {
        var fsMock              = this.mock(fs)
          , zlibMock            = this.mock(zlib)
          , LocalPackageMock    = this.mock(LocalPackage)
          , utilMock            = this.mock(util)

          , logArg = {
                infoActual: ''
              , warnActual: ''
              , errorActual: ''

              , info: function (str) { logArg.infoActual += str + '\n' }
              , warn: function (str) { logArg.warnActual += str + '\n' }
              , error: function (str) { logArg.errorActual += str + '\n' }
            }

          , packageIdsArg       = [ 'foobar@1.2.3' ]
          , sizesArg            = { sizes: 1 }
          , contextArg          = { options: { packages: packageIdsArg } }
          , archyTreeArg        = { archyTree: 1 }

        // setup our stubs and mocks
        utilMock
          .expects('parseContext')
          .once()
          .withArgs(util.getInputFilenameFromOptions(options))
          .callsArgWith(1, null, contextArg)

        utilMock
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

        LocalPackageMock
          .expects('buildTree')
          .once()
          .withArgs(packageIdsArg, true)
          .callsArgWith(2, null, archyTreeArg)

        // load the module under test and execute
        info.exec(options, logArg, done)
      }
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
