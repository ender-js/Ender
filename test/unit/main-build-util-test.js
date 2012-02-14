var buster = require('buster')
  , assert = buster.assert
  , buildUtil = require('../../lib/main-build-util')

buster.testCase('Build Util', {
    'packageList': {
        'setUp': function () {
          this.testPackageList = function (args, expected) {
            var packages = buildUtil.packageList(args)
            assert.equals(packages, expected)
          }
        }

      , 'test no args': function () {
            this.testPackageList({}, [ 'ender-js', '.' ])
          }

      , 'test 1 package': function () {
          this.testPackageList({ remaining: [ 'apkg' ] }, [ 'ender-js', 'apkg' ])
        }

      , 'test multiple packages': function () {
          this.testPackageList(
              { remaining: [ 'apkg', 'pkg2', 'pkg3', '.', '..' ] }
            , [ 'ender-js', 'apkg', 'pkg2', 'pkg3', '.', '..' ]
          )
        }

      , 'test duplicate packages': function () {
          this.testPackageList(
              { remaining: [ 'apkg', 'pkg2', 'apkg' ] }
            , [ 'ender-js', 'apkg', 'pkg2' ]
          )
        }

      , 'test noop no args': function () {
          this.testPackageList({ options: { noop: true } }, [ '.' ])
        }

      , 'test noop and packages': function () {
          this.testPackageList(
              { remaining: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], options: { noop: true } }
            , [ 'foo', 'bar', '.', '../../bang' ]
          )
        }

      , 'test sans no args': function () {
          this.testPackageList({ options: { sans: true } }, [ '.' ])
        }

      , 'test sans and packages': function () {
          this.testPackageList(
              { remaining: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], options: { sans: true } }
            , [ 'foo', 'bar', '.', '../../bang' ]
          )
        }

      , 'test noop and sans and packages': function () {
          this.testPackageList(
              { remaining: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], options: { sans: true, noop: true } }
            , [ 'foo', 'bar', '.', '../../bang' ]
          )
        }
    }

  , 'uniquePackages': {
        'setUp': function () {
          this.testUniquePackages = function (packages, expected) {
            var uniques = buildUtil.uniquePackages(packages)
            assert.equals(uniques, expected)
          }
        }

      , 'test no packages': function () {
          this.testUniquePackages([], [])
        }

      , 'test single package': function () {
          this.testUniquePackages([ 'apkg' ], [ 'apkg' ])
        }

      , 'test multiple unique package': function () {
          this.testUniquePackages(
              [ 'apkg', 'foo', 'bar' ]
            , [ 'apkg', 'foo', 'bar' ]
          )
        }

      , 'test multiple packages with dupes': function () {
          this.testUniquePackages(
              [ 'apkg', 'foo', 'apkg', 'bar', 'bar' ]
            , [ 'apkg', 'foo', 'bar' ]
          )
        }

      , 'test multiple packages with dupes and versions': function () {
          // There is a question here about versioning, perhaps if there is an unversioned
          // and a versioned of the same package then include the versioned one? How about
          // when 2 different versions of the same package are specified
          this.testUniquePackages(
              [ 'apkg', 'foo', 'apkg@0.1', 'bar', 'bar', 'bar@2.0.0', 'yo@0.0.1' ]
            , [ 'apkg', 'foo', 'bar', 'yo@0.0.1' ]
          )
        }
    }
})
