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

  , LocalPackage      = require('../../lib/local-package')
  , util              = require('../../lib/util')
  , info              = require('../../lib/commands/info')
  , build             = require('../../lib/commands/build')


buster.testCase('Build', {
    // OK, this is a bit of a mess, more of an integration test, but it tests the full
    // build process and that it calls everything we expect it to
    'test standard main-build interaction': function (done) {
      var LocalPackageMock  = this.mock(LocalPackage)
        , utilMock          = this.mock(util)
        , infoMock          = this.mock(info)
        , buildMock         = this.mock(build)

        , optionsArg           = { options: 1 }
        , packageIdsArg        = [ './foobar' ]
        , installedIdsArg      = [ 'foobar@0.0.1' ]
        , packagesArg          = [ 'foobarDepPkg', 'foobarPkg' ]
        , installResultsArg    = [ 1, 2, 3 ]
        , buildFilesArg        = { build: 'build' }
        , buildFilenamesArg    = { build: 'ender.js' }

      // setup our stubs and mocks
      utilMock
        .expects('packageList')
        .once()
        .withExactArgs(optionsArg)
        .returns(packageIdsArg)

      buildMock
        .expects('installPackages')
        .withArgs(packageIdsArg, undefined)
        .callsArgWith(2, null, installedIdsArg, installResultsArg)

      LocalPackageMock
        .expects('walkDependencies')
        .once()
        .withArgs(installedIdsArg, true, true)
        .callsArgWith(3, null, packagesArg)

      buildMock
        .expects('buildPackages')
        .withArgs(optionsArg, packagesArg)
        .callsArgWith(2, null, buildFilesArg, buildFilenamesArg)

      infoMock
        .expects('exec')
        .once()
        .withExactArgs(optionsArg, null, done, buildFilenamesArg.build, installedIdsArg, buildFilesArg)
        .callsArg(2)

      // load the module under test and execute
      build.exec(optionsArg, null, done)
    }
})