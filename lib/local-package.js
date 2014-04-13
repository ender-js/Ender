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


var extend          = require('util')._extend
  , archy           = require('archy')
  , async           = require('async')
  , fs              = require('fs')
  , glob            = require('glob')
  , path            = require('path')
  , semver          = require('semver')

  , repository      = require('./repository')

  , JSONParseError       = require('./errors').JSONParseError
  , FilesystemError      = require('./errors').FilesystemError
  , PackageNotFoundError = require('./errors').PackageNotFoundError
  , PackageNotLocalError = require('./errors').PackageNotLocalError


  , unitaryHash  = function () { return '_' }
  , packageCache = {}
  , packageMappings = {}

function LocalPackage(root) {
  this.root = root

  // Memoize methods that hit the disk
  this.loadDescriptor = async.memoize(this.loadDescriptor.bind(this), unitaryHash)
  this.loadSources = async.memoize(this.loadSources.bind(this), unitaryHash)

  return this
}

// Static Methods
extend(LocalPackage, {
    createPackage: function (root) {
      root = path.resolve(root)
      return packageCache[root] || (packageCache[root] = new LocalPackage(root))
    }

  , loadPackage: function (root, callback) {
      var pkg = LocalPackage.createPackage(root)
      pkg.loadDescriptor(function (err) {
        if (err) return callback(err)
        callback(null, pkg)
      })
    }

  , unloadPackage: function (root) {
      LocalPackage.createPackage(root).unload()

      for (var key in packageMappings)
        if (packageMappings[key] == root)
          delete packageMappings[key]
    }

  , addPackageMapping: function (id, root) {
      packageMappings[id] = root
    }

  , findPackage: function (id, root, callback) {
      var name = repository.util.getName(id)
        , version = repository.util.getVersion(id)
        , nameType = repository.util.getNameType(name)
        , matches = function (pkg) {
            return (pkg &&
                    (nameType == 'path' || pkg.originalName == name) &&
                    semver.satisfies(pkg.version, version))
          }

      root = path.resolve(root)

      // See if we've mapped this package id to a local package
      if (id in packageMappings) {
        name = packageMappings[id]
        nameType = 'path'
      }

      switch (nameType) {
        case 'path':
          LocalPackage.loadPackage(name, function (err, pkg) {
            if (matches(pkg)) return callback(null, pkg)
            return callback(new PackageNotFoundError("Package at '" + name + "' does not satisfy version '" + version + "'."))
          })
          break

        case 'package':
          // Don't search above the CWD
          if (/^\.\./.test(path.relative('.', root)))
            return callback(new PackageNotFoundError("Package '" + id + "' could not be found."))

          LocalPackage.loadPackage(root, function (err, pkg) {
            if (matches(pkg)) return callback(null, pkg)

            LocalPackage.loadPackage(repository.util.getChildRoot(name, root), function (err, pkg) {
              if (matches(pkg)) return callback(null, pkg)

              LocalPackage.findPackage(id, path.dirname(root), callback)
            })
          })
          break

        case 'tarball':
        case 'url':
        case 'git':
        case 'github':
          callback(new PackageNotLocalError('Can only find packages by path or name'))
          break
      }
    }

  , walkDependencies: function (ids, unique, strict, callback) {
      var packages = []
        , missing = []
        , seenNames = []
        , seenRoots = []

        , processId = function (id, root, callback) {
            LocalPackage.findPackage(id, root, function (err, pkg) {
              if (err) {
                if (strict) return callback(err)

                missing.push(id)
                return callback()
              }

              processPackage(pkg, callback)
            })
          }

        , processPackage = function (pkg, callback) {
            if (seenRoots.indexOf(pkg.root) != -1) return callback()
            seenRoots.push(pkg.root)

            async.map(
                pkg.dependencies
              , function (id, callback) { processId(id, pkg.root, callback) }
              , function (err) {
                  if (err) return callback(err)
                  packages.push(pkg)
                  seenNames.push(pkg.originalName)
                  callback()
              }
            )
          }

      async.map(
          ids
        , function (id, callback) { processId(id, '.', callback) }
        , function (err) {
            if (err) return callback(err)

            if (unique) {
              // Return only the first package if we found multiple instances
              packages = packages.filter(function (p, i) { return seenNames.indexOf(p.originalName) == i })
              missing = missing.filter(function (n, i) { return missing.indexOf(n) == i })
            }

            callback(null, packages, missing)
          }
      )
    }

  , buildTree: function (ids, pretty, callback) {
      var seenRoots = []

        , processId = function (id, root, callback) {
            LocalPackage.findPackage(id, root, function (err, dep) {
              if (err) return callback(err)
              processPackage(dep, callback)
            })
          }

        , processPackage = function (pkg, callback) {
            var node = {}
              , first = seenRoots.indexOf(pkg.root) == -1

            seenRoots.push(pkg.root)

            if (pretty) {
              if (first) {
                node.label = '{yellow}' + pkg.name + '@' + pkg.version + '{/yellow}{white} - ' + pkg.description + '{/white}'
              } else {
                node.label = '{grey}' + pkg.name + '@' + pkg.version + ' - ' + pkg.description + '{/grey}'
              }
            } else {
              node.label = pkg.name + '@' + pkg.version
            }

            async.map(
                pkg.dependencies
              , function (id, callback) { processId(id, pkg.root, callback) }
              , function (err, nodes) {
                if (err) return callback(err)
                node.nodes = nodes
                callback(null, node)
              }
            )
          }

      async.map(
          ids
        , function (id, callback) { processId(id, '.', callback) }
        , function (err, nodes) {
            if (err) return callback(err)

            var archyTree = {
                    label: 'Active packages:'
                  , nodes: nodes
                }

            callback(null, archy(archyTree))
          }
      )
    }

  , extendDescriptor: function (descriptor) {
      var overrides = ['bare', 'name', 'files', 'main', 'bridge', 'dependencies', 'devDependencies']
        , newDescriptor = Object.create(descriptor) // original is available via Object.getPrototypeOf
        , key

      if (typeof descriptor.overlay == 'object' &&
          typeof descriptor.overlay.ender == 'object') {
        overrides.forEach(function (key) {
          if (key in descriptor.overlay.ender) {
            newDescriptor[key] = descriptor.overlay.ender[key]
          }
        })
      }

      if (descriptor.ender == 'noop') {
        newDescriptor.ender = null

      } else if (typeof descriptor.ender == 'string') {
        newDescriptor.bridge = descriptor.ender

      } else if (typeof descriptor.ender == 'object') {
        overrides.forEach(function (key) {
          if (key in descriptor.ender) {
            newDescriptor[key] = descriptor.ender[key]
          }
        })
      }

      return newDescriptor
    }
})


