var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , packageUtil = require('../../lib/package-util')

  , setupReadPackageJSON = function (testPath, data, callback) {
      var mock = this.mock(fs)
        , resolvedPath = path.resolve(testPath, 'package.json')
      mock.expects('readFile')
        .once()
        .withArgs(resolvedPath, 'utf-8')
        .callsArgWith(2, null, JSON.stringify(data))
    }

testCase('Package util', {
    'findRootPackageName': {
        'test no root package': function (done) {
          packageUtil.findRootPackageName(
              [ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/' ]
            , function (err, rootPackageName) {
                refute(err)
                refute(rootPackageName)
                done()
              }
          )
        }

      , 'test "." root package': function (done) {
          var data = { name: 'a root package' }

          setupReadPackageJSON.call(this, '.', data)
          packageUtil.findRootPackageName(
              [ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '.', '../', '/' ]
            , function (err, rootPackageName) {
                refute(err)
                assert.equals(rootPackageName, data.name)
                done()
              }
          )
        }

      , 'test relative path root package': function (done) {
          var data = { name: 'foobar to youbar!' }
            , testPath = 'some/path/../..'

          setupReadPackageJSON.call(this, '.', data)
          packageUtil.findRootPackageName(
              [ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/', testPath ]
            , function (err, rootPackageName) {
                refute(err)
                assert.equals(rootPackageName, data.name)
                done()
              }
          )
        }

      , 'test package name with same name as cwd': function (done) {
          var data = { name: 'foobar to youbar!' }
            , testPath = path.basename(path.resolve())

          packageUtil.findRootPackageName(
              [ 'pkg1', 'pkg2', '/foo/bar', 'foo/bar', '..', '../', '/', testPath ]
            , function (err, rootPackageName) {
                refute(err)
                refute(rootPackageName)
                done()
              }
          )
        }
    }

  , 'readPackageJSON': {
        'test standard module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule/', expected)
          packageUtil.readPackageJSON([], 'amodule', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test module with "." in name read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule.js/', expected)
          packageUtil.readPackageJSON([], 'amodule.js', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test versioned module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/amodule/', expected)
          packageUtil.readPackageJSON([], 'amodule@0.1.200', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test module with parent read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'node_modules/aparent/node_modules/amodule/', expected)
          packageUtil.readPackageJSON([ 'aparent' ], 'amodule', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test module with multiple parents read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(
              this
            , 'node_modules/aparent1/node_modules/aparent2/node_modules/aparent3/node_modules/amodule/'
            , expected
          )
          packageUtil.readPackageJSON(
              [ 'aparent1', 'aparent2', 'aparent3' ]
            , 'amodule', function (err, actual) {
                refute(err)
                assert.equals(actual, expected)
                done()
              }
          )
        }

      , 'test "./" module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, '.', expected)
          packageUtil.readPackageJSON([ 'this shouldn\'t matter' ], './', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test relative path, no ".", module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'some/path/without/dots', expected)
          packageUtil.readPackageJSON([ 'foobar' ], 'some/path/without/dots', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }

      , 'test relative path with "." module read': function (done) {
          var expected = { some: 'package', json: 'data' }

          setupReadPackageJSON.call(this, 'some/path/without/dots', expected)
          packageUtil.readPackageJSON([ 'what???' ], './some/path/../path/without/dots', function (err, actual) {
            refute(err)
            assert.equals(actual, expected)
            done()
          })
        }
    }

  , 'getPackageRoot': {
        'test standard module name': function () {
          assert.equals(packageUtil.getPackageRoot([], 'amodule'), path.resolve('node_modules/amodule'))
        }

      , 'test module with "." in name': function () {
          assert.equals(packageUtil.getPackageRoot([], 'amodule.js'), path.resolve('node_modules/amodule.js'))
        }

      , 'test versioned module': function () {
          assert.equals(packageUtil.getPackageRoot([], 'amodule@0.1.200'), path.resolve('node_modules/amodule'))
        }

      , 'test "./" module': function () {
          assert.equals(packageUtil.getPackageRoot(['this shouldn\'t matter'], './'), path.resolve('.'))
        }

      , 'test relative path, no ".", module': function () {
          assert.equals(packageUtil.getPackageRoot(['foobar'], 'some/path/without/dots'), path.resolve('some/path/without/dots'))
        }

      , 'test relative path with "." module': function () {
          assert.equals(packageUtil.getPackageRoot(['what??'], 'some/path/../path/with/dots'), path.resolve('some/path/with/dots'))
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
            , parents = []

          pathMock.expects('exists')
            .withArgs(path.resolve('node_modules/apackage/node_modules'))
            .callsArgWith(1, false)

          packageUtil.getDependenciesFromDirectory(parents, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [])
            done()
          })
        }

      , 'test empty node_modules directory': function (done) {
          var fsMock = this.mock(fs)
            , pathMock = this.mock(path)
            , packageName = 'apackage'
            , parents = []
            , resolvedDir = path.resolve('node_modules/apackage/node_modules')

          pathMock.expects('exists').withArgs(resolvedDir).callsArgWith(1, true)

          fsMock.expects('readdir').withArgs(resolvedDir).callsArgWith(1, null, [])

          packageUtil.getDependenciesFromDirectory(parents, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [])
            done()
          })
        }

      , 'test non-empty node_modules directory': function (done) {
          var fsMock = this.mock(fs)
            , pathMock = this.mock(path)
            , packageName = 'apackage'
            , parents = []
            , resolvedDir = path.resolve('node_modules/apackage/node_modules')

          pathMock.expects('exists').withArgs(resolvedDir).callsArgWith(1, true)

          fsMock.expects('readdir').withArgs(resolvedDir).callsArgWith(1, null, [ 'a', 'list', 'of', 'files' ])

          packageUtil.getDependenciesFromDirectory(parents, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [ 'a', 'list', 'of', 'files' ])
            done()
          })
        }

      , 'test non-empty node_modules directory, deep nesting': function (done) {
          var fsMock = this.mock(fs)
            , pathMock = this.mock(path)
            , packageName = 'apackage'
            , parents = [ 'parent1', 'parent2', 'parent3' ]
            , resolvedDir = path.resolve(
                'node_modules/parent1/node_modules/parent2/node_modules/parent3/node_modules/apackage/node_modules'
              )

          pathMock.expects('exists').withArgs(resolvedDir).callsArgWith(1, true)

          fsMock.expects('readdir').withArgs(resolvedDir).callsArgWith(1, null, [ 'a', 'list', 'of', 'files' ])

          packageUtil.getDependenciesFromDirectory(parents, packageName, function (err, dependencies) {
            refute(err)
            assert.equals(dependencies, [ 'a', 'list', 'of', 'files' ])
            done()
          })
        }
    }
})

