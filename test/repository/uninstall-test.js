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

  , repository             = require('../../lib/repository')
  , RepositoryCommandError = require('../../lib/errors').RepositoryCommandError


buster.testCase('uninstall()', {
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
})