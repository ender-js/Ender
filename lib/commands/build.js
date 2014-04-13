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
 * 'Build' executable module, for `ender build <packages> [...]`.
 * This module should serve to control the build process with the details.
 * Most of the hard work in figuring out what to put together is done in the
 * main-build-util module, the SourceBuild and SourcePackage objects then do
 * the assembling work while the write module outputs the results.
 */

var async        = require('async')
  , fs           = require('fs')
  , extend       = require('util')._extend
  , path         = require('path')

  , assemble     = require('../assemble')
  , LocalPackage = require('../local-package')
  , minifiers    = require('../minifiers')
  , repository   = require('../repository')
  , util         = require('../util')
  , info         = require('./info')

  , FilesystemError     = require('../errors').FilesystemError
  , DependencyLoopError = require('../errors').DependencyLoopError
  , MinifyError         = require('../errors').MinifyError


  , installPackages = function (ids, refresh, callback) {
      var missing
        , installedIds = []

        , install = function (idsToInstall, callback) {
            repository.install(idsToInstall, function (err, receipts) {
              if (err) return callback(err) // wrapped in ender-repository

              // Unmemoize all the packages we just installed
              receipts.forEach(function (receipt) {
                installedIds.push(receipt.id)
                LocalPackage.unloadPackage(receipt.root)
                LocalPackage.addPackageMapping(receipt.source, receipt.root)
              })

              callback(null, receipts)
            })
          }

        , installRest = function (callback) {
            async.whilst(
                function () { return missing.length }
              , function (callback) {
                  install(missing, function (err) {
                    if (err) return callback(err)
                    updateMissing(callback)
                  })
                }
              , callback
            )
          }

        , updateMissing = function (callback) {
            LocalPackage.walkDependencies(ids, true, false, function (err, packages, _missing) {
              if (err) return callback(err) // this should never happen if we don't request `strict`

              missing = _missing
              var dupes = missing.filter(function (id) { return installedIds.indexOf(id) != -1 })
              if (dupes.length)
                return callback(new DependencyLoopError('Installing identical package twice: ' + dupes))

              callback()
            })
          }

        , installBasePackages = function (callback) {
            var installPackage = function (id, callback) {
                  var doInstall = function () {
                        install([ id ], function (err) {
                          if (err) return callback(err)
                          callback(null, installedIds[installedIds.length-1])
                        })
                      }

                  // Load the package
                  LocalPackage.findPackage(id, '.', function (err, pkg) {
                    // If this was a path package, we'll let npm deliver the bad news
                    if (err) doInstall()

                    // The CWD is always "installed"...
                    else if (pkg.root == path.resolve('.'))
                      // ...but we might have to refresh dependencies
                      if (refresh) install(pkg.dependencies, function (err) { callback(err, pkg.id) })
                      else callback(null, pkg.id)

                    // Are we refreshing?
                    else if (refresh) doInstall()

                    // Is the package outside the CWD (i.e., a path package)
                    else if (/^\.\./.test(path.relative('.', pkg.root))) doInstall()

                    else callback(null, pkg.id)
                  })
                }

            // Use mapSeries so we can install packages one at a time (NPM doesn't do concurrency)
            async.mapSeries(
                ids
              , installPackage
              , function (err, _ids) {
                  if (err) return callback(err)
                  ids = _ids.filter(function (id, i) { return _ids.indexOf(id) == i })
                  callback()
                }
            )
          }

      async.series(
          [
              repository.setup.bind(repository)
            , installBasePackages
            , updateMissing
            , installRest
          ]
        , function (err) {
            repository.packup(err)
            if (err) return callback(err)
            callback(null, ids, installedIds)
          }
      )
    }

  , buildPackages = function (options, packages, callback) {
      var name = (options.output || 'ender').replace(/\.js$/, '')
        , filenames = {
              build: name + '.js'
            , sourceMap: name + '.js.map'
            , minifiedBuild: name + '.min.js'
            , minifiedSourceMap: name + '.min.js.map'
          }

        , writeFiles = function (files, callback) {
            var tasks = Object.keys(files).map(function (key) {
                  return fs.writeFile.bind(null, filenames[key], files[key], 'utf-8')
                })

            async.parallel(tasks, function (err) {
              if (err) return callback(new FilesystemError(err))
              callback(null, files)
            })
          }

        , minifyBuild = function (files, callback) {
            if (options.minifier == 'none') return callback(null, files)

            var minifier = minifiers[options.minifier || 'uglify']
              , extendedOptions = extend({}, options)

            if (!minifier) return new MinifyError('No such minifier: "' + options.minifier + '"')

            packages.forEach(function (pkg) { pkg.extendOptions(extendedOptions) })
            minifier(files, filenames, extendedOptions, callback)
          }

        , assembleBuild = function (callback) {
            assemble.assemble(filenames.build, filenames.sourceMap, options, packages, callback)
          }

        , loadSources = function (callback) {
            async.each(packages, function (pkg, callback) { pkg.loadSources(callback) }, callback)
          }

      async.waterfall([
          loadSources
        , assembleBuild
        , minifyBuild
        , writeFiles
      ], function (err, files) {
        if (err) return callback(err)
        callback(null, files, filenames)
      })
    }

  , exec = function (options, log, callback) {
      var ids = util.packageList(options)
        , refresh = options['force-install'] || options['_force-install']

      if (arguments.length < 3) {
        callback = log
        log = undefined
      }

      if (log) log.info('Installing packages: "' + ids.join(' ') + '"...')

      installPackages(ids, refresh, function (err, ids, installResults) {
        if (err) return callback(err)

        if (log) {
          if (installResults) log.info('Successfully finished installing packages')
          log.info('Assembling build...')
        }

        // 'refresh' uses '_force-install' to signal that it doesn't want a trace left
        // in the 'Build:' header
        if ('_force-install' in options) delete options['_force-install']

        LocalPackage.walkDependencies(ids, true, true, function (err, packages) {
          if (err) return callback(err)

          buildPackages(options, packages, function (err, files, filenames) {
            if (err) return callback(err)

            // delegate to main-info to print details about the build
            if (!options.quiet) {
              info.exec(
                  options
                , log
                , callback

                // optional args so we don't have to rediscover them
                , filenames.build
                , ids
                , files
              )
            }
          })
        })
      })
    }


module.exports = {
    exec  : exec
  , buildPackages: buildPackages
  , installPackages: installPackages
}

