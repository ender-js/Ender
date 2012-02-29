var buster = require('buster')
  , assert = buster.assert
  , argsParse = require('../../lib/args-parse')
  , buildargs = function (s) {
      return [ 'node', '/some/path/to/bin' ].concat(s.split(' '))
    }

buster.testCase('Args parser', {

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
      assert.equals(
          argsParse.parse(buildargs('build fee fie foe fum'))
        , {
              main: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum' ]
          }
      )
    }

  , 'test parse returns expected object (-- long form)': function () {
      assert.equals(
          argsParse.parse(buildargs('build fee fie foe fum --output foobar --use yeehaw --max 10 --sandbox foo bar --noop --silent --help --sans --debug'))
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
      assert.equals(
          argsParse.parse(buildargs('build fee fie foe fum -o foobar -u yeehaw -x -s -h'))
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
      assert.equals(
          argsParse.parse(buildargs('build fee fie --sandbox foo bar --noop foe fum'))
        , {
              main: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum' ]
            , sandbox: [ 'foo', 'bar' ]
            , noop: true
          }
      )
    }
})
