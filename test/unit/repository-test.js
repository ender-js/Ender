var buster = require('buster')
  , assert = buster.assert
  , fs = require('fs')
  , repository = require('../../lib/repository')
  , util = require('../../lib/util')

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

buster.testCase('Repository (NPM interface)', {
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
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , npmCommandsMock = this.mock(npm.commands)
            , keywords = 'keywords argument'
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('search').once().withArgs(keywords, finish).callsArg(1)

          repository.setup(function () {
            repository.search(keywords, finish)
          })

          assert(true) // required, buster issue #62
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
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , npmCommandsMock = this.mock(npm.commands)
            , packages = [ 'packages', 'argument' ]
            , finish = function () {
                repository.packup(false, done)
              }

          npmMock.expects('load').once().callsArg(1)
          npmCommandsMock.expects('uninstall').once().withArgs(packages, finish).callsArg(1)

          repository.setup(function () {
            repository.uninstall(packages, finish)
          })

          assert(true) // required, buster issue #62
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
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , npmCommandsMock = this.mock(npm.commands)
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
          var npm = require('npm')
            , npmMock = this.mock(npm)
            , npmCommandsMock = this.mock(npm.commands)
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
    }
})