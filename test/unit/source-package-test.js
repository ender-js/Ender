var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , sourcePackage = require('../../lib/source-package')

  , templateFiles = {
        'standard': __dirname + '/../../resources/source-package.handlebars'
      , 'ender-js': __dirname + '/../../resources/ender-js-package.handlebars'
    }
  , templateFileContents

testCase('Source package', {
    'setUp': function (done) {
      this.runAsStringTest =
          function (options, done) {
        // options: expectedFileReads, fileContents, readDelays, parents, pkg, json, expectedResult

        var fsMock = this.mock(fs)
          , tmplType = templateFileContents[options.pkg] ? options.pkg : 'standard'

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
          fsMock.expects('readFile').withArgs(path.resolve(templateFiles[tmplType]), 'utf-8').callsArgWith(2, null, templateFileContents[tmplType])
          templateFileContents[tmplType] = -1 // i.e. only run this branch once
        }

        sourcePackage.create(options.parents || [], options.pkg, options.json).asString(function (err, actual) {
          refute(err)
          assert.equals(actual, options.expectedResult)
          done()
        })
      }

      this.buildExpectedResult = function (options) {
        // don't be too clever here so we can be clever in the code we're testing.
        // source indenting should be done by the caller, not here.
        var src = ''
        src += '!function () {\n\n  var module = { exports: {} }, exports = module.exports;\n\n'
        if (options.main)
          src += options.main + '\n\n'
        src += '  provide("' + options.name + '", module.exports);\n\n'
        if (options.ender)
          src += options.ender + '\n\n'
        else
          src += '  $.ender(module.exports);\n\n'
        src += '}();\n'
        return src
      }

      if (!templateFileContents) {
        // unfortunately we have to mock this out as we're mocking out the whole `fs`
        async.map(
            [ 'standard', 'ender-js' ]
          , function (type, callback) {
              fs.readFile(templateFiles[type], 'utf8', callback)
            }
          , function (err, templates) {
              if (err)
                throw err
              templateFileContents = {
                  'standard': templates[0]
                , 'ender-js': templates[1]
              }
              done()
            }
        )
      } else
        done()
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
                ,   '!function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n\n'
                  + '  provide("foobar", module.exports);\n\n'
                  + '  $.ender(module.exports);\n\n'
                  + '}();\n'
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
                ,   '!function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  provide("foobar", module.exports);\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n\n'
                  + '}();\n'
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
                ,   '!function () {\n\n'
                  + '  var module = { exports: {} }, exports = module.exports;\n\n'
                  + '  main\n\n'
                  + '  source\n'
                  + '  here\n\n\n'
                  + '  provide("foobar", module.exports);\n\n'
                  + '  this is a test\n\n'
                  + '  1\n'
                  + '  2\n'
                  + '  3\n\n\n'
                  + '}();\n'
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

  , 'test ender-js package': function (done) {
      this.runAsStringTest({
          expectedFileReads: [ 'node_modules/ender-js/main.js' ]
        , fileContents: [ 'ender-js\ncontents' ]
        , pkg: 'ender-js'
        , json: { name: 'ender-js', main: './main.js' }
        , expectedResult: 'ender-js\ncontents\n'
      }, done)
    }

})
