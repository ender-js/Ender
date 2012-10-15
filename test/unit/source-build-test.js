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
  , BuildParseError = require('../../lib/errors').BuildParseError
  , UnknownMainError = require('../../lib/errors').UnknownMainError
  , SourcePackage = require('../../lib/source-package')
  , SourceBuild = require('../../lib/source-build')
  , minify = require('../../lib/minify')
  , argsParse = require('../../lib/args-parse')
  , FilesystemError = require('../../lib/errors').FilesystemError

var createExpectedHeader = function (context, packageList) {
      return [
          "/*!"
        , "  * ============================================================="
        , "  * Ender: open module JavaScript framework (https://ender.no.de)"
        , "  * Build: ender " + context
        , "  * Packages: " + packageList
        , "  * ============================================================="
        , "  */"
      ].join('\n') + '\n\n'
    }

testCase('Source build', {
    'setUp': function () {
      this.createPackageMock = function (content, identifier) {
        var pkg = SourcePackage.create()
          , pkgMock = this.mock(pkg)

        pkgMock.expects('asString').once().callsArgWith(0, null, content)
        pkg.__defineGetter__('identifier', function () { return identifier }) // sinon can't mock getters
        return pkg
      }
      this.createArgsParseMock = function (optionsArg, contextArg) {
        var argsParseMock = this.mock(argsParse)
        argsParseMock.expects('toContextString').withExactArgs(optionsArg).once().returns(contextArg)
      }
    }

  , 'asString': {
        'plain': function (done) {
          var pkg1Content = 'package 1\ncontents'
            , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
            , pkg2Content = 'package 2\n\ncontents'
            , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
            , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
            , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
            , optionsArg = { options: 1 }
            , srcBuild = SourceBuild.create(optionsArg)
            , contextArg = 'some context here & don\'t escape <this>'
            , plainSource =
                  createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
                + pkg1Content + '\n\n'
                + pkg2Content + '\n\n'
                + pkg3Content
            , mockMinify = this.mock(minify)

          this.createArgsParseMock(optionsArg, contextArg)
          srcBuild.addPackage(pkg1)
          srcBuild.addPackage(pkg2)
          srcBuild.addPackage(pkg3)

          mockMinify.expects('minify').never()

          srcBuild.asString({ type: 'plain' }, function (err, actual) {
            refute(err)
            assert.equals(actual, plainSource)
            done()
          })
        }

      , 'minify': function (done) {
          var pkg1Content = 'package 1\ncontents'
            , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
            , pkg2Content = 'package 2\n\ncontents'
            , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
            , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
            , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
            , optionsArg = { options: 1 }
            , srcBuild = SourceBuild.create(optionsArg)
            , contextArg = 'some minified context here & don\'t escape <this>'
            , plainSource =
                  createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
                + pkg1Content + '\n\n'
                + pkg2Content + '\n\n'
                + pkg3Content
            , minifiedSource = 'this is minified, these are not the droids you are looking for'
            , mockMinify = this.mock(minify)

          this.createArgsParseMock(optionsArg, contextArg)
          srcBuild.addPackage(pkg1)
          srcBuild.addPackage(pkg2)
          srcBuild.addPackage(pkg3)

          mockMinify.expects('minify').once().withArgs(optionsArg, plainSource).callsArgWith(2, null, minifiedSource)

          srcBuild.asString({ type: 'minified' }, function (err, actual) {
            refute(err)
            assert.equals(actual, minifiedSource)
            done()
          })
        }

      , 'sandboxed': function (done) {
          var pkg1Content = 'package 1\ncontents'
            , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
            , pkg2Content = 'package 2\n\ncontents'
            , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
            , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
            , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
            , optionsArg = { sandbox: [ 'foo', 'bar' ] }
            , srcBuild = SourceBuild.create(optionsArg)
            , contextArg = 'some context here & don\'t escape <this>'
            , plainSource =
                  createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
                + '!function () {\n\n'
                + pkg1Content + '\n\n' + pkg2Content + '\n\n' + pkg3Content
                + '\n\n}.call({});'
            , mockMinify = this.mock(minify)

          this.createArgsParseMock(optionsArg, contextArg)
          srcBuild.addPackage(pkg1)
          srcBuild.addPackage(pkg2)
          srcBuild.addPackage(pkg3)

          mockMinify.expects('minify').never()

          srcBuild.asString({ type: 'plain' }, function (err, actual) {
            refute(err)
            assert.equals(actual, plainSource)
            done()
          })
        }

        // the minifier function should be passed an options object that has been extended by
        // each of the packages, this allows for packages to add on options such as 'externs'
        // which are passed to the minifier
      , 'minify extends options for each package (externs)': function (done) {
          var pkg1 = this.createPackageMock('p1', "pkg1@0.1.1")
            , pkg2 = this.createPackageMock('p2', "pkg2@1.1.1")
            , pkg3 = this.createPackageMock('p3', "pkg3@1.2.3")
            , optionsArg = { options: 1, externs: [ 'extern0' ] }
            , expectedOptionsArg
            , srcBuild = SourceBuild.create(optionsArg)
            , contextArg = 'some minified context here & don\'t escape <this>'
            , plainSource =
                  createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
                + 'p1\n\np2\n\np3'
            , minifiedSource = 'this is minified, these are not the droids you are looking for'
            , mockMinify = this.mock(minify)

          this.createArgsParseMock(optionsArg, contextArg)
          srcBuild.addPackage(pkg1)
          srcBuild.addPackage(pkg2)
          srcBuild.addPackage(pkg3)

          // sort of mock out the extendOptions() function
          pkg2.extendOptions = function (options) {
            options.externs.push('extern1')
            options.externs.push('extern2')
          }
          pkg3.extendOptions = function (options) {
            options.externs.push('extern3')
          }
          expectedOptionsArg = { options: 1, externs: [ 'extern0', 'extern1', 'extern2', 'extern3' ] }

          mockMinify.expects('minify').once().withArgs(expectedOptionsArg, plainSource).callsArgWith(2, null, minifiedSource)

          srcBuild.asString({ type: 'minified' }, function (err, actual) {
            refute(err)
            assert.equals(actual, minifiedSource)
            done()
          })
        }
    }

  , 'parseContext': {
        'test simple old-skool parse': function (done) {
          var content = ''
                + '/*!\n'
                + '  * =============================================================\n'
                + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
                + '  * Build: ender build foo bar baz --use blah --sandbox foo\n'
                + '  * =============================================================\n'
                + '  */\n\n'
                + arguments.callee.toString()

            , expectedOptions = {
                  main: 'build'
                , packages: [ 'foo', 'bar', 'baz' ]
                , use: 'blah'
                , sandbox: [ 'foo' ]
              }
            , filename = 'somefile'
            , mockFs = this.mock(fs)
            , fdArg = 99

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
          mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

          SourceBuild.parseContext(filename, function (err, options, packages) {
            refute(err)
            refute(packages)
            assert.equals(options, expectedOptions)
            done()
          })
        }

      , 'test simple new-style parse': function (done) {
          var expectedPackages = 'ender-js@0.3.7 bean@0.4.9 qwery@3.3.3 bonzo@1.0.1 domready@0.2.11 bowser@0.1.0'.split(' ')
            , content = ''
                + '/*!\n'
                + '  * =============================================================\n'
                + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
                + '  * Build: ender build foo bar baz --use blah --sandbox foo\n'
                + '  * Packages: ' + expectedPackages.join(' ') + '\n'
                + '  * =============================================================\n'
                + '  */\n\n'
                + arguments.callee.toString()

            , expectedOptions = {
                  main: 'build'
                , packages: [ 'foo', 'bar', 'baz' ]
                , use: 'blah'
                , sandbox: [ 'foo' ]
              }
            , filename = 'somefile'
            , mockFs = this.mock(fs)
            , fdArg = 99

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
          mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

          SourceBuild.parseContext(filename, function (err, options, packages) {
            refute(err)
            assert.equals(options, expectedOptions)
            assert.equals(packages, expectedPackages)
            done()
          })
        }

      , 'test bad build parse (bad ender spec)': function (done) {
          var content = ''
                + '/*!\n'
                + '  * =============================================================\n'
                + '  * Ender: open module JavaScript framework (https://ender.no.de)\n'
                + '  * Build: ender not a real build command\n'
                + '  * =============================================================\n'
                + '  */\n\n'
                + arguments.callee.toString()

            , filename = 'somefile'
            , mockFs = this.mock(fs)
            , fdArg = 99

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
          mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))

          SourceBuild.parseContext(filename, function (err, options, packages) {
            assert(err)
            refute(options)
            refute(packages)
            assert.equals(err.name, 'BuildParseError')
            assert(err.cause)
            assert(err.cause instanceof UnknownMainError)
            assert.equals(err.cause.name, 'UnknownMainError')
            done()
          })
        }

      , 'test bad build parse (not an ender file)': function (done) {
          var content = arguments.callee.toString()
            , filename = 'somefile'
            , mockFs = this.mock(fs)
            , fdArg = 99

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
          mockFs.expects('read').withArgs(fdArg).callsArgWith(5, null, 1, new Buffer(content))
          mockFs.expects('close').withArgs(fdArg).callsArg(1)

          SourceBuild.parseContext(filename, function (err, options, packages) {
            assert(err)
            refute(options)
            refute(packages)
            assert(err instanceof BuildParseError)
            assert.equals(err.name, 'BuildParseError')
            refute(err.cause)
            done()
          })
        }

      , 'test no such file error': function (done) {
          var filename = 'somefile'
            , mockFs = this.mock(fs)
            , errArg = new Error('this is an error')

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, errArg)

          SourceBuild.parseContext(filename, function (err, options, packages) {
            assert(err)
            refute(options)
            refute(packages)
            assert(err instanceof FilesystemError)
            assert.same(err.cause, errArg)
            assert.same(err.message, errArg.message)
            done()
          })
        }

      , 'test file read error': function (done) {
          var filename = 'somefile'
            , mockFs = this.mock(fs)
            , errArg = new Error('this is an error')
            , fdArg = 99

          mockFs.expects('open').withArgs(filename, 'r').callsArgWith(2, null, fdArg)
          mockFs.expects('read').withArgs(fdArg).callsArgWith(5, errArg)

          SourceBuild.parseContext(filename, function (err, options, packages) {
            assert(err)
            refute(options)
            refute(packages)
            assert(err instanceof FilesystemError)
            assert.same(err.cause, errArg)
            assert.same(err.message, errArg.message)
            done()
          })
        }
    }
})