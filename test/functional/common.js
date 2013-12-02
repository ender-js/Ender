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


var referee            = require('referee')
  , assert             = referee.assert
  , refute             = referee.refute
  , childProcess       = require('child_process')
  , fs                 = require('fs')
  , path               = require('path')
  , async              = require('async')
  , rimraf             = require('rimraf')
  , tmpDir             = require('os').tmpDir()
  , copyrightCommentRe = /\/\*![\s\S]*?\*\//g

  , makePackageRegex = function (pkg) {
      return new RegExp('createPackage\\([\'"]' + pkg + '[\'"]')
    }

referee.add('sourceHasPackage', {
    assert: function (source, pkg, file) {
      var re = makePackageRegex(pkg)
      source = source || ''
      this.times = source.split(re).length - 1
      return this.times == 1
    }
  , assertMessage: "${2} contains Module.createPackage('${1}') [${times} time(s), expected 1]"
})

referee.add('sourceContainsPackages', {
    assert: function (source, times, file) {
      var re = makePackageRegex('[\\w\\-]+')
      source = source || ''
      this.times = source.split(re).length - 1
      return this.times == times
    }
  , assertMessage: "${2} contains ${1} Module.createPackage [${times} time(s), expected ${1}]"
})

referee.add('sourceHasRequire', {
    assert: function (source, module, file) {
      // `require` will get mangled in minified builds
      var r = (file.indexOf('.min.js') == -1) ? 'require' : '\\w+'
      return new RegExp(r + '\\([\'"]' + module + '[\'"]\\)').test(source)
    }
  , assertMessage: "${2} missing require('${1}')"
})

referee.add('sourceHasPackagesInOrder', {
    assert: function (source, pkg1, pkg2, file) {
      var re1 = makePackageRegex(pkg1)
        , re2 = makePackageRegex(pkg2)
        , idx1 = source.search(re1)
        , idx2 = source.search(re2)
      return idx1 < idx2
    }
  , assertMessage: '${3} has Module.createPackage("${1}") before Module.createPackage("${2}")'
})

referee.add('hasVersionedPackage', {
    assert: function (txt, pkg, sourceName) {
      return new RegExp(pkg + '@\\d+\\.\\d+\\.\\d+').test(txt)
    }
  , assertMessage: '${2} refers to ${1} versioned'
})

referee.add('stdoutRefersToNPMPackages', {
    assert: function (stdout, packages) {
      return new RegExp('packages: "' + packages + '"').test(stdout)
    }
  , assertMessage: 'stdout refers to \'packages: "${1}"\''
})

referee.add('stdoutReportsBuildCommand', {
    assert: function (stdout, buildCommand) {
      return new RegExp('current build command is:.*' + buildCommand, 'i').test(stdout)
    }
  , assertMessage: 'stdout reports correct build command "${1}"'
})

referee.add('stdoutReportsOutputSizes', {
    assert: function (stdout) {
      return (/current build size is: .*[\d\.]+ kB.* raw, .*[\d\.]+ kB.* minified and .*[\d\.]+ kB.* gzipped/).test(stdout)
    }
  , assertMessage: 'stdout reports build sizes ${0}'
})

referee.add('sourceHasCopyrightComments', {
    assert: function (source, expectedComments, sourceName) {
      source = source || ''
      return source.split(copyrightCommentRe).length - 1 == expectedComments
    }
  , assertMessage: '${2} has ${1} copyright comments'
})

var mktmpdir = function (callback) {
      var dir = tmpDir + '/ender_test_' + process.pid + '.' + (+new Date()) + '.' + Math.round(Math.random() * 10000)

      fs.mkdir(dir, function (err) {
        callback(err, dir)
      })
    }

  , rmtmpdir = function (dir, callback) {
      rimraf(dir, callback)
    }

  , enderpath = path.resolve(__dirname, '../../bin/ender')

  , runEnder = function (cmd, files, dir, callback) {
      if (Array.isArray(files)) files = { expectedFiles: files };
      var run = function (dir) {
            var child = childProcess.spawn(
                    enderpath
                  , cmd.split(' ')
                  , { cwd: dir, env: process.env }
                )
              , stdout = ''
              , stderr = ''

            child.stdout.on('data', function (data) {
              stdout += data.toString('utf-8')
            })
            child.stderr.on('data', function (data) {
              stderr += data.toString('utf-8')
            })

            child.on('exit', function (code, signal) {
              var err
              if (code !== 0) {
                err = new Error('Child process exited on signal: ' + signal)
                err.stderr = stderr
                return callback(err)
              }

              async.map(
                  files.expectedFiles
                , function (f, callback) {
                    f = path.join(dir, f)
                    fs.stat(f, function (err, stats) {
                      refute(err, f + ' exists [' + err + ']')
                      if (err) return callback()
                      assert(stats && stats.isFile(), f + ' is a file')
                      assert(stats && stats.size > 0, f + ' is a non-zero size')
                      fs.readFile(f, 'utf-8', callback)
                    })
                  }
                , function (_err, fileContents) {
                    refute(_err)
                    callback(err, dir, fileContents, String(stdout), String(stderr), function (callback) {
                      rmtmpdir(dir, callback)
                    })
                  }
              )
            })
          }
        , createFixtureFiles = function (dir, files, callback) {
            async.forEach(
                Object.keys(files)
              , function (fileName, callback) {
                  fs.writeFile(path.join(dir, fileName), files[fileName], callback)
                }
              , callback
            )
          }

      if (typeof dir == 'function') {
        callback = dir
        mktmpdir(function (err, dir) {
          refute(err)
          if (err)
            return callback(err)
          createFixtureFiles(dir, files.fixtureFiles || {}, function () {
            run(dir)
          })
        })
      } else
        run(dir)
    }

  , verifyNodeModulesDirectories = function (root, expectedDirectories, callback) {
      fs.readdir(path.join(root, 'node_modules'), function (err, actualDirectories) {
        refute(err)
        if (err)
          return callback(err)
        assert.equals(actualDirectories.length, expectedDirectories.length)
        assert.equals(actualDirectories.sort(), expectedDirectories.sort())
        callback()
      })
    }

  , fixturePackageJSON = function (properties) {
      var json = {
              "name": "fixture-package"
            , "description": "A test package for ender functional tests."
            , "version": "0.1.0"
            , "authors": [ "John Doe <john@example.com>" ]
            , "dependencies": {}
            , "private": true
          }

      Object.keys(properties).forEach(function (key) {
        json[key] = properties[key]
      })

      return JSON.stringify(json);
    }

module.exports = {
    enderpath: enderpath
  , fixturePackageJSON: fixturePackageJSON
  , runEnder: runEnder
  , verifyNodeModulesDirectories: verifyNodeModulesDirectories
}
