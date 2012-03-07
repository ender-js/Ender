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
          this.testPackageList({ packages: [ 'apkg' ] }, [ 'ender-js', 'apkg' ])
        }

      , 'test multiple packages': function () {
          this.testPackageList(
              { packages: [ 'apkg', 'pkg2', 'pkg3', '.', '..' ] }
            , [ 'ender-js', 'apkg', 'pkg2', 'pkg3', '.', '..' ]
          )
        }

      , 'test duplicate packages': function () {
          this.testPackageList(
              { packages: [ 'apkg', 'pkg2', 'apkg' ] }
            , [ 'ender-js', 'apkg', 'pkg2' ]
          )
        }

      , 'test noop no args': function () {
          this.testPackageList({ noop: true }, [ '.' ])
        }

      , 'test noop and packages': function () {
          this.testPackageList(
              { packages: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], noop: true }
            , [ 'foo', 'bar', '.', '../../bang' ]
          )
        }

      , 'test sans no args': function () {
          this.testPackageList({ sans: true }, [ '.' ])
        }

      , 'test sans and packages': function () {
          this.testPackageList(
              { packages: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], sans: true }
            , [ 'foo', 'bar', '.', '../../bang' ]
          )
        }

      , 'test noop and sans and packages': function () {
          this.testPackageList(
              { packages: [ 'foo', 'bar', '.', '../../bang', 'bar', 'foo' ], sans: true, noop: true }
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
          this.runTest = function (setupTree, jsons, directories, expectedTree, done) {
            var packageUtilMock = this.mock(packageUtil)
              , setupExpectations = function (parents, setupTree) {
                  Object.keys(setupTree).forEach(function (p, i) {
                    if (p == '$id')
                      return
                    var id = setupTree[p].$id || p // for doing special indirection
                    if (jsons[id] != 'missing') {
                      packageUtilMock.expects('readPackageJSON')
                        .once()
                        .withArgs(parents, p)
                        .callsArgWith(2, null, jsons[id])
                      packageUtilMock.expects('getDependenciesFromDirectory')
                        .once()
                        .withArgs(parents, p)
                        .callsArgWith(2, null, directories[id])
                      setupExpectations(parents.concat([ p ]), setupTree[p])
                    } else {
                      // dir & package.json missing
                      packageUtilMock.expects('readPackageJSON')
                        .once()
                        .withArgs(parents, p)
                        .callsArgWith(2, { code: 'ENOENT' })
                      packageUtilMock.expects('getDependenciesFromDirectory')
                        .once()
                        .withArgs(parents, p)
                        .callsArgWith(2, { code: 'ENOENT' })
                    }
                  })
                }

            packageUtilMock.expects('getDependenciesFromDirectory')
              .once()
              .withArgs([], '.')
              .callsArgWith(2, null, Object.keys(setupTree).filter(function (p) { return !/\//.test(p) }))
            setupExpectations([], setupTree)
            buildUtil.constructDependencyTree(Object.keys(setupTree), function (err, tree) {
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
                    , parents: []
                    , dependencies: {}
                  }
                , 'some/path/to/pkg2': {
                      packageJSON: jsons['some/path/to/pkg2']
                    , parents: []
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
                  'pkg1': [ 'foo', 'woohoo' ]
                , 'pkg': [ 'foo', 'woohoo' ]
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
                    , parents: []
                    , dependencies: {
                          'foo': {
                              packageJSON: jsons['foo']
                            , parents: [ 'pkg1' ]
                            , dependencies: {
                                  'bar': {
                                      packageJSON: jsons['bar']
                                    , parents: [ 'pkg1', 'foo' ]
                                    , dependencies: {}
                                  }
                              }
                          }
                        , 'woohoo': {
                              packageJSON: jsons['woohoo']
                            , parents: [ 'pkg1' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'some/path/to/pkg2': {
                      packageJSON: jsons['some/path/to/pkg2']
                    , parents: []
                    , dependencies: {
                          'wee': {
                              packageJSON: jsons['wee']
                            , parents: [ 'some/path/to/pkg2' ]
                            , dependencies: {
                                  'hee': {
                                      packageJSON: jsons['hee']
                                    , parents: [ 'some/path/to/pkg2', 'wee' ]
                                    , dependencies: {
                                          'yo': {
                                              packageJSON: jsons['yo']
                                            , parents: [ 'some/path/to/pkg2', 'wee', 'hee' ]
                                            , dependencies: {}
                                          }
                                      }
                                  }
                              }
                          }
                        , 'foo': {
                              packageJSON: jsons['foo']
                            , parents: [ 'some/path/to/pkg2' ]
                            , dependencies: {
                                  'bar': {
                                      packageJSON: jsons['bar']
                                    , parents: [ 'some/path/to/pkg2', 'foo' ]
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
                  'pkg1': [ 'foo', 'woohoo' ]
                , 'pkg': [ 'foo' ]
                , 'foo': []
              }
            , expectedTree = {
                  'pkg1': {
                      packageJSON: jsons['pkg1']
                    , parents: []
                    , dependencies: {
                          'foo': {
                              packageJSON: jsons['foo']
                            , parents: [ 'pkg1' ]
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

      , 'test dependencies in scattered directories': function (done) {
          // this test is designed to show that even with missing dependency directories
          // the proper dependency tree can be built if the packages are available in the
          // tree somewhere.
          //
          // the $id awkwardness is so that we can specify the simulation of missing
          // directories & package.json files.
          //
          // see the 'directories' object to see what the simulated directory structure is
          // yet it should be able to piece together the full expectedTree
          var packages = {
                  'pkg1': {
                      'pkg4': { 'pkg6': { $id: 'pkg6-missing' } }
                    , 'pkg3': { $id: 'pkg3-missing' }
                  }
                , 'pkg2': {}
                , 'pkg3': {}
                , 'pkg5': { 'pkg6': {} }
              }
            , jsons = {
                  'pkg1': { name: 'pkg1', dependencies: [ 'pkg4', 'pkg3' ] }
                , 'pkg2': { name: 'pkg2', dependencies: [] }
                , 'pkg3-missing': 'missing'
                , 'pkg3': { name: 'pkg3', dependencies: [] }
                , 'pkg4': { name: 'pkg4', dependencies: [ 'pkg6' ] }
                , 'pkg5': { name: 'pkg5', dependencies: [ 'pkg6' ] }
                , 'pkg6-missing': 'missing'
                , 'pkg6': { name: 'pkg6', dependencies: [] }
              }
            , directories = {
                  'pkg1': [ 'pkg4' ]
                , 'pkg2': []
                , 'pkg3': []
                , 'pkg4': []
                , 'pkg5': [ 'pkg6' ]
                , 'pkg6': []
              }
            , expectedTree = {
                  'pkg1': {
                      packageJSON: jsons['pkg1']
                    , parents: []
                    , dependencies: {
                          'pkg4': {
                              packageJSON: jsons['pkg4']
                            , parents: [ 'pkg1' ]
                            , dependencies: {
                                'pkg6': {
                                    packageJSON: jsons['pkg6']
                                  , parents: [ 'pkg5' ]
                                  , dependencies: {}
                                }
                              }
                          }
                        , 'pkg3': {
                              packageJSON: jsons['pkg3']
                            , parents: []
                            , dependencies: {}
                          }
                      }
                  }
                , 'pkg2': {
                      packageJSON: jsons['pkg2']
                    , parents: []
                    , dependencies: {}
                  }
                , 'pkg3': {
                      packageJSON: jsons['pkg3']
                    , parents: []
                    , dependencies: {}
                  }
                , 'pkg5': {
                      packageJSON: jsons['pkg5']
                    , parents: []
                    , dependencies: {
                          'pkg6': {
                              packageJSON: jsons['pkg6']
                            , parents: [ 'pkg5' ]
                            , dependencies: {}
                          }
                      }
                  }
              }
          this.runTest(packages, jsons, directories, expectedTree, done)
        }
    }

  , 'flattenAndOrderDependencies': {
        'test no dependencies': function () {
          var originalTree = {
                  'pkg1': { dependencies: {}, parents: [ 'foo' ] }
                , 'some/path/to/pkg2': { dependencies: {}, parents: [ 'foo', 'bar' ] }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.callCount, 2)
          assert.equals(spy.getCall(0).args[0], 'pkg1')
          assert.equals(spy.getCall(0).args[1], [ 'foo' ])
          assert.equals(spy.getCall(0).args[2], originalTree['pkg1'])
          assert.equals(spy.getCall(1).args[0], 'some/path/to/pkg2')
          assert.equals(spy.getCall(1).args[1], [ 'foo' , 'bar' ])
          assert.equals(spy.getCall(1).args[2], originalTree['some/path/to/pkg2'])
        }

      , 'test simple dependencies': function () {
          var originalTree = {
                  'apkg-2': {
                      parents: []
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , dependencies: {
                          'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , dependencies: {
                                'bar-3': {
                                    parents: [ 'somepkg-5', 'foo-4' ]
                                  , dependencies: {}
                                }
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , dependencies: {}
                          }
                      }
                  }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.args.length, 7)

          spy.args.forEach(function (c, i) {
            assert.equals(c[3], i)
            refute.isNull(c[2])
            refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
            assert.same(c[1], c[2].parents)
            assert.match(c[0], new RegExp('-' + (++i) + '$'))
          })
        }

      , 'test ender-js at front': function () {
          var originalTree = {
                  'apkg-3': {
                      parents: []
                    , dependencies: {
                          'mypkg-2': {
                              parents: [ 'apkg-3' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-4': { parents: [], dependencies: {} }
                , 'ender-js': { parents: [], dependencies: {} } // it should spit this out first
                , 'apkg-6': {
                      parents: []
                    , dependencies: {
                          'mypkg-5': {
                              parents: [ 'apkg-6' ]
                            , dependencies: {}
                          }
                      }
                  }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.args.length, 6)

          spy.args.forEach(function (c, i) {
            assert.equals(c[3], i)
            refute.isNull(c[2])
            refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
            assert.same(c[1], c[2].parents)
            if (!i) {
              assert.equals(c[0], 'ender-js')
              assert.same(c[2], originalTree['ender-js'])
            } else
              assert.match(c[0], new RegExp('-' + (++i) + '$'))
          })
        }

      , 'test duplicate dependencies': function () {
          var originalTree = {
                  'apkg-6': {
                      parents: []
                    , dependencies: {
                          'mypkg-5': {
                              parents: [ 'apkg-6' ]
                            , dependencies: {
                                  'apkg-2': {
                                      parents: [ 'apkg-6', 'mypkg-5' ]
                                    , dependencies: {
                                          'mypkg-1': {
                                              parents: [ 'apkg-6', 'mypkg-5', 'apkg-2' ]
                                            , dependencies: {}
                                          }
                                      }
                                  }
                                , 'apkg-4': {
                                      parents: [ 'apkg-6', 'mypkg-5' ]
                                    , dependencies: {
                                          'mypkg-3': {
                                              parents: [ 'apkg-6', 'mypkg-5', 'apkg-4' ]
                                            , dependencies: {}
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
                , 'somepkg-9': {
                      parents: []
                    , dependencies: {
                          'foo-8': {
                              parents: [ 'somepkg-9' ]
                            , dependencies: {
                                'bar-7': {
                                    parents: [ 'somepkg-9', 'foo-8' ]
                                  , dependencies: {}
                                }
                              }
                          }
                        , 'mypkg-3': {
                              parents: [ 'somepkg-9' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'apkg-2': {
                      parents: []
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'lastpkg-10': {
                      parents: []
                    , dependencies: {}
                  }
              }
            , spy = this.spy()

          buildUtil.forEachOrderedDependency(originalTree, spy)

          assert.equals(spy.args.length, 10)

          spy.args.forEach(function (c, i) {
            assert.equals(c[3], i)
            refute.isNull(c[2])
            refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
            assert.same(c[1], c[2].parents)
            assert.match(c[0], new RegExp('-' + (++i) + '$'))
          })
        }
    }
})
