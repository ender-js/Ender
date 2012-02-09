var buster = require('buster')
  , assert = buster.assert
  , argsParse = require('../../lib/args-parse')
  , buildargs = function (s) {
      return [ 'node', '/some/path/to/bin' ].concat(s.split(' '))
    }

buster.testCase('Args Parser', {

    'test parse() exists': function () {
      assert.isFunction(argsParse.parse)
    }

  , 'test parse finds main command': function () {
      var actual = argsParse.parse(buildargs('help'))
      assert.isString(actual.main)
      assert.equals(actual.main, 'help')
    }

  , 'test parse finds main command with trailling cruft': function () {
      var actual = argsParse.parse(buildargs('build --with --extra stuff here'))
      assert.isString(actual.main)
      assert.equals(actual.main, 'build')
    }

  , 'test parse finds main command with leading and trailling cruft': function () {
      var actual = argsParse.parse(buildargs('--something --here info --with --extra stuff here'))
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
        argsParse.parse(buildargs('--foo --bar'))
      }, 'UnknownMainError')
    }

  , 'test parse throws exception on unknown build commands': function () {
      assert.exception(function () {
        argsParse.parse(buildargs('unknown'))
      }, 'UnknownMainError')

      assert.exception(function () {
        argsParse.parse(buildargs('--foo bar --woo'))
      }, 'UnknownMainError')
    }

  , 'test parse returns remaining non dashed arguments': function () {
      var actual = argsParse.parse(buildargs('search --output foo bar woo hoo'))
      assert.isArray(actual.remaining)
      assert.equals(actual.remaining, [ 'bar', 'woo', 'hoo' ])
    }

  , 'test parse returns remaining arguments as empty array if none provided': function () {
      var actual = argsParse.parse(buildargs('search'))
      assert.isArray(actual.remaining)
      assert.equals(actual.remaining.length, 0)
    }

  , 'test parse returns remaining arguments as empty array if only dashed (--) provided': function () {
      var actual = argsParse.parse(buildargs('search --foo'))
      assert.isArray(actual.remaining)
      assert.equals(actual.remaining.length, 0)
    }
})
