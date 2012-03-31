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
  , assert = buster.assert
  , fs = require('fs')
  , path = require('path')
  , SourceBuild = require('../../lib/source-build')
  , write = require('../../lib/write')
  , buildOutput = require('../../lib/output/main-build-output')
  , FilesystemError = require('../../lib/errors').FilesystemError

buster.testCase('Write', {
    'test standard write': function (done) {
      var sourceBuild = SourceBuild.create()
        , mockFs = this.mock(fs)
        , mockSourceBuild = this.mock(sourceBuild)
        , sourceArg = 'source contents'
        , compressedSourceArg = 'compressed source'
        , fileArg = 'ender.js'
        , compressedFileArg = 'ender.min.js'

      mockSourceBuild.expects('asString').once().withArgs({ type: 'plain' }).callsArgWith(1, null, sourceArg)
      mockFs.expects('writeFile').once().withArgs(fileArg, sourceArg, 'utf-8').callsArg(3)
      mockSourceBuild.expects('asString').once().withArgs({ type: 'minified' }).callsArgWith(1, null, compressedSourceArg)
      mockFs.expects('writeFile').once().withArgs(compressedFileArg, compressedSourceArg, 'utf-8').callsArg(3)

      write.write({}, sourceBuild, buildOutput, function (err) {
        refute(err)
        done()
      })
    }

  , 'test fs error': function (done) {
      var sourceBuild = SourceBuild.create()
        , mockFs = this.mock(fs)
        , mockSourceBuild = this.mock(sourceBuild)
        , sourceArg = 'source contents'
        , compressedSourceArg = 'compressed source'
        , fileArg = 'ender.js'
        , compressedFileArg = 'ender.min.js'
        , errArg = new Error('this is an error')

      mockSourceBuild.expects('asString').once().withArgs({ type: 'plain' }).callsArgWith(1, null, sourceArg)
      mockFs.expects('writeFile').once().withArgs(fileArg, sourceArg, 'utf-8').callsArg(3)
      mockSourceBuild.expects('asString').once().withArgs({ type: 'minified' }).callsArgWith(1, null, compressedSourceArg)
      mockFs.expects('writeFile').once().withArgs(compressedFileArg, compressedSourceArg, 'utf-8').callsArgWith(3, errArg)

      write.write({}, sourceBuild, buildOutput, function (err) {
        assert(err)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errArg)
        assert.same(err.message, errArg.message)
        done()
      })
    }
})

