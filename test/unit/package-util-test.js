var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , packageUtil = require('../../lib/package-util')

  , setupReadPackageJSON = function (testPath, data, callback) {
      var mock = this.mock(fs)
        , resolvedPath = path.resolve(testPath, 'package.json')
      mock.expects('readFile').once().withArgs(resolvedPath, 'utf-8').callsArgWith(2, null, JSON.stringify(data))
    }

testCase('Package util', {
    'test readPackageJSON': function (done) {
      var expected = { 'some': 'data' }
        , testPath = 'some/path/here'
      setupReadPackageJSON.call(this, testPath, expected)
      packageUtil.readPackageJSON(testPath, function (err, actual) {
        refute(err)
        assert.equals(actual, expected)
        done()
      })
    }

  , 'findRootPackageName': {
        'test no root package': function (done) {
          packageUtil.findRootPackageName([ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/' ], function (err, rootPackageName) {
            refute(err)
            refute(rootPackageName)
            done()
          })
        }

      , 'test "." root package': function (done) {
          var data = { name: 'a root package' }

          setupReadPackageJSON.call(this, '.', data)
          packageUtil.findRootPackageName([ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '.', '../', '/' ], function (err, rootPackageName) {
            refute(err)
            assert.equals(rootPackageName, data.name)
            done()
          })
        }

      , 'test relative path root package': function (done) {
          var data = { name: 'foobar to youbar!' }
            , testPath = 'some/path/../..'

          setupReadPackageJSON.call(this, '.', data)
          packageUtil.findRootPackageName([ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/', testPath ], function (err, rootPackageName) {
            refute(err)
            assert.equals(rootPackageName, data.name)
            done()
          })
        }
    }
})

