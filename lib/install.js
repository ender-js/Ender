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
 * An additional abstraction of npm via repository.js. Installing packages
 * is not as simple as just asking npm to install them, there is additional
 * logic we need in order to get exactly what we want and also to control npm
 * (in particular, npm needs '.' to be installed separately).
 * Our install logic allows us to install more than just the standard
 * package.json "dependencies", we can also install "ender"->"dependencies".
 * We also get to skip installing dependencies that already exist which the npm
 * API doesn't allow us to do directly.
 * The basic flow is: (1) check dependency status in node_modules, (2) ask npm
 * to install anything missing, (3) repeat until there's not left to instal.
 * One special case is that we *always* ask npm to install packages specified
 * by a path (i.e. local).
 */

var async          = require('async')
  , repository     = require('ender-repository')
  , packageUtil    = require('./package-util')
  , installUtil    = require('./install-util')
  , DependencyTree = require('./dependency-tree')

  , installPackages = function (options, packages, callback) {
      var filteredPackages  = installUtil.filterPackagesWithoutCwd(packages)
        , installedPackages = []
        , results           = []
        , dependencyTree

        , filterPackages = function () {
            // any packages marked 'missing' need to be installed
            filteredPackages = installUtil.findMissingDependencies(packages, dependencyTree)
            // any packages that are paths that are not already installed need to be installed
            filteredPackages = filteredPackages.concat(installUtil.findPathDependencies(packages, dependencyTree))
            // don't install '.' here, done as a special case previously in installCwd()
            filteredPackages = installUtil.filterPackagesWithoutCwd(filteredPackages)
            // don't reinstall anything that we've already installed in this loop
            filteredPackages = filteredPackages.filter(function (pkg) {
              return installedPackages.indexOf(pkg) == -1
            })
            if (filteredPackages.length)
              installedPackages = installedPackages.concat(filteredPackages)
          }

          // keep running this function until everything is installed
        , installRest = function (callback) {
            DependencyTree.generate(options, packages, function (err, _dependencyTree) {
              if (err) return callback(err) // wrapped in package-utils.js

              dependencyTree = _dependencyTree
              filterPackages()

              if (filteredPackages.length) {
                repository.install(filteredPackages, function (err, result) {
                  if (err) return callback(err) // wrapped in repository.js

                  results.push(result)
                  callback()
                })
              } else {
                callback()
              }
            })
          }

        , completeDependenciesInstall = function () {
            // keep running installRest() until we have nothing else to install, in theory installedPackages[]
            // should stop us from going forever even if npm doesn't do the installing we want
            async.whilst(
                function () { return filteredPackages.length }
              , installRest
              , function (err) {
                  repository.packup(err, function () {
                    if (err) return callback(err)

                    callback(null, results, dependencyTree)
                  })
                }
            )
          }

          // if --force-install then explicitly install the root packages whether they exist in
          // node_modules or not, also used by 'refresh'
        , installRootPackages = function () {
            if (options['force-install'] || options['_force-install']) {
              // 'refresh' uses '_force-install' to signal that it doesn't want a trace left
              // in the 'Build:' header
              if (options['_force-install']) delete options['_force-install']
              repository.install(filteredPackages, function (err, result) {
                if (err) return callback(err) // wrapped in repository.js
                results.push(result)
                
                completeDependenciesInstall()
              })
            } else {
              completeDependenciesInstall()
            }
          }

          // must treat '.' as a special case, partly because of npm (see
          // https://github.com/isaacs/npm/commit/8b7bf5ab0c214b739b5fd6af07003cac9e5fc712), and
          // partly because of what we need to do with it
        , installCwd = function () {
            repository.install([ '.' ], function (err, result) {
              if (err) return callback(err) // wrapped in repository.js
              results.push(result)
              installRootPackages()
            })
          }

      packageUtil.preparePackagesDirectory(function (err) {
        if (err) return callback(err) // wrapped in util.js
  
        repository.setup(function (err) {
          if (err) return callback(err) // wrapped in repository.js

          filteredPackages.length != packages.length ? installCwd() : installRootPackages()
        })
      })
    }

module.exports.installPackages = installPackages