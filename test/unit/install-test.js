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


var testCase       = require('buster').testCase
  , repository     = require('ender-repository')
  , requireSubvert = require('require-subvert')(__dirname)
  , util           = require('../../lib/util')
  , installUtil    = require('../../lib/install-util')
  , install

require('ender-dependency-graph')

testCase('Install', {
    'setUp': function () {
      this.mockUtil            = this.mock(util)
      this.mockInstallUtil     = this.mock(installUtil)
      this.mockRepository      = this.mock(repository)
      this.dependencyGraphStub = this.stub()
      requireSubvert.subvert('ender-dependency-graph', this.dependencyGraphStub)
      install                  = requireSubvert.require('../../lib/install')

      this.optionsArg          = { options: 1 }
      this.packagesArg         = [ 'yee', 'haw' ] // length 2

      //this.mockUtil.expects('mkdir').once().withArgs('node_modules').callsArg(1)
      // done by mkdirp now, probably should be mocked out...
      this.mockRepository.expects('setup').once().callsArg(0)
      this.mockRepository.expects('packup').once().callsArg(1)

      this.expectFilterPackagesWithoutCwd = function (packagesArg, filteredPackagesArg) {
        this.mockInstallUtil
          .expects('filterPackagesWithoutCwd')
          .withExactArgs(packagesArg)
          .once()
          .returns(filteredPackagesArg)
      }.bind(this)

      this.expectGenerate = function (dependencyTreeArg) {
        this.dependencyGraphStub.callsArgWith(2, null, dependencyTreeArg)
      }.bind(this)

      this.verifyGenerate = function (calls) {
        assert.equals(this.dependencyGraphStub.callCount, calls)
        for (var i = 0; i < calls; i++) {
          assert.equals(this.dependencyGraphStub.getCall(i).args.length, 3)
          assert.equals(this.dependencyGraphStub.getCall(i).args[0], this.optionsArg)
          assert.equals(this.dependencyGraphStub.getCall(i).args[1], this.packagesArg)
        }
      }

      this.expectFindMissingDependencies = function (dependencyTreeArg, missingDependenciesArg) {
        this.mockInstallUtil
          .expects('findMissingDependencies')
          .withArgs(this.packagesArg, dependencyTreeArg)
          .once()
          .returns(missingDependenciesArg)
      }.bind(this)

      this.expectFindPathDependencies = function (dependencyTreeArg, pathDependenciesArg) {
        this.mockInstallUtil
          .expects('findPathDependencies')
          .withArgs(this.packagesArg, dependencyTreeArg)
          .once()
          .returns(pathDependenciesArg)
      }.bind(this)

      this.expectRepositoryInstall = function (packagesArg, resultArg) {
        this.mockRepository
          .expects('install')
          .once()
          .withArgs(packagesArg)
          .callsArgWith(1, null, resultArg)
      }
    }

  , tearDown: function () {
      requireSubvert.cleanUp()
    }

  , 'test basic one package install, already available': function (done) {
      var filteredPackagesArg        = { filteredPackages: 1, length: this.packagesArg.length }
        , filteredMissingPackagesArg = [] // length 0, nothing to install
        , dependencyTreeArg          = { dependencyArg : 1 }
        , missingDependenciesArg     = [ 'missing' ]
        , pathDependenciesArg        = [ 'path' ]

      this.expectFilterPackagesWithoutCwd(this.packagesArg, filteredPackagesArg)
      this.expectGenerate(dependencyTreeArg)
      this.expectFindMissingDependencies(dependencyTreeArg, missingDependenciesArg)
      this.expectFindPathDependencies(dependencyTreeArg, pathDependenciesArg)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg.concat(pathDependenciesArg), filteredMissingPackagesArg)

      install.installPackages(this.optionsArg, this.packagesArg, function (err, results, dependencyTree) {
        refute(err)
        assert.equals(results, [])
        assert.same(dependencyTree, dependencyTreeArg)
        this.verifyGenerate(1)
        done()
      }.bind(this))
    }

  , 'test one package install, not available': function (done) {
      var filteredPackagesArg         = { filteredPackages: 1, length: this.packagesArg.length }
        , dependencyTreeArg           = { dependencyArg : 1 }
        , missingDependenciesArg      = [ 'missing1' ]
        , pathDependenciesArg         = [ 'path1' ]
        , filteredMissingPackagesArg  = [ 'foo' ] // length 1, install 1 package
        , resultArg                   = { result: 1 }
        , dependencyTreeArg2          = { dependencyArg2 : 1 }
        , missingDependenciesArg2     = [ 'missing2' ]
        , pathDependenciesArg2        = [ 'path2' ]
        , filteredMissingPackagesArg2 = [] // length 0, nothing to install

      this.expectFilterPackagesWithoutCwd(this.packagesArg, filteredPackagesArg)
      this.expectGenerate(dependencyTreeArg)
      this.expectFindMissingDependencies(dependencyTreeArg, missingDependenciesArg)
      this.expectFindPathDependencies(dependencyTreeArg, pathDependenciesArg)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg.concat(pathDependenciesArg), filteredMissingPackagesArg)
      this.expectRepositoryInstall(filteredMissingPackagesArg, resultArg)

      this.expectGenerate(dependencyTreeArg2)
      this.expectFindMissingDependencies(dependencyTreeArg2, missingDependenciesArg2)
      this.expectFindPathDependencies(dependencyTreeArg2, pathDependenciesArg2)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg2.concat(pathDependenciesArg2), filteredMissingPackagesArg2)

      install.installPackages(this.optionsArg, this.packagesArg, function (err, results, dependencyTree) {
        refute(err)
        assert.equals(results, [ resultArg ])
        assert.same(dependencyTree, dependencyTreeArg2)
        this.verifyGenerate(2)
        done()
      }.bind(this))
    }

  , 'test multi package install, multi install loops required': function (done) {
      var filteredPackagesArg         = { filteredPackages: 1, length: this.packagesArg.length }
        , dependencyTreeArg           = { dependencyArg : 1 }
        , missingDependenciesArg      = [ 'missing1' ]
        , pathDependenciesArg         = [ 'path1' ]
        , filteredMissingPackagesArg  = [ 'foo' ]
        , resultArg                   = { result: 1 }
        , dependencyTreeArg2          = { dependencyArg2 : 1 }
        , missingDependenciesArg2     = [ 'missing2' ]
        , pathDependenciesArg2        = [ 'path2' ]
        , filteredMissingPackagesArg2 = [ 'bar' ]
        , resultArg2                  = { result2: 1 }
        , dependencyTreeArg3          = { dependencyArg3 : 1 }
        , missingDependenciesArg3     = [ 'missing3' ]
        , pathDependenciesArg3        = [ 'path3' ]
        , filteredMissingPackagesArg3 = [ 'baz' ]
        , resultArg3                  = { result3: 1 }
        , dependencyTreeArg4          = { dependencyArg4 : 1 }
        , missingDependenciesArg4     = [ 'missing4' ]
        , pathDependenciesArg4        = [ 'path4' ]
        , filteredMissingPackagesArg4 = [] // length 0, nothing to install

      this.expectFilterPackagesWithoutCwd(this.packagesArg, filteredPackagesArg)
      this.expectGenerate(dependencyTreeArg)
      this.expectFindMissingDependencies(dependencyTreeArg, missingDependenciesArg)
      this.expectFindPathDependencies(dependencyTreeArg, pathDependenciesArg)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg.concat(pathDependenciesArg), filteredMissingPackagesArg)
      this.expectRepositoryInstall(filteredMissingPackagesArg, resultArg) // install 1

      this.expectGenerate(dependencyTreeArg2)
      this.expectFindMissingDependencies(dependencyTreeArg2, missingDependenciesArg2)
      this.expectFindPathDependencies(dependencyTreeArg2, pathDependenciesArg2)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg2.concat(pathDependenciesArg2), filteredMissingPackagesArg2)
      this.expectRepositoryInstall(filteredMissingPackagesArg2, resultArg2) // install 2

      this.expectGenerate(dependencyTreeArg3)
      this.expectFindMissingDependencies(dependencyTreeArg3, missingDependenciesArg3)
      this.expectFindPathDependencies(dependencyTreeArg3, pathDependenciesArg3)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg3.concat(pathDependenciesArg3), filteredMissingPackagesArg3)
      this.expectRepositoryInstall(filteredMissingPackagesArg3, resultArg3) // install 3

      this.expectGenerate(dependencyTreeArg4)
      this.expectFindMissingDependencies(dependencyTreeArg4, missingDependenciesArg4)
      this.expectFindPathDependencies(dependencyTreeArg4, pathDependenciesArg4)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg4.concat(pathDependenciesArg4), filteredMissingPackagesArg4)

      install.installPackages(this.optionsArg, this.packagesArg, function (err, results, dependencyTree) {
        refute(err)
        assert.equals(results, [ resultArg, resultArg2, resultArg3 ])
        assert.same(dependencyTree, dependencyTreeArg4)
        this.verifyGenerate(4)
        done()
      }.bind(this))
    }

  , 'test multi package install, should only install the same package once': function (done) {
      var filteredPackagesArg         = { filteredPackages: 1, length: this.packagesArg.length }
        , dependencyTreeArg           = { dependencyArg : 1 }
        , missingDependenciesArg      = [ 'missing1' ]
        , pathDependenciesArg         = [ 'path1' ]
        , filteredMissingPackagesArg  = [ 'foo', 'bar' ]
        , expectedInstallPackagesArg  = filteredMissingPackagesArg
        , resultArg                   = { result: 1 }
        , dependencyTreeArg2          = { dependencyArg2 : 1 }
        , missingDependenciesArg2     = [ 'missing2' ]
        , pathDependenciesArg2        = [ 'path2' ]
        , filteredMissingPackagesArg2 = [ 'bar', 'baz' ]
        , expectedInstallPackagesArg2 = [ 'baz' ] // 'bar' already installed
        , resultArg2                  = { result2: 1 }
        , dependencyTreeArg3          = { dependencyArg3 : 1 }
        , missingDependenciesArg3     = [ 'missing3' ]
        , pathDependenciesArg3        = [ 'path3' ]
        , filteredMissingPackagesArg3 = [ 'foo', 'bar', 'baz', 'bang' ]
        , expectedInstallPackagesArg3 = [ 'bang' ] // others aleady installed
        , resultArg3                  = { result3: 1 }
        , dependencyTreeArg4          = { dependencyArg4 : 1 }
        , missingDependenciesArg4     = [ 'missing4' ]
        , pathDependenciesArg4        = [ 'path4' ]
        , filteredMissingPackagesArg4 = [ 'bar', 'baz' ] // nothing new, should not install anything more

      this.expectFilterPackagesWithoutCwd(this.packagesArg, filteredPackagesArg)
      this.expectGenerate(dependencyTreeArg)
      this.expectFindMissingDependencies(dependencyTreeArg, missingDependenciesArg)
      this.expectFindPathDependencies(dependencyTreeArg, pathDependenciesArg)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg.concat(pathDependenciesArg), filteredMissingPackagesArg)
      this.expectRepositoryInstall(expectedInstallPackagesArg, resultArg) // install 1

      this.expectGenerate(dependencyTreeArg2)
      this.expectFindMissingDependencies(dependencyTreeArg2, missingDependenciesArg2)
      this.expectFindPathDependencies(dependencyTreeArg2, pathDependenciesArg2)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg2.concat(pathDependenciesArg2), filteredMissingPackagesArg2)
      this.expectRepositoryInstall(expectedInstallPackagesArg2, resultArg2) // install 2

      this.expectGenerate(dependencyTreeArg3)
      this.expectFindMissingDependencies(dependencyTreeArg3, missingDependenciesArg3)
      this.expectFindPathDependencies(dependencyTreeArg3, pathDependenciesArg3)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg3.concat(pathDependenciesArg3), filteredMissingPackagesArg3)
      this.expectRepositoryInstall(expectedInstallPackagesArg3, resultArg3) // install 3

      this.expectGenerate(dependencyTreeArg4)
      this.expectFindMissingDependencies(dependencyTreeArg4, missingDependenciesArg4)
      this.expectFindPathDependencies(dependencyTreeArg4, pathDependenciesArg4)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg4.concat(pathDependenciesArg4), filteredMissingPackagesArg4)

      install.installPackages(this.optionsArg, this.packagesArg, function (err, results, dependencyTree) {
        refute(err)
        assert.equals(results, [ resultArg, resultArg2, resultArg3 ])
        assert.same(dependencyTree, dependencyTreeArg4)
        this.verifyGenerate(4)
        done()
      }.bind(this))
    }


  , 'test force-install': function (done) {
      var filteredPackagesArg         = [ 'yee', 'haw' ]
        , resultArg                   = { result: 1 }
        , dependencyTreeArg           = { dependencyArg : 1 }
        , missingDependenciesArg      = [ 'missing1' ]
        , pathDependenciesArg         = [ 'path1' ]
        , filteredMissingPackagesArg  = [ 'foo' ] // length 1, install 1 package
        , resultArg2                  = { result: 2 }
        , dependencyTreeArg2          = { dependencyArg2 : 1 }
        , missingDependenciesArg2     = [ 'missing2' ]
        , pathDependenciesArg2        = [ 'path2' ]
        , filteredMissingPackagesArg2 = [] // length 0, nothing to install

      this.optionsArg  = { 'force-install': true }
      this.packagesArg = [ 'yee', 'haw' ]

      this.expectFilterPackagesWithoutCwd(this.packagesArg, filteredPackagesArg)
      this.expectRepositoryInstall(filteredPackagesArg, resultArg)

      this.expectGenerate(dependencyTreeArg)
      this.expectFindMissingDependencies(dependencyTreeArg, missingDependenciesArg)
      this.expectFindPathDependencies(dependencyTreeArg, pathDependenciesArg)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg.concat(pathDependenciesArg), filteredMissingPackagesArg)
      this.expectRepositoryInstall(filteredMissingPackagesArg, resultArg2)

      this.expectGenerate(dependencyTreeArg2)
      this.expectFindMissingDependencies(dependencyTreeArg2, missingDependenciesArg2)
      this.expectFindPathDependencies(dependencyTreeArg2, pathDependenciesArg2)
      this.expectFilterPackagesWithoutCwd(missingDependenciesArg2.concat(pathDependenciesArg2), filteredMissingPackagesArg2)

      install.installPackages(this.optionsArg, this.packagesArg, function (err, results, dependencyTree) {
        refute(err)
        assert.equals(results, [ resultArg, resultArg2 ])
        assert.same(dependencyTree, dependencyTreeArg2)
        this.verifyGenerate(2)
        done()
      }.bind(this))
    }

})