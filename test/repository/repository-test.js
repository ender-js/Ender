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


var buster          = require('bustermove')
  , assert          = require('referee').assert
  , refute          = require('referee').refute
  , fs              = require('fs')
  , tmpDir          = require('os').tmpDir()

  , repository      = require('../../lib/repository')
  , FilesystemError = require('../../lib/errors').FilesystemError


  , executeSetupPackupTempDirTest = function (execute, verify, done) {
      fs.readdir(tmpDir, function (err, files) {
        if (err) {
          assert.fail('couldn\'t list files in temp dir: ' + tmpDir)
          done()
        } else {
          execute(function () {
            fs.readdir(tmpDir, function (err, files2) {
              if (err) {
                assert.fail('couldn\'t list files in temp dir: ' + tmpDir)
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

buster.testCase('setup() and packup()', {
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

  , 'test setup() calls npm.load()': function (done) {
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
        , errThrown = new Error('this is an error')

      fsMock.expects('createWriteStream').throws(errThrown)

      repository.setup(function (err) {
        assert(err)
        assert(err instanceof FilesystemError)
        assert.same(err.cause, errThrown)
        assert.same(err.message, errThrown.message)
        repository.packup(false, done)
      })
    }
})