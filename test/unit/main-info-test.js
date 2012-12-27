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
  , mainInfoOut    = require('../../lib/output/main-info-output').create()
  , mainInfoUtil   = require('../../lib/main-info-util')
  , mainInfo

testCase('Info', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, done) {
        var mainInfoOutMock     = this.mock(mainInfoOut)
          , mainInfoUtilMock    = this.mock(mainInfoUtil)
          , dependencyGraphStub = this.stub()
          , archyTreeStub       = this.stub()
          , parseContextStub    = this.stub()
          , packagesArg         = { packages: 1 }
          , optionsPackagesArg  = { optionsPackages: 1 }
          , sizesArg            = { sizes: 1 }
          , contextArg          = { options: { packages: optionsPackagesArg }, packages: packagesArg }
          , treeArg             = { tree: 1 }
          , archyTreeArg        = { archyTree: 1 }

        dependencyGraphStub.archyTree = archyTreeStub
        requireSubvert.subvert('ender-dependency-graph', dependencyGraphStub)
        requireSubvert.subvert('../../lib/parse-context', parseContextStub)
        mainInfo = requireSubvert.require('../../lib/main-info')

        mainInfoUtilMock
          .expects('sizes')
          .once()
          .withArgs(contextArg.options, expectedFilename)
          .callsArgWith(2, null, sizesArg)
        dependencyGraphStub.callsArgWith(2, null, treeArg)
            // important we use packages from context->options->packages which is the command-line packages
            // and not context->packages which is the full list of packages in the build
        archyTreeStub.returns(archyTreeArg)
        parseContextStub.callsArgWith(1, null, contextArg)
        mainInfoOutMock
          .expects('buildInfo')
          .once()
          .withExactArgs(expectedFilename, contextArg.options, packagesArg, sizesArg, archyTreeArg)

        mainInfo.exec(options, mainInfoOut, function (err) {
          refute(err)
          assert.equals(dependencyGraphStub.callCount, 1)
          assert.equals(dependencyGraphStub.getCall(0).args.length, 3)
          assert.equals(dependencyGraphStub.getCall(0).args[0], contextArg.options)
          assert.equals(dependencyGraphStub.getCall(0).args[1], optionsPackagesArg)
          assert.equals(archyTreeStub.callCount, 1)
          assert.equals(archyTreeStub.getCall(0).args.length, 2)
          assert.equals(archyTreeStub.getCall(0).args[0], optionsPackagesArg)
          assert.equals(archyTreeStub.getCall(0).args[1], treeArg)
          assert.equals(parseContextStub.callCount, 1)
          assert.equals(parseContextStub.getCall(0).args.length, 2)
          assert.equals(parseContextStub.getCall(0).args[0], expectedFilename)
          done()
        })
      }
    }

  , 'tearDown': function () {
      requireSubvert.cleanUp()
    }

  , 'test no args': function (done) {
      this.runTest({}, 'ender.js', done)
    }

  , 'test --use afile.js': function (done) {
      this.runTest({ use: 'afile.js' }, 'afile.js', done)
    }

  , 'test --use afile': function (done) {
      this.runTest({ use: 'afile' }, 'afile.js', done)
    }
})
