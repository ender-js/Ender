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
  , argsParser      = require('ender-args-parser')
  , parseContext    = require('../../lib/parse-context')
  , BuildParseError = require('../../lib/errors').BuildParseError
  , FilesystemError = require('../../lib/errors').FilesystemError

buster.testCase('parseContext', {
    'test simple old-skool parse': function (done) {
      var content = ''
            + '/*!\n'
            + '  * =============================================================\n'
            + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
            + '  * Build: ender build foo bar baz --use blah --sandbox foo\n'
            + '  * =============================================================\n'
            + '  */\n\n'
            + arguments.callee.toString()

        , expectedOptions = {
              main: 'build'
            , packages: [ 'foo', 'bar', 'baz' ]
            , use: 'blah'
            , sandbox: [ 'foo' ]
          }
        , filename = 'somefile'
        , mockFs = this.mock(fs)
        , fdArg = 99

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
      mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

      parseContext(filename, function (err, data) {
        refute(err)
        assert(data)
        refute(data.packages)
        assert.equals(data.options, expectedOptions)
        done()
      })
    }

  , 'test simple new-style parse': function (done) {
      var expectedPackages = 'ender-core@0.3.7 bean@0.4.9 qwery@3.3.3 bonzo@1.0.1 domready@0.2.11 bowser@0.1.0'.split(' ')
        , content = ''
            + '/*!\n'
            + '  * =============================================================\n'
            + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
            + '  * Build: ender build foo bar baz --use blah --sandbox foo\n'
            + '  * Packages: ' + expectedPackages.join(' ') + '\n'
            + '  * =============================================================\n'
            + '  */\n\n'
            + arguments.callee.toString()

        , expectedOptions = {
              main: 'build'
            , packages: [ 'foo', 'bar', 'baz' ]
            , use: 'blah'
            , sandbox: [ 'foo' ]
          }
        , filename = 'somefile'
        , mockFs = this.mock(fs)
        , fdArg = 99

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
      mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

      parseContext(filename, function (err, data) {
        refute(err)
        assert(data)
        assert.equals(data.options, expectedOptions)
        assert.equals(data.packages, expectedPackages)
        done()
      })
    }

  , 'test bad build parse (bad ender spec)': function (done) {
      var content = ''
            + '/*!\n'
            + '  * =============================================================\n'
            + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
            + '  * Build: ender not a real build command\n'
            + '  * =============================================================\n'
            + '  */\n\n'
            + arguments.callee.toString()

        , filename = 'somefile'
        , mockFs = this.mock(fs)
        , fdArg = 99

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
      mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

      parseContext(filename, function (err, options, packages) {
        assert(err)
        refute(options)
        refute(packages)
        assert.equals(err.name, 'BuildParseError')
        assert(err.cause)
        assert(err.cause instanceof argsParser.UnknownMainError)
        assert.equals(err.cause.name, 'UnknownMainError')
        done()
      })
    }

  , 'test bad build parse (not an ender file)': function (done) {
      var content = arguments.callee.toString()
        , filename = 'somefile'
        , mockFs = this.mock(fs)
        , fdArg = 99

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
      mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))
      mockFs.expects('close').withArgs(fdArg).callsArg(1)

      parseContext(filename, function (err, options, packages) {
        assert(err)
        refute(options)
        refute(packages)
        assert(err instanceof BuildParseError)
        assert.equals(err.name, 'BuildParseError')
        refute(err.cause)
        done()
      })
    }

  , 'test no such file error': function (done) {
      var filename = 'somefile'
        , mockFs = this.mock(fs)
        , errArg = new Error('this is an error')

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, errArg)

      parseContext(filename, function (err, options, packages) {
        assert(err)
        refute(options)
        refute(packages)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errArg)
        assert.same(err.message, errArg.message)
        done()
      })
    }

  , 'test file read error': function (done) {
      var filename = 'somefile'
        , mockFs = this.mock(fs)
        , errArg = new Error('this is an error')
        , fdArg = 99

      mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
      mockFs.expects('read').withArgs(fdArg).callsArgWith(5, errArg)

      parseContext(filename, function (err, options, packages) {
        assert(err)
        refute(options)
        refute(packages)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errArg)
        assert.same(err.message, errArg.message)
        done()
      })
    }
})