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
  , path = require('path')
  , assert = buster.assert
  , packageUtil    = require('ender-repository').util
  , DependencyTree = require('../../lib/dependency-tree')


buster.testCase('Dependency tree', {
    'constructDependencyTree': {
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
                        [/\//.test(id) ? 'never' : 'once']() // we DON'T want to read node_modules dir for path
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
                        [/\//.test(id) ? 'never' : 'once']() // we DON'T want to read node_modules dir for path
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
            DependencyTree.generate({}, Object.keys(setupTree), function (err, dependencyTree) {
              assert.equals(dependencyTree.treeData, expectedTree)
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

  , 'forEachOrderedDependency': {
        'no dependencies': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'pkg1': {
                      dependencies: {}
                    , packageJSON: { name: 'pkg1' }
                    , parents: [ 'foo' ]
                  }
                , 'some/path/to/pkg2': {
                      dependencies: {}
                    , packageJSON: { name: 'pkg2' }
                    , parents: [ 'foo', 'bar' ]
                  }
              })
              this.callSpy = this.spy()

              this.verifySpy = function () {
                assert.equals(this.callSpy.callCount, 2)
                assert.equals(this.callSpy.getCall(0).args[0], 'pkg1')
                assert.equals(this.callSpy.getCall(0).args[1], [ 'foo' ])
                assert.equals(this.callSpy.getCall(0).args[2], this.originalTree.treeData['pkg1'])
                assert.equals(this.callSpy.getCall(1).args[0], 'some/path/to/pkg2')
                assert.equals(this.callSpy.getCall(1).args[1], [ 'foo' , 'bar' ])
                assert.equals(this.callSpy.getCall(1).args[2], this.originalTree.treeData['some/path/to/pkg2'])
              }
            }

          , 'test forEachUniqueOrderedDependency': function () {
              this.originalTree.forEachUniqueOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }

          , 'test forEachOrderedDependency': function () {
              // should do the same thing
              this.originalTree.forEachOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }
        }

      , 'simple dependencies': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'apkg-2': {
                      parents: []
                    , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , packageJSON: { name: 'mypkg-1' }
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , packageJSON: { name: 'somepkg-5', dependencies: { 'foo-4': '*' } }
                    , dependencies: {
                          'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , packageJSON: { name: 'foo-4', dependencies: { 'bar-3': '*' } }
                            , dependencies: {
                                'bar-3': {
                                    parents: [ 'somepkg-5', 'foo-4' ]
                                  , packageJSON: { name: 'bar-3' }
                                  , dependencies: {}
                                }
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , packageJSON: { name: 'apkg-7', dependencies: { 'mypkg-6': '*' } }
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , packageJSON: { name: 'mypkg-6' }
                            , dependencies: {}
                          }
                      }
                  }
              })
              this.callSpy = this.spy()
              this.verifySpy = function () {
                assert.equals(this.callSpy.args.length, 7)

                this.callSpy.args.forEach(function (c, i) {
                  assert.equals(c[3], i)
                  refute.isNull(c[2])
                  refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
                  assert.same(c[1], c[2].parents)
                  assert.match(c[0], new RegExp('-' + (++i) + '$'))
                })
              }
            }

          , 'test forEachUniqueOrderedDependency': function () {
              this.originalTree.forEachUniqueOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }

          , 'test forEachOrderedDependency': function () {
              // should do the same thing
              this.originalTree.forEachOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }
        }

      , 'ender-js at front': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'apkg-3': {
                      parents: []
                    , packageJSON: { name: 'apkg-3', dependencies: { 'mypkg-2': '*' } }
                    , dependencies: {
                          'mypkg-2': {
                              parents: [ 'apkg-3' ]
                            , packageJSON: { name: 'mypkg-2' }
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-4': {
                      parents: []
                    , packageJSON: { name: 'somepkg-4' }
                    , dependencies: {}
                  }
                , 'ender-js': {
                      parents: []
                    , packageJSON: { name: 'ender-js' }
                    , dependencies: {}
                  } // it should spit this out first
                , 'apkg-6': {
                      parents: []
                    , packageJSON: { name: 'apkg-6', dependencies: { 'mypkg-5': '*' } }
                    , dependencies: {
                          'mypkg-5': {
                              parents: [ 'apkg-6' ]
                            , packageJSON: { name: 'mypkg-5' }
                            , dependencies: {}
                          }
                      }
                  }
              })
              this.callSpy = this.spy()
              this.verifySpy = function () {
                assert.equals(this.callSpy.args.length, 6)

                this.callSpy.args.forEach(function (c, i) {
                  assert.equals(c[3], i)
                  refute.isNull(c[2])
                  refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
                  assert.same(c[1], c[2].parents)
                  if (!i) {
                    assert.equals(c[0], 'ender-js')
                    assert.same(c[2], this.originalTree.treeData['ender-js'])
                  } else
                    assert.match(c[0], new RegExp('-' + (++i) + '$'))
                }.bind(this))
              }
            }

          , 'test forEachUniqueOrderedDependency': function () {
              this.originalTree.forEachUniqueOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }

          , 'test forEachOrderedDependency': function () {
              // should do the same thing
              this.originalTree.forEachOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)
              this.verifySpy()
            }
        }

      , 'duplicate dependencies': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'apkg-6': {
                      parents: []
                    , packageJSON: { name: 'apkg-6', dependencies: { 'mypkg-5': '*' } }
                    , dependencies: {
                          'mypkg-5': {
                              parents: [ 'apkg-6' ]
                            , packageJSON: { name: 'mypkg-5', dependencies: { 'apkg-2': '*', 'apkg-4': '*' } }
                            , dependencies: {
                                  'apkg-2': {
                                      parents: [ 'apkg-6', 'mypkg-5' ]
                                    , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                                    , dependencies: {
                                          'mypkg-1': {
                                              parents: [ 'apkg-6', 'mypkg-5', 'apkg-2' ]
                                            , packageJSON: { name: 'mypkg-1' }
                                            , dependencies: {}
                                          }
                                      }
                                  }
                                , 'apkg-4': {
                                      parents: [ 'apkg-6', 'mypkg-5' ]
                                    , packageJSON: { name: 'apkg-4', dependencies: { 'mypkg-3': '*' } }
                                    , dependencies: {
                                          'mypkg-3': {
                                              parents: [ 'apkg-6', 'mypkg-5', 'apkg-4' ]
                                            , packageJSON: { name: 'mypkg-3' }
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
                    , packageJSON: { name: 'somepkg-9', dependencies: { 'foo-8': '*', 'mypkg-3': '*' } }
                    , dependencies: {
                          'foo-8': {
                              parents: [ 'somepkg-9' ]
                            , packageJSON: { name: 'foo-8', dependencies: { 'bar-7': '*' } }
                            , dependencies: {
                                'bar-7': {
                                    parents: [ 'somepkg-9', 'foo-8' ]
                                  , packageJSON: { name: 'bar-7' }
                                  , dependencies: {}
                                }
                              }
                          }
                        , 'mypkg-3': {
                              parents: [ 'somepkg-9' ]
                            , packageJSON: { name: 'mypkg-3' }
                            , dependencies: {}
                          }
                      }
                  }
                , 'apkg-2': {
                      parents: []
                    , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , packageJSON: { name: 'mypkg-1' }
                            , dependencies: {}
                          }
                      }
                  }
                , 'lastpkg-10': {
                      parents: []
                    , packageJSON: { name: 'lastpkg-10' }
                    , dependencies: {}
                  }
              })
              this.callSpy = this.spy()
            }

            // we should only see unique packages here, they have numbers in their names so we can match them
            // easily
          , 'test forEachUniqueOrderedDependency': function () {
              this.originalTree.forEachUniqueOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)

              // expect only uniques
              assert.equals(this.callSpy.args.length, 10)

              this.callSpy.args.forEach(function (c, i) {
                assert.equals(c[3], i)
                refute.isNull(c[2])
                refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
                assert.same(c[1], c[2].parents)
                assert.match(c[0], new RegExp('-' + (++i) + '$'))
              })
            }

            // in this case we should see all packages in order, not just uniques, but we should get an argument
            // for uniqueness
          , 'test forEachOrderedDependency': function () {
              var expectedPackages =
                  'mypkg-1 apkg-2 mypkg-3 apkg-4 mypkg-5 apkg-6 bar-7 foo-8 mypkg-3 somepkg-9 mypkg-1 apkg-2 lastpkg-10'
                  .split(' ')
                , orderedIndex = 1

              this.originalTree.forEachOrderedDependency(this.originalTree.allRootPackages(), this.callSpy)

              assert.equals(this.callSpy.args.length, expectedPackages.length)

              this.callSpy.args.forEach(function (c, i) {
                // use 'orderedIndex' to check if the current package is a dupe or not according to the
                // package name
                var expectedIsUnique = new RegExp('-' + orderedIndex + '$').test(c[0])
                if (expectedIsUnique)
                  orderedIndex++
                assert.equals(c[3], i)
                refute.isNull(c[2])
                refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
                assert.same(c[1], c[2].parents)
                assert.equals(c[0], expectedPackages[i])
                assert.equals(c[4], expectedIsUnique, 'index ' + i + ' ' + c[0])
              })
            }
        }

      , 'additional unnecessary dependencies': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'apkg-2': {
                      parents: []
                    , packageJSON: { name: 'apkg-2', dependencies: { 'mypkg-1': '*' } }
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , packageJSON: { name: 'mypkg-1' }
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , packageJSON: { name: 'somepkg-5', dependencies: { 'foo-4': '*' } }
                    , dependencies: {
                          'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , packageJSON: { name: 'foo-4', dependencies: { 'bar-3': '*' } }
                            , dependencies: {
                                'bar-3': {
                                    parents: [ 'somepkg-5', 'foo-4' ]
                                  , packageJSON: { name: 'bar-3' }
                                  , dependencies: {}
                                }
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , packageJSON: { name: 'apkg-7', dependencies: { 'mypkg-6': '*' } }
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , packageJSON: { name: 'mypkg-6' }
                            , dependencies: {}
                          }
                      }
                  }
              })
              this.callSpy = this.spy()
              this.verifySpy = function () {
                assert.equals(this.callSpy.args.length, 5)

                this.callSpy.args.forEach(function (c, i) {
                  assert.equals(c[3], i)
                  refute.isNull(c[2])
                  refute.isNull(c[2].dependencies) // should be the packageJSON, 'dependencies' is a proxy for this
                  assert.same(c[1], c[2].parents)
                  assert.match(c[0], new RegExp('-' + (++i) + '$'))
                })
              }
            }

          , 'test forEachUniqueOrderedDependency': function () {
              this.originalTree.forEachUniqueOrderedDependency([ 'apkg-2', 'somepkg-5' ], this.callSpy)
              this.verifySpy()
            }

          , 'test forEachOrderedDependency': function () {
              // should do the same thing
              this.originalTree.forEachOrderedDependency([ 'apkg-2', 'somepkg-5' ], this.callSpy)
              this.verifySpy()
            }
        }
    }

  , 'localizePackageList': {
      'test leaves standard package list alone': function () {
        assert.equals(DependencyTree.create({}, {}).localizePackageList([ 'one', 'two', 'three' ]), [ 'one', 'two', 'three' ], {})
      }

    , 'test strips out versions from names': function () {
        assert.equals(DependencyTree.create({}, {}).localizePackageList([ 'one', 'two@0.1.2', 'three@1.2.3' ]), [ 'one', 'two', 'three' ], {})
      }

    , 'test returns local packages for relative paths': function () {
        var originalPackageList = [ 'one', './two', 'three/foo/bar', '/four' ]
          , expectedPackageList = [ 'one', 'two', 'three', 'four' ]
          , tree = {
                'one': {}
              , './two': { packageJSON: { name: 'two' } }
              , 'two': {}
              , 'three/foo/bar': { packageJSON: { name: 'three' } }
              , 'three': {}
              , '/four': { packageJSON: { name: 'four' } }
              , 'four': {}
            }

          assert.equals(DependencyTree.create({}, tree).localizePackageList(originalPackageList, tree), expectedPackageList)
      }

    , 'test leaves unlocalizable packages alone': function () {
        var originalPackageList = [ 'one', './two', 'three/foo/bar', '/four' ]
          , expectedPackageList = [ 'one', './two', 'three', '/four' ]
          , tree = {
                'one': {}
              , './two': { packageJSON: { name: 'two' } }
              , 'three/foo/bar': { packageJSON: { name: 'three' } }
              , 'three': {}
              , '/four': { packageJSON: { name: 'four' } }
            }

          assert.equals(DependencyTree.create({}, tree).localizePackageList(originalPackageList, tree), expectedPackageList)
      }
    }
})