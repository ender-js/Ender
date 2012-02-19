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

      , 'test package name with same name as cwd': function (done) {
          var data = { name: 'foobar to youbar!' }
            , testPath = path.basename(path.resolve())

          packageUtil.findRootPackageName([ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/', testPath ], function (err, rootPackageName) {
            refute(err)
            refute(rootPackageName)
            done()
          })
        }
    }

  , 'findAndReadPackageJSON': {
        'test standard module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule/', expected)
          packageUtil.findAndReadPackageJSON('.', 'amodule', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test module with "." in name read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule.js/', expected)
          packageUtil.findAndReadPackageJSON('.', 'amodule.js', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test versioned module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule/', expected)
          packageUtil.findAndReadPackageJSON('.', 'amodule@0.1.200', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test "./" module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, '.', expected)
          packageUtil.findAndReadPackageJSON('this shouldn\'t matter', './', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test relative path, no ".", module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'some/path/without/dots', expected)
          packageUtil.findAndReadPackageJSON('foobar', 'some/path/without/dots', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test relative path with "." module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'some/path/without/dots', expected)
          packageUtil.findAndReadPackageJSON('what???', './some/path/../path/without/dots', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }
    }

  , 'getDependenciesFromJSON': {
        'test missing dependencies': function () {
          assert.equals(packageUtil.getDependenciesFromJSON({}), [])
        }

      , 'test empty dependencies array': function () {
          assert.equals(packageUtil.getDependenciesFromJSON({ dependencies: [] }), [])
        }

      , 'test empty dependencies object': function () {
          assert.equals(packageUtil.getDependenciesFromJSON({ dependencies: {} }), [])
        }

      , 'test dependencies array': function () {
          assert.equals(packageUtil.getDependenciesFromJSON({ dependencies: [ 'dep1', 'dep2', 'dep3' ] }), [ 'dep1', 'dep2', 'dep3' ])
        }

      , 'test dependencies object': function () {
          assert.equals(packageUtil.getDependenciesFromJSON({ dependencies: {
              'dep1': '*'
            , 'dep2': '0.0.1'
            , 'dep3': '>=0.1.1'
          }}), [ 'dep1', 'dep2', 'dep3' ])
        }
    }

  , 'getDependenciesFromDirectory': {
        'test no node_modules directory': function (done) {
          var pathMock = this.mock(path)
            , packageName = 'apackage'
            , rootDir = 'some/dir'

          pathMock.expects('exists').withArgs(path.resolve('some/dir/apackage/node_modules')).callsArgWith(1, false)

          packageUtil.getDependenciesFromDirectory(rootDir, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [])
            done()
          })
        }

      , 'test empty node_modules directory': function (done) {
          var fsMock = this.mock(fs)
            , pathMock = this.mock(path)
            , packageName = 'apackage'
            , rootDir = 'some/dir'
            , resolvedDir = path.resolve('some/dir/apackage/node_modules')

          pathMock.expects('exists').withArgs(resolvedDir).callsArgWith(1, true)

          fsMock.expects('readdir').withArgs(resolvedDir).callsArgWith(1, null, [])

          packageUtil.getDependenciesFromDirectory(rootDir, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [])
            done()
          })
        }

      , 'test non-empty node_modules directory': function (done) {
          var fsMock = this.mock(fs)
            , pathMock = this.mock(path)
            , packageName = 'apackage'
            , rootDir = 'some/dir'
            , resolvedDir = path.resolve('some/dir/apackage/node_modules')

          pathMock.expects('exists').withArgs(resolvedDir).callsArgWith(1, true)

          fsMock.expects('readdir').withArgs(resolvedDir).callsArgWith(1, null, [ 'a', 'list', 'of', 'files' ])

          packageUtil.getDependenciesFromDirectory(rootDir, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [ 'a', 'list', 'of', 'files' ])
            done()
          })
        }
    }
})

