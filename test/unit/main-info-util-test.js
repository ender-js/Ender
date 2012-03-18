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
  , fs = require('fs')
  , zlib = require('zlib')
  , minify = require('../../lib/minify')
  , mainInfoUtil = require('../../lib/main-info-util')
  , mainBuildUtil = require('../../lib/main-build-util')
  , SourceBuild = require('../../lib/source-build')

  , _i = 100

testCase('Info util', {
    'test sizes': function (done) {
      var fsMock = this.mock(fs)
        , zlibMock = this.mock(zlib)
        , minifyMock = this.mock(minify)
        , filenameArg = { filename: 1 }
        , fileContentsArg = { fileContents: 1, length: _i++ }
        , minifyContentsArg = { minifyContents: 1, length: _i++ }
        , gzipContentsArg = { gzipContents: 1, length: _i++ }
        , expectedSizes = {
              raw: fileContentsArg.length
            , minify: minifyContentsArg.length
            , gzip: gzipContentsArg.length
          }

      fsMock.expects('readFile').once().withArgs(filenameArg, 'utf-8').callsArgWith(2, null, fileContentsArg)
      minifyMock.expects('minify').once().withArgs(fileContentsArg).callsArgWith(1, null, minifyContentsArg)
      zlibMock.expects('gzip').once().withArgs(minifyContentsArg).callsArgWith(1, null, gzipContentsArg)

      mainInfoUtil.sizes(filenameArg, function (err, sizes) {
        refute(err)
        assert.equals(sizes, expectedSizes)
        done()
      })
    }

  , 'test parseContest': function (done) {
      var sourceBuildMock = this.mock(SourceBuild)
          , optionsArg = { options: 1 }
          , packagesArg = { packages: 1 }
          , filenameArg = { filename: 1 }

      sourceBuildMock
        .expects('parseContext')
        .once()
        .withArgs(filenameArg)
        .callsArgWith(1, null, optionsArg, packagesArg)

      mainInfoUtil.parseContext(filenameArg, function (err, data) {
        refute(err)
        assert.equals(data, { options: optionsArg, packages: packagesArg })
        done()
      })
    }

    // generates a tree that can be turned into nice output, not fully `archy`
    // compatible yet but can be easily transformed by the output routine
  , 'test generateArchyTree': function () {
      var mainBuildUtilMock = this.mock(mainBuildUtil)
        , packagesArg = { packages: 1 }
        , treeArg = { tree: 1 }
        , localPackagesArg = { localPackages: 1 }
        , forEachExpectation
        , forEachCallback
        , result
        , expectedResult = {
              label: 'Active packages:'
            , nodes: [
                  {
                      label: 'foo'
                    , version: '1.0.4'
                    , description: 'barfoo'
                    , first: true
                    , nodes: [
                          {
                              label: 'bar'
                            , version: '1.0.3'
                            , description: 'barfoo'
                            , first: true
                            , nodes: [
                                  {
                                      label: 'foobar'
                                    , version: '1.0.0'
                                    , description: 'barfoo'
                                    , first: true
                                    , nodes: []
                                  }
                                , {
                                      label: 'baz'
                                    , version: '1.0.1'
                                    , description: 'barfoo'
                                    , first: true
                                    , nodes: []
                                  }
                                , {
                                      label: 'bing'
                                    , version: '1.0.2'
                                    , description: 'barfoo'
                                    , first: true
                                    , nodes: []
                                  }
                              ]
                          }
                      ]
                  }
                , {
                      label: 'fee'
                    , version: '1.0.5'
                    , description: 'barfoo'
                    , first: false
                    , nodes: [
                          {
                              label: 'fie'
                            , version: '1.0.6'
                            , description: 'barfoo'
                            , first: false
                            , nodes: []
                          }
                      ]
                  }
              ]
          }

      mainBuildUtilMock
        .expects('localizePackageList')
        .once()
        .withExactArgs(packagesArg, treeArg)
        .returns(localPackagesArg)

      forEachExpectation = mainBuildUtilMock
        .expects('forEachOrderedDependency')
        .once()
        .withArgs(localPackagesArg, treeArg)

      result = mainInfoUtil.buildArchyTree(packagesArg, treeArg)

      mainBuildUtilMock.verify()

      forEachCallback = forEachExpectation.lastCall.args[2]

      forEachCallback(
          'foobar'
        , [ 'foo', 'bar' ]
        , { packageJSON: { version: '1.0.0', name: 'fooblah1', description: 'barfoo' }}
        , 0
        , true
      )

      forEachCallback(
          'baz'
        , [ 'foo', 'bar' ]
        , { packageJSON: { version: '1.0.1', name: 'fooblah2', description: 'barfoo' }}
        , 0
        , true
      )

      forEachCallback(
          'bing'
        , [ 'foo', 'bar' ]
        , { packageJSON: { version: '1.0.2', name: 'fooblah3', description: 'barfoo' }}
        , 0
        , true
      )

      forEachCallback(
          'bar'
        , [ 'foo' ]
        , { packageJSON: { version: '1.0.3', name: 'fooblah4', description: 'barfoo' }}
        , 0
        , true
      )

      forEachCallback(
          'foo'
        , [ ]
        , { packageJSON: { version: '1.0.4', name: 'fooblah5', description: 'barfoo' }}
        , 0
        , true
      )

      forEachCallback(
          'fee'
        , []
        , { packageJSON: { version: '1.0.5', name: 'fooblah6', description: 'barfoo' }}
        , 0
        , false
      )

      forEachCallback(
          'fie'
        , [ 'fee' ]
        , { packageJSON: { version: '1.0.6', name: 'fooblah7', description: 'barfoo' }}
        , 0
        , false
      )

      assert.equals(result, expectedResult)
    }
})