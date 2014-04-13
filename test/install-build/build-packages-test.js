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


var buster        = require('bustermove')
  , assert        = require('referee').assert
  , refute        = require('referee').refute
  , fs            = require('fs')
  , path          = require('path')

  , argsParser    = require('../../lib/args-parser')
  , assemble      = require('../../lib/assemble')
  , LocalPackage  = require('../../lib/local-package')
  , minifiers     = require('../../lib/minifiers')

  , buildPackages = require('../../lib/commands/build').buildPackages


buster.testCase('Building Packages', {
    'setUp': function () {
      this.createPackageMock = function (name, expectExtendOptions) {
        var pkg = LocalPackage.createPackage(path.resolve(path.join('node_modules', name)))
          , pkgMock = this.mock(pkg)

        pkgMock.expects('loadSources').once().callsArgWith(0, null)
        if (expectExtendOptions) pkgMock.expects('extendOptions').once().returns({})

        return pkg
      }
    }

  , 'asString': {
        'plain': function (done) {
          var packagesArg = [
                  this.createPackageMock('pkg1', false)
                , this.createPackageMock('pkg2', false)
                , this.createPackageMock('pkg3', false)
              ]

            , filesArg = {
                  build: 'unminified'
                , sourceMap: 'source map'
              }

            , optionsArg = { options: 1, minifier: 'none' }
            , assembleMock = this.mock(assemble)
            , minifiersMock = this.mock(minifiers)
            , fsMock = this.mock(fs)

          assembleMock
            .expects('assemble')
            .once()
            .withArgs('ender.js', 'ender.js.map', optionsArg, packagesArg)
            .callsArgWith(4, null, filesArg)

          minifiersMock.expects('uglify').never()
          fsMock.expects('writeFile').twice().callsArg(3)

          buildPackages(optionsArg, packagesArg, function (err) {
            refute(err)
            assert.equals(filesArg.build, 'unminified')
            assert.equals(filesArg.sourceMap, 'source map')
            assert.equals(filesArg.minifiedBuild, undefined)
            done()
          })
        }

      , 'minify': function (done) {
          var packagesArg = [
                  this.createPackageMock('pkg1', true)
                , this.createPackageMock('pkg2', true)
                , this.createPackageMock('pkg3', true)
              ]

            , filesArg = {
                  build: 'unminified'
                , sourceMap: 'source map'
                , minifiedBuild: 'minified'
                , minifiedSourceMap: 'minified source map'
              }

            , filenamesArg = {
                  build: 'ender.js'
                , sourceMap: 'ender.js.map'
                , minifiedBuild: 'ender.min.js'
                , minifiedSourceMap: 'ender.min.js.map'
              }

            , optionsArg = { options: 1, minifier: 'uglify' }
            , assembleMock = this.mock(assemble)
            , minifiersMock = this.mock(minifiers)
            , fsMock = this.mock(fs)

          assembleMock
            .expects('assemble')
            .once()
            .withArgs('ender.js', 'ender.js.map', optionsArg, packagesArg)
            .callsArgWith(4, null, filesArg)

          minifiersMock
            .expects('uglify')
            .once()
            .withArgs(filesArg, filenamesArg, optionsArg)
            .callsArgWith(3, null, filesArg)

          fsMock.expects('writeFile').exactly(4).callsArg(3)

          buildPackages(optionsArg, packagesArg, function (err) {
            refute(err)
            assert.equals(filesArg.build, 'unminified')
            assert.equals(filesArg.sourceMap, 'source map')
            assert.equals(filesArg.minifiedBuild, 'minified')
            assert.equals(filesArg.minifiedSourceMap, 'minified source map')
            done()
          })
        }

        // the minifier function should be passed an options object that has been extended by
        // each of the packages, this allows for packages to add on options such as 'externs'
        // which are passed to the minifier
      , 'minify extends options for each package (externs)': function (done) {
          var packagesArg = [
                  this.createPackageMock('pkg1', true)
                , this.createPackageMock('pkg2', true)
                , this.createPackageMock('pkg3', true)
              ]

            , filesArg = {
                  build: 'unminified'
                , sourceMap: 'source map'
                , minifiedBuild: 'minified'
                , minifiedSourceMap: 'minified source map'
              }

            , filenamesArg = {
                  build: 'ender.js'
                , sourceMap: 'ender.js.map'
                , minifiedBuild: 'ender.min.js'
                , minifiedSourceMap: 'ender.min.js.map'
              }

            , optionsArg = { options: 1, minifier: 'closure', externs: [ 'extern0' ] }
            , expectedOptionsArg = { options: 1, minifier: 'closure', externs: [ 'extern0', 'extern1', 'extern2', 'extern3' ] }
            , assembleMock = this.mock(assemble)
            , minifiersMock = this.mock(minifiers)
            , fsMock = this.mock(fs)

          // sort of mock out the extendOptions() function
          packagesArg[1].extendOptions = function (options) {
            options.externs.push('extern1')
            options.externs.push('extern2')
          }

          packagesArg[2].extendOptions = function (options) {
            options.externs.push('extern3')
          }

          assembleMock
            .expects('assemble')
            .once()
            .withArgs('ender.js', 'ender.js.map', optionsArg, packagesArg)
            .callsArgWith(4, null, filesArg)

          minifiersMock
            .expects('closure')
            .once()
            .withArgs(filesArg, filenamesArg, expectedOptionsArg)
            .callsArgWith(3, null, filesArg)

          fsMock.expects('writeFile').exactly(4).callsArg(3)

          buildPackages(optionsArg, packagesArg, function (err) {
            refute(err)
            assert.equals(filesArg.build, 'unminified')
            assert.equals(filesArg.sourceMap, 'source map')
            assert.equals(filesArg.minifiedBuild, 'minified')
            assert.equals(filesArg.minifiedSourceMap, 'minified source map')
            done()
          })
        }
    }
})