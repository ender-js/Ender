var buster = require('buster')
  , assert = buster.assert
  , buildUtil = require('../../lib/main-build-util')

buster.testCase('Build Util', {
    'packageList': {
        'test no args': function () {
            var args = {}
              , packages = buildUtil.packageList(args)

            assert.equals(packages, [ 'ender-js', '.' ])
          }

      , 'test 1 package': function () {
          var args = { remaining: [ 'apkg' ] }
            , packages = buildUtil.packageList(args)

          assert.equals(packages, [ 'ender-js', 'apkg' ])
        }

      , 'test multiple packages': function () {
          var args = { remaining: [ 'apkg', 'pkg2', 'pkg3', '.', '..' ] }
            , packages = buildUtil.packageList(args)

          assert.equals(packages, [ 'ender-js', 'apkg', 'pkg2', 'pkg3', '.', '..' ])
        }

      , 'test duplicate packages': function () {
          var args = { remaining: [ 'apkg', 'pkg2', 'apkg' ] }
            , packages = buildUtil.packageList(args)

          assert.equals(packages, [ 'ender-js', 'apkg', 'pkg2' ])
        }
    }

  , 'uniquePackages': {
        'test no packages': function () {
          var packages = []
            , uniques = buildUtil.uniquePackages(packages)

          assert.equals(uniques, [])
        }

      , 'test single package': function () {
          var packages = [ 'apkg' ]
            , uniques = buildUtil.uniquePackages(packages)

          assert.equals(uniques, [ 'apkg' ])
        }

      , 'test multiple unique package': function () {
          var packages = [ 'apkg', 'foo', 'bar' ]
            , uniques = buildUtil.uniquePackages(packages)

          assert.equals(uniques, [ 'apkg', 'foo', 'bar' ])
        }

      , 'test multiple packages with dupes': function () {
          var packages = [ 'apkg', 'foo', 'apkg', 'bar', 'bar' ]
            , uniques = buildUtil.uniquePackages(packages)

          assert.equals(uniques, [ 'apkg', 'foo', 'bar' ])
        }

      , 'test multiple packages with dupes and versions': function () {
          // There is a question here about versioning, perhaps if there is an unversioned
          // and a versioned of the same package then include the versioned one? How about
          // when 2 different versions of the same package are specified
          var packages = [ 'apkg', 'foo', 'apkg@0.1', 'bar', 'bar', 'bar@2.0.0', 'yo@0.0.1' ]
            , uniques = buildUtil.uniquePackages(packages)

          assert.equals(uniques, [ 'apkg', 'foo', 'bar', 'yo@0.0.1' ])
        }
    }
})
