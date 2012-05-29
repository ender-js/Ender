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


/******************************************************************************
 * Our only interface with `npm`, all npm interaction must go through here so
 * it's safely abstracted away from the rest of the code. The important parts
 * are the `setup()` and `packup()` methods which must wrap around any call to
 * an npm command. If you don't do a `setup()` then you'll get an error, if
 * you don't do a `packup()` then you'll likely have a hanging-process.
 * These two methods manage npm initialisation and also manage an npm logfile
 * that goes into /tmp/ender_npm_... If `packup()` is called with a falsy
 * first arg then the log file is deleted, otherwise it is left alone for
 * debugging.
 * Note that multiple npm commands can be run between `setup()` and `packup()`,
 * they only need to be done once per app execute.
 */

var npm                    = require('npm')
  , fs                     = require('fs')
  , path                   = require('path')
  , net                    = require('net')
  , util                   = require('./util')
  , colors                 = require('colors')
  , packageUtil            = require('./package-util')
  , FilesystemError        = require('./errors').FilesystemError
  , RepositorySetupError   = require('./errors').RepositorySetupError
  , RepositoryCommandError = require('./errors').RepositoryCommandError

  , isSetup
  , sessionFile
  , sessionStream

    // This is no longer an async function due to the way that createWriteStream works
  , generateTempFile = function () {
      sessionFile = path.join(util.tmpDir, 'ender_npm_' + process.pid + '.' + (+new Date()))
      return fs.createWriteStream(sessionFile, {flags: 'w', mode: '0644'})
    }

    // must be called at the start of an npm session
  , setup = function (callback) {
      if (isSetup) return callback()

      try {
        sessionStream = generateTempFile()
      } catch (err) {
        return callback(new FilesystemError(err))
      }

      sessionStream.on('error', function(err) {
        callback(new FilesystemError(err))
      })

      // streams are the safest way to deal with npm, actual fds are now unreliable
      // and since we have no real way to tell when npm is finished (the callbacks
      // are triggered before it does its own cleanup) the best we can do is a
      // destroySoon() on our stream.
      var config = {
            logfd : sessionStream
          , outfd : sessionStream
        }

      npm.load(config, function (err) {
        if (!err) isSetup = true
        callback.apply(null, arguments)
      })
    }

    // must be called at the end of an npm session
  , packup = function (wasError, callback) { // callback is optional here, usually not required
      if (!isSetup) return callback && callback()

      isSetup = false

      // gently close so we don't upset npm
      sessionStream.on('close', function () {
        if (!wasError) return fs.unlink(sessionFile, callback)
        callback && callback()
        sessionStream = null
      })

      sessionStream.destroySoon()
    }

    // wrap around npm.commands.search()
  , search = function (keywords, callback) {
      if (!isSetup) throw new RepositorySetupError('repository.setup() has not been called')

      npm.commands.search(keywords, function (err) {
        if (err) return callback(new RepositoryCommandError(err))
        callback.apply(null, arguments)
      })
    }

    // wrap around npm.commands.uninstall()
  , uninstall = function (packages, callback) {
      if (!isSetup) throw new RepositorySetupError('repository.setup() has not been called')

      npm.commands.uninstall(packages, function (err) {
        if (err) return callback(new RepositoryCommandError(err))
        callback.apply(null, arguments)
      })
    }

    // wrap around npm.commands.install() but with a special-case of paths that
    // resolve to CWD since they are ignored by npm if included with other packages
    // see: https://github.com/isaacs/npm/commit/8b7bf5ab0c214b739b5fd6af07003cac9e5fc712
    // so if we have a CWD in our list then we have to call it separately and then
    // trigger the callback with two sets of results
  , install = function (packages, callback) {
      if (!isSetup) throw new RepositorySetupError('repository.setup() has not been called')
console.log('npm.install', packages)
      npm.commands.install(packages, function (err, installed, tree, pretty) {
        if (err) return callback(new RepositoryCommandError(err))

        callback(null, {
            tree      : tree
          , pretty    : pretty
          , installed : installed
        })
      })

      /*
      var cwd = path.resolve('.')
        , withoutCwd = packages.filter(function (p) {
            return !packageUtil.isPath(p) || path.resolve(p) != cwd
          })

      npm.commands.install(withoutCwd, function (err, installed, tree, pretty) {
        if (err) return callback(new RepositoryCommandError(err))

        var result = {
            tree      : tree
          , pretty    : pretty
          , installed : installed
        }

        if (withoutCwd.length == packages.length) return callback(null, [ result ])

        npm.commands.install([ '.' ], function (err, instaled, tree, pretty) {
          if (err) return callback(new RepositoryCommandError(err))

          // callback with 2 results, second one for install(['.']), first for everything else
          callback(null, [ result, {
              tree      : tree
            , pretty    : pretty
            , installed : installed
          }])
        })
      })
      */
    }

module.exports = {
    setup     : setup
  , packup    : packup
  , search    : search
  , install   : install
  , uninstall : uninstall
}