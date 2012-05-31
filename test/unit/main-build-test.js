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


var testCase      = require('buster').testCase
  , buildUtil     = require('../../lib/main-build-util')
  , install       = require('../../lib/install')
  , util          = require('../../lib/util')
  , SourcePackage = require('../../lib/source-package')
  , SourceBuild   = require('../../lib/source-build')
  , build         = require('../../lib/main-build')
  , buildOutput   = require('../../lib/output/main-build-output').create()
  , info          = require('../../lib/main-info')
  , write         = require('../../lib/write')

testCase('Build', {
    // OK, this is a bit of a mess, more of an integration test, but it tests the ful
    // build process and that it calls everything we expect it to
    'test standard main-build interaction': function (done) {
      var mockUtil          = this.mock(util)
        , mockBuildUtil     = this.mock(buildUtil)
        , mockInstall       = this.mock(install)
        , mockInfo          = this.mock(info)
        , out               = require('../../lib/output/main-build-output').create(1)
        , outMock           = this.mock(out)
        , sourcePackage     = SourcePackage.create()
        , SourcePackageMock = this.mock(SourcePackage)
        , sourceBuild       = SourceBuild.create()
        , sourceBuildMock   = this.mock(sourceBuild)
        , SourceBuildMock   = this.mock(SourceBuild)
        , writeMock         = this.mock(write)

        , optionsArg           = { options: 1 }
        , packagesArg          = [ 'foobarbang' ]
        , installedPackagesArg = [ 1, 2, 3 ]
        , dependencyTreeArg    = { dependencyTree: 1 }
        , localizedArg         = [ 'foobar' ]
        , packageNameArg       = { packageName: 1 }
        , parentsArg           = { parents: 1 }
        , dataArg              = { packageJSON: { packageJSON: 1, name: 'foobar' } }

      mockBuildUtil.expects('packageList').once().withExactArgs(optionsArg).returns(packagesArg)
      outMock.expects('buildInit').once()
      mockInstall
        .expects('installPackages')
        .once()
        .withArgs(optionsArg, packagesArg)
        .callsArgWith(2, null, installedPackagesArg, dependencyTreeArg)
      outMock.expects('installedFromRepository').once().withArgs(installedPackagesArg.length)
      SourceBuildMock.expects('create').once().withExactArgs(optionsArg).returns(sourceBuild)
      dependencyTreeArg.localizePackageList = this.stub().returns(localizedArg)
      mockUtil.expects('getRootPackageName').once().withExactArgs(optionsArg).returns(localizedArg)
      dependencyTreeArg.forEachUniqueOrderedDependency = this.stub()
      SourcePackageMock
        .expects('create')
        .once()
        .withExactArgs(packageNameArg, parentsArg, false, dataArg.packageJSON, optionsArg)
        .returns(sourcePackage)
      sourceBuildMock.expects('addPackage').once().withArgs(sourcePackage)
      outMock.expects('finishedAssembly').once()
      writeMock.expects('write').once().withArgs(optionsArg, sourceBuild, out).callsArg(3)
      mockInfo
        .expects('generateAndPrint')
        .once()
        .withArgs(optionsArg, out, 'ender.js', optionsArg, localizedArg, dependencyTreeArg)
        .callsArg(6)

      // execute
      build.exec(optionsArg, out, done)

      assert(dependencyTreeArg.forEachUniqueOrderedDependency.calledOnce)
      assert(dependencyTreeArg.forEachUniqueOrderedDependency.calledWith(localizedArg))
      dependencyTreeArg.forEachUniqueOrderedDependency.lastCall.args[1](packageNameArg, parentsArg, dataArg)

      assert(true) // required, buster bug
    }
})

