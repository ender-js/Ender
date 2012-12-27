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
  , requireSubvert = require('require-subvert')(__dirname)
  , buildUtil      = require('../../lib/main-build-util')
  , install
  , info
  , build

require('../../lib/output/main-build-output').create()

testCase('Build', {
    // OK, this is a bit of a mess, more of an integration test, but it tests the ful
    // build process and that it calls everything we expect it to
    'test standard main-build interaction': function (done) {
      var mockBuildUtil     = this.mock(buildUtil)
        , mockInstall
        , mockInfo
        , out               = require('../../lib/output/main-build-output').create(1)
        , outMock           = this.mock(out)
        , enderBuilderStub  = this.stub()

        , optionsArg           = { options: 1 }
        , packagesArg          = [ 'foobarbang' ]
        , installedPackagesArg = [ 1, 2, 3 ]
        , dependencyTreeArg    = { dependencyTree: 1 }
        , localizedArg         = [ 'foobar' ]
        , filenameArg          = { filename: 1 }

      enderBuilderStub.callsArgWith(3, null, filenameArg)
      requireSubvert.subvert('ender-builder', enderBuilderStub)
      info = requireSubvert.require('../../lib/main-info')
      install = requireSubvert.require('../../lib/install')
      mockInfo = this.mock(info)
      mockInstall = this.mock(install)
      build = requireSubvert.require('../../lib/main-build')

      mockBuildUtil.expects('packageList').once().withExactArgs(optionsArg).returns(packagesArg)
      outMock.expects('buildInit').once()
      mockInstall
        .expects('installPackages')
        .once()
        .withArgs(optionsArg, packagesArg)
        .callsArgWith(2, null, installedPackagesArg, dependencyTreeArg)
      outMock.expects('installedFromRepository').once().withArgs(installedPackagesArg.length)
      dependencyTreeArg.localizePackageList = this.stub().returns(localizedArg)
      outMock.expects('finishedAssembly').once()
      mockInfo
        .expects('generateAndPrint')
        .once()
        .withArgs(optionsArg, out, filenameArg, optionsArg, localizedArg, dependencyTreeArg)
        .callsArg(6)

      // execute
      build.exec(optionsArg, out, done)

      assert(true) // required, buster bug
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }
})