LocalPackage.prototype = {
    unload: function () {
      delete this.loadDescriptor.memo._
      delete this.loadSources.memo._
      delete this.descriptor
      delete this.sources
    }

  , get originalName () {
      return Object.getPrototypeOf(this.descriptor).name
    }

  , get id () {
      return this.originalName + '@' + this.version
    }

  , get dependencies () {
      return (
          !this.descriptor.dependencies ? []
        : Array.isArray(this.descriptor.dependencies) ? this.descriptor.dependencies
        : Object.keys(this.descriptor.dependencies).map(function (name) {
            var value = this.descriptor.dependencies[name]
            return (semver.validRange(value) ? name + '@' + value : repository.util.normalizeName(value, this.root))
          }.bind(this))
      )
    }

  , extendOptions: function (options) {
      var externs = this.descriptor && this.descriptor.externs
        , root = this.root

      if (externs) {
        if (!Array.isArray(externs)) externs = [ externs ]
        if (!options.externs) options.externs = []
        options.externs = options.externs.concat(externs.map(function (e) {
          return path.join(root, e)
        }))
      }
    }

  , loadDescriptor: function (callback) {
      var descriptorPath = repository.util.getPackageDescriptor(this.root)

      fs.readFile(descriptorPath, 'utf-8', function (err, data) {
        if (err) return callback(new FilesystemError(err))

        try {
          data = JSON.parse(data)
        } catch (err) {
          return callback(new JSONParseError(err.message + ' [' + descriptorPath + ']', err))
        }

        this.descriptor = LocalPackage.extendDescriptor(data)
        this.name = this.descriptor.name
        this.version = this.descriptor.version || ''
        this.description = this.descriptor.description || ''
        this.bare = !!this.descriptor.bare

        callback()
      }.bind(this))
    }

  , loadSources: function (callback) {
      var loadFile = async.memoize(function (file, callback) {
            file = path.normalize(file)
            fs.readFile(path.join(this.root, file), 'utf-8', function (err, content) {
              if (err) return callback(new FilesystemError(err))
              callback(null, { name: file.replace(/(\.js)?$/, ''), content: content })
            })
          }.bind(this))

        , expandGlob = async.memoize(function (file, callback) {
            // use glob.Glob because it's easier to stub for tests
            new glob.Glob(file, { cwd: this.root, root: this.root, nomount: true }, function (err, files) {
              if (err) return callback(new FilesystemError(err))
              callback(null, files)
            })
          }.bind(this))

        , expandDirectory = async.memoize(function (file, callback) {
            fs.stat(path.join(this.root, file), function (err, stats) {
              if (err) return callback(new FilesystemError(err))
              if (!stats.isDirectory()) return callback(null, [ file ])

              fs.readdir(path.join(this.root, file), function (err, names) {
                if (err) return callback(new FilesystemError(err))

                var files = names.map(function (name) { return path.join(file, name) })
                async.concat(files, expandDirectory, callback)
              })
            }.bind(this))
          }.bind(this))

        , contractDirectory = async.memoize(function (file, callback) {
            fs.stat(path.join(this.root, file), function (err, stats) {
              if (err) return callback(new FilesystemError(err))
              if (stats.isDirectory()) return callback(null, [])
              return callback(null, [ file ])
            }.bind(this))
          }.bind(this))

        , loadModule = function (name, callback) {
            var files = this.descriptor[name] || []
            if (typeof files == 'string') files = [ files ]
            if (!Array.isArray(files)) files = files['scripts'] || []

            if (name == 'main' && !files.length) {
              // default to index as the main module
              files = [ 'index', 'index.js' ]
            } else {
              // add additional search paths
              files = files.concat(files.map(function (file) { return file + '.js' }),
                                   files.map(function (file) { return path.join(file, 'index.js') }))
            }

            async.waterfall([
                function (callback)          { async.concat(files, expandGlob, callback) }
              , function (files, callback)   { async.concat(files, contractDirectory, callback) }
              , function (files, callback)   { async.map(files, loadFile, callback) }
              , function (sources, callback) {
                  if (sources.length > 1) {
                    // If we have an array of files, combine them into one file
                    sources = [{
                        name: name
                      , content: sources.map(function (s) { return s.content }).join('\n\n')
                    }]
                  }

                  callback(null, sources)
                }
            ], callback)
          }.bind(this)

        , loadFiles = function (callback) {
            var files = this.descriptor.files || []
            if (typeof files == 'string') files = [ files ]
            if (!Array.isArray(files)) files = files['scripts'] || []

            async.waterfall([
                function (callback)        { async.concat(files, expandGlob, callback) }
              , function (files, callback) { async.concat(files, expandDirectory, callback) }
              , function (files, callback) { callback(null, files.filter(function (f) { return /\.js$/.test(f) }).sort()) }
              , function (files, callback) { async.map(files, loadFile, callback) }
            ], callback)
          }.bind(this)

      async.parallel(
        {
            main:   loadModule.bind(null, 'main')
          , bridge: loadModule.bind(null, 'bridge')
          , files:  loadFiles
        },
        function (err, results) {
          if (err) return callback(err)

          // concat the results and filter duplicates (this works on objects because loadFile is memoized)
          this.sources = [].concat(results.main, results.bridge, results.files)
          this.sources = this.sources.filter(function (source, i) { return this.sources.indexOf(source) == i}.bind(this))

          // Set main and bridge to the resolved name
          if (results.main.length) this.main = results.main[0].name
          if (results.bridge.length) this.bridge = results.bridge[0].name

          callback()
        }.bind(this)
      )
    }
}

module.exports = LocalPackage
