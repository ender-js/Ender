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


var testCase        = require('buster').testCase
  , fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , SourcePackage   = require('../../lib/source-package')
  , FilesystemError = require('../../lib/errors').FilesystemError

  , templateFiles = {
        'standard' : path.join(__dirname, '/../../resources/source-package.mustache')
      , 'root'     : path.join(__dirname, '/../../resources/root-package.mustache')
      , 'file'     : path.join(__dirname, '/../../resources/source-file.mustache')
    }
  , templateFileContents

require('glob')

testCase('Source package', {
    'setUp': function (done) {

      // a very hacky stub for glob, replace glob.Glob with a simple func that returns the first arg
      // restore it in tearDown
      var exp = require.cache[require.resolve('glob')].exports
      this._oldGlob = exp.Glob
      exp.Glob = function (f, opt, cb) {
        cb(null, [ f ])
      }

      // TODO: demystify and clean this mess up
      this.runAsStringTest = function (options, done) {
        // options: expectedFileReads, fileContents, readDelays, parents, pkg, json, expectedResult

        var fsMock   = this.mock(fs)
          , tmplType = options.json.name == 'ender-js' ? 'root' : 'standard'
          , srcPkg

        options.expectedFileReads.forEach(function (file, index) {
          var exp = fsMock.expects('readFile')
                .withArgs(
                    path.resolve(file)
                  , 'utf-8'
                )
            if (!options.readDelays)
            exp.callsArgWith(2, null, options.fileContents[index])
          else {
            setTimeout(function () {
              exp.args[0][2].call(null, null, options.fileContents[index])
            }, options.readDelays[index])
          }
        })

        if (typeof templateFileContents[tmplType] == 'string') {
          fsMock
            .expects('readFile')
            .withArgs(path.resolve(templateFiles[tmplType]), 'utf-8')
            .callsArgWith(2, null, templateFileContents[tmplType])
          templateFileContents[tmplType] = -1 // i.e. only run this branch once
        }
        if (tmplType == 'standard' && options.json.main && typeof templateFileContents.file == 'string') {
          fsMock
            .expects('readFile')
            .withArgs(path.resolve(templateFiles.file), 'utf-8')
            .callsArgWith(2, null, templateFileContents.file)
          templateFileContents.file = -1 // i.e. only run this branch once
        }

        srcPkg = SourcePackage.create(
            options.pkg
          , options.parents || []
          , tmplType == 'root'
          , options.json
          , options.options || {}
        )

        srcPkg.asString(function (err, actual) {
          refute(err)
          assert.equals(actual, options.expectedResult)
          done && done()
        })

        return srcPkg
      }

      this.buildExpectedResult = function (options) {
        // don't be too clever here so we can be clever in the code we're testing.
        // source indenting should be done by the caller, not here.
        var src = ''
        src += '(function () {\n\n  var module = { exports: {} }, exports = module.exports;\n'
        if (options.main)
          src += '\n' + options.main
        src += '\n  provide("' + options.name + '", module.exports);'
        if (options.sandbox)
          src += '\n\n  window["' + options.name + '"] = module.exports;'
        if (options.ender)
          src += '\n\n' + options.ender
        else
          src += '\n  $.ender(module.exports);'
        src += '\n}());'
        return src
      }

      if (!templateFileContents) {
        // unfortunately we have to mock this out as we're mocking out the whole `fs`
        async.map(
            [ 'standard', 'root', 'file' ]
          , function (type, callback) {
              fs.readFile(templateFiles[type], 'utf8', callback)
            }
          , function (err, templates) {
              if (err)
                throw err
              templateFileContents = {
                  'standard' : templates[0]
                , 'root'     : templates[1]
                , 'file'     : templates[2]
              }
              done()
            }
        )
      } else
        done()
    }

  , 'tearDown': function () {
      require.cache[require.resolve('glob')].exports.Glob = this._oldGlob
    }

    // test our internal methods, declared in setUp
  , 'internal tests': {
        'buildExpectedResult': {
            'test main with no ender': function () {
              assert.equals(this.buildExpectedResult({
                      name: 'foobar'
                    , main:
                          '  this is a test\n\n'
                        + '  1\n'
                        + '  2\n'
                        + '  3\n'
                  })
                ,   '(function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n'
                  + '  provide("foobar", module.exports);\n'
                  + '  $.ender(module.exports);\n'
                  + '}());'
              )
            }

          , 'test ender with no main': function () {
              assert.equals(this.buildExpectedResult({
                      name: 'foobar'
                    , ender:
                          '  this is a test\n\n'
                        + '  1\n'
                        + '  2\n'
                        + '  3\n'
                  })
                ,   '(function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  provide("foobar", module.exports);\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n'
                  + '}());'
              )
            }

          , 'test main and ender': function () {
              assert.equals(this.buildExpectedResult({
                      name: 'foobar'
                    , main:
                          '  main\n\n'
                        + '  source\n'
                        + '  here\n'
                    , ender:
                          '  this is a test\n\n'
                        + '  1\n'
                        + '  2\n'
                        + '  3\n'
                  })
                ,   '(function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  main\n\n'
                  + '  source\n'
                  + '  here\n\n'
                  + '  provide("foobar", module.exports);\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n'
                  + '}());'
              )
            }
        }
    }

  , 'main-only': {
        'test (single) main-only asString without .js extension': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ]
              , fileContents: [ 'mainsrc contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', main: 'lib/mainsrc' }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', main: '  mainsrc contents' })
            },  done)
        }

      , 'test (single) main-only asString with .js extension': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ]
              , fileContents: [ 'mainsrc.js contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', main: 'lib/mainsrc.js' }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', main: '  mainsrc.js contents' })
            },  done)
        }

      , 'test (multiple) main-only asString (mixed extensions)': function (done) {
          this.runAsStringTest({
                expectedFileReads: [
                    'node_modules/mypkg/lib/mainsrc.js'
                  , 'node_modules/mypkg/lib/foo/bar.js'
                  , 'node_modules/mypkg/lib/foo/bar/baz.js'
                ]
              , fileContents: [
                    'mainsrc.js contents'
                  , 'BAR!'
                  , 'BAZ!'
                ]
              , pkg: 'mypkg'
              , json: {
                    name: 'mypkg-name'
                  , main: [
                        'lib/mainsrc.js'
                      , 'lib/foo/bar'
                      , 'lib/foo/bar/baz'
                    ]
                }
              , expectedResult: this.buildExpectedResult({ name: 'mypkg-name', main: '  mainsrc.js contents\n\n  BAR!\n\n  BAZ!' })
            },  done)
        }

      , 'test (multiple) main-only asString (mixed extensions) with out-of-order read returns': function (done) {
          // test that even though we read the source files in parallel that they get stitched together
          // in the right order in the end. Delay the callbacks from the reads to emulate out-of-order
          // filesystem reads
          this.runAsStringTest({
                expectedFileReads: [
                    'node_modules/mypkg/lib/mainsrc.js'
                  , 'node_modules/mypkg/lib/foo/bar.js'
                  , 'node_modules/mypkg/lib/foo/bar/baz.js'
                ]
              , fileContents: [
                    'mainsrc.js contents'
                  , 'BAR!'
                  , 'BAZ!'
                ]
              , readDelays: [ 50, 25, 0 ]
              , pkg: 'mypkg'
              , json: {
                    name: 'mypkg-name'
                  , main: [
                        'lib/mainsrc.js'
                      , 'lib/foo/bar'
                      , 'lib/foo/bar/baz'
                    ]
                }
              , expectedResult: this.buildExpectedResult({ name: 'mypkg-name', main: '  mainsrc.js contents\n\n  BAR!\n\n  BAZ!' })
            },  done)
        }

      , 'test (single) main-only asString, with ender=noop': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ]
              , fileContents: [ 'mainsrc contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', main: 'lib/mainsrc', ender: 'noop' }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', main: '  mainsrc contents' })
            },  done)
        }

      , 'test (single) main-only asString, with ender={}': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ]
              , fileContents: [ 'mainsrc contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', main: 'lib/mainsrc', ender: { } }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', main: '  mainsrc contents' })
            },  done)
        }

    }

  , 'ender-only': {
        'test (single) ender-only asString without .js extension': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/endersrc.js' ]
              , fileContents: [ 'endersrc contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', ender: 'lib/endersrc' }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', ender: '  endersrc contents' })
            },  done)
        }

      , 'test (single) ender-only asString with .js extension': function (done) {
          this.runAsStringTest({
                expectedFileReads: [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/endersrc.js' ]
              , fileContents: [ 'endersrc.js contents' ]
              , parents: [ 'parent1', 'parent2' ]
              , pkg: 'apkg'
              , json: { name: 'apkg-name', ender: 'lib/endersrc.js' }
              , expectedResult: this.buildExpectedResult({ name: 'apkg-name', ender: '  endersrc.js contents' })
            },  done)
        }

      , 'test (multiple) ender-only asString (mixed extensions)': function (done) {
          this.runAsStringTest({
                expectedFileReads: [
                    'node_modules/mypkg/lib/endersrc.js'
                  , 'node_modules/mypkg/lib/foo/bar.js'
                  , 'node_modules/mypkg/lib/foo/bar/baz.js'
                ]
              , fileContents: [
                    'endersrc.js contents'
                  , 'BAR!'
                  , 'BAZ!'
                ]
              , pkg: 'mypkg'
              , json: {
                    name: 'mypkg-name'
                  , ender: [
                        'lib/endersrc.js'
                      , 'lib/foo/bar'
                      , 'lib/foo/bar/baz'
                    ]
                }
              , expectedResult: this.buildExpectedResult({ name: 'mypkg-name', ender: '  endersrc.js contents\n\n  BAR!\n\n  BAZ!' })
            },  done)
        }

      , 'test (multiple) ender-only asString (mixed extensions) with out-of-order read returns': function (done) {
          // test that even though we read the source files in parallel that they get stitched together
          // in the right order in the end. Delay the callbacks from the reads to emulate out-of-order
          // filesystem reads
          this.runAsStringTest({
                expectedFileReads: [
                    'node_modules/mypkg/lib/endersrc.js'
                  , 'node_modules/mypkg/lib/foo/bar.js'
                  , 'node_modules/mypkg/lib/foo/bar/baz.js'
                ]
              , fileContents: [
                    'endersrc.js contents'
                  , 'BAR!'
                  , 'BAZ!'
                ]
              , readDelays: [ 50, 25, 0 ]
              , pkg: 'mypkg'
              , json: {
                    name: 'mypkg-name'
                  , ender: [
                        'lib/endersrc.js'
                      , 'lib/foo/bar'
                      , 'lib/foo/bar/baz'
                    ]
                }
              , expectedResult: this.buildExpectedResult({ name: 'mypkg-name', ender: '  endersrc.js contents\n\n  BAR!\n\n  BAZ!' })
            },  done)
        }
    }

  , 'test (multiple) main and ender asString (mixed extensions) with out-of-order read returns': function (done) {
      // crazytown!
      this.runAsStringTest({
            expectedFileReads: [
                'node_modules/mypkg/mainsrc.js'
              , 'node_modules/mypkg/lib/foo/bar.js'
              , 'node_modules/mypkg/lib/foo/bar/baz.js'
              , 'node_modules/mypkg/endersrc.js'
              , 'node_modules/mypkg/ender/foo/bar.js'
              , 'node_modules/mypkg/ender/foo/bar/baz.js'
            ]
          , fileContents: [
                'mainsrc.js contents'
              , 'BAR!'
              , 'BAZ!'
              , 'endersrc.js contents'
              , 'ENDERBAR!'
              , 'ENDERBAZ!'
            ]
          , readDelays: [ 50, 0, 25, 40, 0, 20 ]
          , pkg: 'mypkg'
          , json: {
                name: 'mypkg-name'
              , main: [
                    './mainsrc.js'
                  , 'lib/foo/bar'
                  , 'lib/foo/bar/baz'
                ]
              , ender: [
                    './endersrc.js'
                  , 'ender/foo/bar'
                  , 'ender/foo/bar/baz'
                ]
            }
          , expectedResult: this.buildExpectedResult({
                name: 'mypkg-name'
              , main: '  mainsrc.js contents\n\n  BAR!\n\n  BAZ!'
              , ender: '  endersrc.js contents\n\n  ENDERBAR!\n\n  ENDERBAZ!'
            })
        },  done)
    }

  , 'test multiple calls to asString on same build before complete': function (done) {
      // test that if we call asString twice prior to it finishing that we'll only
      // process once.
      var expectedResult = this.buildExpectedResult({
              name: 'mypkg-name'
            , main: '  mainsrc.js contents'
            , ender: '  endersrc.js contents'
          })
        , srcPkg = this.runAsStringTest({
              expectedFileReads: [
                  'node_modules/mypkg/mainsrc.js'
                , 'node_modules/mypkg/endersrc.js'
              ]
            , fileContents: [
                  'mainsrc.js contents'
                , 'endersrc.js contents'
              ]
            , readDelays: [ 25, 25 ]
            , pkg: 'mypkg'
            , json: {
                  name: 'mypkg-name'
                , main: './mainsrc.js'
                , ender: './endersrc.js'
              }
            , expectedResult: expectedResult
          })

        // second call
        srcPkg.asString(function (err, actual) {
          refute(err)
          assert.equals(actual, expectedResult)
        })

        setTimeout(function () {
          // third call, after 'generated'
          srcPkg.asString(function (err, actual) {
            refute(err)
            assert.equals(actual, expectedResult)
            done()
          })
        }, 50)
    }

  , 'test ender-js package': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/ender-js/main.js' ]
        , fileContents: [ 'ender-js\ncontents' ]
        , pkg: 'ender-js'
        , json: { name: 'ender-js', main: './main.js' }
        , expectedResult: 'ender-js\ncontents'
      }, done)
    }

  , 'test noop option': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/foobar/main.js' ]
        , fileContents: [ 'main\nsource\ncontents' ]
        , pkg: 'foobar'
        , json: { name: 'foobar', main: './main.js' }
        , options: { noop: true }
        , expectedResult: 'main\nsource\ncontents'
      }, done)
    }

  , 'test sandbox option (not on this package)': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/foobar/main.js' ]
        , fileContents: [ 'main\nsource\ncontents' ]
        , pkg: 'foobar'
        , json: {
              name: 'foobar'
            , main: './main.js'
          }
        , options: { sandbox: [ 'foo', 'bar' ] }
        , expectedResult: this.buildExpectedResult({
              name: 'foobar'
            , main: '  main\n  source\n  contents'
          })
      }, done)
    }

  , 'test sandbox option (on this package)': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/foobar/main.js' ]
        , fileContents: [ 'main\nsource\ncontents' ]
        , pkg: 'foobar'
        , json: {
              name: 'foobar'
            , main: './main.js'
          }
        , options: { sandbox: [ 'foobar', 'bar' ] }
        , expectedResult: this.buildExpectedResult({
              name: 'foobar'
            , main: '  main\n  source\n  contents'
            , sandbox: true
          })
      }, done)
    }

  , 'test sandbox option for root package (ender-js)': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ './foobar/main.js' ]
        , fileContents: [ 'main\nsource\ncontents\n' ]
        , pkg: './foobar'
        , json: {
              name: 'ender-js'
            , main: './main.js'
          }
        , options: { sandbox: [ 'foo', 'bar' ] }
        , expectedResult:
              '/* Declare local API */\n'
            + 'var require, provide, $, ender;\n\n'
            + 'main\nsource\ncontents\n\n\n'
            + '/* Set Local API */\n'
            + 'require = this.require;\n'
            + 'provide = this.provide;\n'
            + 'ender = $ = this.ender;'

      }, done)
    }

  , 'test special characters not escaped': function (done) {
      // don't want a templating engine to escape for us
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/foobar/main.js' ]
        , fileContents: [ '!@#$%^&*()_+=-\\][{}|\';:"/.,<>?' ]
        , pkg: 'foobar'
        , json: {
              name: 'foobar'
            , main: './main.js'
          }
        , options: { }
        , expectedResult: this.buildExpectedResult({
              name: 'foobar'
            , main: '  !@#$%^&*()_+=-\\][{}|\';:"/.,<>?'
          })
      }, done)
    }

  , 'test identifier': function () {
      var json = { name: 'foobar', version: '1.2.3' }
        , srcPackage = SourcePackage.create('foobar', null, false, json)

      json.__proto__ = { name: 'barfoo' } // original json, see package-descriptor.js
      assert.equals(srcPackage.identifier, 'barfoo@1.2.3')
    }

  , 'test fs error': function (done) {
        var fsMock = this.mock(fs)
          , errArg = new Error('this is an error')

        fsMock.expects('readFile').once().callsArgWith(2, errArg)

        SourcePackage
          .create('whatevs', [], false, { name: 'whatevs', main: './main.js' }, {})
          .asString(function (err, arg) {
            assert(err)
            refute(arg)
            assert(err instanceof FilesystemError)
            assert.same(err.cause, errArg)
            assert.same(err.message, errArg.message)
            done()
          })
    }

  , 'extendOptions': {
        'test nothing to extend': function () {
          var pkg  = SourcePackage.create('whatevs', [], false, { name: 'whatevs', main: './main.js' }, {})
            , opts = { foo: 'bar' }

          pkg.extendOptions(opts)
          assert.equals(opts, { foo: 'bar' }) // shoudn't be touched
        }

      , 'test externs': function () {
          var pkg  = SourcePackage.create('whatevs', [], false, { name: 'whatevs', main: './main.js', externs: 'lib/foo.js' }, {})
            , opts = { foo: 'bar' }

          pkg.extendOptions(opts)
          assert.equals(opts, { foo: 'bar', externs: [ path.resolve('node_modules/whatevs/lib/foo.js') ] }) // shoudn't be touched
        }

      , 'test externs with overridden pkg name': function () {
          // just to make sure we're pointing to the right dir, not using the overridden name

          var json = { name: 'whatevs', main: './main.js', externs: 'lib/foo.js' }
            , pkg  = SourcePackage.create('whatevs', [], false, json, {})
            , opts = { foo: 'bar' }
          json.__proto__ = { name: 'whoa' }

          pkg.extendOptions(opts)
          assert.equals(opts, { foo: 'bar', externs: [ path.resolve('node_modules/whoa/lib/foo.js') ] })
        }

      , 'test externs array and nested pkg': function () {
          var pkg  = SourcePackage.create('whatevs', [ 'boom', 'bang' ], false, { name: 'whatevs', main: './main.js', externs: [ 'lib/foo.js', 'BOOM.js' ] }, {})
            , opts = { foo: 'bar' }

          pkg.extendOptions(opts)
          assert.equals(opts, { foo: 'bar', externs: [
              path.resolve('node_modules/boom/node_modules/bang/node_modules/whatevs/lib/foo.js')
            , path.resolve('node_modules/boom/node_modules/bang/node_modules/whatevs/BOOM.js')
          ] })
        }

      , 'test externs array over existing externs': function () {
          var pkg  = SourcePackage.create('whatevs', [ ], false, { name: 'whatevs', main: './main.js', externs: [ 'lib/foo.js', 'BOOM.js' ] }, {})
            , opts = { foo: 'bar', externs: [ 'existing1.js', 'existing2.js' ] }

          pkg.extendOptions(opts)
          assert.equals(opts, { foo: 'bar', externs: [
              'existing1.js'
            , 'existing2.js'
            , path.resolve('node_modules/whatevs/lib/foo.js')
            , path.resolve('node_modules/whatevs/BOOM.js')
          ] })
        }
    }
})