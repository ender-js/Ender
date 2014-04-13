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

var assert        = require('referee').assert
  , async         = require('async')
  , buster        = require('bustermove')
  , events        = require('events')
  , path          = require('path')
  , refute        = require('referee').refute

  , mu            = require('mu2')

  , argsParser    = require('../../lib/args-parser')
  , assemble      = require('../../lib/assemble')


  buster.testCase('Assemble', {
    'setUp': function () {

      this.createPackageMock = function (descriptor) {
        var pkg = Object.create(descriptor)

        pkg.loaders = {}

        // Normally this is an async method, but not here
        pkg.loadSources = function (callback) {
          var files = pkg.files || []
          if (pkg.bridge) files.unshift(pkg.bridge)
          if (pkg.main) files.unshift(pkg.main)

          pkg.sources = []
          files.forEach(function (file) {
            pkg.sources.push({
                name: file.replace(/\.js?$/, '')
              , content: "// " + pkg.name + "/" + file + " contents\n"
            })
          })

          if (callback) callback()
        }

        pkg.bare = !!pkg.bare
        pkg.root = path.resolve(path.join('.', 'node_modules', pkg.name))
        pkg.__defineGetter__('id', function () { return pkg.name + '@' + pkg.version })

        return pkg
      }

      this.runAssembleTest = function (options, packages, expectedTemplateData, done) {
        var check = function (ob, checks) {
              for (var key in checks) {
                if (typeof checks[key] == 'object') check(ob[key], checks[key])
                else assert.equals(ob[key], checks[key])
              }
            }

        this.mock(argsParser)
            .expects('toContextString')
            .withExactArgs(options)
            .once()
            .returns('context string')

        this.stub(mu, 'compileAndRender', function (template, templateData) {
          assert(template == 'build.mustache' || template == 'build.map.mustache')
          check(templateData, expectedTemplateData)

          var emitter = new events.EventEmitter()
          process.nextTick(function () { emitter.emit('end') })
          return emitter
        })

        async.map(
            packages
          , function (pkg, cb) { pkg.loadSources(cb) }
          , function (err) {
              assemble.assemble('ender.js', 'ender.js.map', options, packages, done)
            }
        )
      }
    }

  , 'assemble': {
        'basic': function (done) {
          var options = { option: 1 }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
                , context: 'context string'
                , packages: [
                      { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                  ]
              }
            , done
          )
        }

      , 'with integration': function (done) {
          var options = { integrate: ['pkg3'] }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: 'lib/main' }
                  )
                , this.createPackageMock(
                    { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg3', version: '1.2.3', main: 'lib/main' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
                , context: 'context string'
                , packages: [
                      { isBare: false, isExposed: false, sources: { length: 1 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, bridge: 'bridge', sources: { length: 2 } }
                  ]
              }
            , done
          )
        }

      , 'basic sandbox': function (done) {
          var options = { sandbox: [] }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
                , context: 'context string'
                , packages: [
                      { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                  ]
              }
            , done
          )
        }

      , 'basic sandbox w/ exposed packages': function (done) {
          var options = { sandbox: ['pkg2'] }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
                , context: 'context string'
                , packages: [
                      { isBare: false, isExposed: false, sources: { length: 2 } }
                    , { isBare: false, isExposed: true, sources: { length: 2 } }
                    , { isBare: false, isExposed: false, sources: { length: 2 } }
                  ]
              }
            , done
          )
        }

    , 'bare packages': function (done) {
        var options = { options: 1 }
          , packages = [
                this.createPackageMock(
                  { bare: true, name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { bare: true, name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg4', version: '2.3.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
            ]

        this.runAssembleTest(
            options
          , packages
          , {
                packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3 pkg4@2.3.1'
              , context: 'context string'
              , packages: [
                    { isBare: true, isExposed: true, sources: { length: 2 } }
                  , { isBare: true, isExposed: true, sources: { length: 2 } }
                  , { isBare: false, isExposed: false, sources: { length: 2 } }
                  , { isBare: false, isExposed: false, sources: { length: 2 } }
                ]
            }
          , done
        )
      }

    , 'bare packages sandbox': function (done) {
        var options = { sandbox: [] }
          , packages = [
                this.createPackageMock(
                  { bare: true, name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                )
            ]

        this.runAssembleTest(
            options
          , packages
          , {
                packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
              , context: 'context string'
              , packages: [
                    { isBare: true, isExposed: false, sources: { length: 1 } }
                  , { isBare: false, isExposed: false, sources: { length: 2 } }
                  , { isBare: false, isExposed: false, sources: { length: 2 } }
                ]
            }
          , done
        )
      }

    , 'bare packages sandbox w/ exposed packages': function (done) {
        var options = { sandbox: ['pkg1', 'pkg2'] }
          , packages = [
                this.createPackageMock(
                  { bare: true, name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                )
              , this.createPackageMock(
                  { name: 'pkg3', version: '1.2.3', main: 'lib/main', bridge: 'lib/bridge' }
                )
            ]

        this.runAssembleTest(
            options
          , packages
          , {
                packageList: 'pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3'
              , context: 'context string'
              , packages: [
                    { isBare: true, isExposed: true, sources: { length: 2 } }
                  , { isBare: false, isExposed: true, sources: { length: 2 } }
                  , { isBare: false, isExposed: false, sources: { length: 2 } }
                ]
            }
          , done
        )
      }
    }

  , 'source maps': {
        'basic': function (done) {
          var options = { option: 1 }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1'
                , context: 'context string'
                , packages: [
                      {
                          isBare: false
                        , isExposed: false
                        , sources: {
                              length: 2
                            , 0: { mappings: 'MAAA;' }
                            , 1: { mappings: 'MCAA;' }
                          }
                      }
                  ]
              }
            , done
          )
        }

      , 'multiline package': function (done) {
          var options = { option: 1 }
            , packages = [
                  this.createPackageMock(
                    { name: 'pkg1', version: '0.1.1', main: '\n// main', bridge: '\n// bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1'
                , context: 'context string'
                , packages: [
                      {
                          isBare: false
                        , isExposed: false
                        , sources: {
                              length: 2
                            , 0: { mappings: 'MAAA;MACA;' }
                            , 1: { mappings: 'MCDA;MACA;' }
                          }
                      }
                  ]
              }
            , done
          )
        }

      , 'bare package': function (done) {
          var options = { option: 1 }
            , packages = [
                  this.createPackageMock(
                    { bare: true, name: 'pkg1', version: '0.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
                , this.createPackageMock(
                    { name: 'pkg2', version: '1.1.1', main: 'lib/main', bridge: 'lib/bridge' }
                  )
              ]

          this.runAssembleTest(
              options
            , packages
            , {
                  packageList: 'pkg1@0.1.1 pkg2@1.1.1'
                , context: 'context string'
                , packages: [
                      {
                          isBare: true
                        , isExposed: true
                        , sources: {
                              length: 2
                            , 0: { mappings: 'EAAA;' }
                            , 1: { mappings: 'ECAA;' }
                          }
                      }
                    , {
                          isBare: false
                        , isExposed: false
                        , sources: {
                              length: 2
                            , 0: { mappings: 'MCAA;' }
                            , 1: { mappings: 'MCAA;' }
                          }
                      }
                  ]
              }
            , done
          )
        }
    }
})
