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


buster.testCase('Build', {
    // OK, this is a bit of a mess, more of an integration test, but it tests the full
    // build process and that it calls everything we expect it to
    'test standard main-build interaction': function (done) {
      var enderPackage      = require('ender-package')
        , util              = require('../../../src/commands/util')
        , info              = require('../../../src/commands/info')

        , enderPackageMock  = this.mock(enderPackage)
        , utilMock          = this.mock(util)
        , infoMock          = this.mock(info)
        , installStub       = this.stub()
        , builderStub       = this.stub()
        , build

        , optionsArg           = { options: 1 }
        , packageIdsArg        = [ './foobar' ]
        , installedIdsArg      = [ 'foobar@0.0.1' ]
        , packagesArg          = [ 'foobarDepPkg', 'foobarPkg' ]
        , installResultsArg    = [ 1, 2, 3 ]
        , buildFilesArg        = { build: 'build' }
        , buildFilenamesArg    = { build: 'ender.js' }
        , outArg               = { log: function () {} }

        , finished             = function (err) {
            refute(err)

            assert.equals(installStub.callCount, 1)
            assert.equals(installStub.getCall(0).args.length, 3)
            assert.equals(installStub.getCall(0).args[0], packageIdsArg)
            assert.equals(installStub.getCall(0).args[1], undefined)

            assert.equals(builderStub.callCount, 1)
            assert.equals(builderStub.getCall(0).args.length, 3)
            assert.equals(builderStub.getCall(0).args[0], optionsArg)
            assert.equals(builderStub.getCall(0).args[1], packagesArg)

            done()
          }

      // setup our stubs and mocks
      utilMock
        .expects('packageList')
        .once()
        .withExactArgs(optionsArg)
        .returns(packageIdsArg)

      installStub.callsArgWith(2, null, installedIdsArg, installResultsArg)

      enderPackageMock
        .expects('walkDependencies')
        .once()
        .withArgs(installedIdsArg, true, true)
        .callsArgWith(3, null, packagesArg)

      builderStub.callsArgWith(2, null, buildFilesArg, buildFilenamesArg)

      infoMock
        .expects('exec')
        .once()
        .withExactArgs(optionsArg, outArg, finished, buildFilenamesArg.build, installedIdsArg, buildFilesArg)
        .callsArg(2)

      // subvert single-function modules
      requireSubvert.subvert('ender-builder', builderStub)
      requireSubvert.subvert('ender-installer', installStub)

      // load the module under test and execute
      build = requireSubvert.require('../../../src/commands/build')
      build.exec(optionsArg, outArg, finished)
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }
})