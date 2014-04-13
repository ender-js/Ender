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


var buster          = require('bustermove')
  , assert          = require('referee').assert
  , refute          = require('referee').refute
  , fs              = require('fs')
  , path            = require('path')
  , help            = require('../../lib/commands/help')
  , FilesystemError = require('../../lib/errors').FilesystemError

buster.testCase('Help', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, exists, done) {
        var fsMock       = this.mock(fs)

          , logArg = {
                infoActual: ''
              , warnActual: ''
              , errorActual: ''

              , info: function (str) { logArg.infoActual += str + '\n' }
              , warn: function (str) { logArg.warnActual += str + '\n' }
              , error: function (str) { logArg.errorActual += str + '\n' }
            }

          , contentsArg  = { contents: 1 }
          , renderedArg  = { rendered: 1 }

        expectedFilename = path.join(path.resolve(__dirname, '../../resources/help/'), expectedFilename)
        fsMock.expects('exists').once().withArgs(expectedFilename).callsArgWith(1, exists)
        if (exists) {
          fsMock.expects('readFile').once().withArgs(expectedFilename, 'utf-8').callsArgWith(2, null, contentsArg)
        }

        help.exec(options, logArg, function (err) {
          refute(err)
          done()
        })
      }
    }

  , 'test no args': function (done) {
      this.runTest({ packages: [] }, 'main.tmpl', true, done)
    }

  , 'test existing help file': function (done) {
      this.runTest({ packages: [ 'foobar' ] }, 'foobar.tmpl', true, done)
    }

  , 'test non-existant help file': function (done) {
      this.runTest({ packages: [ 'foobar' ] }, 'foobar.tmpl', false, done)
    }

  , 'test fs error': function (done) {
      var fsMock       = this.mock(fs)

        , logArg = {
              infoActual: ''
            , warnActual: ''
            , errorActual: ''

            , info: function (str) { logArg.infoActual += str + '\n' }
            , warn: function (str) { logArg.warnActual += str + '\n' }
            , error: function (str) { logArg.errorActual += str + '\n' }
          }

        , errArg       = new Error('this is an error')

      fsMock.expects('readFile').once().callsArgWith(2, errArg)
      help.exec({ packages: [] }, logArg, function (err) {
        assert(err)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errArg)
        assert.same(err.message, errArg.message)
        done()
      })
    }
})