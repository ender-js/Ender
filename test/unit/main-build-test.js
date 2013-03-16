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


var buster         = require('bustermove')
  , assert         = require('referee').assert
  , refute         = require('referee').refute
  , requireSubvert = require('require-subvert')(__dirname)
  , buildUtil      = require('../../lib/main-build-util')
  , info
  , build

require('../../lib/output/main-build-output').create()

buster.testCase('Build', {
    // OK, this is a bit of a mess, more of an integration test, but it tests the ful
    // build process and that it calls everything we expect it to
    'test standard main-build interaction': function (done) {
      var mockBuildUtil     = this.mock(buildUtil)
        , installStub       = this.stub()
        , mockInfo
        , out               = require('../../lib/output/main-build-output').create(1)
        , outMock           = this.mock(out)
        , builderStub       = this.stub()

        , optionsArg           = { options: 1 }
        , packagesArg          = [ 'foobarbang' ]
        , installedPackagesArg = [ 1, 2, 3 ]
        , dependencyTreeArg    = { dependencyTree: 1 }
        , localizedArg         = [ 'foobar' ]
        , filenameArg          = { filename: 1 }

      builderStub.callsArgWith(3, null, filenameArg)
      requireSubvert.subvert('ender-builder', builderStub)
      requireSubvert.subvert('ender-installer', installStub)
      info = requireSubvert.require('../../lib/main-info')
      mockInfo = this.mock(info)
      build = requireSubvert.require('../../lib/main-build')

      mockBuildUtil.expects('packageList').once().withExactArgs(optionsArg).returns(packagesArg)
      outMock.expects('buildInit').once()
      installStub.callsArgWith(2, null, installedPackagesArg, dependencyTreeArg)
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

      assert.equals(installStub.callCount, 1)
      assert.equals(installStub.getCall(0).args.length, 3)
      assert.equals(installStub.getCall(0).args[0], optionsArg)
      assert.equals(installStub.getCall(0).args[1], packagesArg)
      assert.equals(builderStub.callCount, 1)
      assert.equals(builderStub.getCall(0).args.length, 4)
      assert.equals(builderStub.getCall(0).args[0], optionsArg)
      assert.equals(builderStub.getCall(0).args[1], packagesArg)
      assert.equals(builderStub.getCall(0).args[2], dependencyTreeArg)
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }
})