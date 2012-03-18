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


var testCase = require('buster').testCase
  , buildUtil = require('../../lib/main-build-util')
  , util = require('../../lib/util')
  , repository = require('../../lib/repository')
  , SourcePackage = require('../../lib/source-package')
  , SourceBuild = require('../../lib/source-build')
  , build = require('../../lib/main-build')
  , info = require('../../lib/main-info')
  , write = require('../../lib/write')

testCase('Build', {
    'test exec() calls setup(), install() and packup() on repository': function () {
      var mock = this.mock(repository)
        , mockUtil = this.mock(util)

      mockUtil.expects('mkdir').once().withArgs('node_modules').callsArg(1)

      mock.expects('setup').once().callsArg(0)
      var installExpectation = mock.expects('install').once().callsArgWith(1, 'err') // err shortcircuits
      mock.expects('packup').once()

      build.exec({ packages: [ 'package' ] })

      assert.equals(installExpectation.args[0][0], [ 'ender-js', 'package' ])
      assert.isFunction(installExpectation.args[0][1]) // internal 'handle()' method
    }

    // OK, this is a bit of a mess, more of an integration test, but it tests the ful
    // build process and that it calls everything we expect it to
  , 'test standard main-build interaction': function (done) {
      var mockRepository = this.mock(repository)
        , mockUtil = this.mock(util)
        , mockBuildUtil = this.mock(buildUtil)
        , mockInfo = this.mock(info)
        , out = require('../../lib/output/main-build-output').create(1)
        , outMock = this.mock(out)
        , sourcePackage = SourcePackage.create()
        //, sourcePackageMock = this.mock(sourcePackage)
        , SourcePackageMock = this.mock(SourcePackage)
        , sourceBuild = SourceBuild.create()
        , sourceBuildMock = this.mock(sourceBuild)
        , SourceBuildMock = this.mock(SourceBuild)
        , writeMock = this.mock(write)

        , optionsArg = { options: 1 }
        , packagesArg = { packages: 1 }
        , localizedArg = { localized: 1 }
        , installedArg = [ { installed: 1 } ]
        , npmTreeArg = { tree: 1 }
        , prettyArg = { pretty: 1 }
        , depTreeArg = { depTree: 1 }
        , packageNameArg = { packageName: 1 }
        , parentsArg = { parents: 1 }
        , dataArg = { packageJSON: { packageJSON: 1, name: 'foobar' } }

      mockBuildUtil.expects('packageList').once().withExactArgs(optionsArg).returns(packagesArg)
      outMock.expects('buildInit').once()
      mockUtil.expects('mkdir').once().withArgs('node_modules').callsArg(1)
      outMock.expects('repositoryLoadError').never()
      mockRepository.expects('setup').once().callsArg(0)
      mockRepository
        .expects('install')
        .once()
        .callsArgWith(1, null, [ { installed: installedArg, tree: npmTreeArg, pretty: prettyArg } ])
      mockRepository.expects('packup').once()
      outMock.expects('repositoryError').never()
      outMock.expects('installedFromRepository').once().withArgs(installedArg, npmTreeArg, prettyArg)
      mockBuildUtil.expects('constructDependencyTree').once().withArgs(packagesArg).callsArgWith(1, null, depTreeArg)
      SourceBuildMock.expects('create').once().withExactArgs(optionsArg).returns(sourceBuild)
      mockBuildUtil.expects('localizePackageList').withExactArgs(packagesArg, depTreeArg).returns(localizedArg)
      mockBuildUtil
        .expects('forEachUniqueOrderedDependency')
        .once()
        .withArgs(localizedArg, depTreeArg)
        .callsArgWith(2, packageNameArg, parentsArg, dataArg)
      SourcePackageMock
        .expects('create')
        .once()
        .withExactArgs(parentsArg, packageNameArg, dataArg.packageJSON, optionsArg)
        .returns(sourcePackage)
      sourceBuildMock.expects('addPackage').once().withArgs(sourcePackage)
      outMock.expects('finishedAssembly').once()
      writeMock.expects('write').once().withArgs(optionsArg, sourceBuild, out).callsArg(3)
      mockInfo
        .expects('generateAndPrint')
        .once()
        .withArgs(optionsArg, out, 'ender.js', optionsArg, localizedArg, depTreeArg)
        .callsArg(6)

      // execute
      build.exec(optionsArg, out, done)

      assert(true) // required, buster bug
    }
})

