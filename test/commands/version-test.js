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
  , xregexp         = require('xregexp')

  , version         = require('../../lib/commands/version')

  , FilesystemError = require('../../lib/errors').FilesystemError
  , JSONParseError  = require('../../lib/errors').JSONParseError


buster.testCase('Version', {
    'test version': function (done) {
      var fsMock = this.mock(fs)
        , logArg = {
              infoExpected: 'Active version: vfoobar\n'

            , infoActual: ''
            , warnActual: ''
            , errorActual: ''

            , info: function (str) { logArg.infoActual += str + '\n' }
            , warn: function (str) { logArg.warnActual += str + '\n' }
            , error: function (str) { logArg.errorActual += str + '\n' }
          }


      fsMock.expects('readFile')
        .once()
        .withArgs(path.resolve(__dirname, '..', '..', 'package.json'), 'utf-8')
        .callsArgWith(2, null, '{ "version": "foobar" }')

      version.exec({}, logArg, function (err) {
        refute(err)
        assert.same(logArg.infoActual, logArg.infoExpected)
        done()
      })
    }

  , 'test fs error': function (done) {
      var fsMock = this.mock(fs)

        , logArg = {
              infoActual: ''
            , warnActual: ''
            , errorActual: ''

            , info: function (str) { logArg.infoActual += str + '\n' }
            , warn: function (str) { logArg.warnActual += str + '\n' }
            , error: function (str) { logArg.errorActual += str + '\n' }
          }

        , errArg = new Error('this is an error')

      fsMock.expects('readFile').once().callsArgWith(2, errArg)

      version.exec({}, logArg, function (err) {
        assert(err)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errArg)
        assert.same(err.message, errArg.message)
        done()
      })
    }

  , 'test JSON.parse error': function (done) {
      var mockFs = this.mock(fs)

        , logArg = {
              infoActual: ''
            , warnActual: ''
            , errorActual: ''

            , info: function (str) { logArg.infoActual += str + '\n' }
            , warn: function (str) { logArg.warnActual += str + '\n' }
            , error: function (str) { logArg.errorActual += str + '\n' }
          }


      mockFs.expects('readFile').once().callsArgWith(2, null, 'not;json!@#$%^&*()')

      version.exec({}, logArg, function (err) {
        assert(err)
        assert(err instanceof JSONParseError)
        assert(err.cause)
        assert.match(err.message, /Unexpected token/)
        // includes reference to filename:
        assert.match(err.message, new RegExp(xregexp.XRegExp.escape(path.resolve(__dirname, '../../package.json'))))
        done()
      })
    }
})