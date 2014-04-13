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


var buster     = require('bustermove')
  , assert     = require('referee').assert
  , refute     = require('referee').refute
  , argsParser = require('../../lib/args-parser')


buster.testCase('parse', {
    'test parse() exists': function () {
      assert.isFunction(argsParser.parse)
    }

  , 'test parse finds command': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'help'])
      assert.equals(actual.command, 'help')
    }

  , 'test parse finds command with trailling cruft': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'build',  '--debug stuff here'])
      assert.equals(actual.command, 'build')
    }

  , 'test parse finds command with leading and trailling cruft': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', '--debug', 'info', '--sandbox', '--output', 'stuff', 'here'])
      assert.equals(actual.command, 'info')
    }

  , 'test parse provides help when no arguments present': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin'])
       assert.equals(
          actual
        , { command: 'help', packages: [] }
      )
    }

  , 'test parse throws exception on only dashed (--) arguments arguments': function () {
      assert.exception(function () {
        argsParser.parse(['node', '/some/path/to/bin', '--debug'])
      }, 'UnknownCommandError')
    }

  , 'test parse throws exception on unknown build commands': function () {
      assert.exception(function () {
        argsParser.parse(['node', '/some/path/to/bin', 'unknown'])
      }, 'UnknownCommandError')

      assert.exception(function () {
        argsParser.parse(['node', '/some/path/to/bin', '--output', 'bar'])
      }, 'UnknownCommandError')
    }

  , 'test parse returns packages non dashed arguments': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'search', '--output', 'foo', 'bar', 'woo', 'hoo'])
      assert(Array.isArray(actual.packages))
      assert.equals(actual.packages, [ 'bar', 'woo', 'hoo' ])
    }

  , 'test parse returns packages as empty array if none provided': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'search'])
      assert(Array.isArray(actual.packages))
      assert.equals(actual.packages.length, 0)
    }

  , 'test parse returns packages as empty array if only dashed (--) provided': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'search', '--max'])
      assert(Array.isArray(actual.packages))
      assert.equals(actual.packages.length, 0)
    }

  , 'test parse returns expected object (no specials)': function () {
      var actual = argsParser.parse(['node', '/some/path/to/bin', 'build', 'fee', 'fie', 'foe', 'fum'])
      assert.equals(
          actual
        , {
              command: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum' ]
          }
      )
    }

  , 'test parse returns expected object (-- long form)': function () {
      var actual = argsParser.parse((
            'node /some/path/to/bin build fee fie foe fum --output foobar --use yeehaw --max 10 ' +
            '--sandbox foo bar --silent --help --debug --externs what tha --client-lib BOOM ' +
            '--module-lib BAM --quiet --force-install --minifier none'
          ).split(' '))
      assert.equals(
          actual
        , {
              command         : 'build'
            , packages        : [ 'fee', 'fie', 'foe', 'fum' ]
            , output          : 'foobar'
            , use             : 'yeehaw'
            , max             : 10
            , sandbox         : [ 'foo', 'bar' ]
            , silent          : true
            , help            : true
            , debug           : true
            , externs         : [ 'what', 'tha' ]
            , 'client-lib'    : 'BOOM'
            , 'module-lib'    : 'BAM'
            , quiet           : true
            , 'force-install' : true
            , 'minifier'      : 'none'
          }
      )
    }

  , 'test parse returns expected object (- short form)': function () {
      var actual = argsParser.parse('node /some/path/to/bin build fee fie foe fum -o foobar -u yeehaw -s -h'.split(' '))
      assert.equals(
          actual
        , {
              command   : 'build'
            , packages  : [ 'fee', 'fie', 'foe', 'fum' ]
            , output    : 'foobar'
            , use       : 'yeehaw'
            , silent    : true
            , help      : true
          }
      )
    }

  , 'test parse returns expected object (array arg stops at next -/--)': function () {
      var actual = argsParser.parse(
            'node /some/path/to/bin build fee fie --sandbox foo bar --output foobar foe fum'.split(' ')
          )
      assert.equals(
          actual
        , {
              command   : 'build'
            , packages  : [ 'fee', 'fie', 'foe', 'fum' ]
            , sandbox   : [ 'foo', 'bar' ]
            , output    : 'foobar'
          }
      )
    }

  , 'test parse can handle compact args': function () {
      // normally parse knows to split off the first 2 args, "node script.js"
      // but we want it to be able to handle arrays without it
      var actual = argsParser.parseClean('build fee fie foe fum -o foobar -u yeehaw -s -h'.split(' '))
      assert.equals(
          actual
        , {
              command   : 'build'
            , packages  : [ 'fee', 'fie', 'foe', 'fum' ]
            , output    : 'foobar'
            , use       : 'yeehaw'
            , silent    : true
            , help      : true
          }
      )
    }
})