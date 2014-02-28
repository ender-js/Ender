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


var buster            = require('bustermove')
  , assert            = require('referee').assert
  , refute            = require('referee').refute
  , childProcess      = require('child_process')
  , fs                = require('fs')
  , zlib              = require('zlib')
  , mainCompile       = require('../../lib/main-compile')
  , mainCompileOut    = require('../../lib/output/main-compile-output').create()
  , FilesystemError   = require('../../lib/errors').FilesystemError
  , ChildProcessError = require('../../lib/errors').ChildProcessError
  , CompressionError  = require('../../lib/errors').CompressionError


buster.testCase('Compile', {
    'setUp': function () {
      this.jarPath = require('ender-builder/lib/minifiers/closure').jarPath
      this.runTest = function (args, expectedOutputFile, expectedJavaCmd, done) {
        var childProcessMock = this.mock(childProcess)
          , fsMock = this.mock(fs)
          , zlibMock = this.mock(zlib)
          , outMock = this.mock(mainCompileOut)
          , stdoutArg = 'stdout output'
          , dataArg = { data: 1, length: 222 }
          , zDataArg = { zData: 1, length: 111 }

        outMock.expects('compiling').once()
        childProcessMock.expects('exec')
          .once()
          .withArgs(expectedJavaCmd)
          .callsArgWith(1, null, stdoutArg, null)
        fsMock.expects('readFile').once().withArgs(expectedOutputFile, 'utf-8').callsArgWith(2, null, dataArg)
        zlibMock.expects('gzip').once().withArgs(dataArg).callsArgWith(1, null, zDataArg)
        outMock.expects('compiled').once().withArgs(expectedOutputFile, dataArg.length, zDataArg.length)
        mainCompile.exec(
            args
          , mainCompileOut
          , function (err) {
              refute(err)
              done()
            }
        )
      }
    }

  , 'test noarg compile': function (done) {
      var args = { packages: [] }
        , expectedOutputFile = 'ender-app.js'
        , expectedJavaCmd =
              'java -jar '
            + this.jarPath
            + ' --compilation_level ADVANCED_OPTIMIZATIONS'
            + ' --js=ender.js'
            + ' --js_output_file=ender-app.js'
      this.runTest(args, expectedOutputFile, expectedJavaCmd, done)
    }

  , 'test simple compile': function (done) {
      var args = { packages: [ 'foo.js', 'bar.js' ] }
        , expectedOutputFile = 'ender-app.js'
        , expectedJavaCmd =
              'java -jar '
            + this.jarPath
            + ' --compilation_level ADVANCED_OPTIMIZATIONS'
            + ' --js=ender.js'
            + ' --js=foo.js'
            + ' --js=bar.js'
            + ' --js_output_file=ender-app.js'
      this.runTest(args, expectedOutputFile, expectedJavaCmd, done)
    }

  , 'test compile level=simple': function (done) {
      var args = { packages: [], level: 'simple' }
        , expectedOutputFile = 'ender-app.js'
        , expectedJavaCmd =
              'java -jar '
            + this.jarPath
            + ' --compilation_level SIMPLE_OPTIMIZATIONS'
            + ' --js=ender.js'
            + ' --js_output_file=ender-app.js'
      this.runTest(args, expectedOutputFile, expectedJavaCmd, done)
    }

  , 'test compile level=whitespace': function (done) {
      var args = { packages: [], level: 'whitespace' }
        , expectedOutputFile = 'ender-app.js'
        , expectedJavaCmd =
              'java -jar '
            + this.jarPath
            + ' --compilation_level WHITESPACE_ONLY'
            + ' --js=ender.js'
            + ' --js_output_file=ender-app.js'
      this.runTest(args, expectedOutputFile, expectedJavaCmd, done)
    }

  , 'test complex compile': function (done) {
      // ender compile foo.js bar.js --externs bing.js bang.js --use foobar --output hoohaa
      var args = {
              packages: [ 'foo.js', 'bar.js' ]
            , externs: [ 'bing.js', 'bang.js' ]
            , use: 'foobar'
            , output: 'hoohaa'
          }
        , expectedOutputFile = 'hoohaa.js'
        , expectedJavaCmd =
              'java -jar '
            + this.jarPath
            + ' --compilation_level ADVANCED_OPTIMIZATIONS'
            + ' --js=foobar.js'
            + ' --js=foo.js'
            + ' --js=bar.js'
            + ' --externs=bing.js'
            + ' --externs=bang.js'
            + ' --js_output_file=hoohaa.js'
      this.runTest(args, expectedOutputFile, expectedJavaCmd, done)
    }

  , 'test child process error': function (done) {
        var childProcessMock = this.mock(childProcess)
          , outMock = this.mock(mainCompileOut)
          , errArg = new Error('this is an error')

        outMock.expects('compiling').once()
        childProcessMock.expects('exec').once().callsArgWith(1, errArg)
        mainCompile.exec({ packages: [] }, mainCompileOut, function (err, stdout, stderr) {
          assert(err)
          refute(stdout)
          refute(stderr)
          assert(err instanceof ChildProcessError)
          assert.same(err.cause, errArg)
          assert.same(err.message, errArg.message)
          done()
        })
     }

  , 'test fs error': function (done) {
        var childProcessMock = this.mock(childProcess)
          , outMock = this.mock(mainCompileOut)
          , fsMock = this.mock(fs)
          , errArg = new Error('this is an error')

        outMock.expects('compiling').once()
        childProcessMock.expects('exec').once().callsArgWith(1, null, '')
        fsMock.expects('readFile').once().callsArgWith(2, errArg)
        mainCompile.exec({ packages: [] }, mainCompileOut, function (err, stdout, stderr) {
          assert(err)
          refute(stdout)
          refute(stderr)
          assert(err instanceof FilesystemError)
          assert.same(err.cause, errArg)
          assert.same(err.message, errArg.message)
          done()
        })
     }

  , 'test zlib error': function (done) {
        var childProcessMock = this.mock(childProcess)
          , outMock = this.mock(mainCompileOut)
          , fsMock = this.mock(fs)
          , zlibMock = this.mock(zlib)
          , errArg = new Error('this is an error')

        outMock.expects('compiling').once()
        childProcessMock.expects('exec').once().callsArgWith(1, null, '')
        fsMock.expects('readFile').once().callsArgWith(2, null, '')
        zlibMock.expects('gzip').once().callsArgWith(1, errArg)
        mainCompile.exec({ packages: [] }, mainCompileOut, function (err, stdout, stderr) {
          assert(err)
          refute(stdout)
          refute(stderr)
          assert(err instanceof CompressionError)
          assert.same(err.cause, errArg)
          assert.same(err.message, errArg.message)
          done()
        })
     }
})