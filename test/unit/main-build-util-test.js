var buster = require('buster')
  , path = require('path')
  , assert = buster.assert
  , buildUtil = require('../../lib/main-build-util')
  , packageUtil = require('../../lib/package-util')

buster.testCase('Build util', {
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

  , 'constructDependencyTree': {
        'setUp': function () {
          this.runTest = function (packages, jsons, directories, expectedTree, done) {
            var packageUtilMock = this.mock(packageUtil)
              , setupExpectations = function (root, packages) {
                  Object.keys(packages).forEach(function (p, i) {
                    if (jsons[p] != 'missing') {
                      packageUtilMock.expects('findAndReadPackageJSON').once().withArgs(root, p).callsArgWith(2, null, jsons[p])
                      packageUtilMock.expects('getDependenciesFromDirectory').once().withArgs(root, p).callsArgWith(2, null, directories[p])
                      setupExpectations(path.join(root, p, 'node_modules'), packages[p])
                    } else {
                      // dir & package.json missing
                      packageUtilMock.expects('findAndReadPackageJSON').once().withArgs(root, p).callsArgWith(2, { code: 'ENOENT' })
                      packageUtilMock.expects('getDependenciesFromDirectory').once().withArgs(root, p).callsArgWith(2, { code: 'ENOENT' })
                    }
                  })
                }

            setupExpectations('.', packages)
            buildUtil.constructDependencyTree('.', Object.keys(packages), function (err, tree) {
              assert.equals(tree, expectedTree)
              done()
            })
          }
        }

      , 'test no dependencies': function (done) {
          var packages = {
                  'pkg1': {}
                , 'some/path/to/pkg2': {}
              }
            , jsons = {
                  'pkg1': { name: 'pkg1' }
                , 'some/path/to/pkg2': { name: 'pkg2name' } // name is different to dir, dirname shouldn't matter
              }
            , directories = {
                  'pkg1': []
                , 'some/path/to/pkg2': []
              }
            , expectedTree = {
                  'pkg1': {
                      packageJSON: jsons['pkg1']
                    , dependencies: {}
                  }
                , 'some/path/to/pkg2': {
                      packageJSON: jsons['some/path/to/pkg2']
                    , dependencies: {}
                  }
              }
          this.runTest(packages, jsons, directories, expectedTree, done)
        }

      , 'test complex dependencies': function (done) {
          var packages = {
                  'pkg1': {
                      'foo': { 'bar': {} }
                    , 'woohoo': {}
                  }
                , 'some/path/to/pkg2': {
                      'wee': {
                          'hee': {
                              'yo': {}
                          }
                      }
                    , 'foo': { 'bar': {} }
                  }
              }
            , jsons = {
                  'pkg1': {
                      name: 'pkg1'
                    , dependencies: [ 'foo', 'woohoo' ]
                  }
                , 'foo': {
                      name: 'foo'
                    , dependencies: [ 'bar' ]
                  }
                , 'bar': { name: 'bar' }
                , 'woohoo': { name: 'woohoo' }
                , 'some/path/to/pkg2': {
                      name: 'pkg2name'
                    , dependencies: [ 'wee', 'foo' ]
                  }
                , 'wee': {
                      name: 'wee'
                    , dependencies: [ 'hee' ]
                  }
                , 'hee': {
                      name: 'hee'
                    , dependencies: [ 'yo' ]
                  }
                , 'yo': { name: 'yo' }
              }
            , directories = {
                  'pkg': [ 'foo', 'woohoo' ]
                , 'some/path/to/pkg2': [ 'wee', 'foo' ]
                , 'foo': [ 'bar' ]
                , 'bar': []
                , 'woohoo': []
                , 'wee': [ 'hee' ]
                , 'hee': [ 'yo' ]
                , 'yo': []
              }
            , expectedTree = {
                  'pkg1': {
                      packageJSON: jsons['pkg1']
                    , dependencies: {
                          'foo': {
                              packageJSON: jsons['foo']
                            , dependencies: {
                                  'bar': {
                                      packageJSON: jsons['bar']
                                    , dependencies: {}
                                  }
                              }
                          }
                        , 'woohoo': {
                              packageJSON: jsons['woohoo']
                            , dependencies: {}
                          }
                      }
                  }
                , 'some/path/to/pkg2': {
                      packageJSON: jsons['some/path/to/pkg2']
                    , dependencies: {
                          'wee': {
                              packageJSON: jsons['wee']
                            , dependencies: {
                                  'hee': {
                                      packageJSON: jsons['hee']
                                    , dependencies: {
                                          'yo': {
                                              packageJSON: jsons['yo']
                                            , dependencies: {}
                                          }
                                      }
                                  }
                              }
                          }
                        , 'foo': {
                              packageJSON: jsons['foo']
                            , dependencies: {
                                  'bar': {
                                      packageJSON: jsons['bar']
                                    , dependencies: {}
                                  }
                              }
                          }
                      }
                  }
              }
          this.runTest(packages, jsons, directories, expectedTree, done)
        }

      , 'test dependencies with missing directories': function (done) {
          var packages = {
                  'pkg1': {
                      'foo': { 'bar': {} }
                    , 'woohoo': {}
                  }
              }
            , jsons = {
                  'pkg1': {
                      name: 'pkg1'
                    , dependencies: [ 'foo', 'woohoo' ]
                  }
                , 'foo': {
                      name: 'foo'
                    , dependencies: [ 'bar' ]
                  }
                , 'bar': 'missing'
                , 'woohoo': 'missing'
              }
            , directories = {
                  'pkg': [ 'foo' ]
                , 'foo': []
              }
            , expectedTree = {
                  'pkg1': {
                      packageJSON: jsons['pkg1']
                    , dependencies: {
                          'foo': {
                              packageJSON: jsons['foo']
                            , dependencies: {
                                  'bar': 'missing'
                              }
                          }
                        , 'woohoo': 'missing'
                      }
                  }
              }
          this.runTest(packages, jsons, directories, expectedTree, done)
        }
    }

  , 'flattenAndOrderDependencies': {
        'test no dependencies': function () {
          var originalTree = {
                  'pkg1': { dependencies: {} }
                , 'some/path/to/pkg2': { dependencies: {} }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.callCount, 2)
          assert.equals(spy.getCall(0).args[0], 'pkg1')
          assert.equals(spy.getCall(0).args[1], originalTree['pkg1'])
          assert.equals(spy.getCall(1).args[0], 'some/path/to/pkg2')
          assert.equals(spy.getCall(1).args[1], originalTree['some/path/to/pkg2'])
        }

      , 'test simple dependencies': function () {
          var originalTree = {
                  'apkg-2': {
                      dependencies: {
                          'mypkg-1': { dependencies: {} }
                      }
                  }
                , 'somepkg-5': {
                      dependencies: {
                          'foo-4': {
                              dependencies: {
                                'bar-3': { dependencies: {} }
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      dependencies: {
                          'mypkg-6': { dependencies: {} }
                      }
                  }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.args.length, 7)

          spy.args.forEach(function (c, i) {
            assert.equals(c[2], i)
            refute.isNull(c[1])
            refute.isNull(c[1].dependencies)
            assert.match(c[0], new RegExp('-' + ++i + '$'))
          })
        }

      , 'test duplicate dependencies': function () {
          var originalTree = {
                  'apkg-6': {
                      dependencies: {
                          'mypkg-5': {
                              dependencies: {
                                  'apkg-2': {
                                      dependencies: {
                                          'mypkg-1': { dependencies: {} }
                                      }
                                  }
                                , 'apkg-4': {
                                      dependencies: {
                                          'mypkg-3': { dependencies: {} }
                                      }
                                  }
                              }
                          }
                      }
                  }
                , 'somepkg-9': {
                      dependencies: {
                          'foo-8': {
                              dependencies: {
                                'bar-7': { dependencies: {} }
                              }
                          }
                        , 'mypkg-3': { dependencies: {} }
                      }
                  }
                , 'apkg-2': {
                      dependencies: {
                          'mypkg-1': { dependencies: {} }
                      }
                  }
                , 'lastpkg-10': { dependencies: {} }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.args.length, 10)

          spy.args.forEach(function (c, i) {
            assert.equals(c[2], i)
            refute.isNull(c[1])
            refute.isNull(c[1].dependencies)
            assert.match(c[0], new RegExp('-' + ++i + '$'))
          })
        }
    }
})
