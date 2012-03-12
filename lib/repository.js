var npm = require('npm')
  , fs = require('fs')
  , path = require('path')
  , net = require('net')
  , colors = require('colors')
  , RepositorySetupError = require('./errors').RepositorySetupError
  , util = require('./util')
  , packageUtil = require('./package-util')

  , isSetup = false
  , sessionFile
  , sessionStream

  , generateTempFile = function (callback) {
      sessionFile = util.tmpDir + '/ender_npm_' + process.pid + '.' + (+new Date())
      fs.open(sessionFile, 'w', '0644', callback)
    }

    // must be called at the start of an NPM session
  , setup = function (callback) {
      if (isSetup)
        return callback && callback()

      generateTempFile(function (err, fd) {
        if (err)
          return callback(err)

        sessionStream = new net.Stream(fd)
        var config = {
              logfd: sessionStream
            , outfd: sessionStream
          }

        npm.load(config, function (err) {
          if (!err)
            isSetup = true

          callback.apply(null, arguments)
        })
      })
    }

    // must be called at the end of an NPM session
  , packup = function (wasError, callback) {
      if (!isSetup)
        return callback && callback()

      isSetup = false

      sessionStream.on('close', function () {
        if (!wasError)
          return fs.unlink(sessionFile, callback)

        callback && callback()
        sessionStream = null
      })

      sessionStream.destroySoon()
    }

  , search = function (keywords, callback) {
      if (!isSetup)
        throw new RepositorySetupError('repository.setup() has not been called')

      npm.commands.search(keywords, callback)
    }

  , install = function (packages, callback) {
      if (!isSetup)
        throw new RepositorySetupError('repository.setup() has not been called')

      var cwd = path.resolve('.')
        , withoutCwd = packages.filter(function (p) {
            return !packageUtil.isPath(p) || path.resolve(p) != cwd
          })
      npm.commands.install(withoutCwd, function (err, installed, tree, pretty) {
        if (err)
          return callback(err)

        var result = {
            installed: installed
          , tree: tree
          , pretty: pretty
        }

        if (withoutCwd.length == packages.length)
          return callback(null, [ result ])

        npm.commands.install([ '.' ], function (err, instaled, tree, pretty) {
          if (err)
            return callback(err)
          callback(null, [ result, {
              installed: installed
            , tree: tree
            , pretty: pretty
          }])
        })
      })
    }

module.exports = {
    setup: setup
  , packup: packup
  , search: search
  , install: install
}
