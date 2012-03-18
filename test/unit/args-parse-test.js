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
  , argsParse = require('../../lib/args-parse')
  , buildargs = function (s) {
      return [ 'node', '/some/path/to/bin' ].concat(s.split(' '))
    }

buster.testCase('Args parser', {
    'parse': {
        'test parse() exists': function () {
          assert.isFunction(argsParse.parse)
        }

      , 'test parse finds main command': function () {
          var actual = argsParse.parse(buildargs('help'))
          assert.isString(actual.main)
          assert.equals(actual.main, 'help')
        }

      , 'test parse finds main command with trailling cruft': function () {
          var actual = argsParse.parse(buildargs('build --debug --noop stuff here'))
          assert.isString(actual.main)
          assert.equals(actual.main, 'build')
        }

      , 'test parse finds main command with leading and trailling cruft': function () {
          var actual = argsParse.parse(buildargs('--debug info --sandbox --noop --output stuff here'))
          assert.isString(actual.main)
          assert.equals(actual.main, 'info')
        }

      , 'test parse throws exception on no arguments': function () {
          assert.exception(function () {
            argsParse.parse(buildargs(''))
          }, 'UnknownMainError')
        }

      , 'test parse throws exception on only dashed (--) arguments arguments': function () {
          assert.exception(function () {
            argsParse.parse(buildargs('--debug --noop'))
          }, 'UnknownMainError')
        }

      , 'test parse throws exception on unknown build commands': function () {
          assert.exception(function () {
            argsParse.parse(buildargs('unknown'))
          }, 'UnknownMainError')

          assert.exception(function () {
            argsParse.parse(buildargs('--output bar --noop'))
          }, 'UnknownMainError')
        }

      , 'test parse returns packages non dashed arguments': function () {
          var actual = argsParse.parse(buildargs('search --output foo bar woo hoo'))
          assert.isArray(actual.packages)
          assert.equals(actual.packages, [ 'bar', 'woo', 'hoo' ])
        }

      , 'test parse returns packages as empty array if none provided': function () {
          var actual = argsParse.parse(buildargs('search'))
          assert.isArray(actual.packages)
          assert.equals(actual.packages.length, 0)
        }

      , 'test parse returns packages as empty array if only dashed (--) provided': function () {
          var actual = argsParse.parse(buildargs('search --noop'))
          assert.isArray(actual.packages)
          assert.equals(actual.packages.length, 0)
        }

      , 'test parse returns expected object (no specials)': function () {
          var actual = argsParse.parse(buildargs('build fee fie foe fum'))
          assert.equals(
              actual
            , {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
              }
          )
        }

      , 'test parse returns expected object (-- long form)': function () {
          var actual = argsParse.parse(buildargs('build fee fie foe fum --output foobar --use yeehaw --max 10 --sandbox foo bar --noop --silent --help --sans --debug'))
          assert.equals(
              actual
            , {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
                , output: 'foobar'
                , use: 'yeehaw'
                , max: 10
                , sandbox: [ 'foo', 'bar' ]
                , noop: true
                , silent: true
                , help: true
                , sans: true
                , debug: true
              }
          )
        }

      , 'test parse returns expected object (- short form)': function () {
          var actual = argsParse.parse(buildargs('build fee fie foe fum -o foobar -u yeehaw -x -s -h'))
          assert.equals(
              actual
            , {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
                , output: 'foobar'
                , use: 'yeehaw'
                , noop: true
                , silent: true
                , help: true
              }
          )
        }

      , 'test parse returns expected object (array arg stops at next -/--)': function () {
          var actual = argsParse.parse(buildargs('build fee fie --sandbox foo bar --noop foe fum'))
          assert.equals(
              actual
            , {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
                , sandbox: [ 'foo', 'bar' ]
                , noop: true
              }
          )
        }

      , 'test parse can handle compact args': function () {
          // normally parse knows to split off the first 2 args, "node script.js"
          // but we want it to be able to handle arrays without it
          var actual = argsParse.parseClean('build fee fie foe fum -o foobar -u yeehaw -x -s -h'.split(' '))
          assert.equals(
              actual
            , {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
                , output: 'foobar'
                , use: 'yeehaw'
                , noop: true
                , silent: true
                , help: true
              }
          )
        }
    }

  , 'extend': {
        'no specials': function () {
          var originalArgs = {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
              }
            , newArgs = {
                  main: 'add'
                , packages: [ 'baz', 'bing' ]
              }
            , expectedArgs = {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum', 'baz', 'bing' ]
              }

          assert.equals(argsParse.extend(originalArgs, newArgs), expectedArgs)
        }

      , 'with specials': function () {
          var originalArgs = {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum' ]
                , sandbox: [ 'foo' ]
                , use: 'yeehaw'
                , silent: true
                , help: true
              }
            , newArgs = {
                  main: 'add'
                , packages: [ 'baz', 'bing' ]
                , sandbox: [ 'bar', 'baz' ]
                , noop: true
                , silent: true
              }
            , expectedArgs = {
                  main: 'build'
                , packages: [ 'fee', 'fie', 'foe', 'fum', 'baz', 'bing' ]
                , sandbox: [ 'foo', 'bar', 'baz' ]
                , use: 'yeehaw'
                , silent: true
                , help: true
                , noop: true
              }

          assert.equals(argsParse.extend(originalArgs, newArgs), expectedArgs)
        }
    }

  , 'toContextString': {
        'test no specials': function () {
          var actual = argsParse.toContextString(argsParse.parse(buildargs('build fee fie foe fum')))
          assert.equals(actual, 'build fee fie foe fum')
        }

      , 'test "-" short form': function () {
          var ctx = argsParse.toContextString(argsParse.parse(buildargs('build fee fie foe fum -o foobar -u yeehaw -x -s -h')))
          assert(ctx)
          assert.equals(ctx.split(' ').length, 12)
          ctx += ' ' // for convenience so we can match spaces around each element, even at the end
          assert.match(ctx, /^build fee fie foe fum /)
          assert.match(ctx, / --output foobar /)
          assert.match(ctx, / --use yeehaw /)
          assert.match(ctx, / --noop /)
          assert.match(ctx, / --silent /)
          assert.match(ctx, / --help /)
        }

      , 'test array arg stops at next "-/--"': function () {
          // this test doesn't really need to be here but we may as well confirm
          var ctx = argsParse.toContextString(argsParse.parse(buildargs('build fee fie --sandbox foo bar --noop foe fum')))
          assert.equals(ctx, 'build fee fie foe fum --sandbox foo bar --noop')
        }

      , 'test "--" long form': function () {
          var ctx = argsParse.toContextString(
                argsParse.parse(
                  buildargs('build fee fie foe fum --output foobar --use yeehaw --max 10 --sandbox foo bar --noop --silent --help --sans --debug')))
          assert(ctx)
          assert.equals(ctx.split(' ').length, 19)
          ctx += ' ' // for convenience so we can match spaces around each element, even at the end
          assert.match(ctx, /^build fee fie foe fum /)
          assert.match(ctx, / --output foobar /)
          assert.match(ctx, / --use yeehaw /)
          assert.match(ctx, / --max 10 /)
          assert.match(ctx, / --sandbox foo bar /)
          assert.match(ctx, / --noop /)
          assert.match(ctx, / --silent /)
          assert.match(ctx, / --help /)
          assert.match(ctx, / --sans /)
          assert.match(ctx, / --debug /)
        }
    }
})
