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


var buster = require('buster')
  , assert = buster.assert
  , fs = require('fs')
  , repository = require('../../lib/repository')
  , util = require('../../lib/util')
  , FilesystemError = require('../../lib/errors').FilesystemError
  , RepositoryCommandError = require('../../lib/errors').RepositoryCommandError

  , executeSetupPackupTempDirTest = function (execute, verify, done) {
      fs.readdir(util.tmpDir, function (err, files) {
        if (err) {
          assert.fail('couldn\'t list files in temp dir: ' + util.tmpDir)
          done()
        } else {
          execute(function () {
            fs.readdir(util.tmpDir, function (err, files2) {
              if (err) {
                assert.fail('couldn\'t list files in temp dir: ' + util.tmpDir)
                done()
              } else {
                verify(files, files2)
                done()
              }
            })
          })
        }
      })
    }
  , verifySameFiles = function (files, files2) {
      assert.equals(files2, files)
    }

buster.testCase('Repository (npm interface)', {
    'setup() and packup()': {
        'test setup() and packup() exist': function () {
          assert.isFunction(repository.setup)
          assert.isFunction(repository.packup)
          assert.equals(1, repository.setup.length)
          assert.equals(2, repository.packup.length)
        }

      , 'test setup() and packup() leave no temporary files': function (done) {
          executeSetupPackupTempDirTest(
              function (callback) {
                repository.setup(function () {
                  repository.packup(null, callback)
                })
              }
            , verifySameFiles
            , done
          )
        }

      , 'test multiple sequential setup()/packup() leave no temporary files': function (done) {
          executeSetupPackupTempDirTest(
              function (callback) {
                repository.setup(function () {
                  repository.packup(null, function () {
                    repository.setup(function () {
                      repository.packup(null, callback)
                    })
                  })
                })
              }
            , verifySameFiles
            , done
          )
        }

      , 'test multiple stacked setup() and packup() leave no temporary files and throw no errors': function (done) {
          executeSetupPackupTempDirTest(
              function (callback) {
                repository.setup(function () {
                  repository.setup(function () {
                    repository.packup(null, function () {
                      repository.packup(null, callback)
                    })
                  })
                })
              }
            , verifySameFiles
            , done
          )
        }

      , 'test setup creates output file given by packup(false)': function (done) {
          executeSetupPackupTempDirTest(
              function (callback) {
                callback()
              }
            , function () {
                assert(true)
              }
            , done
          )
        }
    }

  , 'setup()': {
        'test setup() calls npm.load()': function (done) {
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          repository.setup(finish)
          assert(true) // required, buster issue #62
        }

      , 'test setup() calls npm.load() only once regardless of how many times setup() is called': function (done) {
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          repository.setup(function () { // mock calls this one
            repository.setup(function () { // isSetup shortcut calls this one
              repository.setup(finish) // isSetup shortcut calls this too
            })
          })
          assert(true) // required, buster issue #62
        }

      , 'test open temp file error': function (done) {
          var fsMock = this.mock(fs)
            , errArg = new Error('this is an error')

          fsMock.expects('open').callsArgWith(3, errArg)

          repository.setup(function (err) {
            assert(err)
            assert(err instanceof FilesystemError)
            assert.same(err.cause, errArg)
            assert.same(err.message, errArg.message)
            done()
          })
        }
    }

  , 'search()': {
        setUp: function () {
          // we have to replace npm.commands because all properties on the original object
          // are defined with only getters (via defineProperty) so can't be mocked as they are
          this.npm = require('npm')
          this.npmCommandsOriginal = this.npm.commands
          this.npm.commands = this.npmCommands = {
              search: function () {}
          }
        }
      , tearDown: function () {
          this.npm.commands = this.npmCommandsOriginal
        }

      , 'test search() throws RepositorySetupError if setup() has not been called': function () {
          assert.exception(repository.search, 'RepositorySetupError')
        }

      , 'test search() calls npm.commands.search()': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , keywords = 'keywords argument'
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('search').once().withArgs(keywords).callsArg(1)

          repository.setup(function () {
            repository.search(keywords, finish)
          })

          assert(true) // required, buster issue #62
        }

      , 'test npm.commands.search error': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , keywords = 'keywords argument'
            , errArg = new Error('this is an error')

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('search').once().withArgs(keywords).callsArgWith(1, errArg)

          repository.setup(function () {
            repository.search(keywords, function (err) {
              assert(err)
              assert(err instanceof RepositoryCommandError)
              assert.same(err.cause, errArg)
              assert.same(err.message, errArg.message)
              repository.packup(false, done)
            })
          })
        }
    }

  , 'uninstall()': {
        setUp: function () {
          // we have to replace npm.commands because all properties on the original object
          // are defined with only getters (via defineProperty) so can't be mocked as they are
          this.npm = require('npm')
          this.npmCommandsOriginal = this.npm.commands
          this.npm.commands = this.npmCommands = {
              uninstall: function () {}
          }
        }
      , tearDown: function () {
          this.npm.commands = this.npmCommandsOriginal
        }

      , 'test uninstall() throws RepositorySetupError if setup() has not been called': function () {
          assert.exception(repository.uninstall, 'RepositorySetupError')
        }

      , 'test uninstall() calls npm.commands.uninstall()': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , packages = [ 'packages', 'argument' ]
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('uninstall').once().withArgs(packages).callsArg(1)

          repository.setup(function () {
            repository.uninstall(packages, finish)
          })

          assert(true) // required, buster issue #62
        }

      , 'test npm.commands.uninstall error': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , packages = [ 'packages', 'argument' ]
            , errArg = new Error('this is an error')

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('uninstall').once().withArgs(packages).callsArgWith(1, errArg)

          repository.setup(function () {
            repository.uninstall(packages, function (err) {
              assert(err)
              assert(err instanceof RepositoryCommandError)
              assert.same(err.cause, errArg)
              assert.same(err.message, errArg.message)
              repository.packup(false, done)
            })
          })
        }
    }

  , 'install()': {
        setUp: function () {
          // see note for search() setUp
          this.npm = require('npm')
          this.npmCommandsOriginal = this.npm.commands
          this.npm.commands = this.npmCommands = {
              install: function () {}
          }
        }
      , tearDown: function () {
          this.npm.commands = this.npmCommandsOriginal
        }

      , 'test install() throws RepositorySetupError if setup() has not been called': function () {
          assert.exception(repository.install, 'RepositorySetupError')
        }

      , 'test install() calls npm.commands.install()': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , packages = [ 'packages', 'argument' ]
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('install').once().withArgs(packages).callsArg(1)

          repository.setup(function () {
            repository.install(packages, finish)
          })

          assert(true) // required, buster issue #62
        }

      , 'test install() calls npm.commands.install() twice if "." package is specified': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , packages = [ 'packages', 'argument', 'foo/..' ]
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('install').once().withArgs(packages.slice(0, 2)).callsArg(1)
          npmCommandsMock.expects('install').once().withArgs([ '.' ]).callsArg(1)

          repository.setup(function () {
            repository.install(packages, finish)
          })

          assert(true) // required, buster issue #62
        }

      , 'test npm.commands.install error': function (done) {
          var npmMock = this.mock(this.npm)
            , npmCommandsMock = this.mock(this.npmCommands)
            , packages = [ 'packages', 'argument' ]
            , errArg = new Error('this is an error')

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('install').once().withArgs(packages).callsArgWith(1, errArg)

          repository.setup(function () {
            repository.install(packages, function (err) {
              assert(err)
              assert(err instanceof RepositoryCommandError)
              assert.same(err.cause, errArg)
              assert.same(err.message, errArg.message)
              repository.packup(false, done)
            })
          })
        }
    }
